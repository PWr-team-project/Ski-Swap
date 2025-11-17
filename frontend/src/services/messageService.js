import apiClient from '@/api/interceptors';

export const messageService = {
  /**
   * Get all conversations for the current user
   */
  async getConversations() {
    const response = await apiClient.get('/api/messages/conversations');
    return response.data;
  },

  /**
   * Get messages for a specific conversation
   * @param {string} conversationId - Conversation ID
   */
  async getConversation(conversationId) {
    const response = await apiClient.get(`/api/messages/conversation/${conversationId}`);
    return response.data;
  },

  /**
   * Send a message
   * @param {FormData} formData - Form data containing conversationId, content, and optional image
   */
  async send(formData) {
    const response = await apiClient.post('/api/messages/send', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};
