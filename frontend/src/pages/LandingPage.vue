<template>
  <Navbar/>
  <div class="landing-page">
    <!-- Hero Section with Background Image -->
    <div class="hero-section">
      <!-- Background image placeholder -->
      <div class="hero-background"></div>
      
      <!-- Hero Content -->
      <div class="hero-content">
        <h1 class="hero-title">Rent Premium Ski & Snowboard Gear</h1>
        <p class="hero-subtitle">Find the perfect equipment for your next mountain adventure</p>
        
        <!-- Search Bar -->
        <div class="search-container">
          <div class="search-bar">
            <!-- Location Input -->
            <div class="search-input location-input">
              <span class="icon location-icon">📍</span>
              <input 
                type="text" 
                placeholder="Location (e.g., Aspen, CO)"
                v-model="location"
              />
            </div>
            
            <!-- Date Picker -->
            <div class="search-input date-input">
              <span class="icon calendar-icon">📅</span>
              <input 
                type="text" 
                placeholder="Select dates"
                v-model="dateRange"
                @click="showDatePicker = !showDatePicker"
                readonly
              />
            </div>
            
            <!-- Search Button -->
            <button class="search-button" @click="handleSearch">
              <span class="search-icon">🔍</span>
              <span class="search-text">Search</span>
            </button>
          </div>
          
          <!-- Simple Date Picker Placeholder -->
          <div v-if="showDatePicker" class="date-picker-popup">
            <div class="date-picker-header">
              <h3>Select Date Range</h3>
              <button @click="showDatePicker = false" class="close-btn">✕</button>
            </div>
            <div class="date-inputs">
              <div class="date-field">
                <label>Check-in</label>
                <input type="date" v-model="startDate" />
              </div>
              <div class="date-field">
                <label>Check-out</label>
                <input type="date" v-model="endDate" />
              </div>
            </div>
            <button @click="applyDates" class="apply-btn">Apply</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Carousels Section -->
    <div class="carousels-section">
      <Carousel 
        title="Skis" 
        :items="skisItems" 
        carousel-id="skis"
        @view-all="handleViewAll"
        @item-click="handleItemClick"
      />
      
      <Carousel 
        title="Snowboards" 
        :items="snowboardsItems" 
        carousel-id="snowboards"
        @view-all="handleViewAll"
        @item-click="handleItemClick"
      />
      
      <Carousel 
        title="Accessories" 
        :items="accessoriesItems" 
        carousel-id="accessories"
        @view-all="handleViewAll"
        @item-click="handleItemClick"
      />
      <WhyChooseSection />
    </div>
    <Footer />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import Navbar from '../components/Navbar.vue';
import Carousel from '../components/Carousel.vue';
import WhyChooseSection from '../components/WhyChooseSection.vue';
import Footer from '../components/Footer.vue';



// State
const location = ref('');
const startDate = ref('');
const endDate = ref('');
const showDatePicker = ref(false);

// Mock data for carousels
const skisItems = ref([
  {
    id: 1,
    category: 'Skis',
    name: 'K2 Mindbender 99Ti Skis',
    price: 45,
    location: 'Aspen, CO',
    image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop'
  },
  {
    id: 2,
    category: 'Skis',
    name: 'Rossignol Experience 88 Ti',
    price: 50,
    location: 'Jackson Hole, WY',
    image: 'https://images.unsplash.com/photo-1605540436563-5bca919ae766?w=400&h=300&fit=crop'
  },
  {
    id: 3,
    category: 'Skis',
    name: 'Atomic Maverick 95',
    price: 42,
    location: 'Park City, UT',
    image: 'https://images.unsplash.com/photo-1551524164-687a55dd1126?w=400&h=300&fit=crop'
  },
  {
    id: 4,
    category: 'Skis',
    name: 'Salomon QST 92',
    price: 48,
    location: 'Vail, CO',
    image: 'https://images.unsplash.com/photo-1609390621955-48e37fe2d7de?w=400&h=300&fit=crop'
  },
  {
    id: 5,
    category: 'Skis',
    name: 'Blizzard Rustler 10',
    price: 55,
    location: 'Whistler, BC',
    image: 'https://images.unsplash.com/photo-1551524559-8af4e6624178?w=400&h=300&fit=crop'
  },
  {
    id: 6,
    category: 'Skis',
    name: 'Völkl M6 Mantra',
    price: 52,
    location: 'Telluride, CO',
    image: 'https://images.unsplash.com/photo-1483381719261-1d24c6f0f7b0?w=400&h=300&fit=crop'
  }
]);

