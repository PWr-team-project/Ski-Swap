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
      <!-- Header Section -->
      <div class="listing-header">
        <div class="header-left">
          <h1 class="listing-title">{{ listing.title }}</h1>
          <div class="category-badge">{{ listing.category }}</div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="main-grid">
        <!-- Left Side: Photos -->
        <div class="photos-section">
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
        </div>

        <!-- Right Side: Calendar & Booking -->
        <div class="booking-section">
          <div class="booking-card">
            <div class="price-display">
              <span class="price-amount">${{ listing.dailyRate }}</span>
              <span class="price-period">/day</span>
            </div>

            <!-- Calendar Component -->
            <DateRangeCalendar v-model="selectedDates" />

            <!-- Price Calculation -->
            <div v-if="totalPrice > 0" class="price-breakdown">
              <div class="breakdown-row">
                <span>{{ rentalDays }} days</span>
                <span>${{ totalPrice.toFixed(2) }}</span>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="action-buttons">
              <button class="request-button" :disabled="!canBook">
                Send Request
              </button>
              <button class="contact-button" @click="handleContactSeller" :disabled="isOwner">
                {{ isOwner ? 'Your Listing' : 'Contact Seller' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Owner Business Card -->
      <div class="owner-card">
        <div class="owner-header">
          <div class="owner-avatar">
            <img :src="ownerAvatar" :alt="ownerName" />
          </div>
          <div class="owner-info">
            <h3 class="owner-name">{{ ownerName }}</h3>
            <div class="owner-badges">
              <span class="verified-badge">✓ Verified</span>
              <span class="member-badge">Member since {{ memberSince }}</span>
            </div>
            <div class="owner-stats">
              <span class="stat-item">{{ ownerListingsCount }} listings</span>
              <span class="stat-item">{{ ownerRating }} ★</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Description Section -->
      <div class="description-section">
        <h2 class="section-title">Description</h2>
        <p class="description-text">{{ listing.description }}</p>
      </div>

      <!-- Properties Section -->
      <div class="properties-section">
        <h2 class="section-title">Item Details</h2>
        <div class="properties-grid">
          <div class="property-item">
            <span class="property-label">Category</span>
            <span class="property-value">{{ listing.category }}</span>
          </div>
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
            <span class="property-value">{{ listing.condition }}</span>
          </div>
          <div class="property-item">
            <span class="property-label">Location</span>
            <span class="property-value">{{ listing.city }}, {{ listing.country }}</span>
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
import axios from 'axios'
import DateRangeCalendar from '../components/DateRangeCalendar.vue'
import ListingCarousel from '../components/ListingCarousel.vue'

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

const canBook = computed(() => {
  return selectedDates.value.pickupDate && selectedDates.value.dropoffDate && totalPrice.value > 0
})

// Owner info computed properties
const ownerAvatar = computed(() => {
  return listing.value?.owner?.profilePicture || 'https://via.placeholder.com/80'
})

const ownerName = computed(() => {
  if (!listing.value?.owner) return 'Unknown'
  return `${listing.value.owner.firstName} ${listing.value.owner.lastName}`
})

const ownerFirstName = computed(() => {
  return listing.value?.owner?.firstName || 'this owner'
})

const memberSince = computed(() => {
  if (!listing.value?.owner?.createdAt) return '2024'
  const date = new Date(listing.value.owner.createdAt)
  return date.getFullYear()
})

const ownerListingsCount = computed(() => {
  return ownerOtherItems.value.length + 1 // +1 for current listing
})

const ownerRating = computed(() => {
  return listing.value?.owner?.rating || '5.0'
})

const isOwner = computed(() => {
  return authStore.user?.id === listing.value?.owner?.id
})

// Methods
const handleContactSeller = async () => {
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }

  if (isOwner.value) {
    return
  }

  try {
    const token = authStore.token
    const response = await axios.post(
      'http://localhost:5000/api/messages/start-listing-conversation',
      {
        listingId: listing.value.id,
        sellerId: listing.value.owner.id
      },
      {
        headers: { 'Authorization': `Bearer ${token}` }
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
    const response = await axios.get(`http://localhost:5000/api/listings/${route.params.id}`)
    const data = response.data.listing

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
      photos: (data.photos || []).map(photo =>
        photo.startsWith('http') ? photo : `http://localhost:5000${photo}`
      ),
      owner: {
        id: data.owner_id?._id,
        firstName: data.owner_id?.first_name || 'Unknown',
        lastName: data.owner_id?.last_name || 'User',
        nickname: data.owner_id?.nickname || 'user',
        profilePicture: data.owner_id?.profile_photo || null,
        createdAt: data.owner_id?.createdAt,
        rating: data.owner_id?.rating_avg || 5.0
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

    const response = await axios.get(`http://localhost:5000/api/listings`)
    const allListings = response.data.listings || []

    // Filter by owner and exclude current listing
    ownerOtherItems.value = allListings
      .filter(item => item.owner_id?._id === listing.value.owner.id && item._id !== listing.value.id)
      .slice(0, 6)
      .map(item => ({
        id: item._id,
        title: item.title,
        dailyRate: item.daily_rate,
        photos: (item.photos || []).map(photo =>
          photo.startsWith('http') ? photo : `http://localhost:5000${photo}`
        )
      }))
  } catch (err) {
    console.error('Error fetching owner items:', err)
  }
}

const fetchCategoryItems = async () => {
  try {
    if (!listing.value?.category) return

    const response = await axios.get(`http://localhost:5000/api/listings`)
    const allListings = response.data.listings || []

    // Filter by category and exclude current listing
    categoryItems.value = allListings
      .filter(item => item.category_id?.name === listing.value.category && item._id !== listing.value.id)
      .slice(0, 6)
      .map(item => ({
        id: item._id,
        title: item.title,
        dailyRate: item.daily_rate,
        photos: (item.photos || []).map(photo =>
          photo.startsWith('http') ? photo : `http://localhost:5000${photo}`
        )
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

/* Header */
.listing-header {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 20px rgba(0, 170, 255, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.listing-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.category-badge {
  padding: 0.5rem 1.5rem;
  background: linear-gradient(135deg, #00AAFF 0%, #0088cc 100%);
  color: white;
  border-radius: 50px;
  font-size: 1rem;
  font-weight: 600;
}

/* Main Grid */
.main-grid {
  display: grid;
  grid-template-columns: 1fr 450px;
  gap: 2rem;
  margin-bottom: 2rem;
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
  box-shadow: 0 4px 20px rgba(0, 170, 255, 0.1);
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
  top: 2rem;
  height: fit-content;
}

.booking-card {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 170, 255, 0.1);
  border: 1px solid rgba(0, 170, 255, 0.1);
}

.price-display {
  text-align: center;
  padding-bottom: 1.5rem;
  border-bottom: 2px solid #e3f2fd;
  margin-bottom: 1.5rem;
}

.price-amount {
  font-size: 2.5rem;
  font-weight: 700;
  color: #00AAFF;
}

.price-period {
  font-size: 1.2rem;
  color: #666;
  margin-left: 0.5rem;
}

/* Price Breakdown */
.price-breakdown {
  background: #f8fbff;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.breakdown-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.request-button,
.contact-button {
  width: 100%;
  padding: 1rem;
  border: none;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.request-button {
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

.contact-button {
  background: white;
  color: #00AAFF;
  border: 2px solid #00AAFF;
}

.contact-button:hover {
  background: #00AAFF;
  color: white;
}

/* Owner Card */
.owner-card {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 20px rgba(0, 170, 255, 0.1);
}

.owner-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.owner-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #00AAFF;
}

.owner-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.owner-info {
  flex: 1;
}

.owner-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 0.5rem 0;
}

.owner-badges {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.verified-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  background: #d4edda;
  color: #155724;
  border-radius: 50px;
  font-size: 0.9rem;
  font-weight: 600;
}

.member-badge {
  padding: 0.25rem 0.75rem;
  background: #e3f2fd;
  color: #00AAFF;
  border-radius: 50px;
  font-size: 0.9rem;
  font-weight: 600;
}

.owner-stats {
  display: flex;
  gap: 1.5rem;
  color: #666;
  font-size: 0.95rem;
}

.stat-item {
  font-weight: 600;
}

/* Description Section */
.description-section,
.properties-section {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 20px rgba(0, 170, 255, 0.1);
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

  .owner-header {
    flex-direction: column;
    text-align: center;
  }
}
</style>
