<template>
  <div class="booking-chat">
    <!-- Chat Header -->
    <div class="chat-header">
      <div class="header-content">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <h3>{{ chatTitle }}</h3>
      </div>
      <div v-if="chatStatus.readOnly" class="read-only-badge">
        Read-Only
      </div>
    </div>

    <!-- Chat Messages Container -->
    <div ref="messagesContainer" class="messages-container">
      <!-- Chat Not Available -->
      <div v-if="!chatStatus.visible" class="not-available-state">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          <line x1="9" y1="10" x2="15" y2="10"></line>
          <line x1="12" y1="14" x2="12" y2="14"></line>
        </svg>
        <p class="main-message">CHAT AVAILABLE AFTER ACCEPTANCE BY THE OWNER</p>
      </div>

      <!-- Loading State -->
      <div v-else-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading messages...</p>
      </div>

      <!-- Messages List -->
      <div v-else class="messages-list">
        <div
          v-for="(message, index) in messages"
          :key="message._id"
          :class="['message-wrapper', getMessageClass(message)]"
        >
          <!-- Date Separator -->
          <div
            v-if="shouldShowDateSeparator(index)"
            class="date-separator"
          >
            <span class="date-text">{{ formatDate(message.createdAt) }}</span>
          </div>

          <!-- System Message -->
          <div v-if="message.message_type === 'system_status'" class="system-message">
            <div class="system-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div class="system-content">{{ message.content }}</div>
            <div class="system-time">{{ formatTime(message.createdAt) }}</div>
          </div>

          <!-- User Message -->
          <div v-else class="user-message">
            <!-- Message Attachment -->
            <div v-if="message.attachment" class="message-attachment">
              <img
                :src="getImageUrl(message.attachment)"
                alt="Attachment"
                @click="openImageModal(message.attachment)"
                @error="handleImageError"
              />
            </div>

            <!-- Message Content -->
            <div v-if="message.content" class="message-content">
              {{ message.content }}
            </div>

            <!-- Message Time -->
            <div class="message-time">
              {{ formatTime(message.createdAt) }}
            </div>
          </div>
        </div>

        <!-- Typing Indicator (placeholder for future Socket.IO integration) -->
        <div v-if="isTyping" class="typing-indicator">
          <div class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Message Input -->
    <div v-if="chatStatus.enabled && !chatStatus.readOnly" class="message-input-container">
      <div class="input-wrapper">
        <!-- Attachment Button -->
        <button
          @click="triggerFileInput"
          class="attachment-btn"
          :disabled="sending"
          title="Attach photo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
        </button>

        <!-- Hidden File Input -->
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          @change="handleFileSelect"
          style="display: none;"
        />

        <!-- Selected Image Preview -->
        <div v-if="selectedImage" class="image-preview">
          <img :src="imagePreview" alt="Preview" />
          <button @click="clearImage" class="remove-image">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Text Input -->
        <input
          v-model="messageContent"
          type="text"
          placeholder="Type a message..."
          @keyup.enter="sendMessage"
          :disabled="sending"
          class="text-input"
        />

        <!-- Send Button -->
        <button
          @click="sendMessage"
          :disabled="!canSend || sending"
          class="send-btn"
        >
          <svg v-if="!sending" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
          <div v-else class="mini-spinner"></div>
        </button>
      </div>
    </div>

    <!-- Image Modal -->
    <div v-if="showImageModal" class="image-modal" @click="closeImageModal">
      <div class="modal-content">
        <img :src="getImageUrl(modalImageSrc)" alt="Full size" />
        <button class="close-modal" @click="closeImageModal">×</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '../stores/authStore';
import apiClient from '@/api/interceptors';
import socketService from '../services/socketService';

const props = defineProps({
  bookingId: {
    type: String,
    required: true
  },
  currentStatus: {
    type: String,
    required: true
  },
  otherUserName: {
    type: String,
    default: 'User'
  }
});

const authStore = useAuthStore();
const currentUserId = computed(() => authStore.user?.id);

