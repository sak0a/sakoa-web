import { hostname } from 'node:os'
import { randomUUID } from 'node:crypto'
import {
  Client,
  Events,
  GatewayIntentBits,
  MessageFlags,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
} from 'discord.js'
import type { Pool } from 'mysql2/promise'
import { DiscordRepository } from '../server/repositories/discord'
import {
  discordJobPayloadSchema,
  gameServerIdSchema,
  sanitizeDiscordError,
  type DiscordBotSettings,
  type DiscordJob,
} from '../server/services/discord-schema'
import { registerGuildCommands } from './commands'
import type { WorkerConfig } from './config'
import { logger } from './logger'
import { DiscordStatusPublisher } from './publisher'

export class DiscordWorker {
  private readonly repository: DiscordRepository
  private readonly workerId: string
  private client: Client | null = null
  private publisher: DiscordStatusPublisher | null = null
  private settings: DiscordBotSettings | null = null
  private intervals: NodeJS.Timeout[] = []
  private stopping = false
  private connecting = false
  private controlBusy = false
  private jobBusy = false
  private schedulerBusy = false
  private lastScheduledPublishAt = 0
  private connectionFailures = 0
  private nextConnectionAttemptAt = 0
  private tokenErrorRecorded = false

  constructor(
    private readonly pool: Pool,
    private readonly config: WorkerConfig,
  ) {
    this.repository = new DiscordRepository(pool)
    this.workerId = config.instanceId
      ? `${config.instanceId}:${process.pid}:${randomUUID().slice(0, 8)}`
      : `${hostname()}:${process.pid}:${randomUUID().slice(0, 8)}`
  }

  async start(): Promise<void> {
    await this.pool.query('SELECT 1')
    this.settings = await this.repository.getSettings()
    await this.repository.updateRuntime({
      workerId: this.workerId,
      connectionState: 'starting',
      tokenConfigured: Boolean(this.config.discordToken),
      heartbeatAt: new Date(),
      loadedRevision: this.settings.revision,
      startedAt: new Date(),
      stoppedAt: null,
      lastErrorAt: null,
      lastErrorCategory: null,
      lastErrorMessage: null,
    })

    await this.controlTick()
    this.intervals.push(
      setInterval(() => void this.controlTick(), this.config.configPollMilliseconds),
      setInterval(() => void this.heartbeatTick(), this.config.heartbeatMilliseconds),
      setInterval(() => void this.jobTick(), this.config.jobPollMilliseconds),
      setInterval(() => void this.scheduleTick(), 5000),
    )
    logger.info('worker_started', { workerId: this.workerId, enabled: this.settings.enabled })
  }

  async stop(signal = 'shutdown'): Promise<void> {
    if (this.stopping) return
    this.stopping = true
    logger.info('worker_stopping', { signal })
    for (const interval of this.intervals) clearInterval(interval)
    this.intervals = []

    await this.repository.updateRuntime({
      connectionState: 'stopping',
      heartbeatAt: new Date(),
    }).catch(() => undefined)
    this.client?.destroy()
    this.client = null
    this.publisher = null
    await this.repository.updateRuntime({
      connectionState: 'stopped',
      heartbeatAt: new Date(),
      stoppedAt: new Date(),
    }).catch(() => undefined)
    await this.pool.end()
    logger.info('worker_stopped', { signal })
  }

  private async controlTick(): Promise<void> {
    if (this.stopping || this.controlBusy) return
    this.controlBusy = true
    try {
      const settings = await this.repository.getSettings()
      const changed = this.settings?.revision !== settings.revision
      this.settings = settings
      if (changed) {
        logger.info('settings_reloaded', { revision: settings.revision })
        await this.repository.updateRuntime({ loadedRevision: settings.revision })
      }

      if (settings.enabled) {
        await this.ensureConnected()
      } else {
        await this.disableClient()
      }
    } catch (error) {
      await this.recordError('control_tick_failed', error)
    } finally {
      this.controlBusy = false
    }
  }

