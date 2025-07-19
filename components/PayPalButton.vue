<template>
  <a 
    :href="paypalUrl" 
    target="_blank" 
    rel="noopener noreferrer" 
    class="btn flex items-center justify-center bg-[#0070BA] text-white hover:bg-[#005ea6] transition-colors h-12 rounded-xl px-6 py-3 font-medium text-base sm:text-lg whitespace-nowrap"
    :class="customClass"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="mr-2 flex-shrink-0">
      <path d="M20.067 8.478c.492.88.556 2.014.3 3.327-.74 3.806-3.276 5.12-6.514 5.12h-.5a.805.805 0 0 0-.794.68l-.04.22-.63 4.876-.03.2a.804.804 0 0 1-.794.679h-2.52c-.092 0-.175-.043-.232-.144a.33.33 0 0 1-.035-.2l.955-6.05-.03.2a.805.805 0 0 1 .794-.682h1.5c4.248 0 7.128-1.732 8.042-6.753.4-.015.015-.043.015-.072.21.012.4.015.072.015.778-1.157.778-2.415-.186-3.416z"/>
      <path d="M18.792 2.904a5.68 5.68 0 0 0-.72-.72C16.93 1.296 15.32.895 13.576.895H5.864c-.44 0-.824.334-.93.76L1.057 17.776a.569.569 0 0 0 .565.673h4.12l1.075-6.706-.033.22a.938.938 0 0 1 .933-.76h1.52c3.734 0 6.182-1.507 6.954-5.87.2-.284.38-.531.555-.736.656-1.482.59-2.656-.316-3.693z"/>
    </svg>
    <span class="hidden sm:inline">{{ fullText }}</span>
    <span class="sm:hidden">{{ shortText }}</span>
  </a>
</template>

<script setup>
const props = defineProps({
  fullText: {
    type: String,
    default: 'Donate via PayPal'
  },
  shortText: {
    type: String,
    default: 'PayPal'
  },
  customClass: {
    type: String,
    default: ''
  }
});

// Use hardcoded PayPal URL
const paypalUrl = ref('http://paypal.me/sakoacom');
</script>
