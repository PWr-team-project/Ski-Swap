<template>
  <div class="profile-settings-page">
    <div class="settings-container">
      <div class="settings-header">
        <h1>Profile Settings</h1>
        <p>Manage your account settings and preferences</p>
      </div>

      <div class="settings-content">
        <!-- Tabs Navigation -->
        <div class="tabs-nav">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="['tab-button', { active: activeTab === tab.id }]"
          >
            <component :is="tab.icon" class="tab-icon" />
            <span>{{ tab.label }}</span>
          </button>
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
          <EditProfile v-if="activeTab === 'profile'" />
          <ChangePassword v-if="activeTab === 'password'" />
          <DeleteAccount v-if="activeTab === 'delete'" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, h } from 'vue'
import EditProfile from '../components/settings/EditProfile.vue'
import ChangePassword from '../components/settings/ChangePassword.vue'
import DeleteAccount from '../components/settings/DeleteAccount.vue'

// SVG Icons as components
const UserIcon = () => h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  width: '20',
  height: '20',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '2'
}, [
  h('path', { d: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2' }),
  h('circle', { cx: '12', cy: '7', r: '4' })
])

const LockIcon = () => h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  width: '20',
  height: '20',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '2'
}, [
  h('rect', { x: '3', y: '11', width: '18', height: '11', rx: '2', ry: '2' }),
  h('path', { d: 'M7 11V7a5 5 0 0 1 10 0v4' })
])

const TrashIcon = () => h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  width: '20',
  height: '20',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '2'
}, [
  h('polyline', { points: '3 6 5 6 21 6' }),
  h('path', { d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' })
])

const activeTab = ref('profile')

const tabs = [
  { id: 'profile', label: 'Edit Profile', icon: UserIcon },
  { id: 'password', label: 'Change Password', icon: LockIcon },
  { id: 'delete', label: 'Delete Account', icon: TrashIcon }
]
</script>

<style scoped>
.profile-settings-page {
  background: #f5f5f5;
  min-height: calc(100vh - 140px);
  padding: 2rem 0;
}

.settings-container {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 0 2rem;
}

.settings-header {
  text-align: center;
  margin-bottom: 2rem;
}

.settings-header h1 {
  font-size: 2.5rem;
  color: #333;
  margin-bottom: 0.5rem;
}

.settings-header p {
  font-size: 1.1rem;
  color: #666;
}

.settings-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.tabs-nav {
  display: flex;
  border-bottom: 2px solid #e0e0e0;
  background: #fafafa;
}

.tab-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.25rem 1rem;
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  font-size: 1rem;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-button:hover {
  background: #f0f0f0;
  color: #00AAFF;
}

.tab-button.active {
  color: #00AAFF;
  border-bottom-color: #00AAFF;
  background: white;
}

.tab-icon {
  width: 20px;
  height: 20px;
}

.tab-content {
  padding: 2rem;
  min-height: 400px;
}

@media (max-width: 768px) {
  .settings-container {
    margin: 1rem auto;
    padding: 0 1rem;
  }

  .settings-header h1 {
    font-size: 2rem;
  }

  .tabs-nav {
    flex-direction: column;
  }

  .tab-button {
    justify-content: flex-start;
    padding: 1rem 1.5rem;
  }

  .tab-content {
    padding: 1.5rem 1rem;
  }
}
</style>
