"use client";
import React, { useState } from "react";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import api from "@/utils/api";
import toast from "react-hot-toast";

export default function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("Yeni şifrələr uyğun gəlmir");
      return;
    }

    setLoading(true);
    const promise = api.post("/admin/auth/change-password", {
      currentPassword,
      newPassword,
      confirmNewPassword: confirmPassword
    });

    toast.promise(promise, {
      loading: "Şifrə yenilənir...",
      success: (res: any) => res.data?.message || "Şifrə uğurla dəyişdirildi",
      error: (err: any) => err.response?.data?.message || "Şifrəni dəyişmək mümkün olmadı"
    });

    try {
      await promise;
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      // Error handled by toast.promise
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
        Şifrəni Dəyiş
      </h4>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-7">
          <div>
            <Label>Hazırkı Şifrə</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Yeni Şifrə</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Yeni Şifrəni Təsdiqlə</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? "Dəyişdirilir..." : "Şifrəni Yenilə"}
          </Button>
        </div>
      </form>
    </div>
  );
}
