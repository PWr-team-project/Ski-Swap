<template>
  <div class="verify-code-page">
    <div class="verify-code-container">
      <div class="verify-code-card">
        <!-- Logo and Title -->
        <div class="header-section">
          <img src="/assets/images/logo_black.png" alt="Ski-Swap Logo" class="app-logo" />
        </div>

        <h2 class="page-title">Enter Verification Code</h2>
        <p class="page-description">
          We've sent a 6-digit code to <strong>{{ email }}</strong>.
          Please enter it below.
        </p>

        <!-- Code Input -->
        <form @submit.prevent="handleVerify" class="verify-form">
          <div class="form-group">
            <label for="code">Verification Code</label>
            <input
              id="code"
              v-model="code"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              maxlength="6"
              placeholder="000000"
              autocomplete="off"
              required
              class="code-input"
              :disabled="loading"
              @input="formatCode"
            />
            <p class="hint-text">Enter the 6-digit code from your email</p>
          </div>

          <button type="submit" class="verify-button" :disabled="loading || code.length !== 6">
            {{ loading ? 'Verifying...' : 'Verify Code' }}
          </button>
        </form>

        <!-- Error message -->
        <p v-if="error" class="error-message">{{ error }}</p>

        <!-- Resend code -->
        <div class="resend-section">
          <p class="resend-text">Didn't receive the code?</p>
          <button
            @click="handleResend"
            class="resend-button"
            :disabled="resendLoading || resendCooldown > 0"
          >
            {{ resendCooldown > 0 ? `Resend in ${resendCooldown}s` : (resendLoading ? 'Sending...' : 'Resend Code') }}
          </button>
        </div>

        <!-- Success message for resend -->
        <div v-if="resendSuccess" class="success-message">
          Code resent successfully! Check your email.
        </div>

        <!-- Back to login -->
        <router-link to="/login" class="back-link">
          ← Back to Login
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { passwordResetService } from '@/services/passwordResetService'

const router = useRouter()
const route = useRoute()

const email = ref(route.query.email || '')
const code = ref('')
const error = ref('')
const loading = ref(false)
const resendLoading = ref(false)
const resendSuccess = ref(false)
const resendCooldown = ref(0)

let cooldownInterval = null

onMounted(() => {
  // If no email in query, redirect to forgot password page
  if (!email.value) {
    router.push('/forgot-password')
  }
})

onUnmounted(() => {
  if (cooldownInterval) {
    clearInterval(cooldownInterval)
  }
})

const formatCode = (event) => {
  // Only allow numbers
  code.value = code.value.replace(/[^0-9]/g, '')
}

const handleVerify = async () => {
  error.value = ''
  loading.value = true

  if (code.value.length !== 6) {
    error.value = 'Please enter a valid 6-digit code'
    loading.value = false
    return
  }

  try {
    await passwordResetService.verifyResetCode(email.value, code.value)

    // Code verified successfully, redirect to reset password page
    router.push({
      name: 'ResetPassword',
      query: { email: email.value, code: code.value }
    })
  } catch (err) {
    if (err.response?.data?.message) {
      error.value = err.response.data.message
    } else {
      error.value = 'Invalid or expired code. Please try again.'
    }
    console.error('Verify code error:', err)
  } finally {
    loading.value = false
  }
}

const handleResend = async () => {
  error.value = ''
  resendSuccess.value = false
  resendLoading.value = true

  try {
    await passwordResetService.requestResetCode(email.value)

    resendSuccess.value = true
    code.value = '' // Clear the code input

    // Start cooldown timer (60 seconds)
    resendCooldown.value = 60
    cooldownInterval = setInterval(() => {
      resendCooldown.value--
      if (resendCooldown.value <= 0) {
        clearInterval(cooldownInterval)
        cooldownInterval = null
      }
    }, 1000)

    // Hide success message after 5 seconds
    setTimeout(() => {
      resendSuccess.value = false
    }, 5000)
  } catch (err) {
    if (err.response?.data?.message) {
      error.value = err.response.data.message
    } else {
      error.value = 'Failed to resend code. Please try again.'
    }
    console.error('Resend code error:', err)
  } finally {
    resendLoading.value = false
  }
}
</script>

<style scoped>
.verify-code-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f7ff 0%, #e3f2fd 100%);
  padding: 2rem;
}

.verify-code-container {
  width: 100%;
  max-width: 450px;
}

.verify-code-card {
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

.page-description strong {
  color: #00AAFF;
}

.verify-form {
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

.code-input {
  width: 100%;
  padding: 1.25rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 2rem;
  font-weight: 600;
  text-align: center;
  letter-spacing: 0.5rem;
  transition: all 0.3s ease;
  outline: none;
  font-family: 'Courier New', monospace;
}

.code-input:focus {
  border-color: #00AAFF;
  box-shadow: 0 0 0 3px rgba(0, 170, 255, 0.1);
}

.code-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.code-input::placeholder {
  color: #ccc;
  letter-spacing: 0.5rem;
}

.hint-text {
  font-size: 0.85rem;
  color: #999;
  margin: 0;
  text-align: center;
}

.verify-button {
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

.verify-button:hover:not(:disabled) {
  background: #0088CC;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 170, 255, 0.3);
}

.verify-button:active:not(:disabled) {
  transform: translateY(0);
}

.verify-button:disabled {
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

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.resend-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.resend-text {
  color: #666;
  font-size: 0.9rem;
  margin: 0;
}

.resend-button {
  background: none;
  border: none;
  color: #00AAFF;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 0.5rem 1rem;
  text-decoration: underline;
}

.resend-button:hover:not(:disabled) {
  color: #0088CC;
}

.resend-button:disabled {
  color: #999;
  cursor: not-allowed;
  text-decoration: none;
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
  .verify-code-page {
    padding: 1rem;
  }

  .verify-code-card {
    padding: 2rem 1.5rem;
  }

  .app-logo {
    width: 60px;
    height: 60px;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .code-input {
    font-size: 1.75rem;
  }
}

@media (max-width: 480px) {
  .verify-code-card {
    padding: 1.5rem 1.25rem;
  }

  .page-title {
    font-size: 1.25rem;
  }

  .code-input {
    font-size: 1.5rem;
    letter-spacing: 0.3rem;
  }

  .code-input::placeholder {
    letter-spacing: 0.3rem;
  }

  .verify-button {
    padding: 0.875rem;
    font-size: 1rem;
  }
}
</style>
