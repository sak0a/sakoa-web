export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/admin')) return;

  const { checkAuth } = useAdmin();
  const authenticated = await checkAuth();

  if (to.path === '/admin') {
    if (authenticated) return navigateTo('/admin/dashboard');
    return;
  }

  if (!authenticated) return navigateTo('/admin');
});
