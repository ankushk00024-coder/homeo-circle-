// FAQ Accordion Component
export function renderFAQ() {
  const faqs = [
    {
      q: 'What is NeoHomeo, and how is it different from a generic directory?',
      a: 'NeoHomeo is a dedicated digital care platform specifically designed for classical and constitutional homeopathy. Unlike simple clinic directories or generic telemedicine apps, NeoHomeo integrates structured pre-consultation intake, encrypted lifelong remedy posology records, and longitudinal progress tracking to support genuine patient-practitioner relationships.'
    },
    {
      q: 'How are doctors verified before joining the platform?',
      a: 'Every practitioner applying to NeoHomeo undergoes mandatory credential checks against national and state homeopathic registers (such as Central Council of Homoeopathy / National Commission for Homoeopathy in India, or equivalent regional medical licensing boards). Only physicians with recognized recognized degrees (BHMS, MD Hom, or equivalent) and active council numbers are verified.'
    },
    {
      q: 'When will early access be available for patients and doctors?',
      a: 'We are rolling out early access in phased cohorts starting in early 2027. Early waitlist members receive prioritized onboarding, direct consultation matching, and exclusive access to preview our care companion tools before the wider public launch.'
    },
    {
      q: 'Is online homeopathic consultation effective for complex or chronic cases?',
      a: 'Yes. Classical homeopathy relies deeply on detailed case analysis, symptom observation, modalities, and constitutional history. Because NeoHomeo prepares a comprehensive patient dossier before the call, practitioners have thorough context, making virtual consultations calm, unhurried, and exceptionally focused.'
    },
    {
      q: 'How is my personal health data and consultation history secured?',
      a: 'Your health data is protected with modern zero-knowledge and end-to-end encryption principles. Only you and your chosen doctor have permission to access your private notes, prescriptions, and health journals. We never sell or share patient data with pharmaceutical companies or advertisers.'
    },
    {
      q: 'Does NeoHomeo provide emergency medical services or immediate acute care?',
      a: 'No. NeoHomeo is designed for scheduled constitutional care, chronic wellness management, and ongoing homeopathic consultation. NeoHomeo does not provide emergency medical services or acute trauma care. If you are facing a medical emergency, you should contact local emergency services immediately.'
    }
  ];

  return `
    <section class="section-spacer" id="faq">
      <div class="container container-narrow">
        <div class="section-header text-center">
          <div class="eyebrow-pill">
            <span class="eyebrow-dot"></span>
            <span>Frequently Asked Questions</span>
          </div>
          <h2 class="section-title">Everything you need to know.</h2>
          <p class="section-desc">
            Learn more about our clinical philosophy, data privacy, and how we are building a more connected future for homeopathic care.
          </p>
        </div>

        <div class="faq-list" role="region" aria-label="FAQ Accordion">
          ${faqs.map((item, idx) => `
            <div class="faq-item ${idx === 0 ? 'active' : ''}">
              <button type="button" class="faq-question-btn" aria-expanded="${idx === 0 ? 'true' : 'false'}">
                <span>${item.q}</span>
                <svg class="faq-icon-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>
              <div class="faq-answer-content">
                <p>${item.a}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `;
}

export function initFAQInteractions() {
  const items = document.querySelectorAll('.faq-item');
  items.forEach(item => {
    const btn = item.querySelector('.faq-question-btn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');
      // Close other items
      items.forEach(i => {
        i.classList.remove('active');
        const b = i.querySelector('.faq-question-btn');
        if (b) b.setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });
}
