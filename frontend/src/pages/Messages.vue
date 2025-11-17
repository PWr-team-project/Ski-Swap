<template>
  <div class="messages-page">
    <div class="messages-container">
      <div class="messages-content">
        <!-- Left Panel - Conversation List -->
        <ConversationList
          :conversations="conversations"
          :selectedConversationId="selectedConversationId"
          @select-conversation="handleSelectConversation"
        />

        <!-- Right Panel - Message Thread -->
        <MessageThread
          v-if="selectedConversation"
          :conversation="selectedConversation"
          :messages="currentMessages"
          :loading="loadingMessages"
          @send-message="handleSendMessage"
        />

        <!-- Empty State -->
        <div v-else class="empty-state">
          <img src="/assets/images/chat_icon.png" alt="Messages" class="empty-icon" />
          <h2>Select a conversation</h2>
          <p>Choose a conversation from the list to start messaging</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { messageService } from '@/services/messageService'
import ConversationList from '../components/messages/ConversationList.vue'
import MessageThread from '../components/messages/MessageThread.vue'
import socketService from '../services/socketService'

const route = useRoute()
const authStore = useAuthStore()

const conversations = ref([])
const selectedConversationId = ref(null)
const currentMessages = ref([])
const loadingMessages = ref(false)

const selectedConversation = computed(() => {
  return conversations.value.find(c => c._id === selectedConversationId.value)
})

// Fetch all conversations
const fetchConversations = async () => {
  try {
    const response = await messageService.getConversations()
    conversations.value = response.conversations || []
  } catch (error) {
    console.error('Error fetching conversations:', error)
  }
}

// Fetch messages for selected conversation
const fetchMessages = async (conversationId) => {
  loadingMessages.value = true
  try {
    const response = await messageService.getConversation(conversationId)
    currentMessages.value = response.messages || []
  } catch (error) {
    console.error('Error fetching messages:', error)
    currentMessages.value = []
  } finally {
    loadingMessages.value = false
  }
}

// Handle conversation selection
const handleSelectConversation = async (conversationId) => {
  // Leave previous conversation room
  if (selectedConversationId.value) {
    socketService.leaveConversation(selectedConversationId.value)
  }

  selectedConversationId.value = conversationId
  await fetchMessages(conversationId)

  // Join new conversation room
  socketService.joinConversation(conversationId)
}

// Handle sending a message
const handleSendMessage = async (messageData) => {
  try {
    const formData = new FormData()

    formData.append('conversationId', selectedConversationId.value)
    formData.append('content', messageData.content)

    if (messageData.image) {
      formData.append('image', messageData.image)
    }

    const response = await messageService.send(formData)

    // Add new message to current messages
    currentMessages.value.push(response.message)

    // Update conversation list
    await fetchConversations()
  } catch (error) {
    console.error('Error sending message:', error)
  }
}

// Socket.IO event handlers
const setupSocketListeners = () => {
  // Listen for incoming messages
  socketService.onMessageReceived((message) => {
    console.log('Received message:', message)

    // Add message to current messages if viewing the conversation
    if (selectedConversationId.value) {
      // Check if message belongs to current conversation
      currentMessages.value.push(message)
    }

    // Update conversation list
    fetchConversations()
  })

  // Listen for user status changes
  socketService.onUserStatus((data) => {
    console.log('User status changed:', data)
    // Update conversation list to show online/offline status
    const conversation = conversations.value.find(c =>
      c.otherUser._id === data.userId
    )
    if (conversation) {
      conversation.otherUser.online = data.status === 'online'
    }
  })
}

onMounted(async () => {
  // Connect to Socket.IO
  socketService.connect(authStore.user?.id)

  // Set up socket listeners
  setupSocketListeners()

  // Fetch initial data
  await fetchConversations()

  // Check if conversationId is in query params (from Contact Seller button)
  if (route.query.conversationId) {
    const conversationId = route.query.conversationId
    // Check if conversation exists in the list
    const conversation = conversations.value.find(c => c._id === conversationId)
    if (conversation) {
      await handleSelectConversation(conversationId)
    }
  }
})

onUnmounted(() => {
  // Clean up: leave current conversation and disconnect
  if (selectedConversationId.value) {
    socketService.leaveConversation(selectedConversationId.value)
  }
  socketService.removeAllListeners()
  // Note: Don't disconnect socket here as it might be used elsewhere
  // socketService.disconnect()
})
</script>

<style scoped>
.messages-page {
  background: linear-gradient(135deg, #f0f7ff 0%, #e3f2fd 100%);
  min-height: calc(100vh - 140px);
  padding: 2rem;
}

.messages-container {
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  height: calc(100vh - 180px);
}

.messages-content {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 1.5rem;
  height: 100%;
  background: white;
  border-radius: 25px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 170, 255, 0.12);
  border: 1px solid rgba(0, 170, 255, 0.1);
  overflow: hidden;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #999;
}

.empty-icon {
  width: 80px;
  height: 80px;
  opacity: 0.3;
  margin-bottom: 1.5rem;
}

.empty-state h2 {
  font-size: 1.5rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.empty-state p {
  font-size: 1rem;
  color: #999;
}

@media (max-width: 768px) {
  .messages-page {
    padding: 1rem;
  }

  .messages-container {
    height: calc(100vh - 160px);
  }

  .messages-content {
    grid-template-columns: 1fr;
  }
}
</style>
