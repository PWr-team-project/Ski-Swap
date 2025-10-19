<template>
  <div class="carousel-container">
    <div class="carousel-header">
      <h2 class="carousel-title">{{ title }}</h2>
      <div class="carousel-controls">
        <button @click="scrollCarousel(-1)" class="carousel-btn prev">
            <img src="/assets/images/left_arrow.png" alt="Arrow" class="arrow-img"/>
        </button>
        <button @click="scrollCarousel(1)" class="carousel-btn next">
          <img src="/assets/images/right_arrow.png" alt="Arrow" class="arrow-img"/>
        </button>
        <button class="view-all-btn" @click="handleViewAll">View All →</button>
      </div>
    </div>
    <div class="carousel-track" ref="carouselTrack">
      <div 
        v-for="item in items" 
        :key="item.id" 
        class="carousel-item"
        @click="handleItemClick(item)"
      >
        <div class="item-image">
          <img :src="item.image" :alt="item.name" />
        </div>
        <div class="item-details">
          <p class="item-category">{{ item.category }}</p>
          <h3 class="item-name">{{ item.name }}</h3>
          <div class="item-footer">
            <p class="item-price">${{ item.price }}<span>/day</span></p>
            <p class="item-location">📍 {{ item.location }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// Props
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  items: {
    type: Array,
    required: true
  },
  carouselId: {
    type: String,
    required: true
  }
});

// Emits
const emit = defineEmits(['view-all', 'item-click']);

// Ref
const carouselTrack = ref(null);

// Methods
const scrollCarousel = (direction) => {
  if (carouselTrack.value) {
    const scrollAmount = 340; // card width + gap
    carouselTrack.value.scrollBy({
      left: direction * scrollAmount,
      behavior: 'smooth'
    });
  }
};

const handleViewAll = () => {
  emit('view-all', props.carouselId);
};

const handleItemClick = (item) => {
  emit('item-click', item);
};
</script>

<style scoped>


.carousel-container {
  max-width: 1400px;
  margin: 0 auto 4rem auto;
  background: white;
  padding: 2.5rem;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  z-index: 2;
}

.carousel-container:last-child {
  margin-bottom: 0;
}

.carousel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.carousel-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a1a;
}

.carousel-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.carousel-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid white;
  background: #66D1FF;
  color: #00AAFF;
  font-size: 2.5rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: top;
  line-height: 1; 
  padding: 0;
  transition: all 0.3s ease;
}

.carousel-btn:hover {
  background: #0088CC;
  color: white;
  transform: scale(1.05);
}

.view-all-btn {
  margin-left: 1rem;
  padding: 0.75rem 1.5rem;
  background: transparent;
  color: #00AAFF;
  border: 2px solid #00AAFF;
  border-radius: 25px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.view-all-btn:hover {
  background: #00AAFF;
  color: white;
}

.carousel-track {
  display: flex;
  gap: 1.5rem;
  overflow-x: auto;
  overflow-y: hidden;
  scroll-behavior: smooth;
  padding-bottom: 0.5rem;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.carousel-track::-webkit-scrollbar {
  display: none;
}

.carousel-item {
  flex: 0 0 320px;
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
}

.carousel-item:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 24px rgba(0, 170, 255, 0.2);
}

.item-image {
  width: 100%;
  height: 200px;
  overflow: hidden;
  background: #f0f0f0;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.carousel-item:hover .item-image img {
  transform: scale(1.05);
}

.item-details {
  padding: 1.25rem;
}

.item-category {
  font-size: 0.875rem;
  color: #00AAFF;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
}

.item-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 1rem;
  min-height: 3rem;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-price {
  font-size: 1.5rem;
  font-weight: 700;
  color: #00AAFF;
}

.item-price span {
  font-size: 1rem;
  font-weight: 400;
  color: #666;
}

.item-location {
  font-size: 1rem;
  color: #666;
}

/* Responsive carousel */
@media (max-width: 768px) {
  .carousel-container {
    padding: 1.5rem;
  }

  .carousel-title {
    font-size: 1.5rem;
  }
  
  .carousel-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .carousel-controls {
    width: 100%;
    justify-content: space-between;
  }
  
  .carousel-item {
    flex: 0 0 280px;
  }
  
  .view-all-btn {
    margin-left: auto;
  }
}
</style>