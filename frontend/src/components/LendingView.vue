<template>
  <div class="lending-view">
    <!-- Dashboard Stats Section -->
    <div class="stats-section">
      <div class="stat-card">
        <div class="stat-icon earnings">💰</div>
        <div class="stat-content">
          <p class="stat-value">${{ stats.totalEarnings }}</p>
          <p class="stat-label">Total Earnings</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon completed">✓</div>
        <div class="stat-content">
          <p class="stat-value">{{ stats.completedBookings }}</p>
          <p class="stat-label">Completed Bookings</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon active">⚡</div>
        <div class="stat-content">
          <p class="stat-value">{{ stats.activeBookings }}</p>
          <p class="stat-label">Active Bookings</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon upcoming">📅</div>
        <div class="stat-content">
          <p class="stat-value">{{ stats.upcomingBookings }}</p>
          <p class="stat-label">Upcoming Bookings</p>
        </div>
      </div>
    </div>

    <!-- Pending Requests Section -->
    <div v-if="bookings.pending.length > 0" class="section priority">
      <div class="section-header">
        <h2 class="section-title">Pending Requests</h2>
        <span class="badge pending-badge">{{ bookings.pending.length }}</span>
      </div>
      <p class="section-subtitle">New booking requests awaiting your response</p>
      <div class="booking-list">
        <BookingCard
          v-for="booking in bookings.pending"
          :key="booking._id"
          :booking-id="booking._id"
          :listing="booking.listing_id"
          :renter="booking.renter_id"
          :start-date="booking.start_date"
          :end-date="booking.end_date"
          :total-price="booking.total_price"
          :location="booking.listing_id?.location_id"
          status="pending"
          @view-listing="viewListing"
          @view-details="viewDetails"
          @accept="acceptRequest"
          @decline="declineRequest"
        />
      </div>
    </div>

    <!-- Active Bookings Section -->
    <div v-if="bookings.active.length > 0" class="section">
      <h2 class="section-title">Active Bookings</h2>
      <p class="section-subtitle">Equipment currently rented out</p>
      <div class="booking-list">
        <BookingCard
          v-for="booking in bookings.active"
          :key="booking._id"
          :booking-id="booking._id"
          :listing="booking.listing_id"
          :renter="booking.renter_id"
          :start-date="booking.start_date"
          :end-date="booking.end_date"
          :total-price="booking.total_price"
          :days-remaining="booking.daysRemaining"
          :location="booking.listing_id?.location_id"
          status="active"
          @view-listing="viewListing"
          @view-details="viewDetails"
        />
      </div>
    </div>

    <!-- Upcoming Bookings Section -->
    <div v-if="bookings.upcoming.length > 0" class="section">
      <h2 class="section-title">Upcoming Bookings</h2>
      <p class="section-subtitle">Confirmed bookings awaiting pickup</p>
      <div class="booking-list">
        <BookingCard
          v-for="booking in bookings.upcoming"
          :key="booking._id"
          :booking-id="booking._id"
          :listing="booking.listing_id"
          :renter="booking.renter_id"
          :start-date="booking.start_date"
          :end-date="booking.end_date"
          :total-price="booking.total_price"
          :location="booking.listing_id?.location_id"
          status="upcoming"
          @view-listing="viewListing"
          @view-details="viewDetails"
          @contact="contactRenter"
        />
      </div>
    </div>

    <!-- Booking History Section -->
    <div v-if="bookings.history.length > 0" class="section">
      <h2 class="section-title">Booking History</h2>
      <p class="section-subtitle">Your completed bookings</p>
      <div class="booking-list">
        <BookingCard
          v-for="booking in bookings.history"
          :key="booking._id"
          :booking-id="booking._id"
          :listing="booking.listing_id"
          :renter="booking.renter_id"
          :start-date="booking.start_date"
          :end-date="booking.end_date"
          :total-price="booking.total_price"
          :location="booking.listing_id?.location_id"
          status="history"
          @view-listing="viewListing"
          @view-details="viewDetails"
        />
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="bookings.active.length === 0 && bookings.upcoming.length === 0 && bookings.pending.length === 0 && bookings.history.length === 0" class="empty-state">
      <div class="empty-icon">🏂</div>
      <h3 class="empty-title">No Bookings Yet</h3>
      <p class="empty-text">No one has booked your equipment yet. Make sure your listings are active and attractively priced!</p>
      <button @click="viewMyListings" class="btn-browse">View My Listings</button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import BookingCard from './BookingCard.vue';

const router = useRouter();

const props = defineProps({
  stats: {
    type: Object,
    required: true,
    default: () => ({
      totalEarnings: '0.00',
      completedBookings: 0,
      activeBookings: 0,
      upcomingBookings: 0
    })
  },
  bookings: {
    type: Object,
    required: true,
    default: () => ({
      active: [],
      upcoming: [],
      pending: [],
      history: []
    })
  }
});

const emit = defineEmits(['view-details', 'accept-request', 'decline-request', 'contact-renter']);

const viewListing = (listingId) => {
  if (listingId) {
    router.push(`/listing/${listingId}`);
  }
};

const viewDetails = (bookingId) => {
  emit('view-details', bookingId);
};

const acceptRequest = (bookingId) => {
  emit('accept-request', bookingId);
};

const declineRequest = (bookingId) => {
  emit('decline-request', bookingId);
};

const contactRenter = (renterId) => {
  emit('contact-renter', renterId);
};

const viewMyListings = () => {
  router.push('/my-listings');
};
</script>

<style scoped>
.lending-view {
  width: 100%;
}

/* Stats Section */
.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 4px 20px rgba(0, 170, 255, 0.1);
  border: 1px solid rgba(0, 170, 255, 0.1);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(0, 170, 255, 0.15);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  flex-shrink: 0;
}

.stat-icon.earnings {
  background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
  color: white;
}

.stat-icon.completed {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
}

.stat-icon.active {
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  color: white;
}

.stat-icon.upcoming {
  background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
  color: white;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 0.25rem 0;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  margin: 0;
  font-weight: 500;
}

/* Section */
.section {
  margin-bottom: 3rem;
}

.section.priority {
  background: linear-gradient(135deg, #fff8e1 0%, #fff3e0 100%);
  padding: 2rem;
  border-radius: 20px;
  border: 2px solid #ffa500;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.section-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 700;
}

.pending-badge {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  color: white;
}

.section-subtitle {
  font-size: 1rem;
  color: #666;
  margin: 0 0 1.5rem 0;
}

/* Booking List */
.booking-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 20px;
  border: 2px dashed #e3f2fd;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 0.5rem 0;
}

.empty-text {
  font-size: 1rem;
  color: #666;
  margin: 0 0 1.5rem 0;
}

.btn-browse {
  padding: 0.875rem 2rem;
  background: #00AAFF;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-browse:hover {
  background: #0088cc;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 170, 255, 0.3);
}

/* Responsive Design */
@media (max-width: 768px) {
  .stats-section {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .stats-section {
    grid-template-columns: 1fr;
  }

  .stat-value {
    font-size: 1.5rem;
  }

  .section-title {
    font-size: 1.5rem;
  }
}
</style>
