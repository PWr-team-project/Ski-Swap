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
        <div class="section-header-with-button">
          <div class="section-header">
            <span class="section-number">3</span>
            <h3>Location</h3>
          </div>
          <button
            type="button"
            @click="fetchUserLocation"
            class="geolocation-btn-inline"
            :disabled="loadingLocation"
          >
            <span v-if="!loadingLocation">📍 Use My Current Location</span>
            <span v-else>Getting location...</span>
          </button>
        </div>

        <!-- Street and Street Number -->
        <div class="form-row">
          <div class="form-group">
            <label for="street">Street</label>
            <input
              id="street"
              v-model="formData.location.street"
              type="text"
              class="form-input"
              placeholder="Main Street"
              maxlength="35"
              @input="validateField('street')"
            />
            <small v-if="validationErrors.street" class="error-hint">{{ validationErrors.street }}</small>
          </div>

          <div class="form-group">
            <label for="streetNumber">Street Number</label>
            <input
              id="streetNumber"
              v-model="formData.location.streetNumber"
              type="text"
              class="form-input"
              placeholder="123"
              maxlength="5"
              @input="validateField('streetNumber')"
            />
            <small v-if="validationErrors.streetNumber" class="error-hint">{{ validationErrors.streetNumber }}</small>
          </div>
        </div>

        <!-- City and Postcode -->
        <div class="form-row">
          <div class="form-group">
            <label for="city">City</label>
            <input
              id="city"
              v-model="formData.location.city"
              type="text"
              class="form-input"
              placeholder="Warsaw"
              maxlength="20"
              @input="validateField('city')"
            />
            <small v-if="validationErrors.city" class="error-hint">{{ validationErrors.city }}</small>
          </div>

          <div class="form-group">
            <label for="postcode">Postcode</label>
            <input
              id="postcode"
              v-model="formData.location.postcode"
              type="text"
              class="form-input"
              placeholder="00-001"
              maxlength="7"
              @input="validateField('postcode')"
            />
            <small v-if="validationErrors.postcode" class="error-hint">{{ validationErrors.postcode }}</small>
          </div>
        </div>

        <!-- State and Country -->
        <div class="form-row">
          <div class="form-group">
            <label for="state">State/Province</label>
            <input
              id="state"
              v-model="formData.location.state"
              type="text"
              class="form-input"
              placeholder="Mazowieckie"
              maxlength="35"
              @input="validateField('state')"
            />
            <small v-if="validationErrors.state" class="error-hint">{{ validationErrors.state }}</small>
          </div>

          <div class="form-group">
            <label for="country">Country</label>
            <input
              id="country"
              v-model="formData.location.country"
              type="text"
              class="form-input"
              placeholder="Poland"
              maxlength="20"
              @input="validateField('country')"
            />
            <small v-if="validationErrors.country" class="error-hint">{{ validationErrors.country }}</small>
          </div>
        </div>

        <!-- Map Section -->
        <div v-if="showMap" class="map-section">
          <label class="map-label">Confirm Your Location on Map</label>
          <div ref="mapContainer" class="map-container"></div>
          <div class="map-actions">
            <button v-if="!locationConfirmed" type="button" @click="confirmLocation" class="confirm-map-btn">
              ✓ Confirm Location
            </button>
            <small v-if="locationConfirmed" class="success-hint">✓ Location confirmed!</small>
            <small v-else class="input-hint">Drag the pin to adjust your exact location</small>
          </div>
        </div>

        <!-- Save/Cancel Buttons -->
        <div class="location-buttons">
          <button type="button" @click="resetLocation" class="cancel-btn-small" :disabled="loading">
            Cancel
          </button>
          <button type="button" @click="saveLocation" class="save-btn-small" :disabled="loading || !locationConfirmed">
            {{ loading ? 'Saving...' : 'Save Changes' }}
          </button>
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
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { useAuthStore } from '../../stores/authStore'
import { userService } from '@/services/userService'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const authStore = useAuthStore()

