import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '../public/assets/styles/global.css'
import App from './App.vue'
import router from './routes'
import { useAuthStore } from './stores/authStore'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Verify token on app start and wait for it to complete before mounting
const authStore = useAuthStore()
authStore.verifyToken().then(() => {
  app.mount('#app')
})
