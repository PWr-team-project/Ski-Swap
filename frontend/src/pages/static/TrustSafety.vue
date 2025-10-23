<template>
  <section class="page-container">
    <h1>Trust & Safety</h1>

    <p>
      At <strong>Ski-Swap</strong>, your safety and peace of mind come first.  
      We’re committed to ensuring that every rental, exchange, and interaction
      on our platform is reliable, transparent, and secure.
    </p>

    <h2>Verified Equipment & Partners</h2>
    <p>
      All equipment listed on Ski-Swap is provided by verified owners or certified
      partners. We work closely with rental shops and outdoor specialists to make sure
      every item meets our safety and quality standards before being made available.
    </p>

    <h2>Secure Transactions</h2>
    <p>
      All payments are processed through trusted and encrypted gateways.  
      We never store your card details, and our system automatically tracks 
      each transaction to prevent fraud or misuse.
    </p>

    <h2>User Reviews & Ratings</h2>
    <p>
      After every rental or exchange, both parties can leave feedback.  
      This helps maintain accountability and allows our community to grow
      through honest, transparent experiences.
    </p>

    <h2>Dispute Resolution</h2>
    <p>
      If any issue arises with a rental or user interaction, our support team
      is here to help. We review all reports carefully and ensure that fair
      resolutions are reached as quickly as possible.
    </p>

    <h2>Community Guidelines</h2>
    <ul>
      <li>Respect fellow users and partners.</li>
      <li>Return equipment in the same condition it was rented.</li>
      <li>Report any damage or issues immediately.</li>
      <li>Never exchange personal payment details outside Ski-Swap.</li>
    </ul>

    <p class="closing">
      Safety is a shared responsibility — together, we can make winter adventures
      secure, enjoyable, and worry-free.  
      Need help? Reach out via our <router-link to="/message">Message Us</router-link> page.
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

ul {
  list-style: disc;
  padding-left: 1.5rem;
}

li {
  margin-bottom: 0.4rem;
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
