import { io } from 'socket.io-client'
import { getSocketUrl } from '@/utils/api'

class SocketService {
  constructor() {
    this.socket = null
    this.listeners = new Map()
  }

  connect(userId) {
    if (this.socket?.connected) {
      return this.socket
    }

    // Connect to backend Socket.IO server
    this.socket = io(getSocketUrl(), {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    })

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id)

      // Register user as online
      if (userId) {
        this.socket.emit('user:online', userId)
      }
    })

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected')
    })

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.listeners.clear()
    }
  }

  // Join a conversation room
  joinConversation(conversationId) {
    if (this.socket) {
      this.socket.emit('conversation:join', conversationId)
    }
  }

  // Leave a conversation room
  leaveConversation(conversationId) {
    if (this.socket) {
      this.socket.emit('conversation:leave', conversationId)
    }
  }

  // Join a booking chat room
  joinBookingChat(bookingId) {
    if (this.socket) {
      this.socket.emit('booking:join', bookingId)
    }
  }

  // Leave a booking chat room
  leaveBookingChat(bookingId) {
    if (this.socket) {
      this.socket.emit('booking:leave', bookingId)
    }
  }

  // Listen for new messages
  onMessageReceived(callback) {
    if (this.socket) {
      this.socket.on('message:received', callback)
      this.listeners.set('message:received', callback)
    }
  }

  // Listen for booking messages
  onBookingMessage(callback) {
    if (this.socket) {
      this.socket.on('booking-message', callback)
      this.listeners.set('booking-message', callback)
    }
  }

  // Listen for user status changes
  onUserStatus(callback) {
    if (this.socket) {
      this.socket.on('user:status', callback)
      this.listeners.set('user:status', callback)
    }
  }

  // Listen for typing indicators
  onTypingStart(callback) {
    if (this.socket) {
      this.socket.on('typing:start', callback)
      this.listeners.set('typing:start', callback)
    }
  }

  onTypingStop(callback) {
    if (this.socket) {
      this.socket.on('typing:stop', callback)
      this.listeners.set('typing:stop', callback)
    }
  }

  // Emit typing start
  emitTypingStart(conversationId, userId, userName) {
    if (this.socket) {
      this.socket.emit('typing:start', { conversationId, userId, userName })
    }
  }

  // Emit typing stop
  emitTypingStop(conversationId, userId) {
    if (this.socket) {
      this.socket.emit('typing:stop', { conversationId, userId })
    }
  }

  // Mark messages as read
  markMessagesAsRead(conversationId, userId) {
    if (this.socket) {
      this.socket.emit('messages:read', { conversationId, userId })
    }
  }

  // Remove all listeners
  removeAllListeners() {
    if (this.socket) {
      this.listeners.forEach((callback, event) => {
        this.socket.off(event, callback)
      })
      this.listeners.clear()
    }
  }

  // Remove specific listener
  removeListener(event) {
    if (this.socket && this.listeners.has(event)) {
      const callback = this.listeners.get(event)
      this.socket.off(event, callback)
      this.listeners.delete(event)
    }
  }

  isConnected() {
    return this.socket?.connected || false
  }
}

// Export singleton instance
export default new SocketService()
