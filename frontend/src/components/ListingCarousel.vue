<template>
  <div class="carousel-section">
    <h2 class="section-title">{{ title }}</h2>
    <div v-if="items.length === 0" class="empty-carousel">
      <p>No items available</p>
    </div>
    <div v-else class="carousel-container">
      <button @click="scrollCarousel(-1)" class="carousel-nav prev">‹</button>
      <div class="carousel-track" ref="carouselTrack">
        <div
          v-for="item in items"
          :key="item.id"
          class="carousel-item"
          @click="$emit('item-click', item.id)"
        >
          <div class="carousel-item-image">
            <img :src="item.photos[0]" :alt="item.title" />
          </div>
          <div class="carousel-item-info">
            <h4 class="carousel-item-title">{{ item.title }}</h4>
            <p class="carousel-item-price">${{ item.dailyRate }}/day</p>
          </div>
        </div>
      </div>
      <button @click="scrollCarousel(1)" class="carousel-nav next">›</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  title: {
    type: String,
    required: true
  },
  items: {
    type: Array,
    default: () => []
  }
})

defineEmits(['item-click'])

const carouselTrack = ref(null)

const scrollCarousel = (direction) => {
  if (!carouselTrack.value) return

  const scrollAmount = 300
  carouselTrack.value.scrollBy({
    left: scrollAmount * direction,
    behavior: 'smooth'
  })
}
</script>

<style scoped>
.carousel-section {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 20px rgba(0, 170, 255, 0.1);
}

.section-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 1.5rem 0;
}

.empty-carousel {
  text-align: center;
  padding: 2rem;
  color: #666;
  font-style: italic;
}

.carousel-container {
  position: relative;
}

.carousel-track {
  display: flex;
  gap: 1.5rem;
  overflow-x: auto;
  scroll-behavior: smooth;
  padding: 1rem 0;
  scrollbar-width: none;
}

.carousel-track::-webkit-scrollbar {
  display: none;
}

.carousel-item {
  min-width: 280px;
  background: #f8fbff;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.carousel-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 20px rgba(0, 170, 255, 0.3);
  border-color: #00AAFF;
}

.carousel-item-image {
  width: 100%;
  aspect-ratio: 4/3;
  overflow: hidden;
}

.carousel-item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.carousel-item-info {
  padding: 1rem;
}

.carousel-item-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 0.5rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.carousel-item-price {
  font-size: 1rem;
  font-weight: 700;
  color: #00AAFF;
  margin: 0;
}

.carousel-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 50px;
  height: 50px;
  background: white;
  border: 2px solid #00AAFF;
  border-radius: 50%;
  color: #00AAFF;
  font-size: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

.carousel-nav:hover {
  background: #00AAFF;
  color: white;
}

.carousel-nav.prev {
  left: -25px;
}

.carousel-nav.next {
  right: -25px;
}

/* Responsive */
@media (max-width: 768px) {
  .carousel-nav {
    display: none;
  }
}
</style>
