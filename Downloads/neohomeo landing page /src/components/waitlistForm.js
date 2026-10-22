// Waitlist Form Component
import { addRegistration } from '../data/store.js';
import confetti from 'canvas-confetti';

export function renderWaitlistSection() {
  return `
    <section class="waitlist-section" id="waitlist">
      <div class="container container-narrow">
        <div class="section-header text-center">
          <div class="eyebrow-pill">
            <span class="eyebrow-dot chartreuse"></span>
            <span>Early Access Waitlist</span>
          </div>
          <h2 class="section-title">Join the <span class="serif-accent italic">future of care.</span></h2>
          <p class="section-desc">
            Reserve your early priority access for our upcoming launch. Be among the first to experience connected homeopathic care.
          </p>
        </div>

        <div class="waitlist-card" id="waitlist-card-inner">
          <!-- Role Switcher -->
          <div class="role-switcher-container" role="tablist" aria-label="Select your role">
            <button type="button" class="role-pill-btn active" data-role="patient" role="tab" aria-selected="true">
              I am a Patient
            </button>
            <button type="button" class="role-pill-btn" data-role="doctor" role="tab" aria-selected="false">
              I am a Doctor
            </button>
            <button type="button" class="role-pill-btn" data-role="supporter" role="tab" aria-selected="false">
              I am a Supporter
            </button>
          </div>

          <!-- Form Body -->
          <form id="waitlist-form" novalidate>
            <input type="hidden" id="form-selected-role" value="patient">

            <div class="waitlist-form-grid">
              <!-- Full Name -->
              <div class="form-group">
                <label for="reg-name" class="form-label">
                  <span>Full Name *</span>
                </label>
                <input type="text" id="reg-name" class="form-input" placeholder="e.g. Dr. Priya Nair or Aarav Sharma" autocomplete="name" required>
              </div>

              <!-- Email Address -->
              <div class="form-group">
                <label for="reg-email" class="form-label">
                  <span>Email Address *</span>
                </label>
                <input type="email" id="reg-email" class="form-input" placeholder="you@domain.com" autocomplete="email" inputmode="email" required>
              </div>

              <!-- City / State / Country -->
              <div class="form-group">
                <label for="reg-city" class="form-label">
                  <span>City & State / Country *</span>
                </label>
                <input type="text" id="reg-city" class="form-input" placeholder="e.g. Mumbai, India or London, UK" autocomplete="address-level2" required>
              </div>

              <!-- Phone (Optional) -->
              <div class="form-group">
                <label for="reg-phone" class="form-label">
                  <span>Phone Number</span>
                  <span class="label-hint">Optional</span>
                </label>
                <input type="tel" id="reg-phone" class="form-input" placeholder="+91 98000 00000" autocomplete="tel" inputmode="tel">
              </div>

              <!-- DYNAMIC ROLE FIELDS -->
              
              <!-- Patient Specific Fields -->
              <div id="patient-fields" class="form-group full-width" style="display: contents;">
                <div class="form-group">
                  <label for="reg-health-interest" class="form-label">
                    <span>Primary Health Focus</span>
                  </label>
                  <select id="reg-health-interest" class="form-select">
                    <option value="Chronic & Constitutional Care">Chronic & Constitutional Care</option>
                    <option value="Digestive & Gut Health">Digestive & Gut Health</option>
                    <option value="Skin, Allergies & Autoimmune">Skin, Allergies & Autoimmune</option>
                    <option value="Pediatric & Child Health">Pediatric & Child Health</option>
                    <option value="Stress, Sleep & Mental Wellbeing">Stress, Sleep & Mental Wellbeing</option>
                    <option value="General Preventative Wellness">General Preventative Wellness</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="reg-consulted-before" class="form-label">
                    <span>Prior Homeopathy Experience</span>
                  </label>
                  <select id="reg-consulted-before" class="form-select">
                    <option value="Yes, regular patient">Yes, I consult homeopaths regularly</option>
                    <option value="Yes, consulted in past">Yes, consulted in the past</option>
                    <option value="No, exploring for first time">No, exploring homeopathy for the first time</option>
                  </select>
                </div>
              </div>

              <!-- Doctor Specific Fields -->
              <div id="doctor-fields" class="form-group full-width" style="display: none;">
                <div class="waitlist-form-grid" style="width: 100%; grid-column: 1 / -1;">
                  <div class="form-group">
                    <label for="reg-council-num" class="form-label">
                      <span>Council / State Registration No. *</span>
                      <span class="label-hint">For verification</span>
                    </label>
                    <input type="text" id="reg-council-num" class="form-input" placeholder="e.g. MAH-HOM-2019-XXXX">
                  </div>

                  <div class="form-group">
                    <label for="reg-qualification" class="form-label">
                      <span>Highest Qualification *</span>
                    </label>
                    <select id="reg-qualification" class="form-select">
                      <option value="BHMS">BHMS</option>
                      <option value="MD (Hom)">MD (Hom)</option>
                      <option value="DHMS">DHMS</option>
                      <option value="Fellowship / Post-Graduate">Fellowship / Post-Graduate</option>
                      <option value="Other Recognized Credential">Other Recognized Credential</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label for="reg-experience" class="form-label">
                      <span>Years in Clinical Practice</span>
                    </label>
                    <select id="reg-experience" class="form-select">
                      <option value="1-3 years">1-3 years</option>
                      <option value="4-7 years">4-7 years</option>
                      <option value="8-15 years">8-15 years</option>
                      <option value="15+ years">15+ years</option>
                    </select>
                  </div>

                  <div class="form-group">
                    <label for="reg-speciality" class="form-label">
                      <span>Primary Speciality / Focus</span>
                    </label>
                    <input type="text" id="reg-speciality" class="form-input" placeholder="e.g. Pediatrics, Dermatology, Chronic Care">
                  </div>
                </div>
              </div>

              <!-- Supporter Specific Fields -->
              <div id="supporter-fields" class="form-group full-width" style="display: none;">
                <div class="form-group full-width">
                  <label for="reg-supporter-background" class="form-label">
                    <span>How would you like to contribute or stay involved?</span>
                  </label>
                  <input type="text" id="reg-supporter-background" class="form-input" placeholder="e.g. Health Advocate, Researcher, Tech/Product feedback, Investor">
                </div>
              </div>

              <!-- Consent & Medical Agreement Checkbox -->
              <div class="form-group full-width" style="margin-top: 0.5rem;">
                <label class="form-checkbox-label">
                  <input type="checkbox" id="reg-consent" required checked>
                  <span>
                    I agree to receive early access updates and acknowledge that NeoHomeo is a digital platform connecting individuals with independent, registered practitioners.
                  </span>
                </label>
              </div>

              <!-- Error Message Placeholder -->
              <div class="form-group full-width" id="form-error-msg" style="display: none; color: var(--c-tomato); font-size: 0.88rem; font-weight: 600;">
              </div>

              <!-- Submit Button -->
              <div class="form-group full-width" style="margin-top: 0.5rem;">
                <button type="submit" class="btn btn-lg btn-chartreuse" style="width: 100%; justify-content: center;" id="form-submit-btn">
                  <span>Join the Early Access Waitlist</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M5 12h14"/>
                    <path d="m12 5 7 7-7 7"/>
                  </svg>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  `;
}

