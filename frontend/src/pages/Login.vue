<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card">
        <!-- Logo and Title -->
        <div class="header-section">
          <img src="/assets/images/logo.png" alt="Ski-Swap Logo" class="app-logo" />
          <h1 class="app-title">Ski-Swap</h1>
        </div>

        <h2 class="login-title">Welcome Back</h2>

        <!-- Success message when redirected from register -->
        <p v-if="$route.query.registered === 'true'" class="success-message">
          Registration successful! Please log in to continue.
        </p>

        <!-- Login Form -->
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="Enter your email"
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
              required
              class="form-input"
            />
          </div>

          <button type="submit" class="login-button">
            Sign In
          </button>
        </form>

        <!-- Error message -->
        <p v-if="error" class="error-message">{{ error }}</p>

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

const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')

const handleLogin = async () => {
  error.value = ''

  // Basic validation
  if (!email.value || !password.value) {
    error.value = 'Please fill in all fields'
    return
  }

  try {
    // TODO: Implement actual login logic with backend
    console.log('Login attempt:', { email: email.value })

    // Placeholder for API call
    // const response = await axios.post('/api/auth/login', {
    //   email: email.value,
    //   password: password.value
    // })

    // For now, just redirect to home
    // router.push('/')

    error.value = 'Login functionality will be connected to backend'
  } catch (err) {
    error.value = err.response?.data?.message || 'Login failed. Please try again.'
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #00AAFF 0%, #66D1FF 100%);
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
