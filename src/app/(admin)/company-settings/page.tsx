'use client';
import PermissionGuard from '@/components/auth/PermissionGuard';

import { useState, useEffect } from 'react';
import { adminService } from '@/services/admin.service';
import toast from 'react-hot-toast';

function CompanySettingsPageContent() {
  const [settings, setSettings] = useState({
    companyName: '',
    address: '',
    voen: '',
    email: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    adminService.getCompanySettings()
      .then(data => setSettings(data))
      .catch(() => toast.error('Məlumatları yükləmək mümkün olmadı'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await adminService.updateCompanySettings(settings);
      toast.success('Məlumatlar uğurla yeniləndi');
    } catch {
      toast.error('Xəta baş verdi');
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-semibold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all";
  const labelClass = "block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5";

  if (isLoading) return (
    <div className="flex justify-center items-center py-20">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600"></div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">İnvoys Şirkət Məlumatları</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">İnvoys və hesabat üçün şirkət məlumatlarını tənzimləyin</p>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={labelClass}>Şirkət Adı</label>
            <input
              type="text"
              value={settings.companyName}
              onChange={e => setSettings({ ...settings, companyName: e.target.value })}
              className={inputClass}
              placeholder="ElanAz MMC"
              required
            />
          </div>

          <div>
            <label className={labelClass}>Ünvan</label>
            <input
              type="text"
              value={settings.address}
              onChange={e => setSettings({ ...settings, address: e.target.value })}
              className={inputClass}
              placeholder="Bakı şəhəri, Azərbaycan"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>VÖEN</label>
              <input
                type="text"
                value={settings.voen}
                onChange={e => setSettings({ ...settings, voen: e.target.value })}
                className={inputClass}
                placeholder="1234567890"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={settings.email}
                onChange={e => setSettings({ ...settings, email: e.target.value })}
                className={inputClass}
                placeholder="support@2el.az"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-3 rounded-xl bg-brand-500 text-white text-sm font-bold hover:bg-brand-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
          >
            {isSaving ? (
              <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>Saxlanılır...</>
            ) : 'Yadda Saxla'}
          </button>
        </form>
      </div>
    </div>
  );
}
export default function CompanySettingsPage() {
  return (
    <PermissionGuard roles={["SuperAdmin", "Admin"]}>
      <CompanySettingsPageContent />
    </PermissionGuard>
  );
}