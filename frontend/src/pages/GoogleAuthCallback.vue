<template>
  <div class="auth-callback-page">
    <div class="callback-container">
      <div class="loading-spinner"></div>
      <h2>{{ message }}</h2>
      <p v-if="error" class="error-text">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const message = ref('Completing Google Sign-In...')
const error = ref('')

onMounted(async () => {
  try {
    const token = route.query.token
    const errorParam = route.query.error

    if (errorParam) {
      error.value = 'Authentication failed. Please try again.'
      message.value = 'Authentication Error'
      setTimeout(() => {
        router.push('/login')
      }, 3000)
      return
    }

    if (!token) {
      error.value = 'No authentication token received.'
      message.value = 'Authentication Error'
      setTimeout(() => {
        router.push('/login')
      }, 3000)
      return
    }

    // Store token in authStore (this will also set it in localStorage)
    authStore.token = token
    authStore.setAuthHeader(token)

    // Verify token and get user info using the authStore method
    const verified = await authStore.verifyToken()

    if (!verified) {
      throw new Error('Token verification failed')
    }

    message.value = 'Success! Redirecting...'

    // Redirect to home page immediately (no delay needed)
    router.push('/')

  } catch (err) {
    console.error('Google auth callback error:', err)
    error.value = 'An error occurred during authentication.'
    message.value = 'Authentication Error'
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  }
})
</script>

<style scoped>
.auth-callback-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #00AAFF 0%, #66D1FF 100%);
}

.callback-container {
  text-align: center;
  background: white;
  padding: 3rem 2rem;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  max-width: 400px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #00AAFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1.5rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

h2 {
  color: #333;
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.error-text {
  color: #d32f2f;
  margin-top: 1rem;
  font-size: 0.95rem;
}
</style>
