// Legal Modals Component (Privacy Policy, Terms of Use, Medical Disclaimer)
export function renderLegalModals() {
  return `
    <div class="modal-backdrop" id="legal-modal-backdrop" aria-hidden="true" role="dialog">
      <div class="modal-sheet" style="max-width: 680px;">
        <button type="button" class="modal-close-btn" id="close-legal-modal-btn" aria-label="Close legal modal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <div id="legal-modal-content" style="font-size: 0.92rem; line-height: 1.65; color: var(--c-near-black);">
          <!-- Dynamic Content -->
        </div>
      </div>
    </div>
  `;
}

export function initLegalModals() {
  const backdrop = document.getElementById('legal-modal-backdrop');
  const closeBtn = document.getElementById('close-legal-modal-btn');
  const content = document.getElementById('legal-modal-content');

  if (!backdrop || !content) return;

  closeBtn?.addEventListener('click', closeModal);
  backdrop?.addEventListener('click', (e) => {
    if (e.target === backdrop) closeModal();
  });

  function openModal(html) {
    content.innerHTML = html;
    backdrop.classList.add('open');
    backdrop.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    backdrop.classList.remove('open');
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  // Privacy Policy Trigger
  document.getElementById('legal-privacy-btn')?.addEventListener('click', () => {
    openModal(`
      <div class="eyebrow-pill" style="margin-bottom: 0.75rem;">
        <span>Privacy & Data Sovereignty</span>
      </div>
      <h3 style="font-family: var(--font-serif); font-size: 1.75rem; margin-bottom: 1rem;">Privacy Policy</h3>
      <p style="color: var(--c-text-muted); margin-bottom: 1rem;"><strong>Effective Date:</strong> October 2026</p>
      <p>At <strong>NeoHomeo</strong>, patient confidentiality is foundational to our healthcare ethics. We believe sensitive health information should never be commercialized.</p>
      <h4 style="margin: 1.25rem 0 0.5rem; font-size: 1.05rem;">1. Data Minimization & Collection</h4>
      <p>During the early access waitlist phase, we collect only your contact information (name, email, city) and optional role-specific details to prepare the platform for clinical launch.</p>
      <h4 style="margin: 1.25rem 0 0.5rem; font-size: 1.05rem;">2. Health Records Protection</h4>
      <p>Consultation records and case notes generated on NeoHomeo are encrypted with modern security architectures. No third-party advertiser or data broker has access to your health history.</p>
      <h4 style="margin: 1.25rem 0 0.5rem; font-size: 1.05rem;">3. Practitioner Verifications</h4>
      <p>Doctor registration numbers are checked solely against recognized state and national homeopathic medical registers to guarantee legitimate credentials.</p>
    `);
  });

  // Terms of Use Trigger
  document.getElementById('legal-terms-btn')?.addEventListener('click', () => {
    openModal(`
      <div class="eyebrow-pill" style="margin-bottom: 0.75rem;">
        <span>Platform Terms</span>
      </div>
      <h3 style="font-family: var(--font-serif); font-size: 1.75rem; margin-bottom: 1rem;">Terms of Use</h3>
      <p style="color: var(--c-text-muted); margin-bottom: 1rem;"><strong>Last Revised:</strong> October 2026</p>
      <h4 style="margin: 1.25rem 0 0.5rem; font-size: 1.05rem;">1. Nature of the Service</h4>
      <p>NeoHomeo is a digital platform connecting patients with independently licensed, registered homeopathic practitioners. NeoHomeo does not directly practice medicine or employ medical practitioners.</p>
      <h4 style="margin: 1.25rem 0 0.5rem; font-size: 1.05rem;">2. Early Access Waitlist</h4>
      <p>Submitting a registration for early access does not create a physician-patient relationship. Early access invitations are granted on a rolling basis based on regional practitioner availability.</p>
      <h4 style="margin: 1.25rem 0 0.5rem; font-size: 1.05rem;">3. Practitioner Responsibilities</h4>
      <p>Practitioners using NeoHomeo warrant that they hold valid, unrestricted licensure in their jurisdiction (e.g. BHMS, MD Hom) and adhere to official clinical guidelines.</p>
    `);
  });

  // Medical Disclaimer Trigger
  document.getElementById('legal-disclaimer-btn')?.addEventListener('click', () => {
    openModal(`
      <div class="eyebrow-pill" style="margin-bottom: 0.75rem;">
        <span>Healthcare Notice</span>
      </div>
      <h3 style="font-family: var(--font-serif); font-size: 1.75rem; margin-bottom: 1rem;">Medical & Regulatory Disclaimer</h3>
      <div style="background: var(--c-tomato-subtle); border: 1px solid var(--c-tomato-border); padding: 1.25rem; border-radius: var(--radius-md); margin-bottom: 1.25rem;">
        <strong style="color: var(--c-tomato);">EMERGENCY NOTICE:</strong> NeoHomeo is not designed for acute emergencies. If you are experiencing a life-threatening symptom or acute medical emergency, contact your nearest emergency services immediately.
      </div>
      <p><strong>1. Complementary Holistic Care:</strong> Homeopathy is a holistic system of individualised medicine. It is intended to be complementary to essential conventional medical care. Never discontinue prescribed medications without consulting your primary attending physician.</p>
      <p style="margin-top: 0.75rem;"><strong>2. Independent Practitioner Judgement:</strong> All diagnostic evaluations and remedy recommendations are made solely by the independent registered homeopath based on their clinical assessment of your case.</p>
    `);
  });

  // Verification Policy Trigger
  document.getElementById('legal-verification-btn')?.addEventListener('click', () => {
    openModal(`
      <div class="eyebrow-pill" style="margin-bottom: 0.75rem;">
        <span>Credential Standards</span>
      </div>
      <h3 style="font-family: var(--font-serif); font-size: 1.75rem; margin-bottom: 1rem;">Practitioner Verification Policy</h3>
      <p>We uphold a strict standard for practitioner eligibility to protect patient safety and clinical integrity.</p>
      <ul style="margin: 1rem 0 1rem 1.25rem; display: flex; flex-direction: column; gap: 0.5rem;">
        <li>Mandatory proof of graduation from a recognized homeopathic university (BHMS or MD Hom).</li>
        <li>Active, unblemished license number with the Central / State Council of Homoeopathy or national equivalent.</li>
        <li>Periodic credential re-validation against official statutory gazettes.</li>
      </ul>
      <p>Unregistered practitioners, unlicensed hobbyists, and unverified commercial clinics are strictly prohibited from practicing on NeoHomeo.</p>
    `);
  });
}
