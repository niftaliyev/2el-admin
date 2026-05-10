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
  loading: boolean;
  login: (token: string, refreshToken: string, userData: User, rememberMe?: boolean) => void;
  logout: () => void;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      // Check both storages
      const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
      
      if (token) {
        try {
          // Fetch fresh user data from server on load
          const response = await api.get("/admin/auth/me");
          const userData = response.data;
          setUser(userData);
          
          if (localStorage.getItem("accessToken")) {
            localStorage.setItem("user", JSON.stringify(userData));
          } else {
            sessionStorage.setItem("user", JSON.stringify(userData));
          }
        } catch (error) {
          console.error("Session verification failed", error);
          // If verification fails, clear both
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          sessionStorage.removeItem("accessToken");
          sessionStorage.removeItem("refreshToken");
          sessionStorage.removeItem("user");
          Cookies.remove("accessToken");
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = (token: string, refreshToken: string, userData: User, rememberMe: boolean = false) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    
    storage.setItem("accessToken", token);
    storage.setItem("refreshToken", refreshToken);
    storage.setItem("user", JSON.stringify(userData));
    
    // Set cookie expiry based on rememberMe
    Cookies.set("accessToken", token, { expires: rememberMe ? 30 : undefined });
    
    setUser(userData);
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

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("user");
    Cookies.remove("accessToken");
    setUser(null);
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

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
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
