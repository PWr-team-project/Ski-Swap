<template>
  <div class="renting-view">
    <!-- Requests Section -->
    <div v-if="requestsRentalsRaw.length > 0" class="collapsible-section">
      <button
        class="section-header"
        @click="toggleSection('requests')"
        :class="{ expanded: expandedSections.requests }"
      >
        <div class="section-header-left">
          <img src="/assets/icons/chevron_right.svg" alt="" class="chevron-icon" />
          <h2 class="section-title">Requests</h2>
          <span class="section-count">{{ requestsRentalsRaw.length }}</span>
        </div>
        <!-- Status Badge Filters -->
        <div v-if="availableRequestsBadges.length > 1 && expandedSections.requests" class="status-filters" @click.stop>
          <button
            v-for="badgeName in availableRequestsBadges"
            :key="badgeName"
            @click="toggleBadgeFilter('requests', badgeName)"
            :class="['filter-badge', getBadgeClassForName(badgeName), { active: isBadgeActive('requests', badgeName) }]"
          >
            {{ badgeName }}
          </button>
        </div>
      </button>
      <div v-show="expandedSections.requests" class="section-content">
        <div v-if="requestsRentals.length > 0" class="rental-list">
          <RentalCard
            v-for="rental in requestsRentals"
            :key="`${rental._id}-${rental.status}`"
            :rental-id="rental._id"
            :listing="rental.listing_id"
            :owner="rental.listing_id?.owner_id"
            :start-date="rental.start_date"
            :end-date="rental.end_date"
            :total-price="rental.total_price"
            :location="rental.listing_id?.location_id"
            :booking-status="rental.status"
            :payment-confirmed="rental.payment_confirmed"
            :insurance-flag="rental.insurance_flag"
            status="pending"
          />
        </div>
        <div v-else class="empty-section">
          <p>No pending requests</p>
        </div>
      </div>
    </div>

    <!-- Active Rentals Section -->
    <div v-if="activeRentalsRaw.length > 0" class="collapsible-section">
      <button
        class="section-header"
        @click="toggleSection('active')"
        :class="{ expanded: expandedSections.active }"
      >
        <div class="section-header-left">
          <img src="/assets/icons/chevron_right.svg" alt="" class="chevron-icon" />
          <h2 class="section-title">Active</h2>
          <span class="section-count">{{ activeRentalsRaw.length }}</span>
        </div>
        <!-- Status Badge Filters -->
        <div v-if="availableActiveBadges.length > 1 && expandedSections.active" class="status-filters" @click.stop>
          <button
            v-for="badgeName in availableActiveBadges"
            :key="badgeName"
            @click="toggleBadgeFilter('active', badgeName)"
            :class="['filter-badge', getBadgeClassForName(badgeName), { active: isBadgeActive('active', badgeName) }]"
          >
            {{ badgeName }}
          </button>
        </div>
      </button>
      <div v-show="expandedSections.active" class="section-content">
        <div v-if="activeRentals.length > 0" class="rental-list">
          <RentalCard
            v-for="rental in activeRentals"
            :key="`${rental._id}-${rental.status}`"
            :rental-id="rental._id"
            :listing="rental.listing_id"
            :owner="rental.listing_id?.owner_id"
            :start-date="rental.start_date"
            :end-date="rental.end_date"
            :total-price="rental.total_price"
            :days-remaining="rental.daysRemaining"
            :location="rental.listing_id?.location_id"
            :booking-status="rental.status"
            :payment-confirmed="rental.payment_confirmed"
            :insurance-flag="rental.insurance_flag"
            status="active"
          />
        </div>
        <div v-else class="empty-section">
          <p>No active rentals</p>
        </div>
      </div>
    </div>

    <!-- Upcoming Rentals Section -->
    <div v-if="upcomingRentalsRaw.length > 0" class="collapsible-section">
      <button
        class="section-header"
        @click="toggleSection('upcoming')"
        :class="{ expanded: expandedSections.upcoming }"
      >
        <div class="section-header-left">
          <img src="/assets/icons/chevron_right.svg" alt="" class="chevron-icon" />
          <h2 class="section-title">Upcoming</h2>
          <span class="section-count">{{ upcomingRentalsRaw.length }}</span>
        </div>
        <!-- Status Badge Filters -->
        <div v-if="availableUpcomingBadges.length > 1 && expandedSections.upcoming" class="status-filters" @click.stop>
          <button
            v-for="badgeName in availableUpcomingBadges"
            :key="badgeName"
            @click="toggleBadgeFilter('upcoming', badgeName)"
            :class="['filter-badge', getBadgeClassForName(badgeName), { active: isBadgeActive('upcoming', badgeName) }]"
          >
            {{ badgeName }}
          </button>
        </div>
      </button>
      <div v-show="expandedSections.upcoming" class="section-content">
        <div v-if="upcomingRentals.length > 0" class="rental-list">
          <RentalCard
            v-for="rental in upcomingRentals"
            :key="`${rental._id}-${rental.status}`"
            :rental-id="rental._id"
            :listing="rental.listing_id"
            :owner="rental.listing_id?.owner_id"
            :start-date="rental.start_date"
            :end-date="rental.end_date"
            :total-price="rental.total_price"
            :location="rental.listing_id?.location_id"
            :booking-status="rental.status"
            :payment-confirmed="rental.payment_confirmed"
            :insurance-flag="rental.insurance_flag"
            status="upcoming"
          />
        </div>
        <div v-else class="empty-section">
          <p>No upcoming rentals</p>
        </div>
      </div>
    </div>

    <!-- Booking History Section -->
    <div v-if="historyRentalsRaw.length > 0" class="collapsible-section">
      <button
        class="section-header"
        @click="toggleSection('history')"
        :class="{ expanded: expandedSections.history }"
      >
        <div class="section-header-left">
          <img src="/assets/icons/chevron_right.svg" alt="" class="chevron-icon" />
          <h2 class="section-title">Booking History</h2>
          <span class="section-count">{{ historyRentalsRaw.length }}</span>
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
        <div v-if="historyRentals.length > 0" class="rental-list">
          <RentalCard
            v-for="rental in historyRentals"
            :key="`${rental._id}-${rental.status}`"
            :rental-id="rental._id"
            :listing="rental.listing_id"
            :owner="rental.listing_id?.owner_id"
            :start-date="rental.start_date"
            :end-date="rental.end_date"
            :total-price="rental.total_price"
            :location="rental.listing_id?.location_id"
            :has-review="hasReview(rental)"
            :booking-status="rental.status"
            :payment-confirmed="rental.payment_confirmed"
            :insurance-flag="rental.insurance_flag"
            status="history"
          />
        </div>
        <div v-else class="empty-section">
          <p>No booking history</p>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="totalRentals === 0" class="empty-state">
      <div class="empty-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 12V22H4V12" stroke="#00AAFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M22 7H2V12H22V7Z" stroke="#00AAFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 22V7" stroke="#00AAFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 7H16.5C17.163 7 17.7989 6.73661 18.2678 6.26777C18.7366 5.79893 19 5.16304 19 4.5C19 3.83696 18.7366 3.20107 18.2678 2.73223C17.7989 2.26339 17.163 2 16.5 2C13 2 12 7 12 7Z" stroke="#00AAFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 7H7.5C6.83696 7 6.20107 6.73661 5.73223 6.26777C5.26339 5.79893 5 5.16304 5 4.5C5 3.83696 5.26339 3.20107 5.73223 2.73223C6.20107 2.26339 6.83696 2 7.5 2C11 2 12 7 12 7Z" stroke="#00AAFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h3 class="empty-title">No Rentals Yet</h3>
      <p class="empty-text">You haven't rented any equipment yet. Browse available items to start your adventure!</p>
      <button @click="viewBrowseItems" class="btn-browse">Browse Equipment</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import RentalCard from './RentalCard.vue';

