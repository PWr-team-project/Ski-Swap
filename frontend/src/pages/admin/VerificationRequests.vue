<template>
  <div class="verification-requests-page">
    <div class="page-container">
      <div class="page-header">
        <h1>Verification Requests</h1>
        <p>Review and manage user verification requests</p>
      </div>

      <!-- Status Filter Tabs -->
      <div class="filter-tabs">
        <button
          v-for="status in statusFilters"
          :key="status.value"
          @click="currentStatus = status.value"
          :class="['filter-tab', { active: currentStatus === status.value }]"
        >
          <span class="tab-label">{{ status.label }}</span>
          <span v-if="status.value === 'pending' && pendingCount > 0" class="badge">{{ pendingCount }}</span>
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading verification requests...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button @click="fetchRequests" class="retry-button">Retry</button>
      </div>

      <!-- Empty State -->
      <div v-else-if="requests.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <h3>No {{ currentStatus }} requests</h3>
        <p>There are no verification requests with status "{{ currentStatus }}"</p>
      </div>

      <!-- Requests Table -->
      <div v-else class="requests-table-container">
        <table class="requests-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Submitted</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="request in requests" :key="request.id" class="request-row">
              <td class="user-cell">
                <div class="user-info">
                  <div class="user-avatar">
                    <img
                      v-if="request.user.profile_photo"
                      :src="getPhotoUrl(request.user.profile_photo)"
                      alt="Profile"
                    />
                    <div v-else class="avatar-placeholder">
                      {{ request.user.nickname[0].toUpperCase() }}
                    </div>
                  </div>
                  <div>
                    <div class="user-name">{{ request.user.name }}</div>
                    <div class="user-nickname">@{{ request.user.nickname }}</div>
                  </div>
                </div>
              </td>
              <td>{{ request.user.email }}</td>
              <td>{{ formatDate(request.createdAt) }}</td>
              <td>
                <span :class="['status-badge', request.status]">
                  {{ request.status.toUpperCase() }}
                </span>
              </td>
              <td>
                <button @click="viewRequest(request.id)" class="view-button">
                  View Details
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import verificationService from '../../services/verificationService'

const router = useRouter()
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const loading = ref(true)
const error = ref('')
const requests = ref([])
const currentStatus = ref('pending')

const statusFilters = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' }
]

const pendingCount = computed(() => {
  if (currentStatus.value === 'pending') {
    return requests.value.length
  }
  return 0
})

onMounted(() => {
  fetchRequests()
})

watch(currentStatus, () => {
  fetchRequests()
})

async function fetchRequests() {
  try {
    loading.value = true
    error.value = ''
    const response = await verificationService.getAdminRequests(currentStatus.value)
    requests.value = response.requests
  } catch (err) {
    console.error('Error fetching verification requests:', err)
    error.value = err.response?.data?.message || 'Failed to fetch verification requests'
  } finally {
    loading.value = false
  }
}

function viewRequest(requestId) {
  router.push(`/admin/verification-requests/${requestId}`)
}

function getPhotoUrl(photoPath) {
  if (!photoPath) return null
  if (photoPath.startsWith('http')) return photoPath
  return `${API_URL}${photoPath}`
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.verification-requests-page {
  background: linear-gradient(135deg, #f0f7ff 0%, #e3f2fd 100%);
  min-height: calc(100vh - 140px);
  padding: 2rem 0;
}

.page-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 2rem;
}

.page-header {
  text-align: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.page-header p {
  font-size: 1.1rem;
  color: #666;
}

.filter-tabs {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  background: white;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.filter-tab {
  flex: 1;
  padding: 0.75rem 1.5rem;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.filter-tab:hover {
  border-color: #00AAFF;
  color: #00AAFF;
}

.filter-tab.active {
  background: #00AAFF;
  border-color: #00AAFF;
  color: white;
}

.badge {
  background: #EF5350;
  color: white;
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  min-width: 20px;
  text-align: center;
}

.filter-tab.active .badge {
  background: white;
  color: #00AAFF;
}

.loading-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #00AAFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  color: #EF5350;
}

.retry-button {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: #00AAFF;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s;
}

.retry-button:hover {
  background: #0088CC;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #666;
}

.requests-table-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.requests-table {
  width: 100%;
  border-collapse: collapse;
}

.requests-table thead {
  background: linear-gradient(135deg, #00AAFF 0%, #0088CC 100%);
  color: white;
}

.requests-table th {
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.95rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.request-row {
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.2s;
}

.request-row:hover {
  background: #f8f9fa;
}

.request-row td {
  padding: 1rem;
  vertical-align: middle;
}

.user-cell {
  min-width: 200px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  flex-shrink: 0;
}

.user-avatar img,
.avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  background: #00AAFF;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.2rem;
}

.user-name {
  font-weight: 600;
  color: #333;
}

.user-nickname {
  font-size: 0.85rem;
  color: #888;
}

.status-badge {
  display: inline-block;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.status-badge.pending {
  background: #FFF3E0;
  color: #F57C00;
}

.status-badge.approved {
  background: #E8F5E9;
  color: #2E7D32;
}

.status-badge.rejected {
  background: #FFEBEE;
  color: #C62828;
}

.view-button {
  padding: 0.5rem 1rem;
  background: #00AAFF;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.view-button:hover {
  background: #0088CC;
  transform: translateY(-2px);
}

@media (max-width: 1024px) {
  .requests-table-container {
    overflow-x: auto;
  }

  .requests-table {
    min-width: 800px;
  }
}

@media (max-width: 768px) {
  .page-container {
    padding: 0 1rem;
  }

  .filter-tabs {
    flex-direction: column;
  }
}
</style>
