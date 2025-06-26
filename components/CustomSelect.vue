<template>
  <div class="relative" ref="selectContainer">
    <!-- Select Button -->
    <button
      @click="toggleDropdown"
      @keydown.enter.prevent="toggleDropdown"
      @keydown.space.prevent="toggleDropdown"
      @keydown.escape="closeDropdown"
      @keydown.arrow-down.prevent="navigateOptions(1)"
      @keydown.arrow-up.prevent="navigateOptions(-1)"
      class="w-full px-3 py-2 rounded-lg border text-left focus:outline-none focus:ring-2 transition-all duration-200 flex items-center justify-between text-sm"
      :class="[
        'hover:border-purple-500',
        isOpen ? 'border-purple-500 ring-2 ring-purple-500 ring-opacity-20' : '',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      ]"
      style="background-color: #1a1a1a; border-color: #333333; color: #ffffff;"
      :disabled="disabled"
      :aria-expanded="isOpen"
      :aria-haspopup="true"
      role="combobox"
    >
      <!-- Selected Value -->
      <span class="block truncate">
        {{ selectedOption ? selectedOption[labelKey] : placeholder }}
      </span>
      
      <!-- Arrow Icon -->
      <svg
        class="w-4 h-4 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
        style="color: #a3a3a3;"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Dropdown Menu -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform scale-95 opacity-0"
      enter-to-class="transform scale-100 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform scale-100 opacity-100"
      leave-to-class="transform scale-95 opacity-0"
    >
      <div
        v-if="isOpen"
        class="absolute z-50 w-full mt-2 rounded-lg border shadow-lg max-h-60 overflow-auto"
        style="background-color: #1a1a1a; border-color: #333333;"
        role="listbox"
      >
        <!-- Loading State -->
        <div v-if="loading" class="px-3 py-2 text-center text-sm" style="color: #a3a3a3;">
          <div class="flex items-center justify-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </div>
        </div>

        <!-- Empty State -->
        <div v-else-if="!options || options.length === 0" class="px-3 py-2 text-center text-sm" style="color: #a3a3a3;">
          No options available
        </div>

        <!-- Options -->
        <div v-else>
          <button
            v-for="(option, index) in options"
            :key="getOptionKey(option, index)"
            @click="selectOption(option)"
            @mouseenter="highlightedIndex = index"
            class="w-full px-3 py-2 text-left text-sm hover:bg-opacity-10 hover:bg-purple-500 focus:outline-none focus:bg-opacity-10 focus:bg-purple-500 transition-colors duration-150 flex items-center justify-between"
            :class="{
              'bg-opacity-10 bg-purple-500': highlightedIndex === index,
              'bg-opacity-20 bg-purple-600': isSelected(option)
            }"
            style="color: #ffffff;"
            role="option"
            :aria-selected="isSelected(option)"
          >
            <!-- Option Content -->
            <div class="flex-1">
              <div class="font-medium">{{ option[labelKey] }}</div>
              <div v-if="option[descriptionKey]" class="text-xs mt-0.5" style="color: #a3a3a3;">
                {{ option[descriptionKey] }}
              </div>
            </div>

            <!-- Selected Indicator -->
            <svg
              v-if="isSelected(option)"
              class="w-4 h-4 ml-2"
              style="color: #734C96;"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  modelValue: {
    type: [String, Number, Object],
    default: null
  },
  options: {
    type: Array,
    default: () => []
  },
  placeholder: {
    type: String,
    default: 'Select an option...'
  },
  labelKey: {
    type: String,
    default: 'label'
  },
  valueKey: {
    type: String,
    default: 'value'
  },
  descriptionKey: {
    type: String,
    default: 'description'
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

// Reactive state
const isOpen = ref(false);
const highlightedIndex = ref(-1);
const selectContainer = ref(null);

// Computed properties
const selectedOption = computed(() => {
  if (!props.modelValue || !props.options.length) return null;
  
  return props.options.find(option => {
    if (typeof props.modelValue === 'object') {
      return option[props.valueKey] === props.modelValue[props.valueKey];
    }
    return option[props.valueKey] === props.modelValue;
  });
});

// Methods
const toggleDropdown = () => {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    highlightedIndex.value = selectedOption.value ? 
      props.options.findIndex(opt => isSelected(opt)) : -1;
  }
};

const closeDropdown = () => {
  isOpen.value = false;
  highlightedIndex.value = -1;
};

const selectOption = (option) => {
  const value = typeof props.modelValue === 'object' ? option : option[props.valueKey];
  emit('update:modelValue', value);
  emit('change', option);
  closeDropdown();
};

const isSelected = (option) => {
  if (!props.modelValue) return false;
  
  if (typeof props.modelValue === 'object') {
    return option[props.valueKey] === props.modelValue[props.valueKey];
  }
  return option[props.valueKey] === props.modelValue;
};

const getOptionKey = (option, index) => {
  return option[props.valueKey] || option.id || index;
};

const navigateOptions = (direction) => {
  if (!isOpen.value || !props.options.length) return;
  
  const newIndex = highlightedIndex.value + direction;
  
  if (newIndex >= 0 && newIndex < props.options.length) {
    highlightedIndex.value = newIndex;
  } else if (direction > 0 && newIndex >= props.options.length) {
    highlightedIndex.value = 0; // Wrap to first
  } else if (direction < 0 && newIndex < 0) {
    highlightedIndex.value = props.options.length - 1; // Wrap to last
  }
};

// Click outside handler
const handleClickOutside = (event) => {
  if (selectContainer.value && !selectContainer.value.contains(event.target)) {
    closeDropdown();
  }
};

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

// Watch for changes
watch(() => props.options, () => {
  highlightedIndex.value = -1;
});
</script>

<style scoped>
/* Custom scrollbar for dropdown */
.max-h-60::-webkit-scrollbar {
  width: 6px;
}

.max-h-60::-webkit-scrollbar-track {
  background: #2a2a2a;
  border-radius: 3px;
}

.max-h-60::-webkit-scrollbar-thumb {
  background: #734C96;
  border-radius: 3px;
}

.max-h-60::-webkit-scrollbar-thumb:hover {
  background: #8b5fbf;
}

/* Focus styles */
button:focus-visible {
  outline: 2px solid #734C96;
  outline-offset: 2px;
}
</style>
