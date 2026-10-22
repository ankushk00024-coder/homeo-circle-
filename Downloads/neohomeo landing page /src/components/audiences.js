// Audiences Section Component (Designed for every step of care)
export function renderAudiences() {
  return `
    <section class="section-spacer" id="audiences">
      <div class="container">
        <div class="section-header text-center">
          <div class="eyebrow-pill">
            <span class="eyebrow-dot chartreuse"></span>
            <span>Ecosystem of Care</span>
          </div>
          <h2 class="section-title">Designed for <span class="serif-accent italic">every step</span> of care.</h2>
          <p class="section-desc">
            Whether you are seeking personal healing, practicing classical homeopathy, or championing holistic health, NeoHomeo is crafted for you.
          </p>
        </div>

        <div class="audiences-grid">
          <!-- Card 1: For Patients -->
          <div class="audience-card patient-card" id="patients">
            <div class="audience-role-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span>For Patients</span>
            </div>

            <h3 class="audience-title">Find trusted care, organised in one calm place.</h3>
            
            <p class="audience-desc">
              Connect with verified homeopathic physicians, consult from home with ease, and keep your health notes, past remedies, and follow-ups in a private care vault.
            </p>

            <ul class="audience-features-list">
              <li>
                <span class="feature-check-icon">✓</span>
                <span>Verified homeopathic doctors with transparent credentials</span>
              </li>
              <li>
                <span class="feature-check-icon">✓</span>
                <span>Pre-consultation symptom journal for deeper consultations</span>
              </li>
              <li>
                <span class="feature-check-icon">✓</span>
                <span>Private, encrypted lifelong health & posology record vault</span>
              </li>
            </ul>

            <button type="button" class="btn btn-chartreuse trigger-waitlist-btn" data-role="patient" id="join-as-patient-btn">
              <span>Join as a Patient</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M5 12h14"/>
                <path d="m12 5 7 7-7 7"/>
              </svg>
            </button>
          </div>

          <!-- Card 2: For Doctors -->
          <div class="audience-card doctor-card" id="doctors">
            <div class="audience-role-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/>
                <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/>
                <circle cx="20" cy="10" r="2"/>
              </svg>
              <span>For Doctors</span>
            </div>

            <h3 class="audience-title">Build your digital presence & streamline intake.</h3>
            
            <p class="audience-desc">
              Receive structured patient dossiers before appointments, focus on meaningful case-taking, and manage ongoing follow-ups with less administrative friction.
            </p>

            <ul class="audience-features-list">
              <li>
                <span class="feature-check-icon">✓</span>
                <span>Verified practitioner registry & council-endorsed profile</span>
              </li>
              <li>
                <span class="feature-check-icon">✓</span>
                <span>Structured pre-consultation constitutional questionnaires</span>
              </li>
              <li>
                <span class="feature-check-icon">✓</span>
                <span>Seamless follow-up scheduling & patient adherence tools</span>
              </li>
            </ul>

            <button type="button" class="btn btn-outline-lavender trigger-waitlist-btn" data-role="doctor" id="join-as-doctor-btn" style="border-color: var(--c-lavender-dark);">
              <span>Join as a Doctor</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M5 12h14"/>
                <path d="m12 5 7 7-7 7"/>
              </svg>
            </button>
          </div>

          <!-- Card 3: For Supporters -->
          <div class="audience-card supporter-card" id="supporters">
            <div class="audience-role-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <span>For Supporters</span>
            </div>

            <h3 class="audience-title">Be part of a connected homeopathic ecosystem.</h3>
            
            <p class="audience-desc">
              Follow our product roadmap, participate in private closed-beta feedback, and support the modernization of patient-centered holistic healthcare.
            </p>

            <ul class="audience-features-list">
              <li>
                <span class="feature-check-icon">✓</span>
                <span>Exclusive early-look product demos & feature previews</span>
              </li>
              <li>
                <span class="feature-check-icon">✓</span>
                <span>Invitations to community design & advisory roundtables</span>
              </li>
              <li>
                <span class="feature-check-icon">✓</span>
                <span>Direct influence on patient and practitioner tools</span>
              </li>
            </ul>

            <button type="button" class="btn btn-outline-lavender trigger-waitlist-btn" data-role="supporter" id="join-as-supporter-btn">
              <span>Join the Community</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M5 12h14"/>
                <path d="m12 5 7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  `;
}
