'use client';

import { use, useEffect, useState } from 'react';
import { adminService } from '@/services/admin.service';
import { AdminAd } from '@/types/admin';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PermissionGuard from '@/components/auth/PermissionGuard';

function AdDetailPageContent({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const router = useRouter();
  const [ad, setAd] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    action: 'status' | 'delete';
    status?: number;
  }>({ isOpen: false, action: 'status' });
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchAd();
  }, [id]);

  const fetchAd = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAdById(id);
      setAd(data);
      setRejectReason(data.rejectReason || '');
    } catch {
      toast.error('Elan məlumatlarını yükləyərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (status: number) => {
    if (status === 3) { // Rejected
      setModalState({ isOpen: true, action: 'status', status });
    } else {
      try {
        await adminService.updateAdStatus(id, status);
        toast.success('Status yeniləndi');
        fetchAd();
      } catch {
        toast.error('Xəta baş verdi');
      }
    }
  };

  const confirmStatusChange = async () => {
    try {
      if (modalState.status === 3) {
        await adminService.bulkAdAction({ ids: [id], action: 'status', status: 3, reason: rejectReason });
      } else if (modalState.status !== undefined) {
        await adminService.updateAdStatus(id, modalState.status);
      }
      toast.success('Əməliyyat uğurla tamamlandı');
      setModalState({ ...modalState, isOpen: false });
      fetchAd();
    } catch {
      toast.error('Xəta baş verdi');
    }
  };

  const handleDelete = async () => {
    try {
      await adminService.deleteAd(id);
      toast.success('Elan silindi');
      router.push('/ads');
    } catch {
      toast.error('Silərkən xəta baş verdi');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600"></div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Elan tapılmadı</h2>
        <Link href="/ads" className="mt-4 text-brand-600 hover:underline">Elanlar siyahısına qayıt</Link>
      </div>
    );
  }

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

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/ads" className="hover:text-brand-600">Elanlar</Link>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <span className="text-gray-900 dark:text-white font-medium truncate max-w-xs">{ad.title}</span>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white line-clamp-1">{ad.title}</h1>
          <div className="flex items-center gap-3">
            {ad.isVip && <span className="px-3 py-1 bg-warning-500 text-white text-xs font-bold rounded-lg shadow-sm">VIP</span>}
            {ad.isPremium && <span className="px-3 py-1 bg-brand-500 text-white text-xs font-bold rounded-lg shadow-sm">PREMIUM</span>}
            {ad.isBoosted && <span className="px-3 py-1 bg-success-500 text-white text-xs font-bold rounded-lg shadow-sm">BOOSTED</span>}
            <span className={`px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${statusBadge(ad.status)}`}>
              {statusLabel(ad.status)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Images & Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image Gallery */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="aspect-[16/10] relative bg-gray-50 dark:bg-gray-800">
              {ad.images?.[activeImage] ? (
                <img src={ad.images[activeImage]} alt={ad.title} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">Şəkil yoxdur</div>
              )}
            </div>
            {ad.images?.length > 1 && (
              <div className="p-4 flex gap-3 overflow-x-auto">
                {ad.images.map((img: string, idx: number) => (
                  <button 
                    key={idx} 
                    onClick={() => setActiveImage(idx)}
                    className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${activeImage === idx ? 'border-brand-500 scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Məlumatlar</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                <DetailItem label="Qiymət" value={`${ad.price} ${ad.currency}`} bold />
                <DetailItem label="Şəhər" value={ad.city} />
                <DetailItem label="Kateqoriya" value={ad.category} />
                <DetailItem label="Alt Kateqoriya" value={ad.subCategory} />
                <DetailItem label="Elan növü" value={ad.adType} />
                <DetailItem label="Vəziyyəti" value={ad.isNew ? 'Yeni' : 'İşlənmiş'} />
                <DetailItem label="Çatdırılma" value={ad.isDeliverable ? 'Var' : 'Yoxdur'} />
                <DetailItem label="Baxış sayı" value={ad.viewCount} />
                <DetailItem label="Tarix" value={new Date(ad.createdDate).toLocaleDateString('az-AZ')} />
                <DetailItem label="Bitmə tarixi" value={ad.expiresAt ? new Date(ad.expiresAt).toLocaleDateString('az-AZ') : '-'} />
              </div>
            </div>

            {ad.fields?.length > 0 && (
              <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Əlavə parametrlər</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                  {ad.fields.map((f: any, idx: number) => (
                    <DetailItem key={idx} label={f.name} value={f.value} />
                  ))}
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Təsvir</h3>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap text-sm leading-relaxed">
                {ad.description}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Seller & Actions */}
        <div className="space-y-6">
          {/* Seller Card */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Satıcı</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-xl uppercase">
                {ad.seller.name?.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">{ad.seller.name}</p>
                <p className="text-xs text-gray-500">{ad.seller.email}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Telefon:</span>
                <span className="font-medium text-gray-900 dark:text-white">{ad.phoneNumber}</span>
              </div>
              <Link 
                href={`/users/${ad.seller.id}`} 
                className="block w-full text-center py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                İstifadəçiyə bax
              </Link>
            </div>
          </div>

          {/* Admin Actions */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">İdarəetmə</h3>
            
            {(ad.isVip || ad.isPremium || ad.isBoosted) && (
              <div className="p-3 bg-warning-50 dark:bg-warning-900/10 border border-warning-200 dark:border-warning-800 rounded-2xl mb-2">
                <p className="text-xs text-warning-700 dark:text-warning-400 font-semibold flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  Bu elanın aktiv ödənişli xidmətləri var!
                </p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Statusu Dəyiş</label>
              <div className="grid grid-cols-2 gap-2">
                <ActionButton onClick={() => handleStatusChange(1)} active={ad.status === 'active'} color="success" label="Aktiv et" />
                <ActionButton onClick={() => handleStatusChange(0)} active={ad.status === 'pending'} color="warning" label="Gözlət" />
                <ActionButton onClick={() => handleStatusChange(3)} active={ad.status === 'rejected'} color="danger" label="Rədd et" />
                <ActionButton onClick={() => handleStatusChange(2)} active={ad.status === 'inactive' || ad.status === 'expired'} color="gray" label="Bitir" />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
              <button 
                onClick={() => setModalState({ isOpen: true, action: 'delete' })}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-error-50 dark:bg-error-900/10 text-error-600 dark:text-error-400 font-bold hover:bg-error-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Elanı Sil
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setModalState({ ...modalState, isOpen: false })} />
          <div className="relative bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {modalState.action === 'delete' ? 'Elanı Sil' : 'Elanı Rədd Et'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {modalState.action === 'delete' 
                ? 'Bu elanı silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.' 
                : 'Bu elanı rədd etmək üçün səbəb daxil edin:'}
            </p>

            {modalState.action === 'status' && (
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Rədd etmə səbəbi..."
                rows={4}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 mb-6 resize-none"
              />
            )}

            <div className="flex gap-4">
              <button onClick={() => setModalState({ ...modalState, isOpen: false })} className="flex-1 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 transition-colors">Ləğv et</button>
              <button
                onClick={modalState.action === 'delete' ? handleDelete : confirmStatusChange}
                className={`flex-1 py-3 rounded-2xl text-white font-bold transition-all ${modalState.action === 'delete' ? 'bg-error-500 hover:bg-error-600 shadow-lg shadow-error-500/25' : 'bg-brand-500 hover:bg-brand-600 shadow-lg shadow-brand-500/25'}`}
              >
                Təsdiqlə
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <PermissionGuard permission="Ads_View">
      <AdDetailPageContent params={params} />
    </PermissionGuard>
  );
}

function DetailItem({ label, value, bold = false }: { label: string; value: any; bold?: boolean }) {
  return (
    <div className="flex justify-between items-start">
      <span className="text-sm text-gray-500">{label}:</span>
      <span className={`text-sm text-right ${bold ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
        {value || '-'}
      </span>
    </div>
  );
}

function ActionButton({ onClick, active, color, label }: { onClick: () => void, active: boolean, color: 'success' | 'warning' | 'danger' | 'gray', label: string }) {
  const colors = {
    success: 'border-success-200 text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20',
    warning: 'border-warning-200 text-warning-600 hover:bg-warning-50 dark:hover:bg-warning-900/20',
    danger: 'border-error-200 text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20',
    gray: 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800',
  };
  
  return (
    <button
      onClick={onClick}
      disabled={active}
      className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all disabled:opacity-40 ${colors[color]} ${active ? 'ring-2 ring-offset-2 ring-current' : ''}`}
    >
      {label}
    </button>
  );
}
