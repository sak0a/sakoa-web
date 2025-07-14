// Composable for individual server status management with real-time updates
import { ref, reactive, onMounted, onUnmounted } from 'vue';

export const useServerStatus = () => {
  const servers = ref([]);
  const isLoading = ref(false);
  const error = ref(null);
  const lastUpdate = ref(null);
  
  // Individual server states
  const serverStates = reactive(new Map());
  
  // Intervals for each server
  const serverIntervals = new Map();

  // Global polling interval for checking async updates
  let globalPollInterval = null;
  
  // Cache settings
  const cacheSettings = ref({
    serverStatusInterval: 30 // Default 30 seconds
  });

  // Initialize server state
  const initializeServerState = (serverId, serverData) => {
    if (!serverStates.has(serverId)) {
      serverStates.set(serverId, {
        id: serverId,
        status: 'checking', // checking, online, offline
        name: serverData.name,
        map: 'Unknown',
        maxplayers: 24,
        players: [],
        location: serverData.location,
        connectUrl: serverData.connectUrl,
        comingSoon: serverData.comingSoon || false,
        lastChecked: null,
        nextCheck: null,
        error: null,
        isQuerying: false
      });
    }
  };

  // Get cache settings from admin settings
  const loadCacheSettings = async () => {
    try {
      const response = await $fetch('/api/admin/settings');
      if (response.success && response.settings.cache) {
        cacheSettings.value.serverStatusInterval = response.settings.cache.serverStatusInterval || 30;
      }
    } catch (error) {
      console.warn('Failed to load cache settings, using defaults:', error);
    }
  };

  // Query individual server
  const queryIndividualServer = async (serverId, forceRefresh = false) => {
    const serverState = serverStates.get(serverId);
    if (!serverState) return;

    // Set checking state only if not already checking
    if (serverState.status !== 'checking') {
      serverState.status = 'checking';
      serverState.isQuerying = true;
      serverState.error = null;
    }

    try {
      console.log(`Querying server ${serverId}...`);

      const response = await $fetch('/api/server-status', {
        query: {
          serverId,
          force: forceRefresh ? 'true' : 'false'
        }
      });

      if (response.server) {
        // Update server state with fresh data
        Object.assign(serverState, {
          status: response.server.status,
          name: response.server.name,
          map: response.server.map,
          maxplayers: response.server.maxplayers,
          players: response.server.players || [],
          error: response.server.error || null,
          lastChecked: new Date(response.cache.timestamp),
          nextCheck: new Date(Date.now() + (cacheSettings.value.serverStatusInterval * 1000)),
          isQuerying: false
        });

        console.log(`Server ${serverId} status updated:`, serverState.status);
      }
    } catch (error) {
      console.error(`Failed to query server ${serverId}:`, error);

      // Set offline state on error
      Object.assign(serverState, {
        status: 'offline',
        error: error.message || 'Failed to connect to server',
        lastChecked: new Date(),
        nextCheck: new Date(Date.now() + (cacheSettings.value.serverStatusInterval * 1000)),
        isQuerying: false
      });
    }
  };

  // Poll for status updates (checks for async query completions)
  const pollForUpdates = async () => {
    try {
      const response = await $fetch('/api/server-status');

      if (response.servers) {
        for (const serverData of response.servers) {
          const serverState = serverStates.get(serverData.id);
          if (serverState) {
            // Only update if status actually changed or if we have real data
            if (serverData.cache.source !== 'checking' &&
                (serverState.status !== serverData.status || serverState.status === 'checking')) {

              Object.assign(serverState, {
                status: serverData.status,
                name: serverData.name,
                map: serverData.map,
                maxplayers: serverData.maxplayers,
                players: serverData.players || [],
                error: serverData.error || null,
                lastChecked: new Date(serverData.cache.timestamp),
                nextCheck: new Date(Date.now() + (cacheSettings.value.serverStatusInterval * 1000)),
                isQuerying: false
              });

              console.log(`Server ${serverData.id} status updated via polling:`, serverData.status);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to poll for server updates:', error);
    }
  };

  // Start global polling if not already running
  const startGlobalPolling = () => {
    if (!globalPollInterval) {
      globalPollInterval = setInterval(() => {
        pollForUpdates();
      }, 2000); // Poll every 2 seconds for async updates
      console.log('Started global polling for server updates');
    }
  };

  // Stop global polling
  const stopGlobalPolling = () => {
    if (globalPollInterval) {
      clearInterval(globalPollInterval);
      globalPollInterval = null;
      console.log('Stopped global polling');
    }
  };

  // Start monitoring a server
  const startServerMonitoring = (serverId, serverData) => {
    // Initialize server state
    initializeServerState(serverId, serverData);

    // Clear existing interval if any
    if (serverIntervals.has(serverId)) {
      clearInterval(serverIntervals.get(serverId));
    }

    // Query immediately
    queryIndividualServer(serverId);

    // Set up recurring queries
    const queryInterval = setInterval(() => {
      queryIndividualServer(serverId);
    }, cacheSettings.value.serverStatusInterval * 1000);

    serverIntervals.set(serverId, queryInterval);
    console.log(`Started monitoring server ${serverId} with ${cacheSettings.value.serverStatusInterval}s interval`);

    // Start global polling for all servers
    startGlobalPolling();
  };

  // Stop monitoring a server
  const stopServerMonitoring = (serverId) => {
    if (serverIntervals.has(serverId)) {
      clearInterval(serverIntervals.get(serverId));
      serverIntervals.delete(serverId);
      console.log(`Stopped monitoring server ${serverId}`);

      // Stop global polling if no servers are being monitored
      if (serverIntervals.size === 0) {
        stopGlobalPolling();
      }
    }
  };

  // Force refresh a specific server
  const forceRefreshServer = async (serverId) => {
    await queryIndividualServer(serverId, true);
  };

  // Force refresh all servers
  const forceRefreshAll = async () => {
    const promises = Array.from(serverStates.keys()).map(serverId => 
      queryIndividualServer(serverId, true)
    );
    await Promise.all(promises);
  };

  // Get all servers from API and start monitoring
  const initializeServers = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      // Load cache settings first
      await loadCacheSettings();

      // Get server list (this will return basic server info)
      const response = await $fetch('/api/server-status');
      
      if (response.servers) {
        servers.value = response.servers;
        
        // Start monitoring each server individually
        for (const server of response.servers) {
          startServerMonitoring(server.id, server);
        }
        
        lastUpdate.value = new Date();
      }
    } catch (err) {
      console.error('Failed to initialize servers:', err);
      error.value = err.message || 'Failed to load server status';
    } finally {
      isLoading.value = false;
    }
  };

  // Update cache settings and restart monitoring
  const updateCacheSettings = async (newSettings) => {
    cacheSettings.value = { ...cacheSettings.value, ...newSettings };
    
    // Restart all server monitoring with new intervals
    for (const [serverId, serverData] of serverStates) {
      stopServerMonitoring(serverId);
      startServerMonitoring(serverId, {
        name: serverData.name,
        location: serverData.location,
        connectUrl: serverData.connectUrl,
        comingSoon: serverData.comingSoon
      });
    }
  };

  // Get server state by ID
  const getServerState = (serverId) => {
    return serverStates.get(serverId);
  };

  // Get all server states as array
  const getAllServerStates = () => {
    return Array.from(serverStates.values());
  };

  // Cleanup function
  const cleanup = () => {
    // Clear all intervals
    for (const [serverId] of serverIntervals) {
      stopServerMonitoring(serverId);
    }
    stopGlobalPolling();
    serverStates.clear();
  };

  // Auto-initialize on mount
  onMounted(() => {
    initializeServers();
  });

  // Cleanup on unmount
  onUnmounted(() => {
    cleanup();
  });

  return {
    // Reactive data
    servers: readonly(servers),
    isLoading: readonly(isLoading),
    error: readonly(error),
    lastUpdate: readonly(lastUpdate),
    cacheSettings: readonly(cacheSettings),
    
    // Server states
    getServerState,
    getAllServerStates,
    
    // Actions
    initializeServers,
    forceRefreshServer,
    forceRefreshAll,
    updateCacheSettings,
    startServerMonitoring,
    stopServerMonitoring,
    cleanup
  };
};
