<template>
  <div class="progress-bar-container">
    <!-- Progress Bar -->
    <div class="progress-bar">
      <div class="progress-line" :style="{ width: progressWidth }"></div>

      <!-- Progress Steps - 5 visible dots including -->
      <div
        v-for="(step, index) in visibleSteps"
        :key="index"
        :class="['progress-step', getStepClass(step)]"
        :style="{ left: `calc(${(index / (visibleSteps.length - 1)) * 100}% * 0.9 + 5%)` }"
      >
        <div class="step-circle"></div>
        <span class="step-label">{{ step.displayLabel }}</span>
      </div>
    </div>

    <!-- Status Description -->
    <div class="status-description" :class="getStatusDescriptionClass">
      <h4>{{ currentStatusTitle }}</h4>
      <p>{{ currentStatusDescription }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  status: {
    type: String,
    required: true
  },
    isOwner: {
    type: Boolean,
    default: false
  }
});

// Define the 5 visual steps with their associated states
const stepDefinitionsOwner = [
  {
    key: 'request',
    states: ['PENDING', 'ACCEPTED'],
    position: 0
  },
  {
    key: 'pickup',
    states: ['PICKUP', 'PICKUP_RENTER'],
    position: 1
  },
  {
    key: 'in-progress',
    states: ['PICKUP_OWNER','IN_PROGRESS'],
    position: 2
  },
  {
    key: 'return',
    states: ['RETURN', 'RETURN_RENTER'],
    position: 3
  },
  {
    key: 'complete',
    states: ['RETURN_OWNER','COMPLETED', 'REVIEWED'],
    position: 4
  }
];
const stepDefinitionsRenter = [
  {
    key: 'request',
    states: ['PENDING', 'ACCEPTED'],
    position: 0
  },
  {
    key: 'pickup',
    states: ['PICKUP', 'PICKUP_OWNER'],
    position: 1
  },
  {
    key: 'in-progress',
    states: ['IN_PROGRESS','PICKUP_RENTER'],
    position: 2
  },
  {
    key: 'return',
    states: ['RETURN', 'RETURN_OWNER'],
    position: 3
  },
  {
    key: 'complete',
    states: ['RETURN_RENTER','COMPLETED', 'REVIEWED'],
    position: 4
  }
];

// Terminal states
const terminalStates = ['CANCELLED', 'DECLINED', 'DISPUTED', 'DISPUTE_RESOLVED'];

// Check if current status is terminal
const isTerminal = computed(() => terminalStates.includes(props.status));

// Select the appropriate step definitions based on user role
const stepDefinitions = computed(() => {
  return props.isOwner ? stepDefinitionsOwner : stepDefinitionsRenter;
});

// Get the current step index based on status
const currentStepPosition = computed(() => {
  if (isTerminal.value) {
    // Find the last completed step before terminal state
    // For now, we'll determine based on status logic
    if (props.status === 'DECLINED') return 0; // After request
    if (props.status === 'CANCELLED') {
      // Need to check when it was cancelled - for now assume after PENDING/ACCEPTED
      return 0;
    }
    if (props.status === 'DISPUTED') return 3; // After RETURN
    return 0;
  }

  // Find which step contains the current status
  for (const step of stepDefinitions.value) {
    if (step.states.includes(props.status)) {
      return step.position;
    }
  }

  return 0;
});

// Determine which label to show for multi-state steps
const getStepLabel = (step) => {
  const statesInStep = step.states;

  // If current status is in this step, show current status
  if (statesInStep.includes(props.status)) {
    return formatStatusLabel(props.status);
  }

  // If step is completed, show the last state in the step
  if (step.position < currentStepPosition.value) {
    return formatStatusLabel(statesInStep[statesInStep.length - 1]);
  }

  // If step is not reached, show the first state in the step
  return formatStatusLabel(statesInStep[0]);
};

// Format status label for Owner
const formatStatusLabelOwner = (status) => {
  const labels = {
    'PENDING': 'Requested',
    'ACCEPTED': 'Accepted',
    'PICKUP': 'Handoff',
    'PICKUP_OWNER': 'In progress',
    'PICKUP_RENTER': 'Confirm Handoff',
    'IN_PROGRESS': 'In Progress',
    'RETURN': 'Return',
    'RETURN_OWNER': 'Veification',
    'RETURN_RENTER': 'Confirm Return',
    'COMPLETED': 'Completed',
    'REVIEWED': 'Reviewed',
    'CANCELLED': 'Cancelled',
    'DECLINED': 'Declined',
    'DISPUTED': 'Disputed',
    'DISPUTE_RESOLVED': 'Resolved'
  };
  return labels[status] || status;
};

