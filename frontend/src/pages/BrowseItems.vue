<template>
  <div class="browse-page">
    <!-- Main Content Section -->
    <div class="main-content">
      <!-- Page Header -->
      <div class="page-header">
        <h1 class="page-title">Browse Equipment</h1>
      </div>

      <!-- Unified Filters Section -->
      <div class="filters-section">
        <!-- Location and Date Inputs Row -->
        <div class="location-date-row">
          <div class="input-group location-group">
            <span class="icon">📍</span>
            <input
              type="text"
              placeholder="Location (e.g., Wroclaw, Poland)"
              v-model="searchParams.location"
              @input="handleFilterChange"
            />
          </div>

          <div class="input-group date-group">
            <span class="icon">📅</span>
            <input
              type="text"
              :value="dateRange"
              placeholder="Select dates"
              @click="showDatePicker = !showDatePicker"
              readonly
            />

            <!-- Date Picker Popup -->
            <div v-if="showDatePicker" class="date-picker-popup">
              <div class="date-picker-header">
                <h3>Select Date Range</h3>
                <button @click="showDatePicker = false" class="close-btn">✕</button>
              </div>
              <div class="date-inputs">
                <div class="date-field">
                  <label>Check-in</label>
                  <input type="date" v-model="searchParams.startDate" @change="handleFilterChange" />
                </div>
                <div class="date-field">
                  <label>Check-out</label>
                  <input type="date" v-model="searchParams.endDate" @change="handleFilterChange" />
                </div>
              </div>
              <button @click="closeDatePicker" class="apply-btn">Done</button>
            </div>
          </div>
        </div>

        <!-- Filters Container -->
        <div class="filters-container">
          <!-- Search Box for Brand/Type -->
          <div class="filter-group search-box">
            <span class="filter-icon">🔍</span>
            <input
              type="text"
              placeholder="Search for brand or type..."
              v-model="searchParams.searchQuery"
              @input="handleFilterChange"
            />
          </div>

          <!-- Category Filter -->
          <div class="filter-group">
            <label class="filter-label">Category</label>
            <select v-model="searchParams.category" @change="handleFilterChange">
              <option value="">All Categories</option>
              <option value="Skis">Skis</option>
              <option value="Snowboards">Snowboards</option>
              <option value="Accessories">Accessories</option>
            </select>
          </div>

          <!-- Sort By Filter -->
          <div class="filter-group">
            <label class="filter-label">Sort By</label>
            <select v-model="searchParams.sortBy" @change="handleFilterChange">
              <option value="recommended">Recommended</option>
              <option value="location-nearest">Location (Nearest)</option>
              <option value="location-farthest">Location (Farthest)</option>
              <option value="price-asc">Price (Low to High)</option>
              <option value="price-desc">Price (High to Low)</option>
            </select>
          </div>

          <!-- Clear Filters Button -->
          <button class="clear-filters-btn" @click="clearFilters">
            <span>✕</span> Clear Filters
          </button>
        </div>

        <!-- Results Count -->
        <div class="results-info">
          <p>Showing {{ paginatedItems.length }} of {{ filteredItems.length }} items</p>
        </div>
      </div>

      <!-- Items Grid -->
      <div class="items-grid">
        <div
          v-for="item in paginatedItems"
          :key="item.id"
          class="item-card"
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

      <!-- No Results Message -->
      <div v-if="filteredItems.length === 0" class="no-results">
        <p>No items found matching your criteria.</p>
        <button @click="clearFilters" class="clear-filters-btn">Clear Filters</button>
      </div>

      <!-- Pagination -->
      <div v-if="filteredItems.length > 0" class="pagination-section">
        <div class="pagination-controls">
          <!-- Items Per Page Selector -->
          <div class="items-per-page">
            <label>Items per page:</label>
            <select v-model="itemsPerPage" @change="handleItemsPerPageChange">
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="30">30</option>
              <option :value="50">50</option>
            </select>
          </div>

          <!-- Page Navigation -->
          <div class="page-navigation">
            <button
              class="page-btn"
              @click="previousPage"
              :disabled="currentPage === 1"
            >
              ← Previous
            </button>

            <div class="page-numbers">
              <button
                v-for="page in visiblePages"
                :key="page"
                class="page-number"
                :class="{ active: page === currentPage }"
                @click="goToPage(page)"
              >
                {{ page }}
              </button>
            </div>

            <button
              class="page-btn"
              @click="nextPage"
              :disabled="currentPage === totalPages"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

