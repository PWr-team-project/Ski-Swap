import apiClient from '@/api/interceptors';

export const listingService = {
  /**
   * Get all listings
   */
  async getAll() {
    const response = await apiClient.get('/api/listings');
    return response.data;
  },

  /**
   * Get a single listing by ID
   */
  async getById(id) {
    const response = await apiClient.get(`/api/listings/${id}`);
    return response.data;
  },

  /**
   * Get current user's listings
   */
  async getMyListings() {
    const response = await apiClient.get('/api/listings/my/listings');
    return response.data;
  },

  /**
   * Create a new listing
   * @param {FormData} formData - Form data containing listing details and photos
   */
  async create(formData) {
    const response = await apiClient.post('/api/listings/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * Update an existing listing
   * @param {string} id - Listing ID
   * @param {FormData} formData - Form data containing updated listing details
   */
  async update(id, formData) {
    const response = await apiClient.put(`/api/listings/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * Delete a listing
   * @param {string} id - Listing ID
   */
  async delete(id) {
    const response = await apiClient.delete(`/api/listings/${id}`);
    return response.data;
  },

  //TODO : Add rules for availability 
  /**
   * Toggle listing availability
   * @param {string} id - Listing ID
   */
  async toggleAvailability(id) {
    const response = await apiClient.put(`/api/listings/${id}/availability`);
    return response.data;
  }
};
