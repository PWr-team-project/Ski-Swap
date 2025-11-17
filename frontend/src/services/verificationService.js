import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const verificationService = {
  // Submit verification request
  submitVerification: async (formData) => {
    const response = await axios.post(`${API_URL}/api/verification/submit`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  },

  // Get user's own verification request
  getMyRequest: async () => {
    const response = await axios.get(`${API_URL}/api/verification/my-request`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  },

  // Admin: Get all verification requests
  getAdminRequests: async (status = 'pending') => {
    const response = await axios.get(`${API_URL}/api/verification/admin/requests`, {
      params: { status },
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  },

  // Admin: Get verification request details
  getRequestDetails: async (requestId) => {
    const response = await axios.get(`${API_URL}/api/verification/admin/requests/${requestId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  },

  // Admin: Approve verification request
  approveRequest: async (requestId) => {
    const response = await axios.post(`${API_URL}/api/verification/admin/requests/${requestId}/approve`, {}, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  },

  // Admin: Reject verification request
  rejectRequest: async (requestId, rejection_reason) => {
    const response = await axios.post(`${API_URL}/api/verification/admin/requests/${requestId}/reject`, {
      rejection_reason
    }, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    return response.data;
  }
};

export default verificationService;
