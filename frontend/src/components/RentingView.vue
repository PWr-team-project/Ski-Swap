<template>
  <div class="renting-view">
    <!-- Dashboard Stats Section -->
    <div class="stats-section">
      <div class="stat-card">
        <div class="stat-icon completed">✓</div>
        <div class="stat-content">
          <p class="stat-value">{{ stats.completedRentals }}</p>
          <p class="stat-label">Completed Rentals</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon active">⚡</div>
        <div class="stat-content">
          <p class="stat-value">{{ stats.activeRentals }}</p>
          <p class="stat-label">Active Rentals</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon upcoming">📅</div>
        <div class="stat-content">
          <p class="stat-value">{{ stats.upcomingRentals }}</p>
          <p class="stat-label">Upcoming Rentals</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon rating">⭐</div>
        <div class="stat-content">
          <p class="stat-value">{{ stats.averageRating }}</p>
          <p class="stat-label">Average Rating</p>
        </div>
      </div>
    </div>

    <!-- Active Rentals Section -->
    <div v-if="bookings.active.length > 0" class="section">
      <h2 class="section-title">Active Rentals</h2>
      <p class="section-subtitle">Equipment currently in your possession</p>
      <div class="rental-list">
        <RentalCard
          v-for="rental in bookings.active"
          :key="rental._id"
          :rental-id="rental._id"
          :listing="rental.listing_id"
          :owner="rental.listing_id?.owner_id"
          :start-date="rental.start_date"
          :end-date="rental.end_date"
          :total-price="rental.total_price"
          :days-remaining="rental.daysRemaining"
          :location="rental.listing_id?.location_id"
          status="active"
          @view-listing="viewListing"
          @view-details="viewDetails"
        />
      </div>
    </div>

    <!-- Upcoming Rentals Section -->
    <div v-if="bookings.upcoming.length > 0" class="section">
      <h2 class="section-title">Upcoming Rentals</h2>
      <p class="section-subtitle">Confirmed rentals awaiting pickup</p>
      <div class="rental-list">
        <RentalCard
          v-for="rental in bookings.upcoming"
          :key="rental._id"
          :rental-id="rental._id"
          :listing="rental.listing_id"
          :owner="rental.listing_id?.owner_id"
          :start-date="rental.start_date"
          :end-date="rental.end_date"
          :total-price="rental.total_price"
          :location="rental.listing_id?.location_id"
          status="upcoming"
          @view-listing="viewListing"
          @view-details="viewDetails"
        />
      </div>
    </div>

    <!-- Rental History Section -->
    <div v-if="bookings.history.length > 0" class="section">
      <h2 class="section-title">Rental History</h2>
      <p class="section-subtitle">Your completed rentals</p>
      <div class="rental-list">
        <RentalCard
          v-for="rental in bookings.history"
          :key="rental._id"
          :rental-id="rental._id"
          :listing="rental.listing_id"
          :owner="rental.listing_id?.owner_id"
          :start-date="rental.start_date"
          :end-date="rental.end_date"
          :total-price="rental.total_price"
          :location="rental.listing_id?.location_id"
          :has-review="hasReview(rental)"
          status="history"
          @view-listing="viewListing"
          @view-details="viewDetails"
          @review="reviewEquipment"
        />
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="bookings.active.length === 0 && bookings.upcoming.length === 0 && bookings.history.length === 0" class="empty-state">
      <div class="empty-icon">📦</div>
      <h3 class="empty-title">No Rentals Yet</h3>
      <p class="empty-text">You haven't rented any equipment yet. Browse available items to get started!</p>
      <button @click="browseListing" class="btn-browse">Browse Equipment</button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import RentalCard from './RentalCard.vue';

const router = useRouter();

const props = defineProps({
  stats: {
    type: Object,
    required: true,
    default: () => ({
      completedRentals: 0,
      activeRentals: 0,
      upcomingRentals: 0,
      averageRating: 0
    })
  },
  bookings: {
    type: Object,
    required: true,
    default: () => ({
      active: [],
      upcoming: [],
      history: []
    })
  }
});

const emit = defineEmits(['view-details', 'review-equipment']);

const hasReview = (booking) => {
  // Check if user has already reviewed this equipment
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

const browseListing = () => {
  router.push('/browse');
};
</script>

<style scoped>
.renting-view {
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

.stat-icon.completed {
  background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
  color: white;
}

.stat-icon.active {
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  color: white;
}

.stat-icon.upcoming {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
}

.stat-icon.rating {
  background: linear-gradient(135deg, #ffd700 0%, #ffa500 100%);
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

.section-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 0.5rem 0;
}

.section-subtitle {
  font-size: 1rem;
  color: #666;
  margin: 0 0 1.5rem 0;
}

/* Rental List */
.rental-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Rental Card */
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

.rental-card.history {
  opacity: 0.9;
}

.rental-image {
  position: relative;
  width: 250px;
  flex-shrink: 0;
  cursor: pointer;
  overflow: hidden;
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

.status-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.status-badge.active {
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  color: white;
}

.status-badge.upcoming {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
}

.status-badge.completed {
  background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
  color: white;
}

.rental-content {
  flex: 1;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
}

.rental-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 1rem 0;
}

.info-row {
  display: flex;
  margin-bottom: 0.75rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.info-label {
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.info-value {
  font-size: 0.95rem;
  color: #1a1a1a;
  font-weight: 600;
}

.info-value.highlight {
  color: #e67e22;
  font-weight: 700;
}

.info-value.price {
  color: #00AAFF;
  font-size: 1.2rem;
  font-weight: 700;
}

.rating {
  font-size: 0.9rem;
  color: #ffa500;
  font-weight: 600;
}

.days-remaining {
  background: #fff3e0;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  margin-top: 0.25rem;
}

.total-cost {
  margin-top: auto;
  padding-top: 0.5rem;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

.btn-details,
.btn-review {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-details {
  background: #00AAFF;
  color: white;
  flex: 1;
}

.btn-details:hover {
  background: #0088cc;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 170, 255, 0.3);
}

.btn-review {
  background: #ffa500;
  color: white;
}

.btn-review:hover {
  background: #ff8c00;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 165, 0, 0.3);
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

  .rental-card {
    flex-direction: column;
  }

  .rental-image {
    width: 100%;
    height: 200px;
  }

  .action-buttons {
    flex-direction: column;
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
