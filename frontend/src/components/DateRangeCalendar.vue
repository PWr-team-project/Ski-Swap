<template>
  <div class="calendar-container">
    <div class="calendar-header">
      <button @click="changeMonth(-1)" class="month-nav-btn">‹</button>
      <span class="current-month">{{ currentMonthYear }}</span>
      <button @click="changeMonth(1)" class="month-nav-btn">›</button>
    </div>

    <div class="calendar-grid">
      <div class="calendar-weekdays">
        <div v-for="day in weekdays" :key="day" class="weekday">{{ day }}</div>
      </div>
      <div class="calendar-days">
        <div
          v-for="(day, index) in calendarDays"
          :key="index"
          class="calendar-day"
          :class="{
            'other-month': day.otherMonth,
            'selected': isDateSelected(day),
            'in-range': isDateInRange(day),
            'pickup': isPickupDate(day),
            'dropoff': isDropoffDate(day),
            'past': isPastDate(day),
            'blocked': isDateBlocked(day)
          }"
          @click="selectDate(day)"
        >
          {{ day.date }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ pickupDate: null, dropoffDate: null })
  },
  blockedDates: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

// State
const currentMonth = ref(new Date().getMonth())
const currentYear = ref(new Date().getFullYear())
const pickupDate = ref(props.modelValue.pickupDate)
const dropoffDate = ref(props.modelValue.dropoffDate)

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  pickupDate.value = newValue.pickupDate
  dropoffDate.value = newValue.dropoffDate
}, { deep: true })

// Emit changes
watch([pickupDate, dropoffDate], () => {
  emit('update:modelValue', {
    pickupDate: pickupDate.value,
    dropoffDate: dropoffDate.value
  })
})

// Computed
const currentMonthYear = computed(() => {
  const date = new Date(currentYear.value, currentMonth.value)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
})

const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const calendarDays = computed(() => {
  const firstDay = new Date(currentYear.value, currentMonth.value, 1)
  const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0)
  const prevLastDay = new Date(currentYear.value, currentMonth.value, 0)

  // Get day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  let firstDayOfWeek = firstDay.getDay()
  // Convert to Monday-based (0 = Monday, 1 = Tuesday, ..., 6 = Sunday)
  firstDayOfWeek = (firstDayOfWeek + 6) % 7

  const lastDateOfMonth = lastDay.getDate()
  const prevLastDate = prevLastDay.getDate()

  const allDays = []

  // Previous month days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    allDays.push({
      date: prevLastDate - i,
      month: currentMonth.value - 1,
      year: currentYear.value,
      otherMonth: true
    })
  }

  // Current month days
  for (let i = 1; i <= lastDateOfMonth; i++) {
    allDays.push({
      date: i,
      month: currentMonth.value,
      year: currentYear.value,
      otherMonth: false
    })
  }

  // Next month days to complete the grid
  const remainingDays = Math.ceil(allDays.length / 7) * 7 - allDays.length
  for (let i = 1; i <= remainingDays; i++) {
    allDays.push({
      date: i,
      month: currentMonth.value + 1,
      year: currentYear.value,
      otherMonth: true
    })
  }

  // Filter out weeks that contain no days from the current month
  const filteredDays = []
  for (let i = 0; i < allDays.length; i += 7) {
    const week = allDays.slice(i, i + 7)
    // Only include week if it has at least one day from current month
    if (week.some(day => !day.otherMonth)) {
      filteredDays.push(...week)
    }
  }

  return filteredDays
})

// Methods
const changeMonth = (direction) => {
  currentMonth.value += direction
  if (currentMonth.value > 11) {
    currentMonth.value = 0
    currentYear.value++
  } else if (currentMonth.value < 0) {
    currentMonth.value = 11
    currentYear.value--
  }
}

