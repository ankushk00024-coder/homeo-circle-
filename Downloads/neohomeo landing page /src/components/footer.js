// Footer Component
export function renderFooter() {
  return `
    <footer class="site-footer">
      <div class="container">
        <div class="footer-grid">
          <!-- Col 1: Brand -->
          <div class="footer-brand">
            <a href="#" class="brand-logo" aria-label="NeoHomeo Home">
              <svg class="brand-symbol" viewBox="0 0 36 36" fill="none">
                <path d="M18 4C18 4 29 13.5 29 22C29 28.0751 24.0751 33 18 33C11.9249 33 7 28.0751 7 22C7 13.5 18 4 18 4Z" fill="#C8B3E8"/>
                <path d="M18 10C18 10 25.5 17.5 25.5 23.5C25.5 27.6421 22.1421 31 18 31C13.8579 31 10.5 27.6421 10.5 23.5C10.5 17.5 18 10 18 10Z" fill="#D4FF3F"/>
              </svg>
              <div class="brand-text">
                <span class="brand-title">NeoHomeo</span>
                <span class="brand-tagline">Connect. Care. Cure.</span>
              </div>
            </a>
            <p>
              Reimagining homeopathic healthcare with gentle science, verified doctor connection, and seamless care organization.
            </p>
          </div>

          <!-- Col 2: Product -->
          <div>
            <h4 class="footer-col-title">Platform</h4>
            <ul class="footer-links-list">
              <li><a href="#how-it-works" class="footer-link-item">How It Works</a></li>
              <li><a href="#care-journey" class="footer-link-item">Care Journey</a></li>
              <li><a href="#audiences" class="footer-link-item">For Patients</a></li>
              <li><a href="#audiences" class="footer-link-item">For Doctors</a></li>
              <li><a href="#philosophy" class="footer-link-item">Clinical Integrity</a></li>
              <li><a href="#faq" class="footer-link-item">FAQ</a></li>
            </ul>
          </div>

          <!-- Col 3: Legal & Compliance -->
          <div>
            <h4 class="footer-col-title">Legal & Trust</h4>
            <ul class="footer-links-list">
              <li><a href="javascript:void(0)" class="footer-link-item" id="legal-privacy-btn">Privacy Policy</a></li>
              <li><a href="javascript:void(0)" class="footer-link-item" id="legal-terms-btn">Terms of Use</a></li>
              <li><a href="javascript:void(0)" class="footer-link-item" id="legal-disclaimer-btn">Medical Disclaimer</a></li>
              <li><a href="javascript:void(0)" class="footer-link-item" id="legal-verification-btn">Council Verification</a></li>
            </ul>
          </div>

          <!-- Col 4: Stay Updated -->
          <div class="footer-subscribe-box">
            <h4 class="footer-col-title">Stay Updated</h4>
            <p>
              Join our development dispatch for milestone updates, clinical perspectives, and early release announcements.
            </p>
            <form id="footer-newsletter-form" class="newsletter-form">
              <input type="email" id="newsletter-email" class="newsletter-input" placeholder="Enter your email" required>
              <button type="submit" class="newsletter-submit-btn" aria-label="Subscribe to updates">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M5 12h14"/>
                  <path d="m12 5 7 7-7 7"/>
                </svg>
              </button>
            </form>
          </div>
        </div>

        <!-- Bottom Row -->
        <div class="footer-bottom-row">
          <div>
            © 2026 NeoHomeo Healthcare Platform. All rights reserved. · A connected future for homeopathic care.
          </div>
          <div>
            <button type="button" class="footer-admin-link" id="footer-admin-portal-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span>Staff Admin Portal</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  `;
}
