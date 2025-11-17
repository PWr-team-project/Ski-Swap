<template>
    <div class="profile-form">
      <!-- Success/Error Messages -->
      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <!-- Photos Section -->
      <div class="form-section">
        <div class="section-header">
          <span class="section-number">1</span>
          <h3>Photos</h3>
        </div>
        <div class="photos-grid">
          <!-- Profile Photo -->
          <div class="photo-upload-box">
            <label class="photo-label">Profile Photo</label>
            <div class="current-photo profile-photo">
              <img
                v-if="profilePhotoPreview || authStore.user?.profile_photo"
                :src="profilePhotoPreview || getPhotoUrl(authStore.user?.profile_photo)"
                alt="Profile"
                class="photo-img"
              />
              <div v-else class="photo-placeholder">
                {{ (authStore.user?.nickname || 'U')[0].toUpperCase() }}
              </div>
            </div>
            <div class="photo-actions">
              <input
                ref="profileFileInput"
                type="file"
                accept="image/*"
                @change="handleProfilePhotoChange"
                style="display: none"
              />
              <button type="button" @click="$refs.profileFileInput.click()" class="upload-btn">
                Choose Photo
              </button>
              <button
                v-if="profilePhotoPreview || authStore.user?.profile_photo"
                type="button"
                @click="removeProfilePhoto"
                class="remove-btn-small"
              >
                Remove
              </button>
            </div>
            <p class="photo-hint">Square image recommended. Max 2MB.</p>
          </div>

          <!-- Background Photo -->
          <div class="photo-upload-box">
            <label class="photo-label">Background Photo</label>
            <div class="current-photo background-photo">
              <img
                v-if="backgroundPhotoPreview || authStore.user?.background_photo"
                :src="backgroundPhotoPreview || getPhotoUrl(authStore.user?.background_photo)"
                alt="Background"
                class="photo-img"
              />
              <div v-else class="photo-placeholder-bg">
                <span>No background photo</span>
              </div>
            </div>
            <div class="photo-actions">
              <input
                ref="backgroundFileInput"
                type="file"
                accept="image/*"
                @change="handleBackgroundPhotoChange"
                style="display: none"
              />
              <button type="button" @click="$refs.backgroundFileInput.click()" class="upload-btn">
                Choose Photo
              </button>
              <button
                v-if="backgroundPhotoPreview || authStore.user?.background_photo"
                type="button"
                @click="removeBackgroundPhoto"
                class="remove-btn-small"
              >
                Remove
              </button>
            </div>
            <p class="photo-hint">Wide image recommended. Max 2MB.</p>
          </div>
        </div>
      </div>

      <!-- Personal Information -->
      <div class="form-section">
        <div class="section-header">
          <span class="section-number">2</span>
          <h3>Personal Information</h3>
        </div>

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

        <div class="form-row">
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
        </div>

        <div class="form-group-with-buttons">
          <div class="form-group">
            <label for="phone">Phone Number</label>
            <input
              id="phone"
              v-model="formData.phoneNumber"
              type="tel"
              class="form-input form-input-short"
              placeholder="+48 123 456 789"
            />
          </div>
          <div class="inline-buttons">
            <button type="button" @click="resetPersonalInfo" class="cancel-btn-small" :disabled="loading">
              Cancel
            </button>
            <button type="button" @click="savePersonalInfo" class="save-btn-small" :disabled="loading">
              {{ loading ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Location Information -->
      <div class="form-section">
        <div class="section-header">
          <span class="section-number">3</span>
          <h3>Location</h3>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="country">Country</label>
            <input
              id="country"
              v-model="formData.location.country"
              type="text"
              class="form-input"
              placeholder="Poland"
            />
          </div>

          <div class="form-group">
            <label for="state">State/Province</label>
            <input
              id="state"
              v-model="formData.location.state"
              type="text"
              class="form-input"
              placeholder="Mazowieckie"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="city">City</label>
            <input
              id="city"
              v-model="formData.location.city"
              type="text"
              class="form-input"
              placeholder="Warsaw"
            />
          </div>

          <div class="form-group">
            <label for="street">Street</label>
            <input
              id="street"
              v-model="formData.location.street"
              type="text"
              class="form-input"
              placeholder="Main Street"
            />
          </div>
        </div>

        <div class="form-group-with-buttons">
          <div class="form-group">
            <label for="streetNumber">Street Number</label>
            <input
              id="streetNumber"
              v-model="formData.location.streetNumber"
              type="text"
              class="form-input form-input-short"
              placeholder="123"
            />
          </div>
          <div class="inline-buttons">
            <button type="button" @click="resetLocation" class="cancel-btn-small" :disabled="loading">
              Cancel
            </button>
            <button type="button" @click="saveLocation" class="save-btn-small" :disabled="loading">
              {{ loading ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Company Upgrade Section -->
      <div v-if="authStore.user?.user_type !== 'company'" class="form-section company-section">
        <div class="company-header" @click="showCompanyFields = !showCompanyFields">
          <div class="section-header">
            <span class="section-number">4</span>
            <h3>Upgrade to Company Account</h3>
          </div>
          <button type="button" class="toggle-btn">
            {{ showCompanyFields ? '−' : '+' }}
          </button>
        </div>
        <p class="company-description">
          Convert your account to a company profile. This action is irreversible.
        </p>

        <div v-if="showCompanyFields" class="company-fields">
          <div class="warning-box">
            <img src="/assets/icons/warning.svg" alt="Warning" class="warning-icon" />
            <span>Warning: Converting to a company account cannot be undone</span>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="nipNumber">NIP Number (Tax ID)</label>
              <input
                id="nipNumber"
                v-model="formData.company.nipNumber"
                type="text"
                class="form-input form-input-short"
                placeholder="1234567890"
                maxlength="10"
                pattern="\d{10}"
              />
              <small class="input-hint">10-digit Polish tax identification number</small>
            </div>

            <div class="form-group">
              <label for="website">Company Website</label>
              <input
                id="website"
                v-model="formData.company.websiteAddress"
                type="url"
                class="form-input form-input-medium"
                placeholder="https://www.example.com"
              />
            </div>
          </div>

          <div class="form-group checkbox-group">
            <label class="checkbox-label">
              <input
                v-model="formData.company.confirmUpgrade"
                type="checkbox"
              />
              <span>I understand that upgrading to a company account is permanent and cannot be reversed</span>
            </label>
          </div>

          <!-- Company Upgrade Button -->
          <div class="upgrade-button-container">
            <button
              type="button"
              @click="upgradeToCompany"
              class="upgrade-btn"
              :disabled="loading || !formData.company.confirmUpgrade"
            >
              {{ loading ? 'Upgrading...' : 'Upgrade to Company' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Company Information (Read-only for existing companies) -->
      <div v-else class="form-section">
        <div class="section-header">
          <span class="section-number">4</span>
          <h3>Company Information</h3>
        </div>
        <p class="company-readonly-note">Company information cannot be changed. If something is incorrect, please <router-link to="/message-us">Message Us</router-link>.</p>

        <div class="form-row">
          <div class="form-group">
            <label for="nipNumberReadonly">NIP Number</label>
            <input
              id="nipNumberReadonly"
              v-model="formData.company.nipNumber"
              type="text"
              class="form-input form-input-short"
              disabled
            />
          </div>

          <div class="form-group">
            <label for="websiteReadonly">Company Website</label>
            <input
              id="websiteReadonly"
              v-model="formData.company.websiteAddress"
              type="url"
              class="form-input form-input-medium"
              disabled
            />
          </div>
        </div>
      </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '../../stores/authStore'
import { userService } from '@/services/userService'

const authStore = useAuthStore()

const profileFileInput = ref(null)
const backgroundFileInput = ref(null)
const profilePhotoPreview = ref(null)
const backgroundPhotoPreview = ref(null)
const selectedProfilePhoto = ref(null)
const selectedBackgroundPhoto = ref(null)
const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const showCompanyFields = ref(false)

const formData = reactive({
  firstName: '',
  lastName: '',
  email: '',
  nickname: '',
  phoneNumber: '',
  location: {
    country: '',
    state: '',
    city: '',
    street: '',
    streetNumber: ''
  },
  company: {
    nipNumber: '',
    websiteAddress: '',
    confirmUpgrade: false
  }
})

// Initialize form with user data
onMounted(async () => {
  await loadProfileData()
})

const loadProfileData = async () => {
  try {
    // Fetch complete profile data including location
    const response = await userService.getProfile()

    const userData = response.user

    // Update form with user data
    formData.firstName = userData.first_name || ''
    formData.lastName = userData.last_name || ''
    formData.email = userData.email || ''
    formData.nickname = userData.nickname || ''
    formData.phoneNumber = userData.phone_number || ''
    formData.company.nipNumber = userData.NIP_number || ''
    formData.company.websiteAddress = userData.website_address || ''

    // Load location data if available
    if (userData.location) {
      formData.location.country = userData.location.country || ''
      formData.location.state = userData.location.state || ''
      formData.location.city = userData.location.city || ''
      formData.location.street = userData.location.street || ''
      formData.location.streetNumber = userData.location.street_number || ''
    }

    // Update auth store with latest user data
    authStore.user = userData
  } catch (error) {
    console.error('Error loading profile:', error)
    errorMessage.value = 'Failed to load profile data'
  }
}

const handleProfilePhotoChange = async (event) => {
  const file = event.target.files?.[0]
  if (file) {
    if (file.size > 2 * 1024 * 1024) {
      errorMessage.value = 'File size must be less than 2MB'
      return
    }

    selectedProfilePhoto.value = file
    const reader = new FileReader()
    reader.onload = (e) => {
      profilePhotoPreview.value = e.target?.result
    }
    reader.readAsDataURL(file)

    // Auto-upload the photo
    await uploadPhoto('profile_photo', file)
  }
}

const handleBackgroundPhotoChange = async (event) => {
  const file = event.target.files?.[0]
  if (file) {
    if (file.size > 2 * 1024 * 1024) {
      errorMessage.value = 'File size must be less than 2MB'
      return
    }

    selectedBackgroundPhoto.value = file
    const reader = new FileReader()
    reader.onload = (e) => {
      backgroundPhotoPreview.value = e.target?.result
    }
    reader.readAsDataURL(file)

    // Auto-upload the photo
    await uploadPhoto('background_photo', file)
  }
}

const removeProfilePhoto = async () => {
  // Clear preview first
  profilePhotoPreview.value = null
  selectedProfilePhoto.value = null
  if (profileFileInput.value) {
    profileFileInput.value.value = ''
  }

  // If there's a saved photo, delete it from the server
  if (authStore.user?.profile_photo) {
    loading.value = true
    successMessage.value = ''
    errorMessage.value = ''

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('remove_profile_photo', 'true')

      const response = await userService.updateProfile(formDataToSend)

      authStore.user = response.user
      await loadProfileData()
      successMessage.value = 'Profile photo removed successfully!'
    } catch (error) {
      console.error('Error removing profile photo:', error)
      errorMessage.value = error.response?.data?.message || 'Failed to remove profile photo'
    } finally {
      loading.value = false
    }
  }
}

const removeBackgroundPhoto = async () => {
  // Clear preview first
  backgroundPhotoPreview.value = null
  selectedBackgroundPhoto.value = null
  if (backgroundFileInput.value) {
    backgroundFileInput.value.value = ''
  }

  // If there's a saved photo, delete it from the server
  if (authStore.user?.background_photo) {
    loading.value = true
    successMessage.value = ''
    errorMessage.value = ''

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('remove_background_photo', 'true')

      const response = await userService.updateProfile(formDataToSend)

      authStore.user = response.user
      await loadProfileData()
      successMessage.value = 'Background photo removed successfully!'
    } catch (error) {
      console.error('Error removing background photo:', error)
      errorMessage.value = error.response?.data?.message || 'Failed to remove background photo'
    } finally {
      loading.value = false
    }
  }
}

const uploadPhoto = async (fieldName, file) => {
  loading.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    const formDataToSend = new FormData()
    formDataToSend.append(fieldName, file)

    const response = await userService.updateProfile(formDataToSend)

    authStore.user = response.user
    await loadProfileData()

    // Clear the preview and selection after successful upload
    if (fieldName === 'profile_photo') {
      selectedProfilePhoto.value = null
      profilePhotoPreview.value = null
    } else {
      selectedBackgroundPhoto.value = null
      backgroundPhotoPreview.value = null
    }

    successMessage.value = fieldName === 'profile_photo' ? 'Profile photo uploaded successfully!' : 'Background photo uploaded successfully!'
  } catch (error) {
    console.error('Error uploading photo:', error)
    errorMessage.value = error.response?.data?.message || 'Failed to upload photo'
  } finally {
    loading.value = false
  }
}

const resetPersonalInfo = async () => {
  await loadProfileData()
  successMessage.value = ''
  errorMessage.value = ''
}

const resetLocation = async () => {
  await loadProfileData()
  successMessage.value = ''
  errorMessage.value = ''
}

const savePersonalInfo = async () => {
  loading.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    const formDataToSend = new FormData()
    formDataToSend.append('first_name', formData.firstName)
    formDataToSend.append('last_name', formData.lastName)
    formDataToSend.append('phone_number', formData.phoneNumber || '')

    const response = await userService.updateProfile(formDataToSend)

    authStore.user = response.user
    await loadProfileData()

    successMessage.value = 'Personal information updated successfully!'
  } catch (error) {
    console.error('Error updating personal info:', error)
    errorMessage.value = error.response?.data?.message || 'Failed to update personal information'
  } finally {
    loading.value = false
  }
}

const saveLocation = async () => {
  loading.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    const formDataToSend = new FormData()
    formDataToSend.append('location_country', formData.location.country || '')
    formDataToSend.append('location_state', formData.location.state || '')
    formDataToSend.append('location_city', formData.location.city || '')
    formDataToSend.append('location_street', formData.location.street || '')
    formDataToSend.append('location_street_number', formData.location.streetNumber || '')

    const response = await userService.updateProfile(formDataToSend)

    authStore.user = response.user
    await loadProfileData()

    successMessage.value = 'Location updated successfully!'
  } catch (error) {
    console.error('Error updating location:', error)
    errorMessage.value = error.response?.data?.message || 'Failed to update location'
  } finally {
    loading.value = false
  }
}

const upgradeToCompany = async () => {
  loading.value = true
  successMessage.value = ''
  errorMessage.value = ''

  // Validate NIP number if provided
  if (formData.company.nipNumber && !/^\d{10}$/.test(formData.company.nipNumber)) {
    errorMessage.value = 'NIP number must be exactly 10 digits'
    loading.value = false
    return
  }

  try {
    const formDataToSend = new FormData()
    formDataToSend.append('upgrade_to_company', 'true')
    formDataToSend.append('NIP_number', formData.company.nipNumber || '')
    formDataToSend.append('website_address', formData.company.websiteAddress || '')

    const response = await userService.updateProfile(formDataToSend)

    authStore.user = response.user
    await loadProfileData()

    showCompanyFields.value = false
    formData.company.confirmUpgrade = false

    successMessage.value = 'Successfully upgraded to company account!'
  } catch (error) {
    console.error('Error upgrading to company:', error)
    errorMessage.value = error.response?.data?.message || 'Failed to upgrade to company account'
  } finally {
    loading.value = false
  }
}

// Helper function to get full photo URL
const getPhotoUrl = (photoPath) => {
  if (!photoPath) return null
  // If it's already a full URL (starts with http), return as is
  if (photoPath.startsWith('http')) return photoPath
  // Otherwise, prepend the API URL
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
  return `${API_URL}${photoPath}`
}
</script>

<style scoped>
.profile-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.form-section {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e3f2fd;
}

.form-section:last-of-type {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.section-number {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #00AAFF 0%, #0088cc 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: 700;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 170, 255, 0.3);
}

.form-section h3 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

/* Photos Grid */
.photos-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.photo-upload-box {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.photo-label {
  font-size: 1rem;
  font-weight: 600;
  color: #555;
}

.current-photo {
  width: 100%;
  overflow: hidden;
  border: 3px solid #e0e0e0;
  border-radius: 12px;
  position: relative;
}

.profile-photo {
  border-radius: 50%;
  aspect-ratio: 1;
  max-width: 300px;
  margin: 0 auto;
}

.background-photo {
  aspect-ratio: 16/9;
}

.photo-img {
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

.photo-placeholder-bg {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  color: #999;
  font-size: 0.95rem;
}

.photo-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.upload-btn, .remove-btn-small {
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
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

.remove-btn-small {
  background: #f5f5f5;
  color: #d32f2f;
}

.remove-btn-small:hover {
  background: #ffe0e0;
}

.photo-hint {
  font-size: 0.8rem;
  color: #999;
  margin: 0;
}

/* Form Fields */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.form-row .form-group {
  margin-bottom: 0;
}

.form-group label {
  font-size: 0.95rem;
  font-weight: 600;
  color: #555;
}

.form-input {
  padding: 1rem 1.25rem;
  border: 2px solid #e3f2fd;
  border-radius: 12px;
  font-size: 1rem;
  background: #f8fbff;
  transition: all 0.3s ease;
  outline: none;
}

.form-input:hover:not(:disabled) {
  border-color: #b3d9ff;
  background: white;
}

.form-input:focus {
  border-color: #00AAFF;
  background: white;
  box-shadow: 0 0 0 4px rgba(0, 170, 255, 0.1);
}

.form-input:disabled {
  background: #f5f5f5;
  color: #999;
  cursor: not-allowed;
  border-color: #e0e0e0;
}

.form-input-short {
  max-width: 250px;
}

.form-input-medium {
  max-width: 400px;
}

.input-hint {
  font-size: 0.85rem;
  color: #999;
  font-style: italic;
}

/* Company Section */
.company-section {
  border: 2px solid #e3f2fd;
  border-radius: 12px;
  padding: 1.5rem;
  background: #fafafa;
}

.company-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  margin-bottom: 0.5rem;
}

.company-header h3 {
  margin: 0;
  color: #00AAFF;
}

.toggle-btn {
  background: #00AAFF;
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.toggle-btn:hover {
  background: #0088CC;
}

.company-description {
  color: #666;
  font-size: 0.95rem;
  margin-bottom: 1rem;
}

.company-readonly-note {
  color: #666;
  font-size: 0.9rem;
  font-style: italic;
  margin-bottom: 1.5rem;
  padding: 0.75rem;
  background: #f5f5f5;
  border-left: 3px solid #00AAFF;
  border-radius: 4px;
}

.company-fields {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.warning-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 8px;
  color: #856404;
}

.warning-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.checkbox-group {
  margin-top: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
  font-weight: 500;
  color: #555;
}

.checkbox-label input[type="checkbox"] {
  margin-top: 0.25rem;
  width: 18px;
  height: 18px;
  cursor: pointer;
}

/* Messages */
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

/* Form Group with Inline Buttons */
.form-group-with-buttons {
  display: flex;
  align-items: flex-end;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-group-with-buttons .form-group {
  flex: 1;
  margin-bottom: 0;
}

.inline-buttons {
  display: flex;
  gap: 0.5rem;
  padding-bottom: 0.125rem;
}

.cancel-btn-small, .save-btn-small {
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  white-space: nowrap;
}

.cancel-btn-small {
  background: #f5f5f5;
  color: #666;
}

.cancel-btn-small:hover:not(:disabled) {
  background: #e0e0e0;
}

.save-btn-small {
  background: #00AAFF;
  color: white;
}

.save-btn-small:hover:not(:disabled) {
  background: #0088CC;
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(0, 170, 255, 0.3);
}

.cancel-btn-small:disabled, .save-btn-small:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Company Upgrade Button */
.upgrade-button-container {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
}

.upgrade-btn {
  padding: 0.875rem 2.5rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  background: #00AAFF;
  color: white;
}

.upgrade-btn:hover:not(:disabled) {
  background: #0088CC;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 170, 255, 0.3);
}

.upgrade-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 768px) {
  .photos-grid {
    grid-template-columns: 1fr;
  }

  .profile-photo {
    max-width: 150px;
    margin: 0 auto;
  }

  .photo-actions {
    flex-wrap: wrap;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .form-group-with-buttons {
    flex-direction: column;
    align-items: stretch;
  }

  .inline-buttons {
    margin-top: 1rem;
    flex-direction: column;
    gap: 0.5rem;
  }

  .cancel-btn-small, .save-btn-small {
    width: 100%;
  }

  .form-input-short, .form-input-medium {
    max-width: 100%;
  }

  .upgrade-btn {
    width: 100%;
  }
}
</style>
