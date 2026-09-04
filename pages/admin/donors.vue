<template>
  <AdminLayout>
    <div class="admin-page">
      <header class="admin-page-header">
          <div>
            <span class="admin-eyebrow">Operate / donor records</span>
            <h1>Donors.</h1>
            <p>Manage public recognition, access expiry, and contribution history for each Steam account.</p>
          </div>
          <button
            type="button"
            @click="openAddModal"
            class="admin-button admin-button-primary"
          >
            Add donor
          </button>
        </header>

        <!-- Loading State -->
        <div v-if="loading" class="admin-panel admin-empty" aria-live="polite">
          Loading donor records…
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="admin-notice admin-notice--error" role="alert">
          <span>{{ error }}</span>
          <button type="button" class="notice-retry" @click="loadDonors">Retry</button>
        </div>

        <!-- Donors Cards -->
        <section v-else class="admin-panel donor-register" aria-label="Donor records">
          <div
            v-for="donor in donors"
            :key="donor.steamid"
            class="donor-record"
          >
            <div class="donor-record__summary">
              <div class="donor-record__identity">
                <div class="donor-title-row">
                  <h2>{{ donor.display_name || donor.name }}</h2>
                  <span class="donor-tag donor-tag--tier">
                    {{ donor.tier }}
                  </span>
                  <span v-if="donor.show_on_website" class="donor-tag donor-tag--visible">
                    Visible
                  </span>
                  <span v-else class="donor-tag">
                    Hidden
                  </span>
                </div>
                <p class="donor-fact"><span>Total</span> €{{ donor.total_amount || donor.amount }}</p>
                <p class="donor-fact"><span>Entries</span> {{ donor.donation_count || (donor.donations ? donor.donations.length : 0) }}</p>
                <div v-if="donor.expiry_date && donor.expiry_date > 0" class="donor-expiry">
                  <p :class="expiryClass(donor.expiry_date)">
                    {{ isExpired(donor.expiry_date) ? 'Expired' : 'Expires' }}: {{ formatExpiryDate(donor.expiry_date) }}
                  </p>
                </div>
                <div v-else-if="donor.expiry_date === 0" class="donor-expiry">
                  <p class="donor-expiry--active">Permanent</p>
                </div>
                <p v-if="donor.steamid" class="donor-steamid">{{ donor.steamid }}</p>
              </div>
              <div class="donor-actions">
                <button
                  type="button"
                  @click="openEditModal(donor.steamid, donor)"
                  class="admin-button admin-button-secondary"
                  title="Edit donor"
                >
                  Edit
                </button>
                <button
                  type="button"
                  @click="confirmDelete(donor.steamid, donor)"
                  class="admin-button admin-button-danger"
                  title="Delete donor"
                >
                  Delete
                </button>
              </div>
            </div>

            <!-- Individual Donations -->
            <div class="donation-history">
              <h3>Contribution history</h3>
              <div class="donation-history__list">
                <div
                  v-for="(donation, donationIndex) in (donor.donations || [])"
                  :key="donationIndex"
                  class="donation-entry"
                >
                  <div class="donation-entry__line">
                    <span>€{{ donation.amount }}</span>
                    <time>{{ donation.date }}</time>
                  </div>
                  <div v-if="donation.notes" class="donation-note">
                    {{ donation.notes }}
                  </div>
                </div>
              </div>
              <div v-if="!donor.donations || donor.donations.length === 0" class="donation-empty">
                No individual contributions recorded.
              </div>
            </div>
          </div>

          <div v-if="donors.length === 0" class="admin-empty">
            No donor records yet. Add one to begin tracking contributions.
          </div>
        </section>

        <!-- Add/Edit Modal -->
        <div v-if="showModal" class="donor-backdrop" role="presentation" @click.self="closeModal">
          <section class="donor-dialog" role="dialog" aria-modal="true" aria-labelledby="donor-dialog-title">
            <h2 id="donor-dialog-title" class="donor-dialog-title">
              {{ editingSteamId !== null ? 'Edit donor' : 'Add donor' }}
            </h2>

            <form class="donor-form" @submit.prevent="saveDonor">
              <!-- Basic Info -->
              <div class="donor-form-grid">
                <label class="donor-field">
                  <span>Display name *</span>
                  <input
                    v-model="formData.display_name"
                    type="text"
                    required
                    placeholder="Name to display on website"
                  >
                </label>

                <label class="donor-field">
                  <span>Tier *</span>
                  <input
                    v-model="formData.tier"
                    type="text"
                    required
                    placeholder="VIP, Premium, Elite, Supporter, SAS, etc."
                  >
                  <small>Displayed as a badge on the public website.</small>
                </label>
              </div>

              <div class="donor-form-grid">
                <label class="donor-field">
                  <span>SteamID *</span>
                  <input
                    v-model="formData.steamid"
                    type="text"
                    required
                    :disabled="editingSteamId !== null"
                    placeholder="[U:1:XXXXXXXX] or STEAM_0:X:XXXXXXX"
                  >
                  <small v-if="editingSteamId !== null">SteamID cannot be changed while editing.</small>
                </label>

                <fieldset class="donor-fieldset">
                  <legend>Website visibility</legend>
                  <label class="donor-choice">
                    <input v-model="formData.show_on_website" type="checkbox">
                    <span>Show on website</span>
                  </label>
                </fieldset>
              </div>

              <!-- Expiry Date Section -->
              <fieldset class="donor-fieldset">
                <legend>Donation expiry</legend>
                <div class="donor-choice-row">
                    <label class="donor-choice">
                      <input
                        v-model="formData.is_permanent"
                        type="radio"
                        :value="true"
                        name="expiry_type"
                      >
                      <span>Permanent donation</span>
                    </label>
                    <label class="donor-choice">
                      <input
                        v-model="formData.is_permanent"
                        type="radio"
                        :value="false"
                        name="expiry_type"
                      >
                      <span>Temporary donation</span>
                    </label>
                </div>

                  <label v-if="!formData.is_permanent" class="donor-field donor-field--expiry">
                    <span>Expiry date *</span>
                    <input
                      v-model="formData.expiry_date"
                      type="date"
                      :min="new Date().toISOString().split('T')[0]"
                      required
                    >
                    <small>Select when the donation status should expire.</small>
                  </label>

                  <div v-else class="permanent-note">
                    This donation will never expire.
                  </div>
              </fieldset>

              <!-- Donations Section -->
              <fieldset class="donor-fieldset">
                <div class="donor-fieldset__header">
                  <h3>Donations *</h3>
                  <button
                    type="button"
                    @click="addDonation"
                    class="admin-button admin-button-secondary"
                  >
                    Add entry
                  </button>
                </div>

                <div class="donation-editor">
                  <div
                    v-for="(donation, index) in formData.donations"
                    :key="index"
                    class="donation-editor-row"
                  >
                    <label class="donor-field">
                      <span>Amount (€)</span>
                      <input
                        v-model.number="donation.amount"
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        placeholder="0.00"
                      >
                    </label>
                    <label class="donor-field">
                      <span>Date</span>
                      <input
                        v-model="donation.date"
                        type="date"
                        required
                      >
                    </label>
                    <label class="donor-field">
                      <span>Notes (optional)</span>
                      <input
                        v-model="donation.notes"
                        type="text"
                        placeholder="Optional notes"
                      >
                    </label>
                    <button
                      type="button"
                      @click="removeDonation(index)"
                      class="remove-entry"
                      title="Remove donation"
                    >
                      Remove
                    </button>
                  </div>

                  <div v-if="formData.donations.length === 0" class="donation-empty donation-empty--editor">
                    No donations added yet. Add an entry to continue.
                  </div>
                </div>

                <div v-if="formData.donations.length > 0" class="donation-total">
                  <p>
                    Draft total <strong>€{{ calculateTotal() }}</strong>
                  </p>
                </div>
              </fieldset>

              <div v-if="modalError" class="admin-notice admin-notice--error" role="alert">
                {{ modalError }}
              </div>

              <div class="donor-dialog-actions">
                <button
                  type="button"
                  @click="closeModal"
                  class="admin-button admin-button-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="saving || formData.donations.length === 0"
                  class="admin-button admin-button-primary"
                >
                  {{ saving ? 'Saving…' : 'Save donor' }}
                </button>
              </div>
            </form>
          </section>
        </div>

        <!-- Delete Confirmation Modal -->
        <div v-if="showDeleteModal" class="donor-backdrop" role="presentation" @click.self="showDeleteModal = false">
          <section class="delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-dialog-title">
            <h2 id="delete-dialog-title">Delete donor?</h2>
            <p class="delete-copy">
              Delete <strong>{{ deleteTarget?.display_name || deleteTarget?.name }}</strong> and all linked donation entries? This cannot be undone.
            </p>

            <div class="delete-actions">
              <button
                type="button"
                @click="showDeleteModal = false"
                class="admin-button admin-button-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                @click="deleteDonorConfirmed"
                :disabled="deleting"
                class="admin-button admin-button-danger"
              >
                {{ deleting ? 'Deleting…' : 'Delete donor' }}
              </button>
            </div>
          </section>
        </div>

    </div>
  </AdminLayout>
