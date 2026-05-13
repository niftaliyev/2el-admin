'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { adminService } from '@/services/admin.service';
import { AdminAd } from '@/types/admin';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const AD_STATUSES = [
  { value: 'all', label: 'Hamısı', color: 'gray' },
  { value: 'pending', label: 'Gözləyir', color: 'yellow' },
  { value: 'active', label: 'Aktiv', color: 'green' },
  { value: 'rejected', label: 'Rədd edilib', color: 'red' },
  { value: 'expired', label: 'Müddəti bitib', color: 'gray' },
];

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    pending: 'bg-warning-100 text-warning-600 dark:bg-warning-900/20 dark:text-warning-400',
    active: 'bg-success-100 text-success-600 dark:bg-success-900/20 dark:text-success-400',
    rejected: 'bg-error-100 text-error-600 dark:bg-error-900/20 dark:text-error-400',
    expired: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    inactive: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
};

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    pending: 'Gözləyir',
    active: 'Aktiv',
    rejected: 'Rədd edilib',
    expired: 'Müddəti bitib',
    inactive: 'Müddəti bitib',
  };
  return map[status] || status;
};

function AdminAdsPageContent() {
  const [ads, setAds] = useState<AdminAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('date');
  const [isAscending, setIsAscending] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    action: 'status' | 'delete';
    ad: AdminAd | null;
    status?: number;
  }>({ isOpen: false, action: 'status', ad: null });
  const [rejectReason, setRejectReason] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const status = searchParams.get('status');
    if (status && AD_STATUSES.some(s => s.value === status)) {
      setActiveTab(status);
    }
  }, [searchParams]);

  useEffect(() => { fetchAds(); }, [page, activeTab, searchQuery, sortBy, isAscending]);

  const fetchAds = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAds(page, 10, activeTab, searchQuery, sortBy, isAscending);
      setAds(data.data);
      setTotalPages(data.totalPages);
    } catch {
      toast.error('Elanları yükləyərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleAll = () =>
    setSelectedIds(selectedIds.length === ads.length ? [] : ads.map(a => a.id));

  const handleConfirm = async () => {
    if (!modalState.ad) return;
    try {
      if (modalState.action === 'status' && modalState.status !== undefined) {
        if (modalState.status === 2) {
          await adminService.bulkAdAction({ ids: [modalState.ad.id], action: 'status', status: 2, reason: rejectReason || 'Səbəb göstərilməyib' });
        } else {
          await adminService.updateAdStatus(modalState.ad.id, modalState.status);
        }
      } else if (modalState.action === 'delete') {
        await adminService.deleteAd(modalState.ad.id);
      }
      toast.success('Əməliyyat uğurla tamamlandı');
      setModalState({ isOpen: false, action: 'status', ad: null });
      setRejectReason('');
      fetchAds();
    } catch {
      toast.error('Xəta baş verdi');
    }
  };

  const handleBulkAction = async (action: string, status?: number) => {
    if (!selectedIds.length) return;
    try {
      if (action === 'status' && status === 3) {
        setModalState({ isOpen: true, action: 'status', ad: { id: selectedIds[0] } as any, status: 3 });
        return;
      }
      await adminService.bulkAdAction({ action, ids: selectedIds, status, reason: action === 'reject' ? 'Toplu rədd' : undefined });
      toast.success('Toplu əməliyyat tamamlandı');
      setSelectedIds([]);
      fetchAds();
    } catch {
      toast.error('Xəta baş verdi');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Elan İdarəetməsi</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Bütün elanları idarə edin, təsdiqləyin və ya rədd edin</p>
        </div>

        {/* Sorting controls */}
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            className="text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="date">Tarixə görə</option>
            <option value="price">Qiymətə görə</option>
          </select>
          <button
            onClick={() => { setIsAscending(!isAscending); setPage(1); }}
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-500 hover:text-brand-500 transition-colors"
            title={isAscending ? "Artan sıra" : "Azalan sıra"}
          >
            <svg className={`w-5 h-5 transition-transform ${isAscending ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 dark:border-gray-800 px-4">
          <nav className="flex gap-1 overflow-x-auto">
            {AD_STATUSES.map(s => (
              <button
                key={s.value}
                onClick={() => { setActiveTab(s.value); setPage(1); setSelectedIds([]); }}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === s.value
                    ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Elan adı, satıcı və ya e-poçt ilə axtar..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 bg-brand-50 dark:bg-brand-900/20 border-b border-gray-200 dark:border-gray-800">
            <span className="text-sm font-medium text-brand-600 dark:text-brand-400">{selectedIds.length} seçilib</span>
            <div className="flex gap-2 ml-auto">
              <button onClick={() => handleBulkAction('status', 1)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-success-500 text-white hover:bg-success-600 transition-colors">Təsdiqlə</button>
              <button onClick={() => handleBulkAction('status', 3)} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-warning-500 text-white hover:bg-warning-600 transition-colors">Rədd et</button>
              <button onClick={() => handleBulkAction('delete')} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-error-500 text-white hover:bg-error-600 transition-colors">Sil</button>
              <button onClick={() => setSelectedIds([])} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 transition-colors">Seçimi Sıfırla</button>
            </div>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600"></div>
          </div>
        ) : ads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <svg className="w-16 h-16 text-gray-200 dark:text-gray-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Heç bir elan tapılmadı</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox" checked={selectedIds.length === ads.length && ads.length > 0} onChange={toggleAll} className="rounded border-gray-300 dark:border-gray-600 text-brand-500 focus:ring-brand-500" />
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Elan</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Satıcı</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Qiymət</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Əməliyyatlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {ads.map(ad => (
                  <tr
                    key={ad.id}
                    className={`group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${selectedIds.includes(ad.id) ? 'bg-brand-50 dark:bg-brand-900/10' : ''}`}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('input') || (e.target as HTMLElement).closest('button')) return;
                      router.push(`/ads/${ad.id}`);
                    }}
                  >
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selectedIds.includes(ad.id)} onChange={() => toggleSelect(ad.id)} className="rounded border-gray-300 dark:border-gray-600 text-brand-500 focus:ring-brand-500" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {ad.images?.[0] && (
                          <img src={ad.images[0]} alt={ad.title} className="w-10 h-10 rounded-lg object-cover border border-gray-100 dark:border-gray-700 shrink-0" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1 group-hover:text-brand-600 transition-colors">{ad.title}</p>
                            <div className="flex gap-1 shrink-0">
                              {ad.isVip && <span className="w-2 h-2 rounded-full bg-warning-500" title="VIP" />}
                              {ad.isPremium && <span className="w-2 h-2 rounded-full bg-brand-500" title="Premium" />}
                              {ad.isBoosted && <span className="w-2 h-2 rounded-full bg-success-500" title="Boosted" />}
                            </div>
                          </div>
                          <p className="text-xs text-gray-400">{ad.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{ad.seller.name}</p>
                      <p className="text-xs text-gray-400">{ad.seller.email}</p>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{ad.price} {ad.currency}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge(ad.status)}`}>
                        {statusLabel(ad.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/ads/${ad.id}`}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                          title="Bax"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </Link>
                        {ad.status === 'pending' && (
                          <button
                            onClick={() => setModalState({ isOpen: true, action: 'status', ad, status: 1 })}
                            className="p-1.5 rounded-lg text-success-500 hover:bg-success-50 dark:hover:bg-success-900/20 transition-colors"
                            title="Təsdiq et"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                          </button>
                        )}
                        {ad.status === 'pending' && (
                          <button
                            onClick={() => setModalState({ isOpen: true, action: 'status', ad, status: 3 })}
                            className="p-1.5 rounded-lg text-warning-500 hover:bg-warning-50 dark:hover:bg-warning-900/20 transition-colors"
                            title="Rədd et"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        )}
                        <button
                          onClick={() => setModalState({ isOpen: true, action: 'delete', ad })}
                          className="p-1.5 rounded-lg text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
                          title="Sil"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination UI */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>

          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${page === i + 1
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            disabled={page === totalPages}
            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}

      {/* Modal */}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setModalState({ ...modalState, isOpen: false })} />
          <div className="relative bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {modalState.action === 'status' ? (modalState.status === 3 ? 'Elanı Rədd Et' : 'Statusu Dəyiş') : 'Elanı Sil'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {modalState.ad?.title && <><strong className="text-gray-900 dark:text-white">"{modalState.ad.title}"</strong><br /></>}
              {modalState.action === 'delete' ? 'Bu elanı silmək istədiyinizə əminsiniz?' : 'Bu əməliyyatı yerinə yetirmək istədiyinizə əminsiniz?'}
            </p>
            {modalState.action === 'status' && modalState.status === 3 && (
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Rədd etmə səbəbini daxil edin..."
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 mb-4 resize-none"
              />
            )}
            <div className="flex gap-3">
              <button onClick={() => setModalState({ ...modalState, isOpen: false })} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Ləğv et</button>
              <button
                onClick={handleConfirm}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors ${modalState.action === 'status'
                    ? (modalState.status === 1 ? 'bg-success-500 hover:bg-success-600' : 'bg-brand-500 hover:bg-brand-600')
                    : 'bg-error-500 hover:bg-error-600'
                  }`}
              >
                {modalState.action === 'status' ? 'Təsdiqlə' : 'Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminAdsPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600"></div>
      </div>
    }>
      <AdminAdsPageContent />
    </Suspense>
  );
}
