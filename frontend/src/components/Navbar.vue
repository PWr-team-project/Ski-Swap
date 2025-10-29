<!-- components/Navbar.vue -->
<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()

// Computed property to check if user is logged in
const isLoggedIn = computed(() => authStore.isLoggedIn)
const currentUser = computed(() => authStore.user)

// Profile dropdown state
const showProfileDropdown = ref(false)

function toggleProfileDropdown() {
  showProfileDropdown.value = !showProfileDropdown.value
}

function closeProfileDropdown() {
  showProfileDropdown.value = false
}

// Close dropdown when clicking outside
function handleClickOutside(event) {
  const dropdown = document.querySelector('.profile-dropdown')
  const profileButton = event.target.closest('.icon-button')

  if (dropdown && !dropdown.contains(event.target) && !profileButton) {
    closeProfileDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Dynamic icon buttons based on auth state
const iconButtons = computed(() => {
  if (isLoggedIn.value) {
    // Show message and profile icons when logged in
    return [
      {
        id: 1,
        color: '#66D1FF',
        hoverColor: '#0088CC',
        imgSrc: '/assets/images/chat_icon.png',
        alt: 'Messages',
        action: 'messages'
      },
      {
        id: 2,
        color: '#66D1FF',
        hoverColor: '#0088CC',
        imgSrc: '/assets/images/profile_icon.png',
        alt: 'Profile',
        action: 'profile'
      }
    ]
  } else {
    // Show only login button when not logged in
    return []
  }
})

function buttonHover(event, hoverColor, originalColor) {
  event.target.style.backgroundColor = hoverColor || originalColor
}

function buttonLeave(event, originalColor) {
  event.target.style.backgroundColor = originalColor
}

function handleIconClick(action) {
  if (action === 'login') {
    router.push('/login')
  } else if (action === 'profile') {
    toggleProfileDropdown()
  } else if (action === 'messages') {
    router.push('/messages')
  }
}

function handleCreateListing() {
  // Navigate to create listing page (to be implemented)
  console.log('Navigate to create listing')
}

function handleLogout() {
  closeProfileDropdown()
  authStore.logout()
  router.push('/')
}
</script>

<template>
  <header class="navbar">
    <!-- Logo on the left -->
    <router-link to="/" class="logo">
      <img src="/assets/images/logo.png" alt="Logo" class="logo-img" />
      <span class="logo-text">Ski-Swap</span>
    </router-link>

    <!-- Right side buttons -->
    <div class="nav-actions">
      <!-- Create Listing button - only show when logged in -->
      <button v-if="isLoggedIn" class="create-listing" @click="handleCreateListing">
        <span class="plus-icon">+</span>
        Create Listing
      </button>

      <!-- Icon buttons (Messages and Profile when logged in) -->
      <div v-for="button in iconButtons" :key="button.id" class="icon-wrapper">
        <button
          class="icon-button"
          :style="{ backgroundColor: button.color }"
          @mouseover="(e) => buttonHover(e, button.hoverColor, button.color)"
          @mouseleave="(e) => buttonLeave(e, button.color)"
          @click="handleIconClick(button.action)"
        >
          <img v-if="button.imgSrc" :src="button.imgSrc" :alt="button.alt" class="icon-img" />
        </button>

        <!-- Profile dropdown - only show for profile button -->
        <div v-if="button.action === 'profile' && showProfileDropdown" class="profile-dropdown">
          <div class="dropdown-header">
            <p class="user-name">{{ currentUser?.nickname || 'User' }}</p>
            <p class="user-email">{{ currentUser?.email || '' }}</p>
          </div>
          <div class="dropdown-divider"></div>
          <button @click="handleLogout" class="logout-button">
            <span>Logout</span>
          </button>
        </div>
      </div>

      <!-- Login button - only show when not logged in -->
      <button v-if="!isLoggedIn" class="login-button" @click="handleIconClick('login')">
        LOG IN
      </button>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #00AAFF; /* Navbar background */
  padding: 1rem 2rem;
  color: white;
  border-bottom: 5px solid white; /* Thick white bottom border */
}

.logo {
  display: flex;
  align-items: center;
  font-weight: bold;
  font-size: 1.8rem;
  text-decoration: none;
  color: white;
  cursor: pointer;
  transition: opacity 0.3s ease;
}

.logo:hover {
  opacity: 0.9;
}

.logo-img {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.logo-text {
  margin-left: 0.5rem;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  position: relative;
}

.icon-wrapper {
  position: relative;
}

.create-listing {
  background-color: white;
  color: #00aaff;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 20px;
  font-weight: bold;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.3rem;
}

.plus-icon {
  font-size: 1.3rem;
  font-weight: bold;
  line-height: 1;
}

.create-listing:hover {
  background-color: #e0f7ff;
}

.icon-button {
  border: none;
  border-radius: 50%;
  padding: 0.4rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.icon-img {
  width: 36px;
  height: 36px;
}

.login-button {
  background-color: white;
  color: #00aaff;
  border: none;
  padding: 0.6rem 1.5rem;
  border-radius: 20px;
  font-weight: bold;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
}

.login-button:hover {
  background-color: #e0f7ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Profile Dropdown */
.profile-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  min-width: 220px;
  z-index: 1000;
  overflow: hidden;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-header {
  padding: 1rem;
  background-color: #f8f9fa;
}

.user-name {
  font-weight: 600;
  font-size: 1rem;
  color: #333;
  margin: 0 0 0.25rem 0;
}

.user-email {
  font-size: 0.875rem;
  color: #666;
  margin: 0;
  word-break: break-word;
}

.dropdown-divider {
  height: 1px;
  background-color: #e0e0e0;
}

.logout-button {
  width: 100%;
  padding: 0.875rem 1rem;
  background-color: white;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 0.95rem;
  color: #d32f2f;
  font-weight: 500;
}

.logout-button:hover {
  background-color: #f5f5f5;
}
</style>