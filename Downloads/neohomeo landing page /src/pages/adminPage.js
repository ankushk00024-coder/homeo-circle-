// NeoHomeo Standalone Full-Page Admin Dashboard
import {
  getRegistrations,
  getMetrics,
  exportToCSV,
  updateRegistrationStatus,
  deleteRegistration,
  resetToSeedData,
  isAdminAuthenticated,
  setAdminAuthenticated,
  ADMIN_PASSWORD
} from '../data/store.js';
import { showToast } from '../components/waitlistForm.js';

export function renderAdminPage() {
  if (!isAdminAuthenticated()) {
    return renderLoginView();
  }
  return renderDashboardView();
}

// 1. Full-Page Login View
function renderLoginView() {
  return `
    <div class="admin-fullscreen-login">
      <div class="admin-login-card">
        <div class="admin-login-brand">
          <svg class="brand-symbol" viewBox="0 0 36 36" fill="none" style="width: 44px; height: 44px; margin: 0 auto 0.75rem;">
            <path d="M18 4C18 4 29 13.5 29 22C29 28.0751 24.0751 33 18 33C11.9249 33 7 28.0751 7 22C7 13.5 18 4 18 4Z" fill="#C8B3E8"/>
            <path d="M18 10C18 10 25.5 17.5 25.5 23.5C25.5 27.6421 22.1421 31 18 31C13.8579 31 10.5 27.6421 10.5 23.5C10.5 17.5 18 10 18 10Z" fill="#D4FF3F"/>
          </svg>
          <h2 style="font-family: var(--font-serif); font-size: 1.85rem; color: var(--c-near-black); margin-bottom: 0.25rem;">
            NeoHomeo
          </h2>
          <span style="font-size: 0.75rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--c-lavender-dark);">
            Staff Admin Portal
          </span>
        </div>

        <p style="font-size: 0.92rem; color: var(--c-text-muted); text-align: center; margin: 1.25rem 0 1.75rem; line-height: 1.5;">
          Please enter your administrative password to access the waitlist registry and review doctor credentials.
        </p>

        <form id="admin-standalone-login-form">
          <div class="form-group" style="text-align: left; margin-bottom: 1.25rem;">
            <label class="form-label" for="admin-standalone-password">
              <span>Security Password</span>
            </label>
            <div style="position: relative;">
              <input 
                type="password" 
                id="admin-standalone-password" 
                class="form-input" 
                placeholder="Enter admin password" 
                required 
                autofocus
                style="padding-right: 2.75rem;"
              />
              <button 
                type="button" 
                id="toggle-password-visibility" 
                style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: var(--c-text-light); padding: 4px;"
                title="Toggle visibility"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
            <div style="margin-top: 0.5rem; font-size: 0.78rem; color: var(--c-lavender-dark); font-weight: 600;">
              Default password: <code style="background: var(--c-lavender-soft); padding: 2px 6px; border-radius: 4px; font-family: monospace;">neohomeo2025</code>
            </div>
          </div>

          <div id="admin-login-error" style="display: none; color: var(--c-tomato); font-size: 0.85rem; font-weight: 600; margin-bottom: 1rem; text-align: left;">
            Incorrect password. Please verify and try again.
          </div>

          <button type="submit" class="btn btn-chartreuse" style="width: 100%; justify-content: center; margin-bottom: 1rem;">
            <span>Unlock Dashboard</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M5 12h14"/>
              <path d="m12 5 7 7-7 7"/>
            </svg>
          </button>

          <div style="text-align: center; margin-top: 1.25rem; padding-top: 1.25rem; border-top: 1px solid rgba(26,26,26,0.06);">
            <a href="/" class="admin-nav-back-link" id="login-back-to-site">
              ← Return to Public Website
            </a>
          </div>
        </form>
      </div>
    </div>
  `;
}

