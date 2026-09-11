<template>
  <div class="account-palette" @keydown.esc="onEscape">
    <label :id="`${id}-label`" :for="id">{{ label }}</label>
    <button :id="id" ref="trigger" type="button" class="account-palette-trigger" :aria-labelledby="`${id}-label ${id}-value`" :aria-expanded="open" :aria-controls="`${id}-palette`" @click="toggle">
      <span class="account-color-swatch" :style="{ backgroundColor: previewColor(modelValue) }" aria-hidden="true" />
      <span :id="`${id}-value`">{{ selected?.name || (modelValue === '--n' ? 'Game default' : 'Previous custom color') }}</span>
      <span class="account-palette-chevron" aria-hidden="true">{{ open ? '−' : '+' }}</span>
    </button>
    <p v-if="!isSourceColor(modelValue)" class="account-muted">Choose a palette color or Game default to replace your previous custom color before saving.</p>
    <div v-if="open" :id="`${id}-palette`" class="account-palette-options">
      <input ref="searchInput" v-model="query" type="search" :aria-label="`Search ${label.toLowerCase()}s`" placeholder="Search colors…" autocomplete="off" @keydown.enter.prevent>
      <button type="button" class="account-palette-default" :aria-pressed="modelValue === '--n'" @click="select('--n')">Game default <span v-if="modelValue === '--n'" aria-hidden="true">✓</span></button>
      <p class="account-muted account-palette-count" role="status">{{ filtered.length }} colors</p>
      <div class="account-palette-grid">
        <button v-for="color in filtered" :key="color.name" type="button" class="account-palette-choice" :aria-pressed="modelValue === color.value" :title="color.name" @click="select(color.value)">
          <span class="account-color-swatch" :style="{ backgroundColor: color.hex }" aria-hidden="true" />
          <span>{{ color.name }}</span><span v-if="modelValue === color.value" class="account-palette-selected" aria-hidden="true">✓</span>
        </button>
      </div>
      <p v-if="!filtered.length" class="account-muted">No matching colors. Try another name.</p>
    </div>
  </div>
</template>

<script setup>
import { previewColor } from '#shared/chat-preview.js';
import { isSourceColor, sourceColor, sourceColors } from '#shared/source-colors.js';
const props = defineProps({ id: { type: String, required: true }, label: { type: String, required: true }, modelValue: { type: String, required: true } });
const emit = defineEmits(['update:modelValue']);
const open = ref(false);
const query = ref('');
const trigger = ref(null);
const searchInput = ref(null);
const selected = computed(() => sourceColor(props.modelValue));
const filtered = computed(() => sourceColors.filter(color => color.name.includes(query.value.trim().toLowerCase())));
async function toggle() {
  open.value = !open.value;
  if (open.value) { query.value = ''; await nextTick(); searchInput.value?.focus(); }
}
function onEscape(event) {
  if (!open.value) return;
  event.stopPropagation(); event.preventDefault(); close();
}
function close() { open.value = false; trigger.value?.focus(); }
function select(value) { emit('update:modelValue', value); close(); }
</script>
