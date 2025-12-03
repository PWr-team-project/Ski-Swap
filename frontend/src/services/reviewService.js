import apiClient from '@/api/interceptors';

export const reviewService = {
  /**
   * Create a review for a booking
   * @param {string} bookingId - Booking ID
   * @param {Object} reviewData - Review data (rating, comment)
   */
  async createReview(bookingId, reviewData) {
    const response = await apiClient.post(`/api/bookings/${bookingId}/reviews`, reviewData);
    return response.data;
  },

  /**
   * Get reviews for a specific booking
   * @param {string} bookingId - Booking ID
   */
  async getBookingReviews(bookingId) {
    const response = await apiClient.get(`/api/bookings/${bookingId}/reviews`);
    return response.data;
  },

  /**
   * Get reviews for a specific user (as owner)
   * @param {string} userId - User ID
   */
  async getUserReviews(userId) {
    const response = await apiClient.get(`/api/users/${userId}/reviews`);
    return response.data;
  }
};
