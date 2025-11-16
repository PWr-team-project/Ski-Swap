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
            <span class="tab-icon" :style="{ maskImage: `url(${tab.icon})`, WebkitMaskImage: `url(${tab.icon})` }"></span>
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
import { ref } from 'vue'
import EditProfile from '../components/settings/EditProfile.vue'
import ChangePassword from '../components/settings/ChangePassword.vue'
import DeleteAccount from '../components/settings/DeleteAccount.vue'

const activeTab = ref('profile')

const tabs = [
  { id: 'profile', label: 'Edit Profile', icon: '/assets/icons/user.svg' },
  { id: 'password', label: 'Change Password', icon: '/assets/icons/lock.svg' },
  { id: 'delete', label: 'Delete Account', icon: '/assets/icons/trash.svg' }
]
</script>

<style scoped>
.profile-settings-page {
  background: linear-gradient(135deg, #f0f7ff 0%, #e3f2fd 100%);
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 170, 255, 0.12);
  border: 1px solid rgba(0, 170, 255, 0.1);
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
  transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-bottom-color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
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
  display: inline-block;
  width: 20px;
  height: 20px;
  background-color: #666;
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
  -webkit-mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
  transition: background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.tab-button:hover .tab-icon,
.tab-button.active .tab-icon {
  background-color: #00AAFF;
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
