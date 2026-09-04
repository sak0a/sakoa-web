import {
  DEFAULT_SETTINGS,
  getSettingsRecord,
  publicSettings
} from '../repositories/settings.js';

export default defineEventHandler(async (event) => {
  if (getMethod(event) !== 'GET') {
    throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
  }

  try {
    const record = await getSettingsRecord();
    return {
      success: true,
      data: publicSettings(record.settings),
      meta: {
        revision: record.revision,
        source: record.source,
        updatedAt: record.updatedAt
      }
    };
  } catch (error) {
    console.error('Public settings are using safe defaults', {
      code: error?.code,
      message: error?.message
    });

    return {
      success: false,
      data: publicSettings(DEFAULT_SETTINGS),
      error: {
        code: 'SETTINGS_UNAVAILABLE',
        message: 'Saved settings are temporarily unavailable'
      },
      meta: {
        revision: 0,
        source: 'defaults',
        updatedAt: null
      }
    };
  }
});
