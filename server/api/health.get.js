export default defineEventHandler(() => ({
  status: 'ok',
  service: 'web',
  timestamp: new Date().toISOString()
}));
