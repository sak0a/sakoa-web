import { useRuntimeConfig } from '#imports';

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const method = getMethod(event);

  if (method === 'POST') {
    // Login attempt
    try {
      const body = await readBody(event);
      const { password } = body;

      if (!password) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Password is required'
        });
      }

      if (!config.adminPassword) {
        console.error('Admin password not configured in environment');
        throw createError({
          statusCode: 500,
          statusMessage: 'Admin password not configured'
        });
      }

      if (password === config.adminPassword) {
        // Set session cookie
        setCookie(event, 'admin-session', 'authenticated', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 60 * 24 // 24 hours
        });

        return {
          success: true,
          message: 'Authentication successful'
        };
      } else {
        throw createError({
          statusCode: 401,
          statusMessage: 'Invalid password'
        });
      }
    } catch (error) {
      if (error.statusCode) {
        throw error;
      }
      
      throw createError({
        statusCode: 500,
        statusMessage: 'Authentication failed'
      });
    }
  } else if (method === 'GET') {
    // Check authentication status
    const sessionCookie = getCookie(event, 'admin-session');
    
    return {
      authenticated: sessionCookie === 'authenticated'
    };
  } else if (method === 'DELETE') {
    // Logout
    deleteCookie(event, 'admin-session');
    
    return {
      success: true,
      message: 'Logged out successfully'
    };
  } else {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method not allowed'
    });
  }
});
