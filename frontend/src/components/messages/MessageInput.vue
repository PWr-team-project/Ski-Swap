<template>
  <div class="message-input-container">
    <!-- Image Preview -->
    <div v-if="imagePreview" class="image-preview-container">
      <div class="image-preview">
        <img :src="imagePreview" alt="Image preview" />
        <button class="remove-image" @click="removeImage">&times;</button>
      </div>
    </div>

    <!-- Drag and Drop Overlay -->
    <div
      v-if="isDragging"
      class="drag-overlay"
      @drop.prevent="handleDrop"
      @dragover.prevent
      @dragleave="isDragging = false"
    >
      <div class="drag-content">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="upload-icon">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <p>Drop image here</p>
      </div>
    </div>

    <!-- Input Container -->
    <div
      class="input-wrapper"
      @dragenter.prevent="isDragging = true"
      @dragover.prevent
    >
      <!-- Image Upload Button -->
      <button class="icon-button" @click="triggerFileInput" title="Add image">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      </button>
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        style="display: none"
        @change="handleFileSelect"
      />

      <!-- Text Input -->
      <textarea
        v-model="messageText"
        class="message-textarea"
        placeholder="Type a message..."
        rows="1"
        @keydown.enter.exact.prevent="sendMessage"
        @input="handleInput"
        @focus="handleFocus"
        @blur="handleBlur"
        ref="textarea"
      ></textarea>

      <!-- Send Button -->
      <button
        class="send-button"
        :disabled="!canSend"
        @click="sendMessage"
        title="Send message"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="22" y1="2" x2="11" y2="13"/>
          <polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const emit = defineEmits(['send-message', 'typing'])

const messageText = ref('')
const selectedImage = ref(null)
const imagePreview = ref(null)
const isDragging = ref(false)
const fileInput = ref(null)
const textarea = ref(null)
let typingTimeout = null
let isCurrentlyTyping = false

const canSend = computed(() => {
  return messageText.value.trim().length > 0 || selectedImage.value !== null
})

// Trigger file input
const triggerFileInput = () => {
  fileInput.value?.click()
}

// Handle file selection
const handleFileSelect = (event) => {
  const file = event.target.files?.[0]
  if (file && file.type.startsWith('image/')) {
    processImage(file)
  }
}

// Handle drag and drop
const handleDrop = (event) => {
  isDragging.value = false
  const file = event.dataTransfer.files?.[0]
  if (file && file.type.startsWith('image/')) {
    processImage(file)
  }
}

// Process image file
const processImage = (file) => {
  selectedImage.value = file

  // Create preview
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target?.result
  }
  reader.readAsDataURL(file)
}

// Remove selected image
const removeImage = () => {
  selectedImage.value = null
  imagePreview.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

// Auto-adjust textarea height
const adjustTextareaHeight = () => {
  if (textarea.value) {
    textarea.value.style.height = 'auto'
    textarea.value.style.height = `${Math.min(textarea.value.scrollHeight, 120)}px`
  }
}

// Handle input with typing indicator
const handleInput = () => {
  adjustTextareaHeight()

  // Emit typing event
  if (!isCurrentlyTyping && messageText.value.trim().length > 0) {
    isCurrentlyTyping = true
    emit('typing', true)
  }

  // Clear existing timeout
  if (typingTimeout) {
    clearTimeout(typingTimeout)
  }

  // Stop typing after 1 second of inactivity
  typingTimeout = setTimeout(() => {
    isCurrentlyTyping = false
    emit('typing', false)
  }, 1000)
}

// Handle focus
const handleFocus = () => {
  if (messageText.value.trim().length > 0) {
    isCurrentlyTyping = true
    emit('typing', true)
  }
}

// Handle blur
const handleBlur = () => {
  if (typingTimeout) {
    clearTimeout(typingTimeout)
  }
  isCurrentlyTyping = false
  emit('typing', false)
}

// Send message
const sendMessage = () => {
  if (!canSend.value) return

  const messageData = {
    content: messageText.value.trim(),
    image: selectedImage.value
  }

  emit('send-message', messageData)

  // Stop typing indicator
  if (typingTimeout) {
    clearTimeout(typingTimeout)
  }
  isCurrentlyTyping = false
  emit('typing', false)

  // Reset form
  messageText.value = ''
  removeImage()

  // Reset textarea height
  if (textarea.value) {
    textarea.value.style.height = 'auto'
  }
}
</script>

<style scoped>
.message-input-container {
  position: relative;
  border-top: 2px solid #e0e0e0;
  background: white;
  flex-shrink: 0;
}

.image-preview-container {
  padding: 1rem 1.5rem 0.5rem;
  border-bottom: 1px solid #e0e0e0;
}

.image-preview {
  position: relative;
  display: inline-block;
  max-width: 200px;
}

.image-preview img {
  width: 100%;
  height: auto;
  max-height: 150px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid #e0e0e0;
}

.remove-image {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #ff4444;
  color: white;
  border: 2px solid white;
  font-size: 1.25rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  padding: 0;
  transition: background-color 0.2s;
}

.remove-image:hover {
  background: #cc0000;
}

.drag-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 170, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  pointer-events: all;
}

.drag-content {
  text-align: center;
  color: white;
}

.upload-icon {
  width: 64px;
  height: 64px;
  margin-bottom: 1rem;
  opacity: 0.9;
  stroke: white;
}

.drag-content p {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  position: relative;
}

.icon-button {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border: none;
  background: #f0f0f0;
  color: #666;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-button:hover {
  background: #e0e0e0;
  color: #00AAFF;
}

.message-textarea {
  flex: 1;
  min-height: 40px;
  max-height: 120px;
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 20px;
  font-size: 0.95rem;
  font-family: inherit;
  resize: none;
  outline: none;
  transition: border-color 0.2s;
}

.message-textarea:focus {
  border-color: #00AAFF;
}

.message-textarea::placeholder {
  color: #999;
}

.send-button {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border: none;
  background: #00AAFF;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.send-button:hover:not(:disabled) {
  background: #0088CC;
  transform: scale(1.05);
}

.send-button:disabled {
  background: #cccccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.send-button svg {
  width: 20px;
  height: 20px;
}

@media (max-width: 768px) {
  .input-wrapper {
    padding: 0.75rem 1rem;
  }

  .icon-button,
  .send-button {
    width: 36px;
    height: 36px;
  }
}
</style>
