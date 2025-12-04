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

    <!-- Bookings Requires Attention Section (Orange) - Always visible -->
    <div class="collapsible-section attention-section">
      <button
        class="section-header attention-header"
        @click="toggleSection('attention')"
        :class="{ expanded: expandedSections.attention }"
      >
        <div class="section-header-left">
          <img src="/assets/icons/chevron_right.svg" alt="" class="chevron-icon" />
          <h2 class="section-title">Bookings which require attention</h2>
          <span class="section-count attention-count">{{ attentionBookingsRaw.length }}</span>
        </div>
        <!-- Status Badge Filters -->
        <div v-if="availableAttentionBadges.length > 1 && expandedSections.attention" class="status-filters" @click.stop>
          <button
            v-for="badgeName in availableAttentionBadges"
            :key="badgeName"
            @click="toggleBadgeFilter('attention', badgeName)"
            :class="['filter-badge', getBadgeClassForName(badgeName), { active: isBadgeActive('attention', badgeName) }]"
          >
            {{ badgeName }}
          </button>
        </div>
      </button>
      <div v-show="expandedSections.attention" class="section-content">
        <div v-if="attentionBookings.length > 0" class="booking-list">
          <BookingCard
            v-for="booking in attentionBookings"
            :key="`${booking._id}-${booking.status}`"
            :booking-id="booking._id"
            :listing="booking.listing_id"
            :renter="booking.renter_id"
            :start-date="booking.start_date"
            :end-date="booking.end_date"
            :total-price="booking.total_price"
            :location="booking.listing_id?.location_id"
            :booking-status="booking.status"
            :payment-confirmed="booking.payment_confirmed"
            :insurance-flag="booking.insurance_flag"
            @view-details="viewDetails"
            @action="handleBookingAction"
          />
        </div>
        <div v-else class="empty-section">
          <p>No bookings require attention</p>
        </div>
      </div>
    </div>

    <!-- Active & Upcoming Section -->
    <div v-if="activeUpcomingBookingsRaw.length > 0" class="collapsible-section">
      <button
        class="section-header"
        @click="toggleSection('activeUpcoming')"
        :class="{ expanded: expandedSections.activeUpcoming }"
      >
        <div class="section-header-left">
          <img src="/assets/icons/chevron_right.svg" alt="" class="chevron-icon" />
          <h2 class="section-title">Active & Upcoming</h2>
          <span class="section-count">{{ activeUpcomingBookingsRaw.length }}</span>
        </div>
        <!-- Status Badge Filters -->
        <div v-if="availableActiveUpcomingBadges.length > 1 && expandedSections.activeUpcoming" class="status-filters" @click.stop>
          <button
            v-for="badgeName in availableActiveUpcomingBadges"
            :key="badgeName"
            @click="toggleBadgeFilter('activeUpcoming', badgeName)"
            :class="['filter-badge', getBadgeClassForName(badgeName), { active: isBadgeActive('activeUpcoming', badgeName) }]"
          >
            {{ badgeName }}
          </button>
        </div>
      </button>
      <div v-show="expandedSections.activeUpcoming" class="section-content">
        <div v-if="activeUpcomingBookings.length > 0" class="booking-list">
          <BookingCard
            v-for="booking in activeUpcomingBookings"
            :key="`${booking._id}-${booking.status}`"
            :booking-id="booking._id"
            :listing="booking.listing_id"
            :renter="booking.renter_id"
            :start-date="booking.start_date"
            :end-date="booking.end_date"
            :total-price="booking.total_price"
            :days-remaining="booking.daysRemaining"
            :location="booking.listing_id?.location_id"
            :booking-status="booking.status"
            :payment-confirmed="booking.payment_confirmed"
            :insurance-flag="booking.insurance_flag"
            @view-details="viewDetails"
            @action="handleBookingAction"
          />
        </div>
        <div v-else class="empty-section">
          <p>No active or upcoming bookings</p>
        </div>
      </div>
    </div>

    <!-- Booking History Section -->
    <div v-if="historyBookingsRaw.length > 0" class="collapsible-section">
      <button
        class="section-header"
        @click="toggleSection('history')"
        :class="{ expanded: expandedSections.history }"
      >
        <div class="section-header-left">
          <img src="/assets/icons/chevron_right.svg" alt="" class="chevron-icon" />
          <h2 class="section-title">Booking History</h2>
          <span class="section-count">{{ historyBookingsRaw.length }}</span>
        </div>
        <!-- Status Badge Filters -->
        <div v-if="availableHistoryBadges.length > 1 && expandedSections.history" class="status-filters" @click.stop>
          <button
            v-for="badgeName in availableHistoryBadges"
            :key="badgeName"
            @click="toggleBadgeFilter('history', badgeName)"
            :class="['filter-badge', getBadgeClassForName(badgeName), { active: isBadgeActive('history', badgeName) }]"
          >
            {{ badgeName }}
          </button>
        </div>
      </button>
      <div v-show="expandedSections.history" class="section-content">
        <div v-if="historyBookings.length > 0" class="booking-list">
          <BookingCard
            v-for="booking in historyBookings"
            :key="`${booking._id}-${booking.status}`"
            :booking-id="booking._id"
            :listing="booking.listing_id"
            :renter="booking.renter_id"
            :start-date="booking.start_date"
            :end-date="booking.end_date"
            :total-price="booking.total_price"
            :location="booking.listing_id?.location_id"
            :has-review="booking.status === 'REVIEWED'"
            :booking-status="booking.status"
            :payment-confirmed="booking.payment_confirmed"
            :insurance-flag="booking.insurance_flag"
            :is-owner-view="true"
            @view-details="viewDetails"
            @action="handleBookingAction"
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

