'use client';

import PermissionGuard from '@/components/auth/PermissionGuard';
import { useEffect, useState } from 'react';
import { adminService } from '@/services/admin.service';
import { useAuth } from '@/context/AuthContext';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface PromotionRequest {
  id: string;
  adId: string;
  adTitle: string;
  adPinCode: number;
  userId: string;
  userName: string;
  promotionPackageId: string;
  promotionPackageName: string;
  promotionPackageNameRu?: string;
  price: number;
  status: string; // "Pending", "Processing", "Completed", "Cancelled"
  phoneNumber: string;
  rejectReason?: string;
  adminNotes?: string;
  createdDate: string;
}

function PromotionRequestsPageContent() {
  const [requests, setRequests] = useState<PromotionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modal/Detail State
  const [selectedRequest, setSelectedRequest] = useState<PromotionRequest | null>(null);
  const [modalType, setModalType] = useState<'view' | 'process' | 'complete' | 'cancel' | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { hasPermission } = useAuth();
  const canManage = hasPermission('Promotions_Manage');

  useEffect(() => {
    fetchRequests();
  }, [page, statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await adminService.getPromotionRequests(statusFilter, page, 10);
      setRequests(response.data || []);
      setTotalPages(response.totalPages || 1);
      setTotalCount(response.totalCount || 0);
    } catch (error) {
      toast.error('Sosial/Video reklam sorğularını yükləyərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  const openActionModal = (request: PromotionRequest, type: 'view' | 'process' | 'complete' | 'cancel') => {
    setSelectedRequest(request);
    setModalType(type);
    setAdminNotes(request.adminNotes || '');
    setRejectReason(request.rejectReason || '');
  };

  const closeActionModal = () => {
    setSelectedRequest(null);
    setModalType(null);
    setAdminNotes('');
    setRejectReason('');
  };

  const handleUpdateStatus = async (status: number) => {
    if (!selectedRequest) return;
    if (status === 3 && !rejectReason.trim()) {
      toast.error('Ləğv edilmə səbəbi daxil edilməlidir');
      return;
    }

    try {
      setIsSaving(true);
      await adminService.updatePromotionRequestStatus(
        selectedRequest.id,
        status,
        adminNotes.trim() || undefined,
        status === 3 ? rejectReason.trim() : undefined
      );

      if (status === 1) toast.success('Sorğu emal statusuna keçirildi');
      if (status === 2) toast.success('Sorğu tamamlandı');
      if (status === 3) toast.success('Sorğu ləğv edildi və istifadəçi balansına ödəniş geri qaytarıldı');
      
      fetchRequests();
      closeActionModal();
    } catch (error: any) {
      toast.error(error.message || 'Status yenilənərkən xəta baş verdi');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('az-AZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Gözləyir
          </span>
        );
      case 'Processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Emal olunur
          </span>
        );
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            Tamamlandı
          </span>
        );
      case 'Cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            Ləğv edildi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-750">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sosial və Video Reklam Sorğuları</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Sosial media paketləri və video çəkiliş xidməti üçün müraciətlərə baxın və statuslarını idarə edin
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 overflow-x-auto no-scrollbar gap-2">
        {[
          { key: 'all', label: 'Hamısı' },
          { key: 'pending', label: 'Gözləyənlər' },
          { key: 'processing', label: 'Emal olunanlar' },
          { key: 'completed', label: 'Tamamlanmışlar' },
          { key: 'cancelled', label: 'Ləğv edilənlər' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setStatusFilter(tab.key);
              setPage(1);
            }}
            className={`py-2 px-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
              statusFilter === tab.key
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <svg className="w-16 h-16 text-gray-200 dark:text-gray-750 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Heç bir sorğu tapılmadı</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-850/50">
                  <th className="px-6 py-4 text-xs font-bold text-gray-550 dark:text-gray-400 uppercase tracking-wider">Tarix</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-550 dark:text-gray-400 uppercase tracking-wider">Elan</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-550 dark:text-gray-400 uppercase tracking-wider">İstifadəçi</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-550 dark:text-gray-400 uppercase tracking-wider">Paket</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-550 dark:text-gray-400 uppercase tracking-wider">Məbləğ</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-550 dark:text-gray-400 uppercase tracking-wider">Əlaqə nömrəsi</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-550 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-550 dark:text-gray-400 uppercase tracking-wider text-right">Əməliyyat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-850/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-450 whitespace-nowrap">
                      {formatDate(request.createdDate)}
                    </td>
                    <td className="px-6 py-4">
                      {request.adId ? (
                        <Link href={`/ads/${request.adId}`} className="hover:underline">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white max-w-[200px] truncate">{request.adTitle}</p>
                          <p className="text-xs text-gray-400">PİN: {request.adPinCode}</p>
                        </Link>
                      ) : (
                        <div>
                          <p className="text-sm font-semibold text-gray-450 italic">Silinmiş Elan</p>
                          <p className="text-xs text-gray-400">PİN: {request.adPinCode}</p>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Link href={`/users/${request.userId}`} className="hover:underline">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{request.userName}</p>
                        <p className="text-xs text-gray-400">ID: {request.userId.substring(0, 8)}...</p>
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {request.promotionPackageName}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {request.price} ₼
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {request.phoneNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => openActionModal(request, 'view')}
                          className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                        >
                          Ətraflı
                        </button>
                        
                        {canManage && request.status === 'Pending' && (
                          <button
                            onClick={() => openActionModal(request, 'process')}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-bold hover:bg-blue-600 transition-colors shadow-sm cursor-pointer"
                          >
                            Emal et
                          </button>
                        )}

                        {canManage && request.status === 'Processing' && (
                          <>
                            <button
                              onClick={() => openActionModal(request, 'complete')}
                              className="px-2.5 py-1.5 rounded-lg bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition-colors shadow-sm cursor-pointer"
                            >
                              Tamamla
                            </button>
                            <button
                              onClick={() => openActionModal(request, 'cancel')}
                              className="px-2.5 py-1.5 rounded-lg bg-red-650 text-white text-xs font-bold hover:bg-red-700 transition-colors shadow-sm cursor-pointer"
                            >
                              Ləğv et (Refund)
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-center disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex items-center px-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
            <span className="text-sm font-bold text-gray-900 dark:text-white">{page}</span>
            <span className="text-sm text-gray-400 mx-2">/</span>
            <span className="text-sm text-gray-400">{totalPages}</span>
          </div>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            className="w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-center disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Action / Detail Modal */}
      {selectedRequest && modalType && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm" onClick={closeActionModal} />
          
          <div className="relative max-w-xl w-full bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
            {/* Header */}
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 dark:text-white">
                {modalType === 'view' && 'Sorğu Məlumatları'}
                {modalType === 'process' && 'Sorğunun Emalına Başla'}
                {modalType === 'complete' && 'Sorğunu Tamamla'}
                {modalType === 'cancel' && 'Sorğunu Ləğv Et və Balansı Geri Qaytar'}
              </h3>
              <button onClick={closeActionModal} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors cursor-pointer">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-850/50 p-4 rounded-2xl text-sm border border-gray-100 dark:border-gray-800">
                <div>
                  <p className="text-xs text-gray-400 font-medium">Elan Başlığı / PİN</p>
                  <p className="font-semibold text-gray-950 dark:text-white truncate">
                    {selectedRequest.adTitle}
                  </p>
                  <p className="text-xs font-semibold text-brand-500">PİN: {selectedRequest.adPinCode}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">İstifadəçi</p>
                  <p className="font-semibold text-gray-950 dark:text-white">{selectedRequest.userName}</p>
                  <p className="text-xs text-gray-400">ID: {selectedRequest.userId.substring(0, 8)}...</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Alınmış Xidmət / Qiymət</p>
                  <p className="font-semibold text-gray-950 dark:text-white">
                    {selectedRequest.promotionPackageName}
                  </p>
                  <p className="text-xs font-bold text-success-600">{selectedRequest.price} ₼ (Ödənildi)</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Əlaqə nömrəsi</p>
                  <p className="font-semibold text-gray-950 dark:text-white">{selectedRequest.phoneNumber}</p>
                  <p className="text-xs text-gray-400">Sorğu Tarixi: {formatDate(selectedRequest.createdDate)}</p>
                </div>
              </div>

              {/* Status Section */}
              <div className="flex items-center gap-3 py-1">
                <span className="text-sm text-gray-500 font-semibold">Cari Status:</span>
                {getStatusBadge(selectedRequest.status)}
              </div>

              {/* Fields based on Modal Type */}
              {modalType === 'view' ? (
                <div className="space-y-3">
                  {selectedRequest.adminNotes && (
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Admin Qeydləri</p>
                      <div className="p-3 bg-gray-50 dark:bg-gray-850 border border-gray-150 dark:border-gray-800 rounded-xl text-sm text-gray-800 dark:text-gray-200">
                        {selectedRequest.adminNotes}
                      </div>
                    </div>
                  )}
                  {selectedRequest.rejectReason && (
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Ləğv edilmə Səbəbi</p>
                      <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 rounded-xl text-sm text-red-800 dark:text-red-300">
                        {selectedRequest.rejectReason}
                      </div>
                    </div>
                  )}
                  {!selectedRequest.adminNotes && !selectedRequest.rejectReason && (
                    <p className="text-xs text-gray-450 italic">Hər hansı admin qeydi və ya ləğv səbəbi daxil edilməyib.</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {modalType === 'cancel' && (
                    <div>
                      <label htmlFor="reject-reason" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                        Ləğv edilmə Səbəbi <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="reject-reason"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Məsələn: Reklam şərtləri elana uyğun deyil."
                        rows={3}
                        className="block w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-1 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-gray-800 text-gray-950 dark:text-white font-medium"
                      />
                      <p className="text-[10px] text-red-500 mt-1">
                        * Bu məlumat istifadəçiyə bildiriş kimi göndəriləcək və balansına {selectedRequest.price} ₼ geri qaytarılacaq.
                      </p>
                    </div>
                  )}

                  <div>
                    <label htmlFor="admin-notes" className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 uppercase tracking-wider">
                      Daxili Qeyd (Admin Notes)
                    </label>
                    <textarea
                      id="admin-notes"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Adminlərin görə biləcəyi qeydlər daxil edin (İstəyə bağlı)..."
                      rows={3}
                      className="block w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-1 focus:ring-brand-500 focus:border-brand-500 bg-white dark:bg-gray-800 text-gray-950 dark:text-white font-medium"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-850 flex justify-end gap-3">
              <button
                onClick={closeActionModal}
                className="px-5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-150 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                {modalType === 'view' ? 'Bağla' : 'İmtina et'}
              </button>

              {modalType === 'process' && (
                <button
                  onClick={() => handleUpdateStatus(1)}
                  disabled={isSaving}
                  className="px-6 py-2 rounded-xl bg-blue-500 text-white text-xs font-bold hover:bg-blue-600 transition-colors shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? 'Yadda saxlanılır...' : 'Emal etməyə başla'}
                </button>
              )}

              {modalType === 'complete' && (
                <button
                  onClick={() => handleUpdateStatus(2)}
                  disabled={isSaving}
                  className="px-6 py-2 rounded-xl bg-green-600 text-white text-xs font-bold hover:bg-green-700 transition-colors shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? 'Tamamlanır...' : 'Tamamlandı olaraq işarələ'}
                </button>
              )}

              {modalType === 'cancel' && (
                <button
                  onClick={() => handleUpdateStatus(3)}
                  disabled={isSaving || !rejectReason.trim()}
                  className="px-6 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isSaving ? 'Ləğv edilir...' : 'Təsdiq et və Balansı Qaytar'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PromotionRequestsPage() {
  return (
    <PermissionGuard permission="Promotions_View">
      <PromotionRequestsPageContent />
    </PermissionGuard>
  );
}
