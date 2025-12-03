<template>
  <div class="booking-details-page">
    <div class="main-content">
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="spinner"></div>
        <p>Loading booking details...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-container">
        <p>{{ error }}</p>
        <button @click="fetchBookingDetails" class="retry-btn">Retry</button>
      </div>

      <!-- Main Content -->
      <div v-else-if="booking._id" class="booking-container">
        <!-- Header with Booking Number -->
        <div class="booking-header">
          <h1 class="booking-number">Booking #{{ booking._id.slice(-8).toUpperCase() }}</h1>
        </div>

        <!-- Need Help Button - Fixed to top right -->
        <button
          v-if="showNeedHelp"
          @click="handleNeedHelp"
          class="btn-help-fixed"
        >
          Need Help
        </button>

        <!-- Two Column Layout (Equal Width) -->
        <div class="content-grid">
          <!-- LEFT COLUMN -->
          <div class="left-column">
            <!-- Status Bar -->
            <div class="card">
              <BookingProgressBar
                :status="currentStatus"
                :is-owner="!isRenter"
              />
            </div>

            <!-- Merged Equipment & Owner Card -->
            <div class="card merged-info-card">
              <!-- Left Side: Equipment -->
              <div class="merged-section equipment-section" @click="navigateToListing">
                <div class="equipment-content">
                  <img
                    :src="getImageUrl(booking.listing_id?.photos?.[0])"
                    :alt="booking.listing_id?.title"
                    class="equipment-thumbnail"
                    @error="handleImageError"
                  />
                  <div class="equipment-info">
                    <h4 class="equipment-title">{{ booking.listing_id?.title || 'Listing Unavailable' }}</h4>
                    <p class="equipment-category">{{ booking.listing_id?.category_id?.name || 'Category' }}</p>
                  </div>
                </div>
              </div>

              <!-- Divider -->
              <div class="merged-divider"></div>

              <!-- Right Side: Owner/Renter -->
              <div class="merged-section owner-section" @click="navigateToProfile">
                <div class="owner-content">
                  <div class="user-avatar" v-if="otherUser.profile_photo">
                    <img :src="getImageUrl(otherUser.profile_photo)" :alt="otherUserName" />
                  </div>
                  <div v-else class="user-avatar avatar-placeholder">
                    {{ otherUserInitial }}
                  </div>
                  <div class="user-info">
                    <h4 class="user-name">{{ otherUserName }}</h4>
                    <p class="user-role">{{ isRenter ? 'Owner' : 'Renter' }}</p>
                    <div class="user-rating" v-if="otherUser.rating_avg">
                      <div class="stars">
                        <img
                          v-for="star in 5"
                          :key="star"
                          :src="star <= Math.floor(otherUser.rating_avg) ? '/assets/icons/star_icon.svg' : '/assets/icons/star_empty.svg'"
                          alt="star"
                          class="star-icon"
                        />
                      </div>
                      <span class="rating-text">{{ otherUser.rating_avg.toFixed(1) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Location Panel (when visible) -->
            <div v-if="showLocationPanel" class="card location-card">
              <h4 class="card-title">Location</h4>
              <div class="location-info">
                <div class="location-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </div>
                <div class="location-text">{{ fullAddress }}</div>
              </div>
              <div v-if="showContactInfo" class="phone-info">
                <div class="phone-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                </div>
                <div class="phone-text">{{ otherUserPhone }}</div>
              </div>
            </div>

            <!-- Insurance Info (if applicable) -->
            <div v-if="booking.insurance_flag" class="card insurance-card">
              <div class="insurance-content">
                <div class="insurance-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                  </svg>
                </div>
                <div>
                  <div class="insurance-label">Insurance Purchased</div>
                  <div class="insurance-value">Coverage included</div>
                </div>
              </div>
            </div>

            <!-- 3 Info Blocks in One Row -->
            <div class="info-blocks">
              <!-- Rental Period -->
              <div class="info-block">
                <div class="block-label">Rental Period</div>
                <div class="block-value">{{ formatDateRange(booking.start_date, booking.end_date) }}</div>
                <div class="block-subtext">{{ getDuration(booking.start_date, booking.end_date) }} days</div>
              </div>

              <!-- Payment Status -->
              <div class="info-block">
                <div class="block-label">Payment Status</div>
                <div class="block-value" :class="paymentStatusClass">{{ paymentStatusText }}</div>
                <div class="block-subtext">{{ paymentSubtext }}</div>
              </div>

              <!-- Total Price -->
              <div class="info-block">
                <div class="block-label">{{ isRenter ? 'Total Price' : 'Total Earnings' }}</div>
                <div class="block-value price">€{{ booking.total_price?.toFixed(2) || '0.00' }}</div>
                <div class="block-subtext">incl. booking fee</div>
              </div>
            </div>

            <!-- Action Buttons (Dynamic based on state) -->
            <div class="action-buttons">
              <!-- RENTER BUTTONS -->
              <template v-if="isRenter">
                <!-- Pay Button - PENDING, ACCEPTED (green) -->
                <button
                  v-if="showPayButton"
                  @click="handlePayment"
                  class="btn btn-success"
                >
                  Pay Now
                </button>

                <!-- Cancel Button - PENDING, ACCEPTED (red) -->
                <button
                  v-if="showCancelButton"
                  @click="handleCancel"
                  class="btn btn-danger"
                >
                  Cancel
                </button>

                <!-- Upload Photos - PICKUP, PICKUP_OWNER, RETURN, RETURN_OWNER (grey) -->
                <button
                  v-if="showRenterUploadPhotos"
                  @click="openPhotoModal(photoUploadTypeForRenter)"
                  :class="[
                    'btn',
                    (photoUploadTypeForRenter === 'pickup' && hasPickupPhotos) ||
                    (photoUploadTypeForRenter === 'return' && hasReturnPhotos)
                      ? 'btn-photos-uploaded'
                      : 'btn-secondary'
                  ]"
                >
                  <span v-if="(photoUploadTypeForRenter === 'pickup' && hasPickupPhotos) || (photoUploadTypeForRenter === 'return' && hasReturnPhotos)">
                    ✓ Photos Uploaded
                  </span>
                  <span v-else>Upload Photos</span>
                </button>

                <!-- Confirm Handoff - PICKUP, PICKUP_OWNER (green) -->
                <button
                  v-if="showRenterConfirmHandoff"
                  @click="handleRenterConfirmHandoff"
                  :disabled="!canConfirmHandoff"
                  :title="!canConfirmHandoff ? 'Please upload pickup photos first' : ''"
                  class="btn btn-success"
                >
                  Confirm Pickup
                </button>

                <!-- Confirm Return - RETURN, RETURN_OWNER (green) -->
                <button
                  v-if="showRenterConfirmReturn"
                  @click="handleRenterConfirmReturn"
                  :disabled="!canConfirmReturn"
                  :title="!canConfirmReturn ? 'Please upload return photos first' : ''"
                  class="btn btn-success"
                >
                  Confirm Return
                </button>

                <!-- Review - COMPLETED (purple) -->
                <button
                  v-if="showRenterReview"
                  @click="handleReview"
                  class="btn btn-review"
                >
                  Write Review
                </button>

                <!-- Rent Again - REVIEWED, CANCELLED (green) -->
                <button
                  v-if="showRenterRentAgain"
                  @click="navigateToListing"
                  class="btn btn-success"
                >
                  Rent Again
                </button>

                <!-- Contact Support - DISPUTED (light red) -->
                <button
                  v-if="showRenterContactSupport"
                  @click="handleContactSupport"
                  class="btn btn-support"
                >
                  Contact Support
                </button>
              </template>

              <!-- OWNER BUTTONS -->
              <template v-else>
                <!-- Accept - PENDING (green) -->
                <button
                  v-if="showOwnerAccept"
                  @click="handleAccept"
                  class="btn btn-success"
                >
                  Accept
                </button>

                <!-- Decline - PENDING (red) -->
                <button
                  v-if="showOwnerDecline"
                  @click="handleDecline"
                  class="btn btn-danger"
                >
                  Decline
                </button>

                <!-- Cancel - ACCEPTED (red) -->
                <button
                  v-if="showOwnerCancel"
                  @click="handleCancel"
                  class="btn btn-danger"
                >
                  Cancel
                </button>

                <!-- Confirm (Handoff) - PICKUP, PICKUP_RENTER (green) -->
                <button
                  v-if="showOwnerConfirmHandoff"
                  @click="handleOwnerConfirmHandoff"
                  class="btn btn-success"
                >
                  Confirm Hand-off
                </button>

                <!-- Confirm Return - RETURN (green) -->
                <button
                  v-if="showOwnerConfirmReturn"
                  @click="handleOwnerConfirmReturn"
                  class="btn btn-success"
                >
                  Confirm Return
                </button>

                <!-- Everything OK - RETURN_RENTER, RETURN_OWNER (green) -->
                <button
                  v-if="showOwnerEverythingOK"
                  @click="handleEverythingOK"
                  class="btn btn-success"
                >
                  Everything OK
                </button>

                <!-- Upload Photos - RETURN_RENTER, RETURN_OWNER (grey) -->
                <button
                  v-if="showOwnerUploadPhotos"
                  @click="openPhotoModal('return')"
                  class="btn btn-secondary"
                >
                  Upload Photos
                </button>

                <!-- Something Wrong - RETURN_RENTER, RETURN_OWNER (light red) -->
                <button
                  v-if="showOwnerSomethingWrong"
                  @click="handleDispute"
                  class="btn btn-dispute"
                >
                  Something's Wrong
                </button>

                <!-- Contact Support - DISPUTED (light red) -->
                <button
                  v-if="showOwnerContactSupport"
                  @click="handleContactSupport"
                  class="btn btn-support"
                >
                  Contact Support
                </button>

                <!-- Show Review - REVIEWED (violet) -->
                <button
                  v-if="showOwnerShowReview"
                  @click="handleShowReview"
                  class="btn btn-review"
                >
                  Show Review
                </button>
              </template>
            </div>
          </div>

          <!-- RIGHT COLUMN - Placeholder for future implementation -->
          <div class="right-column">
            <div class="placeholder-card">
              <div class="placeholder-content">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <h3>Chat & Activity</h3>
                <p>Coming soon...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Photo Upload Modal -->
    <div v-if="showPhotoModal" class="modal-overlay" @click.self="closePhotoModal">
      <div class="modal-content photo-modal">
        <div class="modal-header">
          <h3>{{ photoModalTitle }}</h3>
          <button @click="closePhotoModal" class="modal-close">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <p class="modal-description">
            {{ photoModalDescription }}
          </p>

          <!-- Previously Uploaded Photos -->
          <div v-if="existingPhotos.length > 0" class="existing-photos-section">
            <h4 class="existing-photos-title">Previously Uploaded Photos</h4>
            <div class="photos-preview">
              <div v-for="(photo, index) in existingPhotos" :key="`existing-${index}`" class="photo-preview-item existing-photo">
                <img :src="getImageUrl(photo)" :alt="`Uploaded Photo ${index + 1}`" />
                <div class="existing-photo-badge">✓</div>
              </div>
            </div>
          </div>

          <!-- File Input -->
          <div class="file-upload-area" @click="triggerFileInput">
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              multiple
              @change="handleFileSelect"
              style="display: none;"
            />
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            <p>{{ existingPhotos.length > 0 ? 'Click to upload additional photos' : 'Click to upload photos' }}</p>
            <p class="upload-hint">or drag and drop (max 10 photos)</p>
          </div>

          <!-- Selected Photos Preview -->
          <div v-if="selectedPhotos.length > 0" class="new-photos-section">
            <h4 class="new-photos-title">New Photos to Upload</h4>
            <div class="photos-preview">
              <div v-for="(photo, index) in selectedPhotos" :key="index" class="photo-preview-item">
                <img :src="photo.preview" :alt="`Photo ${index + 1}`" />
                <button @click="removePhoto(index)" class="remove-photo-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closePhotoModal" class="btn btn-secondary">Cancel</button>
          <button
            @click="uploadPhotos"
            :disabled="selectedPhotos.length === 0 || uploadingPhotos"
            class="btn btn-primary"
          >
            {{ uploadingPhotos ? 'Uploading...' : 'Upload Photos' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import { bookingService } from '@/services/bookingService';
import BookingProgressBar from '../components/BookingProgressBar.vue';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// State
const loading = ref(true);
const error = ref(null);
const booking = ref({});
const currentStatus = ref('PENDING');
const statusHistory = ref([]);
const statusRequirements = ref({});

// Photo Modal
const showPhotoModal = ref(false);
const photoUploadType = ref('pickup');
const selectedPhotos = ref([]);
const uploadingPhotos = ref(false);
const fileInput = ref(null);

// Track if photos have been uploaded for current session
const pickupPhotosUploaded = ref(false);
const returnPhotosUploaded = ref(false);

// Store existing uploaded photos
const existingPhotos = ref([]);

// Computed
const isRenter = computed(() => {
  if (!booking.value || !booking.value.renter_id) return false;
  return booking.value.renter_id._id === authStore.user?.id || booking.value.renter_id === authStore.user?.id;
});

const otherUser = computed(() => {
  if (!booking.value) return {};
  if (isRenter.value) {
    return booking.value.listing_id?.owner_id || {};
  } else {
    return booking.value.renter_id || {};
  }
});

const otherUserName = computed(() => {
  if (!otherUser.value || Object.keys(otherUser.value).length === 0) return 'Unknown';
  const fullName = `${otherUser.value.first_name || ''} ${otherUser.value.last_name || ''}`.trim();
  return fullName || otherUser.value.nickname || otherUser.value.email || 'Unknown';
});

const otherUserInitial = computed(() => {
  if (!otherUser.value || Object.keys(otherUser.value).length === 0) return 'U';
  const name = otherUser.value.nickname || otherUser.value.first_name || otherUser.value.email || 'U';
  return name.charAt(0).toUpperCase();
});

const otherUserPhone = computed(() => {
  return otherUser.value?.phone || 'Not provided';
});

const locationInfo = computed(() => {
  return booking.value?.listing_id?.location_id || {};
});

const fullAddress = computed(() => {
  const loc = locationInfo.value;
  if (!loc || !loc.city) return 'Address not available';
  const parts = [];
  if (loc.street) parts.push(loc.street);
  if (loc.postal_code) parts.push(loc.postal_code);
  if (loc.city) parts.push(loc.city);
  if (loc.country) parts.push(loc.country);
  return parts.join(', ');
});

// Payment Status
const paymentStatusText = computed(() => {
  if (booking.value.payment_confirmed) return 'Paid';
  return 'Pending';
});

const paymentStatusClass = computed(() => {
  return booking.value.payment_confirmed ? 'status-paid' : 'status-unpaid';
});

const paymentSubtext = computed(() => {
  if (booking.value.payment_confirmed) {
    return 'Payment received';
  }
  return 'Awaiting payment';
});

// Show contact info
const showContactInfo = computed(() => {
  return statusRequirements.value.showContactInfo;
});

// Location panel visibility based on state requirements
const showLocationPanel = computed(() => {
  return statusRequirements.value.showLocation;
});

// Photo upload type for renter
const photoUploadTypeForRenter = computed(() => {
  if (['PICKUP', 'PICKUP_OWNER'].includes(currentStatus.value)) {
    return 'pickup';
  }
  return 'return';
});

// Check if photos have been uploaded (from backend or current session)
const hasPickupPhotos = computed(() => {
  return pickupPhotosUploaded.value ||
         (booking.value.pickup_photos && booking.value.pickup_photos.length > 0);
});

const hasReturnPhotos = computed(() => {
  return returnPhotosUploaded.value ||
         (booking.value.return_photos && booking.value.return_photos.length > 0);
});

// Can confirm handoff/return only if photos are uploaded
const canConfirmHandoff = computed(() => {
  return hasPickupPhotos.value;
});

const canConfirmReturn = computed(() => {
  return hasReturnPhotos.value;
});

// ===============================
// RENTER BUTTON VISIBILITY
// ===============================

// Pay - PENDING, ACCEPTED (green)
const showPayButton = computed(() => {
  return isRenter.value &&
         ['PENDING', 'ACCEPTED'].includes(currentStatus.value) &&
         !booking.value.payment_confirmed;
});

// Cancel - PENDING, ACCEPTED (red)
const showCancelButton = computed(() => {
  return isRenter.value && ['PENDING', 'ACCEPTED'].includes(currentStatus.value);
});

// Upload Photos - PICKUP, PICKUP_OWNER, RETURN, RETURN_OWNER (grey)
const showRenterUploadPhotos = computed(() => {
  return isRenter.value && ['PICKUP', 'PICKUP_OWNER', 'RETURN', 'RETURN_OWNER'].includes(currentStatus.value);
});

// Confirm Handoff - PICKUP, PICKUP_OWNER (green) -> goes to PICKUP_RENTER or IN_PROGRESS
const showRenterConfirmHandoff = computed(() => {
  return isRenter.value && ['PICKUP', 'PICKUP_OWNER'].includes(currentStatus.value);
});

// Confirm Return - RETURN, RETURN_OWNER (green) -> goes to RETURN_RENTER or COMPLETED
const showRenterConfirmReturn = computed(() => {
  return isRenter.value && ['RETURN', 'RETURN_OWNER'].includes(currentStatus.value);
});

// Review - COMPLETED (purple)
const showRenterReview = computed(() => {
  return isRenter.value && currentStatus.value === 'COMPLETED';
});

// Rent Again - REVIEWED, CANCELLED (green)
const showRenterRentAgain = computed(() => {
  return isRenter.value && ['REVIEWED', 'CANCELLED'].includes(currentStatus.value);
});

// Contact Support - DISPUTED (light red)
const showRenterContactSupport = computed(() => {
  return isRenter.value && currentStatus.value === 'DISPUTED';
});

// ===============================
// OWNER BUTTON VISIBILITY
// ===============================

// Accept - PENDING (green)
const showOwnerAccept = computed(() => {
  return !isRenter.value && currentStatus.value === 'PENDING';
});

// Decline - PENDING (red)
const showOwnerDecline = computed(() => {
  return !isRenter.value && currentStatus.value === 'PENDING';
});

// Cancel - ACCEPTED (red)
const showOwnerCancel = computed(() => {
  return !isRenter.value && currentStatus.value === 'ACCEPTED';
});

// Confirm Hand-off - PICKUP, PICKUP_RENTER (green) -> goes to PICKUP_OWNER or IN_PROGRESS
const showOwnerConfirmHandoff = computed(() => {
  return !isRenter.value && ['PICKUP', 'PICKUP_RENTER'].includes(currentStatus.value);
});

// Confirm Return - RETURN (green) -> goes to RETURN_OWNER
const showOwnerConfirmReturn = computed(() => {
  return !isRenter.value && currentStatus.value === 'RETURN';
});

// Everything OK - RETURN_RENTER, RETURN_OWNER (green) -> goes to COMPLETED
const showOwnerEverythingOK = computed(() => {
  return !isRenter.value && ['RETURN_RENTER', 'RETURN_OWNER'].includes(currentStatus.value);
});

// Upload Photos - RETURN_RENTER, RETURN_OWNER (grey)
const showOwnerUploadPhotos = computed(() => {
  return !isRenter.value && ['RETURN_RENTER', 'RETURN_OWNER'].includes(currentStatus.value);
});

// Something Wrong - RETURN_RENTER, RETURN_OWNER (light red) -> goes to DISPUTED
const showOwnerSomethingWrong = computed(() => {
  return !isRenter.value && ['RETURN_RENTER', 'RETURN_OWNER'].includes(currentStatus.value);
});

// Contact Support - DISPUTED (light red)
const showOwnerContactSupport = computed(() => {
  return !isRenter.value && currentStatus.value === 'DISPUTED';
});

// Show Review - REVIEWED (violet)
const showOwnerShowReview = computed(() => {
  return !isRenter.value && currentStatus.value === 'REVIEWED';
});

// Need Help - Most states except DISPUTED, DISPUTE_RESOLVED
const showNeedHelp = computed(() => {
  const hiddenStates = ['DISPUTED', 'DISPUTE_RESOLVED'];
  return !hiddenStates.includes(currentStatus.value);
});

// Photo Modal
const photoModalTitle = computed(() => {
  return photoUploadType.value === 'pickup' ? 'Upload Pickup Photos' : 'Upload Return Photos';
});

const photoModalDescription = computed(() => {
  return photoUploadType.value === 'pickup'
    ? 'Please upload photos of the equipment condition at pickup. This helps protect both parties in case of disputes.'
    : 'Please upload photos of the equipment condition at return. This helps verify the equipment was returned in good condition.';
});

// Methods
const fetchBookingDetails = async () => {
  loading.value = true;
  error.value = null;

  try {
    const bookingId = route.params.id;
    const response = await bookingService.getById(bookingId);
    booking.value = response;

    // Fetch current status and requirements
    await fetchStatusInfo();

    // Fetch status history
    await fetchStatusHistory();
  } catch (err) {
    console.error('Error fetching booking details:', err);
    error.value = err.response?.data?.message || 'Failed to load booking details';
  } finally {
    loading.value = false;
  }
};

const fetchStatusInfo = async () => {
  try {
    const response = await bookingService.getCurrentStatus(booking.value._id);
    currentStatus.value = response.currentStatus;
    statusRequirements.value = response.requirements;
  } catch (err) {
    console.error('Error fetching status info:', err);
  }
};

const fetchStatusHistory = async () => {
  try {
    const response = await bookingService.getStatusHistory(booking.value._id);
    statusHistory.value = response.history;
  } catch (err) {
    console.error('Error fetching status history:', err);
  }
};

// Action Handlers
const handlePayment = () => {
  if (booking.value._id) {
    router.push(`/payment/${booking.value._id}`);
  }
};

const handleAccept = async () => {
  if (!confirm('Accept this booking request?')) return;

  try {
    await bookingService.acceptBooking(booking.value._id);
    alert('Booking accepted!');
    await fetchBookingDetails();
  } catch (err) {
    console.error('Error accepting booking:', err);
    alert(err.response?.data?.message || 'Failed to accept booking.');
  }
};

const handleDecline = async () => {
  const reason = prompt('Reason for declining (optional):');
  if (reason === null) return;

  try {
    await bookingService.declineBooking(booking.value._id, reason);
    alert('Booking declined.');
    await fetchBookingDetails();
  } catch (err) {
    console.error('Error declining booking:', err);
    alert(err.response?.data?.message || 'Failed to decline booking.');
  }
};

const handleCancel = async () => {
  const reason = prompt('Reason for cancellation (optional):');
  if (reason === null) return;

  try {
    await bookingService.cancelBooking(booking.value._id, reason);
    alert('Booking cancelled.');
    await fetchBookingDetails();
  } catch (err) {
    console.error('Error cancelling booking:', err);
    alert(err.response?.data?.message || 'Failed to cancel booking.');
  }
};

// Renter confirms handoff -> PICKUP_RENTER or IN_PROGRESS
const handleRenterConfirmHandoff = async () => {
  // Check if pickup photos have been uploaded
  if (!hasPickupPhotos.value) {
    alert('Please upload pickup photos before confirming handoff.');
    return;
  }

  if (!confirm('Confirm you have received the equipment?')) return;

  try {
    // Use dedicated renter pickup confirmation endpoint
    // Will transition: PICKUP -> PICKUP_RENTER or PICKUP_OWNER -> IN_PROGRESS
    await bookingService.confirmPickup(booking.value._id);
    alert('Handoff confirmed!');
    await fetchBookingDetails();
  } catch (err) {
    console.error('Error confirming handoff:', err);
    alert(err.response?.data?.message || 'Failed to confirm handoff.');
  }
};

// Owner confirms handoff -> PICKUP_OWNER or IN_PROGRESS
const handleOwnerConfirmHandoff = async () => {
  if (!confirm('Confirm you have handed off the equipment?')) return;

  try {
    // Use dedicated owner handoff confirmation endpoint
    // Will transition: PICKUP -> PICKUP_OWNER or PICKUP_RENTER -> IN_PROGRESS
    await bookingService.ownerConfirmHandoff(booking.value._id);
    alert('Handoff confirmed!');
    await fetchBookingDetails();
  } catch (err) {
    console.error('Error confirming handoff:', err);
    alert(err.response?.data?.message || 'Failed to confirm handoff.');
  }
};

// Renter confirms return -> RETURN_RENTER (owner still needs to verify)
const handleRenterConfirmReturn = async () => {
  // Check if return photos have been uploaded
  if (!hasReturnPhotos.value) {
    alert('Please upload return photos before confirming return.');
    return;
  }

  if (!confirm('Confirm you have returned the equipment?')) return;

  try {
    // Use dedicated renter return confirmation endpoint
    // Will transition: RETURN -> RETURN_RENTER (owner needs to verify condition)
    // Note: Renter cannot confirm from RETURN_OWNER state (owner is verifying)
    await bookingService.confirmReturn(booking.value._id);
    alert('Return confirmed! Waiting for owner verification.');
    await fetchBookingDetails();
  } catch (err) {
    console.error('Error confirming return:', err);
    alert(err.response?.data?.message || 'Failed to confirm return.');
  }
};

// Owner confirms return -> RETURN_OWNER (then needs to verify condition)
const handleOwnerConfirmReturn = async () => {
  if (!confirm('Confirm equipment has been returned?')) return;

  try {
    // Use dedicated owner return confirmation endpoint
    // Will transition: RETURN -> RETURN_OWNER (owner needs to verify condition)
    await bookingService.ownerConfirmReturn(booking.value._id);
    alert('Return confirmed! Please verify equipment condition.');
    await fetchBookingDetails();
  } catch (err) {
    console.error('Error confirming return:', err);
    alert(err.response?.data?.message || 'Failed to confirm return.');
  }
};

// Owner confirms everything is OK -> COMPLETED
const handleEverythingOK = async () => {
  if (!confirm("Confirm equipment is in good condition?")) return;

  try {
    // Use dedicated verify complete endpoint
    // Will transition: RETURN_OWNER -> COMPLETED or RETURN_RENTER -> COMPLETED
    await bookingService.verifyComplete(booking.value._id);
    alert('Booking completed!');
    await fetchBookingDetails();
  } catch (err) {
    console.error('Error completing booking:', err);
    alert(err.response?.data?.message || 'Failed to complete booking.');
  }
};

const handleDispute = async () => {
  const reason = prompt('Please describe the issue:');
  if (!reason) return;

  try {
    // Use dedicated dispute endpoint
    // Will transition: RETURN_OWNER -> DISPUTED or RETURN_RENTER -> DISPUTED
    await bookingService.openDispute(booking.value._id, reason);
    alert('Dispute opened. Our support team will contact you.');
    await fetchBookingDetails();
  } catch (err) {
    console.error('Error opening dispute:', err);
    alert(err.response?.data?.message || 'Failed to open dispute.');
  }
};

const handleReview = () => {
  alert('Review functionality - To be implemented');
};

const handleShowReview = () => {
  alert('Show review functionality - To be implemented');
};

const handleContactSupport = () => {
  alert('Contact support functionality - To be implemented');
};

const handleNeedHelp = () => {
  alert('Need help functionality - To be implemented');
};

// Photo Upload Modal
const openPhotoModal = (type) => {
  photoUploadType.value = type;
  selectedPhotos.value = [];

  // Load existing photos for this type
  if (type === 'pickup' && booking.value.pickup_photos) {
    existingPhotos.value = booking.value.pickup_photos;
  } else if (type === 'return' && booking.value.return_photos) {
    existingPhotos.value = booking.value.return_photos;
  } else {
    existingPhotos.value = [];
  }

  showPhotoModal.value = true;
};

const closePhotoModal = () => {
  showPhotoModal.value = false;
  selectedPhotos.value = [];
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelect = (event) => {
  const files = Array.from(event.target.files);
  if (files.length + selectedPhotos.value.length > 10) {
    alert('Maximum 10 photos allowed');
    return;
  }

  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      selectedPhotos.value.push({
        file: file,
        preview: e.target.result
      });
    };
    reader.readAsDataURL(file);
  });

  event.target.value = '';
};

const removePhoto = (index) => {
  selectedPhotos.value.splice(index, 1);
};

const uploadPhotos = async () => {
  if (selectedPhotos.value.length === 0) return;

  uploadingPhotos.value = true;

  try {
    const files = selectedPhotos.value.map(p => p.file);
    await bookingService.uploadPhotos(booking.value._id, photoUploadType.value, files);

    // Track that photos have been uploaded
    if (photoUploadType.value === 'pickup') {
      pickupPhotosUploaded.value = true;
    } else {
      returnPhotosUploaded.value = true;
    }

    alert('Photos uploaded successfully!');
    closePhotoModal();
    await fetchBookingDetails();
  } catch (err) {
    console.error('Error uploading photos:', err);
    alert(err.response?.data?.message || 'Failed to upload photos.');
  } finally {
    uploadingPhotos.value = false;
  }
};

// Helpers
const getImageUrl = (photoPath) => {
  if (!photoPath) return '/assets/images/image.png';
  if (photoPath.startsWith('http')) return photoPath;
  return `http://localhost:5000${photoPath}`;
};

const handleImageError = (e) => {
  e.target.src = '/assets/images/image.png';
};

const formatDateRange = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  const sameMonth = startDate.getMonth() === endDate.getMonth();
  const sameYear = startDate.getFullYear() === endDate.getFullYear();

  if (sameMonth && sameYear) {
    return `${startDate.getDate()}-${endDate.getDate()} ${startDate.toLocaleDateString('en-US', { month: 'short' })}`;
  } else if (sameYear) {
    return `${startDate.getDate()} ${startDate.toLocaleDateString('en-US', { month: 'short' })} - ${endDate.getDate()} ${endDate.toLocaleDateString('en-US', { month: 'short' })}`;
  } else {
    return `${startDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }
};

const getDuration = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
};

const navigateToListing = () => {
  if (booking.value.listing_id?._id) {
    router.push(`/listing/${booking.value.listing_id._id}`);
  }
};

const navigateToProfile = () => {
  if (otherUser.value._id) {
    router.push(`/user/${otherUser.value._id}`);
  }
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

.booking-details-page {
  width: 100%;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: linear-gradient(135deg, #f0f7ff 0%, #e3f2fd 100%);
  padding-bottom: 3rem;
}

.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

/* Loading & Error */
.loading-container,
.error-container {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 170, 255, 0.1);
  margin-top: 2rem;
}

.spinner {
  width: 50px;
  height: 50px;
  margin: 0 auto 1rem;
  border: 4px solid #e3f2fd;
  border-top-color: #00AAFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-container p {
  color: #ff4757;
  font-size: 1.1rem;
  margin-bottom: 1rem;
}

.retry-btn {
  padding: 0.75rem 2rem;
  background: #00AAFF;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background: #0088cc;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 170, 255, 0.3);
}
/* Booking Container */
.booking-container {
  position: relative;
}

/* Header */
.booking-header {
  text-align: center;
  margin-bottom: 2rem;
}


.booking-number {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1a1a1a;
}
/* Fixed Need Help Button - Top Right */
.btn-help-fixed {
  position: absolute;
  top: 0;
  right: 0;
  padding: 0.875rem 1.5rem;
  background: #fca5a5;
  color: #991b1b;
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(252, 165, 165, 0.3);
}

.btn-help-fixed:hover {
  background: #f87171;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(248, 113, 113, 0.4);
}

/* Content Grid - Equal Width */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: start;
}

/* LEFT COLUMN */
.left-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.card {
  background: white;
  border-radius: 15px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 170, 255, 0.1);
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 1rem;
}

/* Merged Info Card */
.merged-info-card {
  display: flex;
  align-items: center;
  padding: 0; /* Remove default padding to control inner sections */
  overflow: hidden; /* Ensure rounded corners */
}

.merged-section {
  flex: 1;
  padding: 1.5rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.merged-section:hover {
  background-color: #f8fafc;
}

.merged-divider {
  width: 1px;
  height: 60px; /* Or auto/100% depending on alignment */
  background-color: #e5e7eb;
  margin: 0;
}

/* Equipment Section Specifics */
.equipment-content {
  display: flex;
  gap: 1rem;
  align-items: center;
}

/* Owner Section Specifics */
.owner-content {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: flex-end;
}
.owner-content {
  justify-content: flex-start;
}


/* Info Blocks */
.equipment-thumbnail {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  flex-shrink: 0;
}

.equipment-info {
  flex: 1;
}

.equipment-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 0.25rem;
}

.equipment-category {
  font-size: 0.85rem;
  color: #666;
}

.user-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #00AAFF;
  flex-shrink: 0;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  background: linear-gradient(135deg, #00AAFF 0%, #66D1FF 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 600;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 0.25rem;
}

.user-role {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.user-rating {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stars {
  display: flex;
  gap: 0.15rem;
}

.star-icon {
  width: 14px;
  height: 14px;
}

.rating-text {
  font-size: 0.85rem;
  color: #666;
  font-weight: 600;
}
.info-blocks {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.info-block {
  background: white;
  border-radius: 15px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 170, 255, 0.1);
  text-align: center;
}

.block-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.block-value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 0.25rem;
}

.block-value.price {
  font-size: 1.5rem;
  color: #10b981;
}

.block-value.status-paid {
  color: #10b981;
}

.block-value.status-unpaid {
  color: #f59e0b;
}

.block-subtext {
  font-size: 0.75rem;
  color: #999;
}

/* Insurance Card */
.insurance-card {
  background: #f0fdf4;
  border-color: #86efac;
}

.insurance-content {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.insurance-icon {
  width: 40px;
  height: 40px;
  background: #10b981;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.insurance-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #065f46;
}

.insurance-value {
  font-size: 0.75rem;
  color: #047857;
}

/* Location Card */
.location-card {
  background: #eff6ff;
  border-color: #93c5fd;
}

.location-info,
.phone-info {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 0.75rem;
}

.phone-info {
  margin-bottom: 0;
}

.location-icon,
.phone-icon {
  width: 36px;
  height: 36px;
  background: #3b82f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.location-icon svg,
.phone-icon svg {
  width: 18px;
  height: 18px;
}

.location-text,
.phone-text {
  font-size: 0.9rem;
  color: #1e40af;
}

.phone-text {
  font-weight: 600;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
  min-width: 140px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: linear-gradient(135deg, #00AAFF 0%, #0088cc 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 170, 255, 0.4);
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover {
  background: #059669;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
  transform: translateY(-2px);
}

.btn-photos-uploaded {
  background: #10b981;
  color: white;
}

.btn-photos-uploaded:hover {
  background: #059669;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-review {
  background: #8b5cf6;
  color: white;
}

.btn-review:hover {
  background: #7c3aed;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.btn-dispute {
  background: #fca5a5;
  color: #991b1b;
}

.btn-dispute:hover {
  background: #f87171;
  transform: translateY(-2px);
}

.btn-support {
  background: #fca5a5;
  color: #991b1b;
}

.btn-support:hover {
  background: #f87171;
  transform: translateY(-2px);
}

.btn-help {
  background: #fca5a5;
  color: #991b1b;
}

.btn-help:hover {
  background: #f87171;
  transform: translateY(-2px);
}

/* RIGHT COLUMN - Placeholder */
.right-column {
  position: sticky;
  top: 2rem;
  height: calc(100vh - 4rem);
}

.placeholder-card {
  background: white;
  border-radius: 15px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 2px dashed #d1d5db;
}

.placeholder-content {
  text-align: center;
  color: #9ca3af;
}

.placeholder-content svg {
  margin-bottom: 1rem;
}

.placeholder-content h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.placeholder-content p {
  font-size: 0.9rem;
}

/* Photo Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.modal-close {
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.modal-close:hover {
  background: #f3f4f6;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.modal-description {
  font-size: 0.9rem;
  color: #666;
  line-height: 1.5;
  margin-bottom: 1.5rem;
}

.existing-photos-section {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f0fdf4;
  border-radius: 12px;
  border: 1px solid #86efac;
}

.existing-photos-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #065f46;
  margin-bottom: 1rem;
}

.existing-photo {
  position: relative;
  opacity: 0.9;
}

.existing-photo-badge {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  width: 24px;
  height: 24px;
  background: #10b981;
  border-radius: 50%;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: bold;
}

.new-photos-section {
  margin-top: 1.5rem;
}

.new-photos-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 1rem;
}

.file-upload-area {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.file-upload-area:hover {
  border-color: #00AAFF;
  background: #f0f9ff;
}

.file-upload-area svg {
  color: #00AAFF;
  margin-bottom: 1rem;
}

.file-upload-area p {
  font-size: 1rem;
  color: #1a1a1a;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.upload-hint {
  font-size: 0.85rem !important;
  color: #666 !important;
  font-weight: 400 !important;
}

.photos-preview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.photo-preview-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
}

.photo-preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-photo-btn {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  width: 24px;
  height: 24px;
  background: rgba(239, 68, 68, 0.9);
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.remove-photo-btn:hover {
  background: #dc2626;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

/* Responsive */
@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 1fr;
  }

  .right-column {
    position: relative;
    top: 0;
    height: 300px;
  }
}

@media (max-width: 768px) {
  .main-content {
    padding: 1.5rem 1rem;
  }

  .booking-number {
    font-size: 1.75rem;
  }
   .btn-help-fixed {
    padding: 0.75rem 1.25rem;
    font-size: 0.85rem;
  }

  .info-blocks {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn {
    width: 100%;
    min-width: unset;
  }

  .modal-overlay {
    padding: 1rem;
  }

  .photos-preview {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
