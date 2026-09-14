import { createHash } from 'node:crypto'
import type { APIEmbed, APIEmbedField } from 'discord.js'
import type { DiscordBotSettings } from './discord-schema'

export interface DiscordGameServer {
  id: string
  displayName: string
  host: string
  port: number
  location: string
  connectUrl: string
  displayOrder: number
}

export interface NormalizedPlayer {
  name: string
  score: number | null
  durationSeconds: number | null
}

export interface NormalizedServerStatus {
  serverId: string
  online: boolean
  map: string | null
  playerCount: number
  maxPlayers: number | null
  players: NormalizedPlayer[]
  checkedAt: Date
  errorCategory: string | null
}

export interface DiscordStatusMessage {
  content: string
  embeds: APIEmbed[]
  allowedMentions: { parse: never[] }
}

export const MANAGED_STATUS_MARKER_PREFIX = 'Managed by saka-status • server:'

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value
  return `${value.slice(0, Math.max(0, maxLength - 1))}…`
}

function safePlayerName(value: string): string {
  const clean = value.replace(/[\r\n\t]+/g, ' ').trim()
  return truncate(clean || 'Anonymous', 80)
}

function playerTime(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds)) return '—'
  const minutes = Math.floor(Math.max(0, seconds) / 60)
  const hours = Math.floor(minutes / 60)
  return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`
}

function playerList(players: NormalizedPlayer[]): string {
  const lines: string[] = []
  let used = 0

  for (const player of players) {
    const line = `• ${safePlayerName(player.name)} — ${player.score ?? '—'} points · ${playerTime(player.durationSeconds)}`
    if (used + line.length + 1 > 1000) {
      lines.push(`…and ${players.length - lines.length} more`)
      break
    }
    lines.push(line)
    used += line.length + 1
  }

  return lines.join('\n') || 'No players online'
}

export function managedStatusMarker(serverId: string): string {
  return `${MANAGED_STATUS_MARKER_PREFIX}${serverId}`
}

export function buildDiscordStatusMessage(
  server: DiscordGameServer,
  status: NormalizedServerStatus,
  settings: DiscordBotSettings,
): DiscordStatusMessage {
  const fields: APIEmbedField[] = [
    {
      name: 'Status',
      value: status.online ? '🟢 Online' : '🔴 Offline',
      inline: true,
    },
    {
      name: 'Players',
      value: status.maxPlayers === null
        ? String(status.playerCount)
        : `${status.playerCount}/${status.maxPlayers}`,
      inline: true,
    },
    {
      name: 'Map',
      value: truncate(status.map || 'Unavailable', 1024),
      inline: true,
    },
    {
      name: 'Location',
      value: truncate(server.location || 'Unknown', 1024),
      inline: true,
    },
    {
      name: 'Connect',
      value: truncate(server.connectUrl, 1024),
      inline: true,
    },
  ]

  if (settings.showPlayerNames && status.online && status.players.length > 0) {
    fields.push({
      name: 'Current players',
      value: playerList(status.players),
      inline: false,
    })
  }

  const description = status.online
    ? undefined
    : 'The server is offline or could not be reached. The last known status message remains managed in place.'

  return {
    content: settings.contentText,
    embeds: [{
      title: truncate([settings.embedHeading.trim(), server.displayName].filter(Boolean).join(' — '), 256),
      description,
      color: status.online ? 0x57f287 : 0xe05252,
      fields,
      timestamp: status.checkedAt.toISOString(),
      footer: { text: managedStatusMarker(server.id) },
    }],
    allowedMentions: { parse: [] },
  }
}

export function discordStatusContentHash(message: DiscordStatusMessage): string {
  return createHash('sha256').update(JSON.stringify(message)).digest('hex')
}
