import { adminSessionFingerprint } from '../../../utils/admin-session.js'
import { recordAdminAudit } from '../../../repositories/audit.js'
import { discordSettingsUpdateSchema } from '../../../services/discord-schema'
import { getDiscordRepository } from '../../../utils/discord-admin'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = discordSettingsUpdateSchema.safeParse(body)

  if (!parsed.success) {
    throw createError({
      statusCode: 400,
      statusMessage: parsed.error.issues[0]?.message || 'Invalid Discord settings',
    })
  }

  const actor = adminSessionFingerprint(event.context.adminSession)
  const repository = await getDiscordRepository()

  try {
    const settings = await repository.updateSettings(
      parsed.data.settings,
      parsed.data.expectedRevision,
      actor,
    )
    try {
      await recordAdminAudit({
        actor,
        action: 'discord.settings.update',
        target: 'discord_bot_settings',
        outcome: 'success',
        metadata: { revision: settings.revision },
      })
    } catch (auditError) {
      console.error('Could not record Discord settings audit event', {
        message: auditError instanceof Error ? auditError.message : 'Unknown audit error',
      })
    }

    return { success: true, data: { settings } }
  } catch (error) {
    if (error instanceof Error && error.name === 'RevisionConflictError') {
      throw createError({
        statusCode: 409,
        statusMessage: 'Discord settings changed in another session. Reload and try again.',
      })
    }
    throw error
  }
})