// Function to initialize waitlist form logic & role switching
export function initWaitlistForm() {
  const form = document.getElementById('waitlist-form');
  const cardInner = document.getElementById('waitlist-card-inner');
  const roleBtns = document.querySelectorAll('.role-pill-btn');
  const selectedRoleInput = document.getElementById('form-selected-role');
  const patientFields = document.getElementById('patient-fields');
  const doctorFields = document.getElementById('doctor-fields');
  const supporterFields = document.getElementById('supporter-fields');
  const errorMsg = document.getElementById('form-error-msg');

  if (!form || !cardInner) return;

  // Role pill switcher handler
  roleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const role = btn.getAttribute('data-role');
      setFormRole(role);
    });
  });

  function setFormRole(role) {
    roleBtns.forEach(b => {
      const isMatch = b.getAttribute('data-role') === role;
      b.classList.toggle('active', isMatch);
      b.setAttribute('aria-selected', isMatch ? 'true' : 'false');
    });

    if (selectedRoleInput) selectedRoleInput.value = role;

    if (patientFields && doctorFields && supporterFields) {
      if (role === 'patient') {
        patientFields.style.display = 'contents';
        doctorFields.style.display = 'none';
        supporterFields.style.display = 'none';
      } else if (role === 'doctor') {
        patientFields.style.display = 'none';
        doctorFields.style.display = 'block';
        supporterFields.style.display = 'none';
      } else {
        patientFields.style.display = 'none';
        doctorFields.style.display = 'none';
        supporterFields.style.display = 'block';
      }
    }
  }

  // Allow external triggers (e.g. from hero or navbar or audience buttons)
  window.setWaitlistRole = function(role) {
    setFormRole(role);
    const section = document.getElementById('waitlist');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Attach click to all trigger buttons across the page
  document.querySelectorAll('.trigger-waitlist-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const role = btn.getAttribute('data-role') || 'patient';
      window.setWaitlistRole(role);
    });
  });

  // Form submission handler
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (errorMsg) errorMsg.style.display = 'none';

    const role = selectedRoleInput ? selectedRoleInput.value : 'patient';
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const city = document.getElementById('reg-city').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const consent = document.getElementById('reg-consent').checked;

    if (!name || !email || !city) {
      showError('Please fill in your name, email address, and location.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showError('Please enter a valid email address.');
      return;
    }

    if (!consent) {
      showError('Please agree to the early access consent terms.');
      return;
    }

    const payload = {
      role,
      name,
      email,
      city,
      phone
    };

    if (role === 'doctor') {
      const council = document.getElementById('reg-council-num').value.trim();
      const qual = document.getElementById('reg-qualification').value;
      const exp = document.getElementById('reg-experience').value;
      const spec = document.getElementById('reg-speciality').value.trim();

      if (!council) {
        showError('Doctors: Please provide your state or national council registration number.');
        return;
      }

      payload.councilNumber = council;
      payload.qualification = qual;
      payload.yearsExperience = exp;
      payload.speciality = spec || 'General Homeopathic Practice';
    } else if (role === 'patient') {
      payload.healthInterests = document.getElementById('reg-health-interest').value;
      payload.consultedBefore = document.getElementById('reg-consulted-before').value;
    } else {
      payload.supporterBackground = document.getElementById('reg-supporter-background').value.trim() || 'Holistic Health Supporter';
    }

    // Save to LocalStorage Data Store
    const saved = addRegistration(payload);

    // Subtle Confetti celebration
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#C8B3E8', '#D4FF3F', '#E34234', '#FFFFFF']
      });
    } catch (err) {
      console.warn('Confetti effect unavailable:', err);
    }

    // Render Success State
    cardInner.innerHTML = `
      <div class="waitlist-success-box">
        <div class="success-badge-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>

        <h3 style="font-family: var(--font-serif); font-size: 2rem; color: var(--c-near-black); margin-bottom: 0.5rem;">
          You are on the list, ${escapeHtml(name)}!
        </h3>

        <p style="font-size: 1.05rem; color: var(--c-text-muted); max-width: 460px; margin: 0 auto;">
          Thank you for joining NeoHomeo early. We have reserved your priority cohort invitation.
        </p>

        <div class="waitlist-ticket-pill">
          <span>Priority Pass:</span>
          <strong>${saved.id}</strong>
        </div>

        <div style="background: var(--c-lavender-soft); border-radius: var(--radius-md); padding: 1.25rem; max-width: 480px; margin: 1.5rem auto; text-align: left; font-size: 0.88rem; line-height: 1.5;">
          ${role === 'doctor' 
            ? '<strong>Practitioner Next Steps:</strong> Our credentialing team will verify your council registration (' + escapeHtml(payload.councilNumber) + ') prior to launch and send your clinical dashboard invite.' 
            : '<strong>What to Expect:</strong> We will notify you at <strong>' + escapeHtml(email) + '</strong> when early consultation matching opens in your region.'}
        </div>

        <div style="display: flex; justify-content: center; gap: 0.85rem; margin-top: 1.75rem; flex-wrap: wrap;">
          <button type="button" class="btn btn-chartreuse" id="copy-share-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
            </svg>
            <span>Copy Early Invite Link</span>
          </button>
          
          <button type="button" class="btn btn-outline-lavender" id="reset-form-btn">
            <span>Register Another Person</span>
          </button>
        </div>
      </div>
    `;

    // Handle copy share link
    const copyBtn = document.getElementById('copy-share-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const shareUrl = window.location.origin + window.location.pathname + '?ref=' + saved.id;
        navigator.clipboard.writeText(shareUrl).then(() => {
          showToast('Early invite link copied to clipboard!');
        }).catch(() => {
          showToast('Invite code: ' + saved.id);
        });
      });
    }

    // Reset button
    const resetBtn = document.getElementById('reset-form-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        window.location.reload();
      });
    }
  });

  function showError(msg) {
    if (errorMsg) {
      errorMsg.textContent = msg;
      errorMsg.style.display = 'block';
    }
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function showToast(message) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast-item';
  toast.innerHTML = `
    <span style="color: var(--c-chartreuse);">●</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3400);
}
