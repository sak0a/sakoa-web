export const useAdmin = () => {
  const isAuthenticated = ref(false);
  const isLoading = ref(false);
  const error = ref(null);

  // Check authentication status
  const checkAuth = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      console.log('Checking admin authentication...');

      const response = await $fetch('/api/admin/auth', {
        method: 'GET'
      });

      const authenticated = response?.authenticated || false;
      isAuthenticated.value = authenticated;

      console.log('Auth check result:', { authenticated, response });

      // If authenticated, refresh the session
      if (authenticated) {
        try {
          await $fetch('/api/admin/auth', {
            method: 'PATCH'
          });
          console.log('Session refreshed successfully');
        } catch (refreshErr) {
          console.warn('Failed to refresh session:', refreshErr);
        }
      }

      return authenticated;
    } catch (err) {
      console.error('Auth check failed:', err);
      error.value = err.data?.message || 'Authentication check failed';
      isAuthenticated.value = false;
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // Login
  const login = async (password) => {
    try {
      isLoading.value = true;
      error.value = null;
      
      const response = await $fetch('/api/admin/auth', {
        method: 'POST',
        body: { password }
      });
      
      if (response.success) {
        isAuthenticated.value = true;
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('Login failed:', err);
      error.value = err.data?.message || 'Login failed';
      isAuthenticated.value = false;
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // Logout
  const logout = async () => {
    try {
      isLoading.value = true;
      error.value = null;
      
      await $fetch('/api/admin/auth', {
        method: 'DELETE'
      });
      
      isAuthenticated.value = false;
      await navigateTo('/admin');
    } catch (err) {
      console.error('Logout failed:', err);
      error.value = err.data?.message || 'Logout failed';
    } finally {
      isLoading.value = false;
    }
  };

  // Donors management
  const getDonors = async () => {
    try {
      console.log('Fetching donors data...');
      const response = await $fetch('/api/admin/donors', {
        method: 'GET'
      });
      console.log('Donors data fetched successfully:', response);
      return response;
    } catch (err) {
      console.error('Failed to get donors:', err);
      console.error('Error details:', { status: err.status, statusCode: err.statusCode, data: err.data });

      // If it's an auth error, clear the authentication state
      if (err.status === 401 || err.statusCode === 401) {
        console.log('Authentication error detected, clearing auth state');
        isAuthenticated.value = false;
      }

      throw err;
    }
  };

  const addDonor = async (donor) => {
    try {
      const response = await $fetch('/api/admin/donors', {
        method: 'POST',
        body: { donor }
      });
      return response;
    } catch (err) {
      console.error('Failed to add donor:', err);
      throw err;
    }
  };

  const updateDonor = async (index, donor) => {
    try {
      const response = await $fetch('/api/admin/donors', {
        method: 'PUT',
        body: { index, donor }
      });
      return response;
    } catch (err) {
      console.error('Failed to update donor:', err);
      throw err;
    }
  };

  const deleteDonor = async (index) => {
    try {
      const response = await $fetch('/api/admin/donors', {
        method: 'DELETE',
        query: { index }
      });
      return response;
    } catch (err) {
      console.error('Failed to delete donor:', err);
      throw err;
    }
  };

  // Servers management
  const getServers = async () => {
    try {
      console.log('Fetching servers data...');
      const response = await $fetch('/api/admin/servers', {
        method: 'GET'
      });
      console.log('Servers data fetched successfully:', response);
      return response;
    } catch (err) {
      console.error('Failed to get servers:', err);
      console.error('Error details:', { status: err.status, statusCode: err.statusCode, data: err.data });

      // If it's an auth error, clear the authentication state
      if (err.status === 401 || err.statusCode === 401) {
        console.log('Authentication error detected, clearing auth state');
        isAuthenticated.value = false;
      }

      throw err;
    }
  };

  const addServer = async (server) => {
    try {
      const response = await $fetch('/api/admin/servers', {
        method: 'POST',
        body: { server }
      });
      return response;
    } catch (err) {
      console.error('Failed to add server:', err);
      throw err;
    }
  };

  const updateServer = async (index, server) => {
    try {
      const response = await $fetch('/api/admin/servers', {
        method: 'PUT',
        body: { index, server }
      });
      return response;
    } catch (err) {
      console.error('Failed to update server:', err);
      throw err;
    }
  };

  const deleteServer = async (index) => {
    try {
      const response = await $fetch('/api/admin/servers', {
        method: 'DELETE',
        query: { index }
      });
      return response;
    } catch (err) {
      console.error('Failed to delete server:', err);
      throw err;
    }
  };

  // Settings management
  const getSettings = async () => {
    try {
      const response = await $fetch('/api/admin/settings', {
        method: 'GET'
      });
      return response;
    } catch (err) {
      console.error('Failed to get settings:', err);

      // If it's an auth error, clear the authentication state
      if (err.status === 401) {
        isAuthenticated.value = false;
      }

      throw err;
    }
  };

  const updateSettings = async (settings) => {
    try {
      const response = await $fetch('/api/admin/settings', {
        method: 'PUT',
        body: { settings }
      });
      return response;
    } catch (err) {
      console.error('Failed to update settings:', err);
      throw err;
    }
  };

  // Database management functions
  const getDatabaseStatus = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await $fetch('/api/admin/database', {
        method: 'GET'
      });

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to get database status');
      }
    } catch (err) {
      console.error('Get database status error:', err);
      error.value = err.message || 'Failed to get database status';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const testDatabaseConnection = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await $fetch('/api/admin/database', {
        method: 'POST',
        body: { action: 'test' }
      });

      return response;
    } catch (err) {
      console.error('Test database connection error:', err);
      error.value = err.message || 'Failed to test database connection';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const retryDatabaseConnection = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await $fetch('/api/admin/database', {
        method: 'POST',
        body: { action: 'retry' }
      });

      return response;
    } catch (err) {
      console.error('Retry database connection error:', err);
      error.value = err.message || 'Failed to retry database connection';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const getDetailedDatabaseStatus = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await $fetch('/api/admin/database', {
        method: 'POST',
        body: { action: 'status' }
      });

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to get detailed database status');
      }
    } catch (err) {
      console.error('Get detailed database status error:', err);
      error.value = err.message || 'Failed to get detailed database status';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const reloadDatabaseConfig = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await $fetch('/api/admin/database', {
        method: 'POST',
        body: { action: 'reload' }
      });

      return response;
    } catch (err) {
      console.error('Reload database config error:', err);
      error.value = err.message || 'Failed to reload database configuration';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // Cache management functions
  const getCacheStats = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await $fetch('/api/admin/cache', {
        method: 'GET'
      });

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error?.message || 'Failed to get cache statistics');
      }
    } catch (err) {
      console.error('Get cache stats error:', err);
      error.value = err.message || 'Failed to get cache statistics';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const clearCache = async (key = null) => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await $fetch('/api/admin/cache', {
        method: 'POST',
        body: { action: 'clear', key }
      });

      return response;
    } catch (err) {
      console.error('Clear cache error:', err);
      error.value = err.message || 'Failed to clear cache';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const forceRefreshCache = async (dataType) => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await $fetch('/api/admin/cache', {
        method: 'POST',
        body: { action: 'forceRefresh', dataType }
      });

      return response;
    } catch (err) {
      console.error('Force refresh cache error:', err);
      error.value = err.message || 'Failed to force refresh cache';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const cleanupCache = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await $fetch('/api/admin/cache', {
        method: 'POST',
        body: { action: 'cleanup' }
      });

      return response;
    } catch (err) {
      console.error('Cleanup cache error:', err);
      error.value = err.message || 'Failed to cleanup cache';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    isAuthenticated: readonly(isAuthenticated),
    isLoading: readonly(isLoading),
    error: readonly(error),
    checkAuth,
    login,
    logout,
    getDonors,
    addDonor,
    updateDonor,
    deleteDonor,
    getServers,
    addServer,
    updateServer,
    deleteServer,
    getSettings,
    updateSettings,
    getDatabaseStatus,
    testDatabaseConnection,
    retryDatabaseConnection,
    getDetailedDatabaseStatus,
    reloadDatabaseConfig,
    getCacheStats,
    clearCache,
    forceRefreshCache,
    cleanupCache
  };
};
