// Medical Disclaimer Banner Component
export function renderDisclaimer() {
  return `
    <section class="disclaimer-section" id="disclaimer">
      <div class="container">
        <div class="disclaimer-box">
          <div class="disclaimer-icon-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
              <line x1="12" x2="12" y1="9" y2="13"/>
              <line x1="12" x2="12.01" y1="17" y2="17"/>
            </svg>
          </div>
          <div class="disclaimer-body">
            <h4>Important Healthcare & Medical Notice</h4>
            <p>
              NeoHomeo is a digital health technology platform currently under active development. NeoHomeo provides communication, intake preparation, and care coordination tools between patients and independently registered, licensed homeopathic practitioners. NeoHomeo is not a hospital, does not directly provide emergency medical treatment, and does not replace emergency room care. If you are experiencing an acute medical emergency or life-threatening situation, please dial your local emergency services (such as 112 / 911 / 999) or visit the nearest emergency facility immediately.
            </p>
          </div>
        </div>
      </div>
    </section>
  `;
}
