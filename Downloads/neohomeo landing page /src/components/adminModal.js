// Password-Protected Admin Panel Component
import {
  getRegistrations,
  getMetrics,
  exportToCSV,
  updateRegistrationStatus,
  deleteRegistration,
  resetToSeedData,
  addRegistration,
  isAdminAuthenticated,
  setAdminAuthenticated,
  ADMIN_PASSWORD
} from '../data/store.js';
import { showToast } from './waitlistForm.js';

export function renderAdminModal() {
  return `
    <div class="modal-backdrop" id="admin-modal-backdrop" aria-hidden="true" role="dialog" aria-modal="true">
      <div class="modal-sheet sheet-wide" id="admin-modal-sheet">
        <button type="button" class="modal-close-btn" id="close-admin-modal-btn" aria-label="Close admin modal">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        <div id="admin-modal-body">
          <!-- Dynamically filled with Login or Dashboard -->
        </div>
      </div>
    </div>

    <!-- Candidate Detail Sub-Modal -->
    <div class="modal-backdrop" id="candidate-detail-modal" aria-hidden="true" style="z-index: 10001;">
      <div class="modal-sheet" style="max-width: 580px;">
        <button type="button" class="modal-close-btn" id="close-detail-modal-btn" aria-label="Close candidate detail">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <div id="candidate-detail-content"></div>
      </div>
    </div>
  `;
}

export let openAdminFn = null;
export let closeAdminFn = null;

