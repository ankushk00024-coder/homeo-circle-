// 4-Stage Care Flow Component
export function renderCareFlow() {
  return `
    <section class="flow-strip-section" id="care-flow" aria-label="Care Flow Pillars">
      <div class="container">
        <div class="flow-strip-grid">
          <!-- Step 1: Discover -->
          <div class="flow-pill-card">
            <div class="flow-icon-circle chartreuse">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/>
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
              </svg>
            </div>
            <div class="flow-card-info">
              <h4>Discover</h4>
              <p>Explore suitable homeopathic practitioners by clinical experience and philosophy.</p>
            </div>
          </div>

          <!-- Step 2: Prepare -->
          <div class="flow-pill-card">
            <div class="flow-icon-circle lavender">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" x2="8" y1="13" y2="13"/>
                <line x1="16" x2="8" y1="17" y2="17"/>
                <line x1="10" x2="8" y1="9" y2="9"/>
              </svg>
            </div>
            <div class="flow-card-info">
              <h4>Prepare</h4>
              <p>Organise your health timeline, previous treatments, and symptoms before your call.</p>
            </div>
          </div>

          <!-- Step 3: Connect -->
          <div class="flow-pill-card">
            <div class="flow-icon-circle soft-purple">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div class="flow-card-info">
              <h4>Connect</h4>
              <p>Consult with a qualified, verified doctor in an unhurried, calm consultation.</p>
            </div>
          </div>

          <!-- Step 4: Continue -->
          <div class="flow-pill-card">
            <div class="flow-icon-circle tomato">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
              </svg>
            </div>
            <div class="flow-card-info">
              <h4>Continue</h4>
              <p>Track your remedy progress, constitutional changes, and scheduled follow-ups.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}