const emit = defineEmits([
  'view-details',
  'accept-request',
  'decline-request',
  'contact-renter',
  'cancel-booking',
  'confirm-handoff',
  'confirm-return',
  'verify-complete',
  'open-dispute',
  'contact-support',
  'view-review'
]);

// Track which sections are expanded
const expandedSections = ref({
  attention: false,
  activeUpcoming: false,
  history: false
});

// Status filters for each section
const statusFilters = ref({
  attention: [],
  activeUpcoming: [],
  history: []
});

// Compute bookings for "Requires Attention" section (with filtering)
// States: PENDING, PICKUP, PICKUP_OWNER, PICKUP_RENTER, RETURN, RETURN_OWNER, RETURN_RENTER
const attentionBookingsRaw = computed(() => {
  const attentionStatuses = ['PENDING', 'PICKUP', 'PICKUP_RENTER', 'RETURN', 'RETURN_OWNER', 'RETURN_RENTER'];
  const allBookings = [
    ...props.bookings.pending,
    ...props.bookings.active,
    ...props.bookings.upcoming
  ];

  return allBookings.filter(booking =>
    attentionStatuses.includes(booking.status)
  ).sort((a, b) => new Date(a.start_date) - new Date(b.start_date));
});

const attentionBookings = computed(() => {
  let bookings = attentionBookingsRaw.value;

  // Apply status filter if any selected
  if (statusFilters.value.attention.length > 0) {
    bookings = bookings.filter(b => statusFilters.value.attention.includes(b.status));
  }

  return bookings;
});

