import { testDbConnection, retryDbConnection, getDbStatus, getCurrentConnectionState, reloadConfigAndReconnect } from '../../utils/database.js';

// Helper function to check admin authentication
function checkAdminAuth(event) {
  const sessionCookie = getCookie(event, 'admin-session');
  if (sessionCookie !== 'authenticated') {
    console.error('Admin authentication failed - invalid or missing session cookie');
    throw createError({
      statusCode: 401,
      statusMessage: 'Admin password not found. Please log in again.'
    });
  }
}

export default defineEventHandler(async (event) => {
  const method = getMethod(event);

  // Check admin authentication for all requests
  checkAdminAuth(event);

  if (method === 'GET') {
    // Get current database status
    try {
      const status = await getDbStatus();
      return {
        success: true,
        data: status
      };
    } catch (error) {
      console.error('Error getting database status:', error);
      return {
        success: false,
        error: {
          message: 'Failed to get database status',
          details: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  if (method === 'POST') {
    // Handle database operations
    try {
      const body = await readBody(event);
      const { action } = body;

      if (action === 'test') {
        // Test database connection
        console.log('Testing database connection...');
        const result = await testDbConnection();
        
        return {
          success: result.success,
          data: result,
          message: result.success ? 'Database connection test successful' : 'Database connection test failed'
        };
      }

      if (action === 'retry') {
        // Retry database connection
        console.log('Retrying database connection...');
        const result = await retryDbConnection();
        
        return {
          success: result.success,
          data: result,
          message: result.message
        };
      }

      if (action === 'status') {
        // Get detailed status
        const currentState = await getCurrentConnectionState();
        const activeStatus = await getDbStatus();
        const testResult = await testDbConnection();

        return {
          success: true,
          data: {
            currentState: currentState,
            activeStatus: activeStatus,
            testResult: testResult
          },
          message: 'Database status retrieved successfully'
        };
      }

      if (action === 'reload') {
        // Reload configuration and reconnect
        console.log('Reloading database configuration from environment variables...');
        const result = await reloadConfigAndReconnect();

        return {
          success: result.success,
          data: result,
          message: result.message
        };
      }

      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid action. Supported actions: test, retry, status, reload'
      });

    } catch (error) {
      console.error('Database operation error:', error);
      
      if (error.statusCode) {
        throw error;
      }
      
      return {
        success: false,
        error: {
          message: 'Database operation failed',
          details: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  throw createError({
    statusCode: 405,
    statusMessage: 'Method not allowed'
  });
});
