<template>
  <div>
    <!-- Loading State -->
    <div v-if="loading" class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 shadow-lg text-white">
      <div class="flex items-center justify-center">
        <div class="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mr-4 animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <div>
          <h3 class="text-2xl font-bold text-white">Loading Server Status...</h3>
          <p class="text-blue-100">Please wait while we check our servers</p>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 shadow-lg text-white">
      <div class="flex items-center justify-center">
        <div class="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mr-4">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div>
          <h3 class="text-2xl font-bold text-white">Error Loading Servers</h3>
          <p class="text-red-100">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Server List -->
    <div v-else class="space-y-6">
      <div v-for="server in servers" :key="server.id" class="relative">
        <!-- Online Server -->
        <div v-if="server.status === 'online'" class="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 shadow-lg text-white relative">
          <!-- Coming Soon Badge -->
          <div v-if="server.comingSoon" class="absolute top-4 right-4 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold">
            Coming Soon
          </div>

          <!-- Last Checked Timestamp -->
          <div class="absolute top-4 left-4 bg-white/20 text-white px-3 py-1 rounded-full text-xs">
            Last checked: {{ formatLastChecked(server.lastChecked) }}
          </div>

          <div class="flex flex-col md:flex-row items-center justify-between mb-6 mt-8">
            <div class="flex items-center mb-4 md:mb-0">
              <div class="mr-4">
                <div class="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-white">{{ server.name }}</h3>
                <p v-if="server.comingSoon" class="text-green-100 text-sm">Not public yet - Stay tuned!</p>
              </div>
            </div>
            <div>
              <a 
                :href="server.connectUrl" 
                :class="server.comingSoon ? 'bg-white/20 text-white opacity-50 cursor-not-allowed' : 'bg-white text-green-600 hover:bg-green-50'"
                class="font-bold py-3 px-6 rounded-lg flex items-center shadow-lg transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z"/>
                </svg>
                {{ server.comingSoon ? 'Coming Soon' : 'Connect to Server' }}
              </a>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div class="bg-white/10 rounded-lg p-4">
              <p class="text-green-100 text-sm">Map</p>
              <p class="text-white font-bold">{{ server.map }}</p>
            </div>
            <div class="bg-white/10 rounded-lg p-4">
              <p class="text-green-100 text-sm">Players</p>
              <p class="text-white font-bold">{{ server.players.length }}/{{ server.maxplayers }}</p>
            </div>
            <div class="bg-white/10 rounded-lg p-4">
              <p class="text-green-100 text-sm">Location</p>
              <p class="text-white font-bold">{{ server.location }}</p>
            </div>
          </div>

          <!-- Player List -->
          <div v-if="server.players && server.players.length > 0" class="mt-6">
            <h4 class="text-lg font-semibold text-white mb-3">Players Online</h4>
            <div class="bg-white/10 rounded-lg p-4">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                <div v-for="player in server.players" :key="player.name" class="flex justify-between items-center bg-white/10 rounded px-3 py-2">
                  <span class="text-white font-medium">{{ player.name }}</span>
                  <div class="text-right">
                    <div class="text-green-200 text-sm">{{ player.score }} pts</div>
                    <div class="text-green-300 text-xs">{{ formatPlayerTime(player.time) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Checking Server -->
        <div v-else-if="server.status === 'checking'" class="bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl p-6 shadow-lg text-white relative">
          <!-- Coming Soon Badge -->
          <div v-if="server.comingSoon" class="absolute top-4 right-4 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold">
            Coming Soon
          </div>

          <!-- Last Checked Timestamp -->
          <div class="absolute top-4 left-4 bg-white/20 text-white px-3 py-1 rounded-full text-xs">
            Checking server...
          </div>

          <div class="flex flex-col md:flex-row items-center justify-between mb-6 mt-8">
            <div class="flex items-center mb-4 md:mb-0">
              <div class="mr-4">
                <div class="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center animate-pulse">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-white">{{ server.name }}</h3>
                <p class="text-yellow-100 font-medium">🔄 Checking...</p>
                <p v-if="server.comingSoon" class="text-yellow-100 text-sm">Not public yet - Stay tuned!</p>
              </div>
            </div>
            <div>
              <div class="bg-white/20 text-white font-bold py-3 px-6 rounded-lg flex items-center shadow-lg opacity-50 cursor-not-allowed">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z"/>
                </svg>
                Checking...
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div class="bg-white/10 rounded-lg p-4">
              <p class="text-yellow-100 text-sm">Map</p>
              <p class="text-white font-bold">Checking...</p>
            </div>
            <div class="bg-white/10 rounded-lg p-4">
              <p class="text-yellow-100 text-sm">Players</p>
              <p class="text-white font-bold">-/-</p>
            </div>
            <div class="bg-white/10 rounded-lg p-4">
              <p class="text-yellow-100 text-sm">Location</p>
              <p class="text-white font-bold">{{ server.location }}</p>
            </div>
          </div>
        </div>

        <!-- Offline Server -->
        <div v-else class="bg-gradient-to-r from-red-500 to-pink-600 rounded-xl p-6 shadow-lg text-white relative">
          <!-- Coming Soon Badge -->
          <div v-if="server.comingSoon" class="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
            Coming Soon
          </div>

          <!-- Last Checked Timestamp -->
          <div class="absolute top-4 left-4 bg-white/20 text-white px-3 py-1 rounded-full text-xs">
            Last checked: {{ formatLastChecked(server.lastChecked) }}
          </div>

          <div class="flex flex-col md:flex-row items-center justify-between mb-6 mt-8">
            <div class="flex items-center mb-4 md:mb-0">
              <div class="mr-4">
                <div class="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-white">{{ server.name }}</h3>
                <p v-if="server.comingSoon" class="text-red-100 text-sm">Not public yet - Stay tuned!</p>
                <p v-else class="text-red-100 text-sm">
                  Server is currently offline. 
                  <a href="https://discord.gg/JuxYYVEkzc" class="underline hover:text-white transition-colors">
                    Join our Discord
                  </a> 
                  for updates!
                </p>
              </div>
            </div>
            <div>
              <div class="bg-white/20 text-white font-bold py-3 px-6 rounded-lg flex items-center shadow-lg opacity-50 cursor-not-allowed">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z"/>
                </svg>
                Server Offline
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div class="bg-white/10 rounded-lg p-4">
              <p class="text-red-100 text-sm">Map</p>
              <p class="text-white font-bold">-</p>
            </div>
            <div class="bg-white/10 rounded-lg p-4">
              <p class="text-red-100 text-sm">Players</p>
              <p class="text-white font-bold">0/{{ server.maxplayers }}</p>
            </div>
            <div class="bg-white/10 rounded-lg p-4">
              <p class="text-red-100 text-sm">Location</p>
              <p class="text-white font-bold">{{ server.location }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const {
  getAllServerStates,
  getServerState,
  isLoading,
  error
} = useServerStatus();

const servers = computed(() => getAllServerStates());
const loading = computed(() => isLoading.value);

// Format seconds into hours:minutes:seconds
const formatTime = (seconds) => {
  if (!seconds) return '00:00:00';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return [
    hours.toString().padStart(2, '0'),
    minutes.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0')
  ].join(':');
};

const formatPlayerTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

// Format last checked timestamp
const formatLastChecked = (timestamp) => {
  if (!timestamp) return 'Never';

  const now = new Date();
  const checked = new Date(timestamp);
  const diffMs = now - checked;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);

  if (diffSeconds < 60) {
    return `${diffSeconds}s ago`;
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else {
    return checked.toLocaleTimeString();
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'online':
      return 'text-green-400';
    case 'offline':
      return 'text-red-400';
    case 'checking':
      return 'text-yellow-400';
    default:
      return 'text-gray-400';
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'online':
      return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
    case 'offline':
      return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';
    case 'checking':
      return 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    default:
      return 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'online':
      return 'Online';
    case 'offline':
      return 'Offline';
    case 'checking':
      return 'Checking...';
    default:
      return 'Unknown';
  }
};
</script>
