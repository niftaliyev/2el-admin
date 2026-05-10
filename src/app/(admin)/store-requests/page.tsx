'use client';

import { useState, useEffect } from 'react';
import { adminService } from '@/services/admin.service';
import toast from 'react-hot-toast';

export default function AdminStoreRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      // Using the store service via admin endpoint
      const response = await import('@/utils/api').then(m => m.default.get('/admin/store-requests'));
      setRequests(response.data ?? []);
    } catch {
      toast.error('Sorğuları yükləmək mümkün olmadı');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    if (!confirm('Bu mağaza sorğusunu təsdiqləmək istədiyinizə əminsiniz?')) return;
    setIsProcessing(true);
    try {
      await import('@/utils/api').then(m => m.default.post(`/admin/store-requests/${id}/approve`));
      toast.success('Mağaza uğurla yaradıldı');
      fetchRequests();
      setSelectedRequest(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Xəta baş verdi');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Rədd etmə səbəbi:');
    if (reason === null) return;
    setIsProcessing(true);
    try {
      await import('@/utils/api').then(m => m.default.post(`/admin/store-requests/${id}/reject`, JSON.stringify(reason), { headers: { 'Content-Type': 'application/json' } }));
      toast.success('Sorğu rədd edildi');
      fetchRequests();
      setSelectedRequest(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Xəta baş verdi');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu müraciəti tamamilə silmək istədiyinizə əminsiniz?')) return;
    setIsProcessing(true);
    try {
      await import('@/utils/api').then(m => m.default.delete(`/admin/store-requests/${id}`));
      toast.success('Müraciət silindi');
      fetchRequests();
      setSelectedRequest(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Xəta baş verdi');
    } finally {
      setIsProcessing(false);
    }
  };

  const statusBadge = (status: number) => {
    const map: Record<number, string> = {
      0: 'bg-warning-100 text-warning-600 dark:bg-warning-900/20 dark:text-warning-400',
      1: 'bg-success-100 text-success-600 dark:bg-success-900/20 dark:text-success-400',
      2: 'bg-error-100 text-error-600 dark:bg-error-900/20 dark:text-error-400',
    };
    return map[status] || 'bg-gray-100 text-gray-600';
  };

  const statusLabel = (status: number) => {
    return status === 0 ? 'Gözləmədə' : status === 1 ? 'Təsdiqlənib' : 'Rədd edilib';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mağaza Sorğuları</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Yeni mağaza açmaq istəyən istifadəçilərin müraciətləri</p>
        </div>
        <button
          onClick={fetchRequests}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Yenilə
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-16 flex flex-col items-center justify-center">
          <svg className="w-16 h-16 text-gray-200 dark:text-gray-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Heç bir sorğu tapılmadı</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map(req => (
            <div
              key={req.id}
              className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-sm transition-all cursor-pointer"
              onClick={() => setSelectedRequest(req)}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center overflow-hidden shrink-0">
                  {req.logoUrl ? (
                    <img src={req.logoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold text-gray-900 dark:text-white">{req.storeName}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusBadge(req.status)}`}>{statusLabel(req.status)}</span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      {req.fullName}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      {req.phoneNumber}
                    </span>
                    <span className="text-brand-500 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                      {req.categoryNames?.slice(0, 2).join(', ')}{req.categoryNames?.length > 2 ? '...' : ''}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                  {req.status === 0 && (
                    <>
                      <button onClick={() => handleReject(req.id)} className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-error-200 dark:border-error-800 text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors">Rədd et</button>
                      <button onClick={() => handleApprove(req.id)} className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-success-500 text-white hover:bg-success-600 transition-colors shadow-sm">Təsdiqlə</button>
                    </>
                  )}
                  <button onClick={() => handleDelete(req.id)} className="p-1.5 rounded-xl text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setSelectedRequest(null)} />
          <div className="relative bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Sorğu Detalları</h3>
              <button onClick={() => setSelectedRequest(null)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Store Info */}
                <div>
                  <h4 className="text-xs font-bold text-brand-500 uppercase tracking-wider mb-3 bg-brand-50 dark:bg-brand-900/20 px-3 py-1.5 rounded-lg w-fit">Mağaza Məlumatları</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase mb-0.5">Mağaza adı</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedRequest.storeName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase mb-1">Kateqoriyalar</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedRequest.categoryNames?.map((name: string) => (
                          <span key={name} className="px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400">{name}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase mb-1">Təsvir</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800 p-3 rounded-xl">{selectedRequest.description || 'Qeyd yoxdur'}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg w-fit">Əlaqə Məlumatları</h4>
                  <div className="space-y-3">
                    {[
                      { icon: '👤', label: 'Sahib', value: `${selectedRequest.fullName} (@${selectedRequest.userName})` },
                      { icon: '📞', label: 'Telefon', value: selectedRequest.phoneNumber },
                      { icon: '📧', label: 'E-mail', value: selectedRequest.email },
                      { icon: '📅', label: 'Tarix', value: new Date(selectedRequest.createdAt).toLocaleString('az-AZ') },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-base shrink-0">{item.icon}</div>
                        <div>
                          <p className="text-xs text-gray-400 font-semibold uppercase">{item.label}</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Images */}
              {(selectedRequest.logoUrl || selectedRequest.coverUrl) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedRequest.logoUrl && (
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase mb-2">Loqo</p>
                      <div className="aspect-square rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                        <img src={selectedRequest.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}
                  {selectedRequest.coverUrl && (
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase mb-2">Cover Foto</p>
                      <div className="aspect-video rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
                        <img src={selectedRequest.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => handleDelete(selectedRequest.id)}
                  disabled={isProcessing}
                  className="flex-1 py-3 rounded-xl text-sm font-bold border border-error-200 dark:border-error-800 text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors disabled:opacity-60"
                >
                  Sil
                </button>
                {selectedRequest.status === 0 && (
                  <>
                    <button
                      onClick={() => handleReject(selectedRequest.id)}
                      disabled={isProcessing}
                      className="flex-1 py-3 rounded-xl text-sm font-bold border border-warning-200 dark:border-warning-800 text-warning-600 hover:bg-warning-50 dark:hover:bg-warning-900/20 transition-colors disabled:opacity-60"
                    >
                      Rədd et
                    </button>
                    <button
                      onClick={() => handleApprove(selectedRequest.id)}
                      disabled={isProcessing}
                      className="flex-1 py-3 rounded-xl text-sm font-bold bg-success-500 text-white hover:bg-success-600 transition-colors disabled:opacity-60"
                    >
                      Təsdiqlə
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
