'use client';

import { use, useEffect, useState } from 'react';
import { adminService } from '@/services/admin.service';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import PermissionGuard from '@/components/auth/PermissionGuard';

function UserDetailPageContent({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    action: 'block' | 'unblock' | 'delete' | 'credit';
  }>({ isOpen: false, action: 'block' });
  const [creditAmount, setCreditAmount] = useState<number>(0);

  const isSelf = currentUser?.id === id;

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUserById(id);
      setUser(data);
    } catch {
      toast.error('İstifadəçi məlumatlarını yükləyərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (isBlocked: boolean) => {
    try {
      setIsSubmitting(true);
      await adminService.updateUserStatus(id, isBlocked);
      toast.success(isBlocked ? 'İstifadəçi bloklandı' : 'İstifadəçi aktivləşdirildi');
      setModalState({ ...modalState, isOpen: false });
      fetchUser();
    } catch {
      toast.error('Xəta baş verdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreditBalance = async () => {
    if (creditAmount <= 0) {
      toast.error('Məbləğ 0-dan böyük olmalıdır');
      return;
    }
    try {
      setIsSubmitting(true);
      await adminService.creditUser({ userId: id, amount: creditAmount });
      toast.success('Balans artırıldı');
      setModalState({ ...modalState, isOpen: false });
      setCreditAmount(0);
      fetchUser();
    } catch {
      toast.error('Xəta baş verdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsSubmitting(true);
      await adminService.deleteUser(id);
      toast.success('İstifadəçi silindi');
      setModalState({ ...modalState, isOpen: false });
      router.push('/users');
    } catch {
      toast.error('Silərkən xəta baş verdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">İstifadəçi tapılmadı</h2>
        <Link href="/users" className="mt-4 text-brand-600 hover:underline">İstifadəçilər siyahısına qayıt</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/users" className="hover:text-brand-600">İstifadəçilər</Link>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <span className="text-gray-900 dark:text-white font-medium truncate">{user.name}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: User Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm text-center">
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 rounded-full border-4 border-brand-50 dark:border-brand-900/20 overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto">
                {user.profilePhoto && user.profilePhoto.trim() !== '' ? (
                  <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-brand-600">{user.name?.[0]?.toUpperCase()}</span>
                )}
              </div>
              <span className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-white dark:border-gray-900 ${user.status === 'active' ? 'bg-success-500' : 'bg-error-500'}`} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">@{user.userName}</p>
            
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase font-semibold">Balans</p>
                <p className="text-lg font-bold text-brand-600">{user.balance} AZN</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 uppercase font-semibold">Tip</p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{user.userType === 'Personal' ? 'Fərdi' : 'Mağaza'}</p>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <button 
                onClick={() => setModalState({ isOpen: true, action: 'credit' })}
                className="w-full py-2.5 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors"
              >
                Balansı Artır
              </button>
              {!isSelf && (
                <>
                  {user.status === 'active' ? (
                    <button 
                      onClick={() => setModalState({ isOpen: true, action: 'block' })}
                      className="w-full py-2.5 rounded-xl border border-error-200 text-error-600 font-semibold hover:bg-error-50 transition-colors"
                    >
                      Blok Et
                    </button>
                  ) : (
                    <button 
                      onClick={() => setModalState({ isOpen: true, action: 'unblock' })}
                      className="w-full py-2.5 rounded-xl border border-success-200 text-success-600 font-semibold hover:bg-success-50 transition-colors"
                    >
                      Blokdan Çıxart
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Əlaqə məlumatları</h3>
            <div className="space-y-3">
              <DetailItem label="E-poçt" value={user.email} />
              <DetailItem label="Telefon" value={user.phone} />
              <DetailItem label="Təsdiqlənib" value={user.isVerified ? 'Bəli' : 'Xeyr'} />
              <DetailItem label="Qeydiyyat" value={new Date(user.registeredAt).toLocaleDateString('az-AZ')} />
            </div>
          </div>

          {user.storeInfo && (
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Mağaza məlumatları</h3>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                {user.storeInfo.logo && user.storeInfo.logo.trim() !== '' ? (
                  <img src={user.storeInfo.logo} alt={user.storeInfo.storeName} className="w-12 h-12 rounded-xl object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center font-bold text-brand-600">
                    {user.storeInfo.storeName?.[0]?.toUpperCase() || 'M'}
                  </div>
                )}
                <div>
                  <p className="font-bold text-sm text-gray-900 dark:text-white">{user.storeInfo.storeName}</p>
                  <p className="text-xs text-gray-500">@{user.storeInfo.slug}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 italic">"{user.storeInfo.headline}"</p>
            </div>
          )}
        </div>

        {/* Right: Recent Ads */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Son Elanlar</h3>
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400">
                Cəmi {user.recentAds?.length || 0} elan
              </span>
            </div>

            <div className="space-y-4">
              {user.recentAds?.length > 0 ? (
                user.recentAds.map((ad: any) => (
                  <Link 
                    key={ad.id} 
                    href={`/ads/${ad.id}`}
                    className="flex items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-brand-500 hover:bg-brand-50/30 dark:hover:bg-brand-900/10 transition-all group"
                  >
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-brand-600 transition-colors">{ad.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">{ad.createdDate} • <span className="font-semibold text-brand-600">{ad.price} AZN</span></p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${ad.status === 'active' ? 'bg-success-100 text-success-600' : 'bg-gray-100 text-gray-600'}`}>
                        {ad.status === 'active' ? 'Aktiv' : ad.status === 'pending' ? 'Gözləyir' : 'Rədd edilib'}
                      </span>
                      <svg className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-10 text-gray-500">Bu istifadəçinin hələ elanı yoxdur.</div>
              )}
            </div>
          </div>

            {!isSelf && (
              <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm border-l-4 border-l-error-500">
                <h3 className="text-lg font-bold text-error-600 mb-2">Təhlükəli Zona</h3>
                <p className="text-sm text-gray-500 mb-4">İstifadəçini sildikdə onun bütün elanları və məlumatları sistemdən gizlədiləcək.</p>
                <button 
                  onClick={() => setModalState({ isOpen: true, action: 'delete' })}
                  className="px-6 py-2.5 rounded-xl bg-error-50 text-error-600 font-bold hover:bg-error-100 transition-colors"
                >
                  Hesabı Sil
                </button>
              </div>
            )}
        </div>
      </div>

      {/* Modals */}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => !isSubmitting && setModalState({ ...modalState, isOpen: false })} />
          <div className="relative bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl shadow-2xl p-6 sm:p-8 border border-gray-100 dark:border-gray-800">
            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                modalState.action === 'block' || modalState.action === 'delete'
                  ? 'bg-error-50 dark:bg-error-900/20 text-error-600'
                  : modalState.action === 'unblock'
                  ? 'bg-success-50 dark:bg-success-900/20 text-success-600'
                  : 'bg-brand-50 dark:bg-brand-900/20 text-brand-600'
              }`}>
                {modalState.action === 'block' && (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                )}
                {modalState.action === 'unblock' && (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {modalState.action === 'delete' && (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )}
                {modalState.action === 'credit' && (
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {modalState.action === 'credit' && 'Balans Artırımı'}
                  {modalState.action === 'block' && 'İstifadəçini Blokla'}
                  {modalState.action === 'unblock' && 'İstifadəçini Aktivləşdir'}
                  {modalState.action === 'delete' && 'Hesabı Sil'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">@{user.userName}</p>
              </div>
            </div>

            {/* Modal Body */}
            {modalState.action === 'credit' ? (
              <div className="space-y-4 my-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold text-gray-900 dark:text-white">{user.name}</span> hesabına nə qədər balans əlavə etmək istəyirsiniz?
                </p>
                <div className="relative">
                  <input 
                    type="number" 
                    min="1"
                    step="any"
                    value={creditAmount || ''}
                    placeholder="0"
                    onChange={(e) => setCreditAmount(Number(e.target.value))}
                    className="w-full px-4 py-3 pr-14 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xl font-bold text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    autoFocus
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">AZN</span>
                </div>
              </div>
            ) : (
              <div className="my-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {modalState.action === 'block' && (
                    <>
                      <strong className="text-gray-900 dark:text-white">{user.name}</strong> adlı istifadəçini bloklamaq istədiyinizə əminsiniz? Bloklanmış istifadəçi sayta daxil ola və ya elan yerləşdirə bilməyəcək.
                    </>
                  )}
                  {modalState.action === 'unblock' && (
                    <>
                      <strong className="text-gray-900 dark:text-white">{user.name}</strong> adlı istifadəçinin blokunu qaldırıb hesabını yenidən aktivləşdirmək istədiyinizə əminsiniz?
                    </>
                  )}
                  {modalState.action === 'delete' && (
                    <>
                      <strong className="text-gray-900 dark:text-white">{user.name}</strong> adlı istifadəçini silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarılmır və onun bütün məlumatları gizlədiləcək.
                    </>
                  )}
                </p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex gap-3 mt-6">
              <button 
                type="button"
                disabled={isSubmitting}
                onClick={() => setModalState({ ...modalState, isOpen: false })} 
                className="flex-1 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Ləğv et
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => {
                  if (modalState.action === 'credit') handleCreditBalance();
                  else if (modalState.action === 'block') handleStatusChange(true);
                  else if (modalState.action === 'unblock') handleStatusChange(false);
                  else if (modalState.action === 'delete') handleDelete();
                }}
                className={`flex-1 py-3 rounded-2xl font-semibold text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
                  modalState.action === 'block' || modalState.action === 'delete'
                    ? 'bg-error-500 hover:bg-error-600 shadow-lg shadow-error-500/20'
                    : modalState.action === 'unblock'
                    ? 'bg-success-500 hover:bg-success-600 shadow-lg shadow-success-500/20'
                    : 'bg-brand-500 hover:bg-brand-600 shadow-lg shadow-brand-500/20'
                }`}
              >
                {isSubmitting ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    {modalState.action === 'credit' && 'Balansı Artır'}
                    {modalState.action === 'block' && 'Bəli, Blok Et'}
                    {modalState.action === 'unblock' && 'Bəli, Aktivləşdir'}
                    {modalState.action === 'delete' && 'Bəli, Sil'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <PermissionGuard permission="Users_View">
      <UserDetailPageContent params={params} />
    </PermissionGuard>
  );
}

function DetailItem({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-500">{label}:</span>
      <span className="font-semibold text-gray-900 dark:text-white">{value || '-'}</span>
    </div>
  );
}
