import { 
  getCacheStats, 
  clearCache, 
  clearAllCache, 
  clearCacheByPattern,
  cleanupExpiredCache 
} from '../../utils/cache.js';

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
    // Get cache statistics
    try {
      const stats = getCacheStats();
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return {
        success: false,
        error: {
          message: 'Failed to get cache statistics',
          details: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  if (method === 'POST') {
    // Handle cache operations
    try {
      const body = await readBody(event);
      const { action, key, pattern } = body;

      if (action === 'clear') {
        if (key) {
          // Clear specific cache entry
          const deleted = clearCache(key);
          return {
            success: true,
            data: { deleted, key },
            message: deleted ? `Cache cleared for key: ${key}` : `Cache key not found: ${key}`
          };
        } else {
          // Clear all cache
          const cleared = clearAllCache();
          return {
            success: true,
            data: { cleared },
            message: `Cleared all cache entries: ${cleared} items removed`
          };
        }
      }

      if (action === 'clearPattern') {
        if (!pattern) {
          throw createError({
            statusCode: 400,
            statusMessage: 'Pattern is required for clearPattern action'
          });
        }
        
        const cleared = clearCacheByPattern(pattern);
        return {
          success: true,
          data: { cleared, pattern },
          message: `Cleared ${cleared} cache entries matching pattern: ${pattern}`
        };
      }

      if (action === 'cleanup') {
        // Clean up expired entries
        const cleaned = cleanupExpiredCache();
        return {
          success: true,
          data: { cleaned },
          message: `Cleaned up ${cleaned} expired cache entries`
        };
      }

      if (action === 'forceRefresh') {
        // Force refresh specific data types
        const { dataType } = body;
        
        if (!dataType) {
          throw createError({
            statusCode: 400,
            statusMessage: 'dataType is required for forceRefresh action'
          });
        }

        let cleared = 0;
        switch (dataType) {
          case 'servers':
            cleared = clearCacheByPattern('^server_status');
            break;
          case 'leaderboard':
            cleared = clearCacheByPattern('leaderboard');
            break;
          case 'database':
            cleared = clearCacheByPattern('^db_');
            break;
          case 'donors':
            cleared = clearCacheByPattern('donors');
            break;
          case 'all':
            cleared = clearAllCache();
            break;
          default:
            throw createError({
              statusCode: 400,
              statusMessage: 'Invalid dataType. Must be: servers, leaderboard, database, donors, or all'
            });
        }

        return {
          success: true,
          data: { cleared, dataType },
          message: `Force refreshed ${dataType} cache: ${cleared} entries cleared`
        };
      }

      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid action. Supported actions: clear, clearPattern, cleanup, forceRefresh'
      });

    } catch (error) {
      console.error('Cache operation error:', error);
      
      if (error.statusCode) {
        throw error;
      }
      
      return {
        success: false,
        error: {
          message: 'Cache operation failed',
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
