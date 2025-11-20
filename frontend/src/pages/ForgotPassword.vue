<template>
  <div class="forgot-password-page">
    <div class="forgot-password-container">
      <div class="forgot-password-card">
        <!-- Logo and Title -->
        <div class="header-section">
          <img src="/assets/images/logo_black.png" alt="Ski-Swap Logo" class="app-logo" />
        </div>

        <h2 class="page-title">Forgot Password</h2>
        <p class="page-description">
          Enter your email address and we'll send you a code to reset your password.
        </p>

        <!-- Form -->
        <form @submit.prevent="handleSubmit" class="forgot-password-form" autocomplete="off">
          <div class="form-group">
            <label for="email">Email Address</label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="Enter your email"
              autocomplete="off"
              required
              class="form-input"
              :disabled="loading"
            />
          </div>

          <button type="submit" class="submit-button" :disabled="loading">
            {{ loading ? 'Sending...' : 'Send Reset Code' }}
          </button>
        </form>

        <!-- Success message -->
        <div v-if="success" class="success-message">
          <p>{{ successMessage }}</p>
        </div>

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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { passwordResetService } from '@/services/passwordResetService'

const router = useRouter()
const email = ref('')
const error = ref('')
const success = ref(false)
const successMessage = ref('')
const loading = ref(false)

const handleSubmit = async () => {
  error.value = ''
  success.value = false
  loading.value = true

  if (!email.value) {
    error.value = 'Please enter your email address'
    loading.value = false
    return
  }

  try {
    const response = await passwordResetService.requestResetCode(email.value)

    success.value = true
    successMessage.value = response.message

    // Redirect to verify code page after 2 seconds
    setTimeout(() => {
      router.push({
        name: 'VerifyResetCode',
        query: { email: email.value }
      })
    }, 2000)
  } catch (err) {
    if (err.response?.data?.message) {
      error.value = err.response.data.message
    } else {
      error.value = 'Failed to send reset code. Please try again.'
    }
    console.error('Forgot password error:', err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.forgot-password-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f7ff 0%, #e3f2fd 100%);
  padding: 2rem;
}

.forgot-password-container {
  width: 100%;
  max-width: 450px;
}

.forgot-password-card {
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

.forgot-password-form {
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

.submit-button {
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

.submit-button:hover:not(:disabled) {
  background: #0088CC;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 170, 255, 0.3);
}

.submit-button:active:not(:disabled) {
  transform: translateY(0);
}

.submit-button:disabled {
  background: #99ccee;
  cursor: not-allowed;
  transform: none;
}

.success-message {
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.95rem;
  text-align: center;
  animation: fadeIn 0.3s ease;
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
  .forgot-password-page {
    padding: 1rem;
  }

  .forgot-password-card {
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
  .forgot-password-card {
    padding: 1.5rem 1.25rem;
  }

  .page-title {
    font-size: 1.25rem;
    margin-bottom: 1.5rem;
  }

  .form-input {
    padding: 0.75rem 0.875rem;
  }

  .submit-button {
    padding: 0.875rem;
    font-size: 1rem;
  }
}
</style>
