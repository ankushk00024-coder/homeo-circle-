// Clinical Philosophy & Trust Framework Component
export function renderPhilosophy() {
  return `
    <section class="section-spacer" id="philosophy" style="background: rgba(248, 243, 255, 0.6);">
      <div class="container">
        <div class="section-header text-center">
          <div class="eyebrow-pill">
            <span class="eyebrow-dot"></span>
            <span>Clinical Integrity</span>
          </div>
          <h2 class="section-title">Built on trust, <span class="serif-accent italic">gentle science,</span> and privacy.</h2>
          <p class="section-desc">
            We are creating NeoHomeo to elevate the standard of digital homeopathic healthcare through strict verification, patient privacy, and unhurried consultation design.
          </p>
        </div>

        <div class="philosophy-grid">
          <!-- Pillar 1 -->
          <div class="philosophy-card">
            <div class="philosophy-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
            </div>
            <h4>Council-Verified Doctors</h4>
            <p>Every practitioner must hold recognized qualifications (BHMS, MD Hom) and active registration with official state or national homeopathic councils.</p>
          </div>

          <!-- Pillar 2 -->
          <div class="philosophy-card">
            <div class="philosophy-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <h4>Unhurried Consultations</h4>
            <p>Classical homeopathy requires deep, holistic case-taking. Our platform is engineered to give doctor and patient the time needed to understand root causes.</p>
          </div>

          <!-- Pillar 3 -->
          <div class="philosophy-card">
            <div class="philosophy-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h4>Encrypted Care Privacy</h4>
            <p>Your health diary, consultations, and posology notes are strictly confidential. You retain full control over who accesses your records at all times.</p>
          </div>

          <!-- Pillar 4 -->
          <div class="philosophy-card">
            <div class="philosophy-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
              </svg>
            </div>
            <h4>Complementary Harmony</h4>
            <p>We respect holistic integrative medicine. Homeopathic care is viewed as a supportive, constitutional pillar alongside essential conventional healthcare.</p>
          </div>
        </div>
      </div>
    </section>
  `;
}
