// How It Works Component — Restored to Exact Visual & Content Reference
export function renderHowItWorks() {
  return `
    <section class="section-spacer how-it-works-section" id="how-it-works">
      <div class="container">
        <div class="section-header text-center">
          <div class="eyebrow-pill">
            <span class="eyebrow-dot chartreuse"></span>
            <span>THE PROCESS</span>
          </div>
          <h2 class="section-title">How NeoHomeo works</h2>
          <p class="section-desc">
            Four steps from first message to ongoing care.
          </p>
        </div>

        <div class="how-steps-grid four-equal-cards">
          <!-- Step 1: Teal -->
          <div class="step-card process-card">
            <div class="process-step-badge badge-teal">
              <span class="badge-dot dot-teal"></span>
              <span>01 — STEP 1</span>
            </div>
            <h3 class="step-title">Complete AI assessment</h3>
            <p class="step-desc">
              Dr. Neo gathers symptoms, lifestyle, emotions, and triggers in a warm guided conversation.
            </p>
          </div>

          <!-- Step 2: Blue -->
          <div class="step-card process-card">
            <div class="process-step-badge badge-blue">
              <span class="badge-dot dot-blue"></span>
              <span>02 — STEP 2</span>
            </div>
            <h3 class="step-title">Get matched with a doctor</h3>
            <p class="step-desc">
              AI weighs speciality, language, and availability so the fit feels completely natural.
            </p>
          </div>

          <!-- Step 3: Purple -->
          <div class="step-card process-card">
            <div class="process-step-badge badge-purple">
              <span class="badge-dot dot-purple"></span>
              <span>03 — STEP 3</span>
            </div>
            <h3 class="step-title">Online consultation</h3>
            <p class="step-desc">
              Secure video or audio visit with structured notes shared to your dashboard.
            </p>
          </div>

          <!-- Step 4: Green -->
          <div class="step-card process-card">
            <div class="process-step-badge badge-green">
              <span class="badge-dot dot-green"></span>
              <span>04 — STEP 4</span>
            </div>
            <h3 class="step-title">Start your healing journey</h3>
            <p class="step-desc">
              Prescriptions, medicine tracking, and follow-up assessments all in one calm place.
            </p>
          </div>
        </div>

        <!-- Development Status Notice -->
        <div class="process-dev-notice">
          <span>* Intended platform experience. Features represent upcoming capabilities currently in active development.</span>
        </div>
      </div>
    </section>
  `;
}
