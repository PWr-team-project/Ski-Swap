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
          <!-- Search Box for Listings and Users -->
          <div class="filter-group search-box">
            <span class="filter-icon">🔍</span>
            <input
              type="text"
              placeholder="Search listings or users..."
              v-model="searchParams.searchQuery"
              @input="handleFilterChange"
            />
          </div>

          <!-- Category Filter -->
          <div class="filter-group">
            <label class="filter-label">Category</label>
            <select v-model="searchParams.category" @change="handleFilterChange">
              <option value="">All Categories</option>
              <option v-for="category in categories" :key="category._id" :value="category.name">
                {{ category.name }}
              </option>
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
          <p>Showing {{ totalDisplayedResults }} of {{ totalResults }} results ({{ filteredItems.length }} listings, {{ filteredUsers.length }} users)</p>
        </div>
      </div>

      <!-- Items Grid (Mixed Listings and Users) -->
      <div class="items-grid">
        <!-- Listings -->
        <div
          v-for="item in paginatedListings"
          :key="'listing-' + item.id"
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

        <!-- Users -->
        <UserCard
          v-for="user in paginatedUsers"
          :key="'user-' + user._id"
          :user="user"
          @click="handleUserClick"
        />
      </div>

      <!-- No Results Message -->
      <div v-if="filteredItems.length === 0 && filteredUsers.length === 0" class="no-results">
        <p>No listings or users found matching your criteria.</p>
        <button @click="clearFilters" class="clear-filters-btn">Clear Filters</button>
      </div>

      <!-- Pagination -->
      <div v-if="totalResults > 0" class="pagination-section">
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
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { listingService } from '@/services/listingService';
import { userService } from '@/services/userService';
import { getFullImageUrl } from '@/utils/api';
import { geocodeLocation, calculateDistance } from '@/utils/geolocation';
import UserCard from '@/components/UserCard.vue';

const route = useRoute();
const router = useRouter();

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

// Real Items Data from API
const allItems = ref([]);
const allUsers = ref([]);
const loading = ref(true);
const categories = ref([]);
const userLocationCoords = ref(null);
const listingBlockedDates = ref({}); // Store blocked dates for each listing

// Fetch real listings from API
const fetchListings = async () => {
  loading.value = true;
  try {
    const data = await listingService.getAll();
    const listings = data.listings || [];

    // Transform API data to match component format
    allItems.value = listings.map(listing => ({
      id: listing._id,
      category: listing.category_id?.name || 'Unknown',
      name: listing.title,
      brand: listing.brand || '',
      description: listing.description || '',
      price: listing.daily_rate,
      location: listing.location_id?.city || 'Unknown',
      locationData: listing.location_id,
      distance: null, // Will be calculated if user location is provided
      image: listing.photos && listing.photos.length > 0
        ? getFullImageUrl(listing.photos[0])
        : 'https://via.placeholder.com/400x300'
    }));

    // Calculate distances if user location is available
    if (userLocationCoords.value) {
      calculateDistances();
    }
  } catch (error) {
    console.error('Error fetching listings:', error);
  } finally {
    loading.value = false;
  }
};

// Computed Properties
const dateRange = computed(() => {
  if (searchParams.value.startDate && searchParams.value.endDate) {
    return `${formatDate(searchParams.value.startDate)} - ${formatDate(searchParams.value.endDate)}`;
  }
  return '';
});

const filteredItems = computed(() => {
  let items = [...allItems.value];

  // Filter by date availability
  if (searchParams.value.startDate && searchParams.value.endDate) {
    items = items.filter(item => {
      return isListingAvailable(item.id, searchParams.value.startDate, searchParams.value.endDate);
    });
  }

  // Filter by location (50km radius)
  if (userLocationCoords.value && searchParams.value.location) {
    items = items.filter(item => {
      if (item.distance !== null && item.distance <= 50) {
        return true;
      }
      return false;
    });
  }

  // Filter by category
  if (searchParams.value.category) {
    items = items.filter(item => item.category === searchParams.value.category);
  }

  // Filter by search query (name, brand, description, or category)
  if (searchParams.value.searchQuery) {
    const query = searchParams.value.searchQuery.toLowerCase();
    items = items.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.brand.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );
  }

  // Sort items
  switch (searchParams.value.sortBy) {
    case 'location-nearest':
      items.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
      break;
    case 'location-farthest':
      items.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return b.distance - a.distance;
      });
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

// Filter users based on search query
const filteredUsers = computed(() => {
  if (!searchParams.value.searchQuery || searchParams.value.searchQuery.trim() === '') {
    return [];
  }

  const query = searchParams.value.searchQuery.toLowerCase();
  return allUsers.value.filter(user =>
    user.nickname.toLowerCase().includes(query) ||
    user.first_name.toLowerCase().includes(query) ||
    user.last_name.toLowerCase().includes(query)
  );
});

const totalResults = computed(() => {
  return filteredItems.value.length + filteredUsers.value.length;
});

const totalPages = computed(() => {
  return Math.ceil(totalResults.value / itemsPerPage.value);
});

