<template>
  <div class="user-profile-page">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading profile...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <h2>Profile Not Found</h2>
      <p>{{ error }}</p>
      <button @click="$router.push('/browse')" class="back-btn">Browse Listings</button>
    </div>

    <!-- Profile Content -->
    <div v-else-if="profileData" class="profile-content">
      <!-- Header Section -->
      <div class="profile-header-wrapper">
        <!-- Left Card: Visual Info -->
        <div class="profile-visual-card">
          <div class="background-photo">
            <img
              v-if="profileData.user.background_photo"
              :src="getPhotoUrl(profileData.user.background_photo)"
              alt="Background"
            />
            <div v-else class="background-placeholder"></div>
          </div>

          <!-- Profile Info Container -->
          <div class="profile-info-container">
            <!-- Profile Avatar -->
            <div class="profile-avatar">
              <img
                v-if="profileData.user.profile_photo"
                :src="getPhotoUrl(profileData.user.profile_photo)"
                alt="Profile"
              />
              <div v-else class="avatar-placeholder">
                {{ (profileData.user.first_name || 'U')[0].toUpperCase() }}
              </div>
            </div>

            <!-- Name & Member Since -->
            <div class="profile-text" :class="{ 'dark-text': !profileData.user.background_photo }">
              <h2 class="profile-name">{{ profileData.user.first_name }} {{ profileData.user.last_name }}</h2>
              <p class="profile-member-since">Member since {{ formatYear(profileData.user.createdAt) }}</p>
            </div>
          </div>
        </div>

        <!-- Right Card: Text Info -->
        <div class="profile-info-card">
          <!-- Badges -->
          <div class="user-badges">
            <div class="badge-item">
              <img
                :src="profileData.user.id_verified ? '/assets/icons/verified_icon.svg' : '/assets/icons/unverified_icon.svg'"
                :alt="profileData.user.id_verified ? 'Verified' : 'Unverified'"
                class="badge-icon"
              />
              <span>{{ profileData.user.id_verified ? 'Verified' : 'Unverified' }}</span>
            </div>
            <div class="badge-item">
              <img
                :src="profileData.user.user_type === 'company' ? '/assets/icons/company_icon.svg' : '/assets/icons/individual_icon.svg'"
                :alt="profileData.user.user_type === 'company' ? 'Company' : 'Individual'"
                class="badge-icon"
              />
              <span>{{ profileData.user.user_type === 'company' ? 'Company' : 'Individual' }}</span>
            </div>
          </div>

          <!-- Stats Grid -->
          <div class="stats-grid">
            <!-- 1. Response Rate -->
            <div class="stat-item">
              <img src="/assets/icons/response_icon.svg" alt="Response rate" class="stat-icon" />
              <div class="stat-content">
                <span class="stat-label">Response Rate</span>
                <span class="stat-value">{{ profileData.user.response_rate || 0 }}%</span>
              </div>
            </div>

            <!-- 2. Response Time -->
            <div class="stat-item">
              <img src="/assets/icons/clock_icon.svg" alt="Response time" class="stat-icon" />
              <div class="stat-content">
                <span class="stat-label">Response Time</span>
                <span class="stat-value">{{ formatResponseTime(profileData.user.response_time) }}</span>
              </div>
            </div>

            <!-- 3. Total Rentals -->
            <div class="stat-item">
              <img src="/assets/icons/rental_icon.svg" alt="Rentals" class="stat-icon" />
              <div class="stat-content">
                <span class="stat-label">Total Rentals</span>
                <span class="stat-value">{{ profileData.statistics.rentalsFromOthers + profileData.statistics.rentalsToOthers }}</span>
              </div>
            </div>

            <!-- 4. Location -->
            <div class="stat-item" v-if="profileData.user.location">
              <img src="/assets/icons/location_icon.svg" alt="Location" class="stat-icon" />
              <div class="stat-content">
                <span class="stat-label">Location</span>
                <span class="stat-value">
                  {{ profileData.user.location.city }}, {{ profileData.user.location.country }}
                </span>
              </div>
            </div>

            <!-- 5. NIP Number (Company only) -->
            <div class="stat-item" v-if="profileData.user.user_type === 'company' && profileData.user.NIP_number">
              <img src="/assets/icons/company_icon.svg" alt="NIP" class="stat-icon" />
              <div class="stat-content">
                <span class="stat-label">NIP Number</span>
                <span class="stat-value">{{ profileData.user.NIP_number }}</span>
              </div>
            </div>

            <!-- 6. Website (Company only) -->
            <div class="stat-item stat-item-full" v-if="profileData.user.user_type === 'company' && profileData.user.website_address">
              <img src="/assets/icons/company_icon.svg" alt="Website" class="stat-icon" />
              <div class="stat-content">
                <span class="stat-label">Website</span>
                <a :href="profileData.user.website_address" target="_blank" class="stat-link">
                  {{ profileData.user.website_address }}
                </a>
              </div>
            </div>
          </div>

          <!-- Average Rating Section (Bottom Center) -->
          <div class="rating-section" v-if="profileData.user.rating_avg > 0">
            <span class="rating-label">Average Rating</span>
            <div class="rating-stars-large">
              <div
                v-for="star in Math.ceil(profileData.user.rating_avg)"
                :key="star"
                class="star-container"
              >
                <img
                  src="/assets/icons/star_icon.svg"
                  alt="Star"
                  class="star-large"
                  :style="getStarStyle(star, profileData.user.rating_avg)"
                />
              </div>
            </div>
            <div class="rating-text-large">
              <span class="rating-value-large">{{ profileData.user.rating_avg.toFixed(1) }}</span>
              <span class="rating-max">/5</span>
            </div>
          </div>
          <div class="rating-section" v-else>
            <span class="rating-label">Average Rating</span>
            <div class="rating-text-large">
              <span class="rating-value-large no-rating-text">No rating yet</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Reviews Section -->
      <div class="reviews-section" v-if="profileData.reviews && profileData.reviews.length > 0">
        <div class="section-header">
          <h2 class="section-title">Reviews</h2>
          <span class="listing-count">{{ profileData.reviews.length }}</span>
          <button v-if="profileData.reviews.length > 3" class="view-all-btn" @click="showAllReviews = !showAllReviews">
            {{ showAllReviews ? 'Show Less' : 'View All Reviews' }}
          </button>
        </div>

        <div class="reviews-carousel">
          <div
            v-for="review in displayedReviews"
            :key="review.id"
            class="review-card"
          >
            <div class="review-header">
              <div class="reviewer-info">
                <div class="reviewer-avatar">
                  <img
                    v-if="review.reviewer.profile_photo"
                    :src="getPhotoUrl(review.reviewer.profile_photo)"
                    alt="Reviewer"
                  />
                  <div v-else class="reviewer-placeholder">
                    {{ review.reviewer.name[0].toUpperCase() }}
                  </div>
                </div>
                <div class="reviewer-details">
                  <h4 class="reviewer-name">{{ review.reviewer.name }}</h4>
                  <div class="review-rating">
                    <span v-for="star in 5" :key="star" class="star-small" :class="{ filled: star <= review.rating }">
                      ⭐
                    </span>
                  </div>
                </div>
              </div>
              <span class="review-date">{{ formatDate(review.createdAt) }}</span>
            </div>
            <p class="review-text">{{ review.comment }}</p>
          </div>
        </div>
      </div>

      <!-- No Reviews -->
      <div v-else class="no-reviews">
        <p>No reviews yet</p>
      </div>

      <!-- Active Listings Section -->
      <div class="listings-section" v-if="profileData.activeListings && profileData.activeListings.length > 0">
        <div class="section-header">
          <h2 class="section-title">Active Listings</h2>
          <span class="listing-count">{{ profileData.activeListings.length }}</span>
        </div>

        <div class="listings-grid">
          <div
            v-for="listing in profileData.activeListings"
            :key="listing.id"
            class="listing-card"
            @click="navigateToListing(listing.id)"
          >
            <div class="listing-image">
              <img
                :src="listing.photos && listing.photos.length > 0 ? getPhotoUrl(listing.photos[0]) : 'https://via.placeholder.com/320x200'"
                :alt="listing.title"
              />
            </div>
            <div class="listing-details">
              <p class="listing-category">{{ listing.category }}</p>
              <h3 class="listing-title">{{ listing.title }}</h3>
              <div class="listing-footer">
                <p class="listing-price">${{ listing.daily_rate }}<span>/day</span></p>
                <p class="listing-location" v-if="listing.location">
                  📍 {{ listing.location.city }}, {{ listing.location.country }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Listings -->
      <div v-else class="no-listings">
        <p>No active listings</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref(null)
const profileData = ref(null)
const showAllReviews = ref(false)

// Computed
const displayedReviews = computed(() => {
  if (!profileData.value?.reviews) return []
  return showAllReviews.value ? profileData.value.reviews : profileData.value.reviews.slice(0, 3)
})

// Methods
const fetchProfile = async () => {
  loading.value = true
  error.value = null

  try {
    const identifier = route.params.identifier
    const response = await axios.get(`${API_URL}/api/users/public/${identifier}`)
    profileData.value = response.data
  } catch (err) {
    console.error('Error fetching profile:', err)
    error.value = err.response?.data?.message || 'Failed to load user profile'
  } finally {
    loading.value = false
  }
}

const getPhotoUrl = (photoPath) => {
  if (!photoPath) return null
  if (photoPath.startsWith('http')) return photoPath
  return `${API_URL}${photoPath}`
}

const formatYear = (dateString) => {
  return new Date(dateString).getFullYear()
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const options = { year: 'numeric', month: 'long', day: 'numeric' }
  return date.toLocaleDateString('en-US', options)
}

const formatResponseTime = (responseTime) => {
  if (!responseTime) return 'Not available'
  const timeMap = {
    'few hours': 'Within a few hours',
    'within a day': 'Within a day',
    'within a few days': 'Within a few days'
  }
  return timeMap[responseTime] || responseTime
}

const navigateToListing = (listingId) => {
  router.push(`/listing/${listingId}`)
}

const getStarStyle = (starPosition, rating) => {
  // Calculate how much of this star should be visible
  const fraction = rating - (starPosition - 1)

  if (fraction >= 1) {
    // Full star
    return { clipPath: 'none', opacity: 1 }
  } else if (fraction > 0) {
    // Partial star - clip from right
    const percentage = Math.round(fraction * 100)
    return { clipPath: `inset(0 ${100 - percentage}% 0 0)`, opacity: 1 }
  }
  return { opacity: 0 }
}

// Lifecycle
onMounted(() => {
  fetchProfile()
})
</script>

<style scoped>
.user-profile-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f7ff 0%, #e3f2fd 100%);
  padding-bottom: 2rem;
}

