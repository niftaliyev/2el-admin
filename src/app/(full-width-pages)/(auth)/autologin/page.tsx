"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "@/utils/api";
import toast from "react-hot-toast";

function AutoLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [status, setStatus] = useState("Admin panelinə giriş edilir...");
  const autologinAttempted = React.useRef(false);

  useEffect(() => {
    if (autologinAttempted.current) return;

    const token = searchParams.get("token");
    const refreshToken = searchParams.get("refreshToken");

    if (!token || !refreshToken) {
      autologinAttempted.current = true;
      toast.error("Avtomatik giriş məlumatları tapılmadı.");
      router.push("/signin");
      return;
    }

    autologinAttempted.current = true;

    const performAutoLogin = async () => {
      try {
        // Step 1: Temporarily write tokens to sessionStorage so that the api helper
        // request interceptor will automatically pick it up and attach to headers.
        sessionStorage.setItem("accessToken", token);
        sessionStorage.setItem("refreshToken", refreshToken);

        // Step 2: Exchange the standard frontend token for a permissioned admin token
        const response = await api.post("/admin/auth/exchange-token");
        const { accessToken, refreshToken: newRefreshToken, user: userData, permissions: perms } = response.data;

        // Step 3: Login using AuthContext to properly set React state, cookies, storage, etc.
        // We will default to rememberMe = true so the session persists in localStorage.
        login(accessToken, newRefreshToken, userData, true, perms ?? []);

        toast.success("Avtomatik giriş uğurla tamamlandı!");

        // Step 4: Redirect to the admin dashboard
        router.push("/");
      } catch (error: any) {
        console.error("Auto-login error:", error);

        // Clean up in case of failure
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("refreshToken");

        toast.error("Avtomatik giriş zamanı xəta baş verdi.");
        router.push("/signin");
      }
    };

    performAutoLogin();
  }, [searchParams, login, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 max-w-md mx-auto my-12">
      <div className="size-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-6"></div>
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
        {status}
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Zəhmət olmasa gözləyin, səlahiyyətləriniz yoxlanılır...
      </p>
    </div>
  );
}

export default function AutoLoginPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-[300px] text-center p-6 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 max-w-md mx-auto my-12">
        <div className="size-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
          Giriş səhifəsi yüklənir...
        </h2>
      </div>
    }>
      <AutoLoginContent />
    </Suspense>
  );
}
