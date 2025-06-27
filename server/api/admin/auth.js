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
        console.error('Admin password not configured in environment variables');
        console.error('Please set ADMIN_PASSWORD environment variable');
        throw createError({
          statusCode: 500,
          statusMessage: 'Admin password not found. Please log in again.'
        });
      }

      if (password === config.adminPassword) {
        // Set session cookie
        setCookie(event, 'admin-session', 'authenticated', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax', // Changed from 'strict' to 'lax' for better compatibility
          maxAge: 60 * 60 * 24, // 24 hours
          path: '/' // Explicitly set path
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
    const isAuthenticated = sessionCookie === 'authenticated';

    console.log('Admin auth check:', {
      sessionCookie: sessionCookie ? 'present' : 'missing',
      isAuthenticated,
      cookieHeader: getHeader(event, 'cookie') ? 'present' : 'missing'
    });

    return {
      authenticated: isAuthenticated
    };
  } else if (method === 'PATCH') {
    // Refresh session (extend expiry)
    const sessionCookie = getCookie(event, 'admin-session');

    if (sessionCookie === 'authenticated') {
      // Refresh the cookie with new expiry
      setCookie(event, 'admin-session', 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/'
      });

      return {
        success: true,
        message: 'Session refreshed'
      };
    } else {
      throw createError({
        statusCode: 401,
        statusMessage: 'Not authenticated'
      });
    }
  } else if (method === 'DELETE') {
    // Logout
    deleteCookie(event, 'admin-session', {
      path: '/' // Make sure to delete with same path
    });

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