// Compute bookings for "Active & Upcoming" section (with filtering)
// States: ACCEPTED, IN_PROGRESS (sorted by closest start/end date, exclude passed dates)
const activeUpcomingBookingsRaw = computed(() => {
  const activeStatuses = ['ACCEPTED', 'IN_PROGRESS', 'PICKUP_OWNER'];
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

const activeUpcomingBookings = computed(() => {
  let bookings = activeUpcomingBookingsRaw.value;

  // Apply status filter if any selected
  if (statusFilters.value.activeUpcoming.length > 0) {
    bookings = bookings.filter(b => statusFilters.value.activeUpcoming.includes(b.status));
  }

  return bookings;
});

// Compute bookings for "History" section (with filtering)
// States: COMPLETED, REVIEWED, CANCELLED, DECLINED, DISPUTED, DISPUTE_RESOLVED
const historyBookingsRaw = computed(() => {
  const historyStatuses = ['COMPLETED', 'REVIEWED', 'CANCELLED', 'DECLINED', 'DISPUTED', 'DISPUTE_RESOLVED'];

  return props.bookings.history.filter(booking =>
    historyStatuses.includes(booking.status)
  ).sort((a, b) => new Date(b.end_date) - new Date(a.end_date));
});

const historyBookings = computed(() => {
  let bookings = historyBookingsRaw.value;

  // Apply status filter if any selected
  if (statusFilters.value.history.length > 0) {
    bookings = bookings.filter(b => statusFilters.value.history.includes(b.status));
  }

  return bookings;
});

// Total bookings count
const totalBookings = computed(() => {
  return attentionBookingsRaw.value.length +
         activeUpcomingBookingsRaw.value.length +
         historyBookingsRaw.value.length;
});

// Get available unique badge names for each section (for badge filtering)
const availableAttentionBadges = computed(() => {
  const badgeNames = new Set(attentionBookingsRaw.value.map(b => getStatusBadgeName(b.status)));
  return Array.from(badgeNames);
});

const availableActiveUpcomingBadges = computed(() => {
  const badgeNames = new Set(activeUpcomingBookingsRaw.value.map(b => getStatusBadgeName(b.status)));
  return Array.from(badgeNames);
});

const availableHistoryBadges = computed(() => {
  const badgeNames = new Set(historyBookingsRaw.value.map(b => getStatusBadgeName(b.status)));
  return Array.from(badgeNames);
});

// Get statuses for a badge name
const getStatusesForBadge = (badgeName) => {
  const labels = {
    'PENDING': 'Pending',
    'ACCEPTED': 'Accepted',
    'PICKUP': 'Pickup',
    'PICKUP_OWNER': 'Active',
    'PICKUP_RENTER': 'Pickup',
    'IN_PROGRESS': 'Active',
    'RETURN': 'Return',
    'RETURN_RENTER': 'Return',
    'RETURN_OWNER': 'Return',
    'COMPLETED': 'Completed',
    'REVIEWED': 'Reviewed',
    'CANCELLED': 'Cancelled',
    'DECLINED': 'Declined',
    'DISPUTED': 'Disputed',
    'DISPUTE_RESOLVED': 'Resolved'
  };

  return Object.keys(labels).filter(status => labels[status] === badgeName);
};

// Toggle badge filter (filters by badge name, which maps to multiple statuses)
const toggleBadgeFilter = (section, badgeName) => {
  const statuses = getStatusesForBadge(badgeName);

  // Check if any of these statuses are currently filtered
  const hasAny = statuses.some(status => statusFilters.value[section].includes(status));

  if (hasAny) {
    // Remove all statuses for this badge
    statusFilters.value[section] = statusFilters.value[section].filter(
      status => !statuses.includes(status)
    );
  } else {
    // Add all statuses for this badge
    statuses.forEach(status => {
      if (!statusFilters.value[section].includes(status)) {
        statusFilters.value[section].push(status);
      }
    });
  }
};

// Check if a badge is currently active (any of its statuses are in the filter)
const isBadgeActive = (section, badgeName) => {
  const statuses = getStatusesForBadge(badgeName);
  return statuses.some(status => statusFilters.value[section].includes(status));
};

// Get badge class for a badge name
const getBadgeClassForName = (badgeName) => {
  // Map badge names to their color classes
  if (['Cancelled', 'Declined', 'Disputed'].includes(badgeName)) return 'badge-error';
  if (['Completed', 'Resolved'].includes(badgeName)) return 'badge-completed';
  if (['Active', 'Pickup', 'Return'].includes(badgeName)) return 'badge-active';
  if (['Pending'].includes(badgeName)) return 'badge-pending';
  if (['Accepted'].includes(badgeName)) return 'badge-upcoming';
  if (['Reviewed'].includes(badgeName)) return 'badge-reviewed';
  return 'badge-default';
};

// Get badge display name
const getStatusBadgeName = (status) => {
  const labels = {
    'PENDING': 'Pending',
    'ACCEPTED': 'Accepted',
    'PICKUP': 'Pickup',
    'PICKUP_OWNER': 'Active',
    'PICKUP_RENTER': 'Pickup',
    'IN_PROGRESS': 'Active',
    'RETURN': 'Return',
    'RETURN_RENTER': 'Return',
    'RETURN_OWNER': 'Return',
    'COMPLETED': 'Completed',
    'REVIEWED': 'Reviewed',
    'CANCELLED': 'Cancelled',
    'DECLINED': 'Declined',
    'DISPUTED': 'Disputed',
    'DISPUTE_RESOLVED': 'Resolved'
  };
  return labels[status] || status;
};

// Get badge color class
const getStatusBadgeClass = (status) => {
  if (['CANCELLED', 'DECLINED', 'DISPUTED'].includes(status)) return 'badge-error';
  if (['COMPLETED', 'DISPUTE_RESOLVED'].includes(status)) return 'badge-completed';
  if (['IN_PROGRESS', 'PICKUP', 'PICKUP_OWNER', 'PICKUP_RENTER', 'RETURN', 'RETURN_OWNER', 'RETURN_RENTER'].includes(status)) return 'badge-active';
  if (['PENDING'].includes(status)) return 'badge-pending';
  if (['ACCEPTED'].includes(status)) return 'badge-upcoming';
  if (['REVIEWED'].includes(status)) return 'badge-reviewed';
  return 'badge-default';
};

// Determine which section to expand by default
const initializeExpandedSections = () => {
  // Priority: Attention > Active & Upcoming > History
  if (attentionBookingsRaw.value.length > 0) {
    expandedSections.value.attention = true;
  } else if (activeUpcomingBookingsRaw.value.length > 0) {
    expandedSections.value.activeUpcoming = true;
  } else if (historyBookingsRaw.value.length > 0) {
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

const viewDetails = (bookingId) => {
  emit('view-details', bookingId);
};

const handleBookingAction = ({ action, bookingId }) => {
  switch (action) {
    case 'accept':
      emit('accept-request', bookingId);
      break;
    case 'decline':
      emit('decline-request', bookingId);
      break;
    case 'cancel':
      emit('cancel-booking', bookingId);
      break;
    case 'confirm-handoff':
      emit('confirm-handoff', bookingId);
      break;
    case 'confirm-return':
      emit('confirm-return', bookingId);
      break;
    case 'everything-ok':
      emit('verify-complete', bookingId);
      break;
    case 'something-wrong':
      emit('open-dispute', bookingId);
      break;
    case 'contact-support':
      emit('contact-support', bookingId);
      break;
    case 'show-review':
      emit('view-review', bookingId);
      break;
    default:
      console.warn('Unknown action:', action);
  }
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

/* Status Filters */
.status-filters {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-left: auto;
  padding-left: 1rem;
}

.filter-badge {
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border: 2px solid #e5e7eb;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-badge:hover {
  background: #e5e7eb;
  border-color: #d1d5db;
}

/* Active badge colors matching RentalCard/BookingCard */
.filter-badge.badge-pending.active {
  background: #fbbf24;
  border-color: #fbbf24;
  color: white;
}

.filter-badge.badge-upcoming.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.filter-badge.badge-active.active {
  background: #f97316;
  border-color: #f97316;
  color: white;
}

.filter-badge.badge-completed.active {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

.filter-badge.badge-error.active {
  background: #ef4444;
  border-color: #ef4444;
  color: white;
}

.filter-badge.badge-reviewed.active {
  background: #8b5cf6;
  border-color: #8b5cf6;
  color: white;
}

.filter-badge.badge-default.active {
  background: #6b7280;
  border-color: #6b7280;
  color: white;
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
