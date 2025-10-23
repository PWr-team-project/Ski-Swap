import { defineStore } from 'pinia';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: false,
    loading: false,
    error: null
  }),

  getters: {
    getUser: (state) => state.user,
    isLoggedIn: (state) => state.isAuthenticated,
    getToken: (state) => state.token,
    isLoading: (state) => state.loading,
    getError: (state) => state.error
  },

  actions: {
    // Set auth header for axios
    setAuthHeader(token) {
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        localStorage.setItem('token', token);
      } else {
        delete axios.defaults.headers.common['Authorization'];
        localStorage.removeItem('token');
      }
    },

    // Register new user
    async register(userData) {
      this.loading = true;
      this.error = null;

      try {
        const response = await axios.post(`${API_URL}/api/auth/register`, userData);

        this.token = response.data.token;
        this.user = response.data.user;
        this.isAuthenticated = true;
        this.setAuthHeader(response.data.token);

        return { success: true, data: response.data };
      } catch (error) {
        this.error = error.response?.data?.message || 'Registration failed';
        console.error('Registration error:', error);
        return { success: false, error: this.error };
      } finally {
        this.loading = false;
      }
    },

    // Login user
    async login(credentials) {
      this.loading = true;
      this.error = null;

      try {
        const response = await axios.post(`${API_URL}/api/auth/login`, credentials);

        this.token = response.data.token;
        this.user = response.data.user;
        this.isAuthenticated = true;
        this.setAuthHeader(response.data.token);

        return { success: true, data: response.data };
      } catch (error) {
        this.error = error.response?.data?.message || 'Login failed';
        console.error('Login error:', error);
        return { success: false, error: this.error };
      } finally {
        this.loading = false;
      }
    },

    // Verify token and get user data
    async verifyToken() {
      if (!this.token) {
        this.isAuthenticated = false;
        return false;
      }

      this.loading = true;

      try {
        this.setAuthHeader(this.token);
        const response = await axios.get(`${API_URL}/api/auth/verify`);

        if (response.data.authenticated) {
          this.user = response.data.user;
          this.isAuthenticated = true;
          return true;
        } else {
          this.logout();
          return false;
        }
      } catch (error) {
        console.error('Token verification error:', error);
        this.logout();
        return false;
      } finally {
        this.loading = false;
      }
    },

    // Logout user
    logout() {
      this.user = null;
      this.token = null;
      this.isAuthenticated = false;
      this.error = null;
      this.setAuthHeader(null);
    },

    // Clear error
    clearError() {
      this.error = null;
    }
  }
});
