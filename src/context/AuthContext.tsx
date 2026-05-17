"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import api from "@/utils/api";

interface User {
  id: string;
  fullName: string;
  email: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  permissions: string[];
  loading: boolean;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  login: (token: string, refreshToken: string, userData: User, rememberMe?: boolean, permissions?: string[]) => void;
  logout: () => void;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

      if (token) {
        try {
          // Fetch fresh user data + permissions from server on load
          const response = await api.get("/admin/auth/me");
          const { data: userData, permissions: perms } = response.data;
          setUser(userData);
          setPermissions(perms ?? []);

          const storage = localStorage.getItem("accessToken") ? localStorage : sessionStorage;
          storage.setItem("user", JSON.stringify(userData));
          storage.setItem("permissions", JSON.stringify(perms ?? []));
        } catch (error) {
          console.error("Session verification failed", error);
          clearStorage();
          setUser(null);
          setPermissions([]);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const clearStorage = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("permissions");
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("permissions");
    Cookies.remove("accessToken");
  };

  const login = (
    token: string,
    refreshToken: string,
    userData: User,
    rememberMe: boolean = false,
    perms: string[] = []
  ) => {
    const storage = rememberMe ? localStorage : sessionStorage;

    storage.setItem("accessToken", token);
    storage.setItem("refreshToken", refreshToken);
    storage.setItem("user", JSON.stringify(userData));
    storage.setItem("permissions", JSON.stringify(perms));

    Cookies.set("accessToken", token, { expires: rememberMe ? 30 : undefined });

    setUser(userData);
    setPermissions(perms);
  };

  const logout = async () => {
    const accessToken = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken") || sessionStorage.getItem("refreshToken");

    if (accessToken && refreshToken) {
      try {
        await api.post("/admin/auth/logout", { accessToken, refreshToken });
      } catch (e) {
        console.error("Server logout failed", e);
      }
    }

    clearStorage();
    setUser(null);
    setPermissions([]);
    router.push("/signin");
  };

  const updateUser = (userData: User) => {
    if (localStorage.getItem("accessToken")) {
      localStorage.setItem("user", JSON.stringify(userData));
    } else {
      sessionStorage.setItem("user", JSON.stringify(userData));
    }
    setUser(userData);
  };

  const hasPermission = (permission: string): boolean => {
    // SuperAdmin has all permissions
    if (user?.roles?.includes("SuperAdmin")) return true;
    return permissions.includes(permission);
  };

  const hasRole = (role: string): boolean => {
    return user?.roles?.includes(role) ?? false;
  };

  return (
    <AuthContext.Provider value={{ user, permissions, loading, hasPermission, hasRole, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