const snowboardsItems = ref([
  {
    id: 7,
    category: 'Snowboards',
    name: 'Burton Custom X',
    price: 40,
    location: 'Breckenridge, CO',
    image: 'https://images.unsplash.com/photo-1608447272409-a46ab38c6c90?w=400&h=300&fit=crop'
  },
  {
    id: 8,
    category: 'Snowboards',
    name: 'Lib Tech T.Rice Pro',
    price: 45,
    location: 'Tahoe, CA',
    image: 'https://images.unsplash.com/photo-1519315901367-dd6f52257273?w=400&h=300&fit=crop'
  },
  {
    id: 9,
    category: 'Snowboards',
    name: 'Jones Mountain Twin',
    price: 38,
    location: 'Steamboat, CO',
    image: 'https://images.unsplash.com/photo-1579189214311-f8e0f0f8f9f5?w=400&h=300&fit=crop'
  },
  {
    id: 10,
    category: 'Snowboards',
    name: 'Capita DOA',
    price: 42,
    location: 'Big Sky, MT',
    image: 'https://images.unsplash.com/photo-1600362834097-1c1c4a212024?w=400&h=300&fit=crop'
  },
  {
    id: 11,
    category: 'Snowboards',
    name: 'Ride Warpig',
    price: 43,
    location: 'Mammoth, CA',
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop'
  },
  {
    id: 12,
    category: 'Snowboards',
    name: 'GNU Rider\'s Choice',
    price: 39,
    location: 'Alta, UT',
    image: 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=400&h=300&fit=crop'
  }
]);

const accessoriesItems = ref([
  {
    id: 13,
    category: 'Accessories',
    name: 'Smith I/O Mag Goggles',
    price: 15,
    location: 'Aspen, CO',
    image: 'https://images.unsplash.com/photo-1605606274249-2e41f6e8a5b0?w=400&h=300&fit=crop'
  },
  {
    id: 14,
    category: 'Accessories',
    name: 'POC Obex SPIN Helmet',
    price: 12,
    location: 'Park City, UT',
    image: 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=400&h=300&fit=crop'
  },
  {
    id: 15,
    category: 'Accessories',
    name: 'Black Diamond Poles',
    price: 8,
    location: 'Jackson Hole, WY',
    image: 'https://images.unsplash.com/photo-1483381719261-1d24c6f0f7b0?w=400&h=300&fit=crop'
  },
  {
    id: 16,
    category: 'Accessories',
    name: 'Burton Backpack 25L',
    price: 10,
    location: 'Vail, CO',
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop'
  },
  {
    id: 17,
    category: 'Accessories',
    name: 'Dakine Boot Bag',
    price: 5,
    location: 'Whistler, BC',
    image: 'https://images.unsplash.com/photo-1585435465455-d1d0c66c5b7e?w=400&h=300&fit=crop'
  },
  {
    id: 18,
    category: 'Accessories',
    name: 'Oakley Flight Deck XM',
    price: 14,
    location: 'Breckenridge, CO',
    image: 'https://images.unsplash.com/photo-1600421464494-5b4c2ebf3d7f?w=400&h=300&fit=crop'
  },
  {
    id: 19,
    category: 'Accessories',
    name: 'Giro Range MIPS Helmet',
    price: 13,
    location: 'Tahoe, CA',
    image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=300&fit=crop'
  }
]);