/* Loading & Error States */
.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 1rem;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #e0e0e0;
  border-top: 4px solid #00AAFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container h2 {
  color: #d32f2f;
}

.back-btn {
  padding: 0.75rem 1.5rem;
  background: #00AAFF;
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: #0088CC;
  transform: translateY(-2px);
}

/* Profile Content */
.profile-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

/* Header Section Wrapper */
.profile-header-wrapper {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

/* Visual Card - Left */
.profile-visual-card {
  position: relative;
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 4px 20px rgba(0, 170, 255, 0.15);
  border: 1px solid rgba(0, 170, 255, 0.1);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  gap: 1.5rem;
  min-height: 300px;
  width: 400px;
  flex-shrink: 0;
}

.background-photo {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #F8FBFF;
  z-index: 0;
}

.background-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.background-placeholder {
  width: 100%;
  height: 100%;
  background: #F8FBFF;
}

/* Profile Info Container */
.profile-info-container {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
}

.profile-avatar {
  width: 140px;
  height: 140px;
  border-radius: 50%;
  border: 5px solid white;
  overflow: hidden;
  background: white;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25);
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #00AAFF 0%, #66D1FF 100%);
  color: white;
  font-size: 3.5rem;
  font-weight: 700;
}

.profile-text {
  text-align: center;
  color: white;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.profile-text.dark-text {
  color: #1a1a1a;
  text-shadow: none;
}

.profile-name {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0 0 0.3rem 0;
  color: white;
}

.profile-text.dark-text .profile-name {
  color: #1a1a1a;
}

.profile-member-since {
  font-size: 0.9rem;
  margin: 0;
  color: rgba(255, 255, 255, 0.95);
  font-weight: 500;
}

.profile-text.dark-text .profile-member-since {
  color: rgba(26, 26, 26, 0.85);
}

/* Info Card - Right */
.profile-info-card {
  background: white;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 4px 20px rgba(0, 170, 255, 0.15);
  border: 1px solid rgba(0, 170, 255, 0.1);
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  flex: 1;
}

.user-badges {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.badge-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: #f8fbff;
  border: 2px solid #e3f2fd;
  border-radius: 25px;
  transition: all 0.3s ease;
}

.badge-item:hover {
  border-color: #00AAFF;
  transform: translateY(-2px);
}

.badge-icon {
  width: 20px;
  height: 20px;
}

.badge-item span {
  font-size: 0.95rem;
  font-weight: 600;
  color: #555;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.stat-item-full {
  grid-column: 1 / -1;
}

.stat-icon {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: #666;
  font-weight: 500;
}

.stat-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1a1a1a;
}

