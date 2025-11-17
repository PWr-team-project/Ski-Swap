<template>
  <div class="single-listing-page">
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading listing...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <p>{{ error }}</p>
      <button @click="$router.push('/browse')" class="back-button">Back to Browse</button>
    </div>

    <div v-else-if="listing" class="listing-content">
      <!-- Main Content Grid -->
      <div class="main-grid">
        <!-- Left Side: Title & Photos -->
        <div class="photos-section">
          <!-- Title Section -->
          <div class="listing-header-compact">
            <h1 class="listing-title">{{ listing.title }}</h1>
            <div class="category-badge">{{ listing.category }}</div>
          </div>

          <!-- Main Photo -->
          <div class="main-photo">
            <img :src="currentPhoto" :alt="listing.title" />
          </div>

          <!-- Thumbnail Gallery -->
          <div class="thumbnail-gallery">
            <div
              v-for="(photo, index) in listing.photos"
              :key="index"
              class="thumbnail"
              :class="{ active: currentPhotoIndex === index }"
              @click="currentPhotoIndex = index"
            >
              <img :src="photo" :alt="`${listing.title} - Photo ${index + 1}`" />
            </div>
          </div>

          <!-- Owner Business Card -->
          <OwnerCard
            :owner="ownerData"
            :location="locationData"
            :is-owner="isOwner"
            @send-message="handleContactSeller"
          />

          <!-- Description Section -->
          <div class="description-section-left">
            <h2 class="section-title">Description</h2>
            <p class="description-text">{{ listing.description }}</p>
          </div>
        </div>

        <!-- Right Side: Calendar & Booking -->
        <div class="booking-section">
          <div class="booking-card">
            <!-- Calendar Component -->
            <DateRangeCalendar v-model="selectedDates" />

            <!-- Selected Dates Display -->
            <div class="selected-dates-display">
              <div class="dates-row">
                <div class="date-box">
                  <div class="date-label">Pickup</div>
                  <div class="date-value">{{ formatDate(selectedDates.pickupDate) || 'Select date' }}</div>
                </div>
                <div class="date-box">
                  <div class="date-label">Drop off</div>
                  <div class="date-value">{{ formatDate(selectedDates.dropoffDate) || 'Select date' }}</div>
                </div>
              </div>
              <button @click="clearDates" class="clear-dates-button">Clear dates</button>
            </div>

            <!-- Price Calculation Display -->
            <div class="total-price-display">
              <div v-if="totalPrice > 0">
                <div class="price-total">€{{ totalPrice.toFixed(2) }}</div>
                <div class="price-details">for {{ rentalDays }} days (including {{ bookingFee }}€ booking fee)</div>
              </div>
              <div v-else>
                <div class="price-placeholder">Select rental period</div>
                <div class="price-details" style="visibility: hidden;">placeholder text for spacing</div>
              </div>
            </div>

            <!-- Action Button -->
            <button class="request-button" :disabled="!canBook">
              Send Request
            </button>

            <!-- Price Display -->
            <div class="price-display-bottom">
              <div class="price-item">
                <span class="price-label">Daily:</span>
                <span class="price-value">${{ listing.dailyRate }}</span>
              </div>
              <div v-if="listing.weeklyRate" class="price-item">
                <span class="price-label">Weekly:</span>
                <span class="price-value">${{ listing.weeklyRate }}</span>
              </div>
              <div v-if="listing.monthlyRate" class="price-item">
                <span class="price-label">Monthly:</span>
                <span class="price-value">${{ listing.monthlyRate }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Properties Section -->
      <div class="properties-section">
        <h2 class="section-title">Item Details</h2>
        <div class="properties-grid">
          <div class="property-item" v-if="listing.brand">
            <span class="property-label">Brand</span>
            <span class="property-value">{{ listing.brand }}</span>
          </div>
          <div class="property-item" v-if="listing.model">
            <span class="property-label">Model</span>
            <span class="property-value">{{ listing.model }}</span>
          </div>
          <div class="property-item" v-if="listing.size">
            <span class="property-label">Size</span>
            <span class="property-value">{{ listing.size }}</span>
          </div>
          <div class="property-item">
            <span class="property-label">Condition</span>
            <span class="property-value">{{ listing.condition.charAt(0).toUpperCase() + listing.condition.slice(1).toLowerCase() }}</span>
          </div>
        </div>
      </div>

      <!-- Other Items from Owner -->
      <ListingCarousel
        :title="`More from ${ownerFirstName}`"
        :items="ownerOtherItems"
        @item-click="goToListing"
      />

      <!-- Similar Items (Same Category) -->
      <ListingCarousel
        :title="`Similar ${listing.category}`"
        :items="categoryItems"
        @item-click="goToListing"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { listingService } from '@/services/listingService'
import { bookingService } from '@/services/bookingService'
import apiClient from '@/api/interceptors'
import { getFullImageUrl } from '@/utils/api'
import DateRangeCalendar from '../components/DateRangeCalendar.vue'
import ListingCarousel from '../components/ListingCarousel.vue'
import OwnerCard from '../components/OwnerCard.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// State
const listing = ref(null)
const loading = ref(true)
const error = ref('')
const currentPhotoIndex = ref(0)

// Date selection state
const selectedDates = ref({
  pickupDate: null,
  dropoffDate: null
})

// Related items
const ownerOtherItems = ref([])
const categoryItems = ref([])

// Computed
const currentPhoto = computed(() => {
  return listing.value?.photos[currentPhotoIndex.value] || ''
})

const rentalDays = computed(() => {
  const { pickupDate, dropoffDate } = selectedDates.value
  if (!pickupDate || !dropoffDate) return 0
  const diffTime = Math.abs(dropoffDate - pickupDate)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
})

const totalPrice = computed(() => {
  if (!listing.value || rentalDays.value === 0) return 0

  const days = rentalDays.value
  let price = 0

  // Calculate based on available pricing tiers
  if (listing.value.monthlyRate && days >= 30) {
    const months = Math.floor(days / 30)
    const remainingDays = days % 30
    price = (months * listing.value.monthlyRate) + (remainingDays * listing.value.dailyRate)
  } else if (listing.value.weeklyRate && days >= 7) {
    const weeks = Math.floor(days / 7)
    const remainingDays = days % 7
    price = (weeks * listing.value.weeklyRate) + (remainingDays * listing.value.dailyRate)
  } else {
    price = days * listing.value.dailyRate
  }

  return price
})

const bookingFee = computed(() => {
  if (totalPrice.value === 0) return 0
  return Math.ceil(totalPrice.value * 0.05)
})

const canBook = computed(() => {
  return selectedDates.value.pickupDate && selectedDates.value.dropoffDate && totalPrice.value > 0
})

// Owner info computed properties for OwnerCard component
const ownerData = computed(() => {
  if (!listing.value?.owner) return null
  return {
    id: listing.value.owner.id,
    firstName: listing.value.owner.firstName,
    lastName: listing.value.owner.lastName,
    nickname: listing.value.owner.nickname,
    profilePicture: listing.value.owner.profilePicture,
    rating: listing.value.owner.rating,
    user_type: listing.value.owner.user_type || 'individual',
    isVerified: listing.value.owner.isVerified || false
  }
})

const locationData = computed(() => {
  if (!listing.value) return null
  return {
    city: listing.value.city,
    country: listing.value.country,
    latitude: listing.value.latitude || 51.5074, // Default to London if not available
    longitude: listing.value.longitude || -0.1278
  }
})

const ownerFirstName = computed(() => {
  return listing.value?.owner?.firstName || 'this owner'
})

const isOwner = computed(() => {
  return authStore.user?.id === listing.value?.owner?.id
})

// Methods
const formatDate = (date) => {
  if (!date) return ''

  const options = { weekday: 'short', month: 'long', day: 'numeric' }
  const formatted = date.toLocaleDateString('en-US', options)

  // Add ordinal suffix to day
  const day = date.getDate()
  const suffix = ['th', 'st', 'nd', 'rd'][day % 10 > 3 ? 0 : (day % 100 - day % 10 !== 10) * day % 10]

  // Format: "Tue, November 11th"
  return formatted.replace(/(\d+)/, `$1${suffix}`)
}

const clearDates = () => {
  selectedDates.value = {
    pickupDate: null,
    dropoffDate: null
  }
}

const handleContactSeller = async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  if (isOwner.value) {
    return
  }

  try {
    const response = await apiClient.post(
      '/api/messages/start-listing-conversation',
      {
        listingId: listing.value.id,
        sellerId: listing.value.owner.id
      }
    )

    const { conversation } = response.data

    // Redirect to messages page with the conversation
    router.push({
      path: '/messages',
      query: { conversationId: conversation._id }
    })
  } catch (error) {
    console.error('Error contacting seller:', error)
    alert(error.response?.data?.message || 'Failed to contact seller')
  }
}

