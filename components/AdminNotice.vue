<template>
  <div
    v-if="isAdmin"
    class="admin-notice fixed top-0 left-0 w-full z-[60] flex items-center justify-between bg-gradient-to-r from-purple-600 to-purple-700 text-white text-xs leading-none h-5 px-3 shadow-sm border-b border-purple-500"
  >
    <div class="flex items-center space-x-1">
      <svg class="w-3 h-3 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
      </svg>
      <span class="font-medium">Admin</span>
      <span class="text-purple-200">•</span>
      <span class="text-purple-200">Logged in as administrator</span>
    </div>

    <div class="flex items-center space-x-1.5">
      <NuxtLink
        to="/admin/dashboard"
        class="text-purple-200 hover:text-white transition-colors duration-200 font-medium"
      >
        Panel
      </NuxtLink>
      <button
        @click="handleLogout"
        class="text-purple-200 hover:text-white transition-colors duration-200 font-medium"
      >
        Logout
      </button>
    </div>
  </div>
</template>

<script setup>
const { checkAuth, logout } = useAdmin();
const isAdmin = ref(false);

// Check admin status on mount
onMounted(async () => {
  try {
    isAdmin.value = await checkAuth();

    // Adjust navigation position when admin notice is shown
    if (isAdmin.value) {
      adjustNavigationPosition();
    }
  } catch (error) {
    console.error('Failed to check admin status:', error);
    isAdmin.value = false;
  }
});

// Function to adjust navigation position
const adjustNavigationPosition = () => {
  nextTick(() => {
    const navigation = document.querySelector('.navigation.admin-aware');
    if (navigation) {
      navigation.style.top = '20px'; // Ultra-slim notice height
    }
  });
};

const handleLogout = async () => {
  try {
    await logout();
    isAdmin.value = false;

    // Reset navigation position
    const navigation = document.querySelector('.navigation.admin-aware');
    if (navigation) {
      navigation.style.top = '0px';
    }

    // Refresh the page to clear any cached admin state
    window.location.reload();
  } catch (error) {
    console.error('Logout failed:', error);
  }
};
</script>

<style scoped>
.admin-notice {
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
