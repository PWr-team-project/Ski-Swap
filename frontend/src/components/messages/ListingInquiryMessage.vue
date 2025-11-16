<template>
  <div class="listing-inquiry-message">
    <div class="inquiry-header">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <line x1="9" y1="9" x2="15" y2="9"/>
        <line x1="9" y1="13" x2="15" y2="13"/>
        <line x1="9" y1="17" x2="13" y2="17"/>
      </svg>
      <span class="inquiry-label">Listing Inquiry</span>
    </div>

    <div class="listing-card" @click="goToListing">
      <div class="listing-image">
        <img v-if="listing.photo" :src="listing.photo" :alt="listing.title" />
        <div v-else class="no-image">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </div>
      </div>

      <div class="listing-info">
        <h4 class="listing-title">{{ listing.title }}</h4>
        <div class="listing-details">
          <span class="listing-category">{{ listing.category }}</span>
          <span class="listing-separator">•</span>
          <span class="listing-location">{{ listing.location }}</span>
        </div>
        <div class="listing-price">
          <span class="price-amount">${{ listing.dailyRate }}</span>
          <span class="price-period">/day</span>
        </div>
      </div>

      <div class="view-arrow">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
    </div>

    <p class="inquiry-message">{{ message.content }}</p>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const props = defineProps({
  message: {
    type: Object,
    required: true
  },
  listing: {
    type: Object,
    required: true
  }
})

const router = useRouter()

const goToListing = () => {
  router.push(`/listing/${props.listing._id}`)
}
</script>

<style scoped>
.listing-inquiry-message {
  background: linear-gradient(135deg, #e3f2fd 0%, #f0f7ff 100%);
  border: 2px solid #00AAFF;
  border-radius: 12px;
  padding: 1rem;
  margin: 0.5rem 0;
}

.inquiry-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  color: #00AAFF;
  font-weight: 600;
  font-size: 0.9rem;
}

.inquiry-header svg {
  flex-shrink: 0;
}

.inquiry-label {
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.listing-card {
  background: white;
  border-radius: 10px;
  padding: 0.75rem;
  display: flex;
  gap: 0.75rem;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.listing-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 170, 255, 0.2);
}

.listing-image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.listing-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.no-image {
  color: #ccc;
}

.listing-info {
  flex: 1;
  min-width: 0;
}

.listing-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 0.5rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.listing-details {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.listing-category {
  font-weight: 500;
}

.listing-separator {
  color: #ccc;
}

.listing-location {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.listing-price {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
}

.price-amount {
  font-size: 1.1rem;
  font-weight: 700;
  color: #00AAFF;
}

.price-period {
  font-size: 0.85rem;
  color: #666;
}

.view-arrow {
  color: #00AAFF;
  flex-shrink: 0;
}

.inquiry-message {
  margin: 0;
  font-size: 0.95rem;
  color: #555;
  line-height: 1.5;
}

@media (max-width: 600px) {
  .listing-card {
    flex-direction: column;
    align-items: stretch;
  }

  .listing-image {
    width: 100%;
    height: 120px;
  }

  .view-arrow {
    align-self: flex-end;
  }

  .listing-details {
    flex-wrap: wrap;
  }
}
</style>