  private async ensureConnected(): Promise<void> {
    const token = this.config.discordToken
    if (!token) {
      if (!this.tokenErrorRecorded) {
        this.tokenErrorRecorded = true
        await this.recordError('discord_token_missing', new Error('DISCORD_TOKEN is not configured'))
      }
      return
    }
    if (
      this.client?.isReady()
      || this.connecting
      || this.stopping
      || Date.now() < this.nextConnectionAttemptAt
    ) return
    this.connecting = true
    const client = new Client({ intents: [GatewayIntentBits.Guilds] })
    this.client = client
    this.publisher = new DiscordStatusPublisher(client, this.repository)
    client.once(Events.ClientReady, readyClient => {
      void this.onReady(readyClient).catch(error => this.recordError('ready_handler_failed', error))
    })
    client.on(Events.InteractionCreate, interaction => {
      if (interaction.isChatInputCommand()) void this.handleCommand(interaction)
    })
    client.on(Events.Error, error => void this.recordError('discord_client_error', error))
    client.on(Events.Warn, warning => logger.warn('discord_client_warning', { message: warning.slice(0, 500) }))

    try {
      await this.repository.updateRuntime({ connectionState: 'connecting', heartbeatAt: new Date() })
      await client.login(token)
    } catch (error) {
      this.connectionFailures += 1
      const delayMilliseconds = Math.min(300_000, 5000 * (2 ** Math.min(6, this.connectionFailures - 1)))
      this.nextConnectionAttemptAt = Date.now() + delayMilliseconds
      client.destroy()
      if (this.client === client) {
        this.client = null
        this.publisher = null
      }
      await this.recordError('discord_login_failed', error)
    } finally {
      this.connecting = false
    }
  }

  private async disableClient(): Promise<void> {
    if (this.client) this.client.destroy()
    this.client = null
    this.publisher = null
    await this.repository.updateRuntime({
      connectionState: 'disabled',
      botUserId: null,
      botUserTag: null,
      heartbeatAt: new Date(),
    })
  }

  private async onReady(client: Client<true>): Promise<void> {
    this.connectionFailures = 0
    this.nextConnectionAttemptAt = 0
    logger.info('discord_connected', { botUserId: client.user.id, botUserTag: client.user.tag })
    await this.repository.updateRuntime({
      connectionState: 'connected',
      botUserId: client.user.id,
      botUserTag: client.user.tag,
      heartbeatAt: new Date(),
    })

    const settings = this.settings
    if (!settings?.guildId) return
    try {
      await registerGuildCommands(client, settings.guildId)
      await this.repository.updateRuntime({
        commandsRegistered: true,
        commandsRegisteredAt: new Date(),
      })
      logger.info('commands_registered', { guildId: settings.guildId })
    } catch (error) {
      await this.repository.updateRuntime({ commandsRegistered: false })
      await this.recordError('command_registration_failed', error)
    }
  }

  private async heartbeatTick(): Promise<void> {
    if (this.stopping) return
    try {
      await this.repository.updateRuntime({
        heartbeatAt: new Date(),
        workerId: this.workerId,
        connectionState: this.settings?.enabled
          ? (this.client?.isReady() ? 'connected' : 'degraded')
          : 'disabled',
      })
    } catch (error) {
      logger.error('heartbeat_failed', { error })
    }
  }

  private async scheduleTick(): Promise<void> {
    const settings = this.settings
    const publisher = this.publisher
    if (
      this.stopping
      || this.schedulerBusy
      || !settings?.enabled
      || !settings.publishingEnabled
      || !this.client?.isReady()
      || !publisher
    ) return

    const intervalMilliseconds = settings.updateIntervalSeconds * 1000
    if (Date.now() - this.lastScheduledPublishAt < intervalMilliseconds) return
    this.schedulerBusy = true
    this.lastScheduledPublishAt = Date.now()
    try {
      const result = await publisher.publishAll(settings)
      await this.repository.updateRuntime({
        lastPublishAt: new Date(),
        lastErrorAt: null,
        lastErrorCategory: null,
        lastErrorMessage: null,
      })
      logger.info('scheduled_publish_completed', result)
    } catch (error) {
      await this.recordError('scheduled_publish_failed', error)
    } finally {
      this.schedulerBusy = false
    }
  }

  private async jobTick(): Promise<void> {
    if (this.stopping || this.jobBusy || !this.client?.isReady() || !this.settings || !this.publisher) return
    this.jobBusy = true
    let job: DiscordJob | null = null
    try {
      job = await this.repository.claimNextJob(this.workerId, this.config.jobLockSeconds)
      if (!job) return
      const result = await this.executeJob(job)
      await this.repository.completeJob(job.id, this.workerId, result)
      logger.info('job_completed', { jobId: job.id, jobType: job.jobType })
    } catch (error) {
      const sanitized = sanitizeDiscordError(error)
      if (job) {
        const retryDelay = Math.min(300, 5 * (2 ** Math.max(0, job.attempts - 1)))
        await this.repository.retryOrFailJob(job, this.workerId, sanitized, retryDelay).catch(() => undefined)
      }
      await this.recordError('job_failed', error, job ? { jobId: job.id, jobType: job.jobType } : {})
    } finally {
      this.jobBusy = false
    }
  }

