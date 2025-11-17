/**
 * API Utility Functions
 * Centralized utilities for API-related operations
 */

import apiClient from '@/api/interceptors';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Get the base API URL
 * @returns {string} Base API URL
 */
export const getApiUrl = () => API_URL;

/**
 * Convert a relative photo path to a full URL
 * @param {string} photoPath - Relative or absolute photo path
 * @returns {string|null} Full photo URL or null if no path provided
 */
export const getFullImageUrl = (photoPath) => {
  if (!photoPath) return null;
  // If already a full URL, return as is
  if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
    return photoPath;
  }
  // Otherwise, prepend the API URL
  return `${API_URL}${photoPath}`;
};

/**
 * Get Socket.IO server URL
 * @returns {string} Socket server URL
 */
export const getSocketUrl = () => API_URL;

/**
 * Get Google OAuth URL
 * @returns {string} Google OAuth redirect URL
 */
export const getGoogleOAuthUrl = () => `${API_URL}/api/auth/google`;

// Export apiClient as default for convenience
export default apiClient;
