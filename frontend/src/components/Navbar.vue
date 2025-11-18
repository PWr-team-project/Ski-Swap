<!-- components/Navbar.vue -->
<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Computed property to check if user is logged in
const isLoggedIn = computed(() => authStore.isLoggedIn)
const currentUser = computed(() => authStore.user)
const isAdmin = computed(() => authStore.isAdmin)

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
    const buttons = []

    // Only show messages for non-admin users
    if (!isAdmin.value) {
      buttons.push({
        id: 1,
        color: '#66D1FF',
        hoverColor: '#0088CC',
        imgSrc: '/assets/images/chat_icon.png',
        alt: 'Messages',
        action: 'messages'
      })
    }

    // Always show profile dropdown
    buttons.push({
      id: 2,
      color: '#66D1FF',
      hoverColor: '#0088CC',
      imgSrc: '/assets/images/profile_icon.png',
      alt: 'Profile',
      action: 'profile'
    })

    return buttons
  } else {
    // Show only login button when not logged in
    return []
  }
})

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
  router.push('/create-listing')
}

function handleMenuClick(action) {
  closeProfileDropdown()
  if (action === 'profile') {
    router.push('/profile')
  } else if (action === 'viewProfile') {
    // Navigate to public profile view using current user's ID
    router.push(`/user/${currentUser.value.id}`)
  } else if (action === 'listings') {
    router.push('/my-listings')
  } else if (action === 'bookings') {
    router.push('/my-bookings')
  } else if (action === 'settings') {
    router.push('/profile-settings')
  } else if (action === 'verificationRequests') {
    router.push('/admin/verification-requests')
  } else if (action === 'inspectUsers') {
    router.push('/admin/inspect-users')
  }
}

function handleLogout() {
  closeProfileDropdown()
  authStore.logout()
  router.push('/')
}

// Helper function to get full photo URL
function getPhotoUrl(photoPath) {
  if (!photoPath) return null
  // If it's already a full URL (starts with http), return as is
  if (photoPath.startsWith('http')) return photoPath
  // Otherwise, prepend the API URL
  return `${API_URL}${photoPath}`
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
      <!-- Create Listing button - only show when logged in and not admin -->
      <button v-if="isLoggedIn && !isAdmin" class="create-listing" @click="handleCreateListing">
        <span class="plus-icon">+</span>
        Create Listing
      </button>

      <!-- Icon buttons (Messages and Profile when logged in) -->
      <div v-for="button in iconButtons" :key="button.id" class="icon-wrapper">
        <button
          class="icon-button"
          @click="handleIconClick(button.action)"
        >
          <img v-if="button.imgSrc" :src="button.imgSrc" :alt="button.alt" class="icon-img" />
        </button>

        <!-- Profile dropdown - only show for profile button -->
        <div v-if="button.action === 'profile' && showProfileDropdown" class="profile-dropdown">
          <!-- Profile Section - Clickable Header (only for non-admin) -->
          <button
            v-if="!isAdmin"
            @click="handleMenuClick('settings')"
            class="dropdown-header"
          >
            <div class="profile-avatar">
              <img
                v-if="currentUser?.profile_photo"
                :src="getPhotoUrl(currentUser.profile_photo)"
                alt="Profile"
                class="avatar-img"
              />
              <div v-else class="avatar-placeholder">
                {{ (currentUser?.nickname || 'U')[0].toUpperCase() }}
              </div>
            </div>
            <div class="profile-info">
              <p class="user-name">My Profile</p>
              <p class="user-email">{{ currentUser?.email || '' }}</p>
            </div>
          </button>

          <!-- Admin Profile Section - Non-clickable Header -->
          <div v-if="isAdmin" class="dropdown-header-static">
            <div class="profile-avatar">
              <img
                v-if="currentUser?.profile_photo"
                :src="getPhotoUrl(currentUser.profile_photo)"
                alt="Profile"
                class="avatar-img"
              />
              <div v-else class="avatar-placeholder">
                {{ (currentUser?.nickname || 'U')[0].toUpperCase() }}
              </div>
            </div>
            <div class="profile-info">
              <p class="user-name">Admin Panel</p>
              <p class="user-email">{{ currentUser?.email || '' }}</p>
            </div>
          </div>

          <!-- Menu Items -->
          <div class="dropdown-menu">
            <!-- Admin-specific menu items -->
            <template v-if="isAdmin">
              <button @click="handleMenuClick('verificationRequests')" class="menu-item admin-item">
                <img src="/assets/icons/verified_icon.svg" alt="Verification Requests" class="menu-icon-img icon-admin" />
                <span class="menu-text">Verification Requests</span>
              </button>
              <button @click="handleMenuClick('inspectUsers')" class="menu-item admin-item">
                <img src="/assets/images/profile_icon.png" alt="Inspect Users" class="menu-icon-img icon-admin" />
                <span class="menu-text">Inspect Users</span>
              </button>
            </template>

            <!-- Regular user menu items -->
            <template v-else>
              <button @click="handleMenuClick('viewProfile')" class="menu-item">
                <img src="/assets/images/profile_icon.png" alt="View Profile" class="menu-icon-img icon-black" />
                <span class="menu-text">See your profile</span>
              </button>

              <button @click="handleMenuClick('listings')" class="menu-item">
                <img src="/assets/images/listings_icon.png" alt="Listings" class="menu-icon-img" />
                <span class="menu-text">Listings</span>
              </button>

              <button @click="handleMenuClick('bookings')" class="menu-item">
                <img src="/assets/images/bookings_icon.png" alt="Bookings" class="menu-icon-img" />
                <span class="menu-text">My bookings</span>
              </button>
            </template>
          </div>

          <div class="dropdown-divider"></div>

          <button @click="handleLogout" class="logout-button">
            <img src="/assets/images/logout_icon.png" alt="Logout" class="logout-icon-img" />
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
  background: transparent;
  padding: 0.4rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border-radius: 20px;
}

