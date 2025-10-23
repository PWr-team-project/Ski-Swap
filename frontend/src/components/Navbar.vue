<!-- components/Navbar.vue -->
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Example props for icon customization (optional)
const iconButtons = ref([
  { id: 1, color: '#66D1FF', hoverColor: '#0088CC', imgSrc: '/assets/images/chat_icon.png', alt: 'Chat', action: null },
  { id: 2, color: '#66D1FF', hoverColor: '#0088CC', imgSrc: '/assets/images/profile_icon.png', alt: 'Profile', action: 'login' }
])

function buttonHover(button, hover) {
  button.color = hover ? button.hoverColor : '#66D1FF'
}

function handleIconClick(button) {
  if (button.action === 'login') {
    router.push('/login')
  }
  // Add more actions as needed for other buttons
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
      <button class="create-listing">
        <span class="plus-icon">+</span>
        Create Listing
      </button>

      <button
        v-for="button in iconButtons"
        :key="button.id"
        class="icon-button"
        :style="{ backgroundColor: button.color }"
        @mouseover="buttonHover(button, true)"
        @mouseleave="buttonHover(button, false)"
        @click="handleIconClick(button)"
      >
        <img v-if="button.imgSrc" :src="button.imgSrc" :alt="button.alt" class="icon-img" />
        <!-- fallback to svg if needed -->
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
</style>