<template>
  <div class="user-detail-container">
    <!-- Back Button -->
    <button @click="goBack" class="back-button">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m15 18-6-6 6-6"/>
      </svg>
      Back to Users
    </button>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading user details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <p>{{ error }}</p>
      <button @click="fetchUserDetails" class="retry-button">Try Again</button>
    </div>

    <!-- User Details -->
    <div v-else-if="user" class="details-grid">
      <!-- User Profile Card -->
      <div class="detail-card profile-card">
        <h2>User Profile</h2>
        <div class="profile-header">
          <img
            :src="getUserAvatar(user)"
            :alt="user.nickname"
            class="profile-avatar"
          />
          <div class="profile-info">
            <h3>{{ user.nickname }}</h3>
            <p class="email">{{ user.email }}</p>
            <div class="status-badges">
              <span v-if="user.admin_flag" class="status-badge admin">Admin</span>
              <span v-if="user.id_verified" class="status-badge verified">Verified</span>
              <span v-if="user.blocked_flag" class="status-badge blocked">Blocked</span>
            </div>
          </div>
        </div>

        <div class="info-section">
          <div class="info-row">
            <span class="info-label">Full Name:</span>
            <span class="info-value">{{ user.first_name }} {{ user.last_name }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">User Type:</span>
            <span class="info-value">
              <span class="type-badge" :class="`type-${user.user_type}`">
                {{ formatUserType(user.user_type) }}
              </span>
            </span>
          </div>
          <div class="info-row" v-if="user.phone_number">
            <span class="info-label">Phone Number:</span>
            <span class="info-value">{{ user.phone_number }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">OAuth Provider:</span>
            <span class="info-value">{{ user.oauth_provider || 'local' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Account Created:</span>
            <span class="info-value">{{ formatDate(user.createdAt) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Last Updated:</span>
            <span class="info-value">{{ formatDate(user.updatedAt) }}</span>
          </div>
        </div>
      </div>

      <!-- Company Information (if applicable) -->
      <div v-if="user.user_type === 'company'" class="detail-card">
        <h2>Company Information</h2>
        <div class="info-section">
          <div class="info-row" v-if="user.NIP_number">
            <span class="info-label">NIP Number:</span>
            <span class="info-value">{{ user.NIP_number }}</span>
          </div>
          <div class="info-row" v-if="user.website_address">
            <span class="info-label">Website:</span>
            <span class="info-value">
              <a :href="user.website_address" target="_blank" class="link">
                {{ user.website_address }}
              </a>
            </span>
          </div>
        </div>
      </div>

      <!-- Location Information -->
      <div v-if="user.location_id" class="detail-card">
        <h2>Location</h2>
        <div class="info-section">
          <div class="info-row" v-if="user.location_id.city">
            <span class="info-label">City:</span>
            <span class="info-value">{{ user.location_id.city }}</span>
          </div>
          <div class="info-row" v-if="user.location_id.country">
            <span class="info-label">Country:</span>
            <span class="info-value">{{ user.location_id.country }}</span>
          </div>
          <div class="info-row" v-if="user.location_id.postal_code">
            <span class="info-label">Postal Code:</span>
            <span class="info-value">{{ user.location_id.postal_code }}</span>
          </div>
          <div class="info-row" v-if="user.location_id.street">
            <span class="info-label">Street:</span>
            <span class="info-value">{{ user.location_id.street }}</span>
          </div>
        </div>
      </div>

      <!-- Profile Description -->
      <div v-if="user.profile_description" class="detail-card description-card">
        <h2>Profile Description</h2>
        <p class="description">{{ user.profile_description }}</p>
      </div>

      <!-- Ratings and Response -->
      <div class="detail-card">
        <h2>Performance Metrics</h2>
        <div class="info-section">
          <div class="info-row">
            <span class="info-label">Average Rating:</span>
            <span class="info-value">
              {{ user.rating_avg ? user.rating_avg.toFixed(1) : 'N/A' }}
              <span v-if="user.rating_avg">⭐</span>
            </span>
          </div>
          <div class="info-row">
            <span class="info-label">Response Rate:</span>
            <span class="info-value">{{ user.reponse_rate || 100 }}%</span>
          </div>
          <div class="info-row" v-if="user.reponse_time">
            <span class="info-label">Response Time:</span>
            <span class="info-value">{{ user.reponse_time }}</span>
          </div>
        </div>
      </div>

      <!-- Statistics Card -->
      <div class="detail-card statistics-card">
        <h2>User Statistics</h2>
        <div v-if="statsLoading" class="stats-loading">
          <div class="spinner-small"></div>
          <p>Loading statistics...</p>
        </div>
        <div v-else-if="stats" class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">{{ stats.totalListings }}</div>
            <div class="stat-label">Total Listings</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.activeListings }}</div>
            <div class="stat-label">Active Listings</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.totalBookingsMade }}</div>
            <div class="stat-label">Bookings Made</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">{{ stats.totalBookingsReceived }}</div>
            <div class="stat-label">Bookings Received</div>
          </div>
        </div>
      </div>

      <!-- Account Flags -->
      <div class="detail-card flags-card">
        <h2>Account Flags</h2>
        <div class="info-section">
          <div class="flag-row">
            <span class="flag-label">Admin Flag:</span>
            <span :class="['flag-indicator', user.admin_flag ? 'active' : 'inactive']">
              {{ user.admin_flag ? '✓ Yes' : '✗ No' }}
            </span>
          </div>
          <div class="flag-row">
            <span class="flag-label">ID Verified:</span>
            <span :class="['flag-indicator', user.id_verified ? 'active' : 'inactive']">
              {{ user.id_verified ? '✓ Yes' : '✗ No' }}
            </span>
          </div>
          <div class="flag-row">
            <span class="flag-label">Blocked:</span>
            <span :class="['flag-indicator', user.blocked_flag ? 'blocked' : 'inactive']">
              {{ user.blocked_flag ? '✓ Yes' : '✗ No' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import adminService from '../../services/adminService';

export default {
  name: 'UserDetail',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const user = ref(null);
    const stats = ref(null);
    const loading = ref(false);
    const statsLoading = ref(false);
    const error = ref(null);

    const fetchUserDetails = async () => {
      try {
        loading.value = true;
        error.value = null;

        const userId = route.params.id;
        const response = await adminService.getUserDetails(userId);
        user.value = response.user;

        // Fetch statistics
        fetchUserStats(userId);
      } catch (err) {
        console.error('Error fetching user details:', err);
        error.value = err.response?.data?.message || 'Failed to fetch user details. Please try again.';
      } finally {
        loading.value = false;
      }
    };

    const fetchUserStats = async (userId) => {
      try {
        statsLoading.value = true;
        const response = await adminService.getUserStats(userId);
        stats.value = response;
      } catch (err) {
        console.error('Error fetching user stats:', err);
      } finally {
        statsLoading.value = false;
      }
    };

    const goBack = () => {
      router.push({ name: 'InspectUsers' });
    };

    const getUserAvatar = (user) => {
      if (user.profile_photo && user.profile_photo.startsWith('http')) {
        return user.profile_photo;
      } else if (user.profile_photo) {
        return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${user.profile_photo}`;
      }
      return 'https://via.placeholder.com/150';
    };

    const formatUserType = (type) => {
      const types = {
        individual: 'Individual',
        company: 'Company',
        admin: 'Admin'
      };
      return types[type] || type;
    };

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    onMounted(() => {
      fetchUserDetails();
    });

    return {
      user,
      stats,
      loading,
      statsLoading,
      error,
      fetchUserDetails,
      goBack,
      getUserAvatar,
      formatUserType,
      formatDate
    };
  }
};
</script>

<style scoped>
.user-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  margin-bottom: 2rem;
  transition: all 0.3s;
}

.back-button:hover {
  background: #f8f9fa;
  border-color: #00aaff;
  color: #00aaff;
}

.loading-container,
.error-container {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.spinner {
  border: 3px solid #f3f3f3;
  border-top: 3px solid #00aaff;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

.spinner-small {
  border: 2px solid #f3f3f3;
  border-top: 2px solid #00aaff;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.retry-button {
  margin-top: 1rem;
  padding: 0.75rem 1.5rem;
  background: #00aaff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.3s;
}

.retry-button:hover {
  background: #0088cc;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 1.5rem;
}

.detail-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.detail-card h2 {
  font-size: 1.25rem;
  color: #333;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #00aaff;
}

.profile-card {
  grid-column: 1 / -1;
}

.profile-header {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  align-items: center;
}

.profile-avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #00aaff;
}

.profile-info h3 {
  font-size: 1.75rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.email {
  color: #666;
  font-size: 1.1rem;
  margin-bottom: 0.75rem;
}

.status-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.75rem;
}

.status-badge {
  padding: 0.35rem 0.85rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.status-badge.verified {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-badge.blocked {
  background: #ffebee;
  color: #c62828;
}

.status-badge.admin {
  background: #fff3e0;
  color: #f57c00;
}

.type-badge {
  display: inline-block;
  padding: 0.35rem 0.85rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 500;
}

.type-badge.type-individual {
  background: #e3f2fd;
  color: #1976d2;
}

.type-badge.type-company {
  background: #f3e5f5;
  color: #7b1fa2;
}

.type-badge.type-admin {
  background: #fff3e0;
  color: #e65100;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-weight: 600;
  color: #666;
  min-width: 150px;
}

.info-value {
  color: #333;
  text-align: right;
  flex: 1;
}

.link {
  color: #00aaff;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

.description-card {
  grid-column: 1 / -1;
}

.description {
  color: #666;
  line-height: 1.6;
  white-space: pre-wrap;
}

.statistics-card {
  grid-column: 1 / -1;
}

.stats-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem;
  color: #666;
  font-size: 0.9rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5rem;
}

.stat-item {
  text-align: center;
  padding: 1.5rem;
  background: linear-gradient(135deg, #00aaff 0%, #0088cc 100%);
  border-radius: 12px;
  color: white;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.9;
}

.flags-card {
  grid-column: 1 / -1;
}

.flag-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.flag-row:last-child {
  border-bottom: none;
}

.flag-label {
  font-weight: 600;
  color: #666;
}

.flag-indicator {
  padding: 0.35rem 0.85rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
}

.flag-indicator.active {
  background: #e8f5e9;
  color: #2e7d32;
}

.flag-indicator.inactive {
  background: #f5f5f5;
  color: #999;
}

.flag-indicator.blocked {
  background: #ffebee;
  color: #c62828;
}

@media (max-width: 768px) {
  .user-detail-container {
    padding: 1rem;
  }

  .details-grid {
    grid-template-columns: 1fr;
  }

  .profile-header {
    flex-direction: column;
    text-align: center;
  }

  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .info-label {
    min-width: auto;
  }

  .info-value {
    text-align: left;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
