'use client';
import PermissionGuard from '@/components/auth/PermissionGuard';

import { useState, useEffect } from 'react';
import { adminService } from '@/services/admin.service';
import toast from 'react-hot-toast';

function AdminAdApplicationsPageContent() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [filter, setFilter] = useState<boolean | undefined>(undefined);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => { fetchApplications(); }, [pagination.page, filter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAdApplications(pagination.page, 10, filter);
      setApplications(data.data);
      setPagination(p => ({ ...p, totalPages: data.totalPages }));
    } catch {
      toast.error('Müraciətləri yükləmək mümkün olmadı');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (app: any) => {
    setSelectedApp(app);
    setAdminNote(app.adminNote || '');
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async (id: string, isProcessed: boolean, note?: string) => {
    try {
      setIsProcessing(id);
      await adminService.updateAdApplicationStatus(id, isProcessed, note);
      toast.success('Müraciət statusu yeniləndi');
      setIsModalOpen(false);
      fetchApplications();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Xəta baş verdi');
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reklam Müraciətləri</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Saytda reklam yerləşdirmək istəyən şəxslərin müraciətləri</p>
        </div>
        {/* Filter Tabs */}
        <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          {[
            { label: 'Hamısı', value: undefined },
            { label: 'Gözləyən', value: false },
            { label: 'İşlənmiş', value: true },
          ].map(f => (
            <button
              key={String(f.value)}
              onClick={() => { setFilter(f.value); setPagination(p => ({ ...p, page: 1 })); }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                filter === f.value
                  ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600"></div>
        </div>
      ) : applications.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-16 flex flex-col items-center justify-center">
          <svg className="w-16 h-16 text-gray-200 dark:text-gray-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Heç bir müraciət tapılmadı</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map(app => (
            <div key={app.id} className={`rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 transition-all ${app.isProcessed ? 'opacity-75' : 'hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-sm'}`}>
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">{app.fullName}</h3>
                    {app.companyName && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400">{app.companyName}</span>
                    )}
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${app.isProcessed ? 'bg-success-100 text-success-600 dark:bg-success-900/20 dark:text-success-400' : 'bg-warning-100 text-warning-600 dark:bg-warning-900/20 dark:text-warning-400'}`}>
                      {app.isProcessed ? 'İşlənib' : 'Gözləyir'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <a href={`tel:${app.phoneNumber}`} className="flex items-center gap-1.5 hover:text-brand-500 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      {app.phoneNumber}
                    </a>
                    <a href={`mailto:${app.email}`} className="flex items-center gap-1.5 hover:text-brand-500 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      {app.email}
                    </a>
                    <span className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {new Date(app.createdDate).toLocaleDateString('az-AZ')}
                    </span>
                  </div>

                  {(app.message || app.adminNote) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                      {app.message && (
                        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 italic">
                          <span className="text-xs font-bold text-gray-400 not-italic block mb-1">Mesaj</span>
                          {app.message}
                        </div>
                      )}
                      {app.adminNote && (
                        <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800 text-sm text-brand-700 dark:text-brand-300">
                          <span className="text-xs font-bold text-brand-500 block mb-1">Admin Qeydi</span>
                          {app.adminNote}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenModal(app)}
                    disabled={isProcessing === app.id}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      app.isProcessed
                        ? 'border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                        : 'bg-brand-500 text-white hover:bg-brand-600 shadow-sm'
                    }`}
                  >
                    {app.isProcessed ? 'Redaktə et' : 'İşlə'}
                  </button>
                  {app.isProcessed && (
                    <button
                      onClick={() => handleUpdateStatus(app.id, false, app.adminNote)}
                      disabled={isProcessing === app.id}
                      className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-warning-200 dark:border-warning-800 text-warning-600 dark:text-warning-400 hover:bg-warning-50 dark:hover:bg-warning-900/20 transition-colors"
                    >
                      Gözləyənə qaytar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPagination(p => ({ ...p, page: i + 1 }))}
              className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${
                pagination.page === i + 1
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Process Modal */}
      {isModalOpen && selectedApp && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Müraciəti İşlə</h3>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Müraciətçi</p>
              <p className="font-bold text-gray-900 dark:text-white">{selectedApp.fullName}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{selectedApp.phoneNumber}</p>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Admin Qeydi</label>
              <textarea
                rows={4}
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                placeholder="Müraciət haqqında qeydlərinizi bura yazın..."
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Ləğv et</button>
              <button
                onClick={() => handleUpdateStatus(selectedApp.id, true, adminNote)}
                disabled={isProcessing === selectedApp.id}
                className="flex-1 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-bold hover:bg-brand-600 transition-colors disabled:opacity-60"
              >
                Yadda Saxla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default function AdminAdApplicationsPage() {
  return (
    <PermissionGuard permission="Banners_Manage">
      <AdminAdApplicationsPageContent />
    </PermissionGuard>
  );
}