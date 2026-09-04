import { queryServerStatus } from '../../../../bot/status-query'
import { gameServerIdSchema } from '../../../services/discord-schema'
import { buildDiscordStatusMessage } from '../../../services/discord-status'
import { getDiscordRepository } from '../../../utils/discord-admin'

export default defineEventHandler(async (event) => {
  const parsedServerId = gameServerIdSchema.safeParse(getQuery(event).serverId)
  if (!parsedServerId.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsedServerId.error.issues[0]?.message || 'A valid server ID is required',
    })
  }
  const serverId = parsedServerId.data

  const repository = await getDiscordRepository()
  const [settings, servers] = await Promise.all([
    repository.getSettings(),
    repository.listPublishableServers(serverId),
  ])
  const server = servers[0]

  if (!server) {
    throw createError({ statusCode: 404, statusMessage: 'Publishable server not found' })
  }

  const status = await queryServerStatus(server)
  return {
    success: true,
    data: {
      server,
      status,
      message: buildDiscordStatusMessage(server, status, settings),
    },
  }
})