const fetchListing = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await listingService.getById(route.params.id)
    const data = response.listing

    // Transform API data to match component expectations
    listing.value = {
      id: data._id,
      title: data.title,
      description: data.description,
      category: data.category_id?.name || 'Unknown',
      brand: data.brand || '',
      model: data.model || '',
      size: data.size || '',
      condition: data.condition,
      dailyRate: data.daily_rate,
      weeklyRate: data.weekly_rate,
      monthlyRate: data.monthly_rate,
      estimatedValue: data.estimated_value,
      city: data.location_id?.city || 'Unknown',
      country: data.location_id?.country || 'Unknown',
      latitude: data.location_id?.latitude || null,
      longitude: data.location_id?.longitude || null,
      photos: (data.photos || []).map(photo => getFullImageUrl(photo)),
      owner: {
        id: data.owner_id?._id,
        firstName: data.owner_id?.first_name || 'Unknown',
        lastName: data.owner_id?.last_name || 'User',
        nickname: data.owner_id?.nickname || 'user',
        profilePicture: data.owner_id?.profile_photo || null,
        createdAt: data.owner_id?.createdAt,
        rating: data.owner_id?.rating_avg || 5.0,
        user_type: data.owner_id?.user_type || 'individual',
        isVerified: data.owner_id?.id_verified || false
      }
    }

    // Fetch related items
    await Promise.all([
      fetchOwnerOtherItems(),
      fetchCategoryItems()
    ])
  } catch (err) {
    console.error('Error fetching listing:', err)
    error.value = 'Listing not found or could not be loaded.'
  } finally {
    loading.value = false
  }
}

