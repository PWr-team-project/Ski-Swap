<template>
  <section class="page-container">
    <h1>Message Us</h1>
    <p>
      Have a question, suggestion, or feedback?  
      Use the form below to contact our <strong>Ski-Swap</strong> support team — we’d love to hear from you!
    </p>

    <form class="message-form" @submit.prevent="sendMessage">
      <div class="form-group">
        <label for="subject">Subject</label>
        <select id="subject" v-model="subject" required>
          <option disabled value="">Select a subject</option>
          <option>General Inquiry</option>
          <option>Partnership Opportunity</option>
          <option>Report a Problem</option>
          <option>Feedback</option>
          <option>Other</option>
        </select>
      </div>

      <div class="form-group">
        <label for="message">Your Message</label>
        <textarea
          id="message"
          v-model="message"
          rows="6"
          placeholder="Type your message here..."
          required
        ></textarea>
      </div>

      <button type="submit" class="send-button" :disabled="loading">
        {{ loading ? "Sending..." : "Send Message" }}
      </button>

      <p v-if="successMessage" class="success-message">{{ successMessage }}</p>
      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </form>
  </section>
</template>

<script setup>
import { ref } from 'vue'

// Reactive form fields
const subject = ref('')
const message = ref('')
const loading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

// Simulated email send function could be changed later on with the backend API
const sendMessage = async () => {
  loading.value = true
  successMessage.value = ''
  errorMessage.value = ''

  try {
    // here to replace the written with acrual end point url
    const response = await fetch('backend end point ', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subject: subject.value,
        message: message.value
      })
    })

    if (response.ok) {
      successMessage.value = 'Your message has been sent successfully! ✅'
      subject.value = ''
      message.value = ''
    } else {
      throw new Error('Failed to send message.')
    }
  } catch (err) {
    errorMessage.value = 'An error occurred while sending your message. Please try again later.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.page-container {
  max-width: 900px;
  margin: 3rem auto;
  padding: 1rem 1.5rem;
  line-height: 1.7;
  color: #222;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

h1 {
  color: #0088cc;
  font-size: 2rem;
  margin-bottom: 1rem;
}

p {
  margin-bottom: 1rem;
}

.message-form {
  margin-top: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

label {
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #007acc;
}

select,
textarea {
  padding: 0.75rem 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.3s ease;
}

select:focus,
textarea:focus {
  border-color: #00aaff;
}

.send-button {
  align-self: flex-start;
  padding: 0.75rem 2rem;
  background: #00aaff;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s ease;
}

.send-button:hover {
  background: #66d1ff;
}

.send-button:disabled {
  background: #bde6fa;
  cursor: not-allowed;
}

.success-message {
  color: green;
  font-weight: 500;
}

.error-message {
  color: red;
  font-weight: 500;
}
</style>
