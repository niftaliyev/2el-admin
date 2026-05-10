"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import React, { useState } from "react";
import api from "@/utils/api";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

export default function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    role: "Admin",
    securityCode: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isChecked) {
      toast.error("Zəhmət olmasa şərtləri qəbul edin.");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);

    const promise = api.post("/admin/auth/register", formData);

    toast.promise(promise, {
      loading: "Qeydiyyat tamamlanır...",
      success: "Qeydiyyat uğurla tamamlandı!",
      error: (err: any) => {
        const errorData = err.response?.data;
        if (typeof errorData === 'object' && !errorData.message) {
          const firstError = Object.values(errorData)[0];
          return Array.isArray(firstError) ? firstError[0] : "Qeydiyyat zamanı xəta baş verdi.";
        }
        return err.response?.data?.message || "Qeydiyyat zamanı xəta baş verdi.";
      }
    });

    try {
      const response = await promise;
      const { accessToken, refreshToken, user } = response.data;

      setSuccess("Qeydiyyat uğurla tamamlandı! Giriş edilir...");
      login(accessToken, refreshToken, user);
      setTimeout(() => router.push("/"), 1500);
    } catch (err: any) {
      const errorData = err.response?.data;
      if (typeof errorData === 'object' && !errorData.message) {
        const firstError = Object.values(errorData)[0];
        setError(Array.isArray(firstError) ? firstError[0] : "Qeydiyyat zamanı xəta baş verdi.");
      } else {
        setError(err.response?.data?.message || "Qeydiyyat zamanı xəta baş verdi.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full max-w-lg mx-auto overflow-y-auto no-scrollbar">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Qeydiyyat
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Admin hesabı yaratmaq üçün məlumatları daxil edin!
            </p>
          </div>
          <div>
            {error && (
              <div className="p-3 mb-4 text-sm text-red-500 bg-red-100 rounded-lg dark:bg-red-500/10">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 mb-4 text-sm text-green-500 bg-green-100 rounded-lg dark:bg-green-500/10">
                {success}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="space-y-5">
                <div>
                  <Label>
                    Tam Ad<span className="text-error-500"> *</span>
                  </Label>
                  <Input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Tam adınızı daxil edin"
                    required
                  />
                </div>

                <div>
                  <Label>
                    E-poçt<span className="text-error-500"> *</span>
                  </Label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="E-poçtunuzu daxil edin"
                    required
                  />
                </div>

                <div>
                  <Label>
                    Telefon Nömrəsi<span className="text-error-500"> *</span>
                  </Label>
                  <Input
                    type="text"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="0501234567"
                    required
                  />
                </div>

                <div>
                  <Label>
                    Rol<span className="text-error-500"> *</span>
                  </Label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full h-11 px-4 py-2.5 text-sm font-normal text-gray-800 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-900 dark:border-gray-700 dark:text-white/90"
                    required
                  >
                    <option value="Admin">Admin</option>
                    <option value="Moderator">Moderator</option>
                  </select>
                </div>

                <div>
                  <Label>
                    Təhlükəsizlik Kodu<span className="text-error-500"> *</span>
                  </Label>
                  <Input
                    type="password"
                    name="securityCode"
                    value={formData.securityCode}
                    onChange={handleChange}
                    placeholder="Təhlükəsizlik kodunu daxil edin"
                    required
                  />
                </div>

                <div>
                  <Label>
                    Şifrə<span className="text-error-500"> *</span>
                  </Label>
                  <div className="relative">
                    <Input
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Şifrənizi daxil edin"
                      type={showPassword ? "text" : "password"}
                      required
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400" />
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Checkbox
                    className="w-5 h-5"
                    checked={isChecked}
                    onChange={setIsChecked}
                  />
                  <p className="inline-block font-normal text-gray-500 dark:text-gray-400 text-sm">
                    Hesab yaratmaqla siz{" "}
                    <span className="text-gray-800 dark:text-white/90">
                      İstifadə Şərtləri
                    </span>{" "}
                    və{" "}
                    <span className="text-gray-800 dark:text-white">
                      Məxfilik Siyasəti
                    </span>{" "}
                    ilə razılaşırsınız
                  </p>
                </div>
                <div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? "Gözləyin..." : "Qeydiyyatdan keç"}
                  </Button>
                </div>
              </div>
            </form>

            <div className="mt-5">
              <p className="text-sm font-normal text-center text-gray-700 dark:text-gray-400 sm:text-start">
                Artıq hesabınız var? {""}
                <Link
                  href="/signin"
                  className="text-brand-500 hover:text-brand-600 dark:text-brand-400"
                >
                  Daxil ol
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