const paginatedListings = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const listingsToShow = Math.min(itemsPerPage.value, filteredItems.value.length - start);

  if (start >= filteredItems.value.length) {
    return [];
  }

  const end = start + Math.max(0, listingsToShow);
  return filteredItems.value.slice(start, end);
});

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const listingsShown = paginatedListings.value.length;
  const usersToShow = itemsPerPage.value - listingsShown;

  if (usersToShow <= 0) {
    return [];
  }

  const userStart = Math.max(0, start - filteredItems.value.length);
  const userEnd = userStart + usersToShow;
  return filteredUsers.value.slice(userStart, userEnd);
});

const totalDisplayedResults = computed(() => {
  return paginatedListings.value.length + paginatedUsers.value.length;
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
  // Search users if there's a search query
  searchUsers();
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
  router.push(`/listing/${item.id}`);
};

const handleUserClick = (user) => {
  router.push(`/user/${user.nickname}`);
};

// Search users from API
const searchUsers = async () => {
  if (!searchParams.value.searchQuery || searchParams.value.searchQuery.trim() === '') {
    allUsers.value = [];
    return;
  }

  try {
    const response = await userService.searchUsers(searchParams.value.searchQuery);
    allUsers.value = response.users || [];
  } catch (error) {
    console.error('Error searching users:', error);
    allUsers.value = [];
  }
};

// Fetch categories from API
const fetchCategories = async () => {
  try {
    const response = await listingService.getCategories();
    categories.value = response.categories || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
  }
};

// Geocode user's location
const geocodeUserLocation = async () => {
  if (!searchParams.value.location || searchParams.value.location.trim() === '') {
    userLocationCoords.value = null;
    // Reset all distances
    allItems.value.forEach(item => {
      item.distance = null;
    });
    return;
  }

  try {
    const coords = await geocodeLocation(searchParams.value.location);
    if (coords) {
      userLocationCoords.value = coords;
      calculateDistances();
    } else {
      userLocationCoords.value = null;
      console.warn('Could not geocode location:', searchParams.value.location);
    }
  } catch (error) {
    console.error('Error geocoding location:', error);
    userLocationCoords.value = null;
  }
};

// Calculate distances for all items
const calculateDistances = () => {
  if (!userLocationCoords.value) {
    return;
  }

  allItems.value.forEach(item => {
    if (item.locationData?.latitude && item.locationData?.longitude) {
      item.distance = calculateDistance(
        userLocationCoords.value.lat,
        userLocationCoords.value.lon,
        item.locationData.latitude,
        item.locationData.longitude
      );
    } else {
      item.distance = null;
    }
  });
};

// Fetch blocked dates for all listings
const fetchAllBlockedDates = async () => {
  if (!searchParams.value.startDate || !searchParams.value.endDate) {
    listingBlockedDates.value = {};
    return;
  }

  try {
    const promises = allItems.value.map(async (item) => {
      try {
        const response = await listingService.getBlockedDates(item.id);
        return { id: item.id, blockedDates: response.blockedDates || [] };
      } catch (error) {
        console.error(`Error fetching blocked dates for listing ${item.id}:`, error);
        return { id: item.id, blockedDates: [] };
      }
    });

    const results = await Promise.all(promises);
    const blockedDatesMap = {};
    results.forEach(result => {
      blockedDatesMap[result.id] = result.blockedDates;
    });
    listingBlockedDates.value = blockedDatesMap;
  } catch (error) {
    console.error('Error fetching blocked dates:', error);
  }
};

// Check if listing is available for selected dates
const isListingAvailable = (listingId, startDate, endDate) => {
  const blockedDates = listingBlockedDates.value[listingId];
  if (!blockedDates || blockedDates.length === 0) {
    return true; // No blocked dates, listing is available
  }

  const requestedStart = new Date(startDate);
  const requestedEnd = new Date(endDate);

  // Check if requested dates overlap with any blocked date range
  for (const blocked of blockedDates) {
    const blockedStart = new Date(blocked.start_date);
    const blockedEnd = new Date(blocked.end_date);

    // Check for overlap: (start1 <= end2) AND (end1 >= start2)
    if (requestedStart <= blockedEnd && requestedEnd >= blockedStart) {
      return false; // There's a conflict
    }
  }

  return true; // No conflicts
};

// Watch for location changes
watch(() => searchParams.value.location, () => {
  geocodeUserLocation();
});

// Watch for date changes
watch(() => [searchParams.value.startDate, searchParams.value.endDate], () => {
  if (allItems.value.length > 0) {
    fetchAllBlockedDates();
  }
});

// Watch for search query changes
watch(() => searchParams.value.searchQuery, () => {
  searchUsers();
});

// Lifecycle
onMounted(async () => {
  await fetchListings();
  fetchCategories();
  // Geocode location if provided from landing page
  if (searchParams.value.location) {
    geocodeUserLocation();
  }
  // Fetch blocked dates if dates are provided from landing page
  if (searchParams.value.startDate && searchParams.value.endDate) {
    fetchAllBlockedDates();
  }
});

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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 170, 255, 0.12);
  border: 1px solid rgba(0, 170, 255, 0.15);
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
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 170, 255, 0.12);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid rgba(0, 170, 255, 0.15);
}

.item-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 12px 32px rgba(0, 170, 255, 0.3);
  border-color: rgba(0, 170, 255, 0.4);
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