</template>

<script setup>
definePageMeta({
  layout: false
});

const { adminFetch } = useAdmin();

const donors = ref([]);
const loading = ref(true);
const error = ref(null);

const showModal = ref(false);
const editingSteamId = ref(null);
const formData = ref({
  display_name: '',
  tier: '',
  steamid: '',
  show_on_website: false,
  expiry_date: null,
  is_permanent: true,
  donations: []
});
const modalError = ref(null);
const saving = ref(false);

const showDeleteModal = ref(false);
const deleteTarget = ref(null);
const deleteSteamId = ref(null);
const deleting = ref(false);

// Load donors from database
const loadDonors = async () => {
  try {
    loading.value = true;
    error.value = null;

    const response = await adminFetch('/api/admin/donors-db');

    donors.value = response.donors || [];
  } catch (err) {
    console.error('Failed to load donors:', err);
    error.value = err.data?.message || 'Failed to load donors';
    if (err.status === 401) {
      await navigateTo('/admin');
    }
  } finally {
    loading.value = false;
  }
};

// Modal functions
const openAddModal = () => {
  editingSteamId.value = null;
  formData.value = {
    display_name: '',
    tier: '',
    steamid: '',
    show_on_website: false,
    expiry_date: null,
    is_permanent: true,
    donations: [{
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      notes: ''
    }]
  };
  modalError.value = null;
  showModal.value = true;
};

