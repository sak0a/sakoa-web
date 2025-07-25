<template>
  <div>
    <!-- Loading State -->
    <div v-if="loading" class="glass-card p-8 text-center">
      <div class="flex flex-col items-center justify-center space-y-6">
        <div class="relative">
          <div class="w-20 h-20 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm flex items-center justify-center animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div class="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 opacity-20 animate-ping"></div>
        </div>
        <div>
          <h3 class="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-1">
            Loading Server Status...
          </h3>
          <p class="text-gray-400 text-sm">Please wait while we check our servers</p>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="glass-card p-8 text-center border border-red-500/20">
      <div class="flex flex-col items-center justify-center space-y-6">
        <div class="relative">
          <div class="w-20 h-20 rounded-full bg-gradient-to-r from-red-500/20 to-orange-500/20 backdrop-blur-sm flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>
        <div>
          <h3 class="text-xl font-bold bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent mb-1">
            Error Loading Servers
          </h3>
          <p class="text-gray-400 text-sm">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Server List -->
    <div v-else class="space-y-6">
      <div v-for="server in servers" :key="server.id" class="relative">
        <!-- Online Server -->
        <div v-if="server.status === 'online'" class="glass-card p-8 relative border border-green-500/20 hover:border-green-500/40 transition-all duration-300 group">
          <!-- Status Indicator -->
          <div class="absolute top-6 right-6 flex items-center space-x-2">
            <div class="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span class="text-green-400 text-sm font-medium">ONLINE</span>
          </div>

          <!-- Coming Soon Badge -->
          <div v-if="server.comingSoon" class="absolute top-6 right-24 bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-3 py-1 rounded-full text-sm font-bold">
            Future Plans
          </div>

          <!-- Last Checked Timestamp -->
          <div class="absolute top-6 left-6 bg-white/10 backdrop-blur-sm text-gray-300 px-3 py-1 rounded-full text-xs border border-white/10">
            Last checked: {{ formatLastChecked(server.lastChecked) }}
          </div>

          <div class="flex flex-col md:flex-row items-center justify-between mb-6 mt-8">
            <div class="flex items-center mb-4 md:mb-0">
              <div class="mr-4">
                <div class="w-16 h-16 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-sm flex items-center justify-center border border-green-500/30 group-hover:border-green-500/50 transition-all duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 class="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-1">
                  {{ server.name }}
                </h3>
                <p v-if="server.comingSoon" class="text-gray-400 text-sm">Not public yet - Stay tuned!</p>
                <p v-else class="text-green-400 text-sm font-medium">Ready to play</p>
              </div>
            </div>
            <div>
              <a
                :href="server.connectUrl"
                :class="server.comingSoon ? 'bg-white/10 text-gray-400 cursor-not-allowed border-gray-600' : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 border-green-500/50 hover:border-green-400'"
                class="font-bold py-3 px-6 rounded-lg flex items-center shadow-lg transition-all duration-300 border backdrop-blur-sm group/btn"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 transition-transform group-hover/btn:scale-110" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z"/>
                </svg>
                {{ server.comingSoon ? 'Future Plans' : 'Connect to Server' }}
              </a>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div class="bg-white/[0.02] backdrop-blur-sm rounded-lg p-4 border border-white/[0.08] hover:border-white/20 transition-all duration-300">
              <div class="text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">Map</div>
              <div class="text-lg font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                {{ server.map }}
              </div>
            </div>
            <div class="bg-white/[0.02] backdrop-blur-sm rounded-lg p-4 border border-white/[0.08] hover:border-white/20 transition-all duration-300">
              <div class="text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">Players</div>
              <div class="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {{ server.players.length }}/{{ server.maxplayers }}
              </div>
            </div>
            <div class="bg-white/[0.02] backdrop-blur-sm rounded-lg p-4 border border-white/[0.08] hover:border-white/20 transition-all duration-300 relative">
              <div class="text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">Location</div>
              <div class="flex items-center justify-center space-x-2">
                <!-- German Flag -->
                <div class="w-6 h-4 rounded-sm overflow-hidden border border-gray-600">
                  <div class="h-1/3 bg-black"></div>
                  <div class="h-1/3 bg-red-600"></div>
                  <div class="h-1/3 bg-yellow-400"></div>
                </div>
                <span class="text-lg font-bold text-white">{{ server.location }}</span>
              </div>
            </div>
          </div>

          <!-- Player List -->
          <div v-if="server.players && server.players.length > 0" class="mt-6">
            <h4 class="text-lg font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-4">
              Players Online
            </h4>
            <div class="bg-white/[0.02] backdrop-blur-sm rounded-lg p-4 border border-white/[0.08]">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                <div v-for="player in server.players" :key="player.name" class="flex justify-between items-center bg-white/[0.02] backdrop-blur-sm rounded px-3 py-2 border border-white/[0.08] hover:border-white/20 transition-all duration-300">
                  <span class="text-white font-medium text-sm">{{ player.name }}</span>
                  <div class="text-right">
                    <div class="text-blue-400 text-sm font-medium">{{ player.score }} pts</div>
                    <div class="text-gray-400 text-xs">{{ formatPlayerTime(player.time) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Checking Server -->
        <div v-else-if="server.status === 'checking'" class="glass-card p-8 relative border border-yellow-500/20">
          <!-- Status Indicator -->
          <div class="absolute top-6 right-6 flex items-center space-x-2">
            <div class="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
            <span class="text-yellow-400 text-sm font-medium">CHECKING</span>
          </div>

          <!-- Coming Soon Badge -->
          <div v-if="server.comingSoon" class="absolute top-6 right-28 bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-3 py-1 rounded-full text-sm font-bold">
            Future Plans
          </div>

          <!-- Last Checked Timestamp -->
          <div class="absolute top-6 left-6 bg-white/10 backdrop-blur-sm text-gray-300 px-3 py-1 rounded-full text-xs border border-white/10">
            Checking server...
          </div>

          <div class="flex flex-col md:flex-row items-center justify-between mb-6 mt-8">
            <div class="flex items-center mb-4 md:mb-0">
              <div class="mr-4">
                <div class="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm flex items-center justify-center border border-yellow-500/30">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-yellow-400 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 class="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-1">
                  {{ server.name }}
                </h3>
                <p class="text-yellow-400 font-medium text-sm">🔄 Checking status...</p>
                <p v-if="server.comingSoon" class="text-gray-400 text-sm">Not public yet - Stay tuned!</p>
              </div>
            </div>
            <div>
              <div class="bg-white/10 backdrop-blur-sm text-gray-400 font-bold py-3 px-6 rounded-lg flex items-center shadow-lg border border-gray-600 cursor-not-allowed">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z"/>
                </svg>
                Checking...
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div class="bg-white/[0.02] backdrop-blur-sm rounded-lg p-4 border border-white/[0.08]">
              <div class="text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">Map</div>
              <div class="text-lg font-bold text-gray-500">
                Checking...
              </div>
            </div>
            <div class="bg-white/[0.02] backdrop-blur-sm rounded-lg p-4 border border-white/[0.08]">
              <div class="text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">Players</div>
              <div class="text-lg font-bold text-gray-500">
                -/-
              </div>
            </div>
            <div class="bg-white/[0.02] backdrop-blur-sm rounded-lg p-4 border border-white/[0.08]">
              <div class="text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">Location</div>
              <div class="flex items-center justify-center space-x-2">
                <!-- German Flag -->
                <div class="w-6 h-4 rounded-sm overflow-hidden border border-gray-600">
                  <div class="h-1/3 bg-black"></div>
                  <div class="h-1/3 bg-red-600"></div>
                  <div class="h-1/3 bg-yellow-400"></div>
                </div>
                <span class="text-lg font-bold text-white">{{ server.location || 'Unknown' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Offline Server -->
        <div v-else class="glass-card p-8 relative border border-red-500/20">
          <!-- Status Indicator -->
          <div class="absolute top-6 right-6 flex items-center space-x-2">
            <div class="w-3 h-3 bg-red-400 rounded-full"></div>
            <span class="text-red-400 text-sm font-medium">OFFLINE</span>
          </div>

          <!-- Coming Soon Badge -->
          <div v-if="server.comingSoon" class="absolute top-6 right-24 bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-bold">
            Future Plans
          </div>

          <!-- Last Checked Timestamp -->
          <div class="absolute top-6 left-6 bg-white/10 backdrop-blur-sm text-gray-300 px-3 py-1 rounded-full text-xs border border-white/10">
            Last checked: {{ formatLastChecked(server.lastChecked) }}
          </div>

          <div class="flex flex-col md:flex-row items-center justify-between mb-6 mt-8">
            <div class="flex items-center mb-4 md:mb-0">
              <div class="mr-4">
                <div class="w-16 h-16 rounded-full bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur-sm flex items-center justify-center border border-red-500/30">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 class="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-1">
                  {{ server.name }}
                </h3>
                <p v-if="server.comingSoon" class="text-gray-400 text-sm">Not public yet - Stay tuned!</p>
                <p v-else class="text-gray-400 text-sm">
                  Server is currently offline.
                  <a href="https://discord.gg/JuxYYVEkzc" class="text-blue-400 underline hover:text-blue-300 transition-colors">
                    Join our Discord
                  </a>
                  for updates!
                </p>
              </div>
            </div>
            <div>
              <div class="bg-white/10 backdrop-blur-sm text-gray-400 font-bold py-3 px-6 rounded-lg flex items-center shadow-lg border border-gray-600 cursor-not-allowed">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z"/>
                </svg>
                Server Offline
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div class="bg-white/[0.02] backdrop-blur-sm rounded-lg p-4 border border-white/[0.08]">
              <div class="text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">Map</div>
              <div class="text-lg font-bold text-gray-500">
                -
              </div>
            </div>
            <div class="bg-white/[0.02] backdrop-blur-sm rounded-lg p-4 border border-white/[0.08]">
              <div class="text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">Players</div>
              <div class="text-lg font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent">
                0/{{ server.maxplayers || '-' }}
              </div>
            </div>
            <div class="bg-white/[0.02] backdrop-blur-sm rounded-lg p-4 border border-white/[0.08]">
              <div class="text-gray-400 text-xs font-medium mb-1 uppercase tracking-wider">Location</div>
              <div class="flex items-center justify-center space-x-2">
                <!-- German Flag -->
                <div class="w-6 h-4 rounded-sm overflow-hidden border border-gray-600">
                  <div class="h-1/3 bg-black"></div>
                  <div class="h-1/3 bg-red-600"></div>
                  <div class="h-1/3 bg-yellow-400"></div>
                </div>
                <span class="text-lg font-bold text-white">{{ server.location || 'Unknown' }}</span>
              </div>
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
