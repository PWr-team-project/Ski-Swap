import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from './stores/authStore'
import LandingPage from './pages/LandingPage.vue'
import Login from './pages/Login.vue'
import Register from './pages/Register.vue'
import ForgotPassword from './pages/ForgotPassword.vue'
import VerifyResetCode from './pages/VerifyResetCode.vue'
import ResetPassword from './pages/ResetPassword.vue'
import Messages from './pages/Messages.vue'
import BrowseItems from './pages/BrowseItems.vue'
import CreateListing from './pages/CreateListing.vue'
import MyListings from './pages/MyListings.vue'
import MyBookings from './pages/MyBookings.vue'
import UpdateListing from './pages/UpdateListing.vue'
import GoogleAuthCallback from './pages/GoogleAuthCallback.vue'
import SingleListing from './pages/SingleListing.vue'
import ProfileSettings from './pages/ProfileSettings.vue'
import UserProfile from './pages/UserProfile.vue'
import BookingDetails from './pages/BookingDetails.vue'
import Payment from './pages/Payment.vue'

// Admin pages
import VerificationRequests from './pages/admin/VerificationRequests.vue'
import VerificationDetail from './pages/admin/VerificationDetail.vue'
import InspectUsers from './pages/admin/InspectUsers.vue'
import UserDetail from './pages/admin/UserDetail.vue'

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
    path: '/forgot-password',
    name: 'ForgotPassword',
    component: ForgotPassword
  },
  {
    path: '/verify-reset-code',
    name: 'VerifyResetCode',
    component: VerifyResetCode
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: ResetPassword
  },
  {
    path: '/messages',
    name: 'Messages',
    component: Messages,
    meta: { requiresAuth: true }
  },
  {
    path: '/auth/google/success',
    name: 'GoogleAuthCallback',
    component: GoogleAuthCallback
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
  {
    path: '/my-listings',
    name: 'MyListings',
    component: MyListings,
    meta: { requiresAuth: true }
  },
  {
    path: '/my-bookings',
    name: 'MyBookings',
    component: MyBookings,
    meta: { requiresAuth: true }
  },
  {
    path: '/booking/:id',
    name: 'BookingDetails',
    component: BookingDetails,
    meta: { requiresAuth: true }
  },
  {
    path: '/payment/:id',
    name: 'Payment',
    component: Payment,
    meta: { requiresAuth: true }
  },
  {
    path: '/update-listing/:id',
    name: 'UpdateListing',
    component: UpdateListing,
    meta: { requiresAuth: true }
  },
  {
    path: '/listing/:id',
    name: 'SingleListing',
    component: SingleListing
  },
  {
    path: '/profile-settings',
    name: 'ProfileSettings',
    component: ProfileSettings,
    meta: { requiresAuth: true }
  },
  {
    path: '/user/:identifier',
    name: 'UserProfile',
    component: UserProfile
  },
  // Admin routes
  {
    path: '/admin/verification-requests',
    name: 'VerificationRequests',
    component: VerificationRequests,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/verification-requests/:id',
    name: 'VerificationDetail',
    component: VerificationDetail,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/inspect-users',
    name: 'InspectUsers',
    component: InspectUsers,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/users/:id',
    name: 'UserDetail',
    component: UserDetail,
    meta: { requiresAuth: true, requiresAdmin: true }
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

// Navigation guard to check authentication and admin access
router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore()

  // Check if route requires authentication
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!authStore.isLoggedIn) {
      // Redirect to login if not authenticated
      next({ name: 'Login', query: { redirect: to.fullPath } })
      return
    }
  }

  // Check if route requires admin access
  if (to.matched.some(record => record.meta.requiresAdmin)) {
    if (!authStore.isAdmin) {
      // Redirect to home if not admin
      alert('Access denied. Admin privileges required.')
      next({ name: 'Home' })
      return
    }
  }

  // Allow navigation
  next()
})

export default router
