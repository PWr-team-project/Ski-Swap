<template>
  <div :class="['rental-card', getStatusClass]">
    <!-- Image Section -->
    <div class="rental-image" @click="navigateToDetails">
      <img
        :src="getImageUrl(listing?.photos?.[0])"
        :alt="listing?.title"
        @error="handleImageError"
      />
      <div class="status-badge" :class="getStatusClass">{{ getStatusLabel }}</div>
    </div>

    <!-- Content Section -->
    <div class="rental-content">
      <!-- Title & Category -->
      <div class="title-section">
        <h3 class="rental-title">{{ listing?.title || 'Listing Unavailable' }}</h3>
        <span class="rental-category">{{ listing?.category_id?.name || 'Equipment' }}</span>
      </div>

      <!-- Status Description -->
      <p class="status-description">{{ getStatusDescription }}</p>

      <!-- User Info (Owner or Renter) -->
      <div class="user-section">
        <div class="user-avatar">
          <img v-if="userInfo?.profile_photo" :src="getImageUrl(userInfo.profile_photo)" :alt="getUserName" />
          <span v-else>{{ getUserInitial }}</span>
        </div>
        <div class="user-details">
          <span class="user-name">{{ getUserName }}</span>
          <span class="user-role">{{ isOwnerView ? 'Renter' : 'Owner' }}</span>
        </div>
        <div v-if="userInfo?.rating_avg" class="user-rating">
          <span class="rating-star">&#9733;</span>
          <span>{{ userInfo.rating_avg.toFixed(1) }}</span>
        </div>
      </div>

      <!-- Info Grid -->
      <div class="info-grid">
        <!-- Dates -->
        <div class="info-item">
          <svg class="info-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span>{{ formatDateRange }}</span>
        </div>

        <!-- Price -->
        <div class="info-item price-item">
          <svg class="info-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
          <span class="price-value">€{{ totalPrice?.toFixed(2) || '0.00' }}</span>
        </div>

        <!-- Duration Badge -->
        <div v-if="showDuration" class="info-item duration-item">
          <svg class="info-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <span>{{ getDuration }} days</span>
        </div>

        <!-- Location (when allowed) -->
        <div v-if="showLocation" class="info-item">
          <svg class="info-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span>{{ getShortLocation }}</span>
        </div>

        <!-- Phone (when allowed) -->
        <div v-if="showPhone" class="info-item phone-item">
          <svg class="info-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
          </svg>
          <span>{{ userInfo?.phone || 'N/A' }}</span>
        </div>
      </div>

      <!-- Payment Badge & Insurance -->
      <div class="badges-row">
        <span v-if="showPaymentBadge" :class="['payment-badge', paymentConfirmed ? 'paid' : 'unpaid']">
          {{ paymentConfirmed ? 'Paid' : 'Unpaid' }}
        </span>
        <span v-if="insuranceFlag" class="insurance-badge">
          Insured
        </span>
      </div>

      <!-- Review Received (if applicable) -->
      <div v-if="hasReview && bookingStatus === 'REVIEWED'" class="review-indicator">
        <span class="review-star">&#9733;</span>
        Review received
      </div>

      <!-- Action Buttons - All redirect to BookingDetails -->
      <div class="action-buttons">
        <!-- Renter-side buttons -->
        <template v-if="!isOwnerView">
          <button v-if="showPayButton" @click="navigateToDetails" class="btn btn-success btn-sm">Pay</button>
          <button v-if="showCancelButton" @click="navigateToDetails" class="btn btn-danger btn-sm">Cancel</button>
          <button v-if="showConfirmPickupButton" @click="navigateToDetails" class="btn btn-success btn-sm">Confirm Pickup</button>
          <button v-if="showConfirmReturnButton" @click="navigateToDetails" class="btn btn-success btn-sm">Confirm Return</button>
          <button v-if="showContactSupportButton" @click="navigateToDetails" class="btn btn-support btn-sm">Contact Support</button>
        </template>

        <!-- Owner-side buttons -->
        <template v-else>
          <button v-if="showAcceptButton" @click="navigateToDetails" class="btn btn-success btn-sm">Accept</button>
          <button v-if="showDeclineButton" @click="navigateToDetails" class="btn btn-danger btn-sm">Decline</button>
          <button v-if="showOwnerConfirmHandoffButton" @click="navigateToDetails" class="btn btn-success btn-sm">Confirm</button>
          <button v-if="showOwnerConfirmReturnButton" @click="navigateToDetails" class="btn btn-success btn-sm">Confirm Return</button>
          <button v-if="showEverythingOKButton" @click="navigateToDetails" class="btn btn-success btn-sm">Everything OK</button>
          <button v-if="showSomethingWrongButton" @click="navigateToDetails" class="btn btn-support btn-sm">Something Wrong</button>
          <button v-if="showOwnerContactSupportButton" @click="navigateToDetails" class="btn btn-support btn-sm">Contact Support</button>
        </template>

        <!-- View Details - Always shown -->
        <button @click="navigateToDetails" class="btn btn-details">View Details</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const props = defineProps({
  rentalId: String,
  listing: Object,
  owner: Object, // Owner info (for renter view)
  renter: Object, // Renter info (for owner view)
  startDate: String,
  endDate: String,
  totalPrice: Number,
  bookingStatus: String, // The actual booking status (PENDING, ACCEPTED, etc.)
  status: String, // Card status type (active, upcoming, history, pending)
  daysRemaining: Number,
  location: Object,
  hasReview: Boolean,
  paymentConfirmed: Boolean,
  insuranceFlag: Boolean,
  isOwnerView: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['view-details']);

// Determine user info based on view type
const userInfo = computed(() => {
  return props.isOwnerView ? props.renter : props.owner;
});

// Status mapping
const statusLabels = {
  'PENDING': 'Pending',
  'ACCEPTED': 'Accepted',
  'PICKUP': 'Pickup',
  'PICKUP_OWNER': 'Pickup',
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

const statusDescriptions = {
  'PENDING': { renter: 'Awaiting owner approval', owner: 'New booking request' },
  'ACCEPTED': { renter: 'Complete payment to proceed', owner: 'Awaiting payment' },
  'PICKUP': { renter: 'Time to pick up equipment', owner: 'Equipment ready for pickup' },
  'PICKUP_OWNER': { renter: 'Confirm you received equipment', owner: 'Waiting for renter confirmation' },
  'PICKUP_RENTER': { renter: 'Waiting for owner confirmation', owner: 'Confirm handoff' },
  'IN_PROGRESS': { renter: 'Enjoy your rental!', owner: 'Equipment currently rented' },
  'RETURN': { renter: 'Time to return equipment', owner: 'Equipment due for return' },
  'RETURN_RENTER': { renter: 'Waiting for owner to verify', owner: 'Verify equipment condition' },
  'RETURN_OWNER': { renter: 'Confirm return', owner: 'Verify equipment is OK' },
  'COMPLETED': { renter: 'Leave a review', owner: 'Rental completed' },
  'REVIEWED': { renter: 'Thank you!', owner: 'Review received' },
  'CANCELLED': { renter: 'Booking cancelled', owner: 'Booking cancelled' },
  'DECLINED': { renter: 'Request declined', owner: 'Request declined' },
  'DISPUTED': { renter: 'Support will contact you', owner: 'Support will contact you' },
  'DISPUTE_RESOLVED': { renter: 'Dispute resolved', owner: 'Dispute resolved' }
};

const getStatusLabel = computed(() => {
  return statusLabels[props.bookingStatus] || props.status || 'Unknown';
});

const getStatusDescription = computed(() => {
  const role = props.isOwnerView ? 'owner' : 'renter';
  return statusDescriptions[props.bookingStatus]?.[role] || '';
});

const getStatusClass = computed(() => {
  const status = props.bookingStatus;
  if (['CANCELLED', 'DECLINED', 'DISPUTED'].includes(status)) return 'status-error';
  if (['COMPLETED', 'REVIEWED', 'DISPUTE_RESOLVED'].includes(status)) return 'status-completed';
  if (['IN_PROGRESS', 'PICKUP', 'PICKUP_OWNER', 'PICKUP_RENTER', 'RETURN', 'RETURN_OWNER', 'RETURN_RENTER'].includes(status)) return 'status-active';
  if (['PENDING'].includes(status)) return 'status-pending';
  if (['ACCEPTED'].includes(status)) return 'status-upcoming';
  return 'status-default';
});

// Determine what to show based on status
const locationAllowedStates = ['ACCEPTED', 'PICKUP', 'PICKUP_OWNER', 'PICKUP_RENTER', 'IN_PROGRESS', 'RETURN', 'RETURN_OWNER', 'RETURN_RENTER'];
const showLocation = computed(() => locationAllowedStates.includes(props.bookingStatus));
const showPhone = computed(() => locationAllowedStates.includes(props.bookingStatus));
const showDuration = computed(() => true);
const showPaymentBadge = computed(() => ['PENDING', 'ACCEPTED'].includes(props.bookingStatus));

// Renter button visibility
const showPayButton = computed(() => !props.isOwnerView && ['PENDING', 'ACCEPTED'].includes(props.bookingStatus) && !props.paymentConfirmed);
const showCancelButton = computed(() => !props.isOwnerView && ['PENDING', 'ACCEPTED'].includes(props.bookingStatus));
const showConfirmPickupButton = computed(() => !props.isOwnerView && ['PICKUP', 'PICKUP_OWNER'].includes(props.bookingStatus));
const showConfirmReturnButton = computed(() => !props.isOwnerView && ['RETURN', 'RETURN_OWNER'].includes(props.bookingStatus));
const showContactSupportButton = computed(() => !props.isOwnerView && props.bookingStatus === 'DISPUTED');

// Owner button visibility
const showAcceptButton = computed(() => props.isOwnerView && props.bookingStatus === 'PENDING');
const showDeclineButton = computed(() => props.isOwnerView && props.bookingStatus === 'PENDING');
const showOwnerConfirmHandoffButton = computed(() => props.isOwnerView && ['PICKUP', 'PICKUP_RENTER'].includes(props.bookingStatus));
const showOwnerConfirmReturnButton = computed(() => props.isOwnerView && props.bookingStatus === 'RETURN');
const showEverythingOKButton = computed(() => props.isOwnerView && ['RETURN_RENTER', 'RETURN_OWNER'].includes(props.bookingStatus));
const showSomethingWrongButton = computed(() => props.isOwnerView && ['RETURN_RENTER', 'RETURN_OWNER'].includes(props.bookingStatus));
const showOwnerContactSupportButton = computed(() => props.isOwnerView && props.bookingStatus === 'DISPUTED');

// Helpers
const getImageUrl = (photoPath) => {
  if (!photoPath) return '/assets/images/placeholder.jpg';
  if (photoPath.startsWith('http')) return photoPath;
  return `http://localhost:5000${photoPath}`;
};

const handleImageError = (e) => {
  e.target.src = '/assets/images/placeholder.jpg';
};

const getUserName = computed(() => {
  if (!userInfo.value) return 'Unknown';
  const fullName = `${userInfo.value.first_name || ''} ${userInfo.value.last_name || ''}`.trim();
  return fullName || userInfo.value.nickname || userInfo.value.email || 'Unknown';
});

const getUserInitial = computed(() => {
  if (!userInfo.value) return '?';
  const name = userInfo.value.nickname || userInfo.value.first_name || userInfo.value.email || 'U';
  return name.charAt(0).toUpperCase();
});

const getShortLocation = computed(() => {
  if (!props.location) return 'N/A';
  return `${props.location.city || ''}, ${props.location.country || ''}`.replace(/^, |, $/g, '') || 'N/A';
});

const formatDateRange = computed(() => {
  if (!props.startDate || !props.endDate) return 'N/A';
  const start = new Date(props.startDate);
  const end = new Date(props.endDate);
  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${startStr} - ${endStr}`;
});

const getDuration = computed(() => {
  if (!props.startDate || !props.endDate) return 0;
  const start = new Date(props.startDate);
  const end = new Date(props.endDate);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
});

const navigateToDetails = () => {
  if (props.rentalId) {
    router.push(`/booking/${props.rentalId}`);
  }
};
</script>

<style scoped>
.rental-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  box-shadow: 0 4px 20px rgba(0, 170, 255, 0.1);
  border: 1px solid rgba(0, 170, 255, 0.1);
  transition: all 0.3s ease;
}

.rental-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 170, 255, 0.2);
}

/* Image Section */
.rental-image {
  position: relative;
  width: 180px;
  min-height: 180px;
  flex-shrink: 0;
  cursor: pointer;
  overflow: hidden;
  margin: 1rem;
  border-radius: 12px;
}

.rental-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.rental-card:hover .rental-image img {
  transform: scale(1.05);
}

/* Status Badge */
.status-badge {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-upcoming {
  background: #dbeafe;
  color: #1e40af;
}

.status-active {
  background: #fed7aa;
  color: #c2410c;
}

.status-completed {
  background: #d1fae5;
  color: #065f46;
}

.status-error {
  background: #fee2e2;
  color: #991b1b;
}

.status-default {
  background: #f3f4f6;
  color: #4b5563;
}

/* Content Section */
.rental-content {
  flex: 1;
  padding: 1.25rem 1.25rem 1.25rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.title-section {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
}

.rental-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
  flex: 1;
}

.rental-category {
  font-size: 0.75rem;
  color: #666;
  background: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  white-space: nowrap;
}

.status-description {
  font-size: 0.85rem;
  color: #666;
  margin: 0;
  line-height: 1.4;
}

/* User Section */
.user-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #00AAFF;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 600;
  flex-shrink: 0;
  overflow: hidden;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-details {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.user-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: #1a1a1a;
}

.user-role {
  font-size: 0.7rem;
  color: #999;
}

.user-rating {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.85rem;
  color: #f59e0b;
  font-weight: 600;
}

.rating-star {
  color: #f59e0b;
}

/* Info Grid */
.info-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  color: #666;
}

.info-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  color: #9ca3af;
}

.price-value {
  font-weight: 700;
  color: #10b981;
}

/* Badges Row */
.badges-row {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.payment-badge,
.insurance-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.payment-badge.paid {
  background: #d1fae5;
  color: #065f46;
}

.payment-badge.unpaid {
  background: #fef3c7;
  color: #92400e;
}

.insurance-badge {
  background: #dbeafe;
  color: #1e40af;
}

/* Review Indicator */
.review-indicator {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: #8b5cf6;
  font-weight: 500;
}

.review-star {
  color: #8b5cf6;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: auto;
  padding-top: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-sm {
  padding: 0.4rem 0.75rem;
  font-size: 0.75rem;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover {
  background: #059669;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.btn-support {
  background: #fca5a5;
  color: #991b1b;
}

.btn-support:hover {
  background: #f87171;
}

.btn-details {
  background: transparent;
  color: #00AAFF;
  padding: 0.4rem 0.75rem;
  margin-left: auto;
}

.btn-details:hover {
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 768px) {
  .rental-card {
    flex-direction: column;
  }

  .rental-image {
    width: 100%;
    height: 180px;
    margin: 0;
    border-radius: 16px 16px 0 0;
  }

  .rental-content {
    padding: 1.25rem;
  }

  .info-grid {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
