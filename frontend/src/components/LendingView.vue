<template>
  <div class="lending-view">
    <!-- Dashboard Stats Section -->
    <div class="stats-section">
      <div class="stat-card">
        <div class="stat-icon pending-requests">
          <img src="/assets/icons/bookings/pending.svg" alt="Pending" />
        </div>
        <div class="stat-content">
          <p class="stat-value">{{ stats.pendingRequests || 0 }}</p>
          <p class="stat-label">Pending Requests</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon ongoing">
          <img src="/assets/icons/bookings/ongoing.svg" alt="Ongoing" />
        </div>
        <div class="stat-content">
          <p class="stat-value">{{ stats.activeBookings || 0 }}</p>
          <p class="stat-label">Ongoing Bookings</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon upcoming">
          <img src="/assets/icons/bookings/upcoming.svg" alt="Upcoming" />
        </div>
        <div class="stat-content">
          <p class="stat-value">{{ stats.upcomingBookings || 0 }}</p>
          <p class="stat-label">Upcoming Bookings</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon completed">
          <img src="/assets/icons/bookings/completed.svg" alt="Completed" />
        </div>
        <div class="stat-content">
          <p class="stat-value">{{ stats.completedBookings || 0 }}</p>
          <p class="stat-label">Completed</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon earnings">
          <img src="/assets/icons/bookings/euro.svg" alt="Earnings" />
        </div>
        <div class="stat-content">
          <p class="stat-value">{{ stats.totalEarnings || '0.00' }}</p>
          <p class="stat-label">Total Earned</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon rating">
          <img src="/assets/icons/bookings/star.svg" alt="Rating" />
        </div>
        <div class="stat-content">
          <p class="stat-value">{{ formatRating(stats.averageRating) }}</p>
          <p class="stat-label">Avg Rating</p>
        </div>
      </div>
    </div>

    <!-- Bookings Requires Attention Section (Orange) -->
    <div class="collapsible-section attention-section">
      <button
        class="section-header attention-header"
        @click="toggleSection('attention')"
        :class="{ expanded: expandedSections.attention }"
      >
        <div class="section-header-left">
          <img src="/assets/icons/chevron_right.svg" alt="" class="chevron-icon" />
          <h2 class="section-title">Bookings which require attention</h2>
          <span class="section-count attention-count">{{ attentionBookings.length }}</span>
        </div>
      </button>
      <div v-show="expandedSections.attention" class="section-content">
        <div v-if="attentionBookings.length > 0" class="booking-list">
          <BookingCard
            v-for="booking in attentionBookings"
            :key="booking._id"
            :booking-id="booking._id"
            :listing="booking.listing_id"
            :renter="booking.renter_id"
            :start-date="booking.start_date"
            :end-date="booking.end_date"
            :total-price="booking.total_price"
            :location="booking.listing_id?.location_id"
            :status="booking.status"
            @view-listing="viewListing"
            @view-details="viewDetails"
            @accept="acceptRequest"
            @decline="declineRequest"
          />
        </div>
        <div v-else class="empty-section">
          <p>No bookings require attention</p>
        </div>
      </div>
    </div>

    <!-- Active & Upcoming Section -->
    <div class="collapsible-section">
      <button
        class="section-header"
        @click="toggleSection('activeUpcoming')"
        :class="{ expanded: expandedSections.activeUpcoming }"
      >
        <div class="section-header-left">
          <img src="/assets/icons/chevron_right.svg" alt="" class="chevron-icon" />
          <h2 class="section-title">Active & Upcoming</h2>
          <span class="section-count">{{ activeUpcomingBookings.length }}</span>
        </div>
      </button>
      <div v-show="expandedSections.activeUpcoming" class="section-content">
        <div v-if="activeUpcomingBookings.length > 0" class="booking-list">
          <BookingCard
            v-for="booking in activeUpcomingBookings"
            :key="booking._id"
            :booking-id="booking._id"
            :listing="booking.listing_id"
            :renter="booking.renter_id"
            :start-date="booking.start_date"
            :end-date="booking.end_date"
            :total-price="booking.total_price"
            :days-remaining="booking.daysRemaining"
            :location="booking.listing_id?.location_id"
            :status="booking.status"
            @view-listing="viewListing"
            @view-details="viewDetails"
            @contact="contactRenter"
          />
        </div>
        <div v-else class="empty-section">
          <p>No active or upcoming bookings</p>
        </div>
      </div>
    </div>

    <!-- Booking History Section -->
    <div class="collapsible-section">
      <button
        class="section-header"
        @click="toggleSection('history')"
        :class="{ expanded: expandedSections.history }"
      >
        <div class="section-header-left">
          <img src="/assets/icons/chevron_right.svg" alt="" class="chevron-icon" />
          <h2 class="section-title">Booking History</h2>
          <span class="section-count">{{ historyBookings.length }}</span>
        </div>
      </button>
      <div v-show="expandedSections.history" class="section-content">
        <div v-if="historyBookings.length > 0" class="booking-list">
          <BookingCard
            v-for="booking in historyBookings"
            :key="booking._id"
            :booking-id="booking._id"
            :listing="booking.listing_id"
            :renter="booking.renter_id"
            :start-date="booking.start_date"
            :end-date="booking.end_date"
            :total-price="booking.total_price"
            :location="booking.listing_id?.location_id"
            :status="booking.status"
            @view-listing="viewListing"
            @view-details="viewDetails"
          />
        </div>
        <div v-else class="empty-section">
          <p>No booking history</p>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="totalBookings === 0" class="empty-state">
      <div class="empty-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#1a5f8a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h3 class="empty-title">No Bookings Yet</h3>
      <p class="empty-text">No one has booked your equipment yet. Make sure your listings are active and attractively priced!</p>
      <button @click="viewMyListings" class="btn-browse">View My Listings</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
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
      upcomingBookings: 0,
      pendingRequests: 0,
      averageRating: 0
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

