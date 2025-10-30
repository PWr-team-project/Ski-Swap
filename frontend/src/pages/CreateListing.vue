<template>
  <div class="create-listing-page">
    <div class="main-content">
      <!-- Page Header -->
      <div class="page-header">
        <h1 class="page-title">Create New Listing</h1>
        <p class="page-subtitle">List your ski equipment and start earning</p>
      </div>

      <!-- Listing Form -->
      <div class="listing-form">
        <!-- 1. Category Selection -->
        <div class="form-section">
          <div class="section-header">
            <span class="section-number">1</span>
            <h2 class="section-title">Select Category</h2>
          </div>
          <div class="category-grid">
            <div
              v-for="category in categories"
              :key="category.value"
              class="category-card"
              :class="{ active: listingData.category === category.value }"
              @click="selectCategory(category.value)"
            >
              <span class="category-icon">{{ category.icon }}</span>
              <span class="category-name">{{ category.label }}</span>
            </div>
          </div>
        </div>

        <!-- 2. Title -->
        <div class="form-section">
          <div class="section-header">
            <span class="section-number">2</span>
            <h2 class="section-title">Title</h2>
          </div>
          <div class="input-wrapper">
            <input
              type="text"
              v-model="listingData.title"
              placeholder="e.g., K2 Mindbender 99Ti Skis"
              maxlength="20"
              class="text-input"
            />
            <span class="char-count">{{ listingData.title.length }}/20</span>
          </div>
        </div>

        <!-- 3. Item Details -->
        <div class="form-section">
          <div class="section-header">
            <span class="section-number">3</span>
            <h2 class="section-title">Item Details</h2>
          </div>
          <div class="details-grid">
            <div class="input-wrapper">
              <label class="input-label">Brand (Optional)</label>
              <input
                type="text"
                v-model="listingData.brand"
                placeholder="e.g., K2, Burton, Rossignol"
                class="text-input"
              />
            </div>
            <div class="input-wrapper">
              <label class="input-label">Model (Optional)</label>
              <input
                type="text"
                v-model="listingData.model"
                placeholder="e.g., Mindbender 99Ti"
                class="text-input"
              />
            </div>
            <div class="input-wrapper">
              <label class="input-label">Size (Optional)</label>
              <input
                type="text"
                v-model="listingData.size"
                placeholder="e.g., 180cm, XL, 10.5"
                class="text-input"
              />
            </div>
            <div class="input-wrapper">
              <label class="input-label">Condition</label>
              <select v-model="listingData.condition" class="text-input">
                <option value="new">New</option>
                <option value="like new">Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="used">Used</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 4. Description -->
        <div class="form-section">
          <div class="section-header">
            <span class="section-number">4</span>
            <h2 class="section-title">Description</h2>
          </div>
          <div class="input-wrapper">
            <textarea
              v-model="listingData.description"
              placeholder="Describe your item, its condition, any important details..."
              maxlength="400"
              rows="6"
              class="textarea-input"
            ></textarea>
            <span class="char-count">{{ listingData.description.length }}/400</span>
          </div>
        </div>

        <!-- 5. Upload Photos -->
        <div class="form-section">
          <div class="section-header">
            <span class="section-number">5</span>
            <h2 class="section-title">Upload Photos</h2>
          </div>
          <p class="section-note">First photo will be your main listing image</p>

          <div class="photo-upload-container">
            <!-- Uploaded Photos -->
            <div
              v-for="(photo, index) in listingData.photos"
              :key="index"
              class="photo-preview"
            >
              <img :src="photo" alt="Preview" />
              <div class="photo-badge" v-if="index === 0">Main</div>
              <button class="remove-photo-btn" @click="removePhoto(index)">✕</button>
            </div>

            <!-- Upload Button -->
            <label class="upload-box" v-if="listingData.photos.length < 6">
              <input
                type="file"
                accept="image/*"
                multiple
                @change="handlePhotoUpload"
                style="display: none"
              />
              <div class="upload-icon">📷</div>
              <span class="upload-text">Add Photos</span>
              <span class="upload-subtext">{{ listingData.photos.length }}/6</span>
            </label>
          </div>
        </div>

        <!-- 6. Pricing -->
        <div class="form-section">
          <div class="section-header">
            <span class="section-number">6</span>
            <h2 class="section-title">Set Your Price</h2>
          </div>
          <p class="section-note" v-if="suggestedPrice">
            Suggested price based on category: <strong>${{ suggestedPrice }}/day</strong>
          </p>

          <div class="pricing-grid">
            <div class="price-input-group">
              <label class="price-label">Daily Rate</label>
              <div class="price-input-wrapper">
                <span class="currency-symbol">$</span>
                <input
                  type="number"
                  v-model.number="listingData.pricing.daily"
                  placeholder="0"
                  min="0"
                  step="1"
                  class="price-input"
                />
                <span class="price-suffix">/day</span>
              </div>
            </div>

            <div class="price-input-group">
              <label class="price-label">Weekly Rate (Optional)</label>
              <div class="price-input-wrapper">
                <span class="currency-symbol">$</span>
                <input
                  type="number"
                  v-model.number="listingData.pricing.weekly"
                  placeholder="0"
                  min="0"
                  step="1"
                  class="price-input"
                />
                <span class="price-suffix">/week</span>
              </div>
            </div>

            <div class="price-input-group">
              <label class="price-label">Monthly Rate (Optional)</label>
              <div class="price-input-wrapper">
                <span class="currency-symbol">$</span>
                <input
                  type="number"
                  v-model.number="listingData.pricing.monthly"
                  placeholder="0"
                  min="0"
                  step="1"
                  class="price-input"
                />
                <span class="price-suffix">/month</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 7. Location -->
        <div class="form-section">
          <div class="section-header">
            <span class="section-number">7</span>
            <h2 class="section-title">Item Location</h2>
          </div>
          <div class="input-wrapper">
            <span class="input-icon">📍</span>
            <input
              type="text"
              v-model="listingData.location"
              placeholder="e.g., Wroclaw, Poland"
              class="text-input with-icon"
            />
          </div>
        </div>

        <!-- 8. Estimated Value -->
        <div class="form-section">
          <div class="section-header">
            <span class="section-number">8</span>
            <h2 class="section-title">Estimated Value</h2>
          </div>
          <p class="section-note">Enter the approximate retail value of your item</p>
          <div class="input-wrapper">
            <span class="input-icon">💰</span>
            <span class="currency-symbol-static">$</span>
            <input
              type="number"
              v-model.number="listingData.estimatedValue"
              placeholder="0"
              min="0"
              step="50"
              class="text-input with-icon with-currency"
            />
          </div>
        </div>

        <!-- Create Button -->
        <div class="form-actions">
          <button class="create-btn" @click="createListing" :disabled="!isFormValid">
            <span class="btn-text">Create Listing</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import axios from 'axios';

