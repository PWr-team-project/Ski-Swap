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

            <!-- Current Status Message -->
            <div class="card status-message-card">
              <h3 class="status-message-title">{{ statusRequirements.message }}</h3>
              <p class="status-message-text" v-if="statusRequirements.nextAction">
                {{ statusRequirements.nextAction }}
              </p>
            </div>

            <!-- Equipment Rented Card -->
            <div class="card equipment-card" @click="navigateToListing">
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

            <!-- Equipment Owner/Renter Card -->
            <div class="card owner-card" @click="navigateToProfile">
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
                        :src="star <= Math.floor(otherUser.rating_avg) ? '/assets/icons/star_filled.svg' : '/assets/icons/star_empty.svg'"
                        alt="star"
                        class="star-icon"
                      />
                    </div>
                    <span class="rating-text">{{ otherUser.rating_avg.toFixed(1) }}</span>
                  </div>
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
                <div class="block-label">Total Price</div>
                <div class="block-value price">€{{ booking.total_price?.toFixed(2) || '0.00' }}</div>
                <div class="block-subtext">incl. booking fee</div>
              </div>
            </div>

            <!-- Action Buttons (Dynamic based on state) -->
            <div class="action-buttons">
              <!-- Payment Button -->
              <button
                v-if="showPaymentButton"
                @click="handlePayment"
                class="btn btn-payment"
              >
                Pay Now
              </button>

              <!-- Accept Button (Owner) -->
              <button
                v-if="showAcceptButton"
                @click="handleAccept"
                class="btn btn-accept"
              >
                Accept
              </button>

              <!-- Decline Button (Owner) -->
              <button
                v-if="showDeclineButton"
                @click="handleDecline"
                class="btn btn-decline"
              >
                Decline
              </button>

              <!-- Cancel Button -->
              <button
                v-if="showCancelButton"
                @click="handleCancel"
                class="btn btn-cancel"
              >
                Cancel
              </button>

              <!-- Upload & Confirm Pickup (Renter) -->
              <button
                v-if="showPickupUpload"
                @click="openPhotoModal('pickup')"
                class="btn btn-primary"
              >
                Upload Pickup Photos & Confirm
              </button>

              <!-- Upload & Confirm Return (Renter) -->
              <button
                v-if="showReturnUpload"
                @click="openPhotoModal('return')"
                class="btn btn-primary"
              >
                Upload Return Photos & Confirm
              </button>

              <!-- Confirm Return (Owner) -->
              <button
                v-if="showOwnerConfirmReturn"
                @click="handleOwnerConfirmReturn"
                class="btn btn-primary"
              >
                Confirm Return
              </button>

              <!-- Everything's Alright (Owner) -->
              <button
                v-if="showVerifyComplete"
                @click="handleVerifyComplete"
                class="btn btn-success"
              >
                Everything's Alright
              </button>

              <!-- Something's Wrong / Dispute (Owner) -->
              <button
                v-if="showDisputeButton"
                @click="handleDispute"
                class="btn btn-dispute"
              >
                Something's Wrong
              </button>

              <!-- Review Button -->
              <button
                v-if="showReviewButton"
                @click="handleReview"
                class="btn btn-review"
              >
                Write Review
              </button>

              <!-- Rent Again (Renter) -->
              <button
                v-if="showRentAgainButton"
                @click="navigateToListing"
                class="btn btn-primary"
              >
                Rent Again
              </button>

              <!-- Contact Support (Disputed) -->
              <button
                v-if="showSupportButton"
                @click="handleContactSupport"
                class="btn btn-support"
              >
                Contact Support
              </button>
            </div>
          </div>

          <!-- RIGHT COLUMN -->
          <div class="right-column">
            <!-- Tabs -->
            <div class="tabs-container">
              <div class="tabs-header">
                <button
                  :class="['tab-btn', { active: activeTab === 'chat' }]"
                  @click="activeTab = 'chat'"
                >
                  Chat & Activity
                </button>
                <button
                  v-if="showLocationTab"
                  :class="['tab-btn', { active: activeTab === 'location' }]"
                  @click="activeTab = 'location'"
                >
                  Location & Contact
                </button>
              </div>

              <div class="tabs-content">
                <!-- Chat Tab -->
                <div v-if="activeTab === 'chat'" class="tab-panel chat-panel">
                  <div class="activity-feed">
                    <!-- Status Change Messages -->
                    <div
                      v-for="(historyItem, index) in statusHistory"
                      :key="`history-${index}`"
                      class="activity-item status-change"
                    >
                      <div class="activity-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                      </div>
                      <div class="activity-content">
                        <p class="activity-text">
                          <strong>Status changed to {{ formatStatusLabel(historyItem.status) }}</strong>
                        </p>
                        <p class="activity-meta">
                          {{ formatActivityMeta(historyItem) }} • {{ formatTime(historyItem.createdAt) }}
                        </p>
                        <p v-if="historyItem.notes" class="activity-notes">{{ historyItem.notes }}</p>
                      </div>
                    </div>

                    <!-- Messages -->
                    <div
                      v-for="message in messages"
                      :key="message._id"
                      :class="['activity-item message', { 'my-message': isMyMessage(message) }]"
                    >
                      <div class="message-avatar" v-if="!isMyMessage(message)">
                        <img
                          v-if="otherUser.profile_photo"
                          :src="getImageUrl(otherUser.profile_photo)"
                          :alt="otherUserName"
                        />
                        <div v-else class="avatar-placeholder-small">{{ otherUserInitial }}</div>
                      </div>
                      <div class="message-content">
                        <p class="message-text">{{ message.content }}</p>
                        <img v-if="message.image" :src="getImageUrl(message.image)" class="message-image" />
                        <p class="message-time">{{ formatTime(message.createdAt) }}</p>
                      </div>
                    </div>
                  </div>

                  <!-- Message Input -->
                  <div class="message-input-container">
                    <textarea
                      v-model="newMessage"
                      @keydown.enter.prevent="sendMessage"
                      placeholder="Type a message..."
                      class="message-input"
                      rows="2"
                    ></textarea>
                    <button @click="sendMessage" class="send-btn" :disabled="!newMessage.trim()">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Location Tab -->
                <div v-if="activeTab === 'location' && showLocationTab" class="tab-panel location-panel">
                  <!-- Map -->
                  <div class="map-container" id="map-container">
                    <div ref="mapElement" class="map"></div>
                  </div>

                  <!-- Address & Phone -->
                  <div class="location-details">
                    <div class="location-detail-item">
                      <div class="detail-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                          <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                      </div>
                      <div class="detail-content">
                        <div class="detail-label">{{ isPickupPhase ? 'Pickup Location' : 'Return Location' }}</div>
                        <div class="detail-value">{{ fullAddress }}</div>
                      </div>
                    </div>

                    <div class="location-detail-item">
                      <div class="detail-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                        </svg>
                      </div>
                      <div class="detail-content">
                        <div class="detail-label">{{ isRenter ? "Owner's Phone" : "Renter's Phone" }}</div>
                        <div class="detail-value phone">{{ otherUserPhone }}</div>
                      </div>
                    </div>
                  </div>
                </div>
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
            <p>Click to upload photos</p>
            <p class="upload-hint">or drag and drop (max 10 photos)</p>
          </div>

          <!-- Selected Photos Preview -->
          <div v-if="selectedPhotos.length > 0" class="photos-preview">
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

        <div class="modal-footer">
          <button @click="closePhotoModal" class="btn btn-secondary">Cancel</button>
          <button
            @click="uploadPhotosAndConfirm"
            :disabled="selectedPhotos.length === 0 || uploadingPhotos"
            class="btn btn-primary"
          >
            {{ uploadingPhotos ? 'Uploading...' : `Upload & Confirm ${photoUploadType === 'pickup' ? 'Pickup' : 'Return'}` }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import { bookingService } from '@/services/bookingService';
import { messageService } from '@/services/messageService';
import BookingProgressBar from '../components/BookingProgressBar.vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
const conversation = ref(null);
const messages = ref([]);
const newMessage = ref('');

// Tabs
const activeTab = ref('chat');

// Photo Modal
const showPhotoModal = ref(false);
const photoUploadType = ref('pickup'); // 'pickup' or 'return'
const selectedPhotos = ref([]);
const uploadingPhotos = ref(false);
const fileInput = ref(null);

// Map
const mapElement = ref(null);
let mapInstance = null;

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

const isPickupPhase = computed(() => {
  return ['PENDING', 'ACCEPTED', 'PICKUP'].includes(currentStatus.value);
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

// Button Visibility (based on state and role)
const showPaymentButton = computed(() => {
  return isRenter.value && ['PENDING', 'ACCEPTED'].includes(currentStatus.value) && !booking.value.payment_confirmed;
});

const showAcceptButton = computed(() => {
  return !isRenter.value && currentStatus.value === 'PENDING' && statusRequirements.value.canAccept;
});

const showDeclineButton = computed(() => {
  return !isRenter.value && currentStatus.value === 'PENDING' && statusRequirements.value.canAccept;
});

const showCancelButton = computed(() => {
  return ['PENDING', 'ACCEPTED'].includes(currentStatus.value) && statusRequirements.value.canCancel;
});

const showPickupUpload = computed(() => {
  return isRenter.value && currentStatus.value === 'PICKUP' && statusRequirements.value.canUploadPhotos;
});

const showReturnUpload = computed(() => {
  return isRenter.value && currentStatus.value === 'RETURN' && statusRequirements.value.canUploadPhotos;
});

const showOwnerConfirmReturn = computed(() => {
  return !isRenter.value && currentStatus.value === 'RETURN' && statusRequirements.value.canConfirmReturn;
});

const showVerifyComplete = computed(() => {
  return !isRenter.value && currentStatus.value === 'VERIFY' && statusRequirements.value.canConfirmComplete;
});

const showDisputeButton = computed(() => {
  return !isRenter.value && currentStatus.value === 'VERIFY' && statusRequirements.value.canDispute;
});

const showReviewButton = computed(() => {
  return currentStatus.value === 'COMPLETED' && statusRequirements.value.canReview;
});

const showRentAgainButton = computed(() => {
  return isRenter.value && currentStatus.value === 'REVIEWED' && statusRequirements.value.canRentAgain;
});

const showSupportButton = computed(() => {
  return currentStatus.value === 'DISPUTED' && statusRequirements.value.canContactSupport;
});

// Location tab visibility
const showLocationTab = computed(() => {
  return ['ACCEPTED', 'PICKUP', 'IN_PROGRESS', 'RETURN'].includes(currentStatus.value) && statusRequirements.value.showContactInfo;
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

    // Fetch conversation
    await fetchConversation();
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

const fetchConversation = async () => {
  try {
    const otherUserId = otherUser.value._id;
    if (!otherUserId) return;

    const conversations = await messageService.getConversations();
    const existingConv = conversations.find(c =>
      c.participants.some(p => p._id === otherUserId)
    );

    if (existingConv) {
      conversation.value = existingConv;
      const messagesData = await messageService.getMessages(existingConv._id);
      messages.value = messagesData;
    } else {
      conversation.value = { _id: null, otherUser: otherUser.value };
      messages.value = [];
    }
  } catch (err) {
    console.error('Error fetching conversation:', err);
  }
};

const sendMessage = async () => {
  if (!newMessage.value.trim()) return;

  try {
    if (!conversation.value._id) {
      const newConv = await messageService.createConversation(otherUser.value._id);
      conversation.value = newConv;
    }

    const sentMessage = await messageService.sendMessage(conversation.value._id, newMessage.value.trim());
    messages.value.push(sentMessage);
    newMessage.value = '';
  } catch (err) {
    console.error('Error sending message:', err);
    alert('Failed to send message.');
  }
};

const isMyMessage = (message) => {
  return message.sender_id === authStore.user?.id || message.sender_id._id === authStore.user?.id;
};

// Action Handlers
const handlePayment = () => {
  alert('Payment functionality - To be implemented');
  // TODO: Redirect to payment page
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

const handleOwnerConfirmReturn = async () => {
  if (!confirm('Confirm equipment has been returned?')) return;

  try {
    // Owner marking return moves to VERIFY state
    await bookingService.transitionStatus(booking.value._id, 'VERIFY', 'Owner confirmed equipment returned');
    alert('Return confirmed. Please verify equipment condition.');
    await fetchBookingDetails();
  } catch (err) {
    console.error('Error confirming return:', err);
    alert(err.response?.data?.message || 'Failed to confirm return.');
  }
};

const handleVerifyComplete = async () => {
  if (!confirm("Confirm equipment is in good condition?")) return;

  try {
    await bookingService.verifyComplete(booking.value._id);
    alert('Booking completed!');
    await fetchBookingDetails();
  } catch (err) {
    console.error('Error verifying completion:', err);
    alert(err.response?.data?.message || 'Failed to complete booking.');
  }
};

const handleDispute = async () => {
  const reason = prompt('Please describe the issue:');
  if (!reason) return;

  try {
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
  // TODO: Redirect to review page
};

const handleContactSupport = () => {
  alert('Contact support functionality - To be implemented');
  // TODO: Open support panel
};

// Photo Upload Modal
const openPhotoModal = (type) => {
  photoUploadType.value = type;
  selectedPhotos.value = [];
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

  // Reset input
  event.target.value = '';
};

const removePhoto = (index) => {
  selectedPhotos.value.splice(index, 1);
};

const uploadPhotosAndConfirm = async () => {
  if (selectedPhotos.value.length === 0) return;

  uploadingPhotos.value = true;

  try {
    // Upload photos
    const files = selectedPhotos.value.map(p => p.file);
    await bookingService.uploadPhotos(booking.value._id, photoUploadType.value, files);

    // Confirm pickup/return
    if (photoUploadType.value === 'pickup') {
      await bookingService.confirmPickup(booking.value._id);
      alert('Pickup confirmed!');
    } else {
      await bookingService.confirmReturn(booking.value._id);
      alert('Return confirmed! Waiting for owner verification.');
    }

    closePhotoModal();
    await fetchBookingDetails();
  } catch (err) {
    console.error('Error uploading photos:', err);
    alert(err.response?.data?.message || 'Failed to upload photos.');
  } finally {
    uploadingPhotos.value = false;
  }
};

// Map Initialization
const initializeMap = async () => {
  if (!showLocationTab.value || !locationInfo.value.lat || !locationInfo.value.lng) return;

  await nextTick();

  if (mapInstance) {
    mapInstance.remove();
  }

  const container = mapElement.value;
  if (!container) return;

  mapInstance = L.map(container).setView([locationInfo.value.lat, locationInfo.value.lng], 15);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(mapInstance);

  L.marker([locationInfo.value.lat, locationInfo.value.lng]).addTo(mapInstance)
    .bindPopup(fullAddress.value)
    .openPopup();
};

// Helpers
const getImageUrl = (photoPath) => {
  if (!photoPath) return '/assets/images/placeholder.jpg';
  if (photoPath.startsWith('http')) return photoPath;
  return `http://localhost:5000${photoPath}`;
};

const handleImageError = (e) => {
  e.target.src = '/assets/images/placeholder.jpg';
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

const formatStatusLabel = (status) => {
  const labels = {
    'PENDING': 'Pending',
    'ACCEPTED': 'Accepted',
    'PICKUP': 'Pickup',
    'IN_PROGRESS': 'In Progress',
    'RETURN': 'Return',
    'VERIFY': 'Verification',
    'COMPLETED': 'Completed',
    'REVIEWED': 'Reviewed',
    'CANCELLED': 'Cancelled',
    'DECLINED': 'Declined',
    'DISPUTED': 'Disputed'
  };
  return labels[status] || status;
};

const formatActivityMeta = (historyItem) => {
  const actor = historyItem.changed_by;
  if (actor === 'system') return 'Automatic';
  if (actor === 'renter') return isRenter.value ? 'You' : 'Renter';
  if (actor === 'owner') return isRenter.value ? 'Owner' : 'You';
  return actor;
};

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
};

const navigateToListing = () => {
  if (booking.value.listing_id?._id) {
    router.push(`/listing/${booking.value.listing_id._id}`);
  }
};

const navigateToProfile = () => {
  if (otherUser.value._id) {
    router.push(`/profile/${otherUser.value._id}`);
  }
};

// Watchers
watch(activeTab, (newTab) => {
  if (newTab === 'location' && showLocationTab.value) {
    setTimeout(() => {
      initializeMap();
    }, 100);
  }
});

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

/* Status Message Card */
.status-message-card {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-left: 4px solid #10b981;
}

.status-message-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #065f46;
  margin-bottom: 0.5rem;
}

.status-message-text {
  font-size: 0.9rem;
  color: #047857;
  line-height: 1.5;
}

/* Equipment Card */
.equipment-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.equipment-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 170, 255, 0.2);
}

.equipment-content {
  display: flex;
  gap: 1rem;
  align-items: center;
}

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

/* Owner Card */
.owner-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.owner-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 170, 255, 0.2);
}

.owner-content {
  display: flex;
  gap: 1rem;
  align-items: center;
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

/* Info Blocks */
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

.btn-payment {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
}

.btn-payment:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
}

.btn-accept,
.btn-success {
  background: #10b981;
  color: white;
}

.btn-accept:hover,
.btn-success:hover {
  background: #059669;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-decline,
.btn-cancel,
.btn-secondary {
  background: white;
  color: #6b7280;
  border: 2px solid #d1d5db;
}

.btn-decline:hover,
.btn-cancel:hover,
.btn-secondary:hover {
  background: #f9fafb;
  border-color: #9ca3af;
  transform: translateY(-2px);
}

.btn-dispute {
  background: #ef4444;
  color: white;
}

.btn-dispute:hover {
  background: #dc2626;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
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

.btn-support {
  background: #f59e0b;
  color: white;
}

.btn-support:hover {
  background: #d97706;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

/* RIGHT COLUMN */
.right-column {
  position: sticky;
  top: 2rem;
  height: calc(100vh - 4rem);
  display: flex;
  flex-direction: column;
}

/* Tabs */
.tabs-container {
  background: white;
  border-radius: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 170, 255, 0.1);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.tabs-header {
  display: flex;
  border-bottom: 2px solid #e5e7eb;
  background: #f9fafb;
}

.tab-btn {
  flex: 1;
  padding: 1rem;
  background: transparent;
  border: none;
  font-size: 0.95rem;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 3px solid transparent;
}

.tab-btn:hover {
  background: #f3f4f6;
  color: #00AAFF;
}

.tab-btn.active {
  color: #00AAFF;
  background: white;
  border-bottom-color: #00AAFF;
}

.tabs-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.tab-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Chat Panel */
.chat-panel {
  padding: 0;
}

.activity-feed {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  display: flex;
  gap: 0.75rem;
  align-items: flex-start;
}

.activity-item.status-change {
  padding: 0.75rem;
  background: #f0fdf4;
  border-radius: 8px;
  border-left: 3px solid #10b981;
}

.activity-icon {
  width: 32px;
  height: 32px;
  background: #dcfce7;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.activity-icon svg {
  color: #10b981;
}

.activity-content {
  flex: 1;
}

.activity-text {
  font-size: 0.9rem;
  color: #065f46;
  margin-bottom: 0.25rem;
}

.activity-meta {
  font-size: 0.75rem;
  color: #059669;
}

.activity-notes {
  font-size: 0.85rem;
  color: #047857;
  font-style: italic;
  margin-top: 0.25rem;
}

.activity-item.message {
  padding: 0.75rem;
  background: #f3f4f6;
  border-radius: 12px;
  max-width: 75%;
}

.activity-item.message.my-message {
  margin-left: auto;
  background: linear-gradient(135deg, #00AAFF 0%, #0088cc 100%);
  color: white;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.message-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder-small {
  width: 32px;
  height: 32px;
  background: #00AAFF;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 600;
}

.message-content {
  flex: 1;
}

.message-text {
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 0.25rem;
}

.activity-item.message.my-message .message-text {
  color: white;
}

.message-image {
  max-width: 200px;
  border-radius: 8px;
  margin-top: 0.5rem;
}

.message-time {
  font-size: 0.7rem;
  opacity: 0.7;
}

/* Message Input */
.message-input-container {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
}

.message-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
  resize: none;
}

.message-input:focus {
  outline: none;
  border-color: #00AAFF;
}

.send-btn {
  width: 40px;
  height: 40px;
  background: #00AAFF;
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.send-btn:hover:not(:disabled) {
  background: #0088cc;
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Location Panel */
.location-panel {
  padding: 0;
}

.map-container {
  height: 400px;
  border-bottom: 1px solid #e5e7eb;
}

.map {
  width: 100%;
  height: 100%;
}

.location-details {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.location-detail-item {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.detail-icon {
  width: 40px;
  height: 40px;
  background: #eff6ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.detail-icon svg {
  color: #00AAFF;
}

.detail-content {
  flex: 1;
}

.detail-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.detail-value {
  font-size: 0.95rem;
  color: #1a1a1a;
  line-height: 1.5;
}

.detail-value.phone {
  font-weight: 600;
  color: #00AAFF;
  font-size: 1.1rem;
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
    height: 600px;
  }
}

@media (max-width: 768px) {
  .main-content {
    padding: 1.5rem 1rem;
  }

  .booking-number {
    font-size: 1.75rem;
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

  .tabs-header {
    flex-direction: column;
  }

  .modal-overlay {
    padding: 1rem;
  }

  .photos-preview {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
