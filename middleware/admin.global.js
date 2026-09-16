export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/admin')) return;

  const { checkAuth } = useAdmin();
  const authenticated = await checkAuth();

  if (to.path === '/admin') {
    if (to.query.steam === '1') return;
    if (authenticated) return navigateTo('/admin/dashboard');
    return;
  }

  if (!authenticated) return navigateTo('/admin');
});
