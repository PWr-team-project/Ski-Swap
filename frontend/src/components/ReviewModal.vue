<template>
  <div v-if="show" class="modal-overlay" @click.self="handleClose">
    <div class="modal-content review-modal">
      <div class="modal-header">
        <h3>{{ isViewMode ? 'Review' : 'Write a Review' }}</h3>
        <button @click="handleClose" class="modal-close">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <p v-if="!isViewMode" class="modal-description">
          How was your experience renting from {{ ownerName }}? Your review helps others make informed decisions.
        </p>

        <!-- Star Rating -->
        <div class="rating-section">
          <div class="rating-label">{{ isViewMode ? 'Rating' : 'Rate your experience' }}</div>
          <div class="stars">
            <button
              v-for="star in 5"
              :key="star"
              @click="!isViewMode && selectRating(star)"
              :disabled="isViewMode"
              class="star-button"
              :class="{ 'disabled': isViewMode }"
            >
              <img
                :src="star <= selectedRating ? '/assets/icons/star_filled.svg' : '/assets/icons/star_empty.svg'"
                :alt="`${star} star${star > 1 ? 's' : ''}`"
                class="star-icon"
              />
            </button>
          </div>
          <div v-if="!isViewMode && selectedRating > 0" class="rating-text">
            {{ ratingText }}
          </div>
        </div>

        <!-- Comment Section -->
        <div class="comment-section">
          <label for="review-comment" class="comment-label">
            {{ isViewMode ? 'Comment' : 'Share your experience (optional)' }}
          </label>
          <textarea
            v-if="!isViewMode"
            id="review-comment"
            v-model="comment"
            :maxlength="maxCommentLength"
            :placeholder="`Tell others about your experience...`"
            class="comment-textarea"
            rows="5"
          ></textarea>
          <div v-else class="comment-display">
            {{ comment || 'No comment provided' }}
          </div>
          <div v-if="!isViewMode" class="character-count">
            {{ comment.length }} / {{ maxCommentLength }}
          </div>
        </div>

        <!-- Submission Error -->
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </div>

      <div class="modal-footer">
        <button @click="handleClose" class="btn btn-secondary">
          {{ isViewMode ? 'Close' : 'Cancel' }}
        </button>
        <button
          v-if="!isViewMode"
          @click="handleSubmit"
          :disabled="!canSubmit"
          class="btn btn-primary"
        >
          {{ submitting ? 'Submitting...' : 'Submit Review' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  ownerName: {
    type: String,
    default: 'the owner'
  },
  existingReview: {
    type: Object,
    default: null
  },
  submitting: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'submit']);

// Constants
const maxCommentLength = 1000;

// State
const selectedRating = ref(0);
const comment = ref('');
const error = ref(null);

// Computed
const isViewMode = computed(() => !!props.existingReview);

const ratingText = computed(() => {
  const ratings = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent'
  };
  return ratings[selectedRating.value] || '';
});

const canSubmit = computed(() => {
  return selectedRating.value > 0 && !props.submitting;
});

// Watch for existing review to populate fields
watch(() => props.existingReview, (review) => {
  if (review) {
    selectedRating.value = review.rating;
    comment.value = review.comment || '';
  }
}, { immediate: true });

// Watch for show prop to reset error
watch(() => props.show, (newShow) => {
  if (newShow) {
    error.value = null;
    if (!props.existingReview) {
      selectedRating.value = 0;
      comment.value = '';
    }
  }
});

// Methods
const selectRating = (rating) => {
  selectedRating.value = rating;
  error.value = null;
};

const handleClose = () => {
  emit('close');
};

const handleSubmit = () => {
  if (!canSubmit.value) {
    return;
  }

  if (selectedRating.value === 0) {
    error.value = 'Please select a rating';
    return;
  }

  error.value = null;

  emit('submit', {
    rating: selectedRating.value,
    comment: comment.value.trim()
  });
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
}

.modal-close {
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.modal-close:hover {
  background: #f3f4f6;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.modal-description {
  font-size: 0.9rem;
  color: #666;
  line-height: 1.5;
  margin-bottom: 1.5rem;
}

.rating-section {
  margin-bottom: 1.5rem;
}

.rating-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 0.75rem;
}

.stars {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.star-button {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: transform 0.2s ease;
}

.star-button:hover:not(.disabled) {
  transform: scale(1.1);
}

.star-button.disabled {
  cursor: default;
}

.star-icon {
  width: 40px;
  height: 40px;
}

.rating-text {
  font-size: 0.9rem;
  color: #8b5cf6;
  font-weight: 600;
  margin-top: 0.5rem;
}

.comment-section {
  margin-bottom: 1rem;
}

.comment-label {
  display: block;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 0.75rem;
}

.comment-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
  transition: border-color 0.3s ease;
}

.comment-textarea:focus {
  outline: none;
  border-color: #8b5cf6;
}

.comment-textarea::placeholder {
  color: #9ca3af;
}

.comment-display {
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 8px;
  font-size: 0.9rem;
  color: #1a1a1a;
  line-height: 1.5;
  white-space: pre-wrap;
}

.character-count {
  text-align: right;
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 0.25rem;
}

.error-message {
  padding: 0.75rem;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  color: #c00;
  font-size: 0.85rem;
  margin-top: 1rem;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #4b5563;
  transform: translateY(-1px);
}

.btn-primary {
  background: #8b5cf6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #7c3aed;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

@media (max-width: 768px) {
  .modal-overlay {
    padding: 1rem;
  }

  .star-icon {
    width: 32px;
    height: 32px;
  }

  .modal-footer {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
