<script setup>
import Navbar from './components/Navbar.vue'
import Footer from './components/Footer.vue'
import ChatbotWidget from './components/ChatbotWidget.vue'
</script>

<template>
  <div class="app-container">
    <Navbar />
    <main class="main-content">
      <router-view />
    </main>
    <Footer />
    <ChatbotWidget />
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
}
</style>
