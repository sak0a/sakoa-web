<template>
  <div class="skeleton-loader" :class="containerClass">
    <!-- Card Skeleton -->
    <div v-if="type === 'card'" class="card animate-pulse">
      <div class="flex items-start space-x-4">
        <div class="skeleton-avatar"></div>
        <div class="flex-1 space-y-3">
          <div class="skeleton-line w-3/4"></div>
          <div class="skeleton-line w-1/2"></div>
          <div class="skeleton-line w-full"></div>
        </div>
      </div>
    </div>
    
    <!-- List Item Skeleton -->
    <div v-else-if="type === 'list-item'" class="flex items-center space-x-4 p-4 animate-pulse">
      <div class="skeleton-avatar"></div>
      <div class="flex-1 space-y-2">
        <div class="skeleton-line w-1/3"></div>
        <div class="skeleton-line w-1/4"></div>
      </div>
      <div class="skeleton-line w-16"></div>
    </div>
    
    <!-- Stats Skeleton -->
    <div v-else-if="type === 'stats'" class="text-center animate-pulse">
      <div class="skeleton-line w-20 h-10 mx-auto mb-2"></div>
      <div class="skeleton-line w-24 h-4 mx-auto"></div>
    </div>
    
    <!-- Server Status Skeleton -->
    <div v-else-if="type === 'server'" class="card animate-pulse">
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="skeleton-line w-32"></div>
          <div class="skeleton-circle w-4 h-4"></div>
        </div>
        <div class="grid grid-cols-3 gap-4">
          <div v-for="i in 3" :key="i" class="text-center space-y-2">
            <div class="skeleton-line w-full h-8"></div>
            <div class="skeleton-line w-3/4 mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Progress Bar Skeleton -->
    <div v-else-if="type === 'progress'" class="space-y-3 animate-pulse">
      <div class="flex justify-between">
        <div class="skeleton-line w-24"></div>
        <div class="skeleton-line w-12"></div>
      </div>
      <div class="skeleton-line w-full h-3 rounded-full"></div>
      <div class="flex justify-between">
        <div class="skeleton-line w-16"></div>
        <div class="skeleton-line w-16"></div>
      </div>
    </div>
    
    <!-- Table Row Skeleton -->
    <div v-else-if="type === 'table-row'" class="flex items-center space-x-4 p-4 border-b border-gray-800 animate-pulse">
      <div class="skeleton-line w-8"></div>
      <div class="skeleton-avatar"></div>
      <div class="flex-1 skeleton-line"></div>
      <div class="skeleton-line w-16"></div>
      <div class="skeleton-line w-20"></div>
    </div>
    
    <!-- Custom Skeleton -->
    <div v-else class="animate-pulse">
      <div 
        v-for="i in lines" 
        :key="i" 
        class="skeleton-line mb-3"
        :class="getLineWidth(i)"
      ></div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  type: {
    type: String,
    default: 'default',
    validator: (value) => [
      'card', 'list-item', 'stats', 'server', 'progress', 'table-row', 'default'
    ].includes(value)
  },
  lines: {
    type: Number,
    default: 3
  },
  containerClass: {
    type: String,
    default: ''
  }
})

const getLineWidth = (index) => {
  const widths = ['w-full', 'w-3/4', 'w-1/2', 'w-2/3', 'w-5/6']
  return widths[index % widths.length]
}
</script>

<style scoped>
.skeleton-loader {
  @apply w-full;
}

.skeleton-line {
  @apply h-4 bg-gray-700 rounded;
  background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-avatar {
  @apply w-10 h-10 bg-gray-700 rounded-full;
  background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.skeleton-circle {
  @apply bg-gray-700 rounded-full;
  background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* Pulse animation override for better performance */
.animate-pulse {
  animation: none;
}
</style>
