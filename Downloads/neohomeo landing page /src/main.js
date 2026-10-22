// NeoHomeo Main Application Entrypoint & Page-Level Router
import './style.css';
import { renderNavbar } from './components/navbar.js';
import { renderHero, initHeroInteractions } from './components/hero.js';
import { renderCareFlow } from './components/careFlow.js';
import { renderVisionCompanion, initVisionTabs } from './components/visionCompanion.js';
import { renderHowItWorks } from './components/howItWorks.js';
import { renderAudiences } from './components/audiences.js';
import { renderPhilosophy } from './components/philosophy.js';
import { renderWaitlistSection, initWaitlistForm, showToast } from './components/waitlistForm.js';
import { renderFAQ, initFAQInteractions } from './components/faq.js';
import { renderDisclaimer } from './components/disclaimer.js';
import { renderFooter } from './components/footer.js';
import { renderLegalModals, initLegalModals } from './components/legalModals.js';
import { renderAdminPage, initAdminPage } from './pages/adminPage.js';

const app = document.querySelector('#app');

// Clean Client-Side Router
export function navigateTo(url) {
  if (window.location.pathname !== url) {
    history.pushState(null, '', url);
  }
  renderCurrentRoute();
}

function renderCurrentRoute() {
  if (!app) return;

  const path = window.location.pathname;
  const hash = window.location.hash;

  // Standalone Full-Page Admin Application at /admin
  if (path === '/admin' || path === '/admin/' || hash === '#admin') {
    renderAdminRoute();
    return;
  }

  // Standalone Public Landing Page at / or /doctors, /patients, etc.
  renderPublicRoute(path, hash);
}

// 1. Render Dedicated Admin Page (Completely independent of landing page)
function renderAdminRoute() {
  document.title = 'NeoHomeo Admin Dashboard — Waitlist Registry';
  // Public content is NEVER in the DOM when on /admin
  app.innerHTML = renderAdminPage();
  initAdminPage(navigateTo);
}

// 2. Render Public Landing Page
function renderPublicRoute(path, hash) {
  document.title = 'NeoHomeo — The Next Chapter of Connected Homeopathic Care';

  app.innerHTML = `
    <!-- Top Navigation -->
    ${renderNavbar()}

    <!-- Main Public Landing Page Content -->
    <main id="main-content">
      ${renderHero()}
      ${renderCareFlow()}
      ${renderVisionCompanion()}
      ${renderHowItWorks()}
      ${renderAudiences()}
      ${renderPhilosophy()}
      ${renderWaitlistSection()}
      ${renderFAQ()}
      ${renderDisclaimer()}
    </main>

    <!-- Footer -->
    ${renderFooter()}

    <!-- Legal & Policy Modals (Contained within public site) -->
    ${renderLegalModals()}
  `;

  // Initialize Public Site Interactions
  initHeroInteractions();
  initVisionTabs();
  initWaitlistForm();
  initFAQInteractions();
  initLegalModals();
  initNavigationInteractions();
  initNewsletterForm();
  initPublicNavLinks();

  // Handle route deep-linking
  if (path === '/doctors' || path === '/doctors/' || hash === '#doctors') {
    setTimeout(() => {
      const el = document.getElementById('doctors');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      if (window.setWaitlistRole) window.setWaitlistRole('doctor');
    }, 120);
  } else if (path === '/patients' || path === '/patients/' || hash === '#patients') {
    setTimeout(() => {
      const el = document.getElementById('patients');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      if (window.setWaitlistRole) window.setWaitlistRole('patient');
    }, 120);
  } else if (hash && hash !== '#') {
    setTimeout(() => {
      const target = document.querySelector(hash);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }, 120);
  }
}

// Public Navigation Links Handler
function initPublicNavLinks() {
  // Footer Admin Portal link
  const footerAdminBtn = document.getElementById('footer-admin-portal-btn');
  if (footerAdminBtn) {
    footerAdminBtn.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('/admin');
    });
  }

  // Intercept anchor and internal links
  document.querySelectorAll('a[href^="/"], a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href) return;

      if (href === '/admin' || href === '/admin/') {
        e.preventDefault();
        navigateTo('/admin');
        return;
      }

      if (href === '/doctors' || href === '#doctors') {
        e.preventDefault();
        try {
          history.pushState(null, '', '/doctors');
        } catch (_) {}
        const doctorCard = document.getElementById('doctors');
        if (doctorCard) doctorCard.scrollIntoView({ behavior: 'smooth' });
        return;
      }

      if (href === '/patients' || href === '#patients') {
        e.preventDefault();
        try {
          history.pushState(null, '', '/patients');
        } catch (_) {}
        const patientCard = document.getElementById('patients');
        if (patientCard) patientCard.scrollIntoView({ behavior: 'smooth' });
        return;
      }

      if (href.startsWith('#') && href.length > 1) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
          try {
            history.pushState(null, '', href);
          } catch (_) {}
        }
      }
    });
  });
}

// Mobile drawer & scroll styling for public site
function initNavigationInteractions() {
  const toggleBtn = document.getElementById('mobile-toggle-btn');
  const drawer = document.getElementById('mobile-drawer');
  const nav = document.getElementById('site-nav');

  if (toggleBtn && drawer) {
    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      drawer.classList.toggle('open');
      const isOpen = drawer.classList.contains('open');
      toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close when clicking any link or button inside drawer
    drawer.querySelectorAll('a, button').forEach(item => {
      item.addEventListener('click', () => {
        drawer.classList.remove('open');
        toggleBtn.setAttribute('aria-expanded', 'false');
      });
    });

    // Close when clicking outside drawer
    document.addEventListener('click', (e) => {
      if (drawer.classList.contains('open') && !drawer.contains(e.target) && !toggleBtn.contains(e.target)) {
        drawer.classList.remove('open');
        toggleBtn.setAttribute('aria-expanded', 'false');
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('open')) {
        drawer.classList.remove('open');
        toggleBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  window.addEventListener('scroll', () => {
    if (!nav) return;
    if (window.scrollY > 20) {
      nav.style.boxShadow = '0 4px 20px rgba(88, 63, 126, 0.08)';
    } else {
      nav.style.boxShadow = 'none';
    }
  });
}

// Newsletter subscription in footer
function initNewsletterForm() {
  const form = document.getElementById('footer-newsletter-form');
  const input = document.getElementById('newsletter-email');

  if (form && input) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = input.value.trim();
      if (val) {
        showToast('Subscribed to NeoHomeo updates!');
        input.value = '';
      }
    });
  }
}

// Browser History Listeners (Back and Forward buttons)
window.addEventListener('popstate', () => {
  renderCurrentRoute();
});

window.addEventListener('hashchange', () => {
  renderCurrentRoute();
});

// App Entrypoint
document.addEventListener('DOMContentLoaded', renderCurrentRoute);
if (document.readyState === 'interactive' || document.readyState === 'complete') {
  renderCurrentRoute();
}
