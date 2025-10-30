import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from './pages/LandingPage.vue'
import Login from './pages/Login.vue'
import Register from './pages/Register.vue'
import Messages from './pages/Messages.vue'
import BrowseItems from './pages/BrowseItems.vue'
import CreateListing from './pages/CreateListing.vue'

// Static pages
import AboutUs from './pages/static/AboutUs.vue'
import Contact from './pages/static/Contact.vue'
import Partnership from './pages/static/Partnership.vue'
import FAQ from './pages/static/FAQ.vue'
import TrustSafety from './pages/static/TrustSafety.vue'
import MessageUs from './pages/static/MessageUs.vue'
import Terms from './pages/static/Terms.vue'
import Privacy from './pages/static/Privacy.vue'
import Cookies from './pages/static/Cookies.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: LandingPage
  },
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/register',
    name: 'Register',
    component: Register
  },
  {
    path: '/messages',
    name: 'Messages',
    component: Messages,
    meta: { requiresAuth: true }
  },
  {
    path: '/browse',
    name: 'BrowseItems',
    component: BrowseItems
  },
  {
    path: '/create-listing',
    name: 'CreateListing',
    component: CreateListing,
    meta: { requiresAuth: true }
  },
  // Company
  {
    path: '/about',
    name: 'AboutUs',
    component: AboutUs
  },
  {
    path: '/contact',
    name: 'Contact',
    component: Contact
  },
  {
    path: '/partnership',
    name: 'Partnership',
    component: Partnership
  },
  // Support
  {
    path: '/faq',
    name: 'FAQ',
    component: FAQ
  },
  {
    path: '/trust-safety',
    name: 'TrustSafety',
    component: TrustSafety
  },
  {
    path: '/message-us',
    name: 'MessageUs',
    component: MessageUs
  },
  // Legal
  {
    path: '/terms',
    name: 'Terms',
    component: Terms
  },
  {
    path: '/privacy',
    name: 'Privacy',
    component: Privacy
  },
  {
    path: '/cookies',
    name: 'Cookies',
    component: Cookies
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    // If there's a saved position (browser back/forward), use it
    if (savedPosition) {
      return savedPosition
    }
    // If navigating to a hash anchor, scroll to it
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    }
    // Otherwise, scroll to top
    return { top: 0, behavior: 'smooth' }
  }
})

export default router
