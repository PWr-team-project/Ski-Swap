import apiClient from '@/api/interceptors';

export const bookingService = {
  /**
   * Get bookings where current user is renting items
   */
  async getRentingBookings() {
    const response = await apiClient.get('/api/bookings/renting');
    return response.data;
  },

  /**
   * Get bookings where current user is lending items
   */
  async getLendingBookings() {
    const response = await apiClient.get('/api/bookings/lending');
    return response.data;
  },

  /**
   * Create a new booking
   * @param {Object} bookingData - Booking details (listing_id, start_date, end_date, etc.)
   */
  async create(bookingData) {
    const response = await apiClient.post('/api/bookings', bookingData);
    return response.data;
  },

  /**
   * Update booking status
   * @param {string} bookingId - Booking ID
   * @param {string} status - New status (e.g., 'confirmed', 'cancelled', 'completed')
   */
  async updateStatus(bookingId, status) {
    const response = await apiClient.put(`/api/bookings/${bookingId}/status`, { status });
    return response.data;
  },

  /**
   * Cancel/delete a booking
   * @param {string} bookingId - Booking ID
   */
  async cancel(bookingId) {
    const response = await apiClient.delete(`/api/bookings/${bookingId}`);
    return response.data;
  }
};
