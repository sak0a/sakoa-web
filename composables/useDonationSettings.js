export const useDonationSettings = () => {
  const donationSettings = ref({
    paypalEnabled: true,
    revolutEnabled: true,
    buyMeACoffeeEnabled: true
  });

  const loading = ref(false);
  const error = ref(null);

  const fetchDonationSettings = async () => {
    try {
      loading.value = true;
      error.value = null;
      
      const response = await $fetch('/api/settings');
      
      if (response.success && response.data?.donations) {
        donationSettings.value = {
          paypalEnabled: response.data.donations.paypalEnabled !== false,
          revolutEnabled: response.data.donations.revolutEnabled !== false,
          buyMeACoffeeEnabled: response.data.donations.buyMeACoffeeEnabled !== false
        };
      }
    } catch (err) {
      console.error('Failed to fetch donation settings:', err);
      error.value = err;
      // Use defaults if fetch fails
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
