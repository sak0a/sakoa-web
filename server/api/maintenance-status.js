import { DEFAULT_SETTINGS, getSettingsRecord } from '../repositories/settings.js';

export default defineEventHandler(async (event) => {
  if (getMethod(event) !== 'GET') {
    throw createError({ statusCode: 405, statusMessage: 'Method not allowed' });
  }

  try {
    const record = await getSettingsRecord();
    return {
      maintenance: record.settings.maintenance,
      source: record.source
    };
  } catch (error) {
    console.error('Maintenance status unavailable; failing open', {
      code: error?.code,
      message: error?.message
    });

    return {
      maintenance: DEFAULT_SETTINGS.maintenance,
      source: 'defaults'
    };
  }
});
