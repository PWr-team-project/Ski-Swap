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
   * Get a specific booking by ID
   * @param {string} bookingId - Booking ID
   */
  async getById(bookingId) {
    const response = await apiClient.get(`/api/bookings/${bookingId}`);
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
  },

  // ============= State Management Methods =============

  /**
   * Get current status and requirements for a booking
   * @param {string} bookingId - Booking ID
   */
  async getCurrentStatus(bookingId) {
    const response = await apiClient.get(`/api/bookings/${bookingId}/status/current`);
    return response.data;
  },

  /**
   * Get full status history for a booking
   * @param {string} bookingId - Booking ID
   */
  async getStatusHistory(bookingId) {
    const response = await apiClient.get(`/api/bookings/${bookingId}/status/history`);
    return response.data;
  },

  /**
   * Generic status transition
   * @param {string} bookingId - Booking ID
   * @param {string} newStatus - New status to transition to
   * @param {string} notes - Optional notes
   */
  async transitionStatus(bookingId, newStatus, notes = null) {
    const response = await apiClient.post(`/api/bookings/${bookingId}/status/transition`, {
      newStatus,
      notes
    });
    return response.data;
  },

  // ============= Action Methods =============

  /**
   * Owner accepts a booking request
   * @param {string} bookingId - Booking ID
   */
  async acceptBooking(bookingId) {
    const response = await apiClient.post(`/api/bookings/${bookingId}/actions/accept`);
    return response.data;
  },

  /**
   * Owner declines a booking request
   * @param {string} bookingId - Booking ID
   * @param {string} reason - Reason for declining
   */
  async declineBooking(bookingId, reason = null) {
    const response = await apiClient.post(`/api/bookings/${bookingId}/actions/decline`, {
      reason
    });
    return response.data;
  },

  /**
   * Cancel a booking (renter or owner)
   * @param {string} bookingId - Booking ID
   * @param {string} reason - Reason for cancellation
   */
  async cancelBooking(bookingId, reason = null) {
    const response = await apiClient.post(`/api/bookings/${bookingId}/actions/cancel`, {
      reason
    });
    return response.data;
  },

  /**
   * Renter confirms equipment pickup
   * - PICKUP -> PICKUP_RENTER (renter confirms first)
   * - PICKUP_OWNER -> IN_PROGRESS (renter confirms after owner)
   * @param {string} bookingId - Booking ID
   */
  async confirmPickup(bookingId) {
    const response = await apiClient.post(`/api/bookings/${bookingId}/actions/confirm-pickup`);
    return response.data;
  },

  /**
   * Owner confirms equipment handoff
   * - PICKUP -> PICKUP_OWNER (owner confirms first)
   * - PICKUP_RENTER -> IN_PROGRESS (owner confirms after renter)
   * @param {string} bookingId - Booking ID
   */
  async ownerConfirmHandoff(bookingId) {
    const response = await apiClient.post(`/api/bookings/${bookingId}/actions/owner-confirm-handoff`);
    return response.data;
  },

  /**
   * Renter confirms equipment return
   * - RETURN -> RETURN_RENTER (renter confirms return)
   * @param {string} bookingId - Booking ID
   */
  async confirmReturn(bookingId) {
    const response = await apiClient.post(`/api/bookings/${bookingId}/actions/confirm-return`);
    return response.data;
  },

  /**
   * Owner confirms receiving equipment back
   * - RETURN -> RETURN_OWNER (owner confirms return)
   * @param {string} bookingId - Booking ID
   */
  async ownerConfirmReturn(bookingId) {
    const response = await apiClient.post(`/api/bookings/${bookingId}/actions/owner-confirm-return`);
    return response.data;
  },

  /**
   * Owner verifies equipment condition and completes rental
   * @param {string} bookingId - Booking ID
   */
  async verifyComplete(bookingId) {
    const response = await apiClient.post(`/api/bookings/${bookingId}/actions/verify-complete`);
    return response.data;
  },

  /**
   * Owner opens a dispute
   * @param {string} bookingId - Booking ID
   * @param {string} reason - Reason for dispute
   */
  async openDispute(bookingId, reason) {
    const response = await apiClient.post(`/api/bookings/${bookingId}/actions/dispute`, {
      reason
    });
    return response.data;
  },

  /**
   * Mark booking as reviewed after submitting review
   * @param {string} bookingId - Booking ID
   */
  async markAsReviewed(bookingId) {
    const response = await apiClient.post(`/api/bookings/${bookingId}/actions/mark-reviewed`);
    return response.data;
  },

  // ============= Photo Methods =============

  /**
   * Upload photos for a booking
   * @param {string} bookingId - Booking ID
   * @param {string} type - Photo type: 'pickup', 'return', or 'dispute'
   * @param {FileList|Array} photos - Photo files to upload
   */
  async uploadPhotos(bookingId, type, photos) {
    const formData = new FormData();
    formData.append('type', type);

    // Handle both FileList and Array of Files
    const fileArray = Array.from(photos);
    fileArray.forEach(photo => {
      formData.append('photos', photo);
    });

    const response = await apiClient.post(
      `/api/bookings/${bookingId}/photos/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data;
  },

  /**
   * Get photos for a booking
   * @param {string} bookingId - Booking ID
   * @param {string} type - Optional: filter by type ('pickup', 'return', 'dispute')
   */
  async getPhotos(bookingId, type = null) {
    const params = type ? { type } : {};
    const response = await apiClient.get(`/api/bookings/${bookingId}/photos`, { params });
    return response.data;
  },

  /**
   * Delete a photo
   * @param {string} bookingId - Booking ID
   * @param {string} photoId - Photo ID to delete
   */
  async deletePhoto(bookingId, photoId) {
    const response = await apiClient.delete(`/api/bookings/${bookingId}/photos/${photoId}`);
    return response.data;
  }
};
