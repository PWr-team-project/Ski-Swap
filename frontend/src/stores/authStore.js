import { defineStore } from 'pinia';
import { authService } from '@/services/authService';

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
    // Set auth token in localStorage
    setAuthToken(token) {
      if (token) {
        localStorage.setItem('token', token);
        this.token = token;
      } else {
        localStorage.removeItem('token');
        this.token = null;
      }
    },

    // Register new user
    async register(userData) {
      this.loading = true;
      this.error = null;

      try {
        const data = await authService.register(userData);

        this.token = data.token;
        this.user = data.user;
        this.isAuthenticated = true;
        this.setAuthToken(data.token);

        return { success: true, data };
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
        const data = await authService.login(credentials);

        this.token = data.token;
        this.user = data.user;
        this.isAuthenticated = true;
        this.setAuthToken(data.token);

        return { success: true, data };
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
        const data = await authService.verifyToken();

        if (data.authenticated) {
          this.user = data.user;
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
      authService.logout();
    },

    // Clear error
    clearError() {
      this.error = null;
    }
  }
});
