import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Outlet, Link, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/feedback/ToastProvider';
import { MobileTabBar } from './components/layout/MobileTabBar';
import { AccountTypePrompt } from './components/common/AccountTypePrompt';
import { PublicNavbar } from './components/layout/PublicNavbar';
import { MemberNavbar } from './components/layout/MemberNavbar';
import { MemberSidebar } from './components/layout/MemberSidebar';
import { AdminSidebar } from './components/layout/AdminSidebar';
import { Footer } from './components/layout/Footer';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// First-paint pages load eagerly; everything else is split into its own chunk.
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';

// Public pages (lazy)
const AboutPage = lazy(() => import('./pages/public/AboutPage').then((m) => ({ default: m.AboutPage })));
const EligibilityPage = lazy(() => import('./pages/public/EligibilityPage').then((m) => ({ default: m.EligibilityPage })));
const CommunityRulesPage = lazy(() => import('./pages/public/CommunityRulesPage').then((m) => ({ default: m.CommunityRulesPage })));
const PrivacyPage = lazy(() => import('./pages/public/PrivacyPage').then((m) => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('./pages/public/TermsPage').then((m) => ({ default: m.TermsPage })));
const ApplyPage = lazy(() => import('./pages/public/ApplyPage').then((m) => ({ default: m.ApplyPage })));
const ApplicationStatusPage = lazy(() => import('./pages/public/ApplicationStatusPage').then((m) => ({ default: m.ApplicationStatusPage })));
const ExplorePage = lazy(() => import('./pages/public/ExplorePage').then((m) => ({ default: m.ExplorePage })));
const ResetPasswordPage = lazy(() => import('./pages/public/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })));

// Member pages (lazy)
const DashboardPage = lazy(() => import('./pages/member/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const DiscussionsPage = lazy(() => import('./pages/member/DiscussionsPage').then((m) => ({ default: m.DiscussionsPage })));
const PostDetailPage = lazy(() => import('./pages/member/PostDetailPage').then((m) => ({ default: m.PostDetailPage })));
const MembersPage = lazy(() => import('./pages/member/MembersPage').then((m) => ({ default: m.MembersPage })));
const MemberProfilePage = lazy(() => import('./pages/member/MemberProfilePage').then((m) => ({ default: m.MemberProfilePage })));
const EventsPage = lazy(() => import('./pages/member/EventsPage').then((m) => ({ default: m.EventsPage })));
const OpportunitiesPage = lazy(() => import('./pages/member/OpportunitiesPage').then((m) => ({ default: m.OpportunitiesPage })));
const KnowledgePage = lazy(() => import('./pages/member/KnowledgePage').then((m) => ({ default: m.KnowledgePage })));
const StudentsPage = lazy(() => import('./pages/member/StudentsPage').then((m) => ({ default: m.StudentsPage })));
const ProfileEditPage = lazy(() => import('./pages/member/ProfileEditPage').then((m) => ({ default: m.ProfileEditPage })));
const SettingsPage = lazy(() => import('./pages/member/SettingsPage').then((m) => ({ default: m.SettingsPage })));

// Admin pages (lazy)
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const AdminApplications = lazy(() => import('./pages/admin/AdminApplications').then((m) => ({ default: m.AdminApplications })));
const AdminMembers = lazy(() => import('./pages/admin/AdminMembers').then((m) => ({ default: m.AdminMembers })));
const AdminStudents = lazy(() => import('./pages/admin/AdminStudents').then((m) => ({ default: m.AdminStudents })));
const AdminResearchers = lazy(() => import('./pages/admin/AdminResearchers').then((m) => ({ default: m.AdminResearchers })));
const AdminPosts = lazy(() => import('./pages/admin/AdminPosts').then((m) => ({ default: m.AdminPosts })));
const AdminReports = lazy(() => import('./pages/admin/AdminReports').then((m) => ({ default: m.AdminReports })));
const AdminCategories = lazy(() => import('./pages/admin/AdminCategories').then((m) => ({ default: m.AdminCategories })));
const AdminNotifications = lazy(() => import('./pages/admin/AdminNotifications').then((m) => ({ default: m.AdminNotifications })));
const AdminEvents = lazy(() => import('./pages/admin/AdminEvents').then((m) => ({ default: m.AdminEvents })));
const AdminOpportunities = lazy(() => import('./pages/admin/AdminOpportunities').then((m) => ({ default: m.AdminOpportunities })));
const AdminKnowledge = lazy(() => import('./pages/admin/AdminKnowledge').then((m) => ({ default: m.AdminKnowledge })));
const AdminAuditLogs = lazy(() => import('./pages/admin/AdminAuditLogs').then((m) => ({ default: m.AdminAuditLogs })));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings').then((m) => ({ default: m.AdminSettings })));

// Scroll to the top on every route change
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
};

// Each page fades up when the route changes
const AnimatedOutlet: React.FC = () => {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="animate-fade-up">
      <Outlet />
    </div>
  );
};

// Shown while a lazily loaded page downloads
const PageFallback: React.FC = () => (
  <div className="max-w-5xl mx-auto w-full p-6 space-y-4" role="status" aria-label="Loading page">
    <div className="skeleton h-8 w-1/3" />
    <div className="skeleton h-4 w-2/3" />
    <div className="grid sm:grid-cols-2 gap-4 pt-2">
      <div className="skeleton h-40" />
      <div className="skeleton h-40" />
    </div>
  </div>
);

// Signed-in members skip the public Explore preview and go straight to the
// community. The home page (/) stays open to everyone.
const VisitorsOnly: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <PageFallback />;
  if (isAuthenticated) return <Navigate to="/community" replace />;
  return children;
};

// Public Layout Wrapper
const PublicLayout: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-brand-paper">
    <PublicNavbar />
    <main className="flex-1">
      <Suspense fallback={<PageFallback />}>
        <AnimatedOutlet />
      </Suspense>
    </main>
    <Footer />
  </div>
);

// Member Layout Wrapper with Member Sidebar (desktop) and bottom tab bar (mobile)
const MemberLayout: React.FC = () => (
  <div className="min-h-screen flex flex-col bg-brand-paper">
    <MemberNavbar />
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-8 flex-1">
      <div className="flex gap-8 items-start">
        <MemberSidebar />
        <main className="flex-1 min-w-0">
          <AccountTypePrompt />
          <Suspense fallback={<PageFallback />}>
            <AnimatedOutlet />
          </Suspense>
        </main>
      </div>
    </div>
    <Footer />
    <MobileTabBar />
  </div>
);

// Admin Layout Wrapper with Dark Indigo Sidebar (drawer on mobile)
const AdminLayout: React.FC = () => (
  <div className="min-h-screen flex flex-col md:flex-row bg-brand-paper">
    <AdminSidebar />
    <main className="flex-1 min-w-0 p-4 sm:p-8">
      <Suspense fallback={<PageFallback />}>
        <AnimatedOutlet />
      </Suspense>
    </main>
  </div>
);

// 404 Not Found Page
const NotFoundPage: React.FC = () => (
  <div className="min-h-[70vh] flex items-center justify-center p-4">
    <div className="max-w-md w-full bg-white rounded-2xl shadow-card p-8 ring-1 ring-brand-border text-center space-y-4 animate-scale-in">
      <div className="text-6xl font-serif font-bold text-gradient">404</div>
      <h1 className="text-2xl font-bold font-serif text-brand-navy">Page not found</h1>
      <p className="text-sm text-slate-500">The requested address does not exist or has been moved.</p>
      <Link to="/" className="btn-primary">
        Return to Home
      </Link>
    </div>
  </div>
);

export function App() {
  return (
    <ToastProvider>
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/explore" element={<VisitorsOnly><ExplorePage /></VisitorsOnly>} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/eligibility" element={<EligibilityPage />} />
            <Route path="/community-rules" element={<CommunityRulesPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/apply" element={<ApplyPage />} />
            <Route path="/application-status" element={<ApplicationStatusPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
          </Route>

          {/* Community routes: any signed-in member (verification not required).
              Visitors are sent to sign in and brought back afterwards; the
              public /explore page is the preview for logged-out visitors. */}
          <Route element={
            <ProtectedRoute>
              <MemberLayout />
            </ProtectedRoute>
          }>
            <Route path="/community" element={<DiscussionsPage />} />
            <Route path="/community/:postId" element={<PostDetailPage />} />
            <Route path="/members" element={<MembersPage />} />
            <Route path="/members/:id" element={<MemberProfilePage />} />
            <Route path="/events" element={<EventsPage />} />
            <Route path="/opportunities" element={<OpportunitiesPage />} />
            <Route path="/knowledge" element={<KnowledgePage />} />
            <Route path="/students" element={<StudentsPage />} />
          </Route>

          {/* Member routes (require sign-in) */}
          <Route element={
            <ProtectedRoute>
              <MemberLayout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<DashboardPage />} />
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
            <Route path="/admin/students" element={<AdminStudents />} />
            <Route path="/admin/researchers" element={<AdminResearchers />} />
            <Route path="/admin/posts" element={<AdminPosts />} />
            <Route path="/admin/content" element={<AdminPosts />} />
            <Route path="/admin/reports" element={<AdminReports />} />
            <Route path="/admin/events" element={<AdminEvents />} />
            <Route path="/admin/opportunities" element={<AdminOpportunities />} />
            <Route path="/admin/knowledge" element={<AdminKnowledge />} />
            <Route path="/admin/categories" element={<AdminCategories />} />
            <Route path="/admin/notifications" element={<AdminNotifications />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
          </Route>

          {/* 404 Fallback */}
          <Route element={<PublicLayout />}>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ToastProvider>
  );
}

export default App;