  private async executeJob(job: DiscordJob): Promise<Record<string, unknown>> {
    if (!this.client?.isReady() || !this.publisher || !this.settings) throw new Error('Discord client is not ready')
    const payload = discordJobPayloadSchema.parse({ ...job.payload, jobType: job.jobType })
    switch (payload.jobType) {
      case 'validate_config': {
        const validation = await this.publisher.validateTarget(this.settings)
        await this.repository.updateRuntime({
          lastValidationAt: new Date(),
          lastValidationResult: validation,
        })
        return validation
      }
      case 'publish_all': {
        if (!this.settings.publishingEnabled) throw new Error('Discord status publishing is disabled')
        const result = await this.publisher.publishAll(this.settings)
        await this.repository.updateRuntime({ lastPublishAt: new Date() })
        return result
      }
      case 'publish_one': {
        if (!this.settings.publishingEnabled) throw new Error('Discord status publishing is disabled')
        const result = await this.publisher.publishOne(this.settings, payload.serverId)
        await this.repository.updateRuntime({ lastPublishAt: new Date() })
        return result
      }
      case 'register_commands': {
        if (!this.settings.guildId) throw new Error('Discord guild is not configured')
        await registerGuildCommands(this.client, this.settings.guildId)
        await this.repository.updateRuntime({
          commandsRegistered: true,
          commandsRegisteredAt: new Date(),
        })
        return { registered: true, guildId: this.settings.guildId }
      }
    }
  }

  private async handleCommand(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
      if (!this.settings || !this.publisher) throw new Error('Discord worker is not ready')
      if (interaction.guildId !== this.settings.guildId) {
        await interaction.reply({ content: 'This command is not configured for this server.', flags: MessageFlags.Ephemeral })
        return
      }

      const rawServerId = interaction.options.getString('server') ?? undefined
      const serverId = rawServerId ? gameServerIdSchema.parse(rawServerId) : undefined
      if (interaction.commandName === 'server-status') {
        await interaction.deferReply()
        const messages = await this.publisher.buildOnDemandMessages(this.settings, serverId)
        if (messages.length === 0) {
          await interaction.editReply({ content: 'No publishable TF2 servers are configured.' })
          return
        }
        await interaction.editReply({
          content: messages[0]?.content || undefined,
          embeds: messages.flatMap(message => message.embeds),
          allowedMentions: { parse: [] },
        })
        return
      }

      if (interaction.commandName === 'refresh-server-status') {
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
          await interaction.reply({ content: 'Administrator permission is required.', flags: MessageFlags.Ephemeral })
          return
        }
        if (!this.settings.publishingEnabled) {
          await interaction.reply({ content: 'Status publishing is disabled.', flags: MessageFlags.Ephemeral })
          return
        }
        await interaction.deferReply({ flags: MessageFlags.Ephemeral })
        const result = serverId
          ? await this.publisher.publishOne(this.settings, serverId)
          : await this.publisher.publishAll(this.settings)
        await this.repository.updateRuntime({ lastPublishAt: new Date() })
        await interaction.editReply(`Refreshed ${result.serverIds.length} server status message(s).`)
      }
    } catch (error) {
      const sanitized = sanitizeDiscordError(error)
      const response = `Could not complete the command: ${sanitized.message}`
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: response, embeds: [], allowedMentions: { parse: [] } }).catch(() => undefined)
      } else {
        await interaction.reply({
          content: response,
          flags: MessageFlags.Ephemeral,
          allowedMentions: { parse: [] },
        }).catch(() => undefined)
      }
      await this.recordError('interaction_failed', error, { commandName: interaction.commandName })
    }
  }

  private async recordError(
    event: string,
    error: unknown,
    metadata: Record<string, unknown> = {},
  ): Promise<void> {
    const sanitized = sanitizeDiscordError(error)
    logger.error(event, { ...metadata, category: sanitized.category, message: sanitized.message })
    await this.repository.updateRuntime({
      connectionState: 'degraded',
      lastErrorAt: new Date(),
      lastErrorCategory: sanitized.category,
      lastErrorMessage: sanitized.message,
    }).catch(() => undefined)
  }
}
