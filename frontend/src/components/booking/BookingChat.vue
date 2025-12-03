<template>
  <div class="booking-chat">
    <div class="chat-header">
      <h3>Booking Chat</h3>

    </div>

    <!-- Messages Container -->
    <div ref="messagesContainer" class="messages-container">
      <div v-if="loading" class="loading-messages">
        <p>Loading messages...</p>
      </div>

      <div v-else-if="!chatEnabled" class="chat-disabled">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="lock-icon">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <p>Chat not available in current state of booking</p>
      </div>

      <div v-else-if="messages.length === 0" class="no-messages">
        <p>No messages yet</p>
        <p class="no-messages-subtitle">Start the conversation!</p>
      </div>

      <div v-else class="messages-list">
        <div
          v-for="(message, index) in messages"
          :key="message._id"
          class="message-wrapper"
          :class="{
            'own-message': message.sender && message.sender._id === currentUserId,
            'system-message': !message.sender
          }"
        >
          <!-- Show date separator -->
          <div
            v-if="shouldShowDateSeparator(index)"
            class="date-separator"
          >
            <span class="date-text">{{ formatDate(message.createdAt) }}</span>
          </div>

          <!-- Status Change Banner -->
          <div v-if="message.messageType === 'status_change'" class="status-change-banner">
            <div class="status-change-content">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="status-icon">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <div class="status-text">
                <span class="status-from">{{ formatStatusName(message.statusChange.from_status) }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="arrow-icon">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
                <span class="status-to">{{ formatStatusName(message.statusChange.to_status) }}</span>
              </div>
            </div>
            <div class="status-time">{{ formatTime(message.createdAt) }}</div>
          </div>

          <!-- Regular Message -->
          <div v-else class="message">
            <!-- Message Image -->
            <div v-if="message.image" class="message-image">
              <img :src="getFullImageUrl(message.image)" alt="Message image" @click="openImageModal(getFullImageUrl(message.image))" />
            </div>

            <!-- Message Content -->
            <div v-if="message.content" class="message-content">
              {{ message.content }}
            </div>

            <!-- Message Timestamp -->
            <div class="message-time">
              {{ formatTime(message.createdAt) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Message Input (only when chat is enabled and not frozen) -->
    <MessageInput
      v-if="chatEnabled"
      @send-message="handleSendMessage"
    />

    <!-- Image Modal -->
    <!-- Image Modal -->
    <Teleport to="body">
      <div v-if="showImageModal" class="image-modal" @click="closeImageModal">
        <div class="modal-content">
          <img :src="modalImageSrc" alt="Full size image" />
          <button class="close-modal" @click="closeImageModal">&times;</button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { bookingMessageService } from '@/services/bookingMessageService'
import socketService from '@/services/socketService'
import { getFullImageUrl } from '@/utils/api'
import MessageInput from '../messages/MessageInput.vue'

const props = defineProps({
  bookingId: {
    type: String,
    required: true
  },
  bookingStatus: {
    type: String,
    required: true
  }
})

const authStore = useAuthStore()
const currentUserId = computed(() => authStore.user?.id)

const messages = ref([])
const loading = ref(false)
const chatEnabled = ref(false)
const isChatFrozen = ref(false)
const messagesContainer = ref(null)
const showImageModal = ref(false)
const modalImageSrc = ref('')

// Fetch messages
const fetchMessages = async () => {
  // Don't fetch messages if status is PENDING
  if (props.bookingStatus === 'PENDING') {
    chatEnabled.value = false
    loading.value = false
    return
  }

  loading.value = true

  try {
    const response = await bookingMessageService.getMessages(props.bookingId)
    messages.value = response.messages || []
    chatEnabled.value = response.chatEnabled || false
    isChatFrozen.value = response.isChatFrozen || false
  } catch (error) {
    console.error('[BookingChat] Service error:', error.response?.status, error.response?.data)
    if (error.response?.status === 403) {
      chatEnabled.value = false
    }
    messages.value = []
  } finally {
    loading.value = false
  }
}

// Send message
const handleSendMessage = async (messageData) => {
  try {
    const formData = new FormData()
    formData.append('content', messageData.content)

    if (messageData.image) {
      formData.append('image', messageData.image)
    }

    await bookingMessageService.sendMessage(props.bookingId, formData)

    // Don't add message here - let Socket.IO handle it to avoid duplicates
    // The message will be added via the socket listener
  } catch (error) {
    console.error('[BookingChat] Send error:', error.response?.status, error.response?.data)
    alert('Failed to send message. Please try again.')
  }
}

// Setup Socket.IO listeners
const setupSocketListeners = () => {
  socketService.onBookingMessageReceived((message) => {
    // Add message to list (duplicates are prevented by not adding in handleSendMessage)
    messages.value.push(message)
  })
}

// Watch for booking status changes to refetch messages
watch(() => props.bookingStatus, async (newStatus, oldStatus) => {
  console.log('[BookingChat] Status changed:', oldStatus, '->', newStatus)

  // If status changed from PENDING to something else, fetch messages
  if (oldStatus === 'PENDING' && newStatus !== 'PENDING') {
    await fetchMessages()
  } else if (newStatus === 'PENDING') {
    // If status changed back to PENDING, clear messages and disable chat
    chatEnabled.value = false
    messages.value = []
  }
})

// Scroll to bottom when messages change
watch(() => messages.value, async () => {
  await nextTick()
  scrollToBottom()
}, { deep: true })

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// Check if date separator should be shown
const shouldShowDateSeparator = (index) => {
  if (index === 0) return true

  const currentMsg = messages.value[index]
  const prevMsg = messages.value[index - 1]

  const currentDate = new Date(currentMsg.createdAt).toDateString()
  const prevDate = new Date(prevMsg.createdAt).toDateString()

  return currentDate !== prevDate
}

// Format date for separator
const formatDate = (timestamp) => {
  const date = new Date(timestamp)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) {
    return 'Today'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday'
  } else {
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }
}

// Format time
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Format status names to be more readable
const formatStatusName = (status) => {
  const statusMap = {
    'PENDING': 'Pending',
    'ACCEPTED': 'Accepted',
    'PICKUP': 'Pickup',
    'PICKUP_OWNER': 'Pickup (Owner Confirmed)',
    'PICKUP_RENTER': 'Pickup (Renter Confirmed)',
    'IN_PROGRESS': 'In Progress',
    'RETURN': 'Return',
    'RETURN_OWNER': 'Return (Owner Confirmed)',
    'RETURN_RENTER': 'Return (Renter Confirmed)',
    'COMPLETED': 'Completed',
    'REVIEWED': 'Reviewed',
    'CANCELLED': 'Cancelled',
    'DECLINED': 'Declined',
    'DISPUTED': 'Disputed',
    'DISPUTE_RESOLVED': 'Dispute Resolved'
  }
  return statusMap[status] || status
}

// Image modal functions
const openImageModal = (imageSrc) => {
  modalImageSrc.value = imageSrc
  showImageModal.value = true
}

const closeImageModal = () => {
  showImageModal.value = false
  modalImageSrc.value = ''
}

onMounted(async () => {

  // Fetch initial messages
  await fetchMessages()

  // Join booking chat room
  socketService.joinBookingChat(props.bookingId)

  // Setup socket listeners
  setupSocketListeners()
})

onUnmounted(() => {
  // Leave booking chat room
  socketService.leaveBookingChat(props.bookingId)
})
</script>

<style scoped>
.booking-chat {
  display: flex;
  flex-direction: column;
  height: 800px;
  max-height: 800px;
  background: white;
  border-radius: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.chat-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 2px solid #e0e0e0;
  background: white;
  flex-shrink: 0;
}

.chat-header h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
}

.frozen-notice {
  margin: 0;
  font-size: 0.875rem;
  color: #ff9800;
  font-weight: 500;
}

.messages-container {
  flex: 1 1 auto;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1.5rem;
  background: #f9f9f9;
  min-height: 0;
}

.loading-messages,
.no-messages,
.chat-disabled {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  text-align: center;
  padding: 2rem;
}

.chat-disabled {
  color: #666;
}

.lock-icon {
  margin-bottom: 1rem;
  opacity: 0.5;
}

.no-messages-subtitle {
  font-size: 0.875rem;
  color: #bbb;
  margin-top: 0.5rem;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.message-wrapper.own-message {
  align-items: flex-end;
}

.message-wrapper.system-message {
  align-items: center;
}

.date-separator {
  width: 100%;
  text-align: center;
  margin: 1rem 0;
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.date-separator::before,
.date-separator::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #ddd;
}

.date-text {
  color: #999;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  padding: 0 0.5rem;
}

/* Status Change Banner */
.status-change-banner {
  max-width: 90%;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  background: linear-gradient(135deg, #00AAFF 0%, #66D1FF 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(0, 170, 255, 0.3);
  margin: 0.5rem 0;
}

.status-change-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.status-icon {
  flex-shrink: 0;
}

.status-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  flex-wrap: wrap;
}

.status-from {
  opacity: 0.8;
}

.arrow-icon {
  opacity: 0.8;
  flex-shrink: 0;
}

.status-to {
  font-weight: 700;
}

.status-time {
  font-size: 0.75rem;
  opacity: 0.8;
  text-align: left;
}

/* Regular Messages */
.message {
  max-width: 70%;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  background: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  word-wrap: break-word;
}

.own-message .message {
  background: #00AAFF;
  color: white;
}

.message-image {
  margin-bottom: 0.5rem;
}

.message-image img {
  max-width: 300px;
  max-height: 400px;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

.message-image img:hover {
  transform: scale(1.02);
}

.message-content {
  font-size: 0.95rem;
  line-height: 1.4;
}

.message-time {
  font-size: 0.75rem;
  margin-top: 0.25rem;
  opacity: 0.7;
}

.own-message .message-time {
  text-align: right;
}

/* Image Modal */
.image-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  cursor: pointer;
}

.modal-content {
  position: relative;
  max-width: 90%;
  max-height: 90%;
}

.modal-content img {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
}

.close-modal {
  position: absolute;
  top: -40px;
  right: 0;
  background: none;
  border: none;
  color: white;
  font-size: 3rem;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 40px;
  height: 40px;
}

.close-modal:hover {
  opacity: 0.7;
}

/* Scrollbar styling */
.messages-container::-webkit-scrollbar {
  width: 8px;
}

.messages-container::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.messages-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: #a0a0a0;
}
</style>
