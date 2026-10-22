// Care Journey & Interactive Vision Showcase
export function renderVisionCompanion() {
  return `
    <section class="section-spacer care-journey-section" id="care-journey">
      <div class="container">
        <div class="vision-layout">
          <!-- Left: Narrative & Tab Selectors -->
          <div class="vision-left">
            <div class="eyebrow-pill">
              <span class="eyebrow-dot chartreuse"></span>
              <span>A More Connected Experience</span>
            </div>

            <h2 class="section-title">
              Homeopathic <span class="serif-accent italic">care</span> journey.
            </h2>

            <div class="care-journey-narrative-block">
              <p class="care-journey-intro-p">
                NeoHomeo is being built to bring patients and homeopathic doctors together in a simpler, more organised, and more meaningful way.
              </p>

              <!-- Compact Supporting Visual per Requirement 3 -->
              <div class="care-journey-visual-wrap">
                <div class="care-journey-img-frame">
                  <img 
                    src="/care-journey-doctors.jpg" 
                    alt="NeoHomeo Verified Homeopathic Doctors" 
                    class="care-journey-doctor-thumb" 
                    width="145" 
                    height="145"
                    loading="lazy"
                  />
                </div>
                <p class="care-journey-brand-statement">
                  For Every Health Concern, One Platform — <span class="brand-accent-text">NeoHomeo.</span>
                </p>
              </div>
            </div>

            <div class="vision-tabs" role="tablist" aria-label="Feature Tabs">
              <!-- Tab 1 -->
              <button type="button" class="vision-tab-btn active" data-tab="intake" role="tab" aria-selected="true">
                <span class="tab-number">01</span>
                <div class="tab-text">
                  <h4>Structured Pre-Consultation Intake</h4>
                  <p>Structure your symptom timeline, modalities, and past treatments before consultation so your doctor arrives prepared.</p>
                </div>
              </button>

              <!-- Tab 2 -->
              <button type="button" class="vision-tab-btn" data-tab="vault" role="tab" aria-selected="false">
                <span class="tab-number">02</span>
                <div class="tab-text">
                  <h4>Encrypted Lifelong Care Vault</h4>
                  <p>Store remedy prescriptions, constitutional posology directions, and health records in a private, patient-owned space.</p>
                </div>
              </button>

              <!-- Tab 3 -->
              <button type="button" class="vision-tab-btn" data-tab="progress" role="tab" aria-selected="false">
                <span class="tab-number">03</span>
                <div class="tab-text">
                  <h4>Constitutional Progress Tracking</h4>
                  <p>Observe gradual systemic improvements over weeks and months with gentle check-in prompts tailored to homeopathy.</p>
                </div>
              </button>
            </div>
          </div>

          <!-- Right: Interactive Dynamic Mockup Screen -->
          <div class="vision-right">
            <div class="vision-screen-mockup">
              <div class="screen-chrome">
                <div class="chrome-dots">
                  <div class="chrome-dot"></div>
                  <div class="chrome-dot"></div>
                  <div class="chrome-dot"></div>
                </div>
                <div class="chrome-url-bar" id="mockup-url-bar">
                  app.neohomeo.org/consultation/intake
                </div>
                <div style="font-size: 0.72rem; color: #117A65; font-weight: 700;">● Verified TLS</div>
              </div>

              <div class="screen-body" id="mockup-screen-content">
                <!-- Tab 1 Intake Content Default -->
                <div class="mockup-panel">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
                    <div>
                      <span style="font-size: 0.75rem; font-weight: 700; color: var(--c-lavender-dark); text-transform: uppercase;">Pre-Consultation Dossier</span>
                      <h4 style="font-size: 1.2rem; font-weight: 700; color: var(--c-near-black);">Constitutional Intake Questionnaire</h4>
                    </div>
                    <span style="background: var(--c-chartreuse); color: #1A1A1A; font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.65rem; border-radius: var(--radius-pill);">Step 3 of 4</span>
                  </div>

                  <div style="background: var(--c-lavender-soft); border-radius: var(--radius-md); padding: 1.2rem; margin-bottom: 1rem; border: 1px solid var(--c-lavender-border);">
                    <div style="font-size: 0.85rem; font-weight: 700; color: var(--c-near-black); margin-bottom: 0.4rem;">Primary Health Concerns</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                      <span style="background: white; border: 1px solid var(--c-lavender); padding: 0.25rem 0.65rem; border-radius: var(--radius-pill); font-size: 0.8rem; font-weight: 600;">Chronic Migraine</span>
                      <span style="background: white; border: 1px solid var(--c-lavender); padding: 0.25rem 0.65rem; border-radius: var(--radius-pill); font-size: 0.8rem; font-weight: 600;">Digestive Bloating</span>
                      <span style="background: white; border: 1px solid var(--c-lavender); padding: 0.25rem 0.65rem; border-radius: var(--radius-pill); font-size: 0.8rem; font-weight: 600;">Sleep Irregularity</span>
                    </div>
                  </div>

                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; margin-bottom: 1rem;">
                    <div style="background: white; border: 1px solid rgba(26,26,26,0.08); border-radius: var(--radius-md); padding: 1rem;">
                      <div style="font-size: 0.74rem; font-weight: 700; color: var(--c-text-muted); text-transform: uppercase;">Aggravating Modalities</div>
                      <div style="font-size: 0.88rem; font-weight: 600; color: var(--c-near-black); margin-top: 4px;">Worse in evening light & enclosed rooms</div>
                    </div>
                    <div style="background: white; border: 1px solid rgba(26,26,26,0.08); border-radius: var(--radius-md); padding: 1rem;">
                      <div style="font-size: 0.74rem; font-weight: 700; color: var(--c-text-muted); text-transform: uppercase;">Ameliorating Modalities</div>
                      <div style="font-size: 0.88rem; font-weight: 600; color: var(--c-near-black); margin-top: 4px;">Relief with gentle motion in cool fresh air</div>
                    </div>
                  </div>

                  <div style="display: flex; align-items: center; justify-content: space-between; background: #FAF7FD; padding: 0.85rem 1rem; border-radius: var(--radius-md); font-size: 0.84rem;">
                    <span style="color: var(--c-text-muted);">Shared with Dr. Ananya Sharma 24h prior to consultation</span>
                    <span style="color: #117A65; font-weight: 700;">✓ Synced to Patient File</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

// Function to handle interactive tab switching for the Care Journey showcase
export function initVisionTabs() {
  const tabBtns = document.querySelectorAll('.vision-tab-btn');
  const screenContent = document.getElementById('mockup-screen-content');
  const urlBar = document.getElementById('mockup-url-bar');

  if (!tabBtns.length || !screenContent || !urlBar) return;

  const tabData = {
    intake: {
      url: 'app.neohomeo.org/consultation/intake',
      html: `
        <div class="mockup-panel">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
            <div>
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--c-lavender-dark); text-transform: uppercase;">Pre-Consultation Dossier</span>
              <h4 style="font-size: 1.2rem; font-weight: 700; color: var(--c-near-black);">Constitutional Intake Questionnaire</h4>
            </div>
            <span style="background: var(--c-chartreuse); color: #1A1A1A; font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.65rem; border-radius: var(--radius-pill);">Step 3 of 4</span>
          </div>

          <div style="background: var(--c-lavender-soft); border-radius: var(--radius-md); padding: 1.2rem; margin-bottom: 1rem; border: 1px solid var(--c-lavender-border);">
            <div style="font-size: 0.85rem; font-weight: 700; color: var(--c-near-black); margin-bottom: 0.4rem;">Primary Health Concerns</div>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
              <span style="background: white; border: 1px solid var(--c-lavender); padding: 0.25rem 0.65rem; border-radius: var(--radius-pill); font-size: 0.8rem; font-weight: 600;">Chronic Migraine</span>
              <span style="background: white; border: 1px solid var(--c-lavender); padding: 0.25rem 0.65rem; border-radius: var(--radius-pill); font-size: 0.8rem; font-weight: 600;">Digestive Bloating</span>
              <span style="background: white; border: 1px solid var(--c-lavender); padding: 0.25rem 0.65rem; border-radius: var(--radius-pill); font-size: 0.8rem; font-weight: 600;">Sleep Irregularity</span>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; margin-bottom: 1rem;">
            <div style="background: white; border: 1px solid rgba(26,26,26,0.08); border-radius: var(--radius-md); padding: 1rem;">
              <div style="font-size: 0.74rem; font-weight: 700; color: var(--c-text-muted); text-transform: uppercase;">Aggravating Modalities</div>
              <div style="font-size: 0.88rem; font-weight: 600; color: var(--c-near-black); margin-top: 4px;">Worse in evening light & enclosed rooms</div>
            </div>
            <div style="background: white; border: 1px solid rgba(26,26,26,0.08); border-radius: var(--radius-md); padding: 1rem;">
              <div style="font-size: 0.74rem; font-weight: 700; color: var(--c-text-muted); text-transform: uppercase;">Ameliorating Modalities</div>
              <div style="font-size: 0.88rem; font-weight: 600; color: var(--c-near-black); margin-top: 4px;">Relief with gentle motion in cool fresh air</div>
            </div>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; background: #FAF7FD; padding: 0.85rem 1rem; border-radius: var(--radius-md); font-size: 0.84rem;">
            <span style="color: var(--c-text-muted);">Shared with Dr. Ananya Sharma 24h prior to consultation</span>
            <span style="color: #117A65; font-weight: 700;">✓ Synced to Patient File</span>
          </div>
        </div>
      `
    },
    vault: {
      url: 'app.neohomeo.org/records/prescriptions',
      html: `
        <div class="mockup-panel">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
            <div>
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--c-lavender-dark); text-transform: uppercase;">Personal Health Records</span>
              <h4 style="font-size: 1.2rem; font-weight: 700; color: var(--c-near-black);">Encrypted Care & Remedy Vault</h4>
            </div>
            <span style="background: var(--c-lavender-subtle); color: var(--c-lavender-dark); font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.65rem; border-radius: var(--radius-pill);">Client-Side Encrypted</span>
          </div>

          <div style="border: 1px solid var(--c-lavender-border); border-radius: var(--radius-md); padding: 1.1rem; background: white; margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--c-text-muted); margin-bottom: 0.35rem;">
              <span>ACTIVE POSOLOGY PLAN · PRESCRIBED 10 OCT 2026</span>
              <span style="color: #117A65; font-weight: 700;">Active Course</span>
            </div>
            <div style="font-size: 1.05rem; font-weight: 700; color: var(--c-near-black);">Natrum Muriaticum 200CH</div>
            <div style="font-size: 0.85rem; color: var(--c-text-muted); margin-top: 4px;">Single dose in water once weekly, morning on empty stomach. Avoid mint and camphor 30 min before/after.</div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem; margin-bottom: 1rem;">
            <div style="background: var(--c-lavender-soft); border-radius: var(--radius-md); padding: 1rem; border: 1px solid var(--c-lavender-border);">
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--c-lavender-dark);">CONSULTATION TRANSCRIPTS</div>
              <div style="font-size: 0.95rem; font-weight: 700; color: var(--c-near-black); margin-top: 3px;">3 Case Records</div>
              <div style="font-size: 0.78rem; color: var(--c-text-muted);">Includes doctor case-taking synthesis</div>
            </div>
            <div style="background: var(--c-lavender-soft); border-radius: var(--radius-md); padding: 1rem; border: 1px solid var(--c-lavender-border);">
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--c-lavender-dark);">DIAGNOSTIC DOCUMENTS</div>
              <div style="font-size: 0.95rem; font-weight: 700; color: var(--c-near-black); margin-top: 3px;">5 External Reports</div>
              <div style="font-size: 0.78rem; color: var(--c-text-muted);">Bloodwork & allergy panels securely stored</div>
            </div>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; background: #FAF7FD; padding: 0.85rem 1rem; border-radius: var(--radius-md); font-size: 0.84rem;">
            <span style="color: var(--c-text-muted);">You control sharing permissions at all times.</span>
            <span style="color: var(--c-lavender-dark); font-weight: 700;">Export Vault PDF ↗</span>
          </div>
        </div>
      `
    },
    progress: {
      url: 'app.neohomeo.org/progress/tracker',
      html: `
        <div class="mockup-panel">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
            <div>
              <span style="font-size: 0.75rem; font-weight: 700; color: var(--c-lavender-dark); text-transform: uppercase;">Longitudinal Wellbeing</span>
              <h4 style="font-size: 1.2rem; font-weight: 700; color: var(--c-near-black);">Constitutional Progress Tracker</h4>
            </div>
            <span style="background: var(--c-chartreuse-subtle); color: #557800; font-size: 0.75rem; font-weight: 700; padding: 0.25rem 0.65rem; border-radius: var(--radius-pill);">Week 6 Review</span>
          </div>

          <div style="background: white; border: 1px solid var(--c-lavender-border); border-radius: var(--radius-md); padding: 1.2rem; margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span style="font-size: 0.88rem; font-weight: 700; color: var(--c-near-black);">Headache Frequency & Intensity</span>
              <span style="font-size: 0.82rem; font-weight: 700; color: #117A65;">65% Reduction</span>
            </div>
            <div style="background: var(--c-lavender-soft); height: 8px; border-radius: var(--radius-pill); overflow: hidden;">
              <div style="background: var(--c-chartreuse); width: 65%; height: 100%;"></div>
            </div>
            <div style="font-size: 0.78rem; color: var(--c-text-muted); margin-top: 0.5rem;">Last recorded episode 14 days ago (prior frequency was every 3 days).</div>
          </div>

          <div style="background: white; border: 1px solid var(--c-lavender-border); border-radius: var(--radius-md); padding: 1.2rem; margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span style="font-size: 0.88rem; font-weight: 700; color: var(--c-near-black);">Energy & Sleep Quality</span>
              <span style="font-size: 0.82rem; font-weight: 700; color: var(--c-lavender-dark);">Steady Improvement</span>
            </div>
            <div style="background: var(--c-lavender-soft); height: 8px; border-radius: var(--radius-pill); overflow: hidden;">
              <div style="background: var(--c-lavender-dark); width: 80%; height: 100%;"></div>
            </div>
            <div style="font-size: 0.78rem; color: var(--c-text-muted); margin-top: 0.5rem;">Patient notes calmer evening state and deeper REM cycles.</div>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; background: #FAF7FD; padding: 0.85rem 1rem; border-radius: var(--radius-md); font-size: 0.84rem;">
            <span style="color: var(--c-text-muted);">Upcoming Follow-up with Dr. Sharma</span>
            <span style="color: #117A65; font-weight: 700;">Scheduled for Nov 14</span>
          </div>
        </div>
      `
    }
  };

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      const tabId = btn.getAttribute('data-tab');
      if (tabData[tabId]) {
        urlBar.textContent = tabData[tabId].url;
        screenContent.innerHTML = tabData[tabId].html;
      }
    });
  });
}
