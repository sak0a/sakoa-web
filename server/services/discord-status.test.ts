import { describe, expect, it } from 'vitest'
import { buildDiscordStatusMessage, discordStatusContentHash, managedStatusMarker } from './discord-status'
import { editableDiscordBotSettingsSchema, defaultDiscordBotSettings, type DiscordBotSettings } from './discord-schema'

const settings: DiscordBotSettings = {
  enabled: true,
  publishingEnabled: true,
  guildId: '12345678901234567',
  statusChannelId: '22345678901234567',
  updateIntervalSeconds: 60,
  embedHeading: 'Arena status',
  embedAccentColor: 0x8b55ff,
  contentText: '@everyone',
  showPlayerNames: true,
  revision: 2,
  updatedAt: new Date('2026-09-04T12:00:00.000Z'),
  updatedBy: 'test',
}

const server = {
  id: 'public',
  displayName: 'Public',
  host: '127.0.0.1',
  port: 27015,
  location: 'Frankfurt',
  connectUrl: 'steam://connect/127.0.0.1:27015',
  displayOrder: 0,
}

describe('Discord status messages', () => {
  it('uses an exact managed marker and disables mentions', () => {
    const message = buildDiscordStatusMessage(server, {
      serverId: server.id,
      online: true,
      map: 'tfdb_spacebox_a3',
      playerCount: 1,
      maxPlayers: 24,
      players: [{ name: 'Player', score: 1, durationSeconds: 10 }],
      checkedAt: new Date('2026-09-04T12:00:00.000Z'),
      errorCategory: null,
    }, settings)

    expect(message.embeds[0]?.color).toBe(0x57f287)
    expect(message.embeds[0]?.fields?.find(field => field.name === 'Current players')?.value).toBe('• Player — 1 points · 0m')
    expect(message.allowedMentions.parse).toEqual([])
    expect(message.embeds[0]?.footer?.text).toBe(managedStatusMarker(server.id))
    expect(message.embeds[0]?.fields?.find(field => field.name === 'Players')?.value).toBe('1/24')
  })

  it('accepts a blank heading and bounds long player lists', () => {
    expect(editableDiscordBotSettingsSchema.parse({ ...defaultDiscordBotSettings, embedHeading: ' ' }).embedHeading).toBe('')
    const status = {
      serverId: server.id, online: true, map: 'arena', playerCount: 100, maxPlayers: 100,
      players: Array.from({ length: 100 }, () => ({ name: 'Player'.repeat(20), score: 42, durationSeconds: 4860 })),
      checkedAt: new Date(), errorCategory: null,
    }
    const embed = buildDiscordStatusMessage(server, status, { ...settings, embedHeading: '' }).embeds[0]!
    expect(embed.title).toBe('Public')
    const players = embed.fields!.find(field => field.name === 'Current players')!.value
    expect(players).toContain('42 points · 1h 21m')
    expect(players).toContain('more')
    expect(players.length).toBeLessThanOrEqual(1024)
    const unknown = buildDiscordStatusMessage(server, { ...status, players: [{ name: 'Unknown', score: null, durationSeconds: null }] }, settings)
    expect(unknown.embeds[0]!.fields!.at(-1)!.value).toBe('• Unknown — — points · —')
    const hidden = buildDiscordStatusMessage(server, status, { ...settings, showPlayerNames: false })
    expect(hidden.embeds[0]!.fields!.some(field => field.name === 'Current players')).toBe(false)
  })

  it('builds deterministic hashes' , () => {
    const status = {
      serverId: server.id,
      online: false,
      map: null,
      playerCount: 0,
      maxPlayers: null,
      players: [],
      checkedAt: new Date('2026-09-04T12:00:00.000Z'),
      errorCategory: 'timeout',
    }
    const message = buildDiscordStatusMessage(server, status, settings)
    expect(message.embeds[0]?.color).toBe(0xe05252)
    expect(discordStatusContentHash(message)).toBe(discordStatusContentHash(message))
    expect(discordStatusContentHash(message)).toHaveLength(64)
  })
})
