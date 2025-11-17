<template>
  <div class="account-verification">
    <h2 class="section-title">Account Verification</h2>
    <p class="section-description">Verify your identity to gain trust from other users</p>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading verification status...</p>
    </div>

    <!-- Already Verified -->
    <div v-else-if="isVerified" class="status-card verified">
      <div class="status-icon">✓</div>
      <h3>Account Verified</h3>
      <p>Your account has been successfully verified!</p>
    </div>

    <!-- Pending Verification -->
    <div v-else-if="verificationRequest && verificationRequest.status === 'pending'" class="status-card pending">
      <div class="status-icon">⏳</div>
      <h3>Verification Pending</h3>
      <p>Your verification request is being reviewed by an administrator.</p>
      <p class="submitted-date">Submitted: {{ formatDate(verificationRequest.createdAt) }}</p>
    </div>

    <!-- Rejected Verification -->
    <div v-else-if="verificationRequest && verificationRequest.status === 'rejected'" class="status-card rejected">
      <div class="status-icon">✗</div>
      <h3>Verification Rejected</h3>
      <p>Your verification request was rejected.</p>
      <p class="rejection-reason" v-if="verificationRequest.rejection_reason">
        <strong>Reason:</strong> {{ verificationRequest.rejection_reason }}
      </p>
      <p class="resubmit-info">You can submit a new verification request below.</p>
    </div>

    <!-- Verification Form -->
    <div v-if="!isVerified && (!verificationRequest || verificationRequest.status === 'rejected')" class="verification-form">
      <h3>Submit Verification Request</h3>
      <p class="form-description">Please provide your personal information and upload a photo of your ID document.</p>

      <form @submit.prevent="handleSubmit">
        <div class="form-row">
          <div class="form-group">
            <label for="first_name">First Name *</label>
            <input
              type="text"
              id="first_name"
              v-model="formData.first_name"
              required
              placeholder="Enter your first name"
            />
          </div>

          <div class="form-group">
            <label for="last_name">Last Name *</label>
            <input
              type="text"
              id="last_name"
              v-model="formData.last_name"
              required
              placeholder="Enter your last name"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="date_of_birth">Date of Birth *</label>
            <input
              type="date"
              id="date_of_birth"
              v-model="formData.date_of_birth"
              required
              :max="maxDate"
            />
          </div>

          <div class="form-group">
            <label for="nationality">Nationality *</label>
            <input
              type="text"
              id="nationality"
              v-model="formData.nationality"
              required
              placeholder="Enter your nationality"
            />
          </div>
        </div>

        <div class="form-group">
          <label for="id_number">ID Number *</label>
          <input
            type="text"
            id="id_number"
            v-model="formData.id_number"
            required
            placeholder="Enter your passport/ID/driver's license number"
          />
        </div>

        <div class="form-group">
          <label for="id_document">ID Document Photo *</label>
          <p class="field-help">Upload a clear photo of your passport, citizen ID, or driver's license (JPEG, PNG, or PDF, max 5MB)</p>
          <input
            type="file"
            id="id_document"
            @change="handleFileChange"
            accept="image/jpeg,image/jpg,image/png,application/pdf"
            required
            class="file-input"
          />
          <div v-if="selectedFile" class="file-preview">
            <span class="file-name">{{ selectedFile.name }}</span>
            <button type="button" @click="removeFile" class="remove-file">×</button>
          </div>
        </div>

        <div class="disclaimer">
          <p><strong>Disclaimer:</strong> Your data will be securely reviewed by an administrator for verification purposes only. We take your privacy seriously and will not share your information with third parties.</p>
        </div>

        <div v-if="error" class="error-message">{{ error }}</div>
        <div v-if="success" class="success-message">{{ success }}</div>

        <button type="submit" class="submit-button" :disabled="submitting">
          {{ submitting ? 'Submitting...' : 'Submit Verification Request' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../../stores/authStore'
import verificationService from '../../services/verificationService'

const authStore = useAuthStore()
const loading = ref(true)
const submitting = ref(false)
const error = ref('')
const success = ref('')
const verificationRequest = ref(null)
const selectedFile = ref(null)

const formData = ref({
  first_name: '',
  last_name: '',
  date_of_birth: '',
  nationality: '',
  id_number: ''
})

const isVerified = computed(() => authStore.user?.id_verified || false)

// Max date for date of birth (18 years ago)
const maxDate = computed(() => {
  const date = new Date()
  date.setFullYear(date.getFullYear() - 18)
  return date.toISOString().split('T')[0]
})

onMounted(async () => {
  await fetchVerificationStatus()
})

async function fetchVerificationStatus() {
  try {
    loading.value = true
    const response = await verificationService.getMyRequest()
    verificationRequest.value = response.request

    // Refresh user data to get updated id_verified status
    await authStore.verifyToken()
  } catch (err) {
    console.error('Error fetching verification status:', err)
  } finally {
    loading.value = false
  }
}

function handleFileChange(event) {
  const file = event.target.files[0]
  if (file) {
    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      error.value = 'File size must be less than 5MB'
      event.target.value = ''
      return
    }
    selectedFile.value = file
    error.value = ''
  }
}

function removeFile() {
  selectedFile.value = null
  document.getElementById('id_document').value = ''
}

async function handleSubmit() {
  try {
    error.value = ''
    success.value = ''

    // Validate all fields are filled
    if (!formData.value.first_name.trim()) {
      error.value = 'First name is required'
      return
    }
    if (!formData.value.last_name.trim()) {
      error.value = 'Last name is required'
      return
    }
    if (!formData.value.date_of_birth) {
      error.value = 'Date of birth is required'
      return
    }
    if (!formData.value.nationality.trim()) {
      error.value = 'Nationality is required'
      return
    }
    if (!formData.value.id_number.trim()) {
      error.value = 'ID number is required'
      return
    }
    if (!selectedFile.value) {
      error.value = 'ID document photo is required'
      return
    }

    submitting.value = true

    // Create FormData
    const submitData = new FormData()
    submitData.append('first_name', formData.value.first_name)
    submitData.append('last_name', formData.value.last_name)
    submitData.append('date_of_birth', formData.value.date_of_birth)
    submitData.append('nationality', formData.value.nationality)
    submitData.append('id_number', formData.value.id_number)
    submitData.append('id_document_photo', selectedFile.value)

    const response = await verificationService.submitVerification(submitData)

    success.value = response.message

    // Reset form
    formData.value = {
      first_name: '',
      last_name: '',
      date_of_birth: '',
      nationality: '',
      id_number: ''
    }
    selectedFile.value = null
    document.getElementById('id_document').value = ''

    // Refresh verification status
    await fetchVerificationStatus()
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to submit verification request'
  } finally {
    submitting.value = false
  }
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<style scoped>
.account-verification {
  max-width: 800px;
  margin: 0 auto;
}

.section-title {
  font-size: 1.8rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.section-description {
  color: #666;
  margin-bottom: 2rem;
}

.loading-state {
  text-align: center;
  padding: 3rem;
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

.status-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  margin-bottom: 2rem;
  border: 2px solid;
}

.status-card.verified {
  border-color: #4CAF50;
  background: linear-gradient(135deg, #f1f8f4 0%, #e8f5e9 100%);
}

.status-card.pending {
  border-color: #FFA726;
  background: linear-gradient(135deg, #fff8f0 0%, #fff3e0 100%);
}

.status-card.rejected {
  border-color: #EF5350;
  background: linear-gradient(135deg, #fff5f5 0%, #ffebee 100%);
}

.status-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.status-card.verified .status-icon {
  color: #4CAF50;
}

.status-card.pending .status-icon {
  color: #FFA726;
}

.status-card.rejected .status-icon {
  color: #EF5350;
}

.status-card h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: #333;
}

.status-card p {
  color: #666;
  margin-bottom: 0.5rem;
}

.submitted-date,
.rejection-reason {
  font-size: 0.9rem;
  color: #888;
  margin-top: 1rem;
}

.resubmit-info {
  margin-top: 1rem;
  font-weight: 500;
  color: #00AAFF;
}

.verification-form {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid #e0e0e0;
}

.verification-form h3 {
  font-size: 1.3rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.form-description {
  color: #666;
  margin-bottom: 2rem;
  font-size: 0.95rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.field-help {
  font-size: 0.85rem;
  color: #888;
  margin-bottom: 0.5rem;
}

.form-group input[type="text"],
.form-group input[type="date"] {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
}

.form-group input:focus {
  outline: none;
  border-color: #00AAFF;
}

.file-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.3s;
}

.file-input:hover {
  border-color: #00AAFF;
}

.file-preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.5rem;
  padding: 0.75rem;
  background: #f5f5f5;
  border-radius: 8px;
}

.file-name {
  font-size: 0.9rem;
  color: #333;
}

.remove-file {
  background: #EF5350;
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
  transition: background 0.3s;
}

.remove-file:hover {
  background: #d32f2f;
}

.disclaimer {
  background: #f0f7ff;
  border-left: 4px solid #00AAFF;
  padding: 1rem;
  margin: 1.5rem 0;
  border-radius: 4px;
}

.disclaimer p {
  font-size: 0.9rem;
  color: #555;
  margin: 0;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border-left: 4px solid #EF5350;
}

.success-message {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  border-left: 4px solid #4CAF50;
}

.submit-button {
  width: 100%;
  padding: 1rem;
  background: #00AAFF;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s, transform 0.2s;
}

.submit-button:hover:not(:disabled) {
  background: #0088CC;
  transform: translateY(-2px);
}

.submit-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
