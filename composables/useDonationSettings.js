export const useDonationSettings = () => {
  // Initialize with global state if available (from plugin), otherwise use defaults
  const initialSettings = process.client && window.__DONATION_SETTINGS__
    ? window.__DONATION_SETTINGS__
    : {
        paypalEnabled: true,
        revolutEnabled: true,
        buyMeACoffeeEnabled: true
      };

  const donationSettings = ref(initialSettings);

  const loading = ref(false);
  const error = ref(null);

  const fetchDonationSettings = async () => {
    try {
      loading.value = true;
      error.value = null;

      console.log('Fetching donation settings...');
      const response = await $fetch('/api/settings');
      console.log('Settings API response:', response);

      if (response.success && response.data?.donations) {
        const newSettings = {
          paypalEnabled: response.data.donations.paypalEnabled !== false,
          revolutEnabled: response.data.donations.revolutEnabled !== false,
          buyMeACoffeeEnabled: response.data.donations.buyMeACoffeeEnabled !== false
        };
        console.log('Applying donation settings:', newSettings);
        donationSettings.value = newSettings;

        // Update global state for future use
        if (process.client) {
          window.__DONATION_SETTINGS__ = newSettings;
        }
      } else {
        console.warn('No donation settings found in API response, using defaults');
        donationSettings.value = {
          paypalEnabled: true,
          revolutEnabled: true,
          buyMeACoffeeEnabled: true
        };
      }
    } catch (err) {
      console.error('Failed to fetch donation settings:', err);
      error.value = err;
      // Use defaults if fetch fails
      console.log('Using default donation settings due to error');
      donationSettings.value = {
        paypalEnabled: true,
        revolutEnabled: true,
        buyMeACoffeeEnabled: true
      };
    } finally {
      loading.value = false;
    }
  };

  return {
    donationSettings: readonly(donationSettings),
    loading: readonly(loading),
    error: readonly(error),
    fetchDonationSettings
  };
};
