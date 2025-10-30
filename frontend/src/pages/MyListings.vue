<template>
  <div class="my-listings-page">
    <div class="main-content">
      <!-- Page Header -->
      <div class="page-header">
        <h1 class="page-title">My Listings</h1>
        <p class="page-subtitle">Manage your ski equipment listings</p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Loading your listings...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-container">
        <p>{{ error }}</p>
        <button @click="fetchListings" class="retry-btn">Retry</button>
      </div>

      <!-- Listings Content -->
      <div v-else>
        <!-- Active Listings Section -->
        <div class="listings-section">
          <div class="section-header">
            <h2 class="section-title">Active Listings</h2>
            <span class="listing-count">{{ activeListings.length }}</span>
          </div>

          <div v-if="activeListings.length === 0" class="empty-state">
            <p class="empty-text">No active listings</p>
            <p class="empty-subtext">Your active listings will appear here</p>
          </div>

          <div v-else class="listings-grid">
            <div
              v-for="listing in activeListings"
              :key="listing._id"
              class="listing-card"
            >
              <div class="listing-image" @click="viewListing(listing._id)">
                <img
                  :src="getImageUrl(listing.photos[0])"
                  :alt="listing.title"
                  @error="handleImageError"
                />
              </div>
              <div class="listing-info" @click="viewListing(listing._id)">
                <h3 class="listing-title">{{ listing.title }}</h3>
                <p class="listing-category">
                  {{ listing.category_id?.name || 'Unknown' }}
                </p>
                <p class="listing-price">${{ listing.daily_rate }}/day</p>
              </div>
              <div class="listing-actions">
                <button @click.stop="editListing(listing._id)" class="btn btn-edit">
                  Edit
                </button>
                <button @click.stop="hideListing(listing._id)" class="btn btn-hide">
                  Hide
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Inactive Listings Section -->
        <div class="listings-section">
          <div class="section-header">
            <h2 class="section-title">Inactive Listings</h2>
            <span class="listing-count">{{ inactiveListings.length }}</span>
          </div>

          <div v-if="inactiveListings.length === 0" class="empty-state">
            <p class="empty-text">No inactive listings</p>
            <p class="empty-subtext">Your hidden listings will appear here</p>
          </div>

          <div v-else class="listings-grid">
            <div
              v-for="listing in inactiveListings"
              :key="listing._id"
              class="listing-card inactive"
            >
              <div class="listing-image" @click="viewListing(listing._id)">
                <img
                  :src="getImageUrl(listing.photos[0])"
                  :alt="listing.title"
                  @error="handleImageError"
                />
                <div class="inactive-overlay">
                  <span class="inactive-badge">HIDDEN</span>
                </div>
              </div>
              <div class="listing-info" @click="viewListing(listing._id)">
                <h3 class="listing-title">{{ listing.title }}</h3>
                <p class="listing-category">
                  {{ listing.category_id?.name || 'Unknown' }}
                </p>
                <p class="listing-price">${{ listing.daily_rate }}/day</p>
              </div>
              <div class="listing-actions">
                <button @click.stop="editListing(listing._id)" class="btn btn-edit">
                  Edit
                </button>
                <button @click.stop="publishListing(listing._id)" class="btn btn-publish">
                  Publish
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import axios from 'axios';

const router = useRouter();
const authStore = useAuthStore();

// State
const listings = ref([]);
const loading = ref(true);
const error = ref(null);

// Computed
const activeListings = computed(() =>
  listings.value.filter(listing => listing.available === true)
);

const inactiveListings = computed(() =>
  listings.value.filter(listing => listing.available === false)
);

// Methods
const getImageUrl = (photoPath) => {
  if (!photoPath) return '/assets/images/placeholder.jpg';
  if (photoPath.startsWith('http')) return photoPath;
  return `http://localhost:5000${photoPath}`;
};

const handleImageError = (e) => {
  e.target.src = '/assets/images/placeholder.jpg';
};