const router = useRouter();
const authStore = useAuthStore();

// Categories
const categories = [
  { value: 'Skis', label: 'Skis', icon: '⛷️' },
  { value: 'Snowboards', label: 'Snowboards', icon: '🏂' },
  { value: 'Boots', label: 'Boots', icon: '🥾' },
  { value: 'Poles', label: 'Poles', icon: '🎿' },
  { value: 'Goggles', label: 'Goggles', icon: '🥽' },
  { value: 'Helmets', label: 'Helmets', icon: '⛑️' },
  { value: 'Accessories', label: 'Accessories', icon: '🎒' }
];

// Suggested prices based on category
const suggestedPrices = {
  'Skis': 45,
  'Snowboards': 40,
  'Boots': 25,
  'Poles': 10,
  'Goggles': 15,
  'Helmets': 12,
  'Accessories': 8
};

// Listing data
const listingData = ref({
  category: '',
  title: '',
  description: '',
  brand: '',
  model: '',
  size: '',
  condition: 'good',
  photos: [],
  photoFiles: [], // Store actual file objects
  pricing: {
    daily: null,
    weekly: null,
    monthly: null
  },
  location: '',
  estimatedValue: null
});

// Computed
const suggestedPrice = computed(() => {
  return listingData.value.category ? suggestedPrices[listingData.value.category] : null;
});

const isFormValid = computed(() => {
  return (
    listingData.value.category &&
    listingData.value.title.length > 0 &&
    listingData.value.description.length > 0 &&
    listingData.value.photos.length > 0 &&
    listingData.value.pricing.daily > 0 &&
    listingData.value.location.length > 0 &&
    listingData.value.estimatedValue > 0
  );
});

// Methods
const selectCategory = (category) => {
  listingData.value.category = category;

  // Auto-fill suggested daily price
  if (suggestedPrices[category] && !listingData.value.pricing.daily) {
    listingData.value.pricing.daily = suggestedPrices[category];
  }
};

const handlePhotoUpload = (event) => {
  const files = Array.from(event.target.files);
  const remainingSlots = 6 - listingData.value.photos.length;
  const filesToAdd = files.slice(0, remainingSlots);

  filesToAdd.forEach((file) => {
    // Store the actual file object
    listingData.value.photoFiles.push(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      listingData.value.photos.push(e.target.result);
    };
    reader.readAsDataURL(file);
  });
};

