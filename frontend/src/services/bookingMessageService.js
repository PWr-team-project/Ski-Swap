import apiClient from '@/utils/api'

export const bookingMessageService = {
  /**
   * Get all messages for a booking
   * @param {string} bookingId - Booking ID
   */
  async getMessages(bookingId) {
    try {
      const response = await apiClient.get(`/api/bookings/${bookingId}/messages`)
      return response.data
    } catch (error) {
      throw error
    }
  },

  /**
   * Send a message in booking chat
   * @param {string} bookingId - Booking ID
   * @param {FormData} formData - Message data (content and/or image)
   */
  async sendMessage(bookingId, formData) {
    const response = await apiClient.post(`/api/bookings/${bookingId}/messages`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    return response.data
  }
}
