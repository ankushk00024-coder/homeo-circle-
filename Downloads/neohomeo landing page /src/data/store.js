// NeoHomeo Waitlist Data Store
// Backed by LocalStorage with realistic seed data

const STORAGE_KEY = 'neohomeo_waitlist_entries_v1';
const ADMIN_SESSION_KEY = 'neohomeo_admin_auth';
export const ADMIN_PASSWORD = 'neohomeo2025';

const SEED_DATA = [
  {
    id: 'NH-1042',
    name: 'Dr. Ananya Sharma',
    email: 'ananya.sharma@homeocare.org',
    phone: '+91 98201 44521',
    role: 'doctor',
    city: 'Mumbai, Maharashtra',
    qualification: 'BHMS, MD (Hom)',
    councilNumber: 'MAH-HOM-2018-8472',
    yearsExperience: '7+ years',
    speciality: 'Chronic Autoimmune & Pediatric Care',
    healthInterests: '',
    consultedBefore: '',
    supporterBackground: '',
    status: 'verified',
    createdAt: '2026-10-18T10:30:00.000Z',
    notes: 'Verified credentials against Maharashtra Council of Homoeopathy. Profile ready for launch cohort.'
  },
  {
    id: 'NH-1043',
    name: 'Aarav Patel',
    email: 'aarav.patel@designforward.co',
    phone: '+91 97123 90812',
    role: 'patient',
    city: 'Ahmedabad, Gujarat',
    qualification: '',
    councilNumber: '',
    yearsExperience: '',
    speciality: '',
    healthInterests: 'Chronic Migraine, Gut & Digestive Health',
    consultedBefore: 'Yes, for over 3 years with classical homeopath',
    supporterBackground: '',
    status: 'contacted',
    createdAt: '2026-10-19T14:15:00.000Z',
    notes: 'Interested in digital symptom timeline and preserving previous case-taking files.'
  },
  {
    id: 'NH-1044',
    name: 'Dr. Rohan Mehta',
    email: 'dr.rohan.mehta@cliniclife.in',
    phone: '+91 94002 11983',
    role: 'doctor',
    city: 'Bengaluru, Karnataka',
    qualification: 'BHMS, MD (Hom)',
    councilNumber: 'KAR-NCH-2016-3912',
    yearsExperience: '9+ years',
    speciality: 'Dermatology & Allergic Conditions',
    healthInterests: '',
    consultedBefore: '',
    supporterBackground: '',
    status: 'verified',
    createdAt: '2026-10-20T09:45:00.000Z',
    notes: 'Wants pre-intake questionnaire to screen patients with extensive constitutional history.'
  },
  {
    id: 'NH-1045',
    name: 'Meera Iyer',
    email: 'meera.iyer@wellnessjournal.in',
    phone: '+91 98451 77209',
    role: 'patient',
    city: 'Chennai, Tamil Nadu',
    qualification: '',
    councilNumber: '',
    yearsExperience: '',
    speciality: '',
    healthInterests: 'Hormonal Balance, Sleep & Anxiety Support',
    consultedBefore: 'Yes, regularly for family wellness',
    supporterBackground: '',
    status: 'pending',
    createdAt: '2026-10-21T11:20:00.000Z',
    notes: 'Looking for verified practitioners with telehealth consultations.'
  },
  {
    id: 'NH-1046',
    name: 'Vikramaditya Rao',
    email: 'vikram.rao@healthtech-angels.com',
    phone: '+91 99882 34100',
    role: 'supporter',
    city: 'Hyderabad, Telangana',
    qualification: '',
    councilNumber: '',
    yearsExperience: '',
    speciality: '',
    healthInterests: '',
    consultedBefore: '',
    supporterBackground: 'Digital Health Investor & Integrative Wellness Advocate',
    status: 'contacted',
    createdAt: '2026-10-21T16:05:00.000Z',
    notes: 'Requested product roadmap preview and advisory circle updates.'
  },
  {
    id: 'NH-1047',
    name: 'Priyanka Sen',
    email: 'priyanka.sen@gmail.com',
    phone: '+91 98311 00293',
    role: 'patient',
    city: 'Kolkata, West Bengal',
    qualification: '',
    councilNumber: '',
    yearsExperience: '',
    speciality: '',
    healthInterests: 'Pediatric Immunity & Seasonal Allergies',
    consultedBefore: 'First time exploring homeopathy for children',
    status: 'pending',
    createdAt: '2026-10-22T08:12:00.000Z',
    notes: 'Seeking child-friendly consultation format and gentle guidance.'
  }
];

