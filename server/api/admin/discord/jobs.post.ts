import { adminSessionFingerprint } from '../../../utils/admin-session.js'
import { recordAdminAudit } from '../../../repositories/audit.js'
import { discordJobPayloadSchema } from '../../../services/discord-schema'
import { getDiscordRepository } from '../../../utils/discord-admin'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = discordJobPayloadSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Invalid Discord job',
    })
  }

  const actor = adminSessionFingerprint(event.context.adminSession)
  const repository = await getDiscordRepository()

  if (parsed.data.jobType === 'publish_one') {
    const servers = await repository.listPublishableServers(parsed.data.serverId)
    if (!servers[0]) {
      throw createError({ statusCode: 404, statusMessage: 'Publishable server not found' })
    }
  }

  const jobId = await repository.enqueueJob(parsed.data, actor)
  try {
    await recordAdminAudit({
      actor,
      action: `discord.job.${parsed.data.jobType}`,
      target: String(jobId),
      outcome: 'success',
      metadata: parsed.data.jobType === 'publish_one'
        ? { serverId: parsed.data.serverId }
        : null,
    })
  } catch (auditError) {
    console.error('Could not record Discord job audit event', {
      jobId,
      message: auditError instanceof Error ? auditError.message : 'Unknown audit error',
    })
  }

  setResponseStatus(event, 202)
  return { success: true, data: { jobId, status: 'queued' } }
})