.stat-link {
  font-size: 1rem;
  color: #00AAFF;
  text-decoration: none;
  font-weight: 600;
  word-break: break-all;
}

.stat-link:hover {
  text-decoration: underline;
}

/* Rating Section - Bottom Center */
.rating-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding-top: 1.75rem;
  border-top: 2px solid #e3f2fd;
}

.rating-stars-large {
  display: flex;
  gap: 0.35rem;
  align-items: center;
}

.star-container {
  position: relative;
  display: inline-block;
}

.star-large {
  width: 32px;
  height: 32px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
  transition: all 0.3s ease;
}

.rating-text-large {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
}

.rating-value-large {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a1a;
}

.rating-max {
  font-size: 1.1rem;
  font-weight: 500;
  color: #666;
}

.no-rating-text {
  color: #999;
  font-size: 1.2rem;
  font-weight: 500;
}

/* Reviews Section */
.reviews-section,
.listings-section {
  max-width: 1400px;
  margin: 0 auto 2rem;
  background: white;
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 4px 20px rgba(0, 170, 255, 0.15);
  border: 1px solid rgba(0, 170, 255, 0.1);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.listing-count {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 40px;
  padding: 0 1rem;
  background: linear-gradient(135deg, #00AAFF 0%, #0088cc 100%);
  color: white;
  border-radius: 20px;
  font-size: 1rem;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(0, 170, 255, 0.3);
}

.view-all-btn {
  padding: 0.75rem 1.5rem;
  background: transparent;
  color: #00AAFF;
  border: 2px solid #00AAFF;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.view-all-btn:hover {
  background: #00AAFF;
  color: white;
}

.reviews-carousel {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.review-card {
  background: #f8f9fa;
  border-radius: 15px;
  padding: 1.5rem;
  border: 2px solid #e3f2fd;
  transition: all 0.3s ease;
}

.review-card:hover {
  border-color: #00AAFF;
  transform: translateY(-3px);
  box-shadow: 0 4px 15px rgba(0, 170, 255, 0.15);
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.reviewer-info {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.reviewer-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #00AAFF;
  flex-shrink: 0;
}

.reviewer-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.reviewer-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #00AAFF 0%, #66D1FF 100%);
  color: white;
  font-weight: 700;
  font-size: 1.2rem;
}

.reviewer-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.reviewer-name {
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.review-rating {
  display: flex;
  gap: 0.1rem;
}

.star-small {
  font-size: 0.85rem;
  color: #ddd;
}

.star-small.filled {
  color: #FF1493;
}

.review-date {
  font-size: 0.85rem;
  color: #999;
}

.review-text {
  font-size: 0.95rem;
  color: #555;
  line-height: 1.6;
  margin: 0;
}

/* Listings Grid */
.listings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.listing-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 2px solid transparent;
}

.listing-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 24px rgba(0, 170, 255, 0.2);
  border-color: #00AAFF;
}

.listing-image {
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: #f0f0f0;
}

.listing-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.listing-card:hover .listing-image img {
  transform: scale(1.05);
}

.listing-details {
  padding: 1.25rem;
}

.listing-category {
  font-size: 0.875rem;
  color: #00AAFF;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 0.5rem 0;
}

.listing-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #333;
  margin: 0 0 1rem 0;
  min-height: 3rem;
}

.listing-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.listing-price {
  font-size: 1.5rem;
  font-weight: 700;
  color: #00AAFF;
  margin: 0;
}

.listing-price span {
  font-size: 1rem;
  font-weight: 400;
  color: #666;
}

.listing-location {
  font-size: 0.95rem;
  color: #666;
  margin: 0;
}

/* No Content States */
.no-reviews,
.no-listings {
  background: white;
  border-radius: 20px;
  padding: 3rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 4px 20px rgba(0, 170, 255, 0.15);
  border: 1px solid rgba(0, 170, 255, 0.1);
  margin: 0 auto 2rem;
  max-width: 1400px;
  text-align: center;
  color: #999;
  font-size: 1.1rem;
}

/* Responsive */
@media (max-width: 1024px) {
  .profile-header-wrapper {
    flex-direction: column;
  }

  .profile-visual-card {
    width: 100%;
    min-height: 350px;
  }

  .profile-info-card {
    padding: 2rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .profile-visual-card {
    min-height: 280px;
  }

  .profile-avatar {
    width: 150px;
    height: 150px;
  }

  .avatar-placeholder {
    font-size: 4rem;
  }

  .profile-info-card {
    padding: 1.5rem;
    gap: 1.5rem;
  }

  .user-name {
    font-size: 2rem;
  }

  .user-badges {
    flex-direction: column;
    align-items: flex-start;
  }

  .reviews-section,
  .listings-section {
    padding: 1.5rem;
  }

  .section-title {
    font-size: 1.5rem;
  }

  .reviews-carousel,
  .listings-grid {
    grid-template-columns: 1fr;
  }

  .listing-card {
    max-width: 100%;
  }
}
</style>