// Search Parameters (populated from route query parameters)
const searchParams = ref({
  location: route.query.location || '',
  startDate: route.query.startDate || '',
  endDate: route.query.endDate || '',
  searchQuery: '',
  category: '',
  sortBy: 'recommended'
});

// Date Picker State
const showDatePicker = ref(false);

// Pagination State
const currentPage = ref(1);
const itemsPerPage = ref(20);

// Sample Items Data (in production, this would come from API)
const allItems = ref([
  {
    id: 1,
    category: 'Skis',
    name: 'K2 Mindbender 99Ti Skis',
    brand: 'K2',
    price: 45,
    location: 'Aspen, CO',
    distance: 120,
    image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop'
  },
  {
    id: 2,
    category: 'Skis',
    name: 'Rossignol Experience 88 Ti',
    brand: 'Rossignol',
    price: 50,
    location: 'Jackson Hole, WY',
    distance: 85,
    image: 'https://images.unsplash.com/photo-1605540436563-5bca919ae766?w=400&h=300&fit=crop'
  },
  {
    id: 3,
    category: 'Skis',
    name: 'Atomic Maverick 95',
    brand: 'Atomic',
    price: 42,
    location: 'Park City, UT',
    distance: 200,
    image: 'https://images.unsplash.com/photo-1551524164-687a55dd1126?w=400&h=300&fit=crop'
  },
  {
    id: 4,
    category: 'Skis',
    name: 'Salomon QST 92',
    brand: 'Salomon',
    price: 48,
    location: 'Vail, CO',
    distance: 150,
    image: 'https://images.unsplash.com/photo-1609390621955-48e37fe2d7de?w=400&h=300&fit=crop'
  },
  {
    id: 5,
    category: 'Skis',
    name: 'Blizzard Rustler 10',
    brand: 'Blizzard',
    price: 55,
    location: 'Whistler, BC',
    distance: 300,
    image: 'https://images.unsplash.com/photo-1551524559-8af4e6624178?w=400&h=300&fit=crop'
  },
  {
    id: 6,
    category: 'Snowboards',
    name: 'Burton Custom X',
    brand: 'Burton',
    price: 40,
    location: 'Breckenridge, CO',
    distance: 180,
    image: 'https://images.unsplash.com/photo-1608447272409-a46ab38c6c90?w=400&h=300&fit=crop'
  },
  {
    id: 7,
    category: 'Snowboards',
    name: 'Lib Tech T.Rice Pro',
    brand: 'Lib Tech',
    price: 45,
    location: 'Tahoe, CA',
    distance: 220,
    image: 'https://images.unsplash.com/photo-1519315901367-dd6f52257273?w=400&h=300&fit=crop'
  },
  {
    id: 8,
    category: 'Snowboards',
    name: 'Jones Mountain Twin',
    brand: 'Jones',
    price: 38,
    location: 'Steamboat, CO',
    distance: 95,
    image: 'https://images.unsplash.com/photo-1579189214311-f8e0f0f8f9f5?w=400&h=300&fit=crop'
  },
  {
    id: 9,
    category: 'Snowboards',
    name: 'Capita DOA',
    brand: 'Capita',
    price: 42,
    location: 'Big Sky, MT',
    distance: 270,
    image: 'https://images.unsplash.com/photo-1600362834097-1c1c4a212024?w=400&h=300&fit=crop'
  },
  {
    id: 10,
    category: 'Snowboards',
    name: 'Ride Warpig',
    brand: 'Ride',
    price: 43,
    location: 'Mammoth, CA',
    distance: 240,
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400&h=300&fit=crop'
  },
  {
    id: 11,
    category: 'Accessories',
    name: 'Smith I/O Mag Goggles',
    brand: 'Smith',
    price: 15,
    location: 'Aspen, CO',
    distance: 120,
    image: 'https://images.unsplash.com/photo-1605606274249-2e41f6e8a5b0?w=400&h=300&fit=crop'
  },
  {
    id: 12,
    category: 'Accessories',
    name: 'POC Obex SPIN Helmet',
    brand: 'POC',
    price: 12,
    location: 'Park City, UT',
    distance: 200,
    image: 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=400&h=300&fit=crop'
  },
  {
    id: 13,
    category: 'Accessories',
    name: 'Black Diamond Poles',
    brand: 'Black Diamond',
    price: 8,
    location: 'Jackson Hole, WY',
    distance: 85,
    image: 'https://images.unsplash.com/photo-1483381719261-1d24c6f0f7b0?w=400&h=300&fit=crop'
  },
  {
    id: 14,
    category: 'Accessories',
    name: 'Burton Backpack 25L',
    brand: 'Burton',
    price: 10,
    location: 'Vail, CO',
    distance: 150,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop'
  },
  {
    id: 15,
    category: 'Accessories',
    name: 'Dakine Boot Bag',
    brand: 'Dakine',
    price: 5,
    location: 'Whistler, BC',
    distance: 300,
    image: 'https://images.unsplash.com/photo-1585435465455-d1d0c66c5b7e?w=400&h=300&fit=crop'
  },
  {
    id: 16,
    category: 'Skis',
    name: 'Fischer Ranger 102',
    brand: 'Fischer',
    price: 47,
    location: 'Telluride, CO',
    distance: 175,
    image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=300&fit=crop'
  },
  {
    id: 17,
    category: 'Skis',
    name: 'Head Kore 93',
    brand: 'Head',
    price: 44,
    location: 'Sun Valley, ID',
    distance: 250,
    image: 'https://images.unsplash.com/photo-1605540436563-5bca919ae766?w=400&h=300&fit=crop'
  },
  {
    id: 18,
    category: 'Snowboards',
    name: 'GNU Riders Choice',
    brand: 'GNU',
    price: 41,
    location: 'Crystal Mountain, WA',
    distance: 280,
    image: 'https://images.unsplash.com/photo-1608447272409-a46ab38c6c90?w=400&h=300&fit=crop'
  },
  {
    id: 19,
    category: 'Accessories',
    name: 'Oakley Flight Deck Goggles',
    brand: 'Oakley',
    price: 14,
    location: 'Heavenly, CA',
    distance: 230,
    image: 'https://images.unsplash.com/photo-1605606274249-2e41f6e8a5b0?w=400&h=300&fit=crop'
  },
  {
    id: 20,
    category: 'Accessories',
    name: 'Giro Range MIPS Helmet',
    brand: 'Giro',
    price: 13,
    location: 'Crested Butte, CO',
    distance: 190,
    image: 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=400&h=300&fit=crop'
  },
  {
    id: 21,
    category: 'Skis',
    name: 'Volkl Mantra M6',
    brand: 'Volkl',
    price: 52,
    location: 'Alta, UT',
    distance: 210,
    image: 'https://images.unsplash.com/photo-1551524164-687a55dd1126?w=400&h=300&fit=crop'
  },
  {
    id: 22,
    category: 'Snowboards',
    name: 'YES Standard',
    brand: 'YES',
    price: 39,
    location: 'Copper Mountain, CO',
    distance: 165,
    image: 'https://images.unsplash.com/photo-1519315901367-dd6f52257273?w=400&h=300&fit=crop'
  }
]);

