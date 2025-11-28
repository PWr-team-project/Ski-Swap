<template>
  <div class="booking-card">
    <!-- Status Badge - Right Top Corner -->
    <div class="status-badge" :class="statusClass">{{ statusText }}</div>

    <!-- Main Card Content -->
    <div class="card-layout">
      <!-- Left: Large Thumbnail -->
      <div class="thumbnail" @click="$emit('view-listing', listing?._id)">
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
            <div class="column-value">{{ formatDateRange(startDate, endDate) }}</div>
            <div class="column-subtext">{{ getDuration(startDate, endDate) }} days</div>
          </div>

          <!-- Column 2: Renter Info (Owner View) -->
          <div class="info-column">
            <div class="column-label">Renter</div>
            <div class="user-info">
              <div class="user-avatar">{{ getUserInitial(renter) }}</div>
              <div class="user-details">
                <div class="column-value">{{ getUserName(renter) }}</div>
                <div class="column-subtext" v-if="showContactInfo">
                  <div v-if="location">{{ getShortLocation(location) }}</div>
                  <div v-if="renter?.phone">{{ renter.phone }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Column 3: Earnings -->
          <div class="info-column">
            <div class="column-label">Earnings</div>
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
          <!-- Owner Buttons -->
          <button v-if="showOwnerAccept" @click="handleAction('accept')" class="btn btn-success">Accept</button>
          <button v-if="showOwnerDecline" @click="handleAction('decline')" class="btn btn-danger">Decline</button>
          <button v-if="showOwnerCancel" @click="handleAction('cancel')" class="btn btn-danger">Cancel</button>
          <button v-if="showOwnerConfirmHandoff" @click="handleAction('confirm-handoff')" class="btn btn-success">Confirm Handoff</button>
          <button v-if="showOwnerConfirmReturn" @click="handleAction('confirm-return')" class="btn btn-success">Confirm Return</button>
          <button v-if="showOwnerEverythingOK" @click="handleAction('everything-ok')" class="btn btn-success">Equipment checked</button>
          <button v-if="showOwnerSomethingWrong" @click="handleAction('something-wrong')" class="btn btn-dispute">Something's Wrong</button>
          <button v-if="showOwnerContactSupport" @click="handleAction('contact-support')" class="btn btn-support">Contact Support</button>
          <button v-if="showOwnerShowReview" @click="handleAction('show-review')" class="btn btn-review">Show Review</button>

          <!-- View Details - Always First and Sky Blue -->
          <button @click="$emit('view-details', bookingId)" class="btn btn-details">View Details</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  bookingId: String,
  listing: Object,
  renter: Object, // Owner views the Renter
  startDate: String,
  endDate: String,
  totalPrice: Number,
  bookingStatus: String, // Actual booking status (PENDING, ACCEPTED, etc.)
  paymentConfirmed: Boolean,
  insuranceFlag: Boolean,
  location: Object
});

const emit = defineEmits(['view-listing', 'view-details', 'action']);

// Status mapping
const statusClass = computed(() => {
  const status = props.bookingStatus;
  if (['CANCELLED', 'DECLINED', 'DISPUTED'].includes(status)) return 'status-error';
  if (['COMPLETED', 'DISPUTE_RESOLVED'].includes(status)) return 'status-completed';
  if (['IN_PROGRESS', 'PICKUP', 'PICKUP_OWNER', 'PICKUP_RENTER', 'RETURN', 'RETURN_OWNER', 'RETURN_RENTER'].includes(status)) return 'status-active';
  if (['PENDING'].includes(status)) return 'status-pending';
  if (['ACCEPTED'].includes(status)) return 'status-upcoming';
  if (['REVIEWED'].includes(status)) return 'status-reviewed';
  return 'status-default';
});

const statusText = computed(() => {
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
  return labels[props.bookingStatus] || 'Unknown';
});

// Show contact info based on status
const locationAllowedStates = [];
const showContactInfo = computed(() => locationAllowedStates.includes(props.bookingStatus));
const showPaymentBadge = computed(() => ['PENDING', 'ACCEPTED','PICKUP'].includes(props.bookingStatus));

// Owner button visibility
const showOwnerAccept = computed(() => props.bookingStatus === 'PENDING');
const showOwnerDecline = computed(() => props.bookingStatus === 'PENDING');
const showOwnerCancel = computed(() => props.bookingStatus === 'ACCEPTED');
const showOwnerConfirmHandoff = computed(() => ['PICKUP', 'PICKUP_RENTER'].includes(props.bookingStatus));
const showOwnerConfirmReturn = computed(() => props.bookingStatus === 'RETURN');
const showOwnerEverythingOK = computed(() => ['RETURN_RENTER', 'RETURN_OWNER'].includes(props.bookingStatus));
const showOwnerSomethingWrong = computed(() => ['RETURN_RENTER', 'RETURN_OWNER'].includes(props.bookingStatus));
const showOwnerContactSupport = computed(() => props.bookingStatus === 'DISPUTED');
const showOwnerShowReview = computed(() => props.bookingStatus === 'REVIEWED');

// Helper functions
const getImageUrl = (photoPath) => {
  if (!photoPath) return '/assets/images/image.png';
  if (photoPath.startsWith('http')) return photoPath;
  return `http://localhost:5000${photoPath}`;
};

const handleImageError = (e) => {
  e.target.src = '/assets/images/image.png';
};

const getUserName = (user) => {
  if (!user) return 'Unknown';
  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  return fullName || user.nickname || user.email || 'Unknown';
};

const getUserInitial = (user) => {
  if (!user) return '?';
  const name = user.nickname || user.first_name || user.email || 'U';
  return name.charAt(0).toUpperCase();
};

const getShortLocation = (location) => {
  if (!location) return '';
  return `${location.city || ''}, ${location.country || ''}`.replace(/^, |, $/g, '');
};

const formatDateRange = (start, end) => {
  if (!start || !end) return 'N/A';
  const startDate = new Date(start);
  const endDate = new Date(end);
  const startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${startStr} - ${endStr}`;
};

const getDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
};

const handleAction = (action) => {
  emit('action', { action, bookingId: props.bookingId });
};
</script>

<style scoped>
.booking-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  position: relative;
  transition: all 0.3s ease;
}

.booking-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

/* Status Badge - Right Top Corner */
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
.status-reviewed {
  background: #8b5cf6;
}

.status-default {
  background: #6b7280;
}

/* Card Layout */
.card-layout {
  display: flex;
  gap: 1.5rem;
}

/* Thumbnail */
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

/* Card Content */
.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Header Section */
.header-section {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding-right: 6rem; /* Space for status badge */
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

/* 3-Column Grid */
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

/* User Info in Column */
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

/* Badges */
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

/* Action Buttons */
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
  order: -1; /* Always first */
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

/* Responsive */
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
