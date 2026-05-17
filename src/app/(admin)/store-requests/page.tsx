'use client';
import PermissionGuard from '@/components/auth/PermissionGuard';

import { useState, useEffect } from 'react';
import { adminService } from '@/services/admin.service';
import toast from 'react-hot-toast';
import { Modal, ConfirmationModal } from '@/components/ui/modal';

function AdminStoreRequestsPageContent() {
  const [requests, setRequests] = useState<any[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [rejectModal, setRejectModal] = useState<{
    isOpen: boolean;
    requestId: string | null;
    reason: string;
  }>({
    isOpen: false,
    requestId: null,
    reason: '',
  });

  const [approveModal, setApproveModal] = useState<{
    isOpen: boolean;
    requestId: string | null;
    packageId: string;
    duration: number;
  }>({
    isOpen: false,
    requestId: null,
    packageId: '',
    duration: 30,
  });

  useEffect(() => {
    fetchRequests();
  }, [currentPage, statusFilter]);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const statusValue = statusFilter === 'pending' ? 0 : statusFilter === 'approved' ? 1 : statusFilter === 'rejected' ? 2 : null;
      const statusParam = statusValue !== null ? `&status=${statusValue}` : '';
      
      const response = await import('@/utils/api').then(m => 
        m.default.get(`/admin/store-requests?page=${currentPage}&pageSize=${pageSize}${statusParam}`)
      );
      
      setRequests(response.data.data ?? []);
      setTotalElements(response.data.totalElements ?? 0);
    } catch {
      toast.error('Sorğuları yükləmək mümkün olmadı');
    } finally {
      setLoading(false);
    }
  };

  const fetchPackages = async () => {
    try {
      const response = await import('@/utils/api').then(m => m.default.get('/admin/business-packages'));
      setPackages(response.data ?? []);
    } catch (error) {
      console.error('Packages fetch error:', error);
    }
  };

  const handleApproveClick = (req: any) => {
    setSelectedRequest(null);
    setApproveModal({
      isOpen: true,
      requestId: req.id,
      packageId: '',
      duration: 30,
    });
  };

  const submitApprove = async () => {
    if (!approveModal.requestId) return;
    setIsProcessing(true);
    try {
      await import('@/utils/api').then(m => 
        m.default.post(`/admin/store-requests/${approveModal.requestId}/approve`, {
          businessPackageId: approveModal.packageId || null,
          durationDays: approveModal.duration
        })
      );
      toast.success('Mağaza uğurla yaradıldı');
      setApproveModal({ isOpen: false, requestId: null, packageId: '', duration: 30 });
      fetchRequests();
      setSelectedRequest(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Xəta baş verdi');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = (id: string) => {
    setRejectModal({ isOpen: true, requestId: id, reason: '' });
  };

  const submitReject = async () => {
    if (!rejectModal.reason.trim()) {
      toast.error('Səbəb daxil edilməlidir');
      return;
    }
    setIsProcessing(true);
    try {
      await import('@/utils/api').then(m => m.default.post(`/admin/store-requests/${rejectModal.requestId}/reject`, JSON.stringify(rejectModal.reason), { headers: { 'Content-Type': 'application/json' } }));
      toast.success('Sorğu rədd edildi');
      setRejectModal({ isOpen: false, requestId: null, reason: '' });
      fetchRequests();
      setSelectedRequest(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Xəta baş verdi');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Müraciəti Sil',
      message: 'Bu müraciəti tamamilə silmək istədiyinizə əminsiniz?',
      onConfirm: async () => {
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
      },
    });
  };

  const getStatusNumber = (status: any) => {
    if (typeof status === 'number') return status;
    if (status === 'Pending') return 0;
    if (status === 'Approved') return 1;
    if (status === 'Rejected') return 2;
    return 0; // Default to pending if unsure
  };

  const statusBadge = (status: any) => {
    const s = getStatusNumber(status);
    const map: Record<number, string> = {
      0: 'bg-warning-100 text-warning-600 dark:bg-warning-900/20 dark:text-warning-400',
      1: 'bg-success-100 text-success-600 dark:bg-success-900/20 dark:text-success-400',
      2: 'bg-error-100 text-error-600 dark:bg-error-900/20 dark:text-error-400',
    };
    return map[s] || 'bg-gray-100 text-gray-600';
  };

  const statusLabel = (status: any) => {
    const s = getStatusNumber(status);
    return s === 0 ? 'Gözləmədə' : s === 1 ? 'Təsdiqlənib' : 'Rədd edilib';
  };

  const totalPages = Math.ceil(totalElements / pageSize);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mağaza Sorğuları</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Yeni mağaza açmaq istəyən istifadəçilərin müraciətləri</p>
        </div>
        
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
          {[
            { id: 'pending', label: 'Gözləmədə', count: requests.filter(r => getStatusNumber(r.status) === 0).length },
            { id: 'approved', label: 'Təsdiqlənib', count: requests.filter(r => getStatusNumber(r.status) === 1).length },
            { id: 'rejected', label: 'Rədd edilib', count: requests.filter(r => getStatusNumber(r.status) === 2).length },
            { id: 'all', label: 'Hamısı', count: requests.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:border-brand-300 dark:hover:border-brand-700'
              }`}
            >
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${statusFilter === tab.id ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-800'}`}>
                {tab.count}
              </span>
            </button>
          ))}
          <button
            onClick={fetchRequests}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shrink-0"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600"></div>
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-16 flex flex-col items-center justify-center bg-white/50 dark:bg-gray-900/50">
          <svg className="w-16 h-16 text-gray-200 dark:text-gray-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Heç bir sorğu tapılmadı</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {requests.map(req => (
              <div
                key={req.id}
                className="group rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 lg:p-5 hover:border-brand-500/50 hover:shadow-xl hover:shadow-brand-500/5 transition-all cursor-pointer relative overflow-hidden"
                onClick={() => setSelectedRequest(req)}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-5">
                  {/* Top info for mobile / Left for desktop */}
                  <div className="flex items-center gap-4 w-full lg:w-auto">
                    <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                      {req.logoUrl ? (
                        <img src={req.logoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                      )}
                    </div>
                    <div className="lg:hidden flex-1 min-w-0">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white truncate">{req.storeName}</h3>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${statusBadge(req.status)}`}>
                        {statusLabel(req.status)}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="hidden lg:flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-brand-500 transition-colors">{req.storeName}</h3>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusBadge(req.status)}`}>
                        {statusLabel(req.status)}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[10px]">👤</div>
                        {req.fullName}
                      </span>
                      <span className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[10px]">📞</div>
                        {req.phoneNumber}
                      </span>
                      <span className="flex items-center gap-2 text-brand-500 font-medium lg:col-span-2">
                        <div className="w-5 h-5 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-[10px]">🏷️</div>
                        {req.categoryNames?.slice(0, 3).join(', ')}{req.categoryNames?.length > 3 ? '...' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex lg:flex-col items-center lg:items-end gap-2 w-full lg:w-auto pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100 dark:border-gray-800" onClick={e => e.stopPropagation()}>
                    {getStatusNumber(req.status) === 0 && (
                      <div className="flex lg:flex-col gap-2 flex-1 lg:flex-none">
                        <button 
                          onClick={() => handleApproveClick(req)} 
                          className="flex-1 lg:flex-none px-4 py-2 rounded-xl text-xs font-bold bg-success-500 text-white hover:bg-success-600 hover:shadow-lg hover:shadow-success-500/20 transition-all"
                        >
                          Təsdiqlə
                        </button>
                        <button 
                          onClick={() => handleReject(req.id)} 
                          className="flex-1 lg:flex-none px-4 py-2 rounded-xl text-xs font-bold border border-warning-200 dark:border-warning-800 text-warning-600 hover:bg-warning-50 dark:hover:bg-warning-900/20 transition-all"
                        >
                          Rədd et
                        </button>
                      </div>
                    )}
                    <button 
                      onClick={() => handleDelete(req.id)} 
                      className="p-2.5 rounded-xl text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 transition-all ml-auto lg:ml-0"
                      title="Sil"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-white dark:bg-gray-900 px-6 py-4 rounded-2xl border border-gray-200 dark:border-gray-800">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 text-sm font-medium rounded-xl text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 disabled:opacity-50"
                >
                  Geri
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 text-sm font-medium rounded-xl text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 disabled:opacity-50"
                >
                  İrəli
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-400">
                    <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span>
                    {'-'}
                    <span className="font-medium">{Math.min(currentPage * pageSize, totalElements)}</span>
                    {' / '}
                    <span className="font-medium">{totalElements}</span> müraciət
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px gap-2" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center p-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                          currentPage === page
                            ? 'z-10 bg-brand-500 border-brand-500 text-white shadow-lg shadow-brand-500/20'
                            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center p-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Approve Modal (Package Selection) */}
      <Modal
        isOpen={approveModal.isOpen}
        onClose={() => setApproveModal(prev => ({ ...prev, isOpen: false }))}
        title="Mağaza Sorğusunu Təsdiqlə"
        className="max-w-lg"
      >
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-success-50 dark:bg-success-900/10 border border-success-100 dark:border-success-900/20">
            <p className="text-sm text-success-700 dark:text-success-400 leading-relaxed font-medium">
              Mağaza yaradılacaq və istifadəçiyə bildiriş göndəriləcək. İstəyə görə aşağıdakı biznes paketlərdən birini seçib mağazanı birbaşa paketlə aktivləşdirə bilərsiniz.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                Biznes Paket Seçimi (Könüllü)
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                <button
                  onClick={() => setApproveModal(prev => ({ ...prev, packageId: '' }))}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    approveModal.packageId === ''
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                      : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 bg-white dark:bg-gray-900'
                  }`}
                >
                  <div className="text-left">
                    <p className="font-bold text-gray-900 dark:text-white">Paketsiz</p>
                    <p className="text-xs text-gray-500">Yalnız mağaza yaradılacaq</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${approveModal.packageId === '' ? 'border-brand-500' : 'border-gray-300'}`}>
                    {approveModal.packageId === '' && <div className="w-2.5 h-2.5 rounded-full bg-brand-500" />}
                  </div>
                </button>

                {packages.map(pkg => (
                  <button
                    key={pkg.id}
                    onClick={() => setApproveModal(prev => ({ ...prev, packageId: pkg.id }))}
                    className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                      approveModal.packageId === pkg.id
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                        : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 bg-white dark:bg-gray-900'
                    }`}
                  >
                    <div className="text-left">
                      <p className="font-bold text-gray-900 dark:text-white">{pkg.name}</p>
                      <p className="text-xs text-gray-500">{pkg.basePrice} AZN / 30 gün • {pkg.adLimit} Elan Limiti</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${approveModal.packageId === pkg.id ? 'border-brand-500' : 'border-gray-300'}`}>
                      {approveModal.packageId === pkg.id && <div className="w-2.5 h-2.5 rounded-full bg-brand-500" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {approveModal.packageId && (
              <div className="animate-in fade-in slide-in-from-top-2 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    Müddət
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[30, 60, 90, 180].map(days => (
                      <button
                        key={days}
                        onClick={() => setApproveModal(prev => ({ ...prev, duration: days }))}
                        className={`py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${
                          approveModal.duration === days
                            ? 'border-brand-500 bg-brand-500 text-white'
                            : 'border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:border-brand-500/30'
                        }`}
                      >
                        {days} gün
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Məbləğ:</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {(packages.find(p => p.id === approveModal.packageId)?.basePrice * (approveModal.duration / 30)).toFixed(2)} AZN
                    </span>
                  </div>
                  {approveModal.duration > 30 && (
                    <div className="flex items-center justify-between mb-2 text-success-600">
                      <span className="text-sm">Müddət Endirimi:</span>
                      <span className="font-bold">
                        -{packages.find(p => p.id === approveModal.packageId)?.[`discount${approveModal.duration}Days`]}%
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                    <span className="text-base font-bold text-gray-900 dark:text-white">Yekun:</span>
                    <span className="text-xl font-black text-brand-500">
                      {(() => {
                        const pkg = packages.find(p => p.id === approveModal.packageId);
                        if (!pkg) return '0.00';
                        const periods = approveModal.duration / 30;
                        const baseTotal = pkg.basePrice * periods;
                        const discount = pkg[`discount${approveModal.duration}Days`] || 0;
                        return (baseTotal * (1 - discount / 100)).toFixed(2);
                      })()} AZN
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setApproveModal(prev => ({ ...prev, isOpen: false }))}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              Ləğv et
            </button>
            <button
              onClick={submitApprove}
              disabled={isProcessing}
              className="flex-1 px-4 py-3 rounded-xl bg-success-500 text-white text-sm font-bold hover:bg-success-600 transition-all shadow-lg shadow-success-500/20 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isProcessing && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
              Təsdiqlə və Yarat
            </button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/70 backdrop-blur-md" onClick={() => setSelectedRequest(null)} />
          <div className="relative bg-white dark:bg-gray-950 w-full max-w-2xl rounded-3xl shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800 px-8 py-5 flex items-center justify-between z-10">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Sorğu Detalları</h3>
                <p className="text-xs text-gray-500 mt-0.5">Müraciət ID: {selectedRequest.id}</p>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="p-2.5 rounded-2xl bg-gray-100 dark:bg-gray-900 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-5 lg:p-8 space-y-6 lg:space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                {/* Store Info */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-bold text-brand-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-500"></div>
                      Mağaza Məlumatları
                    </h4>
                    <div className="space-y-4">
                      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-1 tracking-wider">Mağaza adı</p>
                        <p className="text-lg font-black text-gray-900 dark:text-white">{selectedRequest.storeName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-2 tracking-wider">Kateqoriyalar</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedRequest.categoryNames?.map((name: string) => (
                            <span key={name} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">{name}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-2 tracking-wider">Təsvir</p>
                        <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl italic border border-gray-100 dark:border-gray-800">
                          {selectedRequest.description || 'Qeyd yoxdur'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-6">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                    Əlaqə Məlumatları
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { icon: '👤', label: 'Sahib', value: selectedRequest.fullName, sub: `@${selectedRequest.userName}` },
                      { icon: '📞', label: 'Telefon', value: selectedRequest.phoneNumber },
                      { icon: '📧', label: 'E-mail', value: selectedRequest.email },
                      { icon: '📅', label: 'Tarix', value: new Date(selectedRequest.createdAt).toLocaleString('az-AZ') },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors group">
                        <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">{item.icon}</div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{item.label}</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white">{item.value}</p>
                          {item.sub && <p className="text-xs text-brand-500 font-medium">{item.sub}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Images */}
              {(selectedRequest.logoUrl || selectedRequest.coverUrl) && (
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                    Vizual Materiallar
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {selectedRequest.logoUrl && (
                      <div className="group">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-3 tracking-wider">Loqo</p>
                        <div className="aspect-square rounded-3xl overflow-hidden border-4 border-gray-50 dark:border-gray-900 shadow-xl group-hover:shadow-brand-500/10 transition-all">
                          <img src={selectedRequest.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}
                    {selectedRequest.coverUrl && (
                      <div className="group">
                        <p className="text-[10px] text-gray-400 font-bold uppercase mb-3 tracking-wider">Cover Foto</p>
                        <div className="aspect-video rounded-3xl overflow-hidden border-4 border-gray-50 dark:border-gray-900 shadow-xl group-hover:shadow-brand-500/10 transition-all">
                          <img src={selectedRequest.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={() => handleDelete(selectedRequest.id)}
                  disabled={isProcessing}
                  className="flex-1 py-4 rounded-2xl text-sm font-bold border border-error-200 dark:border-error-800 text-error-500 hover:bg-error-50 dark:hover:bg-error-950 transition-all disabled:opacity-60"
                >
                  Tamamilə Sil
                </button>
                {getStatusNumber(selectedRequest.status) === 0 && (
                  <>
                    <button
                      onClick={() => handleReject(selectedRequest.id)}
                      disabled={isProcessing}
                      className="flex-1 py-4 rounded-2xl text-sm font-bold border border-warning-200 dark:border-warning-800 text-warning-600 hover:bg-warning-50 dark:hover:bg-warning-950 transition-all disabled:opacity-60"
                    >
                      Müraciəti Rədd Et
                    </button>
                    <button
                      onClick={() => handleApproveClick(selectedRequest)}
                      disabled={isProcessing}
                      className="flex-1 py-4 rounded-2xl text-sm font-bold bg-brand-500 text-white hover:bg-brand-600 transition-all shadow-xl shadow-brand-500/20 disabled:opacity-60"
                    >
                      Təsdiqlə və Aktivləşdir
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModal.isOpen}
        onClose={() => setRejectModal(prev => ({ ...prev, isOpen: false }))}
        title="Sorğunu Rədd Et"
        className="max-w-md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Rədd etmə səbəbi
            </label>
            <textarea
              value={rejectModal.reason}
              onChange={e => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Səbəbi daxil edin (İstifadəçiyə bildiriləcək)..."
              className="w-full h-32 px-4 py-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none transition-all"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setRejectModal(prev => ({ ...prev, isOpen: false }))}
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
            >
              Geri
            </button>
            <button
              onClick={submitReject}
              disabled={isProcessing}
              className="flex-1 px-4 py-3 rounded-xl bg-error-500 text-white text-sm font-bold hover:bg-error-600 transition-all shadow-lg shadow-error-500/20 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isProcessing && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
              Rədd Et
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
export default function AdminStoreRequestsPage() {
  return (
    <PermissionGuard permission="Stores_Manage">
      <AdminStoreRequestsPageContent />
    </PermissionGuard>
  );
}