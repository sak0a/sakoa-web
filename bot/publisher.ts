import {
  ChannelType,
  PermissionFlagsBits,
  type Client,
  type Message,
  type TextChannel,
} from 'discord.js'
import { DiscordRepository } from '../server/repositories/discord'
import {
  buildDiscordStatusMessage,
  discordStatusContentHash,
  managedStatusMarker,
  type DiscordGameServer,
  type DiscordStatusMessage,
} from '../server/services/discord-status'
import type { DiscordBotSettings } from '../server/services/discord-schema'
import { queryServerStatus } from './status-query'

export interface DiscordTargetValidation {
  [key: string]: unknown
  valid: boolean
  guildFound: boolean
  channelFound: boolean
  channelTypeValid: boolean
  permissions: {
    viewChannel: boolean
    sendMessages: boolean
    embedLinks: boolean
    readMessageHistory: boolean
  }
}

export interface PublishResult {
  [key: string]: unknown
  published: number
  created: number
  updated: number
  unchanged: number
  serverIds: string[]
}

function isUnknownMessageError(error: unknown): boolean {
  const candidate = error as { code?: number | string }
  return Number(candidate?.code) === 10008
}

export class DiscordStatusPublisher {
  private publicationQueue: Promise<void> = Promise.resolve()

  constructor(
    private readonly client: Client,
    private readonly repository: DiscordRepository,
  ) {}

  async validateTarget(settings: DiscordBotSettings): Promise<DiscordTargetValidation> {
    const emptyPermissions = {
      viewChannel: false,
      sendMessages: false,
      embedLinks: false,
      readMessageHistory: false,
    }
    if (!settings.guildId || !settings.statusChannelId) {
      return {
        valid: false,
        guildFound: false,
        channelFound: false,
        channelTypeValid: false,
        permissions: emptyPermissions,
      }
    }

    const guild = await this.client.guilds.fetch(settings.guildId).catch(() => null)
    if (!guild) {
      return {
        valid: false,
        guildFound: false,
        channelFound: false,
        channelTypeValid: false,
        permissions: emptyPermissions,
      }
    }

    const channel = await guild.channels.fetch(settings.statusChannelId).catch(() => null)
    if (!channel) {
      return {
        valid: false,
        guildFound: true,
        channelFound: false,
        channelTypeValid: false,
        permissions: emptyPermissions,
      }
    }

    const channelTypeValid = channel.type === ChannelType.GuildText
    const member = guild.members.me ?? await guild.members.fetchMe().catch(() => null)
    const permissions = member ? channel.permissionsFor(member) : null
    const result = {
      valid: false,
      guildFound: true,
      channelFound: true,
      channelTypeValid,
      permissions: {
        viewChannel: permissions?.has(PermissionFlagsBits.ViewChannel) ?? false,
        sendMessages: permissions?.has(PermissionFlagsBits.SendMessages) ?? false,
        embedLinks: permissions?.has(PermissionFlagsBits.EmbedLinks) ?? false,
        readMessageHistory: permissions?.has(PermissionFlagsBits.ReadMessageHistory) ?? false,
      },
    }
    result.valid = channelTypeValid && Object.values(result.permissions).every(Boolean)
    return result
  }

  async publishAll(settings: DiscordBotSettings): Promise<PublishResult> {
    return this.runExclusive(async () => {
      const servers = await this.repository.listPublishableServers()
      return this.publishServers(settings, servers)
    })
  }

  async publishOne(settings: DiscordBotSettings, serverId: string): Promise<PublishResult> {
    return this.runExclusive(async () => {
      const servers = await this.repository.listPublishableServers(serverId)
      if (servers.length === 0) throw new Error(`No publishable game server found for ID ${serverId}`)
      return this.publishServers(settings, servers)
    })
  }

  async buildOnDemandMessages(settings: DiscordBotSettings, serverId?: string): Promise<DiscordStatusMessage[]> {
    const servers = await this.repository.listPublishableServers(serverId)
    if (serverId && servers.length === 0) throw new Error(`No publishable game server found for ID ${serverId}`)
    const selected = servers.slice(0, 10)
    return Promise.all(selected.map(async server => (
      buildDiscordStatusMessage(server, await queryServerStatus(server), settings)
    )))
  }

  private async publishServers(
    settings: DiscordBotSettings,
    servers: DiscordGameServer[],
  ): Promise<PublishResult> {
    if (!settings.statusChannelId) throw new Error('Discord status channel is not configured')
    const channel = await this.getTextChannel(settings)
    const result: PublishResult = {
      published: 0,
      created: 0,
      updated: 0,
      unchanged: 0,
      serverIds: [],
    }

    for (const server of servers) {
      const message = buildDiscordStatusMessage(server, await queryServerStatus(server), settings)
      const hash = discordStatusContentHash(message)
      const stored = await this.repository.getStatusMessage(server.id)

      let target: Message | null = null
      if (stored?.channelId === channel.id) {
        try {
          target = await channel.messages.fetch(stored.messageId)
          if (target.author.id !== this.client.user?.id) {
            target = null
            await this.repository.deleteStatusMessage(server.id, stored.messageId)
          }
        } catch (error) {
          if (!isUnknownMessageError(error)) throw error
          await this.repository.deleteStatusMessage(server.id, stored.messageId)
        }
      }

      if (!target) target = await this.findOwnedMessage(channel, server.id)

      if (target) {
        if (stored?.messageId === target.id && stored.contentHash === hash) {
          result.unchanged += 1
        } else {
          await target.edit(message)
          result.updated += 1
        }
      } else {
        target = await channel.send(message)
        result.created += 1
      }

      await this.repository.saveStatusMessage({
        serverId: server.id,
        channelId: channel.id,
        messageId: target.id,
        contentHash: hash,
      })
      result.published += 1
      result.serverIds.push(server.id)
    }

    return result
  }

  private async getTextChannel(settings: DiscordBotSettings): Promise<TextChannel> {
    if (!settings.guildId || !settings.statusChannelId) {
      throw new Error('Discord guild and status channel must be configured')
    }
    const guild = await this.client.guilds.fetch(settings.guildId)
    const channel = await guild.channels.fetch(settings.statusChannelId)
    if (!channel || channel.type !== ChannelType.GuildText) {
      throw new Error('Configured Discord status channel is not a guild text channel')
    }

    const validation = await this.validateTarget(settings)
    if (!validation.valid) throw new Error('Discord bot lacks required status-channel permissions')
    return channel
  }

  private async findOwnedMessage(channel: TextChannel, serverId: string): Promise<Message | null> {
    const marker = managedStatusMarker(serverId)
    const messages = await channel.messages.fetch({ limit: 100 })
    return messages.find(message => (
      message.author.id === this.client.user?.id
      && message.embeds.some(embed => embed.footer?.text === marker)
    )) ?? null
  }

  private async runExclusive<T>(task: () => Promise<T>): Promise<T> {
    const previous = this.publicationQueue
    let release: () => void = () => undefined
    this.publicationQueue = new Promise<void>(resolve => { release = resolve })
    await previous
    try {
      return await task()
    } finally {
      release()
    }
  }
}
