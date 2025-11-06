<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card">
        <!-- Logo and Title -->
        <div class="header-section">
          <img src="/assets/images/logo_black.png" alt="Ski-Swap Logo" class="app-logo" />
        </div>

        <h2 class="login-title">Welcome Back</h2>

        <!-- Success message when redirected from register -->
        <p v-if="$route.query.registered === 'true'" class="success-message">
          Registration successful! Please log in to continue.
        </p>

        <!-- Login Form -->
        <form @submit.prevent="handleLogin" class="login-form" autocomplete="off">
          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="Enter your email"
              autocomplete="new-email"
              required
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="Enter your password"
              autocomplete="new-password"
              required
              class="form-input"
            />
          </div>

          <button type="submit" class="login-button" :disabled="loading">
            {{ loading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <!-- Error message -->
        <p v-if="error" class="error-message">{{ error }}</p>

        <!-- Divider -->
        <div class="divider">
          <span>OR</span>
        </div>

        <!-- Google Sign-In Button -->
        <button @click="handleGoogleSignIn" class="google-button" type="button">
          <svg class="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        <!-- Register link -->
        <p class="register-link">
          Don't have an account?
          <router-link to="/register" class="link">Create one here</router-link>
        </p>

        <!-- Back to home -->
        <router-link to="/" class="back-link">
          ← Back to Home
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
  error.value = ''
  loading.value = true

  // Basic validation
  if (!email.value || !password.value) {
    error.value = 'Please fill in all fields'
    loading.value = false
    return
  }

  try {
    const result = await authStore.login({
      email: email.value,
      password: password.value
    })

    if (result.success) {
      // Redirect to home page after successful login
      router.push('/')
    } else {
      error.value = result.error || 'Login failed. Please try again.'
    }
  } catch (err) {
    error.value = 'An unexpected error occurred. Please try again.'
    console.error('Login error:', err)
  } finally {
    loading.value = false
  }
}

const handleGoogleSignIn = () => {
  // Redirect to backend Google OAuth endpoint
  window.location.href = 'http://localhost:5000/api/auth/google'
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f7ff 0%, #e3f2fd 100%);
  padding: 2rem;
}

.login-container {
  width: 100%;
  max-width: 450px;
}

.login-card {
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

.app-title {
  font-size: 2rem;
  font-weight: 700;
  color: #00AAFF;
  margin: 0;
}

.login-title {
  font-size: 1.75rem;
  font-weight: 600;
  color: #333;
  text-align: center;
  margin-bottom: 2rem;
}

.success-message {
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-size: 0.95rem;
  text-align: center;
}

.login-form {
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

.form-input::placeholder {
  color: #999;
}

.login-button {
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

.login-button:hover {
  background: #0088CC;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 170, 255, 0.3);
}

.login-button:active {
  transform: translateY(0);
}

.login-button:disabled {
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
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  margin: 1.5rem 0;
  color: #999;
  font-size: 0.875rem;
  font-weight: 500;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #e0e0e0;
}

.divider span {
  padding: 0 1rem;
}

.google-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  color: #444;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-bottom: 1.5rem;
}

.google-button:hover {
  border-color: #00AAFF;
  background: #f8f9fa;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.google-button:active {
  transform: translateY(0);
}

.google-icon {
  width: 20px;
  height: 20px;
}

.register-link {
  text-align: center;
  color: #666;
  font-size: 0.95rem;
  margin-bottom: 1rem;
}

.link {
  color: #00AAFF;
  text-decoration: none;
  font-weight: 600;
  transition: color 0.3s ease;
}

.link:hover {
  color: #0088CC;
  text-decoration: underline;
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
  .login-page {
    padding: 1rem;
  }

  .login-card {
    padding: 2rem 1.5rem;
  }

  .app-logo {
    width: 60px;
    height: 60px;
  }

  .app-title {
    font-size: 1.75rem;
  }

  .login-title {
    font-size: 1.5rem;
  }
}

@media (max-width: 480px) {
  .login-card {
    padding: 1.5rem 1.25rem;
  }

  .app-title {
    font-size: 1.5rem;
  }

  .login-title {
    font-size: 1.25rem;
    margin-bottom: 1.5rem;
  }

  .form-input {
    padding: 0.75rem 0.875rem;
  }

  .login-button {
    padding: 0.875rem;
    font-size: 1rem;
  }
}
</style>
