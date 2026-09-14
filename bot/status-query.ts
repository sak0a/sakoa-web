import { GameDig } from 'gamedig'
import { sanitizeDiscordError } from '../server/services/discord-schema'
import type {
  DiscordGameServer,
  NormalizedPlayer,
  NormalizedServerStatus,
} from '../server/services/discord-status'

interface GameDigPlayer {
  name?: string
  raw?: {
    score?: number
    time?: number
  }
}

export async function queryServerStatus(server: DiscordGameServer): Promise<NormalizedServerStatus> {
  const checkedAt = new Date()
  try {
    const state = await GameDig.query({
      type: 'teamfortress2',
      host: server.host,
      port: server.port,
      maxRetries: 1,
      socketTimeout: 3000,
      attemptTimeout: 5000,
    })

    const players: NormalizedPlayer[] = (state.players as GameDigPlayer[]).map(player => ({
      name: typeof player.name === 'string' ? player.name : 'Anonymous',
      score: typeof player.raw?.score === 'number' && Number.isFinite(player.raw?.score) ? player.raw?.score : null,
      durationSeconds: typeof player.raw?.time === 'number' && Number.isFinite(player.raw?.time) ? player.raw?.time : null,
    }))

    return {
      serverId: server.id,
      online: true,
      map: typeof state.map === 'string' && state.map.length > 0 ? state.map : null,
      playerCount: players.length,
      maxPlayers: typeof state.maxplayers === 'number' ? state.maxplayers : null,
      players,
      checkedAt,
      errorCategory: null,
    }
  } catch (error) {
    const sanitized = sanitizeDiscordError(error)
    return {
      serverId: server.id,
      online: false,
      map: null,
      playerCount: 0,
      maxPlayers: null,
      players: [],
      checkedAt,
      errorCategory: sanitized.category,
    }
  }
}