const removePhoto = (index) => {
  listingData.value.photos.splice(index, 1);
  listingData.value.photoFiles.splice(index, 1);
};

const createListing = async () => {
  if (!isFormValid.value) {
    alert('Please fill in all required fields');
    return;
  }

  try {
    const token = authStore.token;
    if (!token) {
      alert('You must be logged in to create a listing');
      router.push('/login');
      return;
    }

    // Parse location (simple implementation - in production, use a proper geocoding API)
    const locationParts = listingData.value.location.split(',').map(s => s.trim());
    const city = locationParts[0] || 'Unknown';
    const country = locationParts[locationParts.length - 1] || 'Unknown';
    const state = locationParts.length > 2 ? locationParts[1] : '';

    // Create FormData for multipart/form-data
    const formData = new FormData();
    formData.append('title', listingData.value.title);
    formData.append('description', listingData.value.description);
    formData.append('category', listingData.value.category);
    formData.append('brand', listingData.value.brand || '');
    formData.append('model', listingData.value.model || '');
    formData.append('size', listingData.value.size || '');
    formData.append('dailyRate', listingData.value.pricing.daily);
    if (listingData.value.pricing.weekly) {
      formData.append('weeklyRate', listingData.value.pricing.weekly);
    }
    if (listingData.value.pricing.monthly) {
      formData.append('monthlyRate', listingData.value.pricing.monthly);
    }
    if (listingData.value.estimatedValue) {
      formData.append('estimatedValue', listingData.value.estimatedValue);
    }
    formData.append('condition', listingData.value.condition);
    formData.append('city', city);
    formData.append('state', state);
    formData.append('country', country);
    // Default coordinates (in production, use geocoding API)
    formData.append('latitude', '51.1079');
    formData.append('longitude', '17.0385');

    // Append all photos
    listingData.value.photoFiles.forEach((file) => {
      formData.append('photos', file);
    });

    const response = await axios.post('http://localhost:5000/api/listings/create', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    });

    alert('Listing created successfully!');
    console.log('Created listing:', response.data);

    // Redirect to browse page or listing detail
    router.push('/browse');
  } catch (error) {
    console.error('Error creating listing:', error);
    alert(error.response?.data?.message || 'Failed to create listing. Please try again.');
  }
};
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.create-listing-page {
  width: 100%;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: linear-gradient(135deg, #f0f7ff 0%, #e3f2fd 100%);
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* Page Header */
.page-header {
  text-align: center;
  margin-bottom: 3rem;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.page-subtitle {
  font-size: 1.1rem;
  color: #666;
  font-weight: 400;
}

/* Listing Form */
.listing-form {
  background: white;
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow: 0 4px 20px rgba(0, 170, 255, 0.1);
  border: 1px solid rgba(0, 170, 255, 0.1);
}

/* Form Section */
.form-section {
  margin-bottom: 3rem;
  padding-bottom: 3rem;
  border-bottom: 2px solid #e3f2fd;
}

.form-section:last-of-type {
  margin-bottom: 2rem;
  padding-bottom: 0;
  border-bottom: none;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.section-number {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #00AAFF 0%, #0088cc 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: 700;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 170, 255, 0.3);
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1a1a;
}

.section-note {
  font-size: 0.95rem;
  color: #666;
  margin-bottom: 1rem;
}

.section-note strong {
  color: #00AAFF;
  font-weight: 600;
}

/* Category Selection */
.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.category-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 1rem;
  background: #f8fbff;
  border: 2px solid #e3f2fd;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.category-card:hover {
  border-color: #00AAFF;
  background: white;
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(0, 170, 255, 0.2);
}

.category-card.active {
  border-color: #00AAFF;
  background: linear-gradient(135deg, #00AAFF 0%, #0088cc 100%);
  box-shadow: 0 6px 16px rgba(0, 170, 255, 0.3);
}

.category-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.category-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #333;
}

.category-card.active .category-name {
  color: white;
}

/* Details Grid */
.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

@media (max-width: 768px) {
  .details-grid {
    grid-template-columns: 1fr;
  }
}

/* Text Inputs */
.input-wrapper {
  position: relative;
}

.input-label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.text-input {
  width: 100%;
  padding: 1rem 1.25rem;
  border: 2px solid #e3f2fd;
  border-radius: 12px;
  font-size: 1rem;
  outline: none;
  background: #f8fbff;
  transition: all 0.3s ease;
  font-family: inherit;
}

.text-input:focus {
  border-color: #00AAFF;
  background: white;
  box-shadow: 0 0 0 4px rgba(0, 170, 255, 0.1);
}

.textarea-input {
  width: 100%;
  padding: 1rem 1.25rem;
  border: 2px solid #e3f2fd;
  border-radius: 12px;
  font-size: 1rem;
  outline: none;
  background: #f8fbff;
  transition: all 0.3s ease;
  font-family: inherit;
  resize: vertical;
  min-height: 120px;
}

.textarea-input:focus {
  border-color: #00AAFF;
  background: white;
  box-shadow: 0 0 0 4px rgba(0, 170, 255, 0.1);
}

.char-count {
  position: absolute;
  right: 1rem;
  bottom: 1rem;
  font-size: 0.875rem;
  color: #999;
  font-weight: 500;
}

.input-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.25rem;
}

.text-input.with-icon {
  padding-left: 3rem;
}

.currency-symbol-static {
  position: absolute;
  left: 3.5rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.1rem;
  font-weight: 600;
  color: #666;
}

.text-input.with-currency {
  padding-left: 4.5rem;
}

/* Photo Upload */
.photo-upload-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}

.photo-preview {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  background: #f0f0f0;
  border: 2px solid #e3f2fd;
}

.photo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-badge {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  background: #00AAFF;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

.remove-photo-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 30px;
  height: 30px;
  background: rgba(255, 71, 87, 0.95);
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  transition: all 0.3s ease;
}

.remove-photo-btn:hover {
  background: #ff4757;
  transform: scale(1.1);
}

.upload-box {
  width: 100%;
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f8fbff;
  border: 2px dashed #00AAFF;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  gap: 0.5rem;
}

.upload-box:hover {
  background: white;
  border-color: #0088cc;
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(0, 170, 255, 0.2);
}

.upload-icon {
  font-size: 2.5rem;
}

.upload-text {
  font-size: 1rem;
  font-weight: 600;
  color: #00AAFF;
}

.upload-subtext {
  font-size: 0.875rem;
  color: #999;
}

/* Pricing */
.pricing-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
}

