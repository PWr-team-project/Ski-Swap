<template>
  <div class="conversation-list">
    <div class="list-header">
      <h2>Messages</h2>
    </div>

    <div class="conversations-scroll">
      <div
        v-for="conversation in conversations"
        :key="conversation._id"
        class="conversation-item"
        :class="{ active: selectedConversationId === conversation._id }"
        @click="$emit('select-conversation', conversation._id)"
      >
        <div class="user-avatar">
          <img
            v-if="conversation.otherUser.profile_photo"
            :src="conversation.otherUser.profile_photo"
            :alt="conversation.otherUser.nickname"
          />
          <div v-else class="avatar-placeholder">
            {{ conversation.otherUser.nickname.charAt(0).toUpperCase() }}
          </div>
          <div v-if="conversation.otherUser.online" class="online-indicator"></div>
        </div>

        <div class="conversation-info">
          <div class="conversation-header">
            <span class="user-name">{{ conversation.otherUser.nickname }}</span>
            <span class="time-ago">{{ formatTimeAgo(conversation.lastMessageTime) }}</span>
          </div>
          <div class="last-message">
            <span v-if="conversation.lastMessage.image" class="message-preview">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="message-icon">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              Photo
            </span>
            <span v-else class="message-preview">{{ conversation.lastMessage.content }}</span>
            <span v-if="conversation.unreadCount > 0" class="unread-badge">
              {{ conversation.unreadCount }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="conversations.length === 0" class="empty-list">
        <p>No conversations yet</p>
        <p class="empty-subtitle">Start chatting with other users!</p>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  conversations: {
    type: Array,
    default: () => []
  },
  selectedConversationId: {
    type: String,
    default: null
  }
})

defineEmits(['select-conversation'])

// Format time ago (e.g., "2 min temu", "2 godz. temu")
const formatTimeAgo = (timestamp) => {
  if (!timestamp) return ''

  const now = new Date()
  const messageTime = new Date(timestamp)
  const diffMs = now - messageTime
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'teraz'
  if (diffMins < 60) return `${diffMins} min temu`
  if (diffHours < 24) return `${diffHours} godz. temu`
  if (diffDays === 1) return 'wczoraj'
  if (diffDays < 7) return `${diffDays} dni temu`

  // Format as date if older than a week
  return messageTime.toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}
</script>

<style scoped>
.conversation-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-right: 1px solid #e0e0e0;
  background-color: #fafafa;
}

.list-header {
  padding: 1.5rem 1.25rem;
  border-bottom: 2px solid #e0e0e0;
  background: white;
}

.list-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
}

.conversations-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.conversation-item {
  display: flex;
  align-items: center;
  padding: 1rem 1.25rem;
  cursor: pointer;
  border-bottom: 1px solid #e0e0e0;
  transition: background-color 0.2s;
  background: white;
}

.conversation-item:hover {
  background-color: #f5f5f5;
}

.conversation-item.active {
  background-color: #e3f2fd;
  border-left: 4px solid #00AAFF;
}

.user-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 1rem;
  flex-shrink: 0;
  position: relative;
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

.online-indicator {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 12px;
  height: 12px;
  background: #4caf50;
  border: 2px solid white;
  border-radius: 50%;
}

.conversation-info {
  flex: 1;
  min-width: 0;
}

.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.25rem;
}

.user-name {
  font-weight: 600;
  font-size: 1rem;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.time-ago {
  font-size: 0.75rem;
  color: #999;
  flex-shrink: 0;
  margin-left: 0.5rem;
}

.last-message {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.message-preview {
  font-size: 0.875rem;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.message-icon {
  width: 16px;
  height: 16px;
  opacity: 0.7;
}

.unread-badge {
  background-color: #00AAFF;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.15rem 0.5rem;
  border-radius: 12px;
  margin-left: 0.5rem;
  flex-shrink: 0;
}

.empty-list {
  padding: 3rem 1.5rem;
  text-align: center;
  color: #999;
}

.empty-list p {
  margin: 0.5rem 0;
  font-size: 1rem;
}

.empty-subtitle {
  font-size: 0.875rem;
  color: #bbb;
}

/* Scrollbar styling */
.conversations-scroll::-webkit-scrollbar {
  width: 6px;
}

.conversations-scroll::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.conversations-scroll::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.conversations-scroll::-webkit-scrollbar-thumb:hover {
  background: #a0a0a0;
}
</style>