const profileFileInput = ref(null)
const backgroundFileInput = ref(null)
const profilePhotoPreview = ref(null)
const backgroundPhotoPreview = ref(null)
const selectedProfilePhoto = ref(null)
const selectedBackgroundPhoto = ref(null)
const loading = ref(false)
const loadingLocation = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const showCompanyFields = ref(false)

// Map-related refs
const mapContainer = ref(null)
const map = ref(null)
const marker = ref(null)
const showMap = ref(false)
const locationConfirmed = ref(true) // Default to true so existing users can save

// Validation errors
const validationErrors = reactive({
  street: '',
  streetNumber: '',
  city: '',
  postcode: '',
  state: '',
  country: ''
})

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
    postcode: '',
    street: '',
    streetNumber: '',
    latitude: 0,
    longitude: 0
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

// Cleanup map on unmount
onUnmounted(() => {
  if (map.value) {
    map.value.remove()
    map.value = null
  }
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
      formData.location.postcode = userData.location.postcode || ''
      formData.location.street = userData.location.street || ''
      formData.location.streetNumber = userData.location.street_number || ''
      formData.location.latitude = userData.location.latitude || 0
      formData.location.longitude = userData.location.longitude || 0

      // Don't show map on initial load - only when user changes location
    }

    // Update auth store with latest user data
    authStore.user = userData
  } catch (error) {
    console.error('Error loading profile:', error)
    errorMessage.value = 'Failed to load profile data'
  }
}

// Validation function
const validateField = (fieldName) => {
  const value = formData.location[fieldName]
  validationErrors[fieldName] = ''

  if (!value) {
    return true // Empty is okay
  }

  const maxLengths = {
    street: 35,
    streetNumber: 5,
    city: 20,
    postcode: 7,
    state: 35,
    country: 20
  }

  if (value.length > maxLengths[fieldName]) {
    validationErrors[fieldName] = `Maximum ${maxLengths[fieldName]} characters`
    return false
  }

  return true
}

// Fetch user location from browser
const fetchUserLocation = async () => {
  if (!navigator.geolocation) {
    errorMessage.value = 'Geolocation is not supported by your browser'
    return
  }

  loadingLocation.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      })
    })

    const { latitude, longitude } = position.coords
    formData.location.latitude = latitude
    formData.location.longitude = longitude

    // Use reverse geocoding to get address details
    await reverseGeocode(latitude, longitude)

    // Show map with the location
    showMap.value = true
    locationConfirmed.value = false
    await nextTick()
    initializeMap(latitude, longitude)

    successMessage.value = 'Location fetched successfully! Please confirm on the map.'
  } catch (error) {
    console.error('Error getting location:', error)
    if (error.code === 1) {
      errorMessage.value = 'Location access denied. Please enable location permissions.'
    } else if (error.code === 2) {
      errorMessage.value = 'Location unavailable. Please try again.'
    } else if (error.code === 3) {
      errorMessage.value = 'Location request timed out. Please try again.'
    } else {
      errorMessage.value = 'Failed to get location. Please try again.'
    }
  } finally {
    loadingLocation.value = false
  }
}

// Reverse geocoding using Nominatim (OpenStreetMap)
const reverseGeocode = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en'
        }
      }
    )

    if (!response.ok) {
      throw new Error('Geocoding failed')
    }

    const data = await response.json()
    const address = data.address

    // Fill in the form fields
    if (address) {
      formData.location.street = (address.road || address.street || '').substring(0, 35)
      formData.location.streetNumber = (address.house_number || '').substring(0, 5)
      formData.location.city = (address.city || address.town || address.village || '').substring(0, 20)
      formData.location.postcode = (address.postcode || '').substring(0, 7)
      formData.location.state = (address.state || address.province || '').substring(0, 35)
      formData.location.country = (address.country || '').substring(0, 20)
    }
  } catch (error) {
    console.error('Error reverse geocoding:', error)
    // Don't show error to user, they can manually fill in the fields
  }
}