// Track which sections are expanded
const expandedSections = ref({
  attention: false,
  activeUpcoming: false,
  history: false
});

// Compute bookings for "Requires Attention" section
// States: PENDING, PICKUP, RETURN, VERIFY
const attentionBookings = computed(() => {
  const attentionStatuses = ['PENDING', 'PICKUP', 'RETURN', 'VERIFY'];
  const allBookings = [
    ...props.bookings.pending,
    ...props.bookings.active,
    ...props.bookings.upcoming
  ];

  return allBookings.filter(booking =>
    attentionStatuses.includes(booking.status)
  ).sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
});

// Compute bookings for "Active & Upcoming" section
// States: ACCEPTED, IN_PROGRESS (sorted by closest start/end date, exclude passed dates)
const activeUpcomingBookings = computed(() => {
  const activeStatuses = ['ACCEPTED', 'IN_PROGRESS'];
  const now = new Date();

  const allBookings = [
    ...props.bookings.active,
    ...props.bookings.upcoming
  ];

  return allBookings.filter(booking => {
    const isActiveStatus = activeStatuses.includes(booking.status);
    const endDate = new Date(booking.end_date);
    const isNotPassed = endDate >= now;
    return isActiveStatus && isNotPassed;
  }).sort((a, b) => {
    // Sort by closest date (start_date for upcoming, end_date for active)
    const aDate = a.status === 'IN_PROGRESS' ? new Date(a.end_date) : new Date(a.start_date);
    const bDate = b.status === 'IN_PROGRESS' ? new Date(b.end_date) : new Date(b.start_date);
    return aDate - bDate;
  });
});

// Compute bookings for "History" section
// States: COMPLETED, REVIEWED, CANCELLED, DECLINED, DISPUTED, DISPUTE_RESOLVED
const historyBookings = computed(() => {
  const historyStatuses = ['COMPLETED', 'REVIEWED', 'CANCELLED', 'DECLINED', 'DISPUTED', 'DISPUTE_RESOLVED'];

  return props.bookings.history.filter(booking =>
    historyStatuses.includes(booking.status)
  ).sort((a, b) => new Date(b.end_date) - new Date(a.end_date));
});

// Total bookings count
const totalBookings = computed(() => {
  return attentionBookings.value.length +
         activeUpcomingBookings.value.length +
         historyBookings.value.length;
});

// Determine which section to expand by default
const initializeExpandedSections = () => {
  // Priority: Attention > Active & Upcoming > History
  if (attentionBookings.value.length > 0) {
    expandedSections.value.attention = true;
  } else if (activeUpcomingBookings.value.length > 0) {
    expandedSections.value.activeUpcoming = true;
  } else if (historyBookings.value.length > 0) {
    expandedSections.value.history = true;
  }
};

