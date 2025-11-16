<template>
  <div class="my-bookings-page">
    <div class="main-content">
      <!-- Page Header -->
      <div class="page-header">
        <h1 class="page-title">My Bookings</h1>
        <p class="page-subtitle">Manage your rental activities</p>
      </div>

      <!-- View Slider -->
      <div class="view-slider-container">
        <div class="view-slider">
          <div :class="['slider-track', activeView]"></div>
          <button
            :class="['slider-option', { active: activeView === 'rented' }]"
            @click="switchView('rented')"
          >
            <span class="slider-main-text">Rented</span>
            <span class="slider-sub-text">Equipment I'm renting from others</span>
          </button>
          <button
            :class="['slider-option', { active: activeView === 'lendout' }]"
            @click="switchView('lendout')"
          >
            <span class="slider-main-text">Lend Out</span>
            <span class="slider-sub-text">Equipment Others Rent from Me</span>
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Loading your bookings...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-container">
        <p>{{ error }}</p>
        <button @click="fetchData" class="retry-btn">Retry</button>
      </div>

      <!-- View Content -->
      <div v-else>
        <RentingView
          v-if="activeView === 'rented'"
          :stats="rentedStats"
          :bookings="rentedBookings"
          @view-details="viewBookingDetails"
          @review-equipment="reviewEquipment"
        />
        <LendingView
          v-if="activeView === 'lendout'"
          :stats="lendoutStats"
          :bookings="lendoutBookings"
          @view-details="viewBookingDetails"
          @accept-request="acceptBookingRequest"
          @decline-request="declineBookingRequest"
          @contact-renter="contactRenter"
          @cancel-booking="cancelBooking"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import axios from 'axios';
import RentingView from '../components/RentingView.vue';
import LendingView from '../components/LendingView.vue';

const router = useRouter();
const authStore = useAuthStore();

// State
const activeView = ref('rented');
const loading = ref(true);
const error = ref(null);

const rentedStats = ref({
  completedRentals: 0,
  activeRentals: 0,
  upcomingRentals: 0,
  averageRating: 0
});

const rentedBookings = ref({
  active: [],
  upcoming: [],
  history: []
});

const lendoutStats = ref({
  totalEarnings: '0.00',
  completedBookings: 0,
  activeBookings: 0,
  upcomingBookings: 0
});

const lendoutBookings = ref({
  active: [],
  upcoming: [],
  pending: [],
  history: []
});

// Methods
const switchView = (view) => {
  activeView.value = view;
  fetchData();
};

const fetchData = async () => {
  loading.value = true;
  error.value = null;

  try {
    const token = authStore.token;
    if (!token) {
      error.value = 'You must be logged in to view your bookings';
      router.push('/login');
      return;
    }

    if (activeView.value === 'rented') {
      await fetchRentedData(token);
    } else {
      await fetchLendoutData(token);
    }
  } catch (err) {
    console.error('Error fetching data:', err);
    error.value = err.response?.data?.message || 'Failed to fetch bookings. Please try again.';
  } finally {
    loading.value = false;
  }
};

