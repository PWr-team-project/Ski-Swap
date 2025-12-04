<template>
  <div class="user-card" @click="handleClick">
    <div class="user-image">
      <img
        :src="userImageUrl"
        :alt="`${user.first_name} ${user.last_name}`"
      />
      <div class="user-badge">USER</div>
    </div>
    <div class="user-details">
      <p class="user-type">User Profile</p>
      <h3 class="user-name">{{ user.first_name }} {{ user.last_name }}</h3>
      <div class="user-footer">
        <p class="user-nickname">@{{ user.nickname }}</p>
        <p class="user-location">📍 {{ userLocation }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { getFullImageUrl } from '@/utils/api';

const props = defineProps({
  user: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['click']);

const userImageUrl = computed(() => {
  if (props.user.profile_photo) {
    return getFullImageUrl(props.user.profile_photo);
  }
  // Default avatar if no profile photo
  return 'https://via.placeholder.com/200x200?text=User';
});

const userLocation = computed(() => {
  if (props.user.location_id?.city) {
    return props.user.location_id.city;
  }
  return 'Location not set';
});

const handleClick = () => {
  emit('click', props.user);
};
</script>

<style scoped>
.user-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(102, 126, 234, 0.25);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 2px solid rgba(255, 255, 255, 0.3);
  position: relative;
}

.user-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 12px 32px rgba(102, 126, 234, 0.4);
  border-color: rgba(255, 255, 255, 0.6);
}

.user-image {
  position: relative;
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-image img {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 50%;
  border: 4px solid white;
  transition: transform 0.3s ease;
}

.user-card:hover .user-image img {
  transform: scale(1.05);
}

.user-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.95);
  color: #667eea;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.user-details {
  padding: 1.25rem;
  background: white;
}

.user-type {
  font-size: 0.875rem;
  color: #667eea;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.user-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 1rem;
  min-height: 2.5rem;
  line-height: 1.3;
}

.user-footer {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.user-nickname {
  font-size: 0.95rem;
  font-weight: 600;
  color: #667eea;
}

.user-location {
  font-size: 0.875rem;
  color: #666;
}

/* Make sure the card matches listing card height */
@media (min-width: 768px) {
  .user-card {
    height: 100%;
  }
}
</style>
