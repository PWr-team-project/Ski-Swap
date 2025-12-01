import apiClient from '@/utils/api'

export const bookingMessageService = {
  /**
   * Get all messages for a booking
   * @param {string} bookingId - Booking ID
   */
  async getMessages(bookingId) {
    console.log('[BookingMessageService] getMessages called with bookingId:', bookingId)
    console.log('[BookingMessageService] Making GET request to:', `/api/bookings/${bookingId}/messages`)

    try {
      const response = await apiClient.get(`/api/bookings/${bookingId}/messages`)
      console.log('[BookingMessageService] GET response status:', response.status)
      console.log('[BookingMessageService] GET response data:', response.data)
      return response.data
    } catch (error) {
      console.error('[BookingMessageService] GET request failed')
      console.error('[BookingMessageService] Error data:', error.response?.data)
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
