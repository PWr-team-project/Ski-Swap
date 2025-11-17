import apiClient from '@/api/interceptors';

export const passwordResetService = {
  /**
   * Request password reset code
   * @param {string} email - User's email address
   */
  async requestResetCode(email) {
    const response = await apiClient.post('/api/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Verify password reset code
   * @param {string} email - User's email address
   * @param {string} code - 6-digit verification code
   */
  async verifyResetCode(email, code) {
    const response = await apiClient.post('/api/auth/verify-reset-code', { email, code });
    return response.data;
  },

  /**
   * Reset password with verified code
   * @param {string} email - User's email address
   * @param {string} code - 6-digit verification code
   * @param {string} newPassword - New password
   */
  async resetPassword(email, code, newPassword) {
    const response = await apiClient.post('/api/auth/reset-password', {
      email,
      code,
      newPassword
    });
    return response.data;
  }
};