// Computed Properties
const dateRange = computed(() => {
  if (searchParams.value.startDate && searchParams.value.endDate) {
    return `${formatDate(searchParams.value.startDate)} - ${formatDate(searchParams.value.endDate)}`;
  }
  return '';
});

const filteredItems = computed(() => {
  let items = [...allItems.value];

  // Filter by category
  if (searchParams.value.category) {
    items = items.filter(item => item.category === searchParams.value.category);
  }

  // Filter by search query (brand or type/name)
  if (searchParams.value.searchQuery) {
    const query = searchParams.value.searchQuery.toLowerCase();
    items = items.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.brand.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );
  }

  // Sort items
  switch (searchParams.value.sortBy) {
    case 'location-nearest':
      items.sort((a, b) => a.distance - b.distance);
      break;
    case 'location-farthest':
      items.sort((a, b) => b.distance - a.distance);
      break;
    case 'price-asc':
      items.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      items.sort((a, b) => b.price - a.price);
      break;
    case 'recommended':
    default:
      // Keep original order for recommended
      break;
  }

  return items;
});

const totalPages = computed(() => {
  return Math.ceil(filteredItems.value.length / itemsPerPage.value);
});

const paginatedItems = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredItems.value.slice(start, end);
});

const visiblePages = computed(() => {
  const pages = [];
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage.value - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages.value, startPage + maxVisiblePages - 1);

  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return pages;
});