export function initAdminPanel() {
  const backdrop = document.getElementById('admin-modal-backdrop');
  const closeBtn = document.getElementById('close-admin-modal-btn');
  const modalBody = document.getElementById('admin-modal-body');

  let currentRoleFilter = 'all';
  let currentStatusFilter = 'all';
  let searchQuery = '';

  // Trigger buttons
  document.getElementById('open-admin-btn')?.addEventListener('click', openAdmin);
  document.getElementById('open-admin-mobile-btn')?.addEventListener('click', openAdmin);
  document.getElementById('footer-admin-portal-btn')?.addEventListener('click', openAdmin);

  // Close handlers
  closeBtn?.addEventListener('click', closeAdmin);
  backdrop?.addEventListener('click', (e) => {
    if (e.target === backdrop) closeAdmin();
  });

  // Keyboard shortcut Ctrl+Shift+A or Cmd+Shift+A
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
      e.preventDefault();
      openAdmin();
    }
  });

  // Data update listener
  window.addEventListener('neohomeo_data_updated', () => {
    if (isAdminAuthenticated() && backdrop.classList.contains('open')) {
      renderDashboard();
    }
  });

  function openAdmin(skipHistory = false) {
    backdrop.classList.add('open');
    backdrop.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    if (!skipHistory && window.location.pathname !== '/admin' && window.location.hash !== '#admin') {
      try {
        history.pushState({ modal: 'admin' }, '', '/admin');
      } catch (e) {
        window.location.hash = '#admin';
      }
    }

    if (isAdminAuthenticated()) {
      renderDashboard();
    } else {
      renderLoginForm();
    }
  }

  function closeAdmin(skipHistory = false) {
    backdrop.classList.remove('open');
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    if (!skipHistory && (window.location.pathname === '/admin' || window.location.hash === '#admin')) {
      try {
        history.pushState(null, '', '/');
      } catch (e) {
        window.location.hash = '';
      }
    }
  }

  openAdminFn = openAdmin;
  closeAdminFn = closeAdmin;
  window.openNeoHomeoAdmin = openAdmin;
  window.closeNeoHomeoAdmin = closeAdmin;


  // 1. Render Login Form
  function renderLoginForm() {
    modalBody.innerHTML = `
      <div class="admin-login-box">
        <div class="admin-lock-icon">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        <h3 style="font-family: var(--font-serif); font-size: 1.85rem; color: var(--c-near-black); margin-bottom: 0.4rem;">
          Staff Admin Portal
        </h3>

        <p style="font-size: 0.95rem; color: var(--c-text-muted); margin-bottom: 2rem;">
          Enter your administrative password to access the waitlist and review candidate doctor credentials.
        </p>

        <form id="admin-login-form">
          <div class="form-group" style="text-align: left; margin-bottom: 1.25rem;">
            <label class="form-label" for="admin-pass-input">
              <span>Security Password</span>
            </label>
            <input type="password" id="admin-pass-input" class="form-input" placeholder="••••••••••••" autofocus required>
            <div style="margin-top: 0.5rem; font-size: 0.8rem; color: var(--c-lavender-dark); font-weight: 600;">
              Demo password: <code style="background: var(--c-lavender-soft); padding: 2px 6px; border-radius: 4px;">neohomeo2025</code>
            </div>
          </div>

          <div id="login-error-msg" style="display: none; color: var(--c-tomato); font-size: 0.85rem; font-weight: 600; margin-bottom: 1rem;">
            Incorrect password. Please try again.
          </div>

          <button type="submit" class="btn btn-chartreuse" style="width: 100%; justify-content: center;">
            <span>Unlock Dashboard</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M5 12h14"/>
              <path d="m12 5 7 7-7 7"/>
            </svg>
          </button>
        </form>
      </div>
    `;

    const form = document.getElementById('admin-login-form');
    const input = document.getElementById('admin-pass-input');
    const errorEl = document.getElementById('login-error-msg');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (input.value.trim() === ADMIN_PASSWORD) {
        setAdminAuthenticated(true);
        showToast('Admin session unlocked.');
        renderDashboard();
      } else {
        if (errorEl) errorEl.style.display = 'block';
        input.value = '';
        input.focus();
      }
    });
  }

  // 2. Render Full Dashboard
  function renderDashboard() {
    const metrics = getMetrics();
    const list = getRegistrations();

    modalBody.innerHTML = `
      <div class="admin-dashboard-container">
        <!-- Top Bar -->
        <div class="admin-header-row">
          <div class="admin-brand-info">
            <h3>Waitlist Registrations</h3>
            <p>Live candidate roster · ${metrics.total} registrations logged</p>
          </div>

          <div class="admin-controls-group">
            <button type="button" class="btn btn-sm btn-chartreuse" id="admin-export-csv-btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" x2="12" y1="15" y2="3"/>
              </svg>
              <span>Export CSV</span>
            </button>

            <button type="button" class="btn btn-sm btn-outline-lavender" id="admin-seed-btn" title="Reset sample records">
              <span>Reset Demo</span>
            </button>

            <button type="button" class="btn btn-sm btn-ghost" id="admin-signout-btn" style="color: var(--c-tomato);">
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        <!-- Metric KPI Cards -->
        <div class="admin-metrics-grid">
          <div class="metric-stat-card">
            <div class="metric-stat-title">Total Waitlist</div>
            <div class="metric-stat-value">${metrics.total}</div>
            <div class="metric-stat-sub">100% Verified Storage</div>
          </div>

          <div class="metric-stat-card">
            <div class="metric-stat-title">Patients</div>
            <div class="metric-stat-value">${metrics.patients}</div>
            <div class="metric-stat-sub">${Math.round((metrics.patients / (metrics.total || 1)) * 100)}% of candidate pool</div>
          </div>

          <div class="metric-stat-card">
            <div class="metric-stat-title">Doctors (BHMS/MD)</div>
            <div class="metric-stat-value" style="color: var(--c-lavender-dark);">${metrics.doctors}</div>
            <div class="metric-stat-sub">${metrics.verified} Council Verified</div>
          </div>

          <div class="metric-stat-card">
            <div class="metric-stat-title">Supporters</div>
            <div class="metric-stat-value">${metrics.supporters}</div>
            <div class="metric-stat-sub">Community advocates</div>
          </div>
        </div>

        <!-- Search & Filter Toolbar -->
        <div class="admin-toolbar-row">
          <div class="admin-search-wrap">
            <svg class="admin-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.3-4.3"/>
            </svg>
            <input type="text" id="admin-search-box" class="admin-search-input" placeholder="Search by name, email, city, council number..." value="${escapeHtml(searchQuery)}">
          </div>

          <!-- Role Filter Tabs -->
          <div class="admin-filter-tabs">
            <button type="button" class="filter-tab-btn ${currentRoleFilter === 'all' ? 'active' : ''}" data-filter-role="all">All (${metrics.total})</button>
            <button type="button" class="filter-tab-btn ${currentRoleFilter === 'patient' ? 'active' : ''}" data-filter-role="patient">Patients (${metrics.patients})</button>
            <button type="button" class="filter-tab-btn ${currentRoleFilter === 'doctor' ? 'active' : ''}" data-filter-role="doctor">Doctors (${metrics.doctors})</button>
            <button type="button" class="filter-tab-btn ${currentRoleFilter === 'supporter' ? 'active' : ''}" data-filter-role="supporter">Supporters (${metrics.supporters})</button>
          </div>
        </div>

        <!-- Table Display -->
        <div class="admin-table-container">
          <table class="admin-table">
            <thead>
              <tr>
                <th>ID & Date</th>
                <th>Role</th>
                <th>Name & Contact</th>
                <th>Location</th>
                <th>Qualifications / Focus</th>
                <th>Status</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody id="admin-table-body">
              <!-- Dynamically populated below -->
            </tbody>
          </table>
        </div>
      </div>
    `;

    renderTableRows();

    // Attach Dashboard Event Handlers
    document.getElementById('admin-export-csv-btn')?.addEventListener('click', () => {
      exportToCSV();
      showToast('Exported waitlist CSV successfully.');
    });

    document.getElementById('admin-seed-btn')?.addEventListener('click', () => {
      if (confirm('Reset waitlist data to initial demonstration records?')) {
        resetToSeedData();
        showToast('Demonstration records reset.');
        renderDashboard();
      }
    });

    document.getElementById('admin-signout-btn')?.addEventListener('click', () => {
      setAdminAuthenticated(false);
      showToast('Signed out of admin portal.');
      renderLoginForm();
    });

    // Search Box
    const searchBox = document.getElementById('admin-search-box');
    searchBox?.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase();
      renderTableRows();
    });

    // Role filter tabs
    document.querySelectorAll('[data-filter-role]').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('[data-filter-role]').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentRoleFilter = tab.getAttribute('data-filter-role');
        renderTableRows();
      });
    });
  }

  // 3. Render filtered table rows
  function renderTableRows() {
    const tbody = document.getElementById('admin-table-body');
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
            No registrations found matching your current filter criteria.
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

    // Attach row action listeners
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
        renderDashboard();
      });
    });

    tbody.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        if (confirm(`Remove waitlist candidate ${id}?`)) {
          deleteRegistration(id);
          showToast(`Record ${id} removed.`);
          renderDashboard();
        }
      });
    });

    tbody.querySelectorAll('[data-action="view-details"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        openCandidateDetail(id);
      });
    });
  }

  // 4. Candidate Detail Drawer
  function openCandidateDetail(id) {
    const detailModal = document.getElementById('candidate-detail-modal');
    const content = document.getElementById('candidate-detail-content');
    const closeDetailBtn = document.getElementById('close-detail-modal-btn');
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
          <label class="form-label" for="detail-admin-notes">
            <span>Staff Admin Notes</span>
          </label>
          <textarea id="detail-admin-notes" class="form-textarea" rows="3">${escapeHtml(candidate.notes || '')}</textarea>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
          <button type="button" class="btn btn-chartreuse" id="save-detail-notes-btn">
            Save Notes
          </button>
        </div>
      </div>
    `;

    detailModal.classList.add('open');
    detailModal.setAttribute('aria-hidden', 'false');

    closeDetailBtn.onclick = () => {
      detailModal.classList.remove('open');
      detailModal.setAttribute('aria-hidden', 'true');
    };

    document.getElementById('save-detail-notes-btn')?.addEventListener('click', () => {
      const notes = document.getElementById('detail-admin-notes').value;
      updateRegistrationStatus(candidate.id, undefined, notes);
      showToast('Admin notes saved.');
      detailModal.classList.remove('open');
      renderDashboard();
    });
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
