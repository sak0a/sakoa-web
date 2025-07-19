export const useDonationSettings = () => {
  // Always start with safe defaults
  const donationSettings = ref({
    paypalEnabled: true,
    revolutEnabled: true,
    buyMeACoffeeEnabled: true
  });

  const loading = ref(false);
  const error = ref(null);

  // Initialize with global state if available
  if (process.client && window.__DONATION_SETTINGS__) {
    donationSettings.value = { ...window.__DONATION_SETTINGS__ };
  }

  const fetchDonationSettings = async () => {
    // If we're on client and global settings exist, use them immediately
    if (process.client && window.__DONATION_SETTINGS__) {
      donationSettings.value = { ...window.__DONATION_SETTINGS__ };
      return;
    }

    try {
      loading.value = true;
      error.value = null;

      const response = await $fetch('/api/settings');

      if (response.success && response.data?.donations) {
        const newSettings = {
          paypalEnabled: response.data.donations.paypalEnabled !== false,
          revolutEnabled: response.data.donations.revolutEnabled !== false,
          buyMeACoffeeEnabled: response.data.donations.buyMeACoffeeEnabled !== false
        };
        donationSettings.value = newSettings;

        // Update global state for future use
        if (process.client) {
          window.__DONATION_SETTINGS__ = newSettings;
        }
      }
    } catch (err) {
      // Silently fail and keep defaults in production
      if (process.dev) {
        console.warn('Could not fetch donation settings:', err.message);
      }
      error.value = err;
    } finally {
      loading.value = false;
    }
  };

  // Listen for settings loaded event from plugin
  if (process.client) {
    const handleSettingsLoaded = (event) => {
      donationSettings.value = { ...event.detail };
    };

    window.addEventListener('donationSettingsLoaded', handleSettingsLoaded);

    // Cleanup listener
    onUnmounted(() => {
      window.removeEventListener('donationSettingsLoaded', handleSettingsLoaded);
    });
  }

  return {
    donationSettings: readonly(donationSettings),
    loading: readonly(loading),
    error: readonly(error),
    fetchDonationSettings
  };
};