// 2. Full-Page Dashboard View
function renderDashboardView() {
  const metrics = getMetrics();

  return `
    <div class="admin-page-layout">
      <!-- Left Sidebar -->
      <aside class="admin-sidebar" id="admin-sidebar">
        <div>
          <!-- Sidebar Brand -->
          <div class="sidebar-brand-box">
            <div style="display: flex; align-items: center; gap: 0.65rem;">
              <a href="/" class="brand-logo" id="sidebar-logo-link" title="NeoHomeo">
                <svg class="brand-symbol" viewBox="0 0 36 36" fill="none" style="width: 32px; height: 32px;">
                  <path d="M18 4C18 4 29 13.5 29 22C29 28.0751 24.0751 33 18 33C11.9249 33 7 28.0751 7 22C7 13.5 18 4 18 4Z" fill="#C8B3E8"/>
                  <path d="M18 10C18 10 25.5 17.5 25.5 23.5C25.5 27.6421 22.1421 31 18 31C13.8579 31 10.5 27.6421 10.5 23.5C10.5 17.5 18 10 18 10Z" fill="#D4FF3F"/>
                </svg>
                <div class="brand-text">
                  <span class="brand-title" style="font-size: 1.25rem;">NeoHomeo</span>
                  <span class="brand-tagline">Connect. Care. Cure.</span>
                </div>
              </a>
              <div class="sidebar-badge-tag">ADMIN</div>
            </div>

            <!-- Mobile Sidebar Menu Toggle -->
            <button type="button" class="admin-mobile-nav-toggle" id="admin-mobile-nav-toggle" aria-label="Toggle admin navigation" aria-expanded="false">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="4" x2="20" y1="12" y2="12"/>
                <line x1="4" x2="20" y1="6" y2="6"/>
                <line x1="4" x2="20" y1="18" y2="18"/>
              </svg>
            </button>
          </div>

          <div class="admin-sidebar-collapsible" id="admin-sidebar-collapsible">
            <!-- Sidebar Navigation -->
            <nav class="sidebar-nav">
              <div class="sidebar-nav-section-title">Navigation</div>
            <ul class="sidebar-nav-list">
              <li>
                <button type="button" class="sidebar-nav-item active" data-sidebar-role="all">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect width="7" height="9" x="3" y="3" rx="1"/>
                    <rect width="7" height="5" x="14" y="3" rx="1"/>
                    <rect width="7" height="9" x="14" y="12" rx="1"/>
                    <rect width="7" height="5" x="3" y="16" rx="1"/>
                  </svg>
                  <span>Dashboard</span>
                </button>
              </li>
              <li>
                <button type="button" class="sidebar-nav-item" data-sidebar-role="all">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  <span>Waitlist Registrations</span>
                  <span class="sidebar-count-badge" id="sidebar-total-count">${metrics.total}</span>
                </button>
              </li>
              <li>
                <button type="button" class="sidebar-nav-item" data-sidebar-role="patient">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <span>Patients</span>
                  <span class="sidebar-count-badge" id="sidebar-patients-count">${metrics.patients}</span>
                </button>
              </li>
              <li>
                <button type="button" class="sidebar-nav-item" data-sidebar-role="doctor">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/>
                    <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/>
                    <circle cx="20" cy="10" r="2"/>
                  </svg>
                  <span>Doctors</span>
                  <span class="sidebar-count-badge" id="sidebar-doctors-count">${metrics.doctors}</span>
                </button>
              </li>
              <li>
                <button type="button" class="sidebar-nav-item" data-sidebar-role="supporter">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                  </svg>
                  <span>Supporters</span>
                  <span class="sidebar-count-badge" id="sidebar-supporters-count">${metrics.supporters}</span>
                </button>
              </li>
            </ul>
          </nav>
          <!-- Sidebar Bottom Footer -->
          <div class="sidebar-footer">
            <a href="/" class="sidebar-footer-link" id="sidebar-view-site-link">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" x2="21" y1="14" y2="3"/>
              </svg>
              <span>View Public Site</span>
            </a>

            <button type="button" class="sidebar-logout-btn" id="sidebar-logout-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" x2="9" y1="12" y2="12"/>
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      <!-- Main Dashboard Content -->
      <main class="admin-main">
        <!-- Top Header Bar -->
        <div class="admin-page-header">
          <div>
            <h1 class="admin-page-title">Admin Dashboard</h1>
            <p class="admin-page-desc">Manage NeoHomeo waitlist registrations.</p>
          </div>

          <div class="admin-top-actions">
            <button type="button" class="btn btn-chartreuse" id="fullpage-export-csv-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" x2="12" y1="15" y2="3"/>
              </svg>
              <span>Export CSV</span>
            </button>

            <button type="button" class="btn btn-outline-lavender" id="fullpage-reset-demo-btn" title="Reset sample records">
              <span>Reset Demo Data</span>
            </button>
          </div>
        </div>

        <!-- KPI Metrics Summary Cards -->
        <div class="admin-metrics-grid" id="fullpage-metrics-grid">
          <div class="metric-stat-card">
            <div class="metric-stat-title">Total Waitlist</div>
            <div class="metric-stat-value" id="metric-total-val">${metrics.total}</div>
            <div class="metric-stat-sub">Active candidate pool</div>
          </div>

          <div class="metric-stat-card">
            <div class="metric-stat-title">Patients</div>
            <div class="metric-stat-value" id="metric-patients-val">${metrics.patients}</div>
            <div class="metric-stat-sub">${Math.round((metrics.patients / (metrics.total || 1)) * 100)}% of registrations</div>
          </div>

          <div class="metric-stat-card">
            <div class="metric-stat-title">Doctors</div>
            <div class="metric-stat-value" id="metric-doctors-val" style="color: var(--c-lavender-dark);">${metrics.doctors}</div>
            <div class="metric-stat-sub">${metrics.verified} Council Verified</div>
          </div>

          <div class="metric-stat-card">
            <div class="metric-stat-title">Supporters</div>
            <div class="metric-stat-value" id="metric-supporters-val">${metrics.supporters}</div>
            <div class="metric-stat-sub">Advocates & Partners</div>
          </div>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="admin-toolbar-row">
          <div class="admin-search-wrap">
            <svg class="admin-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.3-4.3"/>
            </svg>
            <input 
              type="text" 
              id="fullpage-search-box" 
              class="admin-search-input" 
              placeholder="Search by name, email, city, council number, speciality..."
            />
          </div>

          <div class="admin-filter-tabs">
            <button type="button" class="filter-tab-btn active" data-role-filter="all">All</button>
            <button type="button" class="filter-tab-btn" data-role-filter="patient">Patients</button>
            <button type="button" class="filter-tab-btn" data-role-filter="doctor">Doctors</button>
            <button type="button" class="filter-tab-btn" data-role-filter="supporter">Supporters</button>
          </div>
        </div>

        <!-- Mobile Table Scroll Hint -->
        <div class="admin-table-scroll-hint">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          <span>Scroll table horizontally to view full candidate details & actions</span>
        </div>

        <!-- Registrations Data Table -->
        <div class="admin-table-container">
          <table class="admin-table">
            <thead>
              <tr>
                <th>ID & Date</th>
                <th>Role</th>
                <th>Name & Contact</th>
                <th>Location</th>
                <th>Qualifications / Preferences</th>
                <th>Status</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody id="fullpage-admin-table-body">
              <!-- Dynamically populated -->
            </tbody>
          </table>
        </div>
      </main>
    </div>

    <!-- Candidate Detail Drawer / Modal (Contained inside Admin) -->
    <div class="modal-backdrop" id="fullpage-candidate-detail-modal" aria-hidden="true" style="z-index: 10001;">
      <div class="modal-sheet" style="max-width: 580px;">
        <button type="button" class="modal-close-btn" id="close-fullpage-detail-btn" aria-label="Close dossier">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <div id="fullpage-candidate-detail-content"></div>
      </div>
    </div>
  `;
}

