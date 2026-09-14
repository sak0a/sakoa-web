import { beforeEach, describe, expect, it, vi } from 'vitest'
import { queryServerStatus } from './status-query'
import { buildDiscordStatusMessage } from '../server/services/discord-status'
import { defaultDiscordBotSettings } from '../server/services/discord-schema'

const { query } = vi.hoisted(() => ({ query: vi.fn() }))
vi.mock('gamedig', () => ({ GameDig: { query } }))

const server = {
  id: 'public', displayName: 'Public', host: '127.0.0.1', port: 27015,
  location: 'Frankfurt', connectUrl: 'steam://connect/127.0.0.1:27015', displayOrder: 0,
}

function mockPlayers(players: unknown[]) {
  query.mockResolvedValue({ map: 'arena', maxplayers: 24, players })
}

beforeEach(() => vi.clearAllMocks())

describe('Discord GameDig player mapping', () => {
  it('renders points and session time from the same raw fields as the website', async () => {
    mockPlayers([{ name: 'Player', raw: { score: 42, time: 4860.5 } }])
    const status = await queryServerStatus(server)
    expect(status.players).toEqual([{ name: 'Player', score: 42, durationSeconds: 4860.5 }])
    const message = buildDiscordStatusMessage(server, status, {
      ...defaultDiscordBotSettings, revision: 1, updatedAt: new Date(), updatedBy: 'test',
    })
    expect(message.embeds[0]!.fields!.find(field => field.name === 'Current players')!.value)
      .toBe('• Player — 42 points · 1h 21m')
  })

  it('preserves zero and negative scores and handles missing or non-finite values', async () => {
    mockPlayers([
      { name: 'Zero', raw: { score: 0, time: 0 } },
      { name: 'Negative', raw: { score: -2, time: 60 } },
      { name: 'Missing' },
      { name: 'Invalid', raw: { score: NaN, time: Infinity } },
    ])
    expect((await queryServerStatus(server)).players).toEqual([
      { name: 'Zero', score: 0, durationSeconds: 0 },
      { name: 'Negative', score: -2, durationSeconds: 60 },
      { name: 'Missing', score: null, durationSeconds: null },
      { name: 'Invalid', score: null, durationSeconds: null },
    ])
  })
})
