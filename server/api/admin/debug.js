import { useRuntimeConfig } from '#imports';

export default defineEventHandler(async (event) => {
  const method = getMethod(event);
  
  if (method === 'GET') {
    const config = useRuntimeConfig();
    
    // Only show debug info, don't expose actual password
    return {
      debug: {
        adminPasswordConfigured: !!config.adminPassword,
        adminPasswordLength: config.adminPassword ? config.adminPassword.length : 0,
        nodeEnv: process.env.NODE_ENV,
        cookieHeader: getHeader(event, 'cookie') ? 'present' : 'missing',
        sessionCookie: getCookie(event, 'admin-session') ? 'present' : 'missing'
      }
    };
  } else {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    });
  }
});
