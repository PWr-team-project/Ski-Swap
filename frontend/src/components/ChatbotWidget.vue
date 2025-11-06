<template>
  <div class="chatbot-widget">
    <!-- Chat Window -->
    <div
      v-if="isOpen"
      class="chat-window"
      :style="windowStyle"
      @mousedown="startDrag"
    >
      <!-- Chat Header -->
      <div class="chat-header" ref="chatHeader">
        <div class="header-content">
          <div class="bot-avatar">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="10" rx="2"/>
              <circle cx="12" cy="5" r="2"/>
              <path d="M12 7v4"/>
              <line x1="8" y1="16" x2="8" y2="16"/>
              <line x1="16" y1="16" x2="16" y2="16"/>
            </svg>
          </div>
          <div class="header-info">
            <h3>SkiSwap Assistant</h3>
            <p class="status-text">
              <span class="status-dot"></span>
              Online
            </p>
          </div>
        </div>
        <button class="close-button" @click.stop="closeChat">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <!-- Chat Body (placeholder for future implementation) -->
      <div class="chat-body">
        <div class="welcome-message">
          <div class="bot-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="10" rx="2"/>
              <circle cx="12" cy="5" r="2"/>
              <path d="M12 7v4"/>
              <line x1="8" y1="16" x2="8" y2="16"/>
              <line x1="16" y1="16" x2="16" y2="16"/>
            </svg>
          </div>
          <h4>Welcome to SkiSwap!</h4>
          <p>I'm your virtual assistant. How can I help you today?</p>
          <div class="quick-actions">
            <button class="action-button">Browse Equipment</button>
            <button class="action-button">How to Rent</button>
            <button class="action-button">Contact Support</button>
          </div>
        </div>
      </div>

      <!-- Chat Input (placeholder) -->
      <div class="chat-input">
        <input
          type="text"
          placeholder="Type your message..."
          disabled
          class="input-field"
        />
        <button class="send-button" disabled>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Floating Button -->
    <button
      v-if="!isOpen"
      class="chat-button"
      @click="openChat"
      :class="{ 'has-notification': hasNotification }"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <span v-if="hasNotification" class="notification-badge">1</span>
    </button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const isOpen = ref(false)
const hasNotification = ref(false)

// Dragging state
const isDragging = ref(false)
const position = ref({ x: null, y: null })
const dragStart = ref({ x: 0, y: 0 })
const chatHeader = ref(null)
const chatWindow = ref(null)

const openChat = () => {
  isOpen.value = true
  hasNotification.value = false
  // Reset position to null (use CSS default bottom-right)
  position.value = { x: null, y: null }
}

const closeChat = () => {
  isOpen.value = false
}

// Drag functionality
const startDrag = (e) => {
  // Only allow dragging from the header
  if (!chatHeader.value?.contains(e.target)) return

  // If starting from default position, calculate current position
  if (position.value.x === null || position.value.y === null) {
    const rect = e.currentTarget.getBoundingClientRect()
    position.value = {
      x: rect.left,
      y: rect.top
    }
  }

  isDragging.value = true
  dragStart.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y
  }

  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)

  // Prevent text selection while dragging
  e.preventDefault()
}

const onDrag = (e) => {
  if (!isDragging.value) return

  const newX = e.clientX - dragStart.value.x
  const newY = e.clientY - dragStart.value.y

  // Get window dimensions
  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight
  const chatWidth = 380
  const chatHeight = 550

  // Constrain to viewport
  const maxX = windowWidth - chatWidth
  const maxY = windowHeight - chatHeight

  position.value = {
    x: Math.max(0, Math.min(newX, maxX)),
    y: Math.max(0, Math.min(newY, maxY))
  }
}

const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

const windowStyle = computed(() => {
  if (position.value.x === null || position.value.y === null) {
    // Default position: bottom-right (using CSS)
    return {
      bottom: '100px',
      right: '30px'
    }
  }

  // Custom position (being dragged or was dragged)
  return {
    left: `${position.value.x}px`,
    top: `${position.value.y}px`,
    bottom: 'auto',
    right: 'auto'
  }
})
</script>

<style scoped>
.chatbot-widget {
  position: fixed;
  z-index: 9999;
}

/* Floating Button */
.chat-button {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00AAFF 0%, #0088cc 100%);
  border: none;
  box-shadow: 0 4px 20px rgba(0, 170, 255, 0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  color: white;
  z-index: 9999;
}

.chat-button:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 25px rgba(0, 170, 255, 0.5);
}

.chat-button:active {
  transform: scale(0.95);
}

.notification-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ff4444;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  border: 2px solid white;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

/* Chat Window */
.chat-window {
  position: fixed;
  width: 380px;
  height: 550px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 9999;
  transition: transform 0.3s ease;
}

.chat-window:active {
  cursor: move;
}

/* Chat Header */
.chat-header {
  background: linear-gradient(135deg, #00AAFF 0%, #0088cc 100%);
  color: white;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: move;
  user-select: none;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.bot-avatar {
  width: 45px;
  height: 45px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.header-info h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
}

.status-text {
  margin: 0.25rem 0 0 0;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  opacity: 0.95;
}

.status-dot {
  width: 8px;
  height: 8px;
  background: #4ade80;
  border-radius: 50%;
  display: inline-block;
  animation: blink 2s infinite;
}

@keyframes blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.close-button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: rotate(90deg);
}

/* Chat Body */
.chat-body {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  background: #f8f9fa;
}

.welcome-message {
  text-align: center;
  padding: 2rem 1rem;
}

.bot-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  background: linear-gradient(135deg, #e3f2fd 0%, #f0f7ff 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00AAFF;
}

.welcome-message h4 {
  font-size: 1.5rem;
  color: #1a1a1a;
  margin: 0 0 0.5rem 0;
}

.welcome-message p {
  color: #666;
  margin: 0 0 2rem 0;
  font-size: 1rem;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.action-button {
  padding: 0.875rem 1.5rem;
  background: white;
  border: 2px solid #e3f2fd;
  border-radius: 12px;
  color: #00AAFF;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
}

.action-button:hover {
  background: #e3f2fd;
  border-color: #00AAFF;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 170, 255, 0.15);
}

/* Chat Input */
.chat-input {
  padding: 1.25rem 1.5rem;
  background: white;
  border-top: 1px solid #e3f2fd;
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.input-field {
  flex: 1;
  padding: 0.875rem 1rem;
  border: 2px solid #e3f2fd;
  border-radius: 25px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.3s ease;
}

.input-field:focus {
  border-color: #00AAFF;
}

.input-field:disabled {
  background: #f8f9fa;
  cursor: not-allowed;
  opacity: 0.6;
}

.send-button {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00AAFF 0%, #0088cc 100%);
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.send-button:hover:not(:disabled) {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 170, 255, 0.3);
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Scrollbar */
.chat-body::-webkit-scrollbar {
  width: 6px;
}

.chat-body::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.chat-body::-webkit-scrollbar-thumb {
  background: #00AAFF;
  border-radius: 3px;
}

.chat-body::-webkit-scrollbar-thumb:hover {
  background: #0088cc;
}

/* Mobile Responsive */
@media (max-width: 480px) {
  .chat-window {
    width: calc(100vw - 20px);
    height: calc(100vh - 20px);
    left: 10px !important;
    top: 10px !important;
    right: auto !important;
    bottom: auto !important;
  }

  .chat-button {
    bottom: 20px;
    right: 20px;
    width: 55px;
    height: 55px;
  }
}
</style>
