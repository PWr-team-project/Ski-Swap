<template>
  <div class="my-bookings-page">
    <div class="main-content">
      <!-- Page Header with Tabs -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">My Bookings</h1>
          <p class="page-subtitle">Manage your rental activities</p>
        </div>
        <div class="header-tabs">
          <button
            :class="['header-tab', 'renter-tab', { active: activeView === 'rented' }]"
            @click="switchView('rented')"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M20 12V22H4V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M22 7H2V12H22V7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 22V7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 7H16.5C17.163 7 17.7989 6.73661 18.2678 6.26777C18.7366 5.79893 19 5.16304 19 4.5C19 3.83696 18.7366 3.20107 18.2678 2.73223C17.7989 2.26339 17.163 2 16.5 2C13 2 12 7 12 7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 7H7.5C6.83696 7 6.20107 6.73661 5.73223 6.26777C5.26339 5.79893 5 5.16304 5 4.5C5 3.83696 5.26339 3.20107 5.73223 2.73223C6.20107 2.26339 6.83696 2 7.5 2C11 2 12 7 12 7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>As Renter</span>
          </button>
          <button
            :class="['header-tab', 'owner-tab', { active: activeView === 'lendout' }]"
            @click="switchView('lendout')"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>As Owner</span>
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
import { bookingService } from '@/services/bookingService';
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
  const response = await bookingService.getRentingBookings();

  rentedStats.value = response.stats || {
    completedRentals: 0,
    activeRentals: 0,
    upcomingRentals: 0,
    averageRating: 0
  };

  rentedBookings.value = response.bookings || {
    active: [],
    upcoming: [],
    history: []
  };
};

const fetchLendoutData = async (token) => {
  const response = await bookingService.getLendingBookings();

  lendoutStats.value = response.stats || {
    totalEarnings: '0.00',
    completedBookings: 0,
    activeBookings: 0,
    upcomingBookings: 0
  };

  lendoutBookings.value = response.bookings || {
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
    // Use the action endpoint which performs PENDING -> ACCEPTED transition
    await bookingService.acceptBooking(bookingId);

    alert('Booking request accepted!');
  } catch (err) {
    console.error('Error accepting booking:', err);
    alert(err.response?.data?.message || 'Failed to accept booking.');
  }
};

const declineBookingRequest = async (bookingId) => {
  if (!confirm('Decline this booking request?')) return;

  try {
    // Use the action endpoint which performs PENDING -> DECLINED transition
    await bookingService.declineBooking(bookingId);

    alert('Booking request declined.');
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
    await bookingService.cancel(bookingId);

    alert('Booking cancelled successfully');
  } catch (err) {
    console.error('Error cancelling booking:', err);
    alert(err.response?.data?.message || 'Failed to cancel booking.');
  }
};

const confirmHandoff = async (bookingId) => {
  if (!confirm('Confirm that you have handed off the equipment?')) return;

  try {
    // Transition to PICKUP_OWNER
    await bookingService.transitionStatus(bookingId, 'PICKUP_OWNER', 'Owner confirmed handoff');
    alert('Handoff confirmed!');
  } catch (err) {
    console.error('Error confirming handoff:', err);
  }
};

const confirmReturn = async (bookingId) => {
  if (!confirm('Confirm that the equipment has been returned?')) return;

  try {
    // Transition to RETURN_OWNER
    await bookingService.transitionStatus(bookingId, 'RETURN_OWNER', 'Owner confirmed return');
    alert('Return confirmed!');
  } catch (err) {
    console.error('Error confirming return:', err);
    alert(err.response?.data?.message || 'Failed to confirm return.');
  }
};

const verifyComplete = async (bookingId) => {
  if (!confirm('Confirm that the equipment is in good condition and complete the rental?')) return;

  try {
    await bookingService.verifyComplete(bookingId);
    alert('Rental completed successfully!');
  } catch (err) {
    console.error('Error verifying completion:', err);
  }
};

const openDispute = async (bookingId) => {
  const reason = prompt('Please describe the issue with the returned equipment:');
  if (!reason) return;

  try {
    await bookingService.openDispute(bookingId, reason);
    alert('Dispute opened. Support will contact you.');
  } catch (err) {
    console.error('Error opening dispute:', err);
};

const contactSupport = (bookingId) => {
  // Navigate to support page or show modal
  alert(`Please contact support at support@ski-swap.com referencing booking #${bookingId}`);
};

const viewReview = (bookingId) => {
  router.push(`/booking/${bookingId}`);
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
}

.header-left {
  text-align: left;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 0.25rem;
}

.page-subtitle {
  font-size: 1rem;
  color: #666;
  font-weight: 400;
}

/* Header Tabs */
.header-tabs {
  display: flex;
  gap: 0.5rem;
}

.header-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: white;
  border: 2px solid #e3f2fd;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  font-weight: 600;
  color: #666;
}

.header-tab:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.header-tab svg {
  flex-shrink: 0;
}

/* Renter Tab Styles */
.renter-tab {
  color: #666;
}

.renter-tab:hover {
  border-color: #00AAFF;
  color: #00AAFF;
}

.renter-tab.active {
  background: #00AAFF;
  border-color: #00AAFF;
  color: white;
}

/* Owner Tab Styles */
.owner-tab {
  color: #666;
}

.owner-tab:hover {
  border-color: #F5A623;
  color: #F5A623;
}

.owner-tab.active {
  background: #F5A623;
  border-color: #F5A623;
  color: white;
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

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-left {
    text-align: center;
    width: 100%;
  }

  .header-tabs {
    width: 100%;
    justify-content: center;
  }

  .page-title {
    font-size: 2rem;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.75rem;
  }

  .header-tab {
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
  }

  .header-tab svg {
    width: 16px;
    height: 16px;
  }
}
</style>
