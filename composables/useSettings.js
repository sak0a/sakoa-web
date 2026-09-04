export const useSettings = () => {
  const settings = ref(null);
  const isLoading = ref(false);
  const error = ref(null);

  // Get public settings
  const getSettings = async () => {
    try {
      isLoading.value = true;
      error.value = null;

      const response = await $fetch('/api/settings', {
        method: 'GET'
      });

      if (response.data) {
        settings.value = response.data;
        if (!response.success) {
          error.value = response.error?.message || 'Saved settings are temporarily unavailable';
        }
        return response.data;
      }
      throw new Error('Failed to get settings');
    } catch (err) {
      console.error('Failed to get settings:', err);
      error.value = err.message || 'Failed to get settings';
      
      // Return fallback settings
      const fallbackSettings = {
        discord: {
          inviteUrl: "https://discord.gg/JuxYYVEkzc"
        },

        maintenance: {
          enabled: false
        }
      };
      
      settings.value = fallbackSettings;
      return fallbackSettings;
    } finally {
      isLoading.value = false;
    }
  };

  // Get Discord URL specifically
  const getDiscordUrl = async () => {
    try {
      const settingsData = await getSettings();
      return settingsData.discord?.inviteUrl || "https://discord.gg/JuxYYVEkzc";
    } catch (err) {
      console.error('Failed to get Discord URL:', err);
      return "https://discord.gg/JuxYYVEkzc";
    }
  };



  return {
    settings: readonly(settings),
    isLoading: readonly(isLoading),
    error: readonly(error),
    getSettings,
    getDiscordUrl
  };
};
