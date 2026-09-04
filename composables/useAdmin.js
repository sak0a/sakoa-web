const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function getErrorMessage(error, fallback) {
  return error?.data?.statusMessage
    || error?.data?.message
    || error?.statusMessage
    || error?.message
    || fallback;
}

export const useAdmin = () => {
  const isAuthenticated = useState('admin-authenticated', () => false);
  const csrfToken = useState('admin-csrf-token', () => null);
  const isLoading = useState('admin-loading', () => false);
  const error = useState('admin-error', () => null);

  const clearAuthState = () => {
    isAuthenticated.value = false;
    csrfToken.value = null;
  };

  const checkAuth = async () => {
    try {
      isLoading.value = true;
      error.value = null;
      const response = await $fetch('/api/admin/auth', {
        method: 'GET',
        credentials: 'include'
      });

      isAuthenticated.value = Boolean(response?.authenticated);
      csrfToken.value = response?.csrfToken || null;
      return isAuthenticated.value;
    } catch (authError) {
      clearAuthState();
      error.value = getErrorMessage(authError, 'Authentication check failed');
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const login = async (password) => {
    try {
      isLoading.value = true;
      error.value = null;
      const response = await $fetch('/api/admin/auth', {
        method: 'POST',
        credentials: 'include',
        body: { password }
      });

      isAuthenticated.value = Boolean(response?.authenticated);
      csrfToken.value = response?.csrfToken || null;
      return isAuthenticated.value;
    } catch (loginError) {
      clearAuthState();
      error.value = getErrorMessage(loginError, 'Login failed');
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const adminFetch = async (url, options = {}) => {
    const method = String(options.method || 'GET').toUpperCase();
    if (!SAFE_METHODS.has(method) && !csrfToken.value) {
      const authenticated = await checkAuth();
      if (!authenticated) throw new Error('Admin authentication required');
    }

    const headers = { ...(options.headers || {}) };
    if (!SAFE_METHODS.has(method)) headers['x-csrf-token'] = csrfToken.value;

    try {
      return await $fetch(url, {
        ...options,
        method,
        credentials: 'include',
        headers
      });
    } catch (requestError) {
      if (requestError?.status === 401 || requestError?.statusCode === 401) {
        clearAuthState();
      }
      throw requestError;
    }
  };

  const logout = async () => {
    try {
      isLoading.value = true;
      error.value = null;
      await adminFetch('/api/admin/auth', { method: 'DELETE' });
      clearAuthState();
      await navigateTo('/admin');
    } catch (logoutError) {
      error.value = getErrorMessage(logoutError, 'Logout failed');
    } finally {
      isLoading.value = false;
    }
  };

  const getServers = () => adminFetch('/api/admin/servers');
  const addServer = (server) => adminFetch('/api/admin/servers', {
    method: 'POST',
    body: { server }
  });
  const updateServer = (index, server) => adminFetch('/api/admin/servers', {
    method: 'PUT',
    body: { index, server }
  });
  const deleteServer = (index) => adminFetch('/api/admin/servers', {
    method: 'DELETE',
    query: { index }
  });

  const getSettings = () => adminFetch('/api/admin/settings');
  const updateSettings = (settings) => adminFetch('/api/admin/settings', {
    method: 'PUT',
    body: { settings }
  });

  const getDatabaseStatus = async () => {
    const response = await adminFetch('/api/admin/database');
    if (!response.success) throw new Error(response.error?.message || 'Failed to get database status');
    return response.data;
  };
  const databaseAction = (action) => adminFetch('/api/admin/database', {
    method: 'POST',
    body: { action }
  });

  const getCacheStats = async () => {
    const response = await adminFetch('/api/admin/cache');
    if (!response.success) throw new Error(response.error?.message || 'Failed to get cache statistics');
    return response.data;
  };
  const clearCache = (key = null) => adminFetch('/api/admin/cache', {
    method: 'POST',
    body: { action: 'clear', key }
  });
  const forceRefreshCache = (dataType) => adminFetch('/api/admin/cache', {
    method: 'POST',
    body: { action: 'forceRefresh', dataType }
  });
  const cleanupCache = () => adminFetch('/api/admin/cache', {
    method: 'POST',
    body: { action: 'cleanup' }
  });

  return {
    isAuthenticated: readonly(isAuthenticated),
    isLoading: readonly(isLoading),
    error: readonly(error),
    adminFetch,
    checkAuth,
    login,
    logout,
    getServers,
    addServer,
    updateServer,
    deleteServer,
    getSettings,
    updateSettings,
    getDatabaseStatus,
    testDatabaseConnection: () => databaseAction('test'),
    retryDatabaseConnection: () => databaseAction('retry'),
    getDetailedDatabaseStatus: async () => {
      const response = await databaseAction('status');
      if (!response.success) throw new Error(response.error?.message || 'Failed to get detailed database status');
      return response.data;
    },
    reloadDatabaseConfig: () => databaseAction('reload'),
    getCacheStats,
    clearCache,
    forceRefreshCache,
    cleanupCache
  };
};