// Initialize Leaflet map
const initializeMap = (lat, lng) => {
  // Remove existing map if any
  if (map.value) {
    map.value.remove()
  }

  // Fix for default marker icon in Leaflet with webpack
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
  })

  // Create map
  map.value = L.map(mapContainer.value).setView([lat, lng], 15)

  // Add tile layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map.value)

  // Add draggable marker
  marker.value = L.marker([lat, lng], { draggable: true }).addTo(map.value)

  // Update coordinates when marker is dragged
  marker.value.on('dragend', async (event) => {
    const position = event.target.getLatLng()
    formData.location.latitude = position.lat
    formData.location.longitude = position.lng
    locationConfirmed.value = false

    // Optional: Update address fields when pin is moved
    await reverseGeocode(position.lat, position.lng)
  })
}

// Confirm location on map
const confirmLocation = () => {
  if (!formData.location.latitude || !formData.location.longitude) {
    errorMessage.value = 'Please select a location on the map'
    return
  }

  locationConfirmed.value = true
  successMessage.value = 'Location confirmed! You can now save your changes.'
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
  // Validate all fields before saving
  let hasErrors = false
  Object.keys(validationErrors).forEach(field => {
    if (!validateField(field)) {
      hasErrors = true
    }
  })

  if (hasErrors) {
    errorMessage.value = 'Please fix validation errors before saving'
    return
  }

  // Check if location needs to be confirmed on map
  if (showMap.value && !locationConfirmed.value) {
    errorMessage.value = 'Please confirm your location on the map before saving'
    return
  }

  loading.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    const formDataToSend = new FormData()
    formDataToSend.append('location_country', formData.location.country || '')
    formDataToSend.append('location_state', formData.location.state || '')
    formDataToSend.append('location_city', formData.location.city || '')
    formDataToSend.append('location_postcode', formData.location.postcode || '')
    formDataToSend.append('location_street', formData.location.street || '')
    formDataToSend.append('location_street_number', formData.location.streetNumber || '')
    formDataToSend.append('location_latitude', formData.location.latitude || 0)
    formDataToSend.append('location_longitude', formData.location.longitude || 0)

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

/* Section Header with Button */
.section-header-with-button {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

/* Inline Geolocation Button */
.geolocation-btn-inline {
  padding: 0.625rem 1.5rem;
  background: linear-gradient(135deg, #00AAFF 0%, #0088cc 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 170, 255, 0.3);
  white-space: nowrap;
}

.geolocation-btn-inline:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 170, 255, 0.4);
  background: linear-gradient(135deg, #0088cc 0%, #00AAFF 100%);
}

.geolocation-btn-inline:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  background: linear-gradient(135deg, #9e9e9e 0%, #757575 100%);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

/* Map Section */
.map-section {
  margin: 2rem 0;
  padding: 1.5rem;
  background: #f8fbff;
  border: 2px solid #e3f2fd;
  border-radius: 12px;
}

.map-label {
  display: block;
  font-size: 1rem;
  font-weight: 600;
  color: #555;
  margin-bottom: 1rem;
}

.map-container {
  width: 100%;
  height: 400px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #e0e0e0;
  margin-bottom: 1rem;
}

.map-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.confirm-map-btn {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 3px 10px rgba(255, 152, 0, 0.4);
}

.confirm-map-btn:hover {
  background: linear-gradient(135deg, #F57C00 0%, #FF9800 100%);
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(255, 152, 0, 0.5);
}

/* Location Buttons */
.location-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 2px solid #e3f2fd;
}

/* Error Hints */
.error-hint {
  font-size: 0.8rem;
  color: #d32f2f;
  font-style: italic;
  margin-top: 0.25rem;
}

/* Success Hints */
.success-hint {
  font-size: 0.9rem;
  color: #4caf50;
  font-weight: 600;
  margin-top: 0.5rem;
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

  .section-header-with-button {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .geolocation-btn-inline {
    width: 100%;
    padding: 0.75rem 1.5rem;
  }

  .map-container {
    height: 300px;
  }

  .location-buttons {
    flex-direction: column;
  }

  .location-buttons .cancel-btn-small,
  .location-buttons .save-btn-small {
    width: 100%;
  }
}
</style>
