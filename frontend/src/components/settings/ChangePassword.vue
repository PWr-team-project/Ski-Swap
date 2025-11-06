<template>
  <div class="change-password">
    <h2>Change Password</h2>
    <p class="section-description">Update your password to keep your account secure</p>

    <!-- OAuth User Warning -->
    <div v-if="isOAuthUser" class="info-message">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
      <div>
        <strong>Google Account</strong>
        <p>You signed in with Google. You don't need to set a password for your account.</p>
      </div>
    </div>

    <form v-else @submit.prevent="handleSubmit" class="password-form">
      <div class="form-group">
        <label for="currentPassword">Current Password</label>
        <input
          id="currentPassword"
          v-model="formData.currentPassword"
          type="password"
          class="form-input"
          placeholder="Enter your current password"
          required
        />
      </div>

      <div class="form-group">
        <label for="newPassword">New Password</label>
        <input
          id="newPassword"
          v-model="formData.newPassword"
          type="password"
          class="form-input"
          placeholder="Enter your new password"
          required
          minlength="6"
        />
        <small class="input-hint">At least 6 characters</small>
      </div>

      <div class="form-group">
        <label for="confirmPassword">Confirm New Password</label>
        <input
          id="confirmPassword"
          v-model="formData.confirmPassword"
          type="password"
          class="form-input"
          placeholder="Confirm your new password"
          required
        />
      </div>

      <!-- Password strength indicator -->
      <div v-if="formData.newPassword" class="password-strength">
        <div class="strength-bar">
          <div
            class="strength-fill"
            :class="passwordStrength.class"
            :style="{ width: passwordStrength.width }"
          ></div>
        </div>
        <span :class="['strength-text', passwordStrength.class]">
          {{ passwordStrength.text }}
        </span>
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
        <button type="submit" class="save-btn" :disabled="loading">
          {{ loading ? 'Updating...' : 'Update Password' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useAuthStore } from '../../stores/authStore'
import axios from 'axios'

const authStore = useAuthStore()
const user = authStore.user

const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const isOAuthUser = computed(() => user?.oauth_provider === 'google')

const formData = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const passwordStrength = computed(() => {
  const password = formData.newPassword
  if (!password) return { width: '0%', class: '', text: '' }

  let strength = 0
  if (password.length >= 6) strength++
  if (password.length >= 10) strength++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
  if (/\d/.test(password)) strength++
  if (/[^a-zA-Z0-9]/.test(password)) strength++

  if (strength <= 2) {
    return { width: '33%', class: 'weak', text: 'Weak' }
  } else if (strength <= 4) {
    return { width: '66%', class: 'medium', text: 'Medium' }
  } else {
    return { width: '100%', class: 'strong', text: 'Strong' }
  }
})

const resetForm = () => {
  formData.currentPassword = ''
  formData.newPassword = ''
  formData.confirmPassword = ''
  successMessage.value = ''
  errorMessage.value = ''
}

const handleSubmit = async () => {
  loading.value = true
  successMessage.value = ''
  errorMessage.value = ''

  // Validation
  if (formData.newPassword !== formData.confirmPassword) {
    errorMessage.value = 'New passwords do not match'
    loading.value = false
    return
  }

  if (formData.newPassword.length < 6) {
    errorMessage.value = 'Password must be at least 6 characters'
    loading.value = false
    return
  }

  try {
    const token = authStore.token
    await axios.put(
      'http://localhost:5000/api/auth/change-password',
      {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      },
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    )

    successMessage.value = 'Password updated successfully!'
    resetForm()

    // Scroll to top to show success message
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (error) {
    console.error('Error changing password:', error)
    errorMessage.value = error.response?.data?.message || 'Failed to change password'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.change-password {
  max-width: 600px;
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

.info-message {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: #e3f2fd;
  border: 1px solid #90caf9;
  border-radius: 8px;
  color: #1565c0;
  margin-bottom: 2rem;
}

.info-message svg {
  flex-shrink: 0;
  margin-top: 0.15rem;
}

.info-message strong {
  display: block;
  margin-bottom: 0.25rem;
}

.info-message p {
  margin: 0;
  font-size: 0.9rem;
}

.password-form {
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
  border-color: #00AAFF;
}

.input-hint {
  font-size: 0.85rem;
  color: #999;
}

.password-strength {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.strength-bar {
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  transition: all 0.3s ease;
}

.strength-fill.weak {
  background: #f44336;
}

.strength-fill.medium {
  background: #ff9800;
}

.strength-fill.strong {
  background: #4caf50;
}

.strength-text {
  font-size: 0.875rem;
  font-weight: 600;
}

.strength-text.weak {
  color: #f44336;
}

.strength-text.medium {
  color: #ff9800;
}

.strength-text.strong {
  color: #4caf50;
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

.cancel-btn, .save-btn {
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

.save-btn {
  background: #00AAFF;
  color: white;
}

.save-btn:hover:not(:disabled) {
  background: #0088CC;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 170, 255, 0.3);
}

.cancel-btn:disabled, .save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .form-actions {
    flex-direction: column-reverse;
  }

  .cancel-btn, .save-btn {
    width: 100%;
  }
}
</style>
