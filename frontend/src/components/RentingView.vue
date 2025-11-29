<template>
  <div class="renting-view">
    <!-- Requests Section -->
    <div class="collapsible-section">
      <button
        class="section-header"
        @click="toggleSection('requests')"
        :class="{ expanded: expandedSections.requests }"
      >
        <div class="section-header-left">
          <img src="/assets/icons/chevron_right.svg" alt="" class="chevron-icon" />
          <h2 class="section-title">Requests</h2>
          <span class="section-count">{{ bookings.pending.length }}</span>
        </div>
      </button>
      <div v-show="expandedSections.requests" class="section-content">
        <div v-if="bookings.pending.length > 0" class="rental-list">
          <RentalCard
            v-for="rental in bookings.pending"
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
    <div class="collapsible-section">
      <button
        class="section-header"
        @click="toggleSection('active')"
        :class="{ expanded: expandedSections.active }"
      >
        <div class="section-header-left">
          <img src="/assets/icons/chevron_right.svg" alt="" class="chevron-icon" />
          <h2 class="section-title">Active</h2>
          <span class="section-count">{{ bookings.active.length }}</span>
        </div>
      </button>
      <div v-show="expandedSections.active" class="section-content">
        <div v-if="bookings.active.length > 0" class="rental-list">
          <RentalCard
            v-for="rental in bookings.active"
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
    <div class="collapsible-section">
      <button
        class="section-header"
        @click="toggleSection('upcoming')"
        :class="{ expanded: expandedSections.upcoming }"
      >
        <div class="section-header-left">
          <img src="/assets/icons/chevron_right.svg" alt="" class="chevron-icon" />
          <h2 class="section-title">Upcoming</h2>
          <span class="section-count">{{ bookings.upcoming.length }}</span>
        </div>
      </button>
      <div v-show="expandedSections.upcoming" class="section-content">
        <div v-if="bookings.upcoming.length > 0" class="rental-list">
          <RentalCard
            v-for="rental in bookings.upcoming"
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
    <div class="collapsible-section">
      <button
        class="section-header"
        @click="toggleSection('history')"
        :class="{ expanded: expandedSections.history }"
      >
        <div class="section-header-left">
          <img src="/assets/icons/chevron_right.svg" alt="" class="chevron-icon" />
          <h2 class="section-title">Booking History</h2>
          <span class="section-count">{{ bookings.history.length }}</span>
        </div>
      </button>
      <div v-show="expandedSections.history" class="section-content">
        <div v-if="bookings.history.length > 0" class="rental-list">
          <RentalCard
            v-for="rental in bookings.history"
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
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
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

// Determine which section to expand by default
const initializeExpandedSections = () => {
  // Priority: Active > Requests > Upcoming > History
  if (props.bookings.active.length > 0) {
    expandedSections.value.active = true;
  } else if (props.bookings.pending.length > 0) {
    expandedSections.value.requests = true;
  } else if (props.bookings.upcoming.length > 0) {
    expandedSections.value.upcoming = true;
  } else if (props.bookings.history.length > 0) {
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
  return booking.ownerReview !== null && booking.ownerReview !== undefined;
};

const viewListing = (listingId) => {
  if (listingId) {
    router.push(`/listing/${listingId}`);
  }
};

const viewDetails = (bookingId) => {
  emit('view-details', bookingId);
};

const reviewEquipment = (bookingId) => {
  emit('review-equipment', bookingId);
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

/* Rental List */
.rental-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
