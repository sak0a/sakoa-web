<template>
  <section class="account-style" aria-labelledby="account-style-title">
    <div class="account-section-title"><h3 id="account-style-title">Your in-game style</h3><span>{{ accessLabel }}</span></div>
    <p class="account-muted">A little personality between airshots.</p>
    <p v-if="!enabled" class="account-notice">{{ disabledReason }}</p>
    <form @submit.prevent="save">
      <fieldset :disabled="!enabled || saving">
        <label class="account-field">Chat tag <input v-model="draft.tag" maxlength="31" placeholder="Your tag" autocomplete="off" @input="changed"></label>
        <label class="account-check"><input v-model="draft.useGroupTag" type="checkbox" @change="changed"> Use my group’s tag</label>
        <div v-for="field in colorFields" :key="field.key" class="account-color-field">
          <PlayerColorPicker :id="`account-${field.key}`" v-model="draft[field.key]" :label="field.label" @update:model-value="changed" />
          <label class="account-check"><input v-model="draft[field.group]" type="checkbox" @change="changed"> Use my group’s {{ field.label.toLowerCase() }}</label>
        </div>
      </fieldset>
      <div class="account-chat-preview" aria-label="Approximate in-game chat preview">
        <span class="account-eyebrow">CHAT PREVIEW</span>
        <p><span>{{ previewTag }} </span><span :style="{ color: previewNameColor }">{{ playerName }}</span><span> : </span><span :style="{ color: previewChatColor }">nice airshot!</span></p>
        <small>Preview is approximate; team and group colors may differ in-game.</small>
      </div>
      <p v-if="error" class="account-error" role="alert">{{ error }}</p>
      <div class="account-actions">
        <button type="submit" class="account-primary" :disabled="!enabled || saving || !dirty || !colorsValid">{{ saving ? 'Saving…' : 'Save preferences' }}</button>
        <button v-if="dirty || error" type="button" class="account-text-button" :disabled="saving" @click="$emit('reload')">Reload saved settings</button>
      </div>
      <p class="account-muted account-save-status" role="status">{{ status || (dirty ? 'Unsaved changes' : 'Changes reach connected servers in about five seconds.') }}</p>
    </form>
  </section>
</template>

<script setup>
import { isSourceColor, sourceColor } from '#shared/source-colors.js';
const props = defineProps({
  accessLabel: { type: String, default: 'DONATOR' },
  preferences: { type: Object, required: true },
  playerName: { type: String, default: 'Steam player' },
  enabled: Boolean,
  disabledReason: { type: String, default: '' },
  csrfToken: { type: String, required: true }
});
const emit = defineEmits(['reload', 'saved', 'expired']);
const draft = reactive({ tag: '', nameColor: '--n', chatColor: '--n', useGroupTag: true, useGroupNameColor: true, useGroupChatColor: true, version: '' });
const dirty = ref(false);
const saving = ref(false);
const error = ref('');
const status = ref('');
const colorFields = [
  { key: 'nameColor', group: 'useGroupNameColor', label: 'Name color' },
  { key: 'chatColor', group: 'useGroupChatColor', label: 'Message color' }
];
watch(() => props.preferences, value => {
  for (const key of Object.keys(draft)) draft[key] = value[key];
  dirty.value = false;
  error.value = '';
}, { immediate: true });

function changed() { dirty.value = true; status.value = ''; error.value = ''; }
const colorsValid = computed(() => isSourceColor(draft.nameColor) && isSourceColor(draft.chatColor));
function cssColor(value) {
  const hex = value?.match(/^\{(#[a-f0-9]{6})\}$/i);
  return sourceColor(value)?.hex || hex?.[1] || '#e6d6f7';
}
const previewTag = computed(() => {
  const tag = draft.useGroupTag ? props.preferences.group?.tag : draft.tag;
  return !tag || tag === '--n' ? '' : tag.replace(/\{[^}]*\}/g, '');
});
const previewNameColor = computed(() => cssColor(draft.useGroupNameColor ? props.preferences.group?.nameColor : draft.nameColor));
const previewChatColor = computed(() => cssColor(draft.useGroupChatColor ? props.preferences.group?.chatColor : draft.chatColor));
async function save() {
  if (!props.enabled || saving.value || !colorsValid.value) return;
  saving.value = true;
  error.value = '';
  try {
    await $fetch('/api/account/preferences', { method: 'PUT', headers: { 'x-csrf-token': props.csrfToken }, body: { ...draft } });
    dirty.value = false;
    status.value = 'Saved. Your game servers will pick up the change shortly.';
    emit('saved');
  } catch (cause) {
    error.value = cause?.data?.statusMessage || 'Could not save your preferences. Please try again.';
    if (cause?.statusCode === 401) emit('expired');
  } finally { saving.value = false; }
}
</script>
