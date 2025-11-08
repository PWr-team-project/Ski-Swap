<template>
  <div :class="['booking-card', statusClass]">
    <div class="booking-image" @click="$emit('view-listing', listing?._id)">
      <img
        :src="getImageUrl(listing?.photos?.[0])"
        :alt="listing?.title"
        @error="handleImageError"
      />
    </div>
    <div class="booking-content">
      <div class="status-badge" :class="statusClass">{{ statusText }}</div>
      <h3 class="booking-title">{{ listing?.title || 'Listing Unavailable' }}</h3>

      <div class="renter-info">
        <div class="renter-avatar">{{ getRenterInitial(renter) }}</div>
        <span class="renter-name">{{ getRenterName(renter) }}</span>
        <span v-if="renter?.rating_avg" class="rating">⭐ {{ renter.rating_avg }}</span>
      </div>

      <div class="info-grid">
        <!-- Calendar Icon - Pickup/Period -->
        <div class="info-item">
          <svg class="info-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <div>
            <div class="info-label">
              <span v-if="status === 'active' || status === 'history'">Period: </span>
              <span v-else>Pickup: </span>
              {{ formatDateRange(startDate, endDate, status) }}
            </div>
          </div>
        </div>

        <!-- Clock Icon - Duration or Days Remaining -->
        <div class="info-item" v-if="status === 'active'">
          <svg class="info-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <div>
            <div class="info-label highlight">{{ daysRemaining }} days remaining</div>
          </div>
        </div>
        <div class="info-item" v-else>
          <svg class="info-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          <div>
            <div class="info-label">{{ getDuration(startDate, endDate) }}</div>
          </div>
        </div>

        <!-- Location Icon -->
        <div class="info-item">
          <svg class="info-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <div>
            <div class="info-label">{{ getLocation(location) }}</div>
          </div>
        </div>

        <!-- Dollar Icon - Earnings -->
        <div class="info-item earnings">
          <svg class="info-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
          <div>
            <div class="info-label">
              <span v-if="status === 'pending'">Potential: </span>
              <span v-else-if="status === 'history'">Earned: </span>
              <span v-else>Earnings: </span>
              <span class="price-highlight">${{ totalPrice.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="action-buttons">
        <!-- Pending Request Actions -->
        <template v-if="status === 'pending'">
          <button @click="$emit('accept', bookingId)" class="btn-accept">Accept</button>
          <button @click="$emit('decline', bookingId)" class="btn-decline">Decline</button>
          <button @click="$emit('view-details', bookingId)" class="btn-details-link">View Details</button>
        </template>

        <!-- Upcoming Actions -->
        <template v-else-if="status === 'upcoming'">
          <button @click="$emit('contact', renter?._id)" class="btn-contact">Contact Renter</button>
          <button @click="$emit('view-details', bookingId)" class="btn-details-link">View Details</button>
        </template>

        <!-- Active/History Actions -->
        <template v-else>
          <button @click="$emit('view-details', bookingId)" class="btn-details-link">View Details</button>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  bookingId: String,
  listing: Object,
  renter: Object,
  startDate: String,
  endDate: String,
  totalPrice: Number,
  status: String,
  daysRemaining: Number,
  location: Object
});

defineEmits(['view-listing', 'view-details', 'accept', 'decline', 'contact']);

const statusClass = {
  'pending': 'pending',
  'active': 'active',
  'upcoming': 'upcoming',
  'history': 'history'
}[props.status] || 'upcoming';

const statusText = {
  'pending': 'Pending Request',
  'active': 'Active',
  'upcoming': 'Upcoming',
  'history': 'Completed'
}[props.status] || 'Upcoming';

const getImageUrl = (photoPath) => {
  if (!photoPath) return '/assets/images/placeholder.jpg';
  if (photoPath.startsWith('http')) return photoPath;
  return `http://localhost:5000${photoPath}`;
};

const handleImageError = (e) => {
  e.target.src = '/assets/images/placeholder.jpg';
};