// Methods
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const closeDatePicker = () => {
  showDatePicker.value = false;
};

const handleFilterChange = () => {
  // Reset to first page when filters change
  currentPage.value = 1;
};

const clearFilters = () => {
  searchParams.value.searchQuery = '';
  searchParams.value.category = '';
  searchParams.value.sortBy = 'recommended';
  currentPage.value = 1;
};

const handleItemsPerPageChange = () => {
  currentPage.value = 1;
};

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    scrollToTop();
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    scrollToTop();
  }
};

const goToPage = (page) => {
  currentPage.value = page;
  scrollToTop();
};

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const handleItemClick = (item) => {
  console.log('Item clicked:', item);
  // TODO: Navigate to item detail page
};

// Search parameters are automatically populated from route query on component initialization
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.browse-page {
  width: 100%;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: linear-gradient(135deg, #f0f7ff 0%, #e3f2fd 100%);
}

/* Main Content */
.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

/* Page Header */
.page-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

/* Filters Section */
.filters-section {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(0, 170, 255, 0.1);
  border: 1px solid rgba(0, 170, 255, 0.1);
}

/* Location and Date Row */
.location-date-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.input-group {
  position: relative;
  flex: 1;
  min-width: 250px;
  display: flex;
  align-items: center;
  background: #66D1FF;
  border-radius: 12px;
  padding: 1rem 1.25rem;
  gap: 0.75rem;
  box-shadow: 0 4px 12px rgba(0, 170, 255, 0.25);
  transition: all 0.3s ease;
}

.input-group:hover {
  box-shadow: 0 6px 16px rgba(0, 170, 255, 0.35);
  transform: translateY(-2px);
}

.input-group .icon {
  font-size: 1.3rem;
  color: white;
  flex-shrink: 0;
}

.input-group input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 1rem;
  background: transparent;
  color: rgb(0, 0, 0);
  font-weight: 500;
}

.input-group input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.date-group {
  cursor: pointer;
}

/* Date Picker Popup */
.date-picker-popup {
  position: absolute;
  top: calc(100% + 0.75rem);
  left: 0;
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  z-index: 1000;
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
  font-weight: 600;
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
  transition: all 0.3s ease;
}

.close-btn:hover {
  color: #00AAFF;
  transform: scale(1.1);
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
  color: #000000;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.date-field input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e3f2fd;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  background: #f8fbff;
  transition: all 0.3s ease;
}

.date-field input:focus {
  border-color: #00AAFF;
  background: white;
  box-shadow: 0 0 0 3px rgba(0, 170, 255, 0.1);
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
  transition: all 0.3s ease;
}

.apply-btn:hover {
  background: #0088cc;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 170, 255, 0.3);
}

.filters-container {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: flex-end;
  margin-bottom: 1.25rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  min-width: 200px;
}

.search-box {
  flex: 2;
  min-width: 300px;
}

.search-box input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 2px solid #e3f2fd;
  border-radius: 10px;
  font-size: 1rem;
  outline: none;
  transition: all 0.3s ease;
  background: #f8fbff;
}

.search-box input:focus {
  border-color: #00AAFF;
  background: white;
  box-shadow: 0 0 0 3px rgba(0, 170, 255, 0.1);
}

.search-box {
  position: relative;
}

.filter-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.25rem;
  color: #00AAFF;
}

.filter-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #555;
}

