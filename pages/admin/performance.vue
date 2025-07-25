<template>
  <div class="min-h-screen bg-gray-900">
    <AdminLayout>
      <div class="p-6">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-white mb-2">Performance Monitoring</h1>
          <p class="text-gray-400">Monitor Core Web Vitals and website performance metrics</p>
        </div>

        <!-- Performance Score -->
        <div class="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 mb-8">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-white">Performance Score</h2>
            <div class="flex items-center space-x-4">
              <div class="text-4xl font-bold" :class="getScoreColor(performanceScore)">
                {{ performanceScore }}
              </div>
              <div class="text-2xl font-bold" :class="getGradeColor(performanceGrade)">
                {{ performanceGrade }}
              </div>
            </div>
          </div>
          
          <div class="w-full bg-gray-700 rounded-full h-3 mb-4">
            <div 
              class="h-3 rounded-full transition-all duration-500"
              :class="getScoreBarColor(performanceScore)"
              :style="{ width: `${performanceScore}%` }"
            ></div>
          </div>
        </div>

        <!-- Core Web Vitals -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div class="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <h3 class="text-lg font-medium text-white mb-2">First Contentful Paint</h3>
            <div class="text-3xl font-bold mb-2" :class="getMetricColor(metrics.fcp, [1800, 3000])">
              {{ formatTime(metrics.fcp) }}
            </div>
            <p class="text-sm text-gray-400">Good: &lt;1.8s</p>
          </div>

          <div class="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <h3 class="text-lg font-medium text-white mb-2">Largest Contentful Paint</h3>
            <div class="text-3xl font-bold mb-2" :class="getMetricColor(metrics.lcp, [2500, 4000])">
              {{ formatTime(metrics.lcp) }}
            </div>
            <p class="text-sm text-gray-400">Good: &lt;2.5s</p>
          </div>

          <div class="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <h3 class="text-lg font-medium text-white mb-2">First Input Delay</h3>
            <div class="text-3xl font-bold mb-2" :class="getMetricColor(metrics.fid, [100, 300])">
              {{ formatTime(metrics.fid) }}
            </div>
            <p class="text-sm text-gray-400">Good: &lt;100ms</p>
          </div>

          <div class="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <h3 class="text-lg font-medium text-white mb-2">Cumulative Layout Shift</h3>
            <div class="text-3xl font-bold mb-2" :class="getMetricColor(metrics.cls * 1000, [100, 250])">
              {{ formatCLS(metrics.cls) }}
            </div>
            <p class="text-sm text-gray-400">Good: &lt;0.1</p>
          </div>
        </div>

        <!-- System Information -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div class="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <h3 class="text-lg font-medium text-white mb-4">Memory Usage</h3>
            <div v-if="memoryInfo" class="space-y-3">
              <div class="flex justify-between">
                <span class="text-gray-300">Used:</span>
                <span class="text-white font-medium">{{ memoryInfo.used }} MB</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-300">Total:</span>
                <span class="text-white font-medium">{{ memoryInfo.total }} MB</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-300">Limit:</span>
                <span class="text-white font-medium">{{ memoryInfo.limit }} MB</span>
              </div>
              <div class="w-full bg-gray-700 rounded-full h-2 mt-3">
                <div 
                  class="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  :style="{ width: `${(memoryInfo.used / memoryInfo.total) * 100}%` }"
                ></div>
              </div>
            </div>
            <div v-else class="text-gray-400">Memory info not available</div>
          </div>

          <div class="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <h3 class="text-lg font-medium text-white mb-4">Network Information</h3>
            <div v-if="networkInfo" class="space-y-3">
              <div class="flex justify-between">
                <span class="text-gray-300">Connection:</span>
                <span class="text-white font-medium">{{ networkInfo.effectiveType }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-300">Downlink:</span>
                <span class="text-white font-medium">{{ networkInfo.downlink }} Mbps</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-300">RTT:</span>
                <span class="text-white font-medium">{{ networkInfo.rtt }} ms</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-300">Data Saver:</span>
                <span class="text-white font-medium">{{ networkInfo.saveData ? 'On' : 'Off' }}</span>
              </div>
            </div>
            <div v-else class="text-gray-400">Network info not available</div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex space-x-4">
          <button
            @click="refreshMetrics"
            :disabled="isRefreshing"
            class="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {{ isRefreshing ? 'Refreshing...' : 'Refresh Metrics' }}
          </button>
          
          <button
            @click="generateReport"
            class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Generate Report
          </button>
        </div>
      </div>
    </AdminLayout>
  </div>
</template>

<script setup>
definePageMeta({
  layout: false
});

const { checkAuth } = useAdmin();
const { 
  metrics, 
  getPerformanceScore, 
  getPerformanceGrade, 
  getMemoryUsage, 
  getNetworkInfo,
  reportPerformance,
  init 
} = usePerformance();

const isRefreshing = ref(false);
const performanceScore = ref(0);
const performanceGrade = ref('F');
const memoryInfo = ref(null);
const networkInfo = ref(null);

// Format time values
const formatTime = (value) => {
  if (!value) return 'N/A';
  if (value < 1000) return `${Math.round(value)}ms`;
  return `${(value / 1000).toFixed(1)}s`;
};

// Format CLS value
const formatCLS = (value) => {
  if (!value) return 'N/A';
  return value.toFixed(3);
};

// Get color based on metric thresholds
const getMetricColor = (value, thresholds) => {
  if (!value) return 'text-gray-400';
  if (value <= thresholds[0]) return 'text-green-400';
  if (value <= thresholds[1]) return 'text-yellow-400';
  return 'text-red-400';
};

// Get score color
const getScoreColor = (score) => {
  if (score >= 90) return 'text-green-400';
  if (score >= 80) return 'text-yellow-400';
  return 'text-red-400';
};

// Get grade color
const getGradeColor = (grade) => {
  if (grade === 'A') return 'text-green-400';
  if (grade === 'B' || grade === 'C') return 'text-yellow-400';
  return 'text-red-400';
};

// Get score bar color
const getScoreBarColor = (score) => {
  if (score >= 90) return 'bg-green-500';
  if (score >= 80) return 'bg-yellow-500';
  return 'bg-red-500';
};

// Refresh metrics
const refreshMetrics = async () => {
  isRefreshing.value = true;
  
  try {
    // Wait a bit for new measurements
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    performanceScore.value = getPerformanceScore();
    performanceGrade.value = getPerformanceGrade();
    memoryInfo.value = getMemoryUsage();
    networkInfo.value = getNetworkInfo();
  } catch (error) {
    console.error('Failed to refresh metrics:', error);
  } finally {
    isRefreshing.value = false;
  }
};

// Generate performance report
const generateReport = () => {
  const report = reportPerformance();
  
  // Create downloadable report
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Initialize
onMounted(async () => {
  await checkAuth();
  init();
  
  // Initial load
  await refreshMetrics();
  
  // Auto-refresh every 30 seconds
  const interval = setInterval(refreshMetrics, 30000);
  
  onUnmounted(() => {
    clearInterval(interval);
  });
});
</script>