const getRenterName = (renter) => {
  if (!renter) return 'Unknown';
  return renter.nickname || `${renter.first_name || ''} ${renter.last_name || ''}`.trim() || renter.email || 'Unknown';
};

const getRenterInitial = (renter) => {
  if (!renter) return '?';
  const name = renter.nickname || renter.first_name || renter.email || 'U';
  return name.charAt(0).toUpperCase();
};

const getLocation = (location) => {
  if (!location) return 'N/A';
  return `${location.city}, ${location.country}`;
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const formatDateRange = (start, end, status) => {
  if (status === 'active' || status === 'history') {
    return `${formatDate(start)} - ${formatDate(end)}`;
  }
  return formatDate(start);
};

const getDuration = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  return `${days} day${days !== 1 ? 's' : ''}`;
};
</script>

<style scoped>
.booking-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  position: relative;
  box-shadow: 0 4px 20px rgba(0, 170, 255, 0.1);
  border: 1px solid rgba(0, 170, 255, 0.1);
  transition: all 0.3s ease;
}

.booking-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 170, 255, 0.2);
}

.booking-card.pending {
  border: 2px solid #ffa500;
}

.booking-card.history {
  opacity: 0.9;
}

.booking-image {
  position: relative;
  width: 180px;
  height: 180px;
  flex-shrink: 0;
  cursor: pointer;
  overflow: hidden;
  margin: 1rem;
  border-radius: 12px;
}

.booking-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.booking-card:hover .booking-image img {
  transform: scale(1.05);
}

.status-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.4rem 0.9rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  letter-spacing: 0.3px;
}

.status-badge.pending {
  background: #ffa500;
}

.status-badge.active {
  background: #f39c12;
}

.status-badge.upcoming {
  background: #3498db;
}

.status-badge.history {
  background: #2ecc71;
}

.booking-content {
  flex: 1;
  padding: 1.5rem 1.5rem 1.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.booking-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
  padding-right: 8rem;
}

.renter-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.renter-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #00AAFF;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 600;
  flex-shrink: 0;
}

.renter-name {
  font-size: 0.95rem;
  color: #1a1a1a;
  font-weight: 500;
}

.rating {
  font-size: 0.9rem;
  color: #ffa500;
  font-weight: 600;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem 1.5rem;
  margin: 0.5rem 0;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.info-icon {
  color: #666;
  flex-shrink: 0;
}

.info-label {
  font-size: 0.9rem;
  color: #1a1a1a;
  font-weight: 400;
}

.info-label.highlight {
  color: #e67e22;
  font-weight: 500;
}

.info-item.earnings .info-label {
  color: #2ecc71;
  font-weight: 500;
}

.price-highlight {
  font-weight: 700;
  color: #2ecc71;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
}

.btn-accept,
.btn-decline,
.btn-contact,
.btn-details-link {
  padding: 0.65rem 1.5rem;
  border-radius: 8px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-accept {
  background: #10b981;
  color: white;
  border: none;
}

.btn-accept:hover {
  background: #059669;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-decline {
  background: white;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

.btn-decline:hover {
  background: #f9fafb;
  border-color: #9ca3af;
  transform: translateY(-1px);
}

.btn-contact {
  background: #9b59b6;
  color: white;
  border: none;
}

.btn-contact:hover {
  background: #8e44ad;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(155, 89, 182, 0.3);
}

.btn-details-link {
  background: transparent;
  color: #00AAFF;
  border: none;
  padding: 0.65rem 0.75rem;
  text-decoration: none;
}

.btn-details-link:hover {
  color: #0088cc;
  text-decoration: underline;
}

/* Responsive */
@media (max-width: 768px) {
  .booking-card {
    flex-direction: column;
  }

  .booking-image {
    width: 100%;
    height: 200px;
    margin: 0;
    border-radius: 0;
  }

  .booking-content {
    padding: 1.5rem;
  }

  .booking-title {
    padding-right: 7rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .btn-accept,
  .btn-decline,
  .btn-contact {
    flex: 1;
  }

  .btn-details-link {
    width: 100%;
    text-align: center;
  }
}
</style>
