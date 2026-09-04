import type { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from 'mysql2/promise'
import {
  DISCORD_SETTINGS_ID,
  discordBotSettingsSchema,
  discordJobStatusSchema,
  discordJobTypeSchema,
  editableDiscordBotSettingsSchema,
  parseJsonObject,
  type DiscordBotSettings,
  type DiscordJob,
  type DiscordJobPayload,
  type DiscordRuntimeState,
  type EditableDiscordBotSettings,
} from '../services/discord-schema'
import type { DiscordGameServer } from '../services/discord-status'

interface SettingsRow extends RowDataPacket {
  enabled: number | boolean
  publishing_enabled: number | boolean
  guild_id: string | null
  status_channel_id: string | null
  update_interval_seconds: number
  embed_heading: string
  embed_accent_color: number
  content_text: string
  show_player_names: number | boolean
  revision: number
  updated_at: Date | string
  updated_by: string
}

interface ServerRow extends RowDataPacket {
  id: string
  display_name: string
  host: string
  port: number
  location: string
  connect_url: string
  display_order: number
}

interface JobRow extends RowDataPacket {
  id: number
  job_type: string
  status: string
  payload: unknown
  result: unknown
  attempts: number
  max_attempts: number
  available_at: Date | string
  locked_at: Date | string | null
  lock_owner: string | null
  completed_at: Date | string | null
  error_category: string | null
  error_message: string | null
  created_at: Date | string
  created_by: string
}

interface RuntimeRow extends RowDataPacket {
  worker_id: string | null
  connection_state: string
  token_configured: number | boolean
  bot_user_id: string | null
  bot_user_tag: string | null
  heartbeat_at: Date | string | null
  loaded_revision: number | null
  commands_registered: number | boolean
  commands_registered_at: Date | string | null
  last_validation_at: Date | string | null
  last_validation_result: unknown
  last_publish_at: Date | string | null
  last_error_at: Date | string | null
  last_error_category: string | null
  last_error_message: string | null
  started_at: Date | string | null
  stopped_at: Date | string | null
}

interface MessageRow extends RowDataPacket {
  server_id: string
  channel_id: string
  message_id: string
  content_hash: string
  published_at: Date | string
}

export interface DiscordStatusMessageRecord {
  serverId: string
  channelId: string
  messageId: string
  contentHash: string
  publishedAt: Date
}

export type DiscordJobCounts = Record<'queued' | 'running' | 'completed' | 'failed', number>

export interface RuntimeUpdate {
  workerId?: string | null
  connectionState?: DiscordRuntimeState['connectionState']
  tokenConfigured?: boolean
  botUserId?: string | null
  botUserTag?: string | null
  heartbeatAt?: Date | null
  loadedRevision?: number | null
  commandsRegistered?: boolean
  commandsRegisteredAt?: Date | null
  lastValidationAt?: Date | null
  lastValidationResult?: Record<string, unknown> | null
  lastPublishAt?: Date | null
  lastErrorAt?: Date | null
  lastErrorCategory?: string | null
  lastErrorMessage?: string | null
  startedAt?: Date | null
  stoppedAt?: Date | null
}

function date(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value)
}

function nullableDate(value: Date | string | null): Date | null {
  return value === null ? null : date(value)
}

function mapSettings(row: SettingsRow): DiscordBotSettings {
  return discordBotSettingsSchema.parse({
    enabled: Boolean(row.enabled),
    publishingEnabled: Boolean(row.publishing_enabled),
    guildId: row.guild_id,
    statusChannelId: row.status_channel_id,
    updateIntervalSeconds: Number(row.update_interval_seconds),
    embedHeading: row.embed_heading,
    embedAccentColor: Number(row.embed_accent_color),
    contentText: row.content_text,
    showPlayerNames: Boolean(row.show_player_names),
    revision: Number(row.revision),
    updatedAt: date(row.updated_at),
    updatedBy: row.updated_by,
  })
}

function mapJob(row: JobRow): DiscordJob {
  return {
    id: Number(row.id),
    jobType: discordJobTypeSchema.parse(row.job_type),
    status: discordJobStatusSchema.parse(row.status),
    payload: parseJsonObject(row.payload),
    result: row.result === null ? null : parseJsonObject(row.result),
    attempts: Number(row.attempts),
    maxAttempts: Number(row.max_attempts),
    availableAt: date(row.available_at),
    lockedAt: nullableDate(row.locked_at),
    lockOwner: row.lock_owner,
    completedAt: nullableDate(row.completed_at),
    errorCategory: row.error_category,
    errorMessage: row.error_message,
    createdAt: date(row.created_at),
    createdBy: row.created_by,
  }
}