const fetchOwnerOtherItems = async () => {
  try {
    if (!listing.value?.owner?.id) return

    const response = await listingService.getAll()
    const allListings = response.listings || []

    // Filter by owner and exclude current listing
    ownerOtherItems.value = allListings
      .filter(item => item.owner_id?._id === listing.value.owner.id && item._id !== listing.value.id)
      .slice(0, 6)
      .map(item => ({
        id: item._id,
        title: item.title,
        dailyRate: item.daily_rate,
        photos: (item.photos || []).map(photo => getFullImageUrl(photo))
      }))
  } catch (err) {
    console.error('Error fetching owner items:', err)
  }
}

const fetchCategoryItems = async () => {
  try {
    if (!listing.value?.category) return

    const response = await listingService.getAll()
    const allListings = response.listings || []

    // Filter by category and exclude current listing
    categoryItems.value = allListings
      .filter(item => item.category_id?.name === listing.value.category && item._id !== listing.value.id)
      .slice(0, 6)
      .map(item => ({
        id: item._id,
        title: item.title,
        dailyRate: item.daily_rate,
        photos: (item.photos || []).map(photo => getFullImageUrl(photo))
      }))
  } catch (err) {
    console.error('Error fetching category items:', err)
  }
}

const goToListing = (id) => {
  router.push(`/listing/${id}`)
}

// Lifecycle
onMounted(() => {
  fetchListing()
})

// Watch for route changes
watch(() => route.params.id, () => {
  if (route.params.id) {
    fetchListing()
    // Reset state
    currentPhotoIndex.value = 0
    selectedDates.value = {
      pickupDate: null,
      dropoffDate: null
    }
  }
})
</script>

<style scoped>
.single-listing-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f7ff 0%, #e3f2fd 100%);
  padding: 2rem;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  color: #333;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e3f2fd;
  border-top: 4px solid #00AAFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.back-button {
  margin-top: 1rem;
  padding: 0.75rem 2rem;
  background: #00AAFF;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-button:hover {
  background: #0088CC;
  transform: translateY(-2px);
}

.listing-content {
  max-width: 1400px;
  margin: 0 auto;
}

