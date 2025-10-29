<template>
  <section class="page-container">
    <h1>Contact Us</h1>

    <p>
      Have a question, feedback, or partnership idea?  
      The Ski-Swap team would love to hear from you!  
      We’re here to make your ski and snowboard experience smoother and more enjoyable.
    </p>

    <div class="contact-info">
      <div>
        <h2>Customer Support</h2>
        <p>
          📧 Email: <a href="SKI:support@ski-swap.com">support@ski-swap.com</a><br />
          📞 Phone: +48 777 222 333
        </p>
      </div>

      <div>
        <h2>Business & Partnership Inquiries</h2>
        <p>
          📧 Email: <a href="SKI:partners@ski-swap.com">partners@ski-swap.com</a><br />
          🕒 Mon – Fri: 9 AM – 6 PM (UTC)
        </p>
      </div>

      <div>
        <h2>Head Office</h2>
        <p>
          ❄️ 123 Alpine Drive, Whistler BC, Canada V8E 0X0
        </p>
      </div>
    </div>

    <p class="closing">
      Or simply head to our <router-link to="/message">Message Us</router-link> page  
      to send us a direct message through the website.
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
  margin-bottom: 1rem;
}

h2 {
  color: #007acc;
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}

.contact-info {
  margin-top: 1rem;
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
