<script setup>
</script>

<template>
  <footer class="footer">
    <div class="footer-content">
      <!-- Logo and Description -->
      <div class="footer-section brand-section">
        <div class="footer-logo">
          <img src="/assets/images/logo.png" alt="Ski-Swap Logo" class="footer-logo-img" />
          <span class="footer-logo-text">Ski-Swap</span>
        </div>
        <p class="footer-description">
          Your trusted platform for renting ski and snowboard equipment.
        </p>
      </div>

      <!-- Company Links -->
      <div class="footer-section">
        <h3 class="footer-heading">Company</h3>
        <ul class="footer-links">
          <li><a href="#about">About Us</a></li>
          <li><a href="#contact">Contact</a></li>
          <li><a href="#partnership">Partnership</a></li>
        </ul>
      </div>

      <!-- Support Links -->
      <div class="footer-section">
        <h3 class="footer-heading">Support</h3>
        <ul class="footer-links">
          <li><a href="#help">FAQ</a></li>
          <li><a href="#trust">Trust & Safety</a></li>
          <li><a href="#messaging">Message Us</a></li>
        </ul>
      </div>

      <!-- Legal Links -->
      <div class="footer-section">
        <h3 class="footer-heading">Legal</h3>
        <ul class="footer-links">
          <li><a href="#terms">Terms & Conditions</a></li>
          <li><a href="#privacy">Privacy Policy</a></li>
          <li><a href="#cookies">Cookie Policy</a></li>
        </ul>
      </div>
    </div>

    <!-- Copyright -->
    <div class="footer-bottom">
      <p class="copyright">© 2025 Ski-Swap. All rights reserved.</p>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: linear-gradient(135deg, #00AAFF 0%, #0088CC 100%);
  color: white;
  padding: 2.5rem 2rem 1rem;
  border-top: 4px solid white;
}

.footer-content {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  padding-bottom: 1.5rem;
}

.footer-section {
  display: flex;
  flex-direction: column;
}

.brand-section {
  max-width: 280px;
}

.footer-logo {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
}

.footer-logo-img {
  width: 128px;
  height: 128px;
  object-fit: contain;
}

.footer-logo-text {
  font-size: 2rem;
  font-weight: bold;
  margin-left: 0.5rem;
}

.footer-description {
  font-size: 0.9rem;
  line-height: 1.5;
  opacity: 0.95;
  text-align: center;
}

.footer-heading {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
}

.footer-links li {
  margin-bottom: 0.5rem;
}

.footer-links a {
  color: white;
  text-decoration: none;
  font-size: 0.9rem;
  opacity: 0.9;
  transition: opacity 0.2s ease;
}

.footer-links a:hover {
  opacity: 1;
  text-decoration: underline;
}

.footer-bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  padding-top: 1rem;
  text-align: center;
  max-width: 1200px;
  margin: 0 auto;
}

.copyright {
  font-size: 0.85rem;
  opacity: 0.9;
}

/* Responsive Design */
@media (max-width: 968px) {
  .footer-content {
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }
  
  .brand-section {
    grid-column: 1 / -1;
    max-width: 100%;
  }
}

@media (max-width: 640px) {
  .footer {
    padding: 2rem 1.5rem 1rem;
  }
  
  .footer-content {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .brand-section {
    grid-column: 1;
  }
  
  .footer-heading {
    font-size: 0.95rem;
  }
  
  .footer-links a {
    font-size: 0.85rem;
  }
}
</style>