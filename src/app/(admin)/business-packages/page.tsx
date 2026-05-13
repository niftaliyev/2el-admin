'use client';

import { useState, useEffect } from 'react';
import { adminService } from '@/services/admin.service';
import toast from 'react-hot-toast';
import Button from '@/components/ui/button/Button';
import { Modal, ConfirmationModal } from '@/components/ui/modal';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';

export default function AdminBusinessPackagesPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [userPackages, setUserPackages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'packages' | 'purchases'>('packages');
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
    onConfirm: () => {},
  });

  const [formData, setFormData] = useState({
    name: '',
    nameRu: '',
    description: '',
    descriptionRu: '',
    basePrice: 0,
    serviceBalance: 0,
    adLimit: 0,
    serviceDiscountPercentage: 0,
    discount60Days: 10,
    discount90Days: 15,
    discount180Days: 20
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [pkgs, upkgs] = await Promise.all([
        adminService.getAdminBusinessPackages(),
        adminService.getUserBusinessPackages()
      ]);
      setPackages(pkgs);
      setUserPackages(upkgs);
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
        name: pkg.name,
        nameRu: pkg.nameRu || '',
        description: pkg.description || '',
        descriptionRu: pkg.descriptionRu || '',
        basePrice: pkg.basePrice,
        serviceBalance: pkg.serviceBalance,
        adLimit: pkg.adLimit,
        serviceDiscountPercentage: pkg.serviceDiscountPercentage,
        discount60Days: pkg.discount60Days,
        discount90Days: pkg.discount90Days,
        discount180Days: pkg.discount180Days
      });
    } else {
      setEditingPackage(null);
      setFormData({
        name: '',
        nameRu: '',
        description: '',
        descriptionRu: '',
        basePrice: 0,
        serviceBalance: 0,
        adLimit: 0,
        serviceDiscountPercentage: 0,
        discount60Days: 10,
        discount90Days: 15,
        discount180Days: 20
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminService.upsertBusinessPackage({
        id: editingPackage?.id,
        ...formData
      });
      toast.success(editingPackage ? 'Paket yeniləndi' : 'Yeni paket yaradıldı');
      setIsModalOpen(false);
      loadData();
    } catch (error) {
      toast.error('Xəta baş verdi');
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Paketi Sil',
      message: 'Bu paketi silmək istədiyinizə əminsiniz?',
      onConfirm: async () => {
        try {
          await adminService.deleteBusinessPackage(id);
          toast.success('Paket silindi');
          loadData();
        } catch (error) {
          toast.error('Xəta baş verdi');
        }
      },
    });
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Biznes Paketləri</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Mağazalar üçün təklif olunan paketlərin idarə edilməsi</p>
        </div>
        <Button size="sm" onClick={() => handleOpenModal()}>
          Yeni Paket Yarat
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Aktiv Paket Çeşidi</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{packages.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Cəmi Abunəçi</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{userPackages.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-5">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Cəmi Gəlir</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {userPackages.reduce((acc, curr) => acc + (curr.amountPaid || 0), 0).toFixed(2)} ₼
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('packages')}
          className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'packages'
              ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          Paketlər
        </button>
        <button
          onClick={() => setActiveTab('purchases')}
          className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'purchases'
              ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          }`}
        >
          Alış Tarixçəsi
        </button>
      </div>

      {/* Content */}
      {activeTab === 'packages' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map(pkg => (
            <div key={pkg.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 flex flex-col shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{pkg.name}</h3>
                  <p className="text-xs text-gray-500 italic">{pkg.nameRu}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(pkg)} className="p-1.5 rounded-lg text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button onClick={() => handleDelete(pkg.id)} className="p-1.5 rounded-lg text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4 border border-gray-100 dark:border-gray-700">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Baza Qiymət (30 GÜN)</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{pkg.basePrice?.toFixed(0)} ₼</p>
              </div>

              <div className="flex-1 space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <svg className="w-4 h-4 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  <span>Elan Limiti: <strong className="text-gray-900 dark:text-white">{pkg.adLimit}</strong></span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                  <span>Xidmət Balansı: <strong className="text-gray-900 dark:text-white">{pkg.serviceBalance} ₼</strong></span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <svg className="w-4 h-4 text-warning-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12z" /></svg>
                  <span>Xidmət Endirimi: <strong className="text-gray-900 dark:text-white">-{pkg.serviceDiscountPercentage}%</strong></span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 grid grid-cols-3 gap-2">
                <div className="text-center">
                  <p className="text-[8px] font-bold text-gray-400 uppercase mb-0.5">60 GÜN</p>
                  <p className="text-xs font-bold text-success-600">-{pkg.discount60Days}%</p>
                </div>
                <div className="text-center">
                  <p className="text-[8px] font-bold text-gray-400 uppercase mb-0.5">90 GÜN</p>
                  <p className="text-xs font-bold text-success-600">-{pkg.discount90Days}%</p>
                </div>
                <div className="text-center">
                  <p className="text-[8px] font-bold text-gray-400 uppercase mb-0.5">180 GÜN</p>
                  <p className="text-xs font-bold text-success-600">-{pkg.discount180Days}%</p>
                </div>
              </div>
            </div>
          ))}

          {packages.length === 0 && (
            <div className="col-span-full py-16 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl flex flex-col items-center justify-center">
              <p className="text-gray-500">Heç bir paket tapılmadı</p>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Abunəçi</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Paket</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Məbləğ</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Müddət</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Bitmə tarixi</th>
                  <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {userPackages.map(up => (
                  <tr key={up.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{up.userName || 'İstifadəçi'}</p>
                      <p className="text-[10px] text-gray-400">ID: {up.id.split('-')[0]}...</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 font-medium">{up.packageName}</td>
                    <td className="px-4 py-3 text-sm font-bold text-brand-500">{up.amountPaid?.toFixed(2)} ₼</td>
                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">{up.durationDays || 30} GÜN</td>
                    <td className="px-4 py-3 text-sm font-medium">{new Date(up.expireDate).toLocaleDateString('az-AZ')}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${!up.isActive ? 'bg-error-100 text-error-600' : 'bg-success-100 text-success-600'}`}>
                        {!up.isActive ? 'Bitib' : 'Aktiv'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingPackage ? 'Paketi Redaktə Et' : 'Yeni Paket Yarat'} className="max-w-[500px]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Paket Adı (AZ)</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Gümüş, Qızıl və s."
                />
              </div>
              <div>
                <Label htmlFor="nameRu">Paket Adı (RU)</Label>
                <Input
                  id="nameRu"
                  required
                  value={formData.nameRu}
                  onChange={e => setFormData({ ...formData, nameRu: e.target.value })}
                  placeholder="Серебро, Золото и т.д."
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="description">Təsvir (AZ)</Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none h-20"
                  placeholder="Paket haqqında qısa qeyd"
                />
              </div>
              <div>
                <Label htmlFor="descriptionRu">Təsvir (RU)</Label>
                <textarea
                  id="descriptionRu"
                  value={formData.descriptionRu}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, descriptionRu: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none h-20"
                  placeholder="Краткое описание пакета"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="basePrice">Baza Qiymət (₼)</Label>
                <Input
                  id="basePrice"
                  type="number"
                  required
                  value={formData.basePrice}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="adLimit">Elan Limiti</Label>
                <Input
                  id="adLimit"
                  type="number"
                  required
                  value={formData.adLimit}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, adLimit: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="serviceBalance">Xidmət Balansı (₼)</Label>
                <Input
                  id="serviceBalance"
                  type="number"
                  required
                  value={formData.serviceBalance}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, serviceBalance: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="serviceDiscountPercentage">Xidmət Endirimi (%)</Label>
                <Input
                  id="serviceDiscountPercentage"
                  type="number"
                  required
                  min="0" max="100"
                  value={formData.serviceDiscountPercentage}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, serviceDiscountPercentage: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="pt-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Müddət üzrə endirimlər (%)</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="discount60">60 GÜN</Label>
                  <Input
                    id="discount60"
                    type="number"
                    value={formData.discount60Days}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, discount60Days: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="discount90">90 GÜN</Label>
                  <Input
                    id="discount90"
                    type="number"
                    value={formData.discount90Days}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, discount90Days: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="discount180">180 GÜN</Label>
                  <Input
                    id="discount180"
                    type="number"
                    value={formData.discount180Days}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, discount180Days: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
            <Button type="submit" className="w-full mt-4">
              {editingPackage ? 'Dəyişiklikləri Saxla' : 'Paketi Yarat'}
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
