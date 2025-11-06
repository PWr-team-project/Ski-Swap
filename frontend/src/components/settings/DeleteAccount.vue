<template>
  <div class="delete-account">
    <h2>Delete Account</h2>
    <p class="section-description">Permanently delete your account and all associated data</p>

    <div class="danger-zone">
      <div class="warning-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>

      <div class="warning-content">
        <h3>Warning: This action cannot be undone</h3>
        <p>Deleting your account will:</p>
        <ul>
          <li>Permanently remove your profile and personal information</li>
          <li>Delete all your listings and rental history</li>
          <li>Remove all your messages and conversations</li>
          <li>Erase all data associated with your account</li>
        </ul>
      </div>
    </div>

    <form @submit.prevent="handleDelete" class="delete-form">
      <div class="form-group">
        <label for="confirmPassword">
          {{ isOAuthUser ? 'Type DELETE to confirm' : 'Enter your password to confirm' }}
        </label>
        <input
          v-if="isOAuthUser"
          id="confirmText"
          v-model="confirmText"
          type="text"
          class="form-input"
          placeholder="Type DELETE in capital letters"
          required
        />
        <input
          v-else
          id="confirmPassword"
          v-model="password"
          type="password"
          class="form-input"
          placeholder="Enter your password"
          required
        />
      </div>

      <div class="form-group checkbox-group">
        <label class="checkbox-label">
          <input
            v-model="confirmCheckbox"
            type="checkbox"
            required
          />
          <span>I understand that this action is permanent and irreversible</span>
        </label>
      </div>

      <!-- Success/Error Messages -->
      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <!-- Action Buttons -->
      <div class="form-actions">
        <button type="button" @click="resetForm" class="cancel-btn" :disabled="loading">
          Cancel
        </button>
        <button
          type="submit"
          class="delete-btn"
          :disabled="loading || !canDelete"
        >
          {{ loading ? 'Deleting Account...' : 'Delete My Account' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../../stores/authStore'
import { useRouter } from 'vue-router'
import axios from 'axios'

const authStore = useAuthStore()
const router = useRouter()
const user = authStore.user

const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const password = ref('')
const confirmText = ref('')
const confirmCheckbox = ref(false)

const isOAuthUser = computed(() => user?.oauth_provider === 'google')

const canDelete = computed(() => {
  if (!confirmCheckbox.value) return false
  if (isOAuthUser.value) {
    return confirmText.value === 'DELETE'
  }
  return password.value.length > 0
})

const resetForm = () => {
  password.value = ''
  confirmText.value = ''
  confirmCheckbox.value = false
  successMessage.value = ''
  errorMessage.value = ''
}

const handleDelete = async () => {
  loading.value = true
  successMessage.value = ''
  errorMessage.value = ''

  // Validation
  if (!confirmCheckbox.value) {
    errorMessage.value = 'Please confirm that you understand this action is irreversible'
    loading.value = false
    return
  }

  if (isOAuthUser.value && confirmText.value !== 'DELETE') {
    errorMessage.value = 'Please type DELETE in capital letters to confirm'
    loading.value = false
    return
  }

  try {
    const token = authStore.token
    const payload = isOAuthUser.value
      ? {}
      : { password: password.value }

    await axios.delete(
      'http://localhost:5000/api/auth/account',
      {
        headers: { 'Authorization': `Bearer ${token}` },
        data: payload
      }
    )

    successMessage.value = 'Account deleted successfully. Redirecting...'

    // Wait 2 seconds to show success message, then logout and redirect
    setTimeout(() => {
      authStore.logout()
      router.push('/')
    }, 2000)

  } catch (error) {
    console.error('Error deleting account:', error)
    errorMessage.value = error.response?.data?.message || 'Failed to delete account'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.delete-account {
  max-width: 700px;
}

h2 {
  font-size: 1.75rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.section-description {
  color: #666;
  margin-bottom: 2rem;
}

.danger-zone {
  background: #fff3f3;
  border: 2px solid #ffcdd2;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
}

.warning-icon {
  text-align: center;
  color: #d32f2f;
  margin-bottom: 1rem;
}

.warning-content h3 {
  color: #d32f2f;
  font-size: 1.25rem;
  margin-bottom: 1rem;
  text-align: center;
}

.warning-content p {
  color: #666;
  margin-bottom: 0.75rem;
  font-weight: 500;
}

.warning-content ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.warning-content ul li {
  padding: 0.5rem 0;
  padding-left: 1.5rem;
  position: relative;
  color: #555;
}

.warning-content ul li::before {
  content: '•';
  position: absolute;
  left: 0.5rem;
  color: #d32f2f;
  font-weight: bold;
}

.delete-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.95rem;
  font-weight: 600;
  color: #555;
}

.form-input {
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: border-color 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #d32f2f;
}

.checkbox-group {
  margin-top: 0.5rem;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  cursor: pointer;
  font-weight: 500;
  color: #555;
}

.checkbox-label input[type="checkbox"] {
  margin-top: 0.25rem;
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.success-message {
  background: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
}

.error-message {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
  padding: 1rem;
  border-radius: 8px;
  text-align: center;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1rem;
}

.cancel-btn, .delete-btn {
  padding: 0.875rem 2rem;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.cancel-btn:hover:not(:disabled) {
  background: #e0e0e0;
}

.delete-btn {
  background: #d32f2f;
  color: white;
}

.delete-btn:hover:not(:disabled) {
  background: #b71c1c;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(211, 47, 47, 0.3);
}

.cancel-btn:disabled, .delete-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .form-actions {
    flex-direction: column-reverse;
  }

  .cancel-btn, .delete-btn {
    width: 100%;
  }
}
</style>
