<template>
  <div class="rental-card">
    <!-- Status Badge - Right Top Corner -->
    <div class="status-badge" :class="getStatusClass">{{ getStatusLabel }}</div>

    <!-- Main Card Content -->
    <div class="card-layout">
      <!-- Left: Large Thumbnail -->
      <div class="thumbnail" @click="navigateToDetails">
        <img
          :src="getImageUrl(listing?.photos?.[0])"
          :alt="listing?.title"
          @error="handleImageError"
        />
      </div>

      <!-- Right: Content -->
      <div class="card-content">
        <!-- Equipment Name and Category -->
        <div class="header-section">
          <h3 class="equipment-title">{{ listing?.title || 'Listing Unavailable' }}</h3>
          <span class="equipment-category">{{ listing?.category_id?.name || 'Equipment' }}</span>
        </div>

        <!-- 3-Column Grid -->
        <div class="info-grid">
          <!-- Column 1: Rental Period -->
          <div class="info-column">
            <div class="column-label">Rental Period</div>
            <div class="column-value">{{ formatDateRange }}</div>
            <div class="column-subtext">{{ getDuration }} days</div>
          </div>

          <!-- Column 2: Owner/Renter Info -->
          <div class="info-column">
            <div class="column-label">{{ isOwnerView ? 'Renter' : 'Owner' }}</div>
            <div class="user-info">
              <div class="user-avatar">{{ getUserInitial }}</div>
              <div class="user-details">
                <div class="column-value">{{ getUserName }}</div>
                <div class="column-subtext" v-if="showContactInfo">
                  <div v-if="showLocation">{{ getShortLocation }}</div>
                  <div v-if="showPhone && userInfo?.phone">{{ userInfo.phone }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Column 3: Price and Extras -->
          <div class="info-column">
            <div class="column-label">{{ isOwnerView ? 'Earnings' : 'Total' }}</div>
            <div class="column-value price">€{{ totalPrice?.toFixed(2) || '0.00' }}</div>
            <div class="column-subtext">
              <div class="badges">
                <span v-if="showPaymentBadge" :class="['badge', paymentConfirmed ? 'paid' : 'unpaid']">
                  {{ paymentConfirmed ? 'Paid' : 'Unpaid' }}
                </span>
                <span v-if="insuranceFlag" class="badge insured">Insured</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons - Bottom Right -->
        <div class="action-buttons">
          <!-- View Details - Always First and Sky Blue -->
          <button @click="navigateToDetails" class="btn btn-details">View Details</button>

          <!-- Owner Buttons -->
          <template v-if="isOwnerView">
            <button v-if="showAcceptButton" @click="navigateToDetails" class="btn btn-success">Accept</button>
            <button v-if="showDeclineButton" @click="navigateToDetails" class="btn btn-danger">Decline</button>
            <button v-if="showOwnerConfirmHandoffButton" @click="navigateToDetails" class="btn btn-success">Confirm</button>
            <button v-if="showOwnerConfirmReturnButton" @click="navigateToDetails" class="btn btn-success">Confirm Return</button>
            <button v-if="showEverythingOKButton" @click="navigateToDetails" class="btn btn-success">Everything OK</button>
            <button v-if="showSomethingWrongButton" @click="navigateToDetails" class="btn btn-dispute">Something's Wrong</button>
            <button v-if="showOwnerContactSupportButton" @click="navigateToDetails" class="btn btn-support">Contact Support</button>
            <button v-if="showOwnerShowReview" @click="navigateToDetails" class="btn btn-review">Show Review</button>
          </template>

          <!-- Renter Buttons -->
          <template v-else>
            <button v-if="showPayButton" @click="navigateToDetails" class="btn btn-success">Pay Now</button>
            <button v-if="showCancelButton" @click="navigateToDetails" class="btn btn-danger">Cancel</button>
            <button v-if="showConfirmPickupButton" @click="navigateToDetails" class="btn btn-success">Confirm Handoff</button>
            <button v-if="showConfirmReturnButton" @click="navigateToDetails" class="btn btn-success">Confirm Return</button>
            <button v-if="showRenterReview" @click="navigateToDetails" class="btn btn-review">Write Review</button>
            <button v-if="showRenterRentAgain" @click="navigateToDetails" class="btn btn-success">Rent Again</button>
            <button v-if="showContactSupportButton" @click="navigateToDetails" class="btn btn-support">Contact Support</button>
          </template>
        </div>
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
  owner: Object,
  renter: Object,
  startDate: String,
  endDate: String,
  totalPrice: Number,
  bookingStatus: String,
  status: String,
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

const userInfo = computed(() => {
  return props.isOwnerView ? props.renter : props.owner;
});

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

const getStatusLabel = computed(() => {
  return statusLabels[props.bookingStatus] || props.status || 'Unknown';
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

const locationAllowedStates = ['ACCEPTED', 'PICKUP', 'PICKUP_OWNER', 'PICKUP_RENTER', 'IN_PROGRESS', 'RETURN', 'RETURN_OWNER', 'RETURN_RENTER'];
const showLocation = computed(() => locationAllowedStates.includes(props.bookingStatus));
const showPhone = computed(() => locationAllowedStates.includes(props.bookingStatus));
const showContactInfo = computed(() => locationAllowedStates.includes(props.bookingStatus));
const showPaymentBadge = computed(() => ['PENDING', 'ACCEPTED'].includes(props.bookingStatus));

const showPayButton = computed(() => !props.isOwnerView && ['PENDING', 'ACCEPTED'].includes(props.bookingStatus) && !props.paymentConfirmed);
const showCancelButton = computed(() => !props.isOwnerView && ['PENDING', 'ACCEPTED'].includes(props.bookingStatus));
const showConfirmPickupButton = computed(() => !props.isOwnerView && ['PICKUP', 'PICKUP_OWNER'].includes(props.bookingStatus));
const showConfirmReturnButton = computed(() => !props.isOwnerView && ['RETURN', 'RETURN_OWNER'].includes(props.bookingStatus));
const showContactSupportButton = computed(() => !props.isOwnerView && props.bookingStatus === 'DISPUTED');
const showRenterReview = computed(() => !props.isOwnerView && props.bookingStatus === 'COMPLETED');
const showRenterRentAgain = computed(() => !props.isOwnerView && ['REVIEWED', 'CANCELLED'].includes(props.bookingStatus));

const showAcceptButton = computed(() => props.isOwnerView && props.bookingStatus === 'PENDING');
const showDeclineButton = computed(() => props.isOwnerView && props.bookingStatus === 'PENDING');
const showOwnerConfirmHandoffButton = computed(() => props.isOwnerView && ['PICKUP', 'PICKUP_RENTER'].includes(props.bookingStatus));
const showOwnerConfirmReturnButton = computed(() => props.isOwnerView && props.bookingStatus === 'RETURN');
const showEverythingOKButton = computed(() => props.isOwnerView && ['RETURN_RENTER', 'RETURN_OWNER'].includes(props.bookingStatus));
const showSomethingWrongButton = computed(() => props.isOwnerView && ['RETURN_RENTER', 'RETURN_OWNER'].includes(props.bookingStatus));
const showOwnerContactSupportButton = computed(() => props.isOwnerView && props.bookingStatus === 'DISPUTED');
const showOwnerShowReview = computed(() => props.isOwnerView && props.bookingStatus === 'REVIEWED');

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
  padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  position: relative;
  transition: all 0.3s ease;
}

.rental-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

.status-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: white;
  z-index: 1;
}

.status-pending {
  background: #fbbf24;
}

.status-upcoming {
  background: #3b82f6;
}

.status-active {
  background: #f97316;
}

.status-completed {
  background: #10b981;
}

.status-error {
  background: #ef4444;
}

.status-default {
  background: #6b7280;
}

.card-layout {
  display: flex;
  gap: 1.5rem;
}

.thumbnail {
  width: 140px;
  height: 140px;
  flex-shrink: 0;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.thumbnail:hover {
  transform: scale(1.05);
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.header-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-right: 6rem;
}

.equipment-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
  flex: 1;
}

.equipment-category {
  font-size: 0.75rem;
  color: #666;
  background: #f3f4f6;
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
  white-space: nowrap;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  padding: 1rem 0;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
}

.info-column {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.column-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.column-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1a1a1a;
}

.column-value.price {
  font-size: 1.3rem;
  color: #10b981;
}

.column-subtext {
  font-size: 0.75rem;
  color: #999;
}

.user-info {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #00AAFF;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 600;
  flex-shrink: 0;
}

.user-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.badges {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.badge {
  font-size: 0.65rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.badge.paid {
  background: #d1fae5;
  color: #065f46;
}

.badge.unpaid {
  background: #fef3c7;
  color: #92400e;
}

.badge.insured {
  background: #dbeafe;
  color: #1e40af;
}

.action-buttons {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  justify-content: flex-end;
  margin-top: auto;
}

.btn {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn-details {
  background: #00AAFF;
  color: white;
  order: -1;
}

.btn-details:hover {
  background: #0088cc;
  box-shadow: 0 4px 12px rgba(0, 170, 255, 0.3);
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover {
  background: #059669;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-review {
  background: #8b5cf6;
  color: white;
}

.btn-review:hover {
  background: #7c3aed;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.btn-dispute {
  background: #fca5a5;
  color: #991b1b;
}

.btn-dispute:hover {
  background: #f87171;
}

.btn-support {
  background: #fca5a5;
  color: #991b1b;
}

.btn-support:hover {
  background: #f87171;
}

@media (max-width: 768px) {
  .card-layout {
    flex-direction: column;
  }

  .thumbnail {
    width: 100%;
    height: 180px;
  }

  .header-section {
    flex-direction: column;
    align-items: flex-start;
    padding-right: 4rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
