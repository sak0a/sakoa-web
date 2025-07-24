<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto">
    <!-- Backdrop -->
    <div 
      class="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
      @click="closeModal"
    ></div>
    
    <!-- Modal -->
    <div class="flex min-h-full items-center justify-center p-4">
      <div 
        class="relative w-full max-w-4xl bg-gray-800/90 backdrop-blur-lg rounded-xl shadow-2xl border border-gray-600 transform transition-all"
        @click.stop
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-600">
          <div class="flex items-center">
            <div class="bg-purple-600/20 p-2 rounded-lg mr-3">
              <svg class="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path>
              </svg>
            </div>
            <div>
              <h2 class="text-xl font-semibold text-white">Server Information</h2>
              <p class="text-gray-400 text-sm">System details and runtime information</p>
            </div>
          </div>
          <button
            @click="closeModal"
            class="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 max-h-[70vh] overflow-y-auto">
          <div v-if="loading" class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
            <span class="ml-3 text-gray-400">Loading system information...</span>
          </div>

          <div v-else-if="error" class="text-center py-12">
            <div class="bg-red-500/20 text-red-400 p-4 rounded-lg">
              <p class="font-medium">Failed to load system information</p>
              <p class="text-sm mt-1">{{ error }}</p>
            </div>
          </div>

          <div v-else-if="systemInfo" class="space-y-6">
            <!-- Operating System -->
            <div class="bg-gray-700/50 rounded-lg p-4">
              <h3 class="text-lg font-semibold text-white mb-3 flex items-center">
                <svg class="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                Operating System
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-2">
                  <div class="flex justify-between">
                    <span class="text-gray-400">Platform:</span>
                    <span class="text-white">{{ systemInfo.os.platform }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-400">Type:</span>
                    <span class="text-white">{{ systemInfo.os.type }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-400">Release:</span>
                    <span class="text-white">{{ systemInfo.os.release }}</span>
                  </div>
                </div>
                <div class="space-y-2">
                  <div class="flex justify-between">
                    <span class="text-gray-400">Architecture:</span>
                    <span class="text-white">{{ systemInfo.os.arch }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-400">Hostname:</span>
                    <span class="text-white">{{ systemInfo.os.hostname }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-400">Uptime:</span>
                    <span class="text-white">{{ systemInfo.os.uptime }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Node.js Process -->
            <div class="bg-gray-700/50 rounded-lg p-4">
              <h3 class="text-lg font-semibold text-white mb-3 flex items-center">
                <svg class="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                </svg>
                Node.js Process
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-2">
                  <div class="flex justify-between">
                    <span class="text-gray-400">Version:</span>
                    <span class="text-white">{{ systemInfo.process.version }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-400">Platform:</span>
                    <span class="text-white">{{ systemInfo.process.platform }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-400">Architecture:</span>
                    <span class="text-white">{{ systemInfo.process.arch }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-400">Process ID:</span>
                    <span class="text-white">{{ systemInfo.process.pid }}</span>
                  </div>
                </div>
                <div class="space-y-2">
                  <div class="flex justify-between">
                    <span class="text-gray-400">Uptime:</span>
                    <span class="text-white">{{ systemInfo.process.uptime }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-400">Environment:</span>
                    <span class="text-white">{{ systemInfo.process.nodeEnv }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-400">Working Dir:</span>
                    <span class="text-white text-xs">{{ systemInfo.process.cwd }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- CPU Information -->
            <div class="bg-gray-700/50 rounded-lg p-4">
              <h3 class="text-lg font-semibold text-white mb-3 flex items-center">
                <svg class="w-5 h-5 mr-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"></path>
                </svg>
                CPU Information
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="flex justify-between">
                  <span class="text-gray-400">Model:</span>
                  <span class="text-white text-sm">{{ systemInfo.cpu.model }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Cores:</span>
                  <span class="text-white">{{ systemInfo.cpu.cores }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Speed:</span>
                  <span class="text-white">{{ systemInfo.cpu.speed }} MHz</span>
                </div>
              </div>
            </div>

            <!-- Memory Information -->
            <div class="bg-gray-700/50 rounded-lg p-4">
              <h3 class="text-lg font-semibold text-white mb-3 flex items-center">
                <svg class="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                </svg>
                Memory Information
              </h3>
              <div class="space-y-4">
                <!-- System Memory -->
                <div>
                  <h4 class="text-white font-medium mb-2">System Memory</h4>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="flex justify-between">
                      <span class="text-gray-400">Total:</span>
                      <span class="text-white">{{ systemInfo.memory.total }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-400">Used:</span>
                      <span class="text-white">{{ systemInfo.memory.used }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-400">Free:</span>
                      <span class="text-white">{{ systemInfo.memory.free }}</span>
                    </div>
                  </div>
                  <div class="mt-2">
                    <div class="flex justify-between text-sm mb-1">
                      <span class="text-gray-400">Usage</span>
                      <span class="text-white">{{ systemInfo.memory.percentage }}%</span>
                    </div>
                    <div class="w-full bg-gray-600 rounded-full h-2">
                      <div 
                        class="bg-purple-500 h-2 rounded-full transition-all duration-300"
                        :style="{ width: systemInfo.memory.percentage + '%' }"
                      ></div>
                    </div>
                  </div>
                </div>

                <!-- Process Memory -->
                <div>
                  <h4 class="text-white font-medium mb-2">Process Memory</h4>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div class="flex justify-between">
                      <span class="text-gray-400">RSS:</span>
                      <span class="text-white">{{ systemInfo.memory.process.rss }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-400">Heap Total:</span>
                      <span class="text-white">{{ systemInfo.memory.process.heapTotal }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-400">Heap Used:</span>
                      <span class="text-white">{{ systemInfo.memory.process.heapUsed }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-400">External:</span>
                      <span class="text-white">{{ systemInfo.memory.process.external }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Disk Information -->
            <div v-if="systemInfo.disk.total !== 'N/A'" class="bg-gray-700/50 rounded-lg p-4">
              <h3 class="text-lg font-semibold text-white mb-3 flex items-center">
                <svg class="w-5 h-5 mr-2 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"></path>
                </svg>
                Disk Information
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                <div class="flex justify-between">
                  <span class="text-gray-400">Total:</span>
                  <span class="text-white">{{ systemInfo.disk.total }} GB</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Used:</span>
                  <span class="text-white">{{ systemInfo.disk.used }} GB</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Free:</span>
                  <span class="text-white">{{ systemInfo.disk.free }} GB</span>
                </div>
              </div>
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span class="text-gray-400">Usage</span>
                  <span class="text-white">{{ systemInfo.disk.percentage }}%</span>
                </div>
                <div class="w-full bg-gray-600 rounded-full h-2">
                  <div 
                    class="bg-orange-500 h-2 rounded-full transition-all duration-300"
                    :style="{ width: systemInfo.disk.percentage + '%' }"
                  ></div>
                </div>
              </div>
            </div>

            <!-- Load Average (Unix-like systems) -->
            <div v-if="systemInfo.loadAverage && systemInfo.loadAverage.length > 0" class="bg-gray-700/50 rounded-lg p-4">
              <h3 class="text-lg font-semibold text-white mb-3 flex items-center">
                <svg class="w-5 h-5 mr-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
                Load Average
              </h3>
              <div class="grid grid-cols-3 gap-4">
                <div class="text-center">
                  <div class="text-white text-lg font-semibold">{{ systemInfo.loadAverage[0]?.toFixed(2) }}</div>
                  <div class="text-gray-400 text-sm">1 min</div>
                </div>
                <div class="text-center">
                  <div class="text-white text-lg font-semibold">{{ systemInfo.loadAverage[1]?.toFixed(2) }}</div>
                  <div class="text-gray-400 text-sm">5 min</div>
                </div>
                <div class="text-center">
                  <div class="text-white text-lg font-semibold">{{ systemInfo.loadAverage[2]?.toFixed(2) }}</div>
                  <div class="text-gray-400 text-sm">15 min</div>
                </div>
              </div>
            </div>

            <!-- Timestamp -->
            <div class="text-center text-gray-400 text-sm">
              Last updated: {{ formatTimestamp(systemInfo.timestamp) }}
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex justify-end p-6 border-t border-gray-600">
          <button
            @click="refreshData"
            :disabled="loading"
            class="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white px-4 py-2 rounded-lg transition-colors mr-3 flex items-center"
          >
            <svg class="w-4 h-4 mr-2" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Refresh
          </button>
          <button
            @click="closeModal"
            class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close']);

const { getSystemInfo } = useAdmin();

const systemInfo = ref(null);
const loading = ref(false);
const error = ref(null);

const closeModal = () => {
  emit('close');
};

const loadSystemInfo = async () => {
  try {
    loading.value = true;
    error.value = null;
    systemInfo.value = await getSystemInfo();
  } catch (err) {
    error.value = err.message || 'Failed to load system information';
    console.error('Failed to load system info:', err);
  } finally {
    loading.value = false;
  }
};

const refreshData = () => {
  loadSystemInfo();
};

const formatTimestamp = (timestamp) => {
  return new Date(timestamp).toLocaleString();
};

// Load data when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    loadSystemInfo();
  }
});

// Handle escape key
onMounted(() => {
  const handleEscape = (e) => {
    if (e.key === 'Escape' && props.isOpen) {
      closeModal();
    }
  };
  
  document.addEventListener('keydown', handleEscape);
  
  onUnmounted(() => {
    document.removeEventListener('keydown', handleEscape);
  });
});
</script>
