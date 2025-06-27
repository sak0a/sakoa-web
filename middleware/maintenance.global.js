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
        // Check if user is an admin before redirecting to maintenance
        try {
          const authStatus = await $fetch('/api/admin/auth', {
            method: 'GET'
          });

          if (authStatus?.authenticated) {
            // User is an admin, allow access to main site
            console.log('Admin user detected, bypassing maintenance mode');
            return;
          }
        } catch (authError) {
          // Not an admin or auth check failed, proceed with maintenance redirect
          console.log('Not an admin user, redirecting to maintenance');
        }

        return navigateTo('/maintenance');
      }
    } catch (error) {
      console.error('Failed to check maintenance status:', error);
      // Continue normally if we can't check maintenance status
    }
  }
});