.filter-group select {
  padding: 0.75rem 1rem;
  border: 2px solid #e3f2fd;
  border-radius: 10px;
  font-size: 1rem;
  outline: none;
  cursor: pointer;
  background: #f8fbff;
  transition: all 0.3s ease;
}

.filter-group select:focus {
  border-color: #00AAFF;
  background: white;
  box-shadow: 0 0 0 3px rgba(0, 170, 255, 0.1);
}

.clear-filters-btn {
  padding: 0.75rem 1.5rem;
  background: #ff4757;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  align-self: flex-end;
}

.clear-filters-btn:hover {
  background: #ff6b7a;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 71, 87, 0.3);
}

.results-info {
  padding-top: 1rem;
  border-top: 2px solid #e3f2fd;
}

.results-info p {
  color: #666;
  font-size: 0.95rem;
  font-weight: 500;
}

/* Items Grid */
.items-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

/* Ensure maximum 5 items per row */
@media (min-width: 1600px) {
  .items-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

.item-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 170, 255, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid rgba(0, 170, 255, 0.1);
}

.item-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 28px rgba(0, 170, 255, 0.25);
  border-color: rgba(0, 170, 255, 0.3);
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

.item-card:hover .item-image img {
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
  font-size: 1.1rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 1rem;
  min-height: 2.5rem;
  line-height: 1.3;
}

.item-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.item-price {
  font-size: 1.4rem;
  font-weight: 700;
  color: #00AAFF;
}

.item-price span {
  font-size: 0.9rem;
  font-weight: 400;
  color: #666;
}

.item-location {
  font-size: 0.875rem;
  color: #666;
}

/* No Results */
.no-results {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 170, 255, 0.1);
  border: 1px solid rgba(0, 170, 255, 0.1);
}

.no-results p {
  font-size: 1.25rem;
  color: #666;
  margin-bottom: 1.5rem;
}

/* Pagination */
.pagination-section {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 170, 255, 0.1);
  border: 1px solid rgba(0, 170, 255, 0.1);
}

.pagination-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.items-per-page {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.items-per-page label {
  font-size: 0.95rem;
  color: #666;
  font-weight: 500;
}

.items-per-page select {
  padding: 0.5rem 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  cursor: pointer;
  background: white;
}

.page-navigation {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.page-btn {
  padding: 0.5rem 1rem;
  background: white;
  color: #00AAFF;
  border: 2px solid #00AAFF;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-btn:hover:not(:disabled) {
  background: #00AAFF;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 170, 255, 0.3);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  border-color: #e0e0e0;
  color: #999;
}

.page-numbers {
  display: flex;
  gap: 0.25rem;
}

.page-number {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fbff;
  color: #666;
  border: 2px solid #e3f2fd;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.page-number:hover {
  border-color: #00AAFF;
  color: #00AAFF;
  background: white;
  transform: translateY(-2px);
}

.page-number.active {
  background: #00AAFF;
  color: white;
  border-color: #00AAFF;
  box-shadow: 0 4px 12px rgba(0, 170, 255, 0.3);
}

/* Responsive Design */
@media (max-width: 1024px) {
  .page-title {
    font-size: 2rem;
  }

  .items-grid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }
}

@media (max-width: 768px) {
  .main-content {
    padding: 1.5rem 1rem;
  }

  .page-title {
    font-size: 1.75rem;
    margin-bottom: 1rem;
  }

  .location-date-row {
    flex-direction: column;
  }

  .input-group {
    min-width: 100%;
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

  .filters-container {
    flex-direction: column;
  }

  .filter-group,
  .search-box {
    min-width: 100%;
  }

  .clear-filters-btn {
    width: 100%;
    justify-content: center;
  }

  .items-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }

  .pagination-controls {
    flex-direction: column;
    gap: 1rem;
  }

  .items-per-page {
    width: 100%;
    justify-content: center;
  }

  .page-navigation {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.5rem;
  }

  .items-grid {
    grid-template-columns: 1fr;
  }

  .page-numbers {
    flex-wrap: wrap;
  }

  .page-number {
    width: 36px;
    height: 36px;
  }
}
</style>