// State
const messages = ref([]);
const loading = ref(true);
const chatStatus = ref({
  enabled: false,
  readOnly: false,
  visible: false,
  message: ''
});

const messageContent = ref('');
const selectedImage = ref(null);
const imagePreview = ref('');
const sending = ref(false);
const isTyping = ref(false);

const messagesContainer = ref(null);
const fileInput = ref(null);

const showImageModal = ref(false);
const modalImageSrc = ref('');

// Computed
const chatTitle = computed(() => {
  if (chatStatus.value.readOnly) {
    return 'Chat History';
  }
  return `Chat with ${props.otherUserName}`;
});

const canSend = computed(() => {
  return (messageContent.value.trim() !== '' || selectedImage.value !== null) && !sending.value;
});

// Methods
const fetchChatStatus = async () => {
  try {
    const response = await apiClient.get(`/api/bookings/${props.bookingId}/chat/status`);
    chatStatus.value = response.data.chatStatus;
  } catch (error) {
    console.error('Error fetching chat status:', error);
  }
};

const fetchMessages = async () => {
  loading.value = true;
  try {
    const response = await apiClient.get(`/api/bookings/${props.bookingId}/chat/messages`);
    messages.value = response.data.messages || [];
    await nextTick();
    scrollToBottom();
  } catch (error) {
    console.error('Error fetching messages:', error);
  } finally {
    loading.value = false;
  }
};

const sendMessage = async () => {
  if (!canSend.value) return;

  sending.value = true;

  try {
    const formData = new FormData();

    // Always append content, even if empty (for photo-only messages)
    formData.append('content', messageContent.value.trim() || '');

    if (selectedImage.value) {
      formData.append('attachment', selectedImage.value);
    }

    await apiClient.post(
      `/api/bookings/${props.bookingId}/chat/send`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    // Message will be added via Socket.IO event
    // No need to manually push it here

    // Clear input
    messageContent.value = '';
    clearImage();
  } catch (error) {
    console.error('Error sending message:', error);
    alert(error.response?.data?.message || 'Failed to send message');
  } finally {
    sending.value = false;
  }
};

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelect = (event) => {
  const file = event.target.files[0];
  if (file) {
    selectedImage.value = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.value = e.target.result;
    };
    reader.readAsDataURL(file);
  }
  event.target.value = '';
};

const clearImage = () => {
  selectedImage.value = null;
  imagePreview.value = '';
};

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  }
};

const getMessageClass = (message) => {
  if (message.message_type === 'system_status' || message.message_type === 'system_info') {
    return 'system';
  }
  return message.sender_id?._id === currentUserId.value ? 'own' : 'other';
};

const shouldShowDateSeparator = (index) => {
  if (index === 0) return true;

  const currentMsg = messages.value[index];
  const prevMsg = messages.value[index - 1];

  const currentDate = new Date(currentMsg.createdAt).toDateString();
  const prevDate = new Date(prevMsg.createdAt).toDateString();

  return currentDate !== prevDate;
};

const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }
};

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getImageUrl = (photoPath) => {
  if (!photoPath) return '/assets/images/placeholder.jpg';
  if (photoPath.startsWith('http')) return photoPath;
  return `http://localhost:5000${photoPath}`;
};

const handleImageError = (e) => {
  e.target.src = '/assets/images/placeholder.jpg';
};

const openImageModal = (imageSrc) => {
  modalImageSrc.value = imageSrc;
  showImageModal.value = true;
};

const closeImageModal = () => {
  showImageModal.value = false;
  modalImageSrc.value = '';
};

// Watch for status changes
watch(() => props.currentStatus, async () => {
  await fetchChatStatus();
  if (chatStatus.value.visible) {
    await fetchMessages();
  }
});

// Socket.IO handlers
const setupSocketListeners = () => {
  // Listen for incoming booking messages
  socketService.onBookingMessage((data) => {
    if (data.bookingId === props.bookingId) {
      // Add new message to the list
      messages.value.push(data.message);

      // Scroll to bottom
      nextTick(() => {
        scrollToBottom();
      });
    }
  });
};