export function getRegistrations() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_DATA));
      return [...SEED_DATA];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [...SEED_DATA];
  } catch (e) {
    console.error('Error reading waitlist storage:', e);
    return [...SEED_DATA];
  }
}

export function saveRegistrations(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    // Dispatch custom event for cross-component sync
    window.dispatchEvent(new CustomEvent('neohomeo_data_updated', { detail: { count: list.length } }));
  } catch (e) {
    console.error('Error saving waitlist storage:', e);
  }
}

export function addRegistration(entry) {
  const current = getRegistrations();
  const nextNumber = 1048 + current.length;
  const newEntry = {
    id: `NH-${nextNumber}`,
    createdAt: new Date().toISOString(),
    status: 'pending',
    notes: 'Registered via web early access form',
    ...entry
  };
  const updated = [newEntry, ...current];
  saveRegistrations(updated);
  return newEntry;
}

export function updateRegistrationStatus(id, newStatus, newNotes) {
  const current = getRegistrations();
  const updated = current.map(item => {
    if (item.id === id) {
      return {
        ...item,
        status: newStatus !== undefined ? newStatus : item.status,
        notes: newNotes !== undefined ? newNotes : item.notes
      };
    }
    return item;
  });
  saveRegistrations(updated);
  return updated;
}

export function deleteRegistration(id) {
  const current = getRegistrations();
  const updated = current.filter(item => item.id !== id);
  saveRegistrations(updated);
  return updated;
}

export function resetToSeedData() {
  saveRegistrations(SEED_DATA);
  return [...SEED_DATA];
}

export function getMetrics() {
  const list = getRegistrations();
  const total = list.length;
  const patients = list.filter(r => r.role === 'patient').length;
  const doctors = list.filter(r => r.role === 'doctor').length;
  const supporters = list.filter(r => r.role === 'supporter').length;
  const verified = list.filter(r => r.status === 'verified').length;
  const pending = list.filter(r => r.status === 'pending').length;

  return {
    total,
    patients,
    doctors,
    supporters,
    verified,
    pending
  };
}

export function exportToCSV() {
  const list = getRegistrations();
  if (!list.length) return false;

  const headers = [
    'Waitlist ID',
    'Date Submitted',
    'Full Name',
    'Email Address',
    'Phone',
    'Role',
    'Location',
    'Qualification',
    'Council Reg Number',
    'Years Experience',
    'Speciality',
    'Health Focus / Concerns',
    'Prior Homeopathy Consult',
    'Supporter Background',
    'Status',
    'Admin Notes'
  ];

  const rows = list.map(item => [
    item.id || '',
    item.createdAt ? new Date(item.createdAt).toLocaleString() : '',
    `"${(item.name || '').replace(/"/g, '""')}"`,
    `"${(item.email || '').replace(/"/g, '""')}"`,
    `"${(item.phone || '').replace(/"/g, '""')}"`,
    item.role || '',
    `"${(item.city || '').replace(/"/g, '""')}"`,
    `"${(item.qualification || '').replace(/"/g, '""')}"`,
    `"${(item.councilNumber || '').replace(/"/g, '""')}"`,
    `"${(item.yearsExperience || '').replace(/"/g, '""')}"`,
    `"${(item.speciality || '').replace(/"/g, '""')}"`,
    `"${(item.healthInterests || '').replace(/"/g, '""')}"`,
    `"${(item.consultedBefore || '').replace(/"/g, '""')}"`,
    `"${(item.supporterBackground || '').replace(/"/g, '""')}"`,
    item.status || '',
    `"${(item.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `neohomeo_waitlist_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}

// Authentication Helpers
export function isAdminAuthenticated() {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
}

export function setAdminAuthenticated(val) {
  if (val) {
    sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
  } else {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  }
}
