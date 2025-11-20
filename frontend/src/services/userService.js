import apiClient from '@/api/interceptors';

export const userService = {
  /**
   * Get public user profile
   * @param {string} identifier - User ID or username
   */
  async getPublicProfile(identifier) {
    const response = await apiClient.get(`/api/users/public/${identifier}`);
    return response.data;
  },

  /**
   * Get current user's profile
   */
  async getProfile() {
    const response = await apiClient.get('/api/users/profile');
    return response.data;
  },

  /**
   * Update user profile
   * @param {Object} profileData - Profile data to update
   */
  async updateProfile(profileData) {
    const config = {};
    // If profileData is FormData (for file uploads), set appropriate header
    if (profileData instanceof FormData) {
      config.headers = {
        'Content-Type': 'multipart/form-data'
      };
    }
    const response = await apiClient.put('/api/users/profile', profileData, config);
    return response.data;
  },

  /**
   * Update profile picture
   * @param {FormData} formData - Form data containing the profile picture
   */
  async updateProfilePicture(formData) {
    const response = await apiClient.put('/api/users/profile/picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * Update user location
   * @param {Object} locationData - Location data (city, country, coordinates)
   */
  async updateLocation(locationData) {
    const response = await apiClient.put('/api/users/profile/location', locationData);
    return response.data;
  },

  /**
   * Update bio/about section
   * @param {Object} bioData - Bio data
   */
  async updateBio(bioData) {
    const response = await apiClient.put('/api/users/profile/bio', bioData);
    return response.data;
  },

  /**
   * Change password
   * @param {Object} passwordData - Object containing currentPassword and newPassword
   */
  async changePassword(passwordData) {
    const response = await apiClient.put('/api/users/profile/password', passwordData);
    return response.data;
  },

  /**
   * Delete user account
   * @param {Object} data - Object containing password for confirmation
   */
  async deleteAccount(data) {
    const response = await apiClient.delete('/api/users/account', { data });
    return response.data;
  }
};