const fetchRentedData = async (token) => {
  const response = await axios.get('http://localhost:5000/api/bookings/renting', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  rentedStats.value = response.data.stats || {
    completedRentals: 0,
    activeRentals: 0,
    upcomingRentals: 0,
    averageRating: 0
  };

  rentedBookings.value = response.data.bookings || {
    active: [],
    upcoming: [],
    history: []
  };
};

const fetchLendoutData = async (token) => {
  const response = await axios.get('http://localhost:5000/api/bookings/lending', {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  lendoutStats.value = response.data.stats || {
    totalEarnings: '0.00',
    completedBookings: 0,
    activeBookings: 0,
    upcomingBookings: 0
  };

  lendoutBookings.value = response.data.bookings || {
    active: [],
    upcoming: [],
    pending: [],
    history: []
  };
};

const viewBookingDetails = (bookingId) => {
  // TODO: Navigate to booking details page or open modal
  console.log('View booking details:', bookingId);
  alert('Booking details view coming soon!');
};

const reviewEquipment = (bookingId) => {
  // TODO: Open review modal
  console.log('Review equipment:', bookingId);
  alert('Review functionality coming soon!');
};

const acceptBookingRequest = async (bookingId) => {
  if (!confirm('Accept this booking request?')) return;

  try {
    const token = authStore.token;
    await axios.put(
      `http://localhost:5000/api/bookings/${bookingId}/status`,
      { status: 'confirmed' },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    alert('Booking request accepted!');
    fetchData();
  } catch (err) {
    console.error('Error accepting booking:', err);
    alert(err.response?.data?.message || 'Failed to accept booking.');
  }
};

const declineBookingRequest = async (bookingId) => {
  if (!confirm('Decline this booking request?')) return;

  try {
    const token = authStore.token;
    await axios.put(
      `http://localhost:5000/api/bookings/${bookingId}/status`,
      { status: 'cancelled' },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    alert('Booking request declined.');
    fetchData();
  } catch (err) {
    console.error('Error declining booking:', err);
    alert(err.response?.data?.message || 'Failed to decline booking.');
  }
};

const contactRenter = (renterId) => {
  if (renterId) {
    // Navigate to messages with this renter
    router.push('/messages');
  }
};

const cancelBooking = async (bookingId) => {
  if (!confirm('Cancel this booking? This action cannot be undone.')) return;

  try {
    const token = authStore.token;
    await axios.delete(
      `http://localhost:5000/api/bookings/${bookingId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    alert('Booking cancelled successfully');
    fetchData();
  } catch (err) {
    console.error('Error cancelling booking:', err);
    alert(err.response?.data?.message || 'Failed to cancel booking.');
  }
};

// Lifecycle
onMounted(() => {
  fetchData();
});
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.my-bookings-page {
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
  margin-bottom: 2rem;
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

/* View Slider */
.view-slider-container {
  display: flex;
  justify-content: center;
  margin-bottom: 3rem;
}

.view-slider {
  position: relative;
  display: inline-flex;
  background: white;
  border-radius: 50px;
  padding: 4px;
  box-shadow: 0 4px 20px rgba(0, 170, 255, 0.15);
  border: 2px solid #e3f2fd;
}

.slider-track {
  position: absolute;
  top: 4px;
  bottom: 4px;
  width: calc(50% - 4px);
  background: linear-gradient(135deg, #00AAFF 0%, #0088cc 100%);
  border-radius: 50px;
  transition: transform 0.3s ease;
  z-index: 0;
}

.slider-track.rented {
  transform: translateX(0);
}

.slider-track.lendout {
  transform: translateX(calc(100% + 8px));
}

.slider-option {
  position: relative;
  z-index: 1;
  padding: 0.625rem 2.5rem;
  background: transparent;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.15rem;
  min-width: 240px;
}

.slider-main-text {
  font-size: 1.05rem;
  font-weight: 700;
  color: #666;
  transition: color 0.3s ease;
  white-space: nowrap;
  line-height: 1.3;
}

.slider-sub-text {
  font-size: 0.7rem;
  font-weight: 500;
  color: #999;
  transition: color 0.3s ease;
  text-align: center;
  line-height: 1.1;
  max-width: 200px;
}

.slider-option.active .slider-main-text {
  color: white;
}

.slider-option.active .slider-sub-text {
  color: rgba(255, 255, 255, 0.85);
}

.slider-option:hover:not(.active) .slider-main-text {
  color: #00AAFF;
}

.slider-option:hover:not(.active) .slider-sub-text {
  color: #00AAFF;
}

/* Loading & Error States */
.loading-container,
.error-container {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 170, 255, 0.1);
  margin-top: 2rem;
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

/* Responsive Design */
@media (max-width: 768px) {
  .main-content {
    padding: 1.5rem 1rem;
  }

  .page-title {
    font-size: 2rem;
  }

  .view-slider {
    flex-direction: column;
    width: 100%;
    max-width: 400px;
  }

  .slider-track {
    width: calc(100% - 12px);
    height: calc(50% - 6px);
  }

  .slider-track.rented {
    transform: translateY(0);
  }

  .slider-track.lendout {
    transform: translateY(calc(100% + 12px));
  }

  .slider-option {
    padding: 0.875rem 1.5rem;
    min-width: unset;
    width: 100%;
  }

  .slider-main-text {
    font-size: 1rem;
  }

  .slider-sub-text {
    font-size: 0.7rem;
    max-width: 200px;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.75rem;
  }

  .slider-option {
    padding: 0.75rem 1rem;
  }

  .slider-main-text {
    font-size: 0.95rem;
  }

  .slider-sub-text {
    font-size: 0.65rem;
  }
}
</style>
