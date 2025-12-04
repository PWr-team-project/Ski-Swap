<template>
  <div class="payment-page">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading payment details...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <p>{{ error }}</p>
      <button @click="$router.back()" class="btn btn-secondary">Go Back</button>
    </div>

    <!-- Payment Content -->
    <div v-else-if="booking._id" class="payment-container">
      <!-- Header -->
      <div class="payment-header">
        <button @click="$router.back()" class="back-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back
        </button>
        <h1 class="payment-title">Payment</h1>
      </div>

      <!-- Payment Card -->
      <div class="payment-card">
        <!-- Booking Summary -->
        <div class="booking-summary">
          <h2 class="section-title">Booking Summary</h2>

          <div class="summary-item">
            <img
              :src="getImageUrl(booking.listing_id?.photos?.[0])"
              :alt="booking.listing_id?.title"
              class="listing-thumbnail"
              @error="handleImageError"
            />
            <div class="listing-info">
              <h3 class="listing-title">{{ booking.listing_id?.title || 'Listing' }}</h3>
              <p class="listing-category">{{ booking.listing_id?.category_id?.name || 'Equipment' }}</p>
            </div>
          </div>

          <div class="date-info">
            <div class="date-row">
              <span class="date-label">Rental Period:</span>
              <span class="date-value">{{ formatDateRange(booking.start_date, booking.end_date) }}</span>
            </div>
            <div class="date-row">
              <span class="date-label">Duration:</span>
              <span class="date-value">{{ getDuration(booking.start_date, booking.end_date) }} days</span>
            </div>
          </div>
        </div>

        <!-- Divider -->
        <div class="divider"></div>

        <!-- Insurance Selection -->
        <div class="insurance-section">
          <h2 class="section-title">Insurance</h2>
          <p class="insurance-description">
            Protect your rental with insurance coverage (6% of rental price). This covers accidental damage during the rental period.
          </p>

          <div class="insurance-options">
            <label class="insurance-option" :class="{ selected: includeInsurance }">
              <input
                type="radio"
                name="insurance"
                :value="true"
                v-model="includeInsurance"
              />
              <div class="option-content">
                <div class="option-header">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    <path d="m9 12 2 2 4-4"></path>
                  </svg>
                  <span class="option-title">With Insurance</span>
                </div>
                <p class="option-price">+€{{ insuranceAmount.toFixed(2) }}</p>
              </div>
            </label>

            <label class="insurance-option" :class="{ selected: !includeInsurance }">
              <input
                type="radio"
                name="insurance"
                :value="false"
                v-model="includeInsurance"
              />
              <div class="option-content">
                <div class="option-header">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                  <span class="option-title">No Insurance</span>
                </div>
                <p class="option-price">€0.00</p>
              </div>
            </label>
          </div>
        </div>

        <!-- Divider -->
        <div class="divider"></div>

        <!-- Price Breakdown -->
        <div class="price-breakdown">
          <h2 class="section-title">Price Breakdown</h2>

          <div class="price-row">
            <span class="price-label">Rental Price</span>
            <span class="price-value">€{{ booking.total_price?.toFixed(2) || '0.00' }}</span>
          </div>

          <div class="price-row info-row">
            <span class="price-label-small">Includes 5% service fee</span>
          </div>

          <div v-if="includeInsurance" class="price-row">
            <span class="price-label">Insurance (6%)</span>
            <span class="price-value">€{{ insuranceAmount.toFixed(2) }}</span>
          </div>

          <div class="price-row total">
            <span class="price-label">Total to Pay</span>
            <span class="price-value">€{{ totalPrice.toFixed(2) }}</span>
          </div>
        </div>

        <!-- Payment Buttons -->
        <div class="payment-actions">
          <button
            @click="handleRejectPayment"
            :disabled="processing"
            class="btn btn-reject"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Reject Payment
          </button>

          <button
            @click="handleConfirmPayment"
            :disabled="processing"
            class="btn btn-confirm"
          >
            <svg v-if="!processing" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            <div v-else class="btn-spinner"></div>
            {{ processing ? 'Processing...' : 'Confirm Payment' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { bookingService } from '@/services/bookingService';
import { getFullImageUrl } from '@/utils/api';

const route = useRoute();
const router = useRouter();

// State
const loading = ref(true);
const error = ref(null);
const processing = ref(false);
const booking = ref({});
const includeInsurance = ref(false);

// Computed
const insuranceAmount = computed(() => {
  // Calculate 6% of total price as insurance
  const rentalPrice = booking.value.total_price || 0;
  return rentalPrice * 0.06;
});

const totalPrice = computed(() => {
  // Total price already includes service fee (5%)
  const rentalPrice = booking.value.total_price || 0;
  const insurance = includeInsurance.value ? insuranceAmount.value : 0;

  return rentalPrice + insurance;
});

// Methods
const fetchBookingDetails = async () => {
  loading.value = true;
  error.value = null;

  try {
    const bookingId = route.params.id;
    const response = await bookingService.getById(bookingId);
    booking.value = response;

    // Set insurance flag from booking if it exists
    includeInsurance.value = response.insurance_flag || false;

    // Check if payment is already confirmed
    if (response.payment_confirmed) {
      error.value = 'This booking has already been paid for.';
    }
  } catch (err) {
    console.error('Error fetching booking details:', err);
    error.value = err.response?.data?.message || 'Failed to load booking details';
  } finally {
    loading.value = false;
  }
};

const handleConfirmPayment = async () => {
  if (processing.value) return;

  processing.value = true;

  try {
    // Process payment
    const response = await bookingService.processPayment(booking.value._id, {
      includeInsurance: includeInsurance.value,
      insuranceAmount: includeInsurance.value ? insuranceAmount.value : 0,
      totalAmount: totalPrice.value
    });

    console.log('Payment processed successfully:', response);

    // Show success message
    alert('Payment confirmed successfully!');

    // Navigate back to booking details
    router.push(`/booking/${booking.value._id}`);
  } catch (err) {
    console.error('Error processing payment:', err);
    console.error('Error response:', err.response);
    console.error('Error data:', err.response?.data);

    const errorMessage = err.response?.data?.message
      || err.response?.data?.error
      || err.message
      || 'Failed to process payment. Please try again.';

    alert(`Payment failed: ${errorMessage}`);
  } finally {
    processing.value = false;
  }
};

const handleRejectPayment = () => {
  if (confirm('Are you sure you want to reject this payment?')) {
    router.back();
  }
};

// Helpers
const getImageUrl = (photoPath) => {
  if (!photoPath) return '/assets/images/image.png';
  return getFullImageUrl(photoPath) || '/assets/images/image.png';
};

const handleImageError = (e) => {
  e.target.src = '/assets/images/image.png';
};

const formatDateRange = (start, end) => {
  if (!start || !end) return 'N/A';
  const startDate = new Date(start);
  const endDate = new Date(end);
  const startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${startStr} - ${endStr}`;
};

const getDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
};

// Lifecycle
onMounted(() => {
  fetchBookingDetails();
});
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.payment-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  padding: 2rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

/* Loading & Error */
.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  color: white;
}

.spinner {
  width: 50px;
  height: 50px;
  margin-bottom: 1rem;
  border: 4px solid rgba(255, 255, 255, 0.2);
  border-top-color: #00AAFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-container {
  text-align: center;
}

.error-icon {
  color: #ff4757;
  margin-bottom: 1rem;
}

.error-container p {
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
  color: #ff6b7a;
}

/* Payment Container */
.payment-container {
  max-width: 700px;
  margin: 0 auto;
}

/* Header */
.payment-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateX(-4px);
}

.payment-title {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  flex: 1;
}

/* Payment Card */
.payment-card {
  background: white;
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.section-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 1.5rem;
}

/* Booking Summary */
.booking-summary {
  margin-bottom: 2rem;
}

.summary-item {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  margin-bottom: 1.5rem;
}

.listing-thumbnail {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 12px;
  flex-shrink: 0;
}

.listing-info {
  flex: 1;
}

.listing-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.listing-category {
  font-size: 0.9rem;
  color: #666;
  background: #f3f4f6;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  display: inline-block;
}

.date-info {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.25rem;
  background: #f8fafc;
  border-radius: 12px;
}

.date-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.date-label {
  font-size: 0.9rem;
  color: #666;
  font-weight: 600;
}

.date-value {
  font-size: 0.95rem;
  color: #1a1a1a;
  font-weight: 600;
}

/* Divider */
.divider {
  height: 1px;
  background: linear-gradient(to right, transparent, #e5e7eb, transparent);
  margin: 2rem 0;
}

/* Insurance Section */
.insurance-section {
  margin-bottom: 2rem;
}

.insurance-description {
  font-size: 0.95rem;
  color: #666;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.insurance-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.insurance-option {
  display: flex;
  align-items: center;
  padding: 1.5rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.insurance-option:hover {
  border-color: #00AAFF;
  background: #f0f9ff;
}

.insurance-option.selected {
  border-color: #00AAFF;
  background: #e6f7ff;
}

.insurance-option input[type="radio"] {
  width: 20px;
  height: 20px;
  margin-right: 1rem;
  cursor: pointer;
  accent-color: #00AAFF;
}

.option-content {
  flex: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.option-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.option-header svg {
  color: #00AAFF;
}

.option-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a1a;
}

.option-price {
  font-size: 1.1rem;
  font-weight: 700;
  color: #10b981;
}

/* Price Breakdown */
.price-breakdown {
  margin-bottom: 2rem;
}

.price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.price-row:last-child {
  border-bottom: none;
}

.price-row.info-row {
  padding: 0.25rem 0;
  border-bottom: none;
}

.price-label-small {
  font-size: 0.8rem;
  color: #999;
  font-weight: 400;
  font-style: italic;
}

.price-row.total {
  padding-top: 1.25rem;
  margin-top: 0.75rem;
  border-top: 2px solid #e5e7eb;
  border-bottom: none;
}

.price-label {
  font-size: 0.95rem;
  color: #666;
  font-weight: 500;
}

.price-row.total .price-label {
  font-size: 1.1rem;
  color: #1a1a1a;
  font-weight: 700;
}

.price-value {
  font-size: 1rem;
  color: #1a1a1a;
  font-weight: 600;
}

.price-row.total .price-value {
  font-size: 1.5rem;
  color: #00AAFF;
  font-weight: 700;
}

/* Payment Actions */
.payment-actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-reject {
  background: #f3f4f6;
  color: #666;
  border: 2px solid #e5e7eb;
}

.btn-reject:hover:not(:disabled) {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-confirm {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-confirm:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

.btn-spinner {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.btn-secondary {
  background: #6b7280;
  color: white;
  padding: 0.75rem 2rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #4b5563;
  transform: translateY(-2px);
}

/* Responsive */
@media (max-width: 768px) {
  .payment-page {
    padding: 1rem;
  }

  .payment-card {
    padding: 1.5rem;
  }

  .payment-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .payment-title {
    font-size: 1.5rem;
  }

  .summary-item {
    flex-direction: column;
    text-align: center;
  }

  .listing-thumbnail {
    width: 100%;
    height: 180px;
  }

  .payment-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
