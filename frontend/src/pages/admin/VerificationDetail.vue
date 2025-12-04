<template>
  <div class="verification-detail-page">
    <div class="page-container">
      <!-- Back Button -->
      <button @click="goBack" class="back-button">
        ← Back to Requests
      </button>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading verification request...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
        <button @click="fetchRequestDetails" class="retry-button">Retry</button>
      </div>

      <!-- Request Details -->
      <div v-else-if="request" class="request-details">
        <div class="details-header">
          <h1>Verification Request Details</h1>
          <span :class="['status-badge-large', request.status]">
            {{ request.status.toUpperCase() }}
          </span>
        </div>

        <div class="content-grid">
          <!-- User Information -->
          <div class="info-card">
            <h2>User Information</h2>
            <div class="user-profile">
              <div class="user-avatar-large">
                <img
                  v-if="request.user.profile_photo"
                  :src="getPhotoUrl(request.user.profile_photo)"
                  alt="Profile"
                />
                <div v-else class="avatar-placeholder-large">
                  {{ request.user.nickname[0].toUpperCase() }}
                </div>
              </div>
              <div class="user-details">
                <div class="detail-row">
                  <span class="label">Name:</span>
                  <span class="value">{{ request.user.name }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Nickname:</span>
                  <span class="value">@{{ request.user.nickname }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Email:</span>
                  <span class="value">{{ request.user.email }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Submitted Information -->
          <div class="info-card">
            <h2>Submitted Information</h2>
            <div class="detail-row">
              <span class="label">First Name:</span>
              <span class="value">{{ request.verification_data.first_name }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Last Name:</span>
              <span class="value">{{ request.verification_data.last_name }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Date of Birth:</span>
              <span class="value">{{ formatDate(request.verification_data.date_of_birth) }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Nationality:</span>
              <span class="value">{{ request.verification_data.nationality }}</span>
            </div>
            <div class="detail-row">
              <span class="label">ID Number:</span>
              <span class="value">{{ request.verification_data.id_number }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Submitted:</span>
              <span class="value">{{ formatDateTime(request.createdAt) }}</span>
            </div>
          </div>

          <!-- ID Document Photo -->
          <div class="info-card document-card">
            <h2>ID Document Photo</h2>
            <div class="document-preview">
              <img
                :src="getPhotoUrl(request.verification_data.id_document_photo)"
                alt="ID Document"
                @click="showFullImage = true"
                class="document-image"
              />
              <p class="click-hint">Click to view full size</p>
            </div>
          </div>

          <!-- Review Information (if reviewed) -->
          <div v-if="request.status !== 'pending'" class="info-card">
            <h2>Review Information</h2>
            <div class="detail-row">
              <span class="label">Status:</span>
              <span :class="['value', 'status-' + request.status]">
                {{ request.status.toUpperCase() }}
              </span>
            </div>
            <div class="detail-row">
              <span class="label">Reviewed At:</span>
              <span class="value">{{ formatDateTime(request.reviewed_at) }}</span>
            </div>
            <div class="detail-row" v-if="request.reviewed_by">
              <span class="label">Reviewed By:</span>
              <span class="value">{{ request.reviewed_by.nickname }}</span>
            </div>
            <div v-if="request.status === 'rejected'" class="rejection-reason">
              <span class="label">Rejection Reason:</span>
              <p class="reason-text">{{ request.rejection_reason }}</p>
            </div>
          </div>
        </div>

        <!-- Action Buttons (only for pending requests) -->
        <div v-if="request.status === 'pending'" class="action-buttons">
          <button @click="showRejectModal = true" class="reject-button" :disabled="processing">
            Reject
          </button>
          <button @click="approveRequest" class="approve-button" :disabled="processing">
            {{ processing ? 'Processing...' : 'Approve' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Full Image Modal -->
    <div v-if="showFullImage" class="modal-overlay" @click="showFullImage = false">
      <div class="modal-content" @click.stop>
        <button @click="showFullImage = false" class="close-modal">×</button>
        <img
          :src="getPhotoUrl(request.verification_data.id_document_photo)"
          alt="ID Document Full Size"
          class="full-image"
        />
      </div>
    </div>

    <!-- Reject Modal -->
    <div v-if="showRejectModal" class="modal-overlay" @click="showRejectModal = false">
      <div class="modal-content reject-modal" @click.stop>
        <h2>Reject Verification Request</h2>
        <p>Please provide a reason for rejecting this verification request:</p>
        <textarea
          v-model="rejectionReason"
          placeholder="Enter rejection reason..."
          rows="5"
          class="rejection-textarea"
        ></textarea>
        <div v-if="rejectionError" class="error-message">{{ rejectionError }}</div>
        <div class="modal-buttons">
          <button @click="showRejectModal = false" class="cancel-button">Cancel</button>
          <button @click="rejectRequest" class="confirm-reject-button" :disabled="processing || !rejectionReason.trim()">
            {{ processing ? 'Processing...' : 'Confirm Rejection' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import verificationService from '../../services/verificationService'
import { getFullImageUrl } from '@/utils/api'

const router = useRouter()
const route = useRoute()

const loading = ref(true)
const error = ref('')
const request = ref(null)
const processing = ref(false)
const showFullImage = ref(false)
const showRejectModal = ref(false)
const rejectionReason = ref('')
const rejectionError = ref('')

onMounted(() => {
  fetchRequestDetails()
})

async function fetchRequestDetails() {
  try {
    loading.value = true
    error.value = ''
    const requestId = route.params.id
    const response = await verificationService.getRequestDetails(requestId)
    request.value = response.request
  } catch (err) {
    console.error('Error fetching request details:', err)
    error.value = err.response?.data?.message || 'Failed to fetch request details'
  } finally {
    loading.value = false
  }
}

async function approveRequest() {
  if (!confirm('Are you sure you want to approve this verification request?')) {
    return
  }

  try {
    processing.value = true
    await verificationService.approveRequest(request.value.id)
    alert('Verification request approved successfully!')
    router.push('/admin/verification-requests')
  } catch (err) {
    console.error('Error approving request:', err)
    alert(err.response?.data?.message || 'Failed to approve request')
  } finally {
    processing.value = false
  }
}

async function rejectRequest() {
  if (!rejectionReason.value.trim()) {
    rejectionError.value = 'Please provide a rejection reason'
    return
  }

  try {
    processing.value = true
    rejectionError.value = ''
    await verificationService.rejectRequest(request.value.id, rejectionReason.value)
    alert('Verification request rejected successfully!')
    router.push('/admin/verification-requests')
  } catch (err) {
    console.error('Error rejecting request:', err)
    rejectionError.value = err.response?.data?.message || 'Failed to reject request'
  } finally {
    processing.value = false
  }
}

function goBack() {
  router.push('/admin/verification-requests')
}

function getPhotoUrl(photoPath) {
  if (!photoPath) return null
  return getFullImageUrl(photoPath)
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function formatDateTime(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.verification-detail-page {
  background: linear-gradient(135deg, #f0f7ff 0%, #e3f2fd 100%);
  min-height: calc(100vh - 140px);
  padding: 2rem 0;
}

.page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.back-button {
  padding: 0.75rem 1.5rem;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 1.5rem;
  color: #666;
}

.back-button:hover {
  border-color: #00AAFF;
  color: #00AAFF;
}

.loading-state,
.error-state {
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

.request-details {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 2rem;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f0f0f0;
}

.details-header h1 {
  font-size: 2rem;
  color: #333;
  margin: 0;
}

.status-badge-large {
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 1px;
}

.status-badge-large.pending {
  background: #FFF3E0;
  color: #F57C00;
}

.status-badge-large.approved {
  background: #E8F5E9;
  color: #2E7D32;
}

.status-badge-large.rejected {
  background: #FFEBEE;
  color: #C62828;
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.info-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.5rem;
}

.info-card h2 {
  font-size: 1.3rem;
  color: #333;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e0e0e0;
}

.user-profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.user-avatar-large img,
.avatar-placeholder-large {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder-large {
  background: #00AAFF;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 2.5rem;
}

.user-details {
  width: 100%;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e0e0e0;
}

.detail-row:last-child {
  border-bottom: none;
}

.label {
  font-weight: 600;
  color: #666;
}

.value {
  color: #333;
  text-align: right;
}

.value.status-approved {
  color: #2E7D32;
  font-weight: 700;
}

.value.status-rejected {
  color: #C62828;
  font-weight: 700;
}

.document-card {
  grid-column: 1 / -1;
}

.document-preview {
  text-align: center;
}

.document-image {
  max-width: 100%;
  max-height: 500px;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.3s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.document-image:hover {
  transform: scale(1.02);
}

.click-hint {
  margin-top: 0.5rem;
  font-size: 0.9rem;
  color: #888;
  font-style: italic;
}

.rejection-reason {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 2px solid #e0e0e0;
}

.reason-text {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #EF5350;
  margin-top: 0.5rem;
  color: #555;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1.5rem;
  border-top: 2px solid #f0f0f0;
}

.approve-button,
.reject-button {
  padding: 1rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s;
}

.approve-button {
  background: #4CAF50;
  color: white;
}

.approve-button:hover:not(:disabled) {
  background: #388E3C;
  transform: translateY(-2px);
}

.reject-button {
  background: #EF5350;
  color: white;
}

.reject-button:hover:not(:disabled) {
  background: #C62828;
  transform: translateY(-2px);
}

.approve-button:disabled,
.reject-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
  position: relative;
}

.close-modal {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  border-radius: 50%;
  font-size: 2rem;
  cursor: pointer;
  line-height: 1;
  transition: background 0.3s;
  z-index: 10;
}

.close-modal:hover {
  background: rgba(0, 0, 0, 0.7);
}

.full-image {
  max-width: 100%;
  max-height: 90vh;
  display: block;
}

.reject-modal {
  padding: 2rem;
  max-width: 600px;
}

.reject-modal h2 {
  margin-bottom: 1rem;
  color: #333;
}

.reject-modal p {
  margin-bottom: 1rem;
  color: #666;
}

.rejection-textarea {
  width: 100%;
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  margin-bottom: 1rem;
}

.rejection-textarea:focus {
  outline: none;
  border-color: #00AAFF;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
}

.modal-buttons {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.cancel-button,
.confirm-reject-button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.cancel-button {
  background: #e0e0e0;
  color: #666;
}

.cancel-button:hover {
  background: #d0d0d0;
}

.confirm-reject-button {
  background: #EF5350;
  color: white;
}

.confirm-reject-button:hover:not(:disabled) {
  background: #C62828;
}

.confirm-reject-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style>