function mapRuntime(row: RuntimeRow): DiscordRuntimeState {
  const allowedStates = new Set<DiscordRuntimeState['connectionState']>([
    'starting', 'disabled', 'connecting', 'connected', 'degraded', 'stopping', 'stopped',
  ])
  const connectionState = allowedStates.has(row.connection_state as DiscordRuntimeState['connectionState'])
    ? row.connection_state as DiscordRuntimeState['connectionState']
    : 'degraded'

  return {
    workerId: row.worker_id,
    connectionState,
    tokenConfigured: Boolean(row.token_configured),
    botUserId: row.bot_user_id,
    botUserTag: row.bot_user_tag,
    heartbeatAt: nullableDate(row.heartbeat_at),
    loadedRevision: row.loaded_revision === null ? null : Number(row.loaded_revision),
    commandsRegistered: Boolean(row.commands_registered),
    commandsRegisteredAt: nullableDate(row.commands_registered_at),
    lastValidationAt: nullableDate(row.last_validation_at),
    lastValidationResult: row.last_validation_result === null ? null : parseJsonObject(row.last_validation_result),
    lastPublishAt: nullableDate(row.last_publish_at),
    lastErrorAt: nullableDate(row.last_error_at),
    lastErrorCategory: row.last_error_category,
    lastErrorMessage: row.last_error_message,
    startedAt: nullableDate(row.started_at),
    stoppedAt: nullableDate(row.stopped_at),
  }
}

export class DiscordRepository {
  constructor(private readonly pool: Pool) {}

  async getSettings(): Promise<DiscordBotSettings> {
    const [rows] = await this.pool.execute<SettingsRow[]>(
      `SELECT enabled, publishing_enabled, guild_id, status_channel_id,
              update_interval_seconds, embed_heading, embed_accent_color,
              content_text, show_player_names, revision, updated_at, updated_by
       FROM discord_bot_settings WHERE id = ?`,
      [DISCORD_SETTINGS_ID],
    )
    if (!rows[0]) throw new Error('Discord bot settings are not initialized; run database migrations')
    return mapSettings(rows[0])
  }

  async updateSettings(
    input: EditableDiscordBotSettings,
    expectedRevision: number,
    updatedBy: string,
  ): Promise<DiscordBotSettings> {
    const settings = editableDiscordBotSettingsSchema.parse(input)
    const connection = await this.pool.getConnection()
    try {
      await connection.beginTransaction()
      const [result] = await connection.execute<ResultSetHeader>(
        `UPDATE discord_bot_settings
         SET enabled = ?, publishing_enabled = ?, guild_id = ?, status_channel_id = ?,
             update_interval_seconds = ?, embed_heading = ?, embed_accent_color = ?,
             content_text = ?, show_player_names = ?, revision = revision + 1, updated_by = ?
         WHERE id = ? AND revision = ?`,
        [
          settings.enabled,
          settings.publishingEnabled,
          settings.guildId,
          settings.statusChannelId,
          settings.updateIntervalSeconds,
          settings.embedHeading,
          settings.embedAccentColor,
          settings.contentText,
          settings.showPlayerNames,
          updatedBy.slice(0, 128),
          DISCORD_SETTINGS_ID,
          expectedRevision,
        ],
      )
      if (result.affectedRows !== 1) {
        const error = new Error('Discord bot settings changed since they were loaded')
        error.name = 'RevisionConflictError'
        throw error
      }

      const [rows] = await connection.execute<SettingsRow[]>(
        `SELECT enabled, publishing_enabled, guild_id, status_channel_id,
                update_interval_seconds, embed_heading, embed_accent_color,
                content_text, show_player_names, revision, updated_at, updated_by
         FROM discord_bot_settings WHERE id = ?`,
        [DISCORD_SETTINGS_ID],
      )
      if (!rows[0]) throw new Error('Discord bot settings disappeared during update')
      await connection.commit()
      return mapSettings(rows[0])
    } catch (error) {
      await this.safeRollback(connection)
      throw error
    } finally {
      connection.release()
    }
  }

  async listPublishableServers(serverId?: string): Promise<DiscordGameServer[]> {
    const params: Array<string> = []
    const serverFilter = serverId ? ' AND id = ?' : ''
    if (serverId) params.push(serverId)
    const [rows] = await this.pool.execute<ServerRow[]>(
      `SELECT id, display_name, host, port, location, connect_url, display_order
       FROM game_servers
       WHERE enabled = TRUE AND coming_soon = FALSE AND discord_publish_enabled = TRUE${serverFilter}
       ORDER BY display_order ASC, id ASC`,
      params,
    )
    return rows.map(row => ({
      id: row.id,
      displayName: row.display_name,
      host: row.host,
      port: Number(row.port),
      location: row.location,
      connectUrl: row.connect_url,
      displayOrder: Number(row.display_order),
    }))
  }

