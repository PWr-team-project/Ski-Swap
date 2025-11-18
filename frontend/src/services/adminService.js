import api from '../api/axios';

const adminService = {
  // Get all users with search, filter, and sort
  async getUsers(params = {}) {
    try {
      const response = await api.get('/api/admin/users', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Get detailed information for a specific user
  async getUserDetails(userId) {
    try {
      const response = await api.get(`/api/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user details:', error);
      throw error;
    }
  },

  // Get user statistics
  async getUserStats(userId) {
    try {
      const response = await api.get(`/api/admin/users/${userId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user statistics:', error);
      throw error;
    }
  }
};

export default adminService;
