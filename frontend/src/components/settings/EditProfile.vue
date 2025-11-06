<template>
  <div class="edit-profile">
    <h2>Edit Profile</h2>
    <p class="section-description">Update your personal information and profile picture</p>

    <form @submit.prevent="handleSubmit" class="profile-form">
      <!-- Profile Photo Section -->
      <div class="form-section">
        <h3>Profile Photo</h3>
        <div class="photo-upload">
          <div class="current-photo">
            <img
              v-if="photoPreview || user?.profile_photo"
              :src="photoPreview || user?.profile_photo"
              alt="Profile"
              class="profile-img"
            />
            <div v-else class="photo-placeholder">
              {{ (user?.nickname || 'U')[0].toUpperCase() }}
            </div>
          </div>

          <div class="photo-actions">
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              @change="handlePhotoChange"
              style="display: none"
            />
            <button type="button" @click="triggerFileInput" class="upload-btn">
              Choose Photo
            </button>
            <button
              v-if="photoPreview || user?.profile_photo"
              type="button"
              @click="removePhoto"
              class="remove-btn"
            >
              Remove Photo
            </button>
            <p class="photo-hint">JPG, PNG or GIF. Max 2MB.</p>
          </div>
        </div>
      </div>

      <!-- Personal Information -->
      <div class="form-section">
        <h3>Personal Information</h3>

        <div class="form-row">
          <div class="form-group">
            <label for="firstName">First Name</label>
            <input
              id="firstName"
              v-model="formData.firstName"
              type="text"
              class="form-input"
              required
            />
          </div>

          <div class="form-group">
            <label for="lastName">Last Name</label>
            <input
              id="lastName"
              v-model="formData.lastName"
              type="text"
              class="form-input"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            class="form-input"
            disabled
          />
          <small class="input-hint">Email cannot be changed</small>
        </div>

        <div class="form-group">
          <label for="nickname">Nickname</label>
          <input
            id="nickname"
            v-model="formData.nickname"
            type="text"
            class="form-input"
            disabled
          />
          <small class="input-hint">Nickname cannot be changed</small>
        </div>

        <div class="form-group">
          <label for="phone">Phone Number</label>
          <input
            id="phone"
            v-model="formData.phoneNumber"
            type="tel"
            class="form-input"
            placeholder="+48 123 456 789"
          />
        </div>

        <div class="form-group">
          <label for="address">Address</label>
          <textarea
            id="address"
            v-model="formData.address"
            class="form-textarea"
            rows="3"
            placeholder="Enter your address"
          ></textarea>
        </div>
      </div>

      <!-- Success/Error Messages -->
      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <!-- Action Buttons -->
      <div class="form-actions">
        <button type="button" @click="resetForm" class="cancel-btn" :disabled="loading">
          Cancel
        </button>
        <button type="submit" class="save-btn" :disabled="loading">
          {{ loading ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '../../stores/authStore'
import axios from 'axios'

const authStore = useAuthStore()
const user = authStore.user

const fileInput = ref(null)
const photoPreview = ref(null)
const selectedPhoto = ref(null)
const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const formData = reactive({
  firstName: '',
  lastName: '',
  email: '',
  nickname: '',
  phoneNumber: '',
  address: ''
})

// Initialize form with user data
onMounted(() => {
  if (user) {
    formData.firstName = user.first_name || ''
    formData.lastName = user.last_name || ''
    formData.email = user.email || ''
    formData.nickname = user.nickname || ''
    formData.phoneNumber = user.phone_number || ''
    formData.address = user.address || ''
  }
})

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handlePhotoChange = (event) => {
  const file = event.target.files?.[0]
  if (file) {
    if (file.size > 2 * 1024 * 1024) {
      errorMessage.value = 'File size must be less than 2MB'
      return
    }

    selectedPhoto.value = file
    const reader = new FileReader()
    reader.onload = (e) => {
      photoPreview.value = e.target?.result
    }
    reader.readAsDataURL(file)
  }
}

const removePhoto = () => {
  photoPreview.value = null
  selectedPhoto.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const resetForm = () => {
  if (user) {
    formData.firstName = user.first_name || ''
    formData.lastName = user.last_name || ''
    formData.phoneNumber = user.phone_number || ''
    formData.address = user.address || ''
  }
  removePhoto()
  successMessage.value = ''
  errorMessage.value = ''
}

const handleSubmit = async () => {
  loading.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    const token = authStore.token
    const formDataToSend = new FormData()

    formDataToSend.append('first_name', formData.firstName)
    formDataToSend.append('last_name', formData.lastName)
    formDataToSend.append('phone_number', formData.phoneNumber || '')
    formDataToSend.append('address', formData.address || '')

    if (selectedPhoto.value) {
      formDataToSend.append('profile_photo', selectedPhoto.value)
    }

    const response = await axios.put(
      'http://localhost:5000/api/auth/profile',
      formDataToSend,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      }
    )

    // Update auth store with new user data
    authStore.user = response.data.user
    successMessage.value = 'Profile updated successfully!'

    // Clear photo selection
    selectedPhoto.value = null
    photoPreview.value = null

    // Scroll to top to show success message
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (error) {
    console.error('Error updating profile:', error)
    errorMessage.value = error.response?.data?.message || 'Failed to update profile'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.edit-profile {
  max-width: 800px;
}

h2 {
  font-size: 1.75rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.section-description {
  color: #666;
  margin-bottom: 2rem;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 2rem;
}

.form-section:last-of-type {
  border-bottom: none;
}

.form-section h3 {
  font-size: 1.25rem;
  color: #333;
  margin-bottom: 1.5rem;
}

.photo-upload {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.current-photo {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #e0e0e0;
}

.profile-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #00AAFF 0%, #66D1FF 100%);
  color: white;
  font-size: 3rem;
  font-weight: 600;
}

.photo-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.upload-btn, .remove-btn {
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.upload-btn {
  background: #00AAFF;
  color: white;
}

.upload-btn:hover {
  background: #0088CC;
}

.remove-btn {
  background: #f5f5f5;
  color: #d32f2f;
}

.remove-btn:hover {
  background: #ffe0e0;
}

.photo-hint {
  font-size: 0.875rem;
  color: #999;
  margin: 0;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.form-group label {
  font-size: 0.95rem;
  font-weight: 600;
  color: #555;
}

.form-input, .form-textarea {
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: border-color 0.3s ease;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: #00AAFF;
}

.form-input:disabled {
  background: #f5f5f5;
  color: #999;
  cursor: not-allowed;
}

.form-textarea {
  resize: vertical;
  font-family: inherit;
}

.input-hint {
  font-size: 0.85rem;
  color: #999;
  font-style: italic;
}

.success-message {
  background: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
}

.error-message {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.cancel-btn, .save-btn {
  padding: 0.875rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.cancel-btn:hover:not(:disabled) {
  background: #e0e0e0;
}

.save-btn {
  background: #00AAFF;
  color: white;
}

.save-btn:hover:not(:disabled) {
  background: #0088CC;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 170, 255, 0.3);
}

.cancel-btn:disabled, .save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .photo-upload {
    flex-direction: column;
    align-items: flex-start;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .cancel-btn, .save-btn {
    width: 100%;
  }
}
</style>
