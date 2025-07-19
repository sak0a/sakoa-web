export default defineNuxtPlugin(async () => {
  // This plugin runs only on the client side
  // It ensures donation settings are loaded as soon as possible

  if (process.client) {
    // Set defaults immediately to prevent any undefined state
    window.__DONATION_SETTINGS__ = {
      paypalEnabled: true,
      revolutEnabled: true,
      buyMeACoffeeEnabled: true
    };

    try {
      // Use a more robust fetch approach
      const response = await fetch('/api/settings', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.data?.donations) {
        // Update with actual settings
        window.__DONATION_SETTINGS__ = {
          paypalEnabled: data.data.donations.paypalEnabled !== false,
          revolutEnabled: data.data.donations.revolutEnabled !== false,
          buyMeACoffeeEnabled: data.data.donations.buyMeACoffeeEnabled !== false
        };

        // Dispatch a custom event to notify components that settings are loaded
        window.dispatchEvent(new CustomEvent('donationSettingsLoaded', {
          detail: window.__DONATION_SETTINGS__
        }));
      }
    } catch (error) {
      // Silently fail and keep defaults - no need to spam console in production
      if (process.dev) {
        console.warn('Could not load donation settings, using defaults:', error.message);
      }
    }
  }
});
