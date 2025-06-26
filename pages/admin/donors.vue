<template>
  <div class="min-h-screen bg-gray-900">
    <AdminLayout>
      <div class="p-6">
        <div class="flex justify-between items-center mb-8">
          <div>
            <h1 class="text-3xl font-bold text-white mb-2">Donor Management</h1>
            <p class="text-gray-400">Add, edit, or remove donors from your list</p>
          </div>
          <button
            @click="openAddModal"
            class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Add Donor
          </button>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          <p class="text-gray-400 mt-2">Loading donors...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
          <p class="text-red-200">{{ error }}</p>
        </div>

        <!-- Donors Cards -->
        <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div
            v-for="(donor, index) in donors"
            :key="index"
            class="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20"
          >
            <div class="flex justify-between items-start mb-4">
              <div class="flex-1">
                <div class="flex items-center mb-2">
                  <h3 class="text-lg font-semibold text-white mr-3">{{ donor.name }}</h3>
                  <span class="px-2 py-1 text-xs font-semibold rounded-full bg-purple-500/20 text-purple-300">
                    {{ donor.tier }}
                  </span>
                </div>
                <p class="text-gray-400 text-sm mb-1">Total: €{{ donor.amount }}</p>
                <p v-if="donor.steamid" class="text-gray-400 text-xs font-mono">{{ donor.steamid }}</p>
              </div>
              <div class="flex space-x-2">
                <button
                  @click="openEditModal(index, donor)"
                  class="text-blue-400 hover:text-blue-300 p-2 rounded transition-colors"
                  title="Edit Donor"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                </button>
                <button
                  @click="confirmDelete(index, donor)"
                  class="text-red-400 hover:text-red-300 p-2 rounded transition-colors"
                  title="Delete Donor"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Individual Donations -->
            <div class="space-y-2">
              <h4 class="text-sm font-medium text-gray-300 mb-2">Donations:</h4>
              <div class="max-h-32 overflow-y-auto space-y-1">
                <div
                  v-for="(donation, donationIndex) in (donor.donations || [])"
                  :key="donationIndex"
                  class="flex justify-between items-center py-1 px-2 bg-white/5 rounded text-sm"
                >
                  <span class="text-white">€{{ donation.amount }}</span>
                  <span class="text-gray-400">{{ donation.date }}</span>
                </div>
              </div>
              <div v-if="!donor.donations || donor.donations.length === 0" class="text-gray-500 text-sm italic">
                No individual donations recorded
              </div>
            </div>
          </div>

          <div v-if="donors.length === 0" class="col-span-full text-center py-8">
            <p class="text-gray-400">No donors found. Add your first donor to get started!</p>
          </div>
        </div>

        <!-- Add/Edit Modal -->
        <div v-if="showModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div class="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 class="text-xl font-bold text-white mb-4">
              {{ editingIndex !== null ? 'Edit Donor' : 'Add New Donor' }}
            </h2>

            <form @submit.prevent="saveDonor" class="space-y-6">
              <!-- Basic Info -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                  <input
                    v-model="formData.name"
                    type="text"
                    required
                    class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Donor name"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-300 mb-2">Tier *</label>
                  <input
                    v-model="formData.tier"
                    type="text"
                    required
                    class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="VIP, Premium, S, A, B, etc."
                  />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-300 mb-2">SteamID (Optional)</label>
                <input
                  v-model="formData.steamid"
                  type="text"
                  class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="[U:1:XXXXXXXX]"
                />
              </div>

              <!-- Donations Section -->
              <div>
                <div class="flex justify-between items-center mb-3">
                  <label class="block text-sm font-medium text-gray-300">Donations *</label>
                  <button
                    type="button"
                    @click="addDonation"
                    class="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    + Add Donation
                  </button>
                </div>

                <div class="space-y-3 max-h-60 overflow-y-auto">
                  <div
                    v-for="(donation, index) in formData.donations"
                    :key="index"
                    class="flex gap-3 items-end p-3 bg-gray-700/50 rounded-lg"
                  >
                    <div class="flex-1">
                      <label class="block text-xs text-gray-400 mb-1">Amount (€)</label>
                      <input
                        v-model.number="donation.amount"
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        class="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div class="flex-1">
                      <label class="block text-xs text-gray-400 mb-1">Date</label>
                      <input
                        v-model="donation.date"
                        type="date"
                        required
                        class="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                    <button
                      type="button"
                      @click="removeDonation(index)"
                      class="text-red-400 hover:text-red-300 p-1 transition-colors"
                      title="Remove donation"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                      </svg>
                    </button>
                  </div>

                  <div v-if="formData.donations.length === 0" class="text-center py-4 text-gray-400 text-sm">
                    No donations added yet. Click "Add Donation" to get started.
                  </div>
                </div>

                <div v-if="formData.donations.length > 0" class="mt-3 p-2 bg-purple-500/20 rounded">
                  <p class="text-purple-300 text-sm">
                    Total: €{{ calculateTotal() }}
                  </p>
                </div>
              </div>

              <div v-if="modalError" class="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                <p class="text-red-200 text-sm">{{ modalError }}</p>
              </div>

              <div class="flex justify-end space-x-3 pt-4 border-t border-gray-600">
                <button
                  type="button"
                  @click="closeModal"
                  class="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  :disabled="saving || formData.donations.length === 0"
                  class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {{ saving ? 'Saving...' : 'Save' }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Delete Confirmation Modal -->
        <div v-if="showDeleteModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div class="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 class="text-xl font-bold text-white mb-4">Confirm Delete</h2>
            <p class="text-gray-300 mb-6">
              Are you sure you want to delete <strong>{{ deleteTarget?.name }}</strong>? This action cannot be undone.
            </p>
            
            <div class="flex justify-end space-x-3">
              <button
                @click="showDeleteModal = false"
                class="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                @click="deleteDonorConfirmed"
                :disabled="deleting"
                class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {{ deleting ? 'Deleting...' : 'Delete' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  </div>
</template>

<script setup>
definePageMeta({
  layout: false
});

const { getDonors, addDonor, updateDonor, deleteDonor, checkAuth } = useAdmin();

const donors = ref([]);
const loading = ref(true);
const error = ref(null);

const showModal = ref(false);
const editingIndex = ref(null);
const formData = ref({
  name: '',
  tier: '',
  steamid: '',
  donations: []
});
const modalError = ref(null);
const saving = ref(false);

const showDeleteModal = ref(false);
const deleteTarget = ref(null);
const deleteIndex = ref(null);
const deleting = ref(false);

// Load donors
const loadDonors = async () => {
  try {
    loading.value = true;
    error.value = null;

    // Check authentication first
    const isAuth = await checkAuth();
    if (!isAuth) {
      await navigateTo('/admin');
      return;
    }

    const data = await getDonors();
    donors.value = data.donors;
  } catch (err) {
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
  editingIndex.value = null;
  formData.value = {
    name: '',
    tier: '',
    steamid: '',
    donations: [{
      amount: 0,
      date: new Date().toISOString().split('T')[0]
    }]
  };
  modalError.value = null;
  showModal.value = true;
};

const openEditModal = (index, donor) => {
  editingIndex.value = index;
  formData.value = {
    name: donor.name || '',
    tier: donor.tier || '',
    steamid: donor.steamid || '',
    donations: donor.donations ? [...donor.donations] : [{
      amount: donor.amount || 0,
      date: donor.date || new Date().toISOString().split('T')[0]
    }]
  };
  modalError.value = null;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingIndex.value = null;
  modalError.value = null;
};

// Donation management functions
const addDonation = () => {
  formData.value.donations.push({
    amount: 0,
    date: new Date().toISOString().split('T')[0]
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

const saveDonor = async () => {
  try {
    saving.value = true;
    modalError.value = null;
    
    if (editingIndex.value !== null) {
      await updateDonor(editingIndex.value, formData.value);
    } else {
      await addDonor(formData.value);
    }
    
    await loadDonors();
    closeModal();
  } catch (err) {
    modalError.value = err.data?.message || 'Failed to save donor';
  } finally {
    saving.value = false;
  }
};

const confirmDelete = (index, donor) => {
  deleteIndex.value = index;
  deleteTarget.value = donor;
  showDeleteModal.value = true;
};

const deleteDonorConfirmed = async () => {
  try {
    deleting.value = true;
    await deleteDonor(deleteIndex.value);
    await loadDonors();
    showDeleteModal.value = false;
  } catch (err) {
    error.value = err.data?.message || 'Failed to delete donor';
  } finally {
    deleting.value = false;
  }
};

// Load data on mount
onMounted(() => {
  loadDonors();
});
</script>
