<template>
  <div class="owner-card">
    <div class="owner-card-grid">
      <!-- Left Column: Owner Info -->
      <div class="owner-info-column">
        <div class="owner-info-top">
          <!-- Profile Header -->
          <div class="owner-header">
            <div class="owner-avatar">
              <img :src="ownerAvatar" :alt="ownerName" />
            </div>
            <div class="owner-title">
              <h3 class="owner-name" @click="navigateToProfile">
                Owned by   <span class="company-name">{{ ownerName }}</span>
              </h3>
              <!-- Rating with Stars -->
              <div class="owner-rating">
                <div class="stars">
                  <span v-for="star in 5" :key="star" class="star" :class="{ filled: star <= Math.floor(rating) }">
                    ⭐
                  </span>
                </div>
                <span class="rating-text">{{ rating.toFixed(1) }}/5</span>
              </div>
            </div>
          </div>

          <!-- Status Badges -->
          <div class="owner-badges">
            <div class="badge-item">
              <img :src="isVerified ? '/assets/icons/verified_icon.svg' : '/assets/icons/unverified_icon.svg'"
                   :alt="isVerified ? 'Verified' : 'Unverified'"
                   class="badge-icon-img" />
              <span class="badge-text">{{ isVerified ? 'Identified' : 'Unverified' }}</span>
            </div>
            <div class="badge-item">
              <img :src="isCompany ? '/assets/icons/company_icon.svg' : '/assets/icons/individual_icon.svg'"
                   :alt="isCompany ? 'Company' : 'Individual'"
                   class="badge-icon-img" />
              <span class="badge-text">{{ isCompany ? 'Company' : 'Private Owner' }}</span>
            </div>
          </div>

          <!-- Owner Stats -->
          <div class="owner-stats">
            <div class="stat-item">
              <img src="/assets/icons/clock_icon.svg" alt="Response time" class="stat-icon-img" />
              <span class="stat-text">{{ responseTime }}</span>
            </div>
            <div class="stat-item">
              <img src="/assets/icons/response_icon.svg" alt="Response rate" class="stat-icon-img" />
              <span class="stat-text">{{ responseRate }}% response rate</span>
            </div>
            <div class="stat-item">
              <img src="/assets/icons/location_icon.svg" alt="Location" class="stat-icon-img" />
              <span class="stat-text">{{ locationText }}</span>
            </div>
          </div>
        </div>

        <!-- Contact Owner Button -->
        <button class="contact-owner-button" @click="handleSendMessage" :disabled="isOwner">
          {{ isOwner ? 'Your Listing' : 'Contact Owner' }}
        </button>
      </div>

      <!-- Right Column: Map -->
      <div class="map-section">
        <div id="owner-map" class="map-container"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps({
  owner: {
    type: Object,
    required: true
  },
  location: {
    type: Object,
    default: () => ({ latitude: 51.5074, longitude: -0.1278, city: 'London', country: 'UK' })
  },
  isOwner: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['sendMessage', 'navigateToProfile'])

let map = null

// Computed properties
const ownerAvatar = computed(() => {
  return props.owner?.profilePicture || 'https://via.placeholder.com/80'
})

const ownerName = computed(() => {
  if (!props.owner) return 'Unknown'
  const fullName = `${props.owner.firstName || ''} ${props.owner.lastName || ''}`.trim()
  return fullName || props.owner.nickname || 'Unknown'
})

const rating = computed(() => {
  return props.owner?.rating || 0
})

const isVerified = computed(() => {
  // TODO: Add isVerified field to user model
  return props.owner?.isVerified || false
})

const isCompany = computed(() => {
  // Check if user_type is 'company'
  return props.owner?.user_type === 'company' || props.owner?.accountType === 'company'
})

const responseTime = computed(() => {
  // TODO: Implement response time tracking
  return 'Usually responds within a few hours'
})

const responseRate = computed(() => {
  // TODO: Implement response rate tracking
  return props.owner?.responseRate || 80
})

const locationText = computed(() => {
  const city = props.location?.city || 'Unknown'
  const country = props.location?.country || 'Unknown'
  return `${city}, ${country}`
})

// Methods
const handleSendMessage = () => {
  emit('sendMessage')
}

const navigateToProfile = () => {
  // TODO: Implement profile page navigation
  console.log('Navigate to profile - not implemented yet')
  emit('navigateToProfile', props.owner?.id)
}

const initMap = () => {
  if (map) {
    map.remove()
  }

  const lat = props.location?.latitude || 51.5074
  const lng = props.location?.longitude || -0.1278

  // Initialize map
  map = L.map('owner-map', {
    zoomControl: false,
    scrollWheelZoom: false,
    dragging: false,
    doubleClickZoom: false,
    boxZoom: false,
    keyboard: false,
    touchZoom: false
  }).setView([lat, lng], 13)

  // Add tile layer (OpenStreetMap)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map)

  // Add 0.5km radius circle
  L.circle([lat, lng], {
    color: '#00AAFF',
    fillColor: '#00AAFF',
    fillOpacity: 0.2,
    radius: 500 // 0.5km in meters
  }).addTo(map)

  // Add marker
  const marker = L.marker([lat, lng]).addTo(map)
}

// Lifecycle
onMounted(() => {
  setTimeout(() => {
    initMap()
  }, 100)
})

// Watch for location changes
watch(() => props.location, () => {
  initMap()
}, { deep: true })
</script>

<style scoped>
.owner-card {
  background: white;
  border-radius: 15px;
  padding: 1.5rem;
  margin-top: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 4px 20px rgba(0, 170, 255, 0.15);
  border: 1px solid rgba(0, 170, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.owner-card-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  align-items: stretch;
}

.owner-info-column {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.owner-info-top {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.owner-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.owner-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #00AAFF;
  flex-shrink: 0;
}

.owner-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.owner-title {
  flex: 1;
}

.owner-name {
  font-size: 1.25rem;
  font-weight: 400;
  color: #333;
  margin: 0 0 0.4rem 0;
  cursor: pointer;
}

.company-name {
  color: #0066CC;
  font-weight: 700;
  font-size: 1.5rem;
  text-decoration: none;
  transition: color 0.3s ease;
}

.company-name:hover {
  color: #00AAFF;
  text-decoration: underline;
}

.owner-rating {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stars {
  display: flex;
  gap: 0.15rem;
}

.star {
  font-size: 1rem;
  color: #ddd;
}

.star.filled {
  color: #FF1493;
}

.rating-text {
  font-size: 0.85rem;
  font-weight: 600;
  color: #333;
}

/* Status Badges */
.owner-badges {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-left: 0;
}

.badge-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.badge-icon-img {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.badge-text {
  font-size: 0.85rem;
  font-weight: 500;
  color: #333;
}

/* Owner Stats */
.owner-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-left: 0;
  margin-top: -0.5rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.stat-icon-img {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.stat-text {
  font-size: 0.85rem;
  color: #333;
}

/* Map Section */
.map-section {
  width: 100%;
  height: 100%;
  min-height: 300px;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.map-container {
  width: 100%;
  height: 100%;
  min-height: 300px;
  border-radius: 10px;
}

/* Contact Owner Button */
.contact-owner-button {
  width: 100%;
  padding: 1rem;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #00AAFF 0%, #0088cc 100%);
  color: white;
}

.contact-owner-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 170, 255, 0.4);
}

.contact-owner-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Responsive */
@media (max-width: 1024px) {
  .owner-card-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
    align-items: start;
  }

  .owner-info-column {
    justify-content: flex-start;
  }

  .map-section {
    min-height: 250px;
  }

  .map-container {
    min-height: 250px;
  }
}

@media (max-width: 768px) {
  .owner-card {
    padding: 1.5rem;
  }

  .owner-header {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .owner-name {
    text-align: center;
  }

  .owner-rating {
    justify-content: center;
  }

  .contact-owner-button-button {
    font-size: 0.95rem;
    padding: 0.875rem 1.5rem;
  }

  .map-section {
    min-height: 200px;
  }

  .map-container {
    min-height: 200px;
  }
}
</style>
