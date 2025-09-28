export const useHeroStats = () => {
  const heroStats = ref({
    uptime: '24/7',
    activePlayers: 1247,
    monthlyDonations: 17.5,
    monthlyGoal: 30,
    autoUpdateDonations: false,
    autoUpdatePlayers: false
  });

  const isLoading = ref(false);
  const error = ref(null);

  // Fetch hero statistics from settings
  const fetchHeroStats = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await $fetch('/api/settings');

      if (response.success && response.data?.heroStats) {
        heroStats.value = {
          uptime: response.data.heroStats.uptime || '24/7',
          activePlayers: response.data.heroStats.activePlayers || 1247,
          monthlyDonations: response.data.heroStats.monthlyDonations || 17.5,
          monthlyGoal: response.data.heroStats.monthlyGoal || 30,
          autoUpdateDonations: response.data.heroStats.autoUpdateDonations || false,
          autoUpdatePlayers: response.data.heroStats.autoUpdatePlayers || false
        };

        // If auto-update is enabled, fetch real-time data
        if (response.data.heroStats.autoUpdateDonations) {
          await updateDonationAmount();
        }

        if (response.data.heroStats.autoUpdatePlayers) {
          await updatePlayerCount();
        }
      }
    } catch (err) {
      console.error('Failed to fetch hero stats:', err);
      error.value = err;
      // Use default values on error
      heroStats.value = {
        uptime: '24/7',
        activePlayers: 1247,
        monthlyDonations: 17.5,
        monthlyGoal: 30,
        autoUpdateDonations: false,
        autoUpdatePlayers: false
      };
    } finally {
      isLoading.value = false;
    }
  };

  // Update donation amount from database
  const updateDonationAmount = async () => {
    try {
      const response = await $fetch('/api/donors');
      if (response.donors && Array.isArray(response.donors)) {
        // Calculate current month's donations
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const monthlyTotal = response.donors.reduce((total, donor) => {
          if (donor.donations && Array.isArray(donor.donations)) {
            const monthlyDonations = donor.donations.filter(donation => {
              const donationDate = new Date(donation.date || donation.donation_date);
              return donationDate.getMonth() === currentMonth && 
                     donationDate.getFullYear() === currentYear;
            });
            
            const monthlyAmount = monthlyDonations.reduce((sum, donation) => {
              return sum + (parseFloat(donation.amount) || 0);
            }, 0);
            
            return total + monthlyAmount;
          }
          return total;
        }, 0);

        heroStats.value.monthlyDonations = Math.round(monthlyTotal * 100) / 100;
      }
    } catch (err) {
      console.warn('Failed to update donation amount:', err);
    }
  };

  // Update player count from server stats and leaderboard
  const updatePlayerCount = async () => {
    try {
      // Get real-time server status for current online players
      const serverResponse = await $fetch('/api/server-status');
      let currentOnlinePlayers = 0;

      if (serverResponse.servers && Array.isArray(serverResponse.servers)) {
        // Sum up players from all online servers
        currentOnlinePlayers = serverResponse.servers.reduce((total, server) => {
          if (server.status === 'online' && server.players) {
            return total + server.players.length;
          }
          return total;
        }, 0);
      }

      // Get total unique players from leaderboard for historical data
      const leaderboardResponse = await $fetch('/api/leaderboard');
      let totalUniquePlayers = 0;

      if (leaderboardResponse.players && Array.isArray(leaderboardResponse.players)) {
        totalUniquePlayers = leaderboardResponse.players.length;
      }

      // Use the higher number between current online players and a portion of total unique players
      // This gives a more realistic "active players" count
      const estimatedActivePlayers = Math.max(
        currentOnlinePlayers,
        Math.min(totalUniquePlayers, Math.floor(totalUniquePlayers * 0.1)) // 10% of total as "active"
      );

      heroStats.value.activePlayers = estimatedActivePlayers;
    } catch (err) {
      console.warn('Failed to update player count:', err);
    }
  };

  // Format player count for display
  const formatPlayerCount = (count) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  // Format donation amount for display
  const formatDonationAmount = (amount) => {
    return `€${amount}`;
  };

  // Get real-time server statistics
  const getRealTimeServerStats = async () => {
    try {
      const response = await $fetch('/api/server-status');
      if (response.servers && Array.isArray(response.servers)) {
        const onlineServers = response.servers.filter(server => server.status === 'online');
        const totalOnlinePlayers = onlineServers.reduce((total, server) => {
          return total + (server.players ? server.players.length : 0);
        }, 0);

        return {
          onlineServers: onlineServers.length,
          totalServers: response.servers.length,
          onlinePlayers: totalOnlinePlayers,
          servers: response.servers
        };
      }
    } catch (err) {
      console.warn('Failed to get real-time server stats:', err);
    }

    return {
      onlineServers: 0,
      totalServers: 0,
      onlinePlayers: 0,
      servers: []
    };
  };

  // Auto-refresh functionality
  let refreshInterval = null;

  const startAutoRefresh = (intervalMinutes = 5) => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }

    refreshInterval = setInterval(async () => {
      if (heroStats.value.autoUpdateDonations) {
        await updateDonationAmount();
      }

      if (heroStats.value.autoUpdatePlayers) {
        await updatePlayerCount();
      }
    }, intervalMinutes * 60 * 1000);
  };

  const stopAutoRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  };

  return {
    heroStats: readonly(heroStats),
    isLoading: readonly(isLoading),
    error: readonly(error),
    fetchHeroStats,
    updateDonationAmount,
    updatePlayerCount,
    getRealTimeServerStats,
    formatPlayerCount,
    formatDonationAmount,
    startAutoRefresh,
    stopAutoRefresh
  };
};
