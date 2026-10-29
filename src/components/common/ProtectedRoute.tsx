import React, { useState, useEffect } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireVerified?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false,
  requireVerified = false
}) => {
  const { isAuthenticated, isVerifiedMember, isAdmin, status, loading: authLoading } = useAuth();
  const location = useLocation();

  const [backendAdminVerified, setBackendAdminVerified] = useState<boolean | null>(null);
  const [checkingBackendAdmin, setCheckingBackendAdmin] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function verifyBackendAdminRole() {
      if (!requireAdmin) return;

      // If user holds administrative role in active authenticated profile
      if (isAdmin) {
        if (isMounted) setBackendAdminVerified(true);
        return;
      }

      if (!isSupabaseConfigured || !supabase) {
        if (isMounted) setBackendAdminVerified(isAdmin);
        return;
      }

      setCheckingBackendAdmin(true);
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          if (isMounted) setBackendAdminVerified(false);
          return;
        }

        // Live check against trusted backend user_roles table
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .in('role', ['admin', 'super_admin']);

        if (rolesError) {
          // If user_roles table RLS restricts select, fallback to is_admin RPC
          const { data: rpcAdmin } = await supabase.rpc('is_admin');
          if (isMounted) setBackendAdminVerified(Boolean(rpcAdmin));
        } else {
          const hasRole = Array.isArray(roles) && roles.length > 0;
          if (isMounted) setBackendAdminVerified(hasRole);
        }
      } catch (err) {
        console.error('Backend admin authorization verification failed:', err);
        if (isMounted) setBackendAdminVerified(false);
      } finally {
        if (isMounted) setCheckingBackendAdmin(false);
      }
    }

    verifyBackendAdminRole();

    return () => {
      isMounted = false;
    };
  }, [requireAdmin, isAuthenticated, isAdmin]);

  if (authLoading || (requireAdmin && checkingBackendAdmin && backendAdminVerified === null)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin mb-3" />
        <p className="text-xs text-slate-500 font-medium tracking-wide">Verifying platform authorization...</p>
      </div>
    );
  }

  // If not authenticated at all
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Suspended accounts keep their login but lose community access
  if (status === 'suspended' && !isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-card p-8 border border-slate-200 text-center space-y-4">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-100">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-brand-navy">Account suspended</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Your access to the community is paused. If you think this is a mistake, contact support@homeocircle.in.
          </p>
          <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-navy text-white text-sm font-semibold hover:bg-slate-800 transition">
            Back to homepage
          </Link>
        </div>
      </div>
    );
  }

  // If route requires admin privileges
  if (requireAdmin) {
    const isAuthorized = isAdmin || backendAdminVerified === true;

    if (!isAuthorized) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-card p-8 border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-brand-navy">Administrator Access Required</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              This area is strictly restricted to authorized platform administrators and verification officers. Live backend role verification failed for this session.
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

  // If route specifically requires verified practitioner/educator membership
  if (requireVerified && !isVerifiedMember) {
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
