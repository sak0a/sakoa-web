export default defineNuxtRouteMiddleware(async (to) => {
  // Skip maintenance check for admin routes and API routes
  if (to.path.startsWith('/admin') || to.path.startsWith('/api') || to.path === '/maintenance') {
    return;
  }

  // Only run on client-side to avoid SSR issues
  if (process.client) {
    try {
      const maintenanceStatus = await $fetch('/api/maintenance-status');

      if (maintenanceStatus?.maintenance?.enabled) {
        return navigateTo('/maintenance');
      }
    } catch (error) {
      console.error('Failed to check maintenance status:', error);
      // Continue normally if we can't check maintenance status
    }
  }
});
