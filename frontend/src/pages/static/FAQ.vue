<template>
  <section class="page-container">
    <h1>Frequently Asked Questions</h1>

    <div class="faq-item">
      <h2>1. What is Ski-Swap?</h2>
      <p>
        Ski-Swap is a trusted online platform for renting and exchanging ski and snowboard
        equipment. We connect riders with verified gear owners and rental shops to make
        winter sports affordable and sustainable.
      </p>
    </div>

    <div class="faq-item">
      <h2>2. How does the rental process work?</h2>
      <p>
        Simply browse available equipment, choose your rental dates, and confirm your booking.
        After payment, you’ll receive pick-up or delivery details directly from the provider.
      </p>
    </div>

    <div class="faq-item">
      <h2>3. Is the equipment verified and safe?</h2>
      <p>
        Yes! All listings on Ski-Swap go through a verification process. Our partners inspect
        equipment regularly to ensure it meets safety and quality standards.
      </p>
    </div>

    <div class="faq-item">
      <h2>4. What if the equipment is damaged or doesn’t fit?</h2>
      <p>
        Contact the provider immediately. If you’re unable to resolve the issue,
        reach out to our <router-link to="/trust">Trust & Safety</router-link> team,
        and we’ll assist you in finding a fair solution.
      </p>
    </div>

    <div class="faq-item">
      <h2>5. Can I cancel or modify my booking?</h2>
      <p>
        Yes. Cancellations and modifications depend on the partner’s policy. Always review
        the terms before confirming your booking. For urgent cases, contact our support team
        at <a href="mailto:support@ski-swap.com">support@ski-swap.com</a>.
      </p>
    </div>

    <div class="faq-item">
      <h2>6. How do I become a Ski-Swap partner?</h2>
      <p>
        Visit our <router-link to="/partnership">Partnership</router-link> page or email
        <a href="mailto:partners@ski-swap.com">partners@ski-swap.com</a> to discuss how we can
        collaborate.
      </p>
    </div>

    <p class="closing">
      Still have questions? Head over to our <router-link to="/message">Message Us</router-link> page — 
      we’re happy to help!
    </p>
  </section>
</template>

<style scoped>
.page-container {
  max-width: 900px;
  margin: 3rem auto;
  padding: 1rem 1.5rem;
  color: #222;
  line-height: 1.7;
}

h1 {
  color: #0088cc;
  font-size: 2rem;
  margin-bottom: 1.5rem;
}

.faq-item {
  margin-bottom: 1.5rem;
  background-color: #f8f9fa;
  padding: 1rem 1.25rem;
  border-left: 4px solid #00aaff;
  border-radius: 6px;
}

h2 {
  color: #007acc;
  margin-bottom: 0.5rem;
}

a {
  color: #007acc;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

.closing {
  margin-top: 2rem;
  font-style: italic;
  color: #333;
}
</style>