// Format status label for Renter
const formatStatusLabelRenter = (status) => {
  const labels = {
    'PENDING': 'Pending',
    'ACCEPTED': 'Accepted',
    'PICKUP': 'Pickup',
    'PICKUP_OWNER': 'Confirm Pickup',
    'PICKUP_RENTER': 'In Progress',
    'IN_PROGRESS': 'In Progress',
    'RETURN': 'Return',
    'RETURN_OWNER': 'Confirm Return',
    'RETURN_RENTER': 'Completed',
    'COMPLETED': 'Completed',
    'REVIEWED': 'Reviewed',
    'CANCELLED': 'Cancelled',
    'DECLINED': 'Declined',
    'DISPUTED': 'Disputed',
    'DISPUTE_RESOLVED': 'Resolved'
  };
  return labels[status] || status;
};

// Select the appropriate format function based on user role
const formatStatusLabel = (status) => {
  return props.isOwner ? formatStatusLabelOwner(status) : formatStatusLabelRenter(status);
};

// Build visible steps with their display labels
const visibleSteps = computed(() => {
  const steps = stepDefinitions.value.map(step => ({
    ...step,
    displayLabel: getStepLabel(step)
  }));

  // If terminal state, add it as the last visible dot
  if (isTerminal.value) {
    // Determine where to place the terminal dot
    const terminalPosition = currentStepPosition.value < 0 ? 0 : currentStepPosition.value >= 3 ? 3 : Math.ceil(currentStepPosition.value);

    // Replace or add terminal state
    return [
      ...steps.slice(0, terminalPosition),
      {
        key: 'terminal',
        states: [props.status],
        position: terminalPosition,
        displayLabel: formatStatusLabel(props.status),
        isTerminal: true
      }
    ];
  }

  return steps;
});

// Calculate progress line width (matching the 90% scale + 5% offset positioning)
const progressWidth = computed(() => {
  if (isTerminal.value) {
    // Terminal states show progress to where they ended
    const position = currentStepPosition.value < 0 ? 0 : currentStepPosition.value;
    return `calc(${(position / 4) * 100}% * 0.9)`;
  }

  const position = currentStepPosition.value;
  return `calc(${(position / 4) * 100}% * 0.9)`;
});

// Get step class (green/orange/grey/red)
const getStepClass = (step) => {
  if (step.isTerminal) {
    // Terminal states are red
    return 'step-terminal';
  }

  const stepPos = step.position;
  const currentPos = currentStepPosition.value;

  if (stepPos < currentPos) {
    // Passed steps are green
    return 'step-completed';
  } else if (stepPos === Math.floor(currentPos)) {
    // Current step is blue
    return 'step-active';
  } else {
    // Future steps are grey
    return 'step-inactive';
  }
};

// Status descriptions for Owner
const ownerStatusInfo = {
  'PENDING': {
    title: 'New rental request',
    description: 'Review booking details. When accepted renter will see your location and phone number.',
  },
  'ACCEPTED': {
    title: 'Booking accepted',
    description: 'Renter must complete payment before pickup.',
  },
  'PICKUP': {
    title: 'Pickup in progress',
    description: 'Confirm hand-off once equipment is collected.',
  },
  'PICKUP_OWNER': {
    title: 'Waiting for renter confirmation',
    description: 'You confirmed handoff. Renter needs to confirm they received the equipment.',
  },
  'PICKUP_RENTER': {
    title: 'Renter confirmed pickup',
    description: 'Please confirm handing off the equipment.',
  },
  'IN_PROGRESS': {
    title: 'Equipment rented out',
    description: 'Waiting for return.',
  },
  'RETURN': {
    title: 'Renter is returning the equipment',
    description: 'Confirm return when you get the item back.',
  },
  'RETURN_OWNER': {
    title: 'Verify equipment condition',
    description: 'You confirmed receiving equipment. Check condition of the equipment',
  },
  'RETURN_RENTER': {
    title: 'Verify equipment condition',
    description: 'Check the equipment and confirm everything is OK or report an issue.',
  },
  'COMPLETED': {
    title: 'Rental completed',
    description: 'Thanks for renting out your equipment!',
  },
  'REVIEWED': {
    title: 'Rental completed',
    description: 'Renter has left a review. Thanks for renting out your equipment!',
  },
  'CANCELLED': {
    title: 'Booking cancelled',
    description: 'No further action required.',
  },
  'DECLINED': {
    title: 'Booking declined',
    description: 'No further action required.',
  },
  'DISPUTED': {
    title: 'Booking under dispute',
    description: 'Support team will contact you.',
  },
  'DISPUTE_RESOLVED': {
    title: 'Dispute Resolved',
    description: 'The dispute has been resolved.',
  }
};