const openEditModal = (steamid, donor) => {
  editingSteamId.value = steamid;
  const isPermanent = !donor.expiry_date || donor.expiry_date === 0;
  const expiryDate = isPermanent ? null : new Date(donor.expiry_date * 1000).toISOString().split('T')[0];

  formData.value = {
    display_name: donor.display_name || donor.name || '',
    tier: donor.tier || '',
    steamid: donor.steamid || '',
    show_on_website: donor.show_on_website || false,
    expiry_date: expiryDate,
    is_permanent: isPermanent,
    donations: donor.donations ? donor.donations.map(d => ({
      amount: d.amount,
      date: d.date || new Date().toISOString().split('T')[0],
      notes: d.notes || ''
    })) : [{
      amount: donor.total_amount || donor.amount || 0,
      date: new Date().toISOString().split('T')[0],
      notes: ''
    }]
  };
  modalError.value = null;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingSteamId.value = null;
  modalError.value = null;
};

// Donation management functions
const addDonation = () => {
  formData.value.donations.push({
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
};

const removeDonation = (index) => {
  if (formData.value.donations.length > 1) {
    formData.value.donations.splice(index, 1);
  }
};

const calculateTotal = () => {
  return formData.value.donations.reduce((sum, donation) => sum + (donation.amount || 0), 0).toFixed(2);
};

// Helper functions for expiry date handling
const formatExpiryDate = (timestamp) => {
  if (!timestamp || timestamp === 0) return 'Never';
  const date = new Date(timestamp * 1000);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const isExpired = (timestamp) => {
  if (!timestamp || timestamp === 0) return false;
  return timestamp * 1000 < Date.now();
};

const isExpiringSoon = (timestamp) => {
  if (!timestamp || timestamp === 0) return false;
  const now = Date.now();
  const expiry = timestamp * 1000;
  const daysUntilExpiry = (expiry - now) / (1000 * 60 * 60 * 24);
  return daysUntilExpiry <= 7 && daysUntilExpiry > 0; // Expiring within 7 days
};

const expiryClass = (timestamp) => {
  if (isExpired(timestamp)) return 'donor-expiry--expired';
  if (isExpiringSoon(timestamp)) return 'donor-expiry--soon';
  return 'donor-expiry--active';
};

const saveDonor = async () => {
  try {
    saving.value = true;
    modalError.value = null;

    // Validate expiry date if not permanent
    if (!formData.value.is_permanent) {
      if (!formData.value.expiry_date) {
        modalError.value = 'Please select an expiry date or choose permanent donation';
        saving.value = false;
        return;
      }

      const expiryDate = new Date(formData.value.expiry_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (expiryDate < today) {
        modalError.value = 'Expiry date cannot be in the past';
        saving.value = false;
        return;
      }
    }

    // Prepare donor data with expiry date handling
    const donorData = {
      ...formData.value,
      expiry_date: formData.value.is_permanent ? 0 : Math.floor(new Date(formData.value.expiry_date).getTime() / 1000)
    };

    // Remove the is_permanent field as it's not needed in the API
    delete donorData.is_permanent;

    if (editingSteamId.value !== null) {
      // Update existing donor
      await adminFetch('/api/admin/donors-db', {
        method: 'PUT',
        body: {
          steamid: editingSteamId.value,
          donor: donorData
        }
      });
    } else {
      // Add new donor
      await adminFetch('/api/admin/donors-db', {
        method: 'POST',
        body: {
          donor: donorData
        }
      });
    }

    await loadDonors();
    closeModal();
  } catch (err) {
    modalError.value = err.data?.message || 'Failed to save donor';
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (steamid, donor) => {
  deleteSteamId.value = steamid;
  deleteTarget.value = donor;
  showDeleteModal.value = true;
};

const deleteDonorConfirmed = async () => {
  try {
    deleting.value = true;

    await adminFetch('/api/admin/donors-db', {
      method: 'DELETE',
      query: {
        steamid: deleteSteamId.value
      }
    });

    await loadDonors();
    showDeleteModal.value = false;
  } catch (err) {
    error.value = err.data?.message || 'Failed to delete donor';
  } finally {
    deleting.value = false;
  }
};

// Load data on mount
onMounted(async () => {
  try {
    await loadDonors();
  } catch (error) {
    console.error('Failed to initialize donors page:', error);
    await navigateTo('/admin');
  }
});
</script>

<style scoped>
.donor-register { overflow: hidden; }
.admin-notice { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.notice-retry { color: inherit; font-weight: 650; text-decoration: underline; }
.notice-retry:focus-visible { outline: 2px solid var(--admin-accent); outline-offset: 3px; }
.donor-record { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(17rem, .9fr); gap: 1.5rem; padding: 1.25rem; border-bottom: 1px solid var(--admin-line); }
.donor-record:last-of-type { border-bottom: 0; }
.donor-record:hover { background: #141419; }
.donor-record__summary { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.donor-record__identity { min-width: 0; }
.donor-title-row { display: flex; flex-wrap: wrap; align-items: center; gap: .45rem; margin-bottom: .75rem; }
.donor-title-row h2 { overflow: hidden; max-width: 22rem; margin: 0 .35rem 0 0; font-size: 1rem; font-weight: 650; text-overflow: ellipsis; white-space: nowrap; }
.donor-tag { border: 1px solid var(--admin-line-strong); padding: .2rem .4rem; color: var(--admin-muted); font-family: var(--font-mono); font-size: .58rem; letter-spacing: .07em; text-transform: uppercase; }
.donor-tag--tier { border-color: #514267; color: #c4b5fd; }
.donor-tag--visible { border-color: #275e4c; color: #6ee7b7; }
.donor-fact { display: inline-block; margin: 0 1rem .4rem 0; color: #dad8e1; font-family: var(--font-mono); font-size: .72rem; }
.donor-fact span { color: var(--admin-muted); }
.donor-expiry { margin: .15rem 0; font-family: var(--font-mono); font-size: .68rem; }
.donor-expiry p { margin: 0; }
.donor-expiry--active { color: #6ee7b7; }
.donor-expiry--soon { color: #fcd34d; }
.donor-expiry--expired { color: #fca5a5; }
.donor-steamid { display: block; overflow: hidden; margin: .35rem 0 0; color: #85838d; font-family: var(--font-mono); font-size: .68rem; text-overflow: ellipsis; white-space: nowrap; }
.donor-actions { display: flex; gap: .45rem; }
.donation-history { min-width: 0; padding-left: 1.25rem; border-left: 1px solid var(--admin-line); }
.donation-history h3 { margin: 0 0 .6rem; color: var(--admin-muted); font-family: var(--font-mono); font-size: .62rem; letter-spacing: .1em; text-transform: uppercase; }
.donation-history__list { display: grid; max-height: 8rem; overflow-y: auto; }
.donation-entry { padding: .5rem .25rem; border-top: 1px solid var(--admin-line); font-family: var(--font-mono); font-size: .68rem; }
.donation-entry__line { display: flex; justify-content: space-between; gap: 1rem; }
.donation-entry__line span { color: #f3f1f8; }
.donation-entry__line time { color: var(--admin-muted); }
.donation-note { margin-top: .3rem; color: #777580; font-family: var(--font-sans); font-size: .68rem; }
.donation-empty { color: var(--admin-muted); font-size: .74rem; }
.donor-backdrop { position: fixed; inset: 0; z-index: 60; display: grid; place-items: center; overflow-y: auto; padding: 1rem; background: rgb(0 0 0 / .78); backdrop-filter: blur(4px); }
.donor-dialog, .delete-dialog { width: min(100%, 48rem); max-height: calc(100dvh - 2rem); overflow-y: auto; border: 1px solid var(--admin-line-strong); background: #111114; box-shadow: 0 2rem 6rem rgb(0 0 0 / .5); padding: 1.5rem; }
.delete-dialog { width: min(100%, 28rem); }
.donor-dialog-title, .delete-dialog h2 { margin: 0 0 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--admin-line); font-size: 1.35rem; letter-spacing: -.025em; }
.donor-form { display: grid; gap: 1.4rem; }
.donor-form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
.donor-field { display: grid; align-content: start; gap: .45rem; }
.donor-form label, .donor-fieldset legend, .donor-fieldset__header h3 { color: #aaa8b2; font-family: var(--font-mono); font-size: .67rem; font-weight: 500; letter-spacing: .06em; text-transform: uppercase; }
.donor-field small { color: var(--admin-muted); font-family: var(--font-sans); font-size: .67rem; letter-spacing: 0; line-height: 1.45; text-transform: none; }
.donor-form input[type='text'], .donor-form input[type='number'], .donor-form input[type='date'] { width: 100%; min-height: 2.65rem; border: 1px solid var(--admin-line-strong); border-radius: 0; background: #0c0c0f; color: #f7f5ff; padding: .6rem .7rem; font-family: var(--font-sans); font-size: .82rem; letter-spacing: 0; text-transform: none; }
.donor-form input:focus { border-color: var(--admin-accent); outline: 2px solid rgb(167 139 250 / .12); outline-offset: 0; }
.donor-form input:disabled { color: #777580; cursor: not-allowed; }
.donor-form input[type='checkbox'], .donor-form input[type='radio'] { accent-color: var(--admin-accent-strong); }
.donor-form p { color: var(--admin-muted); }
.donor-fieldset { min-width: 0; margin: 0; border: 0; padding: 0; }
.donor-fieldset legend { margin-bottom: .65rem; padding: 0; }
.donor-choice-row { display: flex; flex-wrap: wrap; gap: .75rem 1.5rem; }
.donor-choice { display: flex; align-items: center; gap: .5rem; min-height: 2rem; }
.donor-choice input { width: 1rem; height: 1rem; }
.donor-field--expiry { max-width: 20rem; margin-top: 1rem; }
.permanent-note { margin-top: .65rem; color: #6ee7b7; font-size: .74rem; }
.donor-fieldset__header { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: .75rem; }
.donor-fieldset__header h3 { margin: 0; }
.donation-editor { max-height: 15rem; overflow-y: auto; }
.donation-editor-row { display: grid; grid-template-columns: .7fr 1fr 1.3fr auto; align-items: end; gap: .65rem; margin-bottom: .5rem; padding: .75rem; border: 1px solid var(--admin-line); background: #0c0c0f; }
.remove-entry { min-height: 2.5rem; color: #fca5a5; font-size: .68rem; }
.remove-entry:hover { text-decoration: underline; }
.remove-entry:focus-visible { outline: 2px solid var(--admin-accent); }
.donation-total { margin-top: .75rem; padding-top: .75rem; border-top: 1px solid var(--admin-line); text-align: right; }
.donation-total p { margin: 0; font-family: var(--font-mono); font-size: .7rem; }
.donation-total strong { color: var(--admin-accent); }
.donation-empty--editor { padding: 1rem; border: 1px dashed var(--admin-line-strong); text-align: center; }
.donor-dialog-actions { display: flex; justify-content: flex-end; gap: .55rem; padding-top: 1rem; border-top: 1px solid var(--admin-line); }
.delete-copy { margin: 0 0 1.5rem; color: #b8b6c0; font-size: .82rem; line-height: 1.6; }
.delete-actions { display: flex; justify-content: flex-end; gap: .55rem; }
@media (max-width: 980px) { .donor-record { grid-template-columns: 1fr; } .donation-history { padding-top: 1rem; padding-left: 0; border-top: 1px solid var(--admin-line); border-left: 0; } }
@media (max-width: 650px) { .donor-record__summary { flex-direction: column; } .donor-form-grid, .donation-editor-row { grid-template-columns: 1fr; } .donor-actions { width: 100%; } .donor-actions .admin-button { flex: 1; } .donor-dialog-actions { display: grid; grid-template-columns: 1fr 1fr; } }
</style>
