'use client';

import { useState, useEffect } from 'react';
import { adminService } from '@/services/admin.service';
import toast from 'react-hot-toast';
import { ConfirmationModal } from '@/components/ui/modal';

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [tempScriptCode, setTempScriptCode] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
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

  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  useEffect(() => {
    fetchBanners();
    fetchLookups();
  }, []);

  const filteredBanners = banners.filter(banner => {
    if (activeTab === 'active') return banner.isActive;
    if (activeTab === 'inactive') return !banner.isActive;
    return true;
  });

  const totalPages = Math.ceil(filteredBanners.length / itemsPerPage);
  const paginatedBanners = filteredBanners.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const data = await adminService.getBanners();
      setBanners(data);
      setCurrentPage(1);
    } catch {
      toast.error('Bannerləri yükləmək mümkün olmadı');
    } finally {
      setLoading(false);
    }
  };

  const fetchLookups = async () => {
    try {
      const [cats, cityList] = await Promise.all([
        adminService.getCategoryTree(),
        adminService.getCities()
      ]);
      setCategories(cats);
      setCities(cityList);
    } catch (e) {
      console.error('Lookups error:', e);
      toast.error('Kateqoriya və şəhərləri yükləmək mümkün olmadı');
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const fileInput = form.querySelector('input[name="imageFile"]') as HTMLInputElement;
    const imageFile = fileInput?.files?.[0];

    const startVal = formData.get('startDate') as string;
    const endVal = formData.get('endDate') as string;

    if (!startVal || !endVal) {
      toast.error('Tarixlər mütləqdir');
      return;
    }

    const banner: any = {
      id: selectedBanner?.id || '00000000-0000-0000-0000-000000000000',
      title: formData.get('title'),
      targetUrl: formData.get('targetUrl'),
      position: formData.get('position'),
      categoryId: formData.get('categoryId') || null,
      cityId: formData.get('cityId') || null,
      language: formData.get('language') || null,
      priority: parseInt(formData.get('priority') as string) || 0,
      startDate: new Date(startVal).toISOString(),
      endDate: new Date(endVal).toISOString(),
      isActive: formData.get('isActive') === 'on',
      scriptCode: formData.get('scriptCode'),
    };

    if (imageFile) banner.imageFile = imageFile;
    else banner.imageUrl = selectedBanner?.imageUrl || '';

    try {
      setIsProcessing(true);
      await adminService.upsertBanner(banner);
      toast.success('Banner uğurla yadda saxlanıldı');
      setIsModalOpen(false);
      fetchBanners();
    } catch {
      toast.error('Xəta baş verdi');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Banneri Sil',
      message: 'Bu banneri silmək istədiyinizə əminsiniz?',
      onConfirm: async () => {
        try {
          await adminService.deleteBanner(id);
          toast.success('Banner silindi');
          fetchBanners();
        } catch {
          toast.error('Silinmə zamanı xəta baş verdi');
        }
      },
    });
  };

  const getPositionName = (pos: number | string) => {
    const map: Record<string | number, string> = {
      1: 'Sol Sidebar', 2: 'Sağ Sidebar', 3: 'Yuxarı (Top)',
      4: 'Aşağı (Bottom)', 5: 'Məzmun Arası', 6: 'Branding (Wallpaper)',
      'LeftSidebar': 'Sol Sidebar', 'RightSidebar': 'Sağ Sidebar', 'Top': 'Yuxarı (Top)',
      'Bottom': 'Aşağı (Bottom)', 'InnerContent': 'Məzmun Arası', 'Branding': 'Branding (Wallpaper)'
    };
    return map[pos] || 'Naməlum';
  };

  const inputClass = "w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500";
  const labelClass = "block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5";

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Banner Reklamları</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Saytda görünən kommersiya reklamlarını idarə edin</p>
        </div>
        <button
          onClick={() => { setSelectedBanner(null); setIsModalOpen(true); setShowPreview(false); setTempScriptCode(''); }}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-brand-500 text-white text-sm font-bold hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/20 active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
          Yeni Banner
        </button>
      </div>

      {/* Tabs & Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-900 p-2 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-1 p-1 bg-gray-50 dark:bg-gray-800 rounded-xl w-full sm:w-auto">
          {[
            { id: 'all', label: 'Hamısı', count: banners.length },
            { id: 'active', label: 'Aktiv', count: banners.filter(b => b.isActive).length },
            { id: 'inactive', label: 'Deaktiv', count: banners.filter(b => !b.isActive).length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setCurrentPage(1); }}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-white dark:bg-gray-700 text-brand-500 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === tab.id ? 'bg-brand-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-500'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:block">Səhifə Başına:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 outline-none"
          >
            {[8, 12, 24, 48, 100].map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-32">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600"></div>
        </div>
      ) : filteredBanners.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-12 sm:p-20 flex flex-col items-center justify-center text-center bg-gray-50/30 dark:bg-gray-900/10">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-300 font-bold text-lg mb-2">Heç bir banner tapılmadı</p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-6 max-w-xs">Bu kateqoriyada hələlik reklam yoxdur.</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {paginatedBanners.map(banner => (
              <div key={banner.id} className={`group rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden flex flex-col shadow-sm hover:shadow-xl hover:border-brand-500/30 transition-all duration-300 ${!banner.isActive ? 'opacity-60 grayscale' : ''}`}>
                <div className="aspect-[16/9] relative overflow-hidden bg-gray-100 dark:bg-gray-800">
                  {banner.scriptCode ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-brand-50/30 dark:bg-brand-900/5 p-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white dark:bg-gray-800 rounded-xl shadow-sm flex items-center justify-center mb-2">
                        <span className="material-symbols-outlined text-brand-500 !text-xl">code</span>
                      </div>
                      <span className="text-[8px] sm:text-[9px] font-black text-brand-500 uppercase tracking-widest text-center">KOD ƏSASLI</span>
                    </div>
                  ) : banner.imageUrl ? (
                    <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                    <span className="px-2 py-0.5 rounded-lg text-[8px] font-black bg-brand-500 text-white shadow-lg shadow-brand-500/30 uppercase tracking-tighter">
                      {getPositionName(banner.position).split(' ')[0]}
                    </span>
                  </div>
                </div>

                <div className="p-3 sm:p-4 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate group-hover:text-brand-500 transition-colors" title={banner.title}>{banner.title}</h3>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Baxış</span>
                      <span className="text-xs font-black text-brand-600 dark:text-brand-400">{banner.viewCount || 0}</span>
                    </div>
                    {!banner.isActive && (
                      <span className="px-2 py-0.5 rounded-md text-[8px] font-black bg-red-100 dark:bg-red-900/30 text-red-500 uppercase">Deaktiv</span>
                    )}
                  </div>

                  <div className="mt-auto flex gap-1.5">
                    <button onClick={() => { setSelectedBanner(banner); setIsModalOpen(true); setShowPreview(false); setTempScriptCode(''); }} className="flex-1 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[10px] sm:text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-brand-500 hover:text-white hover:border-brand-500 transition-all duration-300">Redaktə</button>
                    <button onClick={() => handleDelete(banner.id)} className="p-2 rounded-lg border border-red-100 dark:border-red-900/30 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 py-4">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`size-10 rounded-xl text-sm font-bold transition-all ${currentPage === i + 1 ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center p-2 sm:p-4">
          <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white dark:bg-gray-900 w-full max-w-5xl rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-5 flex items-center justify-between shrink-0">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {selectedBanner ? 'Banneri Redaktə Et' : 'Yeni Banner'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <form onSubmit={handleSave} className="p-6">
                <div className={`grid grid-cols-1 ${showPreview && (tempScriptCode || selectedBanner?.scriptCode) ? 'xl:grid-cols-2' : ''} gap-8`}>
                  {/* Left Side: Inputs */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className={labelClass}>Başlıq</label>
                        <input name="title" defaultValue={selectedBanner?.title} required placeholder="Məs: Yaz endirimləri" className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Pozisiya</label>
                        <select
                          name="position"
                          defaultValue={
                            typeof selectedBanner?.position === 'number'
                              ? ({ 1: 'LeftSidebar', 2: 'RightSidebar', 3: 'Top', 4: 'Bottom', 5: 'InnerContent', 6: 'Branding' } as Record<number, string>)[selectedBanner.position]
                              : selectedBanner?.position || 'Top'
                          }
                          className={inputClass}
                        >
                          <option value="LeftSidebar">Sol Sidebar</option>
                          <option value="RightSidebar">Sağ Sidebar</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                      <label className={labelClass}>Reklam Şəkli (İstəyə görə)</label>
                      {selectedBanner?.imageUrl && (
                        <div className="w-24 h-16 rounded-xl overflow-hidden border-2 border-white dark:border-gray-700 shadow-md mb-3 bg-white">
                          <img src={selectedBanner.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <input type="file" name="imageFile" accept="image/*" className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-3 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-brand-500 file:text-white hover:file:bg-brand-600 transition-all cursor-pointer" />
                      <p className="text-[10px] text-gray-400 mt-2 italic">Əgər aşağıda reklam kodu daxil edəcəksinizsə, şəkil yükləmək məcburi deyil.</p>
                    </div>

                    <div>
                      <label className={labelClass}>Yönləndiriləcək Link (URL)</label>
                      <input name="targetUrl" defaultValue={selectedBanner?.targetUrl} placeholder="https://..." className={inputClass} />
                      <p className="text-[10px] text-gray-400 mt-1.5 ml-1">Kod əsaslı reklamlarda link kodun içində ola bilər.</p>
                    </div>

                    <div className="space-y-4 p-4 bg-gray-900 rounded-2xl border border-gray-800">
                      <div className="flex items-center justify-between">
                        <label className={labelClass + " !text-gray-300"}>Reklam Kodu (Əsas reklam növü)</label>
                        <button
                          type="button"
                          onClick={() => setShowPreview(!showPreview)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all ${showPreview ? 'bg-red-500/10 text-red-500' : 'bg-brand-500/10 text-brand-500'}`}
                        >
                          <span className="material-symbols-outlined !text-[14px]">{showPreview ? 'visibility_off' : 'visibility'}</span>
                          {showPreview ? 'Bağla' : 'Önizlə'}
                        </button>
                      </div>

                      <textarea
                        name="scriptCode"
                        defaultValue={selectedBanner?.scriptCode}
                        onChange={(e) => setTempScriptCode(e.target.value)}
                        rows={8}
                        placeholder="<script>...</script> və ya <iframe>...</iframe>"
                        className="w-full px-4 py-3 rounded-xl bg-black border border-gray-800 text-brand-400 font-mono text-xs focus:outline-none focus:border-brand-500 transition-all resize-y"
                      />
                      <p className="text-[10px] text-gray-500 italic">Şəkil əvəzinə hərəkətli/animasiyalı kod daxil edə bilərsiniz.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className={labelClass}>Başlama Tarixi</label>
                        <input type="date" name="startDate" required defaultValue={selectedBanner?.startDate ? new Date(selectedBanner.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} className={inputClass} />
                      </div>
                      <div>
                        <label className={labelClass}>Bitmə Tarixi</label>
                        <input type="date" name="endDate" required defaultValue={selectedBanner?.endDate ? new Date(selectedBanner.endDate).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} className={inputClass} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div>
                        <label className={labelClass}>Kateqoriya</label>
                        <select name="categoryId" defaultValue={selectedBanner?.categoryId || ''} className={inputClass}>
                          <option value="">Hamısı</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Şəhər</label>
                        <select name="cityId" defaultValue={selectedBanner?.cityId || ''} className={inputClass}>
                          <option value="">Hamısı</option>
                          {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Dil</label>
                        <select name="language" defaultValue={selectedBanner?.language || ''} className={inputClass}>
                          <option value="">Hamısı</option>
                          <option value="az">Azərbaycanca</option>
                          <option value="ru">Rusca</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-5 rounded-2xl bg-brand-50/50 dark:bg-brand-900/5 border border-brand-100 dark:border-brand-900/20">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative flex items-center">
                          <input type="checkbox" name="isActive" defaultChecked={selectedBanner ? selectedBanner.isActive : true} className="peer size-5 opacity-0 absolute cursor-pointer" />
                          <div className="size-5 rounded border-2 border-brand-200 peer-checked:bg-brand-500 peer-checked:border-brand-500 transition-all flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path d="M5 13l4 4L19 7" /></svg>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-brand-600 transition-colors">Reklam Aktivdir</span>
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Prioritet:</label>
                        <input type="number" name="priority" defaultValue={selectedBanner?.priority || 0} className="w-16 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-center font-black text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full py-4 rounded-2xl bg-brand-500 text-white text-base font-black uppercase tracking-widest hover:bg-brand-600 transition-all disabled:opacity-60 flex items-center justify-center gap-3 shadow-xl shadow-brand-500/30 active:scale-[0.98]"
                    >
                      {isProcessing ? (
                        <><div className="h-5 w-5 animate-spin rounded-full border-3 border-white/30 border-t-white"></div> Saxlanılır...</>
                      ) : 'Yadda Saxla'}
                    </button>
                  </div>

                  {/* Right Side: Sticky Preview */}
                  {showPreview && (tempScriptCode || selectedBanner?.scriptCode) && (
                    <div className="xl:sticky xl:top-0 space-y-4 h-full">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                          <span className="flex h-2 w-2 rounded-full bg-brand-500 animate-pulse"></span>
                          Canlı Önizləmə
                        </p>
                        <span className="bg-brand-500/10 text-brand-500 border border-brand-500/20 rounded-full text-[9px] px-2 py-0.5 font-black uppercase tracking-tighter">LIVE MODE</span>
                      </div>

                      <div className="w-full h-[400px] sm:h-[500px] xl:h-[calc(95vh-140px)] flex flex-col bg-white rounded-3xl border-4 border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden relative group">
                        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] -z-10 opacity-30" />

                        <iframe
                          key={(tempScriptCode || selectedBanner?.scriptCode).length}
                          title="Ad Preview"
                          srcDoc={`
                            <html>
                              <head>
                                <style>
                                  body { 
                                    margin: 0; 
                                    padding: 20px; 
                                    display: flex; 
                                    justify-content: center; 
                                    align-items: flex-start; 
                                    min-height: 100vh; 
                                    font-family: 'Inter', sans-serif; 
                                    background: transparent;
                                    overflow-y: auto;
                                    overflow-x: hidden;
                                  }
                                  * { max-width: 100%; box-sizing: border-box; }
                                  ::-webkit-scrollbar { width: 6px; }
                                  ::-webkit-scrollbar-track { background: transparent; }
                                  ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
                                  ::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
                                </style>
                              </head>
                              <body>
                                <div style="width: 100%; display: flex; justify-content: center;">
                                  ${tempScriptCode || selectedBanner?.scriptCode || ''}
                                </div>
                              </body>
                            </html>
                          `}
                          className="w-full h-full border-none"
                          sandbox="allow-scripts allow-popups allow-forms"
                        />

                        {/* Overlay Tooltip - Desktop only */}
                        <div className="absolute bottom-6 left-6 right-6 bg-gray-900/90 backdrop-blur-md p-4 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 border border-white/10 pointer-events-none hidden sm:block transform translate-y-2 group-hover:translate-y-0">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="material-symbols-outlined text-brand-500 !text-lg">info</span>
                            <p className="text-[10px] font-black text-white uppercase tracking-widest">Məlumat</p>
                          </div>
                          <p className="text-[10px] text-white/60 leading-relaxed font-medium">
                            Bu reklamın real vaxt rejimində simulyasiyasıdır. Kod üzərində etdiyiniz hər bir simvol dəyişikliyi burada dərhal əks olunacaq.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </form>
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
    </div>
  );
}
