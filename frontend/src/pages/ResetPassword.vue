<template>
  <div class="reset-password-page">
    <div class="reset-password-container">
      <div class="reset-password-card">
        <!-- Logo and Title -->
        <div class="header-section">
          <img src="/assets/images/logo_black.png" alt="Ski-Swap Logo" class="app-logo" />
        </div>

        <h2 class="page-title">Reset Password</h2>
        <p class="page-description">
          Enter your new password below.
        </p>

        <!-- Form -->
        <form @submit.prevent="handleReset" class="reset-form">
          <div class="form-group">
            <label for="newPassword">New Password</label>
            <input
              id="newPassword"
              v-model="newPassword"
              type="password"
              placeholder="Enter new password"
              autocomplete="new-password"
              required
              class="form-input"
              :disabled="loading"
            />
            <p class="hint-text">Minimum 6 characters</p>
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirm New Password</label>
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              autocomplete="new-password"
              required
              class="form-input"
              :disabled="loading"
            />
          </div>

          <!-- Password match indicator -->
          <div v-if="newPassword && confirmPassword" class="password-match">
            <p v-if="passwordsMatch" class="match-success">✓ Passwords match</p>
            <p v-else class="match-error">✗ Passwords do not match</p>
          </div>

          <button
            type="submit"
            class="reset-button"
            :disabled="loading || !passwordsMatch || newPassword.length < 6"
          >
            {{ loading ? 'Resetting...' : 'Reset Password' }}
          </button>
        </form>

        <!-- Error message -->
        <p v-if="error" class="error-message">{{ error }}</p>

        <!-- Back to login -->
        <router-link to="/login" class="back-link">
          ← Back to Login
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { passwordResetService } from '@/services/passwordResetService'

const router = useRouter()
const route = useRoute()

const email = ref(route.query.email || '')
const code = ref(route.query.code || '')
const newPassword = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)

const passwordsMatch = computed(() => {
  return newPassword.value === confirmPassword.value && newPassword.value.length > 0
})

onMounted(() => {
  // If no email or code in query, redirect to forgot password page
  if (!email.value || !code.value) {
    router.push('/forgot-password')
  }
})

const handleReset = async () => {
  error.value = ''

  // Validation
  if (newPassword.value.length < 6) {
    error.value = 'Password must be at least 6 characters long'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }

  loading.value = true

  try {
    const response = await passwordResetService.resetPassword(
      email.value,
      code.value,
      newPassword.value
    )

    // Show success and redirect to login
    alert(response.message || 'Password reset successfully!')
    router.push({
      name: 'Login',
      query: { passwordReset: 'true' }
    })
  } catch (err) {
    if (err.response?.data?.message) {
      error.value = err.response.data.message
    } else if (err.response?.data?.errors) {
      error.value = err.response.data.errors[0]?.msg || 'Failed to reset password'
    } else {
      error.value = 'Failed to reset password. Please try again.'
    }
    console.error('Reset password error:', err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.reset-password-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f7ff 0%, #e3f2fd 100%);
  padding: 2rem;
}

.reset-password-container {
  width: 100%;
  max-width: 450px;
}

.reset-password-card {
  background: white;
  border-radius: 20px;
  padding: 3rem 2.5rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.header-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2rem;
}

.app-logo {
  width: 80px;
  height: 80px;
  object-fit: contain;
  margin-bottom: 1rem;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: #333;
  text-align: center;
  margin-bottom: 0.5rem;
}

.page-description {
  text-align: center;
  color: #666;
  font-size: 0.95rem;
  margin-bottom: 2rem;
  line-height: 1.5;
}

.reset-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
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
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s ease;
  outline: none;
}

.form-input:focus {
  border-color: #00AAFF;
  box-shadow: 0 0 0 3px rgba(0, 170, 255, 0.1);
}

.form-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.form-input::placeholder {
  color: #999;
}

.hint-text {
  font-size: 0.85rem;
  color: #999;
  margin: 0;
}

.password-match {
  margin: -0.5rem 0;
}

.password-match p {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 500;
}

.match-success {
  color: #28a745;
}

.match-error {
  color: #dc3545;
}

.reset-button {
  width: 100%;
  padding: 1rem;
  background: #00AAFF;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 0.5rem;
}

.reset-button:hover:not(:disabled) {
  background: #0088CC;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 170, 255, 0.3);
}

.reset-button:active:not(:disabled) {
  transform: translateY(0);
}

.reset-button:disabled {
  background: #99ccee;
  cursor: not-allowed;
  transform: none;
}

.error-message {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.95rem;
  text-align: center;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.back-link {
  display: block;
  text-align: center;
  color: #666;
  text-decoration: none;
  font-size: 0.95rem;
  transition: color 0.3s ease;
  margin-top: 1.5rem;
}

.back-link:hover {
  color: #00AAFF;
}

/* Responsive Design */
@media (max-width: 768px) {
  .reset-password-page {
    padding: 1rem;
  }

  .reset-password-card {
    padding: 2rem 1.5rem;
  }

  .app-logo {
    width: 60px;
    height: 60px;
  }

  .page-title {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .reset-password-card {
    padding: 1.5rem 1.25rem;
  }

  .page-title {
    font-size: 1.25rem;
  }

  .form-input {
    padding: 0.75rem 0.875rem;
  }

  .reset-button {
    padding: 0.875rem;
    font-size: 1rem;
  }
}
</style>
