<template>
  <div class="why-choose-section">
    <h2 class="section-title">Why Choose Ski-Swap?</h2>
    <p class="section-subtitle">The trusted platform for renting and sharing ski equipment</p>
    
    <div class="features-grid">
      <!-- Feature 1 -->
      <div class="feature-card">
        <div class="icon-circle">
          <img src="/assets/images/shield_icon.png" alt="Trusted & Safe" class="feature-icon" />
        </div>
        <h3 class="feature-title">Trusted & Safe</h3>
        <p class="feature-description">
          All equipment is verified and insured. Rent with confidence from trusted owners.
        </p>
      </div>
      
      <!-- Feature 2 -->
      <div class="feature-card">
        <div class="icon-circle">
          <img src="/assets/images/dollar_icon.png" alt="Best Prices" class="feature-icon" />
        </div>
        <h3 class="feature-title">Best Prices</h3>
        <p class="feature-description">
          Save up to 70% compared to traditional rental shops. Direct peer-to-peer pricing.
        </p>
      </div>
      
      <!-- Feature 3 -->
      <div class="feature-card">
        <div class="icon-circle">
          <img src="/assets/images/community_icon.png" alt="Local Community" class="feature-icon" />
        </div>
        <h3 class="feature-title">Local Community</h3>
        <p class="feature-description">
          Connect with fellow ski enthusiasts and rent from verified local owners.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
// No props or state needed for this static component
</script>

<style scoped>
.why-choose-section {
  background: white;
  border-radius: 25px;
  padding: 5rem 2rem;
  text-align: center;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #00AAFF;
  margin-bottom: 1rem;
}

.section-subtitle {
  font-size: 1.25rem;
  color: #666;
  margin-bottom: 4rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 3rem;
  max-width: 1200px;
  margin: 0 auto;
}

.feature-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.icon-circle {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #d4ebf7 0%, #b8dff5 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover .icon-circle {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 170, 255, 0.2);
}

.feature-icon {
  width: 45px;
  height: 45px;
  object-fit: contain;
}

.feature-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 1rem;
}

.feature-description {
  font-size: 1rem;
  color: #666;
  line-height: 1.6;
  max-width: 350px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .why-choose-section {
    padding: 4rem 1.5rem;
  }
  
  .section-title {
    font-size: 2rem;
  }
  
  .section-subtitle {
    font-size: 1.1rem;
    margin-bottom: 3rem;
  }
  
  .features-grid {
    gap: 2.5rem;
  }
  
  .icon-circle {
    width: 90px;
    height: 90px;
  }
  
  .feature-icon {
    width: 40px;
    height: 40px;
    object-fit: contain;
  }
}

@media (max-width: 480px) {
  .section-title {
    font-size: 1.75rem;
  }
  
  .section-subtitle {
    font-size: 1rem;
  }
  
  .feature-title {
    font-size: 1.25rem;
  }
  
  .feature-description {
    font-size: 0.95rem;
  }
}
</style>