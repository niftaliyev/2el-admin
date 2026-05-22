'use client';

import PermissionGuard from '@/components/auth/PermissionGuard';
import { useState, useEffect } from 'react';
import { adminService } from '@/services/admin.service';
import toast from 'react-hot-toast';
import Button from '@/components/ui/button/Button';
import { Modal, ConfirmationModal } from '@/components/ui/modal';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import { useAuth } from '@/context/AuthContext';
const PremiumIcon = ({ size = 20, className, title, fill = "#FF9D00", isGray = false }: { size?: number, className?: string, title?: string, fill?: string, isGray?: boolean }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {title && <title>{title}</title>}
    <path d="M4 7L7 19H17L20 7L15 11L12 4L9 11L4 7Z" fill={isGray ? "#9CA3AF" : fill} />
  </svg>
);

const VipIcon = ({ size = 20, className, title, fill = "#FF4F08" }: { size?: number, className?: string, title?: string, fill?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {title && <title>{title}</title>}
    <path d="M6 4H18L22 12L12 22L2 12L6 4Z" fill={fill} />
    <path d="M12 17L15 10H13.2L12 13.2L10.8 10H9L12 17Z" fill="white" />
  </svg>
);

const RocketIcon = ({ className = "w-5 h-5", size }: { className?: string, size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91-.79-.79-2.08-.8-2.91-.09z" />
    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>
);


function AdminPackagePricesPageContent() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('Packages_Manage');
  const [packages, setPackages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'Vip' | 'Premium' | 'Boost'>('all');
  const [editingPackage, setEditingPackage] = useState<any>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  });

  const [formData, setFormData] = useState({
    packageType: 'Vip',
    price: 0,
    intervalDay: 0,
    intervalHours: 0,
    boostCount: 0,
    description: '',
    descriptionRu: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const pkgs = await adminService.getAdminPackages();
      setPackages(pkgs);
    } catch (error) {
      toast.error('Məlumatları yükləmək mümkün olmadı');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (pkg: any = null) => {
    if (pkg) {
      setEditingPackage(pkg);
      setFormData({
        packageType: pkg.packageType || 'Vip',
        price: pkg.price || 0,
        intervalDay: pkg.intervalDay || 0,
        intervalHours: pkg.intervalHours || 0,
        boostCount: pkg.boostCount || 0,
        description: pkg.description || '',
        descriptionRu: pkg.descriptionRu || ''
      });
    } else {
      setEditingPackage(null);
      setFormData({
        packageType: 'Vip',
        price: 0,
        intervalDay: 0,
        intervalHours: 0,
        boostCount: 0,
        description: '',
        descriptionRu: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prepare payload. Set appropriate fields to null depending on packageType.
    const isBoost = formData.packageType === 'Boost';
    const payload: any = {
      id: editingPackage?.id,
      packageType: formData.packageType,
      price: Number(formData.price),
      description: formData.description,
      descriptionRu: formData.descriptionRu || null,
      intervalDay: isBoost ? null : Number(formData.intervalDay),
      intervalHours: isBoost ? Number(formData.intervalHours) : null,
      boostCount: isBoost ? Number(formData.boostCount) : null,
    };

    // Validations
    if (payload.price <= 0) {
      toast.error('Qiymət 0-dan böyük olmalıdır');
      return;
    }

    if (!isBoost && (!payload.intervalDay || payload.intervalDay <= 0)) {
      toast.error('VIP və Premium üçün gün sayı daxil edilməlidir');
      return;
    }

    if (isBoost) {
      if (!payload.intervalHours || payload.intervalHours <= 0) {
        toast.error('Boost üçün interval saatı daxil edilməlidir');
        return;
      }
      if (!payload.boostCount || payload.boostCount <= 0) {
        toast.error('Boost sayı daxil edilməlidir');
        return;
      }
    }

    try {
      await adminService.upsertPackage(payload);
      toast.success(editingPackage ? 'Xidmət paketi yeniləndi' : 'Yeni xidmət paketi yaradıldı');
      setIsModalOpen(false);
      loadData();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Xəta baş verdi';
      toast.error(errorMessage);
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Xidmət Paketini Sil',
      message: 'Bu xidmət paketini silmək istədiyinizə əminsiniz? Bu paketdən istifadə edən elanlar varsa silinməyəcək.',
      onConfirm: async () => {
        try {
          await adminService.deletePackage(id);
          toast.success('Xidmət paketi silindi');
          loadData();
        } catch (error: any) {
          const errorMessage = error?.response?.data?.message || 'Xəta baş verdi. Paketdən istifadə edən elanlar ola bilər.';
          toast.error(errorMessage);
        }
      },
    });
  };

  // Filter packages based on activeTab
  const filteredPackages = packages.filter(pkg => {
    if (activeTab === 'all') return true;
    return pkg.packageType === activeTab;
  });

  const getStats = () => {
    const total = packages.length;
    const vip = packages.filter(p => p.packageType === 'Vip').length;
    const prem = packages.filter(p => p.packageType === 'Premium').length;
    const boost = packages.filter(p => p.packageType === 'Boost').length;
    return { total, vip, prem, boost };
  };

  const stats = getStats();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ödənişli Xidmətlər</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Saytdakı elanlar üçün VIP, PREMIUM və BOOST ödənişli xidmətlərinin idarə edilməsi
          </p>
        </div>
        {canManage && (
          <Button size="sm" className="w-full md:w-auto text-center justify-center flex" onClick={() => handleOpenModal()}>
            Yeni Ödənişli Xidmət Yarat
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-4 sm:p-5 shadow-sm flex items-center justify-between border-l-4 border-l-blue-500">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Cəmi Paketlər</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="p-2 sm:p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl text-blue-500 flex-shrink-0">
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-4 sm:p-5 shadow-sm border-l-4 flex items-center justify-between" style={{ borderLeftColor: '#FF4F08' }}>
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">VIP Paketləri</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.vip}</p>
          </div>
          <div className="p-2 sm:p-3 rounded-xl text-[#FF4F08] flex-shrink-0" style={{ backgroundColor: 'rgba(255, 79, 8, 0.08)' }}>
            <VipIcon size={20} className="sm:hidden" />
            <VipIcon size={24} className="hidden sm:block" />
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-4 sm:p-5 shadow-sm border-l-4 flex items-center justify-between" style={{ borderLeftColor: '#FF9D00' }}>
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Premium Paketləri</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.prem}</p>
          </div>
          <div className="p-2 sm:p-3 rounded-xl text-[#FF9D00] flex-shrink-0" style={{ backgroundColor: 'rgba(255, 157, 0, 0.08)' }}>
            <PremiumIcon size={20} className="sm:hidden" />
            <PremiumIcon size={24} className="hidden sm:block" />
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-4 sm:p-5 shadow-sm border-l-4 flex items-center justify-between" style={{ borderLeftColor: '#16a34a' }}>
          <div>
            <p className="text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">BOOST Paketləri</p>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{stats.boost}</p>
          </div>
          <div className="p-2 sm:p-3 rounded-xl text-[#16a34a] flex-shrink-0" style={{ backgroundColor: 'rgba(22, 163, 74, 0.08)' }}>
            <RocketIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden">
        <div className="flex flex-row w-full overflow-x-auto scroll-smooth whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(['all', 'Premium', 'Vip', 'Boost'] as const).map(tab => {
            const isActive = activeTab === tab;

            // Tab-specific styles
            let activeBgClass = '';
            let activeBorderColor = '';
            let activeTextColorClass = '';

            if (tab === 'all') {
              activeBgClass = 'bg-blue-50/50 dark:bg-blue-950/10';
              activeBorderColor = '#3b82f6';
              activeTextColorClass = 'text-blue-600 dark:text-blue-400';
            } else if (tab === 'Premium') {
              activeBgClass = 'bg-[#FFFDF0] dark:bg-amber-950/10';
              activeBorderColor = '#FF9D00';
              activeTextColorClass = 'text-[#FF9D00]';
            } else if (tab === 'Vip') {
              activeBgClass = 'bg-[#FFF5F2] dark:bg-orange-950/10';
              activeBorderColor = '#FF4F08';
              activeTextColorClass = 'text-[#FF4F08]';
            } else if (tab === 'Boost') {
              activeBgClass = 'bg-emerald-50/50 dark:bg-emerald-950/10';
              activeBorderColor = '#16a34a';
              activeTextColorClass = 'text-[#16a34a]';
            }

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 min-w-[90px] sm:min-w-0 flex flex-col items-center justify-center gap-2 py-4 px-3 sm:px-6 border-b-[3px] transition-all duration-300 ${isActive
                  ? `${activeBgClass} ${activeTextColorClass}`
                  : 'border-b-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50/50 dark:hover:bg-gray-800/20'
                  }`}
                style={isActive ? { borderBottomColor: activeBorderColor } : {}}
              >
                <div className="transition-transform duration-300 transform group-hover:scale-110 flex items-center justify-center">
                  {tab === 'all' && (
                    <svg className={`w-5 h-5 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  )}
                  {tab === 'Premium' && (
                    <PremiumIcon size={24} isGray={!isActive} />
                  )}
                  {tab === 'Vip' && (
                    <VipIcon size={24} />
                  )}
                  {tab === 'Boost' && (
                    <RocketIcon className={`w-5 h-5 ${isActive ? 'text-[#16a34a]' : 'text-gray-400'}`} />
                  )}
                </div>
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider">
                  {tab === 'all' ? 'Hamısı' : tab === 'Premium' ? 'Premium' : tab === 'Vip' ? 'VIP' : 'İrəli çək'}
                </span>
              </button>
            );
          })}
        </div>
      </div>


      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredPackages.map(pkg => {
          const isVip = pkg.packageType === 'Vip';
          const isPrem = pkg.packageType === 'Premium';
          const isBoost = pkg.packageType === 'Boost';

          return (
            <div
              key={pkg.id}
              className={`bg-white dark:bg-gray-900 rounded-2xl border-t-4 p-4 sm:p-6 flex flex-col shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden border-x border-b border-gray-200 dark:border-gray-800 dark:border-x-gray-800 dark:border-b-gray-800`}
              style={{
                borderTopColor: isVip ? '#FF4F08' : isPrem ? '#FF9D00' : '#16a34a'
              }}
            >
              {/* Type Badge Background Accent & Icon watermark */}
              <div
                className="absolute -top-3 -right-3 w-20 h-20 rounded-full flex items-center justify-center opacity-[0.08] dark:opacity-[0.12] rotate-12 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
                style={{
                  color: isVip ? '#FF4F08' : isPrem ? '#FF9D00' : '#16a34a',
                  backgroundColor: isVip ? 'rgba(255, 79, 8, 0.1)' : isPrem ? 'rgba(255, 157, 0, 0.1)' : 'rgba(22, 163, 74, 0.1)'
                }}
              >
                {isVip && <VipIcon size={40} />}
                {isPrem && <PremiumIcon size={40} />}
                {isBoost && <RocketIcon className="w-10 h-10" />}
              </div>

              <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2"
                    style={{
                      color: isVip ? '#FF4F08' : isPrem ? '#FF9D00' : '#16a34a',
                      backgroundColor: isVip ? 'rgba(255, 79, 8, 0.08)' : isPrem ? 'rgba(255, 157, 0, 0.08)' : 'rgba(22, 163, 74, 0.08)'
                    }}
                  >
                    {isVip && <VipIcon size={12} />}
                    {isPrem && <PremiumIcon size={12} />}
                    {isBoost && <RocketIcon className="w-3 h-3" />}
                    {pkg.packageType === 'Boost' ? 'BOOST' : pkg.packageType}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-snug">
                    {pkg.description || `${pkg.packageType} Paketi`}
                  </h3>
                  {pkg.descriptionRu && (
                    <p className="text-xs text-gray-400 italic mt-0.5">{pkg.descriptionRu}</p>
                  )}
                </div>
                {canManage && (
                  <div className="flex gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity relative z-10">
                    <button
                      onClick={() => handleOpenModal(pkg)}
                      className="p-1.5 rounded-lg text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20"
                      title="Redaktə et"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(pkg.id)}
                      className="p-1.5 rounded-lg text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20"
                      title="Sil"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Price Details Block */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3.5 sm:p-4 mb-3 sm:mb-4 border border-gray-100 dark:border-gray-700 mt-auto">
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">
                  Xidmət Qiyməti
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {pkg.price?.toFixed(2)} ₼
                </p>
              </div>

              {/* Package Details */}
              <div className="space-y-3 pt-2">
                {isBoost ? (
                  <>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <RocketIcon className="w-4 h-4 text-emerald-500" />
                      <span>
                        Boost Limiti: <strong className="text-gray-900 dark:text-white">{pkg.boostCount} dəfə</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>
                        Hər <strong className="text-gray-900 dark:text-white">{pkg.intervalHours} saatdan</strong> bir
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      style={{ color: isVip ? '#FF4F08' : '#FF9D00' }}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>
                      Aktivlik Müddəti: <strong className="text-gray-900 dark:text-white">{pkg.intervalDay} gün</strong>
                    </span>
                  </div>
                )}
              </div>

            </div>
          );
        })}

        {filteredPackages.length === 0 && (
          <div className="col-span-full py-16 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl flex flex-col items-center justify-center">
            <p className="text-gray-500 dark:text-gray-400">Bu kateqoriyada heç bir xidmət paketi tapılmadı</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingPackage ? 'Xidmət Paketini Redaktə Et' : 'Yeni Xidmət Paketi Yarat'}
          className="max-w-[500px]"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Package Type Selection */}
            <div>
              <Label htmlFor="packageType">Paket Növü</Label>
              <select
                id="packageType"
                required
                value={formData.packageType}
                onChange={e => setFormData({ ...formData, packageType: e.target.value })}
                className="h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 focus:outline-none dark:focus:border-brand-800"
              >
                <option value="Vip">VIP</option>
                <option value="Premium">Premium</option>
                <option value="Boost">BOOST</option>
              </select>
            </div>

            {/* Description AZ & RU */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="description">Açıqlama (AZ)</Label>
                <Input
                  id="description"
                  required
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Məs. VIP 1 Gün, VIP 10 Gün..."
                />
              </div>
              <div>
                <Label htmlFor="descriptionRu">Açıqlama (RU)</Label>
                <Input
                  id="descriptionRu"
                  value={formData.descriptionRu}
                  onChange={e => setFormData({ ...formData, descriptionRu: e.target.value })}
                  placeholder="Məs. VIP 1 День, VIP 10 Дней..."
                />
              </div>
            </div>

            {/* Price Input */}
            <div>
              <Label htmlFor="price">Qiymət (₼)</Label>
              <Input
                id="price"
                type="number"
                step={0.01}
                required
                value={formData.price}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, price: Number(e.target.value) })
                }
                placeholder="Qiymət daxil edin"
              />
            </div>

            {/* Conditional Dynamic Inputs */}
            {formData.packageType === 'Boost' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                <div>
                  <Label htmlFor="intervalHours">Interval (Saat)</Label>
                  <Input
                    id="intervalHours"
                    type="number"
                    required
                    value={formData.intervalHours}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, intervalHours: Number(e.target.value) })
                    }
                    placeholder="Məs: 8"
                  />
                </div>
                <div>
                  <Label htmlFor="boostCount">Boost Sayı (Limit)</Label>
                  <Input
                    id="boostCount"
                    type="number"
                    required
                    value={formData.boostCount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, boostCount: Number(e.target.value) })
                    }
                    placeholder="Məs: 30"
                  />
                </div>
              </div>
            ) : (
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <Label htmlFor="intervalDay">Müddət (Gün)</Label>
                <Input
                  id="intervalDay"
                  type="number"
                  required
                  value={formData.intervalDay}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, intervalDay: Number(e.target.value) })
                  }
                  placeholder="Məs: 1, 5, 10, 30"
                />
              </div>
            )}

            <Button type="submit" className="w-full mt-4">
              {editingPackage ? 'Dəyişiklikləri Saxla' : 'Xidmət Paketini Yarat'}
            </Button>
          </form>
        </Modal>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />
    </div>
  );
}

export default function AdminPackagePricesPage() {
  return (
    <PermissionGuard permission="Packages_View">
      <AdminPackagePricesPageContent />
    </PermissionGuard>
  );
}