// 3. Initialize Admin Page Logic & Interactions
export function initAdminPage(onNavigate) {
  if (!isAdminAuthenticated()) {
    initLoginInteractions(onNavigate);
  } else {
    initDashboardInteractions(onNavigate);
  }
}

// Login interactions
function initLoginInteractions(onNavigate) {
  const form = document.getElementById('admin-standalone-login-form');
  const passInput = document.getElementById('admin-standalone-password');
  const errorEl = document.getElementById('admin-login-error');
  const toggleBtn = document.getElementById('toggle-password-visibility');
  const backLink = document.getElementById('login-back-to-site');

  if (toggleBtn && passInput) {
    toggleBtn.addEventListener('click', () => {
      const isPass = passInput.type === 'password';
      passInput.type = isPass ? 'text' : 'password';
    });
  }

  if (backLink && onNavigate) {
    backLink.addEventListener('click', (e) => {
      e.preventDefault();
      onNavigate('/');
    });
  }

  if (form && passInput) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (passInput.value.trim() === ADMIN_PASSWORD) {
        setAdminAuthenticated(true);
        showToast('Admin session unlocked.');
        if (onNavigate) {
          onNavigate('/admin');
        }
      } else {
        if (errorEl) errorEl.style.display = 'block';
        passInput.value = '';
        passInput.focus();
      }
    });
  }
}