const router = useRouter();

const props = defineProps({
  bookings: {
    type: Object,
    required: true,
    default: () => ({
      pending: [],
      active: [],
      upcoming: [],
      history: []
    })
  }
});

const emit = defineEmits(['view-details', 'review-equipment']);

// Track which sections are expanded
const expandedSections = ref({
  requests: false,
  active: false,
  upcoming: false,
  history: false
});

// Status filters for each section
const statusFilters = ref({
  requests: [],
  active: [],
  upcoming: [],
  history: []
});

// Raw computed sections without filtering (for counts and available badges)
const requestsRentalsRaw = computed(() => {
  return [...props.bookings.pending];
});

const activeRentalsRaw = computed(() => {
  const activeStatuses = ['RETURN', 'RETURN_OWNER', 'RETURN_RENTER', 'PICKUP', 'PICKUP_OWNER', 'PICKUP_RENTER', 'IN_PROGRESS'];

  let rentals = [
    ...props.bookings.active.filter(r => activeStatuses.includes(r.status)),
    ...props.bookings.upcoming.filter(r => activeStatuses.includes(r.status))
  ];

  // Sort by hierarchy: RETURN > PICKUP > ACTIVE (IN_PROGRESS)
  const statusPriority = {
    'RETURN': 1,
    'RETURN_OWNER': 1,
    'RETURN_RENTER': 1,
    'PICKUP': 2,
    'PICKUP_OWNER': 2,
    'PICKUP_RENTER': 2,
    'IN_PROGRESS': 3
  };

  rentals.sort((a, b) => {
    const priorityA = statusPriority[a.status] || 999;
    const priorityB = statusPriority[b.status] || 999;
    return priorityA - priorityB;
  });

  return rentals;
});