const selectDate = (day) => {
  if (day.otherMonth || isPastDate(day) || isDateBlocked(day)) return

  const selectedDate = new Date(day.year, day.month, day.date)

  if (!pickupDate.value || (pickupDate.value && dropoffDate.value)) {
    // Start new selection
    pickupDate.value = selectedDate
    dropoffDate.value = null
  } else if (selectedDate < pickupDate.value) {
    // Selected date is before pickup, make it the new pickup
    pickupDate.value = selectedDate
  } else {
    // Check if any blocked dates exist between pickup and dropoff
    const hasBlockedInRange = checkBlockedInRange(pickupDate.value, selectedDate)
    if (hasBlockedInRange) {
      // Reset and start new selection
      pickupDate.value = selectedDate
      dropoffDate.value = null
      return
    }
    // Selected date is after pickup, make it dropoff
    dropoffDate.value = selectedDate
  }
}

const isDateSelected = (day) => {
  if (day.otherMonth) return false
  const date = new Date(day.year, day.month, day.date)
  return (pickupDate.value && date.getTime() === pickupDate.value.getTime()) ||
         (dropoffDate.value && date.getTime() === dropoffDate.value.getTime())
}

const isDateInRange = (day) => {
  if (day.otherMonth || !pickupDate.value || !dropoffDate.value) return false
  const date = new Date(day.year, day.month, day.date)
  return date > pickupDate.value && date < dropoffDate.value
}

const isPickupDate = (day) => {
  if (day.otherMonth || !pickupDate.value) return false
  const date = new Date(day.year, day.month, day.date)
  return date.getTime() === pickupDate.value.getTime()
}

const isDropoffDate = (day) => {
  if (day.otherMonth || !dropoffDate.value) return false
  const date = new Date(day.year, day.month, day.date)
  return date.getTime() === dropoffDate.value.getTime()
}

const isPastDate = (day) => {
  const date = new Date(day.year, day.month, day.date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

const isDateBlocked = (day) => {
  if (day.otherMonth) return false
  const date = new Date(day.year, day.month, day.date)

  return props.blockedDates.some(blocked => {
    const blockStart = new Date(blocked.start_date)
    const blockEnd = new Date(blocked.end_date)
    blockStart.setHours(0, 0, 0, 0)
    blockEnd.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)

    // Block all dates from start_date to end_date (inclusive)
    // Drop-off day is also blocked (cannot be a pickup day for another booking)
    return date >= blockStart && date <= blockEnd
  })
}

const checkBlockedInRange = (startDate, endDate) => {
  return props.blockedDates.some(blocked => {
    const blockStart = new Date(blocked.start_date)
    const blockEnd = new Date(blocked.end_date)

    // Check if blocked range overlaps with selected range
    return (startDate < blockEnd && endDate > blockStart)
  })
}
</script>

<style scoped>
.calendar-container {
  margin-bottom: 0.5rem;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.month-nav-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: #f8fbff;
  border-radius: 10px;
  font-size: 1.5rem;
  color: #00AAFF;
  cursor: pointer;
  transition: all 0.3s ease;
}

.month-nav-btn:hover {
  background: #00AAFF;
  color: white;
}

.current-month {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
}

.calendar-grid {
  margin-bottom: 0.25rem;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
  margin-bottom: 0.5rem;
}

.weekday {
  text-align: center;
  font-size: 0.85rem;
  font-weight: 600;
  color: #666;
  padding: 0.5rem 0;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.25rem;
}

.calendar-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #f8fbff;
}

.calendar-day:hover:not(.other-month):not(.past):not(.blocked) {
  background: #e3f2fd;
}

.calendar-day.other-month {
  color: #ccc;
  cursor: default;
}

.calendar-day.past,
.calendar-day.blocked {
  color: #ccc;
  cursor: not-allowed;
  text-decoration: line-through;
  background: #f8fbff;
}

.calendar-day.selected,
.calendar-day.pickup,
.calendar-day.dropoff {
  background: #00AAFF;
  color: white;
  font-weight: 600;
}

.calendar-day.in-range {
  background: rgba(0, 170, 255, 0.2);
  color: #00AAFF;
}
</style>
