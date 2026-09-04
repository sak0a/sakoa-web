<template>
  <AdminLayout>
    <div class="admin-page">
      <header class="admin-page-header">
        <div>
          <span class="admin-eyebrow">System / data controls</span>
          <h1>Database & cache.</h1>
          <p>Inspect live connection state, clear stale application data, and trigger narrow refreshes without touching persistent records.</p>
        </div>
        <NuxtLink to="/admin/settings" class="admin-button admin-button-secondary">Cache intervals</NuxtLink>
      </header>

      <div class="system-stack">
        <AdminCacheManagement />

        <section class="admin-panel">
          <div class="admin-panel__header">
            <div>
              <h2>Database source</h2>
              <p>Connection diagnostics for the shared website and worker datastore.</p>
            </div>
          </div>
          <div class="admin-panel__body"><DatabaseStatus /></div>
        </section>

        <aside class="cache-note">
          <span class="admin-label">Scope</span>
          <p>Cache actions affect temporary application data only. Configure refresh intervals under <NuxtLink to="/admin/settings">Settings</NuxtLink>; donor and player records remain in MySQL.</p>
        </aside>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
definePageMeta({ layout: false })
</script>

<style scoped>
.system-stack { display: grid; gap: 1rem; }
.cache-note { display: grid; grid-template-columns: 6rem minmax(0, 1fr); gap: 1rem; padding: 1rem 1.25rem; border-left: 2px solid var(--admin-accent); background: #0d0c11; }
.cache-note p { max-width: 60rem; margin: 0; color: var(--admin-muted); font-size: .78rem; line-height: 1.6; }
.cache-note a { color: var(--admin-accent); }
.cache-note a:hover { text-decoration: underline; }
@media (max-width: 520px) { .cache-note { grid-template-columns: 1fr; gap: .45rem; } }
</style>