// Watch for bookings changes to reinitialize
watch(() => props.bookings, () => {
  // Reset all sections
  expandedSections.value = {
    attention: false,
    activeUpcoming: false,
    history: false
  };
  initializeExpandedSections();
}, { deep: true });

onMounted(() => {
  initializeExpandedSections();
});

const toggleSection = (section) => {
  expandedSections.value[section] = !expandedSections.value[section];
};

const formatRating = (rating) => {
  if (!rating || rating === 0) return 'N/A';
  return parseFloat(rating).toFixed(1);
};

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
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.875rem;
  box-shadow: 0 4px 20px rgba(0, 170, 255, 0.1);
  border: 1px solid #e3f2fd;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 25px rgba(0, 170, 255, 0.15);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon.pending-requests {
  background: linear-gradient(135deg, #F5A623 0%, #e69500 100%);
  color: white;
}

.stat-icon.ongoing {
  background: linear-gradient(135deg, #00AAFF 0%, #0088cc 100%);
  color: white;
}

.stat-icon.upcoming {
  background: linear-gradient(135deg, #9370DB 0%, #7B68EE 100%);
  color: white;
}

.stat-icon.completed {
  background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
  color: white;
}

.stat-icon.earnings {
  background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
  color: white;
}

.stat-icon.rating {
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: white;
}

.stat-icon img {
  width: 24px;
  height: 24px;
  filter: brightness(0) invert(1);
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 0.125rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.stat-label {
  font-size: 0.75rem;
  color: #666;
  margin: 0;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Collapsible Section */
.collapsible-section {
  background: white;
  border-radius: 16px;
  margin-bottom: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid #e3f2fd;
  overflow: hidden;
}

/* Attention Section (Orange) */
.attention-section {
  background: #ffe0b2;
  border: 2px solid #e69500;
}

.section-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.section-header:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.section-header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.chevron-icon {
  width: 24px;
  height: 24px;
  transition: transform 0.3s ease;
  flex-shrink: 0;
  opacity: 0.6;
}

.section-header.expanded .chevron-icon {
  transform: rotate(90deg);
}

.section-title {
  font-size: 1.4rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.section-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 10px;
  background: #00AAFF;
  color: white;
  border-radius: 16px;
  font-size: 1rem;
  font-weight: 600;
}

.attention-count {
  background: #ff4757;
}

.section-content {
  padding: 0 1.5rem 1.5rem;
}

/* Empty Section */
.empty-section {
  text-align: center;
  padding: 2rem 1rem;
  color: #999;
  font-size: 0.95rem;
}

.empty-section p {
  margin: 0;
}

/* Booking List */
.booking-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 20px;
  border: 2px dashed #1a5f8a;
}

.empty-icon {
  margin-bottom: 1rem;
  color: #1a5f8a;
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #0d3b5c;
  margin: 0 0 0.5rem 0;
}

.empty-text {
  font-size: 1rem;
  color: #666;
  margin: 0 0 1.5rem 0;
}

.btn-browse {
  padding: 0.875rem 2rem;
  background: linear-gradient(135deg, #0d3b5c 0%, #1a5f8a 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-browse:hover {
  background: linear-gradient(135deg, #1a5f8a 0%, #2980b9 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(13, 59, 92, 0.3);
}

/* Responsive Design */
@media (max-width: 768px) {
  .stats-section {
    grid-template-columns: repeat(2, 1fr);
  }

  .section-header {
    padding: 1rem 1.25rem;
  }

  .section-content {
    padding: 0 1.25rem 1.25rem;
  }

  .section-title {
    font-size: 1.2rem;
  }

  .section-count {
    min-width: 28px;
    height: 28px;
    font-size: 0.9rem;
  }
}

@media (max-width: 480px) {
  .stats-section {
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .stat-card {
    padding: 1rem;
  }

  .stat-icon {
    width: 40px;
    height: 40px;
  }

  .stat-value {
    font-size: 1.25rem;
  }

  .stat-label {
    font-size: 0.65rem;
  }

  .section-title {
    font-size: 1.1rem;
  }

  .section-count {
    min-width: 26px;
    height: 26px;
    font-size: 0.85rem;
  }

  .chevron-icon {
    width: 20px;
    height: 20px;
  }
}
</style>
