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
          <h3 class="text-2xl font-bold text-white">Checking Server Status... 🔍</h3>
          <p class="text-blue-100 font-medium">Please wait while we connect</p>
        </div>
      </div>
    </div>

    <!-- Multiple Servers Display -->
    <div v-else-if="servers && servers.length > 0" class="space-y-6">
      <div v-for="server in servers" :key="server.id">
        <!-- Online Server -->
        <div v-if="server.status === 'online'" class="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 shadow-lg text-white relative">
          <!-- Coming Soon Badge -->
          <div v-if="server.comingSoon" class="absolute top-4 right-4 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold">
            Coming Soon
          </div>

          <div class="flex flex-col md:flex-row items-center justify-between mb-6">
            <div class="flex items-center mb-4 md:mb-0">
              <div class="mr-4">
                <div class="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-white">{{ server.name }}</h3>
                <p class="text-green-100 font-medium">🟢 Online</p>
                <p v-if="server.comingSoon" class="text-yellow-100 text-sm">Not public yet - Stay tuned!</p>
              </div>
            </div>
            <div>
              <a :href="server.connectUrl" class="bg-white text-green-600 hover:bg-green-50 transition-colors font-bold py-3 px-6 rounded-lg flex items-center shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z"/>
                </svg>
                Connect to Server
              </a>
            </div>
          </div>


          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div class="p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
              <h4 class="font-bold mb-2 text-white flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Current Map
              </h4>
              <p class="text-green-100">{{ server.map || 'Unknown' }}</p>
            </div>
            <div class="p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
              <h4 class="font-bold mb-2 text-white flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                Players
              </h4>
              <p class="text-green-100">{{ server.players?.length || 0 }} / {{ server.maxplayers || 24 }}</p>
            </div>
            <div class="p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
              <h4 class="font-bold mb-2 text-white flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Location
              </h4>
              <p class="text-green-100">{{ server.location }}</p>
            </div>
            <div class="p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
              <h4 class="font-bold mb-2 text-white flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Connect
              </h4>
              <p class="font-mono text-sm text-green-100">{{ server.connectUrl.replace('steam://connect/', '') }}</p>
            </div>
          </div>

          <!-- Player List -->
          <div v-if="server.players && server.players.length > 0" class="mt-6">
            <h4 class="font-bold mb-4 text-white flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Current Players
            </h4>
            <div class="rounded-lg overflow-hidden bg-white/10 backdrop-blur-sm border border-white/20">
              <table class="min-w-full">
                <thead class="bg-white/5">
                  <tr>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-green-200">Name</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-green-200">Score</th>
                    <th scope="col" class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-green-200">Time</th>
                  </tr>
                </thead>
                <tbody class="bg-white/5">
                  <tr v-for="(player, index) in server.players" :key="index" class="border-t border-white/10">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-white">{{ player.name || 'Unknown Player' }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-green-100">{{ player.score || 0 }}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-green-100">{{ formatTime(player.time) }}</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Offline Server -->
        <div v-else class="bg-gradient-to-r from-red-500 to-pink-600 rounded-xl p-6 shadow-lg text-white relative">
          <!-- Coming Soon Badge -->
          <div v-if="server.comingSoon" class="absolute top-4 right-4 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold">
            Coming Soon
          </div>

          <div class="text-center">
            <div class="flex items-center justify-center mb-6">
              <div class="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-white">{{ server.name }}</h3>
                <p class="text-red-100 font-medium">🔴 Offline</p>
                <p v-if="server.comingSoon" class="text-yellow-100 text-sm">Not public yet - Stay tuned!</p>
              </div>
            </div>
            <p class="text-lg mb-6 text-red-100">
              The server appears to be offline or unreachable at the moment. You can still try to connect directly, or check our Discord for updates.
            </p>
            <div class="flex flex-col sm:flex-row gap-4 justify-center">
              <a :href="server.connectUrl" class="bg-white text-red-600 hover:bg-red-50 transition-colors font-bold py-3 px-6 rounded-lg flex items-center justify-center shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.454 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.253 0-2.265-1.014-2.265-2.265z"/>
                </svg>
                Try to Connect Anyway
              </a>
              <a href="https://discord.gg/JuxYYVEkzc" target="_blank" rel="noopener noreferrer" class="bg-[#5865F2] text-white hover:bg-[#4752C4] transition-colors font-bold py-3 px-6 rounded-lg flex items-center justify-center shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="mr-2">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                Join Discord
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error fallback -->
    <div v-else class="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-6 shadow-lg text-white">
      <div class="text-center">
        <div class="flex items-center justify-center mb-6">
          <div class="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h3 class="text-2xl font-bold text-white">Unable to Load Server Status</h3>
            <p class="text-orange-100 font-medium">Please try refreshing the page</p>
          </div>
        </div>
        <p class="text-lg mb-6 text-orange-100">
          We're having trouble loading the server status right now. Please refresh the page or check our Discord for updates.
        </p>
        <div class="flex justify-center">
          <a href="https://discord.gg/JuxYYVEkzc" target="_blank" rel="noopener noreferrer" class="bg-[#5865F2] text-white hover:bg-[#4752C4] transition-colors font-bold py-3 px-6 rounded-lg flex items-center justify-center shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="mr-2">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            Join Discord
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const servers = ref([]);
const loading = ref(true);
const error = ref(null);

onMounted(async () => {
  try {
    // Try to fetch server status from API
    try {
      const response = await fetch('/api/server-status');
      const data = await response.json();

      if (data.servers && Array.isArray(data.servers)) {
        servers.value = data.servers;
      } else {
        error.value = 'Invalid server data format';
      }
    } catch (apiError) {
      console.warn('Server status API error:', apiError);

      // Fallback to mock data for development
      servers.value = [
        {
          id: 'main',
          status: 'online',
          name: "𝘴𝘢𝘬𝘢 Dodgeball Server",
          map: "db_dustbowl_v2",
          maxplayers: 24,
          players: [
            { name: "Player1", score: 15, time: 3600 },
            { name: "Player2", score: 12, time: 1800 },
            { name: "saka", score: 25, time: 7200 }
          ],
          location: '🇩🇪 Frankfurt',
          connectUrl: 'steam://connect/45.81.234.145:27015',
          comingSoon: false
        },
        {
          id: 'advanced',
          status: 'online',
          name: "𝘴𝘢𝘬𝘢 Dodgeball Server - Advanced",
          map: "tfdb_rocketbucks_v2",
          maxplayers: 16,
          players: [],
          location: '🇩🇪 Frankfurt',
          connectUrl: 'steam://connect/37.114.54.74:27015',
          comingSoon: true
        }
      ];
    }
  } catch (err) {
    error.value = err.message;
    servers.value = [];
  } finally {
    loading.value = false;
  }
});

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
</script>
