<template>
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
                placeholder="Location (e.g., Wroclaw, Poland)"
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
        title="Premium Skis" 
        :items="skisItems" 
        carousel-id="skis"
        @view-all="handleViewAll"
        @item-click="handleItemClick"
      />
      
      <Carousel
        title="Premium Snowboards" 
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
    </div>
    <WhyChooseSection/>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { listingService } from '@/services/listingService';
import { getFullImageUrl } from '@/utils/api';
import Carousel from '../components/Carousel.vue';
import WhyChooseSection from '../components/WhyChooseSection.vue';

const router = useRouter();
// State
const location = ref('');
const startDate = ref('');
const endDate = ref('');
const showDatePicker = ref(false);

// Real data from API
const skisItems = ref([]);
const snowboardsItems = ref([]);
const accessoriesItems = ref([]);

// Fetch listings from API
const fetchListings = async () => {
  try {
    const data = await listingService.getAll();
    const listings = data.listings || [];

    // Transform listings to match carousel component format
    const transformListing = (listing) => ({
      id: listing._id,
      category: listing.category_id?.name || 'Unknown',
      name: listing.title,
      price: listing.daily_rate,
      location: listing.location_id?.city,
      image: listing.photos && listing.photos.length > 0
        ? getFullImageUrl(listing.photos[0])
        : 'https://via.placeholder.com/400x300'
    });

    // Filter and populate each category
    skisItems.value = listings
      .filter(l => l.category_id?.name === 'Skis')
      .map(transformListing)
      .slice(0, 10);

    snowboardsItems.value = listings
      .filter(l => l.category_id?.name === 'Snowboards')
      .map(transformListing)
      .slice(0, 10);

    accessoriesItems.value = listings
      .filter(l => ['Accessories', 'Goggles', 'Helmets', 'Boots', 'Poles'].includes(l.category_id?.name))
      .map(transformListing)
      .slice(0, 10);

  } catch (error) {
    console.error('Error fetching listings:', error);
  }
};

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
  // Navigate to BrowseItems with query parameters
  router.push({
    name: 'BrowseItems',
    query: {
      location: location.value || '',
      startDate: startDate.value || '',
      endDate: endDate.value || ''
    }
  });
};

const handleViewAll = (carouselId) => {
  console.log('View all clicked for:', carouselId);
  // TODO: Navigate to category page or show filtered results
};

const handleItemClick = (item) => {
  router.push(`/listing/${item.id}`);
};

// Lifecycle
onMounted(() => {
  fetchListings();
});
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
  overflow-x: hidden;
  margin: 0;
  padding: 0;
}

.hero-section {
  position: relative;
  width: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  background-image: url('/assets/images/background4.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
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
  top:-100px;
  z-index: 3;
  text-align: center;
  padding: 2rem;
  max-width: 1200px;
  width: 100%;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.hero-subtitle {
  font-size: 1.5rem;
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
@media (max-width: 1024px) {
  .hero-content {
    top: -50px;
  }
  
  .hero-title {
    font-size: 3rem;
  }
  
  .hero-subtitle {
    font-size: 1.35rem;
  }
}

@media (max-width: 768px) {
  .hero-content {
    top: 0;
    padding: 1.5rem;
  }

  .hero-title {
    font-size: 2.5rem;
    margin-bottom: 0.75rem;
  }
  
  .hero-subtitle {
    font-size: 1.25rem;
    margin-bottom: 2rem;
  }
  
  .search-bar {
    flex-direction: column;
    border-radius: 20px;
    padding: 0.75rem;
  }
  
  .search-input {
    min-width: 100%;
    padding: 1rem 1.25rem;
  }
  
  .search-button {
    width: 100%;
    justify-content: center;
    padding: 1rem 2rem;
  }
  
  .date-picker-popup {
    min-width: 90vw;
    max-width: 90vw;
    left: 50%;
    transform: translateX(-50%);
  }
  
  .date-inputs {
    flex-direction: column;
  }
  
  .carousels-section {
    padding: 3rem 1rem;
  }
}

@media (max-width: 480px) {
  .hero-section {
    min-height: 100vh;
  }

  .hero-content {
    padding: 1rem;
    width: 100%;
  }

  .hero-title {
    font-size: 1.75rem;
    line-height: 1.2;
  }
  
  .hero-subtitle {
    font-size: 1rem;
    margin-bottom: 1.5rem;
  }

  .search-container {
    max-width: 100%;
  }

  .search-bar {
    padding: 0.5rem;
  }

  .search-input {
    padding: 0.875rem 1rem;
  }

  .icon {
    font-size: 1.1rem;
  }

  .search-input input {
    font-size: 0.95rem;
  }

  .search-button {
    padding: 0.875rem 1.5rem;
    font-size: 1rem;
  }

  .date-picker-popup {
    min-width: 95vw;
    max-width: 95vw;
    padding: 1.25rem;
  }

  .date-picker-header h3 {
    font-size: 1.1rem;
  }

  .carousels-section {
    padding: 2rem 0.75rem;
  }
}

/* Extra small devices */
@media (max-width: 360px) {
  .hero-title {
    font-size: 1.5rem;
  }

  .hero-subtitle {
    font-size: 0.9rem;
  }

  .search-input {
    padding: 0.75rem;
  }

  .search-button {
    padding: 0.75rem 1rem;
    font-size: 0.95rem;
  }
}
</style>