  async enqueueJob(payload: DiscordJobPayload, createdBy: string, maxAttempts = 3): Promise<number> {
    const { jobType, ...jobPayload } = payload
    const [result] = await this.pool.execute<ResultSetHeader>(
      `INSERT INTO discord_bot_jobs (job_type, payload, max_attempts, created_by)
       VALUES (?, ?, ?, ?)`,
      [jobType, JSON.stringify(jobPayload), Math.max(1, Math.min(10, maxAttempts)), createdBy.slice(0, 128)],
    )
    return Number(result.insertId)
  }

  async listRecentJobs(limit = 25): Promise<DiscordJob[]> {
    const safeLimit = Math.max(1, Math.min(100, Math.trunc(limit)))
    const [rows] = await this.pool.query<JobRow[]>(
      `SELECT id, job_type, status, payload, result, attempts, max_attempts,
              available_at, locked_at, lock_owner, completed_at,
              error_category, error_message, created_at, created_by
       FROM discord_bot_jobs ORDER BY id DESC LIMIT ${safeLimit}`,
    )
    return rows.map(mapJob)
  }

  async getJobCounts(): Promise<DiscordJobCounts> {
    const [rows] = await this.pool.query<Array<RowDataPacket & { status: string, count: number }>>(
      `SELECT status, COUNT(*) AS count
       FROM discord_bot_jobs GROUP BY status`,
    )
    const counts: DiscordJobCounts = { queued: 0, running: 0, completed: 0, failed: 0 }
    for (const row of rows) {
      const parsed = discordJobStatusSchema.safeParse(row.status)
      if (parsed.success) counts[parsed.data] = Number(row.count)
    }
    return counts
  }

  async claimNextJob(workerId: string, lockTimeoutSeconds = 120): Promise<DiscordJob | null> {
    const connection = await this.pool.getConnection()
    try {
      await connection.beginTransaction()
      await connection.execute(
        `UPDATE discord_bot_jobs
         SET status = 'failed', completed_at = CURRENT_TIMESTAMP(6),
             locked_at = NULL, lock_owner = NULL,
             error_category = 'worker_lease_expired',
             error_message = 'Worker lease expired after the final allowed attempt'
         WHERE status = 'running' AND attempts >= max_attempts
           AND locked_at < DATE_SUB(CURRENT_TIMESTAMP(6), INTERVAL ? SECOND)`,
        [Math.max(30, Math.trunc(lockTimeoutSeconds))],
      )
      const [rows] = await connection.execute<JobRow[]>(
        `SELECT id, job_type, status, payload, result, attempts, max_attempts,
                available_at, locked_at, lock_owner, completed_at,
                error_category, error_message, created_at, created_by
         FROM discord_bot_jobs
         WHERE attempts < max_attempts
           AND (
             (status = 'queued' AND available_at <= CURRENT_TIMESTAMP(6))
             OR (status = 'running' AND locked_at < DATE_SUB(CURRENT_TIMESTAMP(6), INTERVAL ? SECOND))
           )
         ORDER BY available_at ASC, id ASC
         LIMIT 1 FOR UPDATE`,
        [Math.max(30, Math.trunc(lockTimeoutSeconds))],
      )

      const row = rows[0]
      if (!row) {
        await connection.commit()
        return null
      }

      await connection.execute(
        `UPDATE discord_bot_jobs
         SET status = 'running', attempts = attempts + 1, locked_at = CURRENT_TIMESTAMP(6),
             lock_owner = ?, error_category = NULL, error_message = NULL
         WHERE id = ?`,
        [workerId.slice(0, 160), row.id],
      )
      await connection.commit()
      row.status = 'running'
      row.attempts = Number(row.attempts) + 1
      row.lock_owner = workerId.slice(0, 160)
      row.locked_at = new Date()
      return mapJob(row)
    } catch (error) {
      await this.safeRollback(connection)
      throw error
    } finally {
      connection.release()
    }
  }

  async completeJob(jobId: number, workerId: string, result: Record<string, unknown>): Promise<boolean> {
    const [update] = await this.pool.execute<ResultSetHeader>(
      `UPDATE discord_bot_jobs
       SET status = 'completed', result = ?, completed_at = CURRENT_TIMESTAMP(6),
           locked_at = NULL, lock_owner = NULL
       WHERE id = ? AND status = 'running' AND lock_owner = ?`,
      [JSON.stringify(result), jobId, workerId.slice(0, 160)],
    )
    return update.affectedRows === 1
  }

