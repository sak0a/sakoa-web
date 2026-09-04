import { recordAdminAudit } from '../../repositories/audit.js';
import { getSettingsRecord, updateSettings } from '../../repositories/settings.js';
import { adminSessionFingerprint } from '../../utils/admin-session.js';
import { clearCacheByPattern } from '../../utils/cache.js';

async function audit(event, actor, outcome, metadata) {
  try {
    await recordAdminAudit({
      actor,
      action: 'settings.update',
      target: 'app_settings',
      outcome,
      metadata
    });
  } catch (error) {
    console.error('Could not record settings audit event', { message: error?.message });
  }
}

export default defineEventHandler(async (event) => {
  const method = getMethod(event).toUpperCase();

  if (method === 'GET') {
    const record = await getSettingsRecord();
    return {
      ...record.settings,
      _meta: {
        revision: record.revision,
        updatedAt: record.updatedAt,
        updatedBy: record.updatedBy
      }
    };
  }

  if (method === 'PUT') {
    const body = await readBody(event);
    if (!body?.settings || typeof body.settings !== 'object') {
      throw createError({ statusCode: 400, statusMessage: 'Settings data is required' });
    }

    const actor = adminSessionFingerprint(event.context.adminSession);
    try {
      const result = await updateSettings(body.settings, actor);
      clearCacheByPattern('^db_');
      clearCacheByPattern('^server_status');
      await audit(event, actor, 'success', {
        sections: Object.keys(body.settings),
        revision: result.revision
      });

      return {
        success: true,
        message: 'Settings updated successfully',
        settings: result.settings,
        revision: result.revision
      };
    } catch (error) {
      if (error instanceof TypeError) {
        await audit(event, actor, 'failure', { reason: error.message });
        throw createError({ statusCode: 400, statusMessage: error.message });
      }
      throw error;
    }
  }

  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
});