// Status descriptions for Renter
const renterStatusInfo = {
  'PENDING': {
    title: 'Waiting for owner approval',
    description: 'You can pay now to speed up approval of the booking.',
  },
  'ACCEPTED': {
    title: 'Booking accepted!',
    description: 'Please complete payment to proceed with the rental.',
  },
  'PICKUP': {
    title: "It's pickup time",
    description: 'Upload photos and confirm pickup when you collect the equipment.',
  },
  'PICKUP_OWNER': {
    title: 'Owner confirmed handoff',
    description: 'Please upload photos and confirm you received the equipment.',
  },
  'PICKUP_RENTER': {
    title: 'Waiting for owner confirmation',
    description: 'You confirmed pickup. Waiting for owner to confirm handoff.',
  },
  'IN_PROGRESS': {
    title: 'Enjoy your rental',
    description: 'The rental is ongoing. Return on time to avoid extra charges.',
  },
  'RETURN': {
    title: 'Time to return the equipment',
    description: 'Upload photos and confirm return to finish your rental.',
  },
  'RETURN_OWNER': {
    title: 'Owner confirmed return',
    description: 'Please confirm you returned the equipment.',
  },
  'RETURN_RENTER': {
    title: 'Waiting for owner to verify',
    description: 'You confirmed return. Waiting for owner to verify equipment condition.',
  },
  'COMPLETED': {
    title: 'Rental completed!',
    description: 'Thank you! You can now leave a review.',
  },
  'REVIEWED': {
    title: 'Review submitted',
    description: 'We appreciate your feedback.',
  },
  'CANCELLED': {
    title: 'Booking cancelled',
    description: 'No further action required.',
  },
  'DECLINED': {
    title: 'Booking declined by owner',
    description: "You won't be charged for this booking.",
  },
  'DISPUTED': {
    title: 'Booking under review',
    description: 'Support is investigating the issue.',
  },
  'DISPUTE_RESOLVED': {
    title: 'Dispute Resolved',
    description: 'The dispute has been resolved.',
  }
};

// Get the appropriate status info based on user role
const statusInfo = computed(() => {
  return props.isOwner ? ownerStatusInfo : renterStatusInfo;
});

const currentStatusTitle = computed(() => {
  return statusInfo.value[props.status]?.title || 'Booking Status';
});

const currentStatusDescription = computed(() => {
  return statusInfo.value[props.status]?.description || 'Status information unavailable.';
});

// Get status description box color class
const getStatusDescriptionClass = computed(() => {
  if (isTerminal.value) {
    return 'status-terminal';
  }
  return '';
});
</script>

<style scoped>
.progress-bar-container {
  padding: 0;
}

.progress-bar {
  position: relative;
  height: 80px;
  margin: 1rem 0 0 0;
  padding: 0 15px;
}

.progress-line {
  position: absolute;
  top: 15px;
  left: 5%;
  height: 3px;
  background: #10b981;
  transition: width 0.5s ease;
  border-radius: 2px;
  z-index: 1;
}

.progress-bar::before {
  content: '';
  position: absolute;
  top: 15px;
  left: 5%;
  width: 90%;
  height: 3px;
  background: #e5e7eb;
  border-radius: 2px;
  z-index: 0;
}

.progress-step {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  z-index: 2;
}

.step-circle {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: white;
  border: 3px solid #e5e7eb;
  transition: all 0.3s ease;
}

.step-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-align: center;
  white-space: nowrap;
  transition: color 0.3s ease;
  margin-top: 0.25rem;
}

/* Step States */
.step-completed .step-circle {
  background: #10b981;
  border-color: #10b981;
}

.step-completed .step-label {
  color: #116b34;
}

.step-active .step-circle {
  background: #3b82f6;
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
}

.step-active .step-label {
  color: #3b82f6;
  font-weight: 700;
}

.step-inactive .step-circle {
  background: white;
  border-color: #d1d5db;
}

.step-inactive .step-label {
  color: #9ca3af;
}

.step-terminal .step-circle {
  background: #ef4444;
  border-color: #ef4444;
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.15);
}

.step-terminal .step-label {
  color: #ef4444;
  font-weight: 700;
}

/* Status Description */
.status-description {
  padding: 1rem;
  background: #eff6ff;
  border-radius: 15px;
  border: 3px solid #3b82f6;
  transition: all 0.3s ease;
}

.status-description.status-terminal {
  background: #fef2f2;
  border: 3px solid #ef4444;
}

.status-description h4 {
  font-size: 0.95rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.25rem 0;
}

.status-description p {
  font-size: 0.85rem;
  color: #6b7280;
  line-height: 1.5;
  margin: 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .progress-bar {
    height: 100px;
  }

  .step-label {
    font-size: 0.65rem;
    max-width: 70px;
  }

  .in-progress-label span {
    font-size: 0.65rem;
  }

  .step-circle {
    width: 24px;
    height: 24px;
    border-width: 2px;
  }
}

@media (max-width: 480px) {
  .progress-bar {
    height: 110px;
  }

  .step-label {
    font-size: 0.6rem;
    max-width: 60px;
    line-height: 1.2;
  }

  .step-circle {
    width: 20px;
    height: 20px;
  }
}
</style>
