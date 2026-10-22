// Hero Component
export function renderHero() {
  return `
    <section class="hero-section" id="hero">
      <div class="container">
        <div class="hero-grid">
          <!-- Left Column: Editorial Headline & Actions -->
          <div class="hero-content">
            <div class="eyebrow-pill">
              <span class="eyebrow-dot chartreuse"></span>
              <span>The Next Chapter of Connected Care</span>
            </div>

            <h1 class="hero-title">
              Better care starts with the <span class="serif-accent">right connection.</span>
            </h1>

            <p class="hero-subtitle">
              A more connected way to discover homeopathic doctors, prepare for consultations, and organise your care journey.
            </p>

            <div class="hero-actions">
              <button type="button" class="btn btn-lg btn-chartreuse trigger-waitlist-btn" data-role="patient">
                <span>Join the Waitlist</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12h14"/>
                  <path d="m12 5 7 7-7 7"/>
                </svg>
              </button>

              <a href="#care-journey" class="btn btn-lg btn-outline-lavender" id="hero-explore-vision-btn">
                <span>Explore the Vision</span>
              </a>
            </div>

            <div class="hero-community-proof">
              <div class="avatar-stack">
                <div class="avatar-item" style="background-color: #E3D4F8;">AS</div>
                <div class="avatar-item" style="background-color: #D4FF3F; color: #1A1A1A;">RM</div>
                <div class="avatar-item" style="background-color: #FFE6E3; color: #E34234;">+</div>
              </div>
              <div class="community-text">
                <strong>Be part of a growing community</strong>
                <span>Patients, doctors and supporters joining early</span>
              </div>
            </div>
          </div>

          <!-- Right Column: Supplied Two-Doctor Image -->
          <div class="hero-image-wrapper">
            <div class="hero-doctor-frame">
              <img 
                src="/doctors-hero.png" 
                alt="NeoHomeo Homeopathic Physicians" 
                class="hero-doctors-img"
                width="780" 
                height="774"
                loading="eager"
                fetchpriority="high"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

export function initHeroInteractions() {
  // Smooth scroll handler for Explore the Vision
  const exploreBtn = document.getElementById('hero-explore-vision-btn');
  if (exploreBtn) {
    exploreBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById('care-journey');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
}
