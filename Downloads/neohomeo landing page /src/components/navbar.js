// Navigation Component
export function renderNavbar() {
  return `
    <nav class="site-nav" id="site-nav">
      <div class="container nav-container">
        <a href="/" class="brand-logo" aria-label="NeoHomeo Home">
          <svg class="brand-symbol" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 4C18 4 29 13.5 29 22C29 28.0751 24.0751 33 18 33C11.9249 33 7 28.0751 7 22C7 13.5 18 4 18 4Z" fill="#C8B3E8"/>
            <path d="M18 10C18 10 25.5 17.5 25.5 23.5C25.5 27.6421 22.1421 31 18 31C13.8579 31 10.5 27.6421 10.5 23.5C10.5 17.5 18 10 18 10Z" fill="#D4FF3F" fill-opacity="0.8"/>
            <path d="M18 16C18 16 22 21 22 24.5C22 26.7091 20.2091 28.5 18 28.5C15.7909 28.5 14 26.7091 14 24.5C14 21 18 16 18 16Z" fill="#583F7E"/>
          </svg>
          <div class="brand-text">
            <span class="brand-title">NeoHomeo</span>
            <span class="brand-tagline">Connect. Care. Cure.</span>
          </div>
        </a>

        <ul class="nav-links">
          <li><a href="#how-it-works" class="nav-link">How It Works</a></li>
          <li><a href="#care-journey" class="nav-link">Care Journey</a></li>
          <li><a href="#patients" class="nav-link" id="nav-link-patients">For Patients</a></li>
          <li><a href="#doctors" class="nav-link" id="nav-link-doctors">For Doctors</a></li>
          <li><a href="#faq" class="nav-link">FAQ</a></li>
        </ul>

        <div class="nav-actions">
          <button type="button" class="btn btn-sm btn-chartreuse trigger-waitlist-btn nav-header-cta" data-role="patient">
            <span class="nav-cta-text-full">Join the Waitlist</span>
            <span class="nav-cta-text-short">Join</span>
            <svg class="nav-cta-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12h14"/>
              <path d="m12 5 7 7-7 7"/>
            </svg>
          </button>

          <button type="button" class="mobile-menu-btn" id="mobile-toggle-btn" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="mobile-drawer">
            <svg class="hamburger-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="4" x2="20" y1="12" y2="12"/>
              <line x1="4" x2="20" y1="6" y2="6"/>
              <line x1="4" x2="20" y1="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile Dropdown Drawer -->
      <div class="mobile-drawer" id="mobile-drawer" role="navigation" aria-label="Mobile Navigation">
        <a href="#how-it-works" class="mobile-nav-link">How It Works</a>
        <a href="#care-journey" class="mobile-nav-link">Care Journey</a>
        <a href="#patients" class="mobile-nav-link" id="mobile-link-patients">For Patients</a>
        <a href="#doctors" class="mobile-nav-link" id="mobile-link-doctors">For Doctors</a>
        <a href="#philosophy" class="mobile-nav-link">Clinical Integrity</a>
        <a href="#faq" class="mobile-nav-link">FAQ</a>
        <div style="margin-top: 0.75rem;">
          <button type="button" class="btn btn-chartreuse trigger-waitlist-btn" style="width: 100%; justify-content: center;" data-role="patient">Join the Waitlist</button>
        </div>
      </div>
    </nav>
  `;
}