/* Compact Header in Left Column */
.listing-header-compact {
  background: white;
  border-radius: 15px;
  padding: 1.25rem;
  margin-bottom: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 4px 20px rgba(0, 170, 255, 0.15);
  border: 1px solid rgba(0, 170, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.listing-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
  flex: 1;
  min-width: 200px;
}

.category-badge {
  padding: 0.5rem 1.25rem;
  background: linear-gradient(135deg, #00AAFF 0%, #0088cc 100%);
  color: white;
  border-radius: 50px;
  font-size: 0.95rem;
  font-weight: 600;
  white-space: nowrap;
}

/* Main Grid */
.main-grid {
  display: grid;
  grid-template-columns: 1fr 450px;
  gap: 2rem;
  margin-bottom: 2rem;
  align-items: start;
}

/* Photos Section */
.photos-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.main-photo {
  width: 100%;
  aspect-ratio: 4/3;
  border-radius: 20px;
  overflow: hidden;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 4px 20px rgba(0, 170, 255, 0.15);
  border: 1px solid rgba(0, 170, 255, 0.1);
}

.main-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
}

.thumbnail {
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  border: 3px solid transparent;
  transition: all 0.3s ease;
  background: white;
}

.thumbnail:hover {
  border-color: #00AAFF;
  transform: scale(1.05);
}

.thumbnail.active {
  border-color: #00AAFF;
  box-shadow: 0 4px 12px rgba(0, 170, 255, 0.3);
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Booking Section */
.booking-section {
  position: sticky;
  top: 0.5rem;
  height: fit-content;
}

.booking-card {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 4px 20px rgba(0, 170, 255, 0.15);
  border: 1px solid rgba(0, 170, 255, 0.15);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Selected Dates Display */
.selected-dates-display {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: center;
}

.dates-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  background: #f8fbff;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  max-width: 320px;
  width: 100%;
}

.date-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.date-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #1a1a1a;
}

.date-value {
  font-size: 0.8rem;
  color: #666;
  text-align: center;
  line-height: 1.2;
}

.clear-dates-button {
  background: none;
  border: none;
  color: #00AAFF;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
  text-align: center;
  transition: color 0.3s ease;
}

.clear-dates-button:hover {
  color: #0088CC;
}

/* Total Price Calculation Display */
.total-price-display {
  text-align: center;
  padding: 0.5rem 0;
}

.price-total,
.price-placeholder {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.5px;
}

.price-details {
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.25rem;
  font-weight: 400;
}

/* Price Display at Bottom */
.price-display-bottom {
  display: flex;
  gap: 1.5rem;
  padding: 1rem;
  background: #f8fbff;
  border-radius: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.price-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.price-label {
  font-size: 0.85rem;
  color: #666;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.price-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #00AAFF;
}

/* Request Button */
.request-button {
  width: 100%;
  max-width: 280px;
  margin: 0 auto;
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

.request-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 170, 255, 0.4);
}

.request-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Description Section in Left Column */
.description-section-left {
  background: white;
  border-radius: 15px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 4px 20px rgba(0, 170, 255, 0.15);
  border: 1px solid rgba(0, 170, 255, 0.1);
}

.description-section-left .section-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 1rem 0;
}

.description-section-left .description-text {
  font-size: 1rem;
  line-height: 1.6;
  color: #555;
  margin: 0;
}

/* Properties Section */
.properties-section {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 4px 20px rgba(0, 170, 255, 0.15);
  border: 1px solid rgba(0, 170, 255, 0.1);
}

.section-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 1.5rem 0;
}

.description-text {
  font-size: 1.1rem;
  line-height: 1.8;
  color: #555;
  margin: 0;
}

/* Properties Grid */
.properties-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
}

.property-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.property-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.property-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a1a1a;
}

/* Responsive */
@media (max-width: 1200px) {
  .main-grid {
    grid-template-columns: 1fr;
  }

  .booking-section {
    position: static;
  }
}

@media (max-width: 768px) {
  .single-listing-page {
    padding: 1rem;
  }

  .listing-title {
    font-size: 1.75rem;
  }

  .thumbnail-gallery {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }

  .properties-grid {
    grid-template-columns: 1fr;
  }
}
</style>
