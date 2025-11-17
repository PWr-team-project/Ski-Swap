import apiClient from '@/api/interceptors';

export const authService = {
  /**
   * Register a new user
   * @param {Object} userData - User registration data (email, password, name, etc.)
   */
  async register(userData) {
    const response = await apiClient.post('/api/auth/register', userData);
    return response.data;
  },

  /**
   * Login user
   * @param {Object} credentials - Login credentials (email, password)
   */
  async login(credentials) {
    const response = await apiClient.post('/api/auth/login', credentials);
    return response.data;
  },

  /**
   * Verify authentication token
   */
  async verifyToken() {
    const response = await apiClient.get('/api/auth/verify');
    return response.data;
  },

  /**
   * Logout user (client-side cleanup)
   */
  logout() {
    localStorage.removeItem('token');
  }
};
