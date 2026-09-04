import { z } from 'zod'

export const DISCORD_SETTINGS_ID = 1 as const
export const MIN_UPDATE_INTERVAL_SECONDS = 30
export const MAX_UPDATE_INTERVAL_SECONDS = 3600

const snowflakeSchema = z.string()
  .trim()
  .regex(/^\d{17,20}$/, 'Must be a valid Discord snowflake')

export const discordBotSettingsSchema = z.object({
  enabled: z.boolean(),
  publishingEnabled: z.boolean(),
  guildId: snowflakeSchema.nullable(),
  statusChannelId: snowflakeSchema.nullable(),
  updateIntervalSeconds: z.number().int()
    .min(MIN_UPDATE_INTERVAL_SECONDS)
    .max(MAX_UPDATE_INTERVAL_SECONDS),
  embedHeading: z.string().trim().min(1).max(256),
  embedAccentColor: z.number().int().min(0).max(0xffffff),
  contentText: z.string().max(2000),
  showPlayerNames: z.boolean(),
  revision: z.number().int().nonnegative(),
  updatedAt: z.date(),
  updatedBy: z.string().max(128),
})

export type DiscordBotSettings = z.infer<typeof discordBotSettingsSchema>

export const editableDiscordBotSettingsSchema = discordBotSettingsSchema
  .omit({ revision: true, updatedAt: true, updatedBy: true })
  .strict()
  .superRefine((settings, context) => {
    if (settings.publishingEnabled && !settings.enabled) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['enabled'],
        message: 'The worker must be enabled before publishing can be enabled',
      })
    }

    if ((settings.enabled || settings.publishingEnabled) && !settings.guildId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['guildId'],
        message: 'Guild ID is required when the worker is enabled',
      })
    }

    if (settings.publishingEnabled && !settings.statusChannelId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['statusChannelId'],
        message: 'Status channel ID is required when publishing is enabled',
      })
    }
  })

export type EditableDiscordBotSettings = z.infer<typeof editableDiscordBotSettingsSchema>

export const discordSettingsUpdateSchema = z.object({
  settings: editableDiscordBotSettingsSchema,
  expectedRevision: z.number().int().nonnegative(),
}).strict()

export const discordJobTypes = [
  'validate_config',
  'publish_all',
  'publish_one',
  'register_commands',
] as const

export const discordJobTypeSchema = z.enum(discordJobTypes)
export type DiscordJobType = z.infer<typeof discordJobTypeSchema>

export const discordJobStatusSchema = z.enum(['queued', 'running', 'completed', 'failed'])
export type DiscordJobStatus = z.infer<typeof discordJobStatusSchema>

export const gameServerIdSchema = z.string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9_-]*$/i, 'Server ID contains unsupported characters')

export const discordJobPayloadSchema = z.discriminatedUnion('jobType', [
  z.object({ jobType: z.literal('validate_config') }).strict(),
  z.object({ jobType: z.literal('publish_all') }).strict(),
  z.object({ jobType: z.literal('publish_one'), serverId: gameServerIdSchema }).strict(),
  z.object({ jobType: z.literal('register_commands') }).strict(),
])

export type DiscordJobPayload = z.infer<typeof discordJobPayloadSchema>

export interface DiscordJob {
  id: number
  jobType: DiscordJobType
  status: DiscordJobStatus
  payload: Record<string, unknown>
  result: Record<string, unknown> | null
  attempts: number
  maxAttempts: number
  availableAt: Date
  lockedAt: Date | null
  lockOwner: string | null
  completedAt: Date | null
  errorCategory: string | null
  errorMessage: string | null
  createdAt: Date
  createdBy: string
}

export interface DiscordRuntimeState {
  workerId: string | null
  connectionState: 'starting' | 'disabled' | 'connecting' | 'connected' | 'degraded' | 'stopping' | 'stopped'
  tokenConfigured: boolean
  botUserId: string | null
  botUserTag: string | null
  heartbeatAt: Date | null
  loadedRevision: number | null
  commandsRegistered: boolean
  commandsRegisteredAt: Date | null
  lastValidationAt: Date | null
  lastValidationResult: Record<string, unknown> | null
  lastPublishAt: Date | null
  lastErrorAt: Date | null
  lastErrorCategory: string | null
  lastErrorMessage: string | null
  startedAt: Date | null
  stoppedAt: Date | null
}

export const defaultDiscordBotSettings: EditableDiscordBotSettings = {
  enabled: false,
  publishingEnabled: false,
  guildId: null,
  statusChannelId: null,
  updateIntervalSeconds: 60,
  embedHeading: 'saka Dodgeball',
  embedAccentColor: 0x8b55ff,
  contentText: '',
  showPlayerNames: true,
}

export function parseJsonObject(value: unknown): Record<string, unknown> {
  if (!value) return {}
  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value)
      return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)
        ? parsed as Record<string, unknown>
        : {}
    } catch {
      return {}
    }
  }
  return typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

export function sanitizeDiscordError(error: unknown): { category: string, message: string } {
  const rawMessage = error instanceof Error ? error.message : String(error)
  const message = rawMessage
    .replace(/Bot\s+[A-Za-z0-9._-]{20,}/gi, 'Bot [redacted]')
    .replace(/[A-Za-z0-9_-]{24}\.[A-Za-z0-9_-]{6}\.[A-Za-z0-9_-]{20,}/g, '[redacted]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500) || 'Unknown worker error'

  const candidate = error as { code?: unknown, name?: unknown }
  const category = String(candidate?.code ?? candidate?.name ?? 'worker_error')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 64)

  return { category, message }
}
