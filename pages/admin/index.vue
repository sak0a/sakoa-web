<template>
  <div class="min-h-screen flex items-center justify-center" style="background: linear-gradient(135deg, #23104D, #734C96);">
    <div class="max-w-md w-full mx-4">
      <div class="bg-white/10 backdrop-blur-lg rounded-lg p-8 shadow-2xl border border-white/20">
        <div class="text-center mb-8">
          <img
            src="/assets/img/default-512x512.png"
            alt="Admin Logo"
            class="w-16 h-16 mx-auto mb-4 rounded-lg"
          />
          <h1 class="text-2xl font-bold text-white mb-2">Admin Panel</h1>
          <p class="text-white/80">Enter your password to access the admin dashboard</p>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <div>
            <label for="password" class="block text-sm font-medium text-white mb-2">
              Password
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
              placeholder="Enter admin password"
              :disabled="isLoading"
            />
          </div>

          <div v-if="error" class="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p class="text-red-200 text-sm">{{ error }}</p>
          </div>

          <button
            type="submit"
            :disabled="isLoading || !password"
            class="w-full bg-white text-purple-900 font-semibold py-3 px-4 rounded-lg hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <span v-if="isLoading" class="flex items-center justify-center">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Logging in...
            </span>
            <span v-else>Login</span>
          </button>
        </form>

        <div class="mt-6 text-center">
          <NuxtLink to="/" class="text-white/80 hover:text-white text-sm transition-colors">
            ← Back to main site
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: false
});

const { login, isLoading, error, checkAuth } = useAdmin();

const password = ref('');

// Check if already authenticated
onMounted(async () => {
  try {
    const isAuth = await checkAuth();
    if (isAuth) {
      await navigateTo('/admin/dashboard');
    }
  } catch (error) {
    console.error('Initial auth check failed:', error);
    // Continue to show login form
  }
});

const handleLogin = async () => {
  const success = await login(password.value);
  if (success) {
    await navigateTo('/admin/dashboard');
  }
};
</script>