const fetchListings = async () => {
  loading.value = true;
  error.value = null;

  try {
    const token = authStore.token;
    if (!token) {
      error.value = 'You must be logged in to view your listings';
      router.push('/login');
      return;
    }

    const response = await axios.get('http://localhost:5000/api/listings/my/listings', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    listings.value = response.data.listings || [];
  } catch (err) {
    console.error('Error fetching listings:', err);
    error.value = err.response?.data?.message || 'Failed to fetch listings. Please try again.';
  } finally {
    loading.value = false;
  }
};

const viewListing = (listingId) => {
  router.push(`/listing/${listingId}`);
};

const editListing = (listingId) => {
  router.push(`/update-listing/${listingId}`);
};

const hideListing = async (listingId) => {
  if (!confirm('Are you sure you want to hide this listing? It will no longer be visible to other users.')) {
    return;
  }

  try {
    const token = authStore.token;
    await axios.put(
      `http://localhost:5000/api/listings/${listingId}`,
      { available: false },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    // Update local state
    const listing = listings.value.find(l => l._id === listingId);
    if (listing) {
      listing.available = false;
    }
  } catch (err) {
    console.error('Error hiding listing:', err);
    alert(err.response?.data?.message || 'Failed to hide listing. Please try again.');
  }
};

const publishListing = async (listingId) => {
  try {
    const token = authStore.token;
    await axios.put(
      `http://localhost:5000/api/listings/${listingId}`,
      { available: true },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    // Update local state
    const listing = listings.value.find(l => l._id === listingId);
    if (listing) {
      listing.available = true;
    }
  } catch (err) {
    console.error('Error publishing listing:', err);
    alert(err.response?.data?.message || 'Failed to publish listing. Please try again.');
  }
};

// Lifecycle
onMounted(() => {
  fetchListings();
});
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.my-listings-page {
  width: 100%;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: linear-gradient(135deg, #f0f7ff 0%, #e3f2fd 100%);
  padding-bottom: 3rem;
}

.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

/* Page Header */
.page-header {
  text-align: center;
  margin-bottom: 3rem;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.page-subtitle {
  font-size: 1.1rem;
  color: #666;
  font-weight: 400;
}

/* Loading & Error States */
.loading-container,
.error-container {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 170, 255, 0.1);
}

.spinner {
  width: 50px;
  height: 50px;
  margin: 0 auto 1rem;
  border: 4px solid #e3f2fd;
  border-top-color: #00AAFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-container p {
  color: #ff4757;
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.retry-btn {
  padding: 0.75rem 2rem;
  background: #00AAFF;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background: #0088cc;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 170, 255, 0.3);
}

/* Listings Section */
.listings-section {
  margin-bottom: 4rem;
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

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 20px;
  border: 2px dashed #e3f2fd;
}

.empty-text {
  font-size: 1.3rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.empty-subtext {
  font-size: 1rem;
  color: #999;
}

/* Listings Grid */
.listings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 2rem;
}

/* Listing Card */
.listing-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 170, 255, 0.1);
  border: 1px solid rgba(0, 170, 255, 0.1);
  transition: all 0.3s ease;
}

.listing-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 170, 255, 0.2);
}

.listing-card.inactive {
  opacity: 0.8;
}

.listing-image {
  position: relative;
  width: 100%;
  height: 250px;
  overflow: hidden;
  background: #f0f0f0;
  cursor: pointer;
}

.listing-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.3s ease;
}

.listing-card:hover .listing-image img {
  transform: scale(1.05);
}

.listing-card.inactive .listing-image img {
  filter: grayscale(60%) brightness(0.9);
}

.inactive-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.inactive-badge {
  background: rgba(255, 71, 87, 0.95);
  color: white;
  padding: 0.5rem 1.5rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 1px;
}

.listing-info {
  padding: 1.5rem;
  cursor: pointer;
}

.listing-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 0.75rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.listing-category {
  font-size: 1rem;
  color: #666;
  margin-bottom: 0.75rem;
}

.listing-price {
  font-size: 1.4rem;
  font-weight: 700;
  color: #00AAFF;
}

.listing-actions {
  display: flex;
  gap: 0.75rem;
  padding: 0 1.5rem 1.5rem;
}

.btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.875rem 1.25rem;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-edit {
  background: #00AAFF;
  color: white;
}

.btn-edit:hover {
  background: #0088cc;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 170, 255, 0.3);
}

.btn-hide {
  background: #ff4757;
  color: white;
}

.btn-hide:hover {
  background: #ee3344;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 71, 87, 0.3);
}

.btn-publish {
  background: #2ecc71;
  color: white;
}

.btn-publish:hover {
  background: #27ae60;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(46, 204, 113, 0.3);
}

/* Responsive Design */
@media (max-width: 1200px) {
  .listings-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (max-width: 768px) {
  .main-content {
    padding: 1.5rem 1rem;
  }

  .page-title {
    font-size: 2rem;
  }

  .section-title {
    font-size: 1.5rem;
  }

  .listings-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .listing-image {
    height: 200px;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.75rem;
  }

  .section-title {
    font-size: 1.3rem;
  }

  .listing-title {
    font-size: 1.1rem;
  }

  .btn {
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
  }
}
</style>