.price-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
}

.price-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: #555;
  white-space: nowrap;
}

.price-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.currency-symbol {
  position: absolute;
  left: 1rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: #666;
  pointer-events: none;
  z-index: 1;
}

.price-input {
  width: 100%;
  padding: 1rem 4.5rem 1rem 2.5rem;
  border: 2px solid #e3f2fd;
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 600;
  outline: none;
  background: #f8fbff;
  transition: all 0.3s ease;
  font-family: inherit;
}

.price-input:focus {
  border-color: #00AAFF;
  background: white;
  box-shadow: 0 0 0 4px rgba(0, 170, 255, 0.1);
}

.price-suffix {
  position: absolute;
  right: 1rem;
  font-size: 0.875rem;
  color: #999;
  font-weight: 500;
  pointer-events: none;
  white-space: nowrap;
}

/* Create Button */
.form-actions {
  margin-top: 2rem;
  display: flex;
  justify-content: center;
}

.create-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem 3rem;
  background: linear-gradient(135deg, #00AAFF 0%, #0088cc 100%);
  color: white;
  border: none;
  border-radius: 50px;
  font-size: 1.3rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 6px 20px rgba(0, 170, 255, 0.4);
}

.create-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(0, 170, 255, 0.5);
}

.create-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-icon {
  font-size: 1.5rem;
}

.btn-text {
  font-size: 1.1rem;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .pricing-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .main-content {
    padding: 1.5rem 1rem;
  }

  .page-title {
    font-size: 2rem;
  }

  .page-subtitle {
    font-size: 1rem;
  }

  .listing-form {
    padding: 1.5rem;
  }

  .section-title {
    font-size: 1.25rem;
  }

  .category-grid {
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 0.75rem;
  }

  .category-card {
    padding: 1rem 0.5rem;
  }

  .category-icon {
    font-size: 2rem;
  }

  .pricing-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .price-label {
    font-size: 0.9rem;
  }

  .price-input {
    font-size: 1rem;
  }

  .photo-upload-container {
    grid-template-columns: repeat(2, 1fr);
  }

  .create-btn {
    padding: 1rem 2rem;
    font-size: 1.1rem;
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.75rem;
  }

  .listing-form {
    padding: 1.25rem;
  }

  .section-number {
    width: 35px;
    height: 35px;
    font-size: 1rem;
  }

  .section-title {
    font-size: 1.1rem;
  }
}
</style>
