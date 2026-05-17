"use client";
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface PermissionGuardProps {
  /** Required permission key, e.g. "Ads_View", "Users_Delete" */
  permission?: string;
  /** Required role(s) — any match grants access */
  roles?: string[];
  children: React.ReactNode;
  /** Custom fallback UI. If not provided, shows default "access denied" page */
  fallback?: React.ReactNode;
  /** If true, redirects to "/" instead of showing the fallback */
  redirect?: boolean;
}

/**
 * PermissionGuard — wraps page content and enforces permission/role checks.
 *
 * Usage:
 *   <PermissionGuard permission="Users_Delete">
 *     ...protected content...
 *   </PermissionGuard>
 *
 *   <PermissionGuard roles={["SuperAdmin", "Admin"]}>
 *     ...admin-only content...
 *   </PermissionGuard>
 */
export default function PermissionGuard({
  permission,
  roles,
  children,
  fallback,
  redirect = false,
}: PermissionGuardProps) {
  const { user, hasPermission, hasRole, loading } = useAuth();
  const router = useRouter();

  const allowed = (() => {
    if (loading || !user) return false;
    if (permission && !hasPermission(permission)) return false;
    if (roles && roles.length > 0 && !roles.some((r) => hasRole(r))) return false;
    return true;
  })();

  useEffect(() => {
    if (!loading && !allowed && redirect) {
      router.replace("/");
    }
  }, [loading, allowed, redirect, router]);

  if (loading) return null;

  if (!allowed) {
    if (redirect) return null;
    if (fallback) return <>{fallback}</>;

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-20 h-20 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-6">
          <svg
            className="w-10 h-10 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Giriş qadağandır
        </h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          Bu səhifəyə daxil olmaq üçün lazımi icazəniz yoxdur. Zəhmət olmasa administrator ilə əlaqə saxlayın.
        </p>
        <button
          onClick={() => router.back()}
          className="mt-6 px-5 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors"
        >
          Geri qayıt
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
