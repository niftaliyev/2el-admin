'use client';
import PermissionGuard from '@/components/auth/PermissionGuard';

import { useState, useEffect } from 'react';
import { adminService } from '@/services/admin.service';
import toast from 'react-hot-toast';

function AdminPaymentDetailsPageContent() {
  const [content, setContent] = useState('');
  const [minBalance, setMinBalance] = useState<number>(50);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSettingsSubmitting, setIsSettingsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [paymentRes, balanceRes] = await Promise.all([
          adminService.getPaymentDetail(),
          adminService.getMinStoreBalance()
        ]);
        if (paymentRes?.content) setContent(paymentRes.content);
        setMinBalance(balanceRes);
      } catch (err) {
        console.error('Failed to fetch data', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await adminService.updatePaymentDetail(content);
      toast.success('Ödəniş məlumatları uğurla yeniləndi');
    } catch {
      toast.error('Ödəniş məlumatları yenilənərkən xəta baş verdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSettingsSubmitting(true);
    try {
      await adminService.updateSystemSettings(minBalance);
      toast.success('Sistem tənzimləmələri uğurla yeniləndi');
    } catch {
      toast.error('Tənzimləmələr yenilənərkən xəta baş verdi');
    } finally {
      setIsSettingsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Tənzimləmələri</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Platforma və ödəniş tənzimləmələrini idarə edin</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Details */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">Ödəniş Rekvizitləri</h3>
          </div>
          <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={12}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none font-mono"
              placeholder={'Məsələn:\n🔹 BANK: ABB\n🔹 HESAB: 1234...\n🔹 AD: ElanAz'}
              required
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSubmitting ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white dark:border-gray-900/30 dark:border-t-gray-900"></div>Saxlanılır...</> : 'Yadda Saxla'}
            </button>
          </form>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-success-50 dark:bg-success-900/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wider">Mağaza Tələbləri</h3>
            </div>
            <form onSubmit={handleSettingsSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Minimum Balans (₼)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={minBalance}
                    onChange={e => setMinBalance(Number(e.target.value))}
                    className="w-full pr-8 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-2xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="50"
                    min={0}
                    required
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₼</span>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">İstifadəçi mağaza müraciəti göndərmək üçün balansında ən azı bu məbləğ olmalıdır.</p>
              </div>
              <button
                type="submit"
                disabled={isSettingsSubmitting}
                className="w-full py-3 rounded-xl bg-brand-500 text-white text-sm font-bold hover:bg-brand-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isSettingsSubmitting ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>Yenilənir...</> : 'Yenilə'}
              </button>
            </form>
          </div>

          <div className="rounded-2xl bg-brand-900 dark:bg-brand-950 p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">Məlumat</span>
            </div>
            <p className="text-sm text-brand-200 leading-relaxed opacity-80">
              Minimum balans tələbi spam sorğuların qarşısını almaq üçündür. Dəyişiklik real vaxtda müraciət sisteminə tətbiq olunur.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
export default function AdminPaymentDetailsPage() {
  return (
    <PermissionGuard roles={["SuperAdmin", "Admin"]}>
      <AdminPaymentDetailsPageContent />
    </PermissionGuard>
  );
}