// Computed 
const dateRange = computed(() => {
  if (startDate.value && endDate.value) {
    return `${formatDate(startDate.value)} - ${formatDate(endDate.value)}`;
  }
  return '';
});

// Methods
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const applyDates = () => {
  showDatePicker.value = false;
};

const handleSearch = () => {
  console.log('Searching...', {
    location: location.value,
    startDate: startDate.value,
    endDate: endDate.value
  });
  // TODO: Implement search logic
  // This would typically filter the items or navigate to a search results page
};

const handleViewAll = (carouselId) => {
  console.log('View all clicked for:', carouselId);
  // TODO: Navigate to category page
  // Example: router.push(`/category/${carouselId}`)
};

const handleItemClick = (item) => {
  console.log('Item clicked:', item);
  // TODO: Navigate to item detail page or show modal
  // Example: router.push(`/item/${item.id}`)
};
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.landing-page {
  width: 100%;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

.hero-section {
  position: relative;
  width: 100%;
  min-height: 70vh; /* reduced from 100vh */
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('assets/images/background4.png');
  background-size: cover;
  background-position: center 40%; /* shift up a bit for better framing */
  z-index: 1;
}

.hero-background::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.0);
  z-index: 2;
}

.hero-content {
  position: relative;
  z-index: 3;
  text-align: center;
  padding: 3rem 2rem;
  max-width: 1000px;
  width: 100%;
  top: -50px;
}

.hero-title {
  font-size: 3rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.75rem;
}

.hero-subtitle {
  font-size: 1.25rem;
  color: white;
  margin-bottom: 3rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
}

.search-container {
  position: relative;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
}

.search-bar {
  display: flex;
  background: white;
  border-radius: 50px;
  padding: 0.5rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  gap: 0.5rem;
  flex-wrap: wrap;
}

.search-input {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 200px;
  padding: 0.75rem 1.25rem;
  gap: 0.75rem;
}

.icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.search-input input {
  border: none;
  outline: none;
  font-size: 1rem;
  width: 100%;
  background: transparent;
  color: #333;
}

.search-input input::placeholder {
  color: #999;
}

.date-input {
  cursor: pointer;
  z-index: 2;
}

.carousels-section {
  position: relative;
  z-index: 1;
}
.search-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 2rem;
  background: #00AAFF;
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s ease;
  white-space: nowrap;
}

.search-button:hover {
  background: #66D1FF;
}

.search-icon {
  font-size: 1.25rem;
}

/* Date Picker Popup */
.date-picker-popup {
  position: absolute;
  top: calc(100% + 1rem);
  left: 50%;
  transform: translateX(-50%);
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  z-index: 10;
  min-width: 400px;
}

.date-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.date-picker-header h3 {
  font-size: 1.25rem;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.date-inputs {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.date-field {
  flex: 1;
}

.date-field label {
  display: block;
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.date-field input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
}

.date-field input:focus {
  border-color: #00AAFF;
}

.apply-btn {
  width: 100%;
  padding: 0.75rem;
  background: #00AAFF;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s ease;
  position: relative;
  z-index: 11;
}

.apply-btn:hover {
  background: #66D1FF;
}

/* Carousels Section */
.carousels-section {
  background: linear-gradient(135deg, #f5f9ff 0%, #e6f3ff 100%);
  padding: 4rem 2rem;
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-subtitle {
    font-size: 1.25rem;
  }
  
  .search-bar {
    flex-direction: column;
    border-radius: 20px;
  }
  
  .search-input {
    min-width: 100%;
  }
  
  .search-button {
    width: 100%;
    justify-content: center;
  }
  
  .date-picker-popup {
    min-width: 90vw;
    left: 5vw;
    transform: none;
  }
  
  .date-inputs {
    flex-direction: column;
  }
  
  .carousels-section {
    padding: 3rem 1rem;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
}
</style>