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
          <PlayerColorPicker :id="`account-${field.key}`" v-model="draft[field.key]" :label="field.label" @update:model-value="selectPersonalColor(field)" />
          <label class="account-check"><input v-model="draft[field.group]" type="checkbox" @change="changed"> Use my group’s {{ field.label.toLowerCase() }}</label>
        </div>
      </fieldset>
      <div class="account-chat-preview" aria-label="Approximate in-game chat preview">
        <span class="account-eyebrow">CHAT PREVIEW</span>
        <p><span class="account-preview-tag"><span v-for="(segment, index) in previewTag" :key="index" :style="{ color: segment.color }">{{ segment.text }}</span>{{ previewTag.length ? ' ' : '' }}</span><span class="account-preview-name" :style="{ color: previewNameColor }">{{ playerName }}</span><span style="color:#ffffff"> : </span><span class="account-preview-message" :style="{ color: previewChatColor }">nice airshot!</span></p>
        <label class="account-preview-team">Preview team <select v-model="previewTeam" aria-label="Preview team"><option value="red">RED</option><option value="blue">BLU</option><option value="grey">Spectator</option></select></label>
        <small>Uses your selected personal or group settings. Team colors follow the preview team; appearance may vary with game settings.</small>
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
import { isSourceColor } from '#shared/source-colors.js';
import { previewColor, previewSegments } from '#shared/chat-preview.js';
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

function selectPersonalColor(field) { draft[field.group] = false; changed(); }
function changed() { dirty.value = true; status.value = ''; error.value = ''; }
const colorsValid = computed(() => isSourceColor(draft.nameColor) && isSourceColor(draft.chatColor));
const previewTeam = ref('red');
const previewTag = computed(() => previewSegments(draft.useGroupTag ? props.preferences.group?.tag : draft.tag, '#ffffff', previewTeam.value));
const previewNameColor = computed(() => previewColor(draft.useGroupNameColor ? props.preferences.group?.nameColor : draft.nameColor, previewColor('{teamcolor}', '#ffffff', previewTeam.value), previewTeam.value));
const previewChatColor = computed(() => previewColor(draft.useGroupChatColor ? props.preferences.group?.chatColor : draft.chatColor, '#ffffff', previewTeam.value));
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
