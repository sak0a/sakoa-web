<template>
  <div class="min-h-screen bg-gray-900">
    <AdminLayout>
      <div class="p-6">
        <div class="flex justify-between items-center mb-8">
          <div>
            <h1 class="text-3xl font-bold text-white mb-2">Server Management</h1>
            <p class="text-gray-400">Configure your TF2 dodgeball servers</p>
          </div>
          <button
            @click="openAddModal"
            class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Add Server
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          <p class="text-gray-400 mt-2">Loading servers...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
          <p class="text-red-200">{{ error }}</p>
        </div>

        <!-- Servers Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="(server, index) in servers"
            :key="server.id"
            class="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20"
          >
            <div class="flex justify-between items-start mb-4">
              <div class="flex-1">
                <h3 class="text-lg font-semibold text-white mb-1">{{ server.name }}</h3>
                <p class="text-gray-400 text-sm">{{ server.host }}:{{ server.port }}</p>
              </div>
              <div class="flex items-center space-x-2">
                <span
                  v-if="server.comingSoon"
                  class="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-500/20 text-yellow-300"
                >
                  Coming Soon
                </span>
                <div class="flex space-x-1">
                  <button
                    @click="openEditModal(index, server)"
                    class="text-blue-400 hover:text-blue-300 p-1"
                    title="Edit"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                  </button>
                  <button
                    @click="confirmDelete(index, server)"
                    class="text-red-400 hover:text-red-300 p-1"
                    title="Delete"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
            
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-400">ID:</span>
                <span class="text-white font-mono">{{ server.id }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Location:</span>
                <span class="text-white">{{ server.location }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">Connect URL:</span>
                <span class="text-white text-xs truncate ml-2">{{ server.connectUrl }}</span>
              </div>
            </div>
          </div>
          
          <div v-if="servers.length === 0" class="col-span-full text-center py-8">
            <p class="text-gray-400">No servers configured. Add your first server to get started!</p>
          </div>
        </div>

        <!-- Add/Edit Modal -->
        <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div class="bg-gray-800 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 class="text-xl font-bold text-white mb-4">
              {{ editingIndex !== null ? 'Edit Server' : 'Add New Server' }}
            </h2>
            
            <form @submit.prevent="saveServer" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Server ID</label>
                <input
                  v-model="formData.id"
                  type="text"
                  required
                  :disabled="editingIndex !== null"
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                  placeholder="unique-server-id"
                />
                <p class="text-xs text-gray-400 mt-1">Unique identifier for the server (cannot be changed after creation)</p>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Server Name</label>
                <input
                  v-model="formData.name"
                  type="text"
                  required
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="My Dodgeball Server"
                />
              </div>
              
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">Host/IP</label>
                  <input
                    v-model="formData.host"
                    type="text"
                    required
                    class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="192.168.1.100"
                  />
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">Port</label>
                  <input
                    v-model.number="formData.port"
                    type="number"
                    min="1"
                    max="65535"
                    required
                    class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="27015"
                  />
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Location</label>
                <input
                  v-model="formData.location"
                  type="text"
                  required
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="🇺🇸 New York"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">Connect URL</label>
                <input
                  v-model="formData.connectUrl"
                  type="text"
                  required
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="steam://connect/192.168.1.100:27015"
                />
                <p class="text-xs text-gray-400 mt-1">Steam connect URL for players to join</p>
              </div>
              
              <div class="flex items-center">
                <input
                  v-model="formData.comingSoon"
                  type="checkbox"
                  id="comingSoon"
                  class="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                />
                <label for="comingSoon" class="ml-2 text-sm text-gray-300">
                  Mark as "Coming Soon"
                </label>
              </div>
              
              <div v-if="modalError" class="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                <p class="text-red-200 text-sm">{{ modalError }}</p>
              </div>
              
              <div class="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  @click="closeModal"
                  class="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="saving"
                  class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {{ saving ? 'Saving...' : 'Save' }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Delete Confirmation Modal -->
        <div v-if="showDeleteModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div class="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 class="text-xl font-bold text-white mb-4">Confirm Delete</h2>
            <p class="text-gray-300 mb-6">
              Are you sure you want to delete <strong>{{ deleteTarget?.name }}</strong>? This action cannot be undone.
            </p>
            
            <div class="flex justify-end space-x-3">
              <button
                @click="showDeleteModal = false"
                class="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                @click="deleteServerConfirmed"
                :disabled="deleting"
                class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {{ deleting ? 'Deleting...' : 'Delete' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Server Performance & Monitoring Section -->
        <div class="mt-8 space-y-6">
          <!-- Cache Management -->
          <AdminCacheManagement />

          <!-- Server Query Statistics -->
          <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-semibold text-white">Server Query Statistics</h3>
              <button
                @click="refreshQueryStats"
                :disabled="loadingStats"
                class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm transition-colors"
              >
                {{ loadingStats ? 'Loading...' : 'Refresh' }}
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div class="bg-gray-700 rounded-lg p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-gray-400 text-sm">Active Queries</p>
                    <p class="text-white text-2xl font-bold">{{ queryStats.activeQueries }}</p>
                  </div>
                  <div class="bg-blue-500/20 p-3 rounded-lg">
                    <svg class="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                  </div>
                </div>
              </div>

              <div class="bg-gray-700 rounded-lg p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-gray-400 text-sm">Query Interval</p>
                    <p class="text-white text-2xl font-bold">{{ queryStats.interval }}s</p>
                  </div>
                  <div class="bg-green-500/20 p-3 rounded-lg">
                    <svg class="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                </div>
              </div>

              <div class="bg-gray-700 rounded-lg p-4">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-gray-400 text-sm">Success Rate</p>
                    <p class="text-white text-2xl font-bold">{{ queryStats.successRate }}%</p>
                  </div>
                  <div class="bg-purple-500/20 p-3 rounded-lg">
                    <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <!-- Server Status Overview -->
            <div class="bg-gray-700 rounded-lg p-4">
              <h4 class="text-sm font-medium text-gray-300 mb-3">Server Status Overview</h4>
              <div class="space-y-2">
                <div v-for="server in servers" :key="server.id" class="flex items-center justify-between py-2 border-b border-gray-600 last:border-b-0">
                  <div class="flex items-center space-x-3">
                    <div
                      class="w-3 h-3 rounded-full"
                      :class="getServerStatusColor(server.id)"
                    ></div>
                    <span class="text-white font-medium">{{ server.name }}</span>
                    <span class="text-gray-400 text-sm">{{ server.host }}:{{ server.port }}</span>
                  </div>
                  <div class="text-right">
                    <div class="text-white text-sm">{{ getServerStatus(server.id) }}</div>
                    <div class="text-gray-400 text-xs">{{ getLastChecked(server.id) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Server Cache Settings -->
          <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-xl font-semibold text-white">Server Cache Settings</h3>
              <button
                @click="saveWorkerSettings"
                :disabled="savingWorkerSettings"
                class="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
              >
                {{ savingWorkerSettings ? 'Saving...' : 'Save Cache Settings' }}
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">Server Status Interval (seconds)</label>
                  <input
                    v-model.number="workerSettings.serverStatusInterval"
                    type="number"
                    min="5"
                    max="300"
                    class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p class="text-xs text-gray-400 mt-1">How often to check server status (5-300 seconds)</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">Steam Profiles Cache (seconds)</label>
                  <input
                    v-model.number="workerSettings.steamProfilesInterval"
                    type="number"
                    min="300"
                    max="86400"
                    class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p class="text-xs text-gray-400 mt-1">How long to cache Steam profile data (300-86400 seconds / 5min-24h)</p>
                </div>
              </div>

              <div class="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
                <div class="flex items-center mb-2">
                  <svg class="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span class="text-blue-400 font-medium">System Logging Settings</span>
                </div>
                <p class="text-blue-300 text-sm">
                  Background worker and logging settings have been moved to the
                  <NuxtLink to="/admin/settings" class="text-blue-200 hover:text-blue-100 underline">Settings page</NuxtLink>
                  for better organization.
                </p>
              </div>
            </div>

            <div v-if="workerMessage" class="mt-4">
              <div
                class="p-3 rounded-lg text-sm"
                :class="workerMessageType === 'success' ? 'bg-green-900/20 border border-green-700 text-green-400' : 'bg-red-900/20 border border-red-700 text-red-400'"
              >
                {{ workerMessage }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  </div>
</template>

<script setup>
definePageMeta({
  layout: false
});

const { getServers, addServer, updateServer, deleteServer, checkAuth, getSettings, updateSettings } = useAdmin();
const { getAllServerStates, getServerState } = useServerStatus();

const servers = ref([]);
const loading = ref(true);
const error = ref(null);

const showModal = ref(false);
const editingIndex = ref(null);
const formData = ref({
  id: '',
  name: '',
  host: '',
  port: 27015,
  location: '',
  connectUrl: '',
  comingSoon: false
});
const modalError = ref(null);
const saving = ref(false);

const showDeleteModal = ref(false);
const deleteTarget = ref(null);
const deleteIndex = ref(null);
const deleting = ref(false);

// Monitoring data
const queryStats = ref({
  activeQueries: 0,
  interval: 30,
  successRate: 95
});
const loadingStats = ref(false);

// Server cache settings
const workerSettings = ref({
  serverStatusInterval: 30,
  steamProfilesInterval: 3600
});
const savingWorkerSettings = ref(false);
const workerMessage = ref('');
const workerMessageType = ref('success');

// Load servers
const loadServers = async () => {
  try {
    console.log('loadServers: Starting to load servers...');
    loading.value = true;
    error.value = null;

    console.log('loadServers: Calling getServers()...');
    const data = await getServers();
    console.log('loadServers: Received data:', data);

    if (data && data.servers) {
      servers.value = data.servers;
      console.log('loadServers: Servers set successfully:', servers.value);
    } else {
      console.error('loadServers: Invalid data structure received:', data);
      error.value = 'Invalid server data received';
    }
  } catch (err) {
    console.error('loadServers: Failed to load servers:', err);
    error.value = err.data?.message || err.message || 'Failed to load servers';
    if (err.status === 401 || err.statusCode === 401) {
      console.log('loadServers: Authentication failed, redirecting to login');
      await navigateTo('/admin');
    }
  } finally {
    console.log('loadServers: Setting loading to false');
    loading.value = false;
  }
};

// Modal functions
const openAddModal = () => {
  editingIndex.value = null;
  formData.value = {
    id: '',
    name: '',
    host: '',
    port: 27015,
    location: '',
    connectUrl: '',
    comingSoon: false
  };
  modalError.value = null;
  showModal.value = true;
};

const openEditModal = (index, server) => {
  editingIndex.value = index;
  formData.value = { ...server };
  modalError.value = null;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingIndex.value = null;
  modalError.value = null;
};

const saveServer = async () => {
  try {
    saving.value = true;
    modalError.value = null;
    
    if (editingIndex.value !== null) {
      await updateServer(editingIndex.value, formData.value);
    } else {
      await addServer(formData.value);
    }
    
    await loadServers();
    closeModal();
  } catch (err) {
    modalError.value = err.data?.message || 'Failed to save server';
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (index, server) => {
  deleteIndex.value = index;
  deleteTarget.value = server;
  showDeleteModal.value = true;
};

const deleteServerConfirmed = async () => {
  try {
    deleting.value = true;
    await deleteServer(deleteIndex.value);
    await loadServers();
    showDeleteModal.value = false;
  } catch (err) {
    error.value = err.data?.message || 'Failed to delete server';
  } finally {
    deleting.value = false;
  }
};

// Monitoring methods
const refreshQueryStats = async () => {
  loadingStats.value = true;
  try {
    // Simulate fetching query stats - in real implementation, this would call an API
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get current server states
    const serverStates = getAllServerStates();
    const activeCount = Object.values(serverStates).filter(state => state.isQuerying).length;
    const onlineCount = Object.values(serverStates).filter(state => state.status === 'online').length;
    const totalCount = Object.keys(serverStates).length;

    queryStats.value = {
      activeQueries: activeCount,
      interval: workerSettings.value.serverStatusInterval,
      successRate: totalCount > 0 ? Math.round((onlineCount / totalCount) * 100) : 0
    };
  } catch (err) {
    console.error('Failed to refresh query stats:', err);
  } finally {
    loadingStats.value = false;
  }
};

const getServerStatus = (serverId) => {
  const state = getServerState(serverId);
  if (!state) return 'Unknown';

  switch (state.status) {
    case 'online':
      return `Online (${state.players || 0}/${state.maxplayers || 0})`;
    case 'offline':
      return 'Offline';
    case 'checking':
      return 'Checking...';
    default:
      return 'Unknown';
  }
};

const getServerStatusColor = (serverId) => {
  const state = getServerState(serverId);
  if (!state) return 'bg-gray-500';

  switch (state.status) {
    case 'online':
      return 'bg-green-500';
    case 'offline':
      return 'bg-red-500';
    case 'checking':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
};

const getLastChecked = (serverId) => {
  const state = getServerState(serverId);
  if (!state || !state.lastChecked) return 'Never';

  const now = new Date();
  const lastChecked = new Date(state.lastChecked);
  const diffSeconds = Math.floor((now - lastChecked) / 1000);

  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
  return `${Math.floor(diffSeconds / 3600)}h ago`;
};

const saveWorkerSettings = async () => {
  savingWorkerSettings.value = true;
  workerMessage.value = '';

  try {
    // Get current settings
    const currentSettings = await getSettings();

    // Update cache settings only
    const updatedSettings = {
      ...currentSettings,
      cache: {
        ...currentSettings.cache,
        serverStatusInterval: workerSettings.value.serverStatusInterval,
        steamProfilesInterval: workerSettings.value.steamProfilesInterval,
        lastUpdated: new Date().toISOString()
      }
    };

    await updateSettings(updatedSettings);

    workerMessage.value = 'Server cache settings saved successfully!';
    workerMessageType.value = 'success';

    // Refresh query stats to reflect new interval
    await refreshQueryStats();
  } catch (err) {
    console.error('Failed to save worker settings:', err);
    workerMessage.value = err.data?.message || 'Failed to save worker settings';
    workerMessageType.value = 'error';
  } finally {
    savingWorkerSettings.value = false;

    // Clear message after 5 seconds
    setTimeout(() => {
      workerMessage.value = '';
    }, 5000);
  }
};

// Load data on mount
onMounted(async () => {
  try {
    console.log('Servers page mounted, checking authentication...');

    // Small delay to ensure proper initialization
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check authentication first
    const isAuth = await checkAuth();
    console.log('Authentication check result:', isAuth);

    if (!isAuth) {
      console.log('Not authenticated, redirecting to login');
      await navigateTo('/admin');
      return;
    }

    // Load servers after authentication is confirmed
    console.log('Authentication confirmed, loading servers...');
    await loadServers();

    // Load worker settings
    try {
      const settings = await getSettings();
      if (settings.cache) {
        workerSettings.value.serverStatusInterval = settings.cache.serverStatusInterval || 30;
        workerSettings.value.steamProfilesInterval = settings.cache.steamProfilesInterval || 3600;
      }
    } catch (settingsError) {
      console.warn('Failed to load worker settings:', settingsError);
    }

    // Initial refresh of query stats
    await refreshQueryStats();
  } catch (error) {
    console.error('Failed to initialize servers page:', error);
    await navigateTo('/admin');
  }
});
</script>
