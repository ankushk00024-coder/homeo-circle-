import React from 'react';
import { BrowserRouter, Routes, Route, Outlet, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PublicNavbar } from './components/layout/PublicNavbar';
import { MemberNavbar } from './components/layout/MemberNavbar';
import { MemberSidebar } from './components/layout/MemberSidebar';
import { AdminSidebar } from './components/layout/AdminSidebar';
import { Footer } from './components/layout/Footer';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { AboutPage } from './pages/public/AboutPage';
import { EligibilityPage } from './pages/public/EligibilityPage';
import { CommunityRulesPage } from './pages/public/CommunityRulesPage';
import { PrivacyPage } from './pages/public/PrivacyPage';
import { TermsPage } from './pages/public/TermsPage';
import { ApplyPage } from './pages/public/ApplyPage';
import { ApplicationStatusPage } from './pages/public/ApplicationStatusPage';
import { LoginPage } from './pages/public/LoginPage';

// Member Pages
import { DashboardPage } from './pages/member/DashboardPage';
import { DiscussionsPage } from './pages/member/DiscussionsPage';
import { PostDetailPage } from './pages/member/PostDetailPage';
import { MembersPage } from './pages/member/MembersPage';
import { MemberProfilePage } from './pages/member/MemberProfilePage';
import { EventsPage } from './pages/member/EventsPage';
import { OpportunitiesPage } from './pages/member/OpportunitiesPage';
import { KnowledgePage } from './pages/member/KnowledgePage';
import { ProfileEditPage } from './pages/member/ProfileEditPage';
import { SettingsPage } from './pages/member/SettingsPage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminApplications } from './pages/admin/AdminApplications';
import { AdminMembers } from './pages/admin/AdminMembers';
import { AdminContent } from './pages/admin/AdminContent';
import { AdminEvents } from './pages/admin/AdminEvents';
import { AdminOpportunities } from './pages/admin/AdminOpportunities';
import { AdminKnowledge } from './pages/admin/AdminKnowledge';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs';
import { AdminSettings } from './pages/admin/AdminSettings';

// Public Layout Wrapper
const PublicLayout: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-brand-paper">
    <PublicNavbar />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
  </div>
);

// Member Layout Wrapper with Member Sidebar
const MemberLayout: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-brand-paper">
    <MemberNavbar />
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1">
      <div className="flex gap-8 items-start">
        <MemberSidebar />
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
    <Footer />
  </div>
);

// Admin Layout Wrapper with Dark Indigo Sidebar
const AdminLayout: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-[#F1F7FC]">
    <div className="flex-1 flex flex-col md:flex-row">
      <AdminSidebar />
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  </div>
);

// 404 Not Found Page
const NotFoundPage: React.FC = () => (
  <div className="min-h-[70vh] flex items-center justify-center p-4">
    <div className="max-w-md w-full bg-white rounded-2xl shadow-card p-8 border border-slate-200 text-center space-y-4">
      <h2 className="text-2xl font-bold font-serif text-brand-navy">404 — Page Not Found</h2>
      <p className="text-xs text-slate-500">The requested address does not exist or has been moved.</p>
      <Link to="/" className="inline-block px-5 py-2.5 bg-teal-700 text-white rounded-xl text-xs font-semibold hover:bg-teal-800 transition">
        Return to Home
      </Link>
    </div>
  </div>
);

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/eligibility" element={<EligibilityPage />} />
            <Route path="/community-rules" element={<CommunityRulesPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/apply" element={<ApplyPage />} />
            <Route path="/application-status" element={<ApplicationStatusPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Member Community Routes (Protected) */}
          <Route element={
            <ProtectedRoute>
              <MemberLayout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/community" element={<DiscussionsPage />} />
            <Route path="/community/:postId" element={<PostDetailPage />} />
            <Route path="/members" element={<MembersPage />} />
            <Route path="/members/:id" element={<MemberProfilePage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/opportunities" element={<OpportunitiesPage />} />
            <Route path="/knowledge" element={<KnowledgePage />} />
            <Route path="/profile" element={<ProfileEditPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Admin Panel Routes (Protected for Admin role) */}
          <Route element={
            <ProtectedRoute requireAdmin={true}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/applications" element={<AdminApplications />} />
            <Route path="/admin/members" element={<AdminMembers />} />
            <Route path="/admin/content" element={<AdminContent />} />
            <Route path="/admin/events" element={<AdminEvents />} />
            <Route path="/admin/opportunities" element={<AdminOpportunities />} />
            <Route path="/admin/knowledge" element={<AdminKnowledge />} />
            <Route path="/admin/reports" element={<AdminContent />} />
            <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>

          {/* 404 Fallback */}
          <Route element={<PublicLayout />}>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
