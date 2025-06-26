export const useAdmin = () => {
  const isAuthenticated = ref(false);
  const isLoading = ref(false);
  const error = ref(null);

  // Check authentication status
  const checkAuth = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await $fetch('/api/admin/auth', {
        method: 'GET'
      });

      isAuthenticated.value = response?.authenticated || false;
      return response?.authenticated || false;
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
      const response = await $fetch('/api/admin/donors', {
        method: 'GET'
      });
      return response;
    } catch (err) {
      console.error('Failed to get donors:', err);
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
      const response = await $fetch('/api/admin/servers', {
        method: 'GET'
      });
      return response;
    } catch (err) {
      console.error('Failed to get servers:', err);
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
    deleteServer
  };
};