const upcomingRentalsRaw = computed(() => {
  const upcomingStatuses = ['ACCEPTED'];

  return [
    ...props.bookings.upcoming,
    ...props.bookings.active.filter(r => upcomingStatuses.includes(r.status))
  ];
});

const historyRentalsRaw = computed(() => {
  return [...props.bookings.history];
});

// Filtered computed sections (for display)
const requestsRentals = computed(() => {
  let rentals = requestsRentalsRaw.value;

  // Apply status filter if any selected
  if (statusFilters.value.requests.length > 0) {
    rentals = rentals.filter(r => statusFilters.value.requests.includes(r.status));
  }

  return rentals;
});

const activeRentals = computed(() => {
  let rentals = activeRentalsRaw.value;

  // Apply status filter if any selected
  if (statusFilters.value.active.length > 0) {
    rentals = rentals.filter(r => statusFilters.value.active.includes(r.status));
  }

  return rentals;
});

const upcomingRentals = computed(() => {
  let rentals = upcomingRentalsRaw.value;

  // Apply status filter if any selected
  if (statusFilters.value.upcoming.length > 0) {
    rentals = rentals.filter(r => statusFilters.value.upcoming.includes(r.status));
  }

  return rentals;
});

const historyRentals = computed(() => {
  let rentals = historyRentalsRaw.value;

  // Apply status filter if any selected
  if (statusFilters.value.history.length > 0) {
    rentals = rentals.filter(r => statusFilters.value.history.includes(r.status));
  }

  return rentals;
});

// Get available unique badge names for each section (for badge filtering)
const availableRequestsBadges = computed(() => {
  const badgeNames = new Set(requestsRentalsRaw.value.map(r => getStatusBadgeName(r.status)));
  return Array.from(badgeNames);
});

const availableActiveBadges = computed(() => {
  const badgeNames = new Set(activeRentalsRaw.value.map(r => getStatusBadgeName(r.status)));
  return Array.from(badgeNames);
});

const availableUpcomingBadges = computed(() => {
  const badgeNames = new Set(upcomingRentalsRaw.value.map(r => getStatusBadgeName(r.status)));
  return Array.from(badgeNames);
});

const availableHistoryBadges = computed(() => {
  const badgeNames = new Set(historyRentalsRaw.value.map(r => getStatusBadgeName(r.status)));
  return Array.from(badgeNames);
});

// Get statuses for a badge name
const getStatusesForBadge = (badgeName) => {
  const labels = {
    'PENDING': 'Pending',
    'ACCEPTED': 'Accepted',
    'PICKUP': 'Pickup',
    'PICKUP_OWNER': 'Pickup',
    'PICKUP_RENTER': 'Active',
    'IN_PROGRESS': 'Active',
    'RETURN': 'Return',
    'RETURN_RENTER': 'Completed',
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

// Get badge class for a status
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
    'PICKUP_OWNER': 'Pickup',
    'PICKUP_RENTER': 'Active',
    'IN_PROGRESS': 'Active',
    'RETURN': 'Return',
    'RETURN_RENTER': 'Completed',
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

// Total rentals count
const totalRentals = computed(() => {
  return requestsRentalsRaw.value.length +
         activeRentalsRaw.value.length +
         upcomingRentalsRaw.value.length +
         historyRentalsRaw.value.length;
});

// Determine which section to expand by default
const initializeExpandedSections = () => {
  // Priority: Active > Requests > Upcoming > History
  if (activeRentalsRaw.value.length > 0) {
    expandedSections.value.active = true;
  } else if (requestsRentalsRaw.value.length > 0) {
    expandedSections.value.requests = true;
  } else if (upcomingRentalsRaw.value.length > 0) {
    expandedSections.value.upcoming = true;
  } else if (historyRentalsRaw.value.length > 0) {
    expandedSections.value.history = true;
  }
};

// Watch for bookings changes to reinitialize
watch(() => props.bookings, () => {
  // Reset all sections
  expandedSections.value = {
    requests: false,
    active: false,
    upcoming: false,
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

const hasReview = (booking) => {
  return booking.hasReview === true;
};

const viewBrowseItems = () => {
  router.push('/browse');
};

</script>

<style scoped>
.renting-view {
  width: 100%;
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
  background-color: #f8fafc;
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

/* Rental List */
.rental-list {
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
  border: 2px dashed #00AAFF;
}

.empty-icon {
  margin-bottom: 1rem;
  color: #00AAFF;
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
  background: linear-gradient(135deg, #00AAFF 0%, #0088cc 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-browse:hover {
  background: linear-gradient(135deg, #0088cc 0%, #006699 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 170, 255, 0.3);
}

/* Responsive Design */
@media (max-width: 768px) {
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