  async retryOrFailJob(
    job: DiscordJob,
    workerId: string,
    error: { category: string, message: string },
    retryDelaySeconds: number,
  ): Promise<boolean> {
    const shouldFail = job.attempts >= job.maxAttempts
    const [update] = await this.pool.execute<ResultSetHeader>(
      `UPDATE discord_bot_jobs
       SET status = ?, available_at = DATE_ADD(CURRENT_TIMESTAMP(6), INTERVAL ? SECOND),
           completed_at = ?, locked_at = NULL, lock_owner = NULL,
           error_category = ?, error_message = ?
       WHERE id = ? AND status = 'running' AND lock_owner = ?`,
      [
        shouldFail ? 'failed' : 'queued',
        Math.max(1, Math.trunc(retryDelaySeconds)),
        shouldFail ? new Date() : null,
        error.category.slice(0, 64),
        error.message.slice(0, 500),
        job.id,
        workerId.slice(0, 160),
      ],
    )
    return update.affectedRows === 1
  }

  async getRuntime(): Promise<DiscordRuntimeState> {
    const [rows] = await this.pool.execute<RuntimeRow[]>(
      `SELECT worker_id, connection_state, token_configured, bot_user_id, bot_user_tag, heartbeat_at,
              loaded_revision, commands_registered, commands_registered_at,
              last_validation_at, last_validation_result, last_publish_at,
              last_error_at, last_error_category, last_error_message, started_at, stopped_at
       FROM discord_bot_runtime WHERE id = 1`,
    )
    if (!rows[0]) throw new Error('Discord bot runtime is not initialized; run database migrations')
    return mapRuntime(rows[0])
  }

  async updateRuntime(update: RuntimeUpdate): Promise<void> {
    const columns: Record<keyof RuntimeUpdate, string> = {
      workerId: 'worker_id',
      connectionState: 'connection_state',
      tokenConfigured: 'token_configured',
      botUserId: 'bot_user_id',
      botUserTag: 'bot_user_tag',
      heartbeatAt: 'heartbeat_at',
      loadedRevision: 'loaded_revision',
      commandsRegistered: 'commands_registered',
      commandsRegisteredAt: 'commands_registered_at',
      lastValidationAt: 'last_validation_at',
      lastValidationResult: 'last_validation_result',
      lastPublishAt: 'last_publish_at',
      lastErrorAt: 'last_error_at',
      lastErrorCategory: 'last_error_category',
      lastErrorMessage: 'last_error_message',
      startedAt: 'started_at',
      stoppedAt: 'stopped_at',
    }

    const assignments: string[] = []
    const values: Array<string | number | boolean | Date | null> = []
    for (const [key, value] of Object.entries(update) as Array<[keyof RuntimeUpdate, RuntimeUpdate[keyof RuntimeUpdate]]>) {
      assignments.push(`${columns[key]} = ?`)
      if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
        values.push(JSON.stringify(value))
      } else {
        values.push(value ?? null)
      }
    }
    if (assignments.length === 0) return

    await this.pool.execute(
      `UPDATE discord_bot_runtime SET ${assignments.join(', ')} WHERE id = 1`,
      values,
    )
  }

  async getStatusMessage(serverId: string): Promise<DiscordStatusMessageRecord | null> {
    const [rows] = await this.pool.execute<MessageRow[]>(
      `SELECT server_id, channel_id, message_id, content_hash, published_at
       FROM discord_status_messages WHERE server_id = ?`,
      [serverId],
    )
    const row = rows[0]
    return row ? {
      serverId: row.server_id,
      channelId: row.channel_id,
      messageId: row.message_id,
      contentHash: row.content_hash,
      publishedAt: date(row.published_at),
    } : null
  }

  async listStatusMessages(): Promise<DiscordStatusMessageRecord[]> {
    const [rows] = await this.pool.query<MessageRow[]>(
      `SELECT server_id, channel_id, message_id, content_hash, published_at
       FROM discord_status_messages ORDER BY server_id ASC`,
    )
    return rows.map(row => ({
      serverId: row.server_id,
      channelId: row.channel_id,
      messageId: row.message_id,
      contentHash: row.content_hash,
      publishedAt: date(row.published_at),
    }))
  }

  async saveStatusMessage(record: Omit<DiscordStatusMessageRecord, 'publishedAt'>): Promise<void> {
    await this.pool.execute(
      `INSERT INTO discord_status_messages (server_id, channel_id, message_id, content_hash)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE channel_id = VALUES(channel_id), message_id = VALUES(message_id),
         content_hash = VALUES(content_hash), published_at = CURRENT_TIMESTAMP(6)`,
      [record.serverId, record.channelId, record.messageId, record.contentHash],
    )
  }

  async deleteStatusMessage(serverId: string, messageId?: string): Promise<void> {
    const messageFilter = messageId ? ' AND message_id = ?' : ''
    const params = messageId ? [serverId, messageId] : [serverId]
    await this.pool.execute(
      `DELETE FROM discord_status_messages WHERE server_id = ?${messageFilter}`,
      params,
    )
  }

  private async safeRollback(connection: PoolConnection): Promise<void> {
    try {
      await connection.rollback()
    } catch {
      // Preserve the original failure; the pool discards unusable connections.
    }
  }
}
