<template>
  <picture v-if="showPicture">
    <!-- WebP source for modern browsers -->
    <source 
      v-if="webpSrc" 
      :srcset="webpSrc" 
      type="image/webp"
    />
    <!-- Fallback to original format -->
    <img
      :src="src"
      :alt="alt"
      :class="imgClass"
      :width="width"
      :height="height"
      :loading="loading"
      :decoding="decoding"
      @load="onLoad"
      @error="onError"
    />
  </picture>
  <img
    v-else
    :src="src"
    :alt="alt"
    :class="imgClass"
    :width="width"
    :height="height"
    :loading="loading"
    :decoding="decoding"
    @load="onLoad"
    @error="onError"
  />
</template>

<script setup>
const props = defineProps({
  src: {
    type: String,
    required: true
  },
  alt: {
    type: String,
    required: true
  },
  width: {
    type: [String, Number],
    default: undefined
  },
  height: {
    type: [String, Number],
    default: undefined
  },
  loading: {
    type: String,
    default: 'lazy',
    validator: (value) => ['lazy', 'eager'].includes(value)
  },
  decoding: {
    type: String,
    default: 'async',
    validator: (value) => ['async', 'sync', 'auto'].includes(value)
  },
  class: {
    type: [String, Array, Object],
    default: ''
  },
  webp: {
    type: Boolean,
    default: true
  },
  preload: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['load', 'error'])

// Computed properties
const imgClass = computed(() => props.class)
const showPicture = computed(() => props.webp && webpSrc.value)

// Generate WebP source if available
const webpSrc = computed(() => {
  if (!props.webp || !props.src) return null
  
  // Check if it's a local asset
  if (props.src.startsWith('/assets/') || props.src.startsWith('./assets/')) {
    // For local assets, assume WebP versions exist
    const extension = props.src.split('.').pop()
    return props.src.replace(`.${extension}`, '.webp')
  }
  
  // For external images (like Steam avatars), don't try to convert
  return null
})

// Event handlers
const onLoad = (event) => {
  emit('load', event)
}

const onError = (event) => {
  emit('error', event)
}

// Preload critical images
onMounted(() => {
  if (props.preload && props.loading === 'eager') {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = props.src
    document.head.appendChild(link)
    
    // Also preload WebP if available
    if (webpSrc.value) {
      const webpLink = document.createElement('link')
      webpLink.rel = 'preload'
      webpLink.as = 'image'
      webpLink.href = webpSrc.value
      document.head.appendChild(webpLink)
    }
  }
})
</script>

<style scoped>
img {
  /* Prevent layout shift */
  max-width: 100%;
  height: auto;
}

/* Smooth loading transition */
img {
  opacity: 0;
  transition: opacity 0.3s ease;
}

img[src] {
  opacity: 1;
}
</style>
