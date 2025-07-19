export default defineNuxtPlugin(async () => {
  // This plugin runs only on the client side
  // It ensures donation settings are loaded as soon as possible
  
  if (process.client) {
    console.log('Donation settings plugin: Loading settings on client...');
    
    try {
      const { $fetch } = useNuxtApp();
      const response = await $fetch('/api/settings');
      
      if (response.success && response.data?.donations) {
        console.log('Donation settings plugin: Settings loaded successfully', response.data.donations);
        
        // Store in a global state that can be accessed immediately
        window.__DONATION_SETTINGS__ = {
          paypalEnabled: response.data.donations.paypalEnabled !== false,
          revolutEnabled: response.data.donations.revolutEnabled !== false,
          buyMeACoffeeEnabled: response.data.donations.buyMeACoffeeEnabled !== false
        };
      } else {
        console.warn('Donation settings plugin: No donation settings found, using defaults');
        window.__DONATION_SETTINGS__ = {
          paypalEnabled: true,
          revolutEnabled: true,
          buyMeACoffeeEnabled: true
        };
      }
    } catch (error) {
      console.error('Donation settings plugin: Failed to load settings', error);
      window.__DONATION_SETTINGS__ = {
        paypalEnabled: true,
        revolutEnabled: true,
        buyMeACoffeeEnabled: true
      };
    }
  }
});