// Dashboard interactions
function initDashboardInteractions(onNavigate) {
  let currentRoleFilter = 'all';
  let searchQuery = '';

  const tbody = document.getElementById('fullpage-admin-table-body');
  const searchBox = document.getElementById('fullpage-search-box');
  const exportBtn = document.getElementById('fullpage-export-csv-btn');
  const resetBtn = document.getElementById('fullpage-reset-demo-btn');
  const logoutBtn = document.getElementById('sidebar-logout-btn');
  const viewSiteLink = document.getElementById('sidebar-view-site-link');
  const sidebarLogoLink = document.getElementById('sidebar-logo-link');

  const mobileNavToggle = document.getElementById('admin-mobile-nav-toggle');
  const sidebarCollapsible = document.getElementById('admin-sidebar-collapsible');

  // Mobile sidebar collapsible toggle
  if (mobileNavToggle && sidebarCollapsible) {
    mobileNavToggle.addEventListener('click', () => {
      sidebarCollapsible.classList.toggle('open');
      const isOpen = sidebarCollapsible.classList.contains('open');
      mobileNavToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
  }

  // Handle return to public site
  if (viewSiteLink && onNavigate) {
    viewSiteLink.addEventListener('click', (e) => {
      e.preventDefault();
      onNavigate('/');
    });
  }
  if (sidebarLogoLink && onNavigate) {
    sidebarLogoLink.addEventListener('click', (e) => {
      e.preventDefault();
      onNavigate('/');
    });
  }

  // Handle Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      setAdminAuthenticated(false);
      showToast('Logged out of admin dashboard.');
      if (onNavigate) {
        onNavigate('/admin');
      }
    });
  }

  // Handle CSV Export
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      exportToCSV();
      showToast('Waitlist CSV exported successfully.');
    });
  }

  // Handle Reset Demo Data
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset waitlist data to initial demonstration records?')) {
        resetToSeedData();
        showToast('Demonstration records reset.');
        refreshDashboardView();
      }
    });
  }

  // Handle Search Box
  if (searchBox) {
    searchBox.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase();
      renderRows();
    });
  }

  // Handle Role Filter Tabs
  document.querySelectorAll('[data-role-filter]').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('[data-role-filter]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentRoleFilter = tab.getAttribute('data-role-filter');
      renderRows();
    });
  });

  // Handle Sidebar Navigation Items
  document.querySelectorAll('[data-sidebar-role]').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      currentRoleFilter = item.getAttribute('data-sidebar-role');

      // Also sync top filter tabs
      document.querySelectorAll('[data-role-filter]').forEach(tab => {
        tab.classList.toggle('active', tab.getAttribute('data-role-filter') === currentRoleFilter);
      });

      // Auto-close on mobile
      if (window.innerWidth <= 900 && sidebarCollapsible) {
        sidebarCollapsible.classList.remove('open');
        if (mobileNavToggle) mobileNavToggle.setAttribute('aria-expanded', 'false');
      }

      renderRows();
    });
  });

  // Render Table Rows
  function renderRows() {
    if (!tbody) return;

    let items = getRegistrations();

    // Filter by Role
    if (currentRoleFilter !== 'all') {
      items = items.filter(r => r.role === currentRoleFilter);
    }

    // Filter by Search Query
    if (searchQuery) {
      items = items.filter(r => {
        return (
          (r.name && r.name.toLowerCase().includes(searchQuery)) ||
          (r.email && r.email.toLowerCase().includes(searchQuery)) ||
          (r.city && r.city.toLowerCase().includes(searchQuery)) ||
          (r.councilNumber && r.councilNumber.toLowerCase().includes(searchQuery)) ||
          (r.speciality && r.speciality.toLowerCase().includes(searchQuery)) ||
          (r.id && r.id.toLowerCase().includes(searchQuery))
        );
      });
    }

    if (!items.length) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--c-text-muted);">
            No registrations found matching your filter criteria.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = items.map(item => {
      const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '';
      const roleBadge = item.role === 'doctor'
        ? `<span class="role-badge-tag role-doctor">Doctor</span>`
        : item.role === 'patient'
        ? `<span class="role-badge-tag role-patient">Patient</span>`
        : `<span class="role-badge-tag role-supporter">Supporter</span>`;

      const statusBadge = item.status === 'verified'
        ? `<span class="status-pill status-verified">● Verified</span>`
        : item.status === 'contacted'
        ? `<span class="status-pill status-contacted">● Contacted</span>`
        : `<span class="status-pill status-pending">● Pending</span>`;

      const detailsSnippet = item.role === 'doctor'
        ? `<div style="font-weight: 600; color: var(--c-near-black);">${escapeHtml(item.qualification || 'BHMS')} · ${escapeHtml(item.councilNumber || 'Pending')}</div><div style="font-size: 0.76rem; color: var(--c-text-muted);">${escapeHtml(item.speciality || '')}</div>`
        : item.role === 'patient'
        ? `<div style="font-weight: 600; color: var(--c-near-black);">${escapeHtml(item.healthInterests || 'General care')}</div><div style="font-size: 0.76rem; color: var(--c-text-muted);">${escapeHtml(item.consultedBefore || '')}</div>`
        : `<div style="font-weight: 600; color: var(--c-near-black);">${escapeHtml(item.supporterBackground || 'Advocate')}</div>`;

      return `
        <tr>
          <td>
            <div style="font-weight: 700; color: var(--c-near-black);">${item.id}</div>
            <div style="font-size: 0.74rem; color: var(--c-text-muted);">${dateStr}</div>
          </td>
          <td>${roleBadge}</td>
          <td>
            <div style="font-weight: 700; color: var(--c-near-black);">${escapeHtml(item.name)}</div>
            <a href="mailto:${escapeHtml(item.email)}" style="font-size: 0.8rem; color: var(--c-lavender-dark); text-decoration: underline;">
              ${escapeHtml(item.email)}
            </a>
            ${item.phone ? `<div style="font-size: 0.75rem; color: var(--c-text-muted);">${escapeHtml(item.phone)}</div>` : ''}
          </td>
          <td>
            <span style="font-size: 0.85rem; color: var(--c-near-black);">${escapeHtml(item.city)}</span>
          </td>
          <td>${detailsSnippet}</td>
          <td>
            <button type="button" class="btn-ghost" data-action="toggle-status" data-id="${item.id}" title="Click to cycle status" style="padding: 0;">
              ${statusBadge}
            </button>
          </td>
          <td style="text-align: right;">
            <div class="table-action-btns" style="justify-content: flex-end;">
              <button type="button" class="table-icon-btn" data-action="view-details" data-id="${item.id}" title="View Dossier">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
              <button type="button" class="table-icon-btn delete-btn" data-action="delete" data-id="${item.id}" title="Delete Record">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18"/>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach row events
    tbody.querySelectorAll('[data-action="toggle-status"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const list = getRegistrations();
        const current = list.find(r => r.id === id);
        if (!current) return;

        const nextStatus = current.status === 'pending'
          ? 'contacted'
          : current.status === 'contacted'
          ? 'verified'
          : 'pending';

        updateRegistrationStatus(id, nextStatus);
        showToast(`Status updated to ${nextStatus}`);
        renderRows();
      });
    });

    tbody.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm(`Remove waitlist candidate ${id}?`)) {
          deleteRegistration(id);
          showToast(`Record ${id} removed.`);
          refreshDashboardView();
        }
      });
    });

    tbody.querySelectorAll('[data-action="view-details"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openFullpageDossier(id);
      });
    });
  }

  function refreshDashboardView() {
    const metrics = getMetrics();
    const totalEl = document.getElementById('metric-total-val');
    const patEl = document.getElementById('metric-patients-val');
    const docEl = document.getElementById('metric-doctors-val');
    const supEl = document.getElementById('metric-supporters-val');
    const sideTotal = document.getElementById('sidebar-total-count');
    const sidePat = document.getElementById('sidebar-patients-count');
    const sideDoc = document.getElementById('sidebar-doctors-count');
    const sideSup = document.getElementById('sidebar-supporters-count');

    if (totalEl) totalEl.textContent = metrics.total;
    if (patEl) patEl.textContent = metrics.patients;
    if (docEl) docEl.textContent = metrics.doctors;
    if (supEl) supEl.textContent = metrics.supporters;
    if (sideTotal) sideTotal.textContent = metrics.total;
    if (sidePat) sidePat.textContent = metrics.patients;
    if (sideDoc) sideDoc.textContent = metrics.doctors;
    if (sideSup) sideSup.textContent = metrics.supporters;

    renderRows();
  }

  // Open Dossier Drawer Modal inside Dashboard
  function openFullpageDossier(id) {
    const detailModal = document.getElementById('fullpage-candidate-detail-modal');
    const content = document.getElementById('fullpage-candidate-detail-content');
    const closeBtn = document.getElementById('close-fullpage-detail-btn');
    if (!detailModal || !content) return;

    const list = getRegistrations();
    const candidate = list.find(r => r.id === id);
    if (!candidate) return;

    content.innerHTML = `
      <div style="padding-top: 0.5rem;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
          <span style="font-family: var(--font-serif); font-size: 1.5rem; font-weight: 700; color: var(--c-near-black);">${escapeHtml(candidate.name)}</span>
          <span class="role-badge-tag role-${candidate.role}">${candidate.role}</span>
        </div>

        <div style="background: var(--c-lavender-soft); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.25rem; font-size: 0.9rem;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem;">
            <div>
              <div style="font-size: 0.74rem; font-weight: 700; color: var(--c-text-muted); text-transform: uppercase;">Waitlist Pass</div>
              <div style="font-weight: 700; color: var(--c-near-black);">${candidate.id}</div>
            </div>
            <div>
              <div style="font-size: 0.74rem; font-weight: 700; color: var(--c-text-muted); text-transform: uppercase;">Date Submitted</div>
              <div>${new Date(candidate.createdAt).toLocaleString()}</div>
            </div>
            <div>
              <div style="font-size: 0.74rem; font-weight: 700; color: var(--c-text-muted); text-transform: uppercase;">Email</div>
              <a href="mailto:${escapeHtml(candidate.email)}" style="color: var(--c-lavender-dark);">${escapeHtml(candidate.email)}</a>
            </div>
            <div>
              <div style="font-size: 0.74rem; font-weight: 700; color: var(--c-text-muted); text-transform: uppercase;">Location</div>
              <div>${escapeHtml(candidate.city)}</div>
            </div>
          </div>
        </div>

        ${candidate.role === 'doctor' ? `
          <div style="border: 1px solid var(--c-lavender-border); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.25rem;">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--c-lavender-dark); text-transform: uppercase; margin-bottom: 0.65rem;">
              Practitioner Verification Credentials
            </div>
            <p><strong>Council Number:</strong> <code style="background: #F0E6FA; padding: 2px 6px; border-radius: 4px;">${escapeHtml(candidate.councilNumber || 'Not provided')}</code></p>
            <p style="margin-top: 0.35rem;"><strong>Qualification:</strong> ${escapeHtml(candidate.qualification || 'BHMS')}</p>
            <p style="margin-top: 0.35rem;"><strong>Years in Practice:</strong> ${escapeHtml(candidate.yearsExperience || 'Not specified')}</p>
            <p style="margin-top: 0.35rem;"><strong>Clinical Focus:</strong> ${escapeHtml(candidate.speciality || 'General Practice')}</p>
          </div>
        ` : candidate.role === 'patient' ? `
          <div style="border: 1px solid var(--c-lavender-border); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.25rem;">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--c-lavender-dark); text-transform: uppercase; margin-bottom: 0.65rem;">
              Patient Care Intake Preferences
            </div>
            <p><strong>Health Concerns:</strong> ${escapeHtml(candidate.healthInterests || 'None specified')}</p>
            <p style="margin-top: 0.4rem;"><strong>Prior Homeopathy History:</strong> ${escapeHtml(candidate.consultedBefore || 'Not specified')}</p>
          </div>
        ` : `
          <div style="border: 1px solid var(--c-lavender-border); border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.25rem;">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--c-lavender-dark); text-transform: uppercase; margin-bottom: 0.65rem;">
              Supporter / Community Background
            </div>
            <p>${escapeHtml(candidate.supporterBackground || 'Holistic health supporter')}</p>
          </div>
        `}

        <div class="form-group" style="margin-bottom: 1.25rem;">
          <label class="form-label" for="fullpage-detail-notes">
            <span>Staff Admin Notes</span>
          </label>
          <textarea id="fullpage-detail-notes" class="form-textarea" rows="3">${escapeHtml(candidate.notes || '')}</textarea>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
          <button type="button" class="btn btn-chartreuse" id="save-fullpage-notes-btn">
            Save Notes
          </button>
        </div>
      </div>
    `;

    detailModal.classList.add('open');
    detailModal.setAttribute('aria-hidden', 'false');

    closeBtn.onclick = () => {
      detailModal.classList.remove('open');
      detailModal.setAttribute('aria-hidden', 'true');
    };

    document.getElementById('save-fullpage-notes-btn')?.addEventListener('click', () => {
      const notes = document.getElementById('fullpage-detail-notes').value;
      updateRegistrationStatus(candidate.id, undefined, notes);
      showToast('Admin notes saved.');
      detailModal.classList.remove('open');
      refreshDashboardView();
    });
  }

  // Initial table render
  renderRows();
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