.icon-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.icon-img {
  width: 36px;
  height: 36px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
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
  min-width: 260px;
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
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #f0f7ff 0%, #e3f2fd 100%);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border: none;
  cursor: pointer;
  transition: background 0.2s ease;
  text-align: left;
}

.dropdown-header:hover {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
}

.dropdown-header-static {
  width: 100%;
  padding: 1rem;
  background: linear-gradient(135deg, #f0f7ff 0%, #e3f2fd 100%);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-align: left;
}

.profile-avatar {
  flex-shrink: 0;
}

.avatar-img {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #00AAFF;
}

.avatar-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background-color: #00AAFF;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  border: 2px solid #00AAFF;
}

.profile-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 600;
  font-size: 1rem;
  color: #1a1a1a;
  margin: 0 0 0.25rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-email {
  font-size: 0.8rem;
  color: #666;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-divider {
  height: 1px;
  background-color: #e0e0e0;
  margin: 0;
}

.dropdown-menu {
  padding: 0.5rem 0;
}

.menu-item {
  width: 100%;
  padding: 0.75rem 1rem;
  background-color: white;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 1.1rem;
  color: #333;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.menu-item:hover {
  background-color: #f5f5f5;
}

.menu-icon {
  font-size: 1.25rem;
  width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-icon-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.icon-black {
  filter: brightness(0);
}

.icon-admin {
  filter: invert(40%) sepia(94%) saturate(2397%) hue-rotate(185deg) brightness(99%) contrast(101%);
}

.admin-item {
  background: linear-gradient(135deg, #f0f7ff 0%, #e3f2fd 100%);
  border-left: 3px solid #00AAFF;
}

.admin-item:hover {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
}

.menu-icon-svg {
  width: 20px;
  height: 20px;
  color: #666;
}

.menu-text {
  flex: 1;
}

.logout-button {
  width: 100%;
  padding: 0.875rem 1rem;
  background-color: white;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s;
  font-size: 1.1rem;
  color: #d32f2f;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logout-button:hover {
  background-color: #ffebee;
}

.logout-icon {
  font-size: 1.25rem;
  width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logout-icon-img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}
</style>