// Lifecycle
onMounted(async () => {
  // Connect to Socket.IO
  if (!socketService.isConnected()) {
    socketService.connect(currentUserId.value);
  }

  // Set up socket listeners
  setupSocketListeners();

  await fetchChatStatus();
  if (chatStatus.value.visible) {
    await fetchMessages();
    // Join booking chat room
    socketService.joinBookingChat(props.bookingId);
  }
});

onUnmounted(() => {
  // Leave booking chat room
  socketService.leaveBookingChat(props.bookingId);
  // Remove booking message listener
  socketService.removeListener('booking-message');
});
</script>

<style scoped>
.booking-chat {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 170, 255, 0.1);
}

/* Chat Header */
.chat-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 2px solid #e0e0e0;
  background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-content svg {
  color: #00AAFF;
  flex-shrink: 0;
}

.header-content h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a1a1a;
}

.read-only-badge {
  padding: 0.375rem 0.75rem;
  background: #fef3c7;
  color: #92400e;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Messages Container */
.messages-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1.5rem;
  background: #f9fafb;
  min-height: 0;
}

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

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e3f2fd;
  border-top-color: #00AAFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Not Available State */
.not-available-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  text-align: center;
  padding: 2rem;
}

.not-available-state svg {
  color: #00AAFF;
  margin-bottom: 1.5rem;
}

.not-available-state .main-message {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
  letter-spacing: 0.5px;
  line-height: 1.6;
}

/* Messages List */
.messages-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message-wrapper {
  display: flex;
  flex-direction: column;
}

/* Date Separator */
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
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  white-space: nowrap;
  padding: 0 0.5rem;
}

/* System Message */
.system-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 12px;
  margin: 0 auto;
  max-width: 90%;
}

.system-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #3b82f6;
  border-radius: 50%;
  color: white;
  flex-shrink: 0;
}

.system-content {
  font-size: 0.875rem;
  color: #1e40af;
  flex: 1;
  text-align: center;
}

.system-time {
  font-size: 0.7rem;
  color: #60a5fa;
  flex-shrink: 0;
}

/* User Message */
.message-wrapper.own {
  align-items: flex-end;
}

.message-wrapper.other {
  align-items: flex-start;
}

.user-message {
  max-width: 70%;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  background: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.message-wrapper.own .user-message {
  background: #00AAFF;
  color: white;
}

.message-attachment {
  margin-bottom: 0.5rem;
}

.message-attachment img {
  max-width: 250px;
  max-height: 300px;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
}

.message-attachment img:hover {
  transform: scale(1.02);
}

.message-content {
  font-size: 0.95rem;
  line-height: 1.4;
  word-wrap: break-word;
}

.message-time {
  font-size: 0.7rem;
  margin-top: 0.25rem;
  opacity: 0.7;
  text-align: right;
}

/* Typing Indicator */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  max-width: 70px;
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
    transform: translateY(-8px);
  }
}

/* Message Input */
.message-input-container {
  padding: 1rem 1.5rem;
  border-top: 2px solid #e0e0e0;
  background: white;
  flex-shrink: 0;
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
}

.attachment-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.attachment-btn:hover:not(:disabled) {
  background: #e5e7eb;
  color: #00AAFF;
}

.attachment-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.image-preview {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 20px;
  height: 20px;
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

.remove-image:hover {
  background: #dc2626;
}

.text-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.95rem;
  outline: none;
  transition: all 0.3s ease;
  min-width: 0;
}

.text-input:focus {
  border-color: #00AAFF;
}

.text-input:disabled {
  background: #f9fafb;
  cursor: not-allowed;
}

.send-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: #00AAFF;
  color: white;
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.send-btn:hover:not(:disabled) {
  background: #0088cc;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 170, 255, 0.3);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mini-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
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

/* Responsive */
@media (max-width: 768px) {
  .messages-container {
    padding: 1rem;
  }

  .user-message {
    max-width: 85%;
  }

  .message-input-container {
    padding: 0.75rem 1rem;
  }

  .input-wrapper {
    gap: 0.5rem;
  }
}
</style>
