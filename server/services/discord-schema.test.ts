import { describe, expect, it } from 'vitest'
import {
  discordJobPayloadSchema,
  discordSettingsUpdateSchema,
  editableDiscordBotSettingsSchema,
  sanitizeDiscordError,
} from './discord-schema'

const validSettings = {
  enabled: true,
  publishingEnabled: true,
  guildId: '12345678901234567',
  statusChannelId: '22345678901234567',
  updateIntervalSeconds: 60,
  embedHeading: 'Arena status',
  embedAccentColor: 0x8b55ff,
  contentText: '',
  showPlayerNames: true,
}

describe('Discord settings validation', () => {
  it('accepts complete non-secret settings', () => {
    expect(editableDiscordBotSettingsSchema.parse(validSettings)).toEqual(validSettings)
  })

  it('rejects unsafe intervals and missing publication targets', () => {
    const result = editableDiscordBotSettingsSchema.safeParse({
      ...validSettings,
      guildId: null,
      statusChannelId: null,
      updateIntervalSeconds: 2,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map(issue => issue.path[0])).toEqual(
        expect.arrayContaining(['guildId', 'statusChannelId', 'updateIntervalSeconds']),
      )
    }
  })

  it('requires the worker when publishing is enabled', () => {
    const result = editableDiscordBotSettingsSchema.safeParse({
      ...validSettings,
      enabled: false,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.map(issue => issue.path[0])).toContain('enabled')
    }
  })

  it('requires an exact numeric revision in settings update requests', () => {
    expect(discordSettingsUpdateSchema.safeParse({
      settings: validSettings,
      expectedRevision: 2,
    }).success).toBe(true)
    expect(discordSettingsUpdateSchema.safeParse({
      settings: validSettings,
      expectedRevision: '2',
    }).success).toBe(false)
    expect(discordSettingsUpdateSchema.safeParse({
      settings: { ...validSettings, token: 'must-never-be-accepted' },
      expectedRevision: 2,
    }).success).toBe(false)
  })

  it('redacts Discord-like tokens before persistence', () => {
    const token = `${'a'.repeat(24)}.${'b'.repeat(6)}.${'c'.repeat(28)}`
    expect(sanitizeDiscordError(new Error(`request used ${token}`)).message).not.toContain(token)
  })

  it('rejects unsafe server identifiers in queued jobs', () => {
    expect(discordJobPayloadSchema.safeParse({
      jobType: 'publish_one',
      serverId: '@everyone',
    }).success).toBe(false)
    expect(discordJobPayloadSchema.safeParse({
      jobType: 'publish_all',
      unexpected: true,
    }).success).toBe(false)
  })
})
