<template>
  <div class="message-thread">
    <!-- Thread Header -->
    <div class="thread-header">
      <div class="other-user-info">
        <div class="user-avatar">
          <img
            v-if="conversation.otherUser.profile_photo"
            :src="conversation.otherUser.profile_photo"
            :alt="conversation.otherUser.nickname"
          />
          <div v-else class="avatar-placeholder">
            {{ conversation.otherUser.nickname.charAt(0).toUpperCase() }}
          </div>
        </div>
        <div>
          <h3>{{ conversation.otherUser.nickname }}</h3>
          <p class="user-name-full">
            {{ conversation.otherUser.first_name }} {{ conversation.otherUser.last_name }}
          </p>
        </div>
      </div>
    </div>

    <!-- Messages Container -->
    <div ref="messagesContainer" class="messages-container">
      <div v-if="loading" class="loading-messages">
        <p>Loading messages...</p>
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
          :class="{ 'own-message': message.sender._id === currentUserId }"
        >
          <!-- Show date separator -->
          <div
            v-if="shouldShowDateSeparator(index)"
            class="date-separator"
          >
            {{ formatDate(message.createdAt) }}
          </div>

          <div class="message">
            <!-- Listing Inquiry Message -->
            <ListingInquiryMessage
              v-if="message.messageType === 'listing_inquiry' && message.listing"
              :message="message"
              :listing="message.listing"
            />

            <!-- Regular Message -->
            <template v-else>
              <!-- Message Image -->
              <div v-if="message.image" class="message-image">
                <img :src="message.image" alt="Message image" @click="openImageModal(message.image)" />
              </div>

              <!-- Message Content -->
              <div v-if="message.content" class="message-content">
                {{ message.content }}
              </div>
            </template>

            <!-- Message Timestamp -->
            <div class="message-time">
              {{ formatTime(message.createdAt) }}
            </div>
          </div>
        </div>

        <!-- Typing Indicator -->
        <div v-if="isTyping" class="typing-indicator">
          <div class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p class="typing-text">{{ typingUserName }} is typing...</p>
        </div>
      </div>
    </div>

    <!-- Message Input -->
    <MessageInput
      @send-message="handleSendMessage"
      @typing="handleTyping"
      :conversationId="conversation._id"
    />

    <!-- Image Modal -->
    <div v-if="showImageModal" class="image-modal" @click="closeImageModal">
      <div class="modal-content">
        <img :src="modalImageSrc" alt="Full size image" />
        <button class="close-modal" @click="closeImageModal">&times;</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '../../stores/authStore'
import socketService from '../../services/socketService'
import MessageInput from './MessageInput.vue'
import ListingInquiryMessage from './ListingInquiryMessage.vue'

const props = defineProps({
  conversation: {
    type: Object,
    required: true
  },
  messages: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['send-message'])

const authStore = useAuthStore()
const currentUserId = computed(() => authStore.user?.id)

const messagesContainer = ref(null)
const showImageModal = ref(false)
const modalImageSrc = ref('')
const isTyping = ref(false)
const typingUserName = ref('')
let typingTimeout = null

// Scroll to bottom when messages change
watch(() => props.messages, async () => {
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

  const currentMsg = props.messages[index]
  const prevMsg = props.messages[index - 1]

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
    return 'Dzisiaj'
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Wczoraj'
  } else {
    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }
}

// Format time
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('pl-PL', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Handle sending message
const handleSendMessage = (messageData) => {
  emit('send-message', messageData)
}

// Handle typing
const handleTyping = (typing) => {
  if (typing) {
    socketService.emitTypingStart(
      props.conversation._id,
      currentUserId.value,
      authStore.user?.nickname
    )
  } else {
    socketService.emitTypingStop(props.conversation._id, currentUserId.value)
  }
}

// Set up typing indicators
const setupTypingListeners = () => {
  socketService.onTypingStart((data) => {
    if (data.userId !== currentUserId.value) {
      isTyping.value = true
      typingUserName.value = data.userName

      // Clear existing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout)
      }

      // Auto-hide after 3 seconds
      typingTimeout = setTimeout(() => {
        isTyping.value = false
      }, 3000)
    }
  })

  socketService.onTypingStop((data) => {
    if (data.userId !== currentUserId.value) {
      isTyping.value = false
      if (typingTimeout) {
        clearTimeout(typingTimeout)
      }
    }
  })
}

onMounted(() => {
  setupTypingListeners()
})

onUnmounted(() => {
  if (typingTimeout) {
    clearTimeout(typingTimeout)
  }
})

// Image modal functions
const openImageModal = (imageSrc) => {
  modalImageSrc.value = imageSrc
  showImageModal.value = true
}

const closeImageModal = () => {
  showImageModal.value = false
  modalImageSrc.value = ''
}
</script>

<style scoped>
.message-thread {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
}

.thread-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 2px solid #e0e0e0;
  background: white;
  flex-shrink: 0;
}

.other-user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #00AAFF 0%, #66D1FF 100%);
  color: white;
  font-size: 1.25rem;
  font-weight: 600;
}

.other-user-info h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #333;
}

.user-name-full {
  margin: 0;
  font-size: 0.875rem;
  color: #666;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  background: #f9f9f9;
  min-height: 0;
}

.loading-messages,
.no-messages {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
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

.date-separator {
  width: 100%;
  text-align: center;
  margin: 1rem 0;
  position: relative;
}

.date-separator::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 100%;
  height: 1px;
  background: #ddd;
  z-index: 0;
}

.date-separator {
  color: #999;
  font-size: 0.875rem;
  font-weight: 500;
}

.date-separator::after {
  content: attr(data-date);
  background: #f9f9f9;
  padding: 0 1rem;
  position: relative;
  z-index: 1;
}

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

/* Typing Indicator */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  margin-top: 0.5rem;
}

.typing-dots {
  display: flex;
  gap: 0.25rem;
}

.typing-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #999;
  animation: typingBounce 1.4s infinite;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typingBounce {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

.typing-text {
  font-size: 0.875rem;
  color: #999;
  margin: 0;
  font-style: italic;
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
