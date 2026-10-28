import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, AlertTriangle, ArrowRight } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false 
}) => {
  const { isAuthenticated, authLoading, isVerifiedMember, isAdmin, status } = useAuth();
  const location = useLocation();

  // Wait for the Supabase session to be restored before deciding; otherwise
  // every page refresh would bounce signed-in members to /login.
  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4" role="status" aria-live="polite">
        <div className="w-10 h-10 rounded-full border-[3px] border-brand-teal/20 border-t-brand-teal animate-spin" />
        <p className="text-sm text-brand-muted">Checking your session…</p>
      </div>
    );
  }

  // If not authenticated at all
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If route requires admin privileges
  if (requireAdmin) {
    if (!isAdmin) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-card p-8 border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-brand-navy">Administrator Access Required</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              This area is strictly restricted to authorized platform administrators and verification officers.
            </p>
            <div className="pt-2">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-navy text-white text-xs font-semibold hover:bg-slate-800 transition"
              >
                Return to Member Dashboard
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return <>{children}</>;
  }

  // If requires verified membership
  if (!isVerifiedMember) {
    // If pending review
    if (status === 'pending_review' || status === 'submitted' || status === 'needs_information') {
      return <Navigate to="/application-status" replace />;
    }

    // If declined or rejected
    if (status === 'declined' || status === 'rejected') {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-card p-8 border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-100">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-brand-navy">Application Not Approved</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Your practitioner registration credentials could not be validated against the specified state or national register. Under community safety rules, member discussions and directories remain private.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <Link
                to="/application-status"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 transition"
              >
                <span>View Status & Re-submit Documents</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/"
                className="w-full inline-flex items-center justify-center px-5 py-2 rounded-xl text-slate-600 hover:text-brand-navy text-xs font-medium"
              >
                Return to Public Homepage
              </Link>
            </div>
          </div>
        </div>
      );
    }

    // Default redirect to apply
    return <Navigate to="/apply" replace />;
  }

  return <>{children}</>;
};
