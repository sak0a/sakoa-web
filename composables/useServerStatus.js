export const useServerStatus = () => {
  const servers = ref([]);
  const isLoading = ref(false);
  const error = ref(null);
  const lastUpdate = ref(null);
  const serverStates = reactive(new Map());
  const cacheSettings = ref({ serverStatusInterval: 30 });
  let refreshInterval = null;

  function applyServer(server) {
    const previous = serverStates.get(server.id) || {};
    serverStates.set(server.id, {
      ...previous,
      ...server,
      players: server.players || [],
      lastChecked: server.cache?.timestamp
        ? new Date(server.cache.timestamp)
        : new Date(),
      nextCheck: new Date(Date.now() + cacheSettings.value.serverStatusInterval * 1000),
      isQuerying: false
    });
  }

  async function fetchAll(force = false) {
    const response = await $fetch('/api/server-status', {
      query: force ? { force: 'true' } : undefined
    });
    for (const server of response.servers || []) applyServer(server);
    servers.value = response.servers || [];
    lastUpdate.value = new Date();
  }

  function restartPolling() {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = setInterval(() => {
      fetchAll().catch((refreshError) => {
        error.value = refreshError?.data?.statusMessage || 'Could not refresh server status';
      });
    }, cacheSettings.value.serverStatusInterval * 1000);
  }

  async function initializeServers() {
    isLoading.value = true;
    error.value = null;
    try {
      const settings = await $fetch('/api/settings').catch(() => null);
      const configuredInterval = Number(settings?.data?.cache?.serverStatusInterval);
      if (Number.isFinite(configuredInterval)) {
        cacheSettings.value.serverStatusInterval = Math.min(
          Math.max(configuredInterval, 10),
          3600
        );
      }
      await fetchAll();
      restartPolling();
    } catch (initializationError) {
      error.value = initializationError?.data?.statusMessage || 'Could not load server status';
    } finally {
      isLoading.value = false;
    }
  }

  async function forceRefreshServer(serverId) {
    const current = serverStates.get(serverId);
    if (current) current.isQuerying = true;

    try {
      const response = await $fetch('/api/server-status', {
        query: { serverId, force: 'true' }
      });
      if (response.server) applyServer(response.server);
    } finally {
      const latest = serverStates.get(serverId);
      if (latest) latest.isQuerying = false;
    }
  }

  async function forceRefreshAll() {
    for (const state of serverStates.values()) state.isQuerying = true;
    try {
      await fetchAll(true);
    } finally {
      for (const state of serverStates.values()) state.isQuerying = false;
    }
  }

  function updateCacheSettings(nextSettings) {
    const interval = Number(nextSettings?.serverStatusInterval);
    if (Number.isFinite(interval)) {
      cacheSettings.value.serverStatusInterval = Math.min(Math.max(interval, 10), 3600);
      restartPolling();
    }
  }

  function initializeServerState(serverId, serverData) {
    if (!serverStates.has(serverId)) applyServer({ ...serverData, id: serverId });
  }

  function startServerMonitoring(serverId, serverData) {
    initializeServerState(serverId, serverData);
  }

  function stopServerMonitoring() {
    // A single shared interval refreshes all configured servers.
  }

  function cleanup() {
    if (refreshInterval) clearInterval(refreshInterval);
    refreshInterval = null;
    serverStates.clear();
  }

  onMounted(initializeServers);
  onUnmounted(cleanup);

  return {
    servers: readonly(servers),
    isLoading: readonly(isLoading),
    error: readonly(error),
    lastUpdate: readonly(lastUpdate),
    cacheSettings: readonly(cacheSettings),
    getServerState: (serverId) => serverStates.get(serverId),
    getAllServerStates: () => Array.from(serverStates.values()),
    initializeServers,
    forceRefreshServer,
    forceRefreshAll,
    updateCacheSettings,
    startServerMonitoring,
    stopServerMonitoring,
    cleanup
  };
};
