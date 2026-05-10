'use client';

import { useState, useEffect } from 'react';
import { adminService } from '@/services/admin.service';
import toast from 'react-hot-toast';

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);

  useEffect(() => {
    fetchBanners();
    fetchLookups();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const data = await adminService.getBanners();
      setBanners(data);
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
    if (!confirm('Bu banneri silmək istədiyinizə əminsiniz?')) return;
    try {
      await adminService.deleteBanner(id);
      toast.success('Banner silindi');
      fetchBanners();
    } catch {
      toast.error('Silinmə zamanı xəta baş verdi');
    }
  };

  const getPositionName = (pos: number | string) => {
    const map: Record<string | number, string> = {
      1: 'Sol Sidebar', 2: 'Sağ Sidebar', 3: 'Yuxarı (Top)',
      4: 'Aşağı (Bottom)', 5: 'Məzmun Arası',
      'LeftSidebar': 'Sol Sidebar', 'RightSidebar': 'Sağ Sidebar', 'Top': 'Yuxarı (Top)',
      'Bottom': 'Aşağı (Bottom)', 'InnerContent': 'Məzmun Arası'
    };
    return map[pos] || 'Naməlum';
  };

  const inputClass = "w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500";
  const labelClass = "block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Banner Reklamları</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Saytda görünən kommersiya reklamlarını idarə edin</p>
        </div>
        <button
          onClick={() => { setSelectedBanner(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Yeni Banner
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600"></div>
        </div>
      ) : banners.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-16 flex flex-col items-center justify-center text-center">
          <svg className="w-16 h-16 text-gray-200 dark:text-gray-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 font-medium mb-3">Heç bir banner tapılmadı</p>
          <button onClick={() => { setSelectedBanner(null); setIsModalOpen(true); }} className="text-brand-500 text-sm font-semibold hover:underline">İlk banneri əlavə edin</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {banners.map(banner => (
            <div key={banner.id} className={`rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden flex flex-col ${!banner.isActive ? 'opacity-60 grayscale' : ''}`}>
              <div className="aspect-video relative overflow-hidden bg-gray-100 dark:bg-gray-800">
                {banner.imageUrl ? (
                  <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="absolute top-2 left-2 flex gap-1.5">
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-brand-500 text-white">
                    {getPositionName(banner.position)}
                  </span>
                  {!banner.isActive && (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-error-500 text-white">Deaktiv</span>
                  )}
                </div>
              </div>

              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-gray-900 dark:text-white truncate pr-2">{banner.title}</h3>
                  <span className="text-xs text-brand-500 font-bold shrink-0">{banner.viewCount || 0} baxış</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  {new Date(banner.startDate).toLocaleDateString('az-AZ')} — {new Date(banner.endDate).toLocaleDateString('az-AZ')}
                </div>
                <div className="mt-auto flex gap-2">
                  <button onClick={() => { setSelectedBanner(banner); setIsModalOpen(true); }} className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Redaktə</button>
                  <button onClick={() => handleDelete(banner.id)} className="p-2 rounded-xl border border-error-200 dark:border-error-800 text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-99999 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white dark:bg-gray-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {selectedBanner ? 'Banneri Redaktə Et' : 'Yeni Banner'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        ? ({1:'LeftSidebar', 2:'RightSidebar', 3:'Top', 4:'Bottom', 5:'InnerContent'} as Record<number, string>)[selectedBanner.position] 
                        : selectedBanner?.position || 'Top'
                    } 
                    className={inputClass}
                  >
                    <option value="Top">Yuxarı (Top)</option>
                    <option value="Bottom">Aşağı (Bottom)</option>
                    <option value="LeftSidebar">Sol Sidebar</option>
                    <option value="RightSidebar">Sağ Sidebar</option>
                    <option value="InnerContent">Məzmun Arası</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>Reklam Şəkli</label>
                {selectedBanner?.imageUrl && (
                  <img src={selectedBanner.imageUrl} alt="" className="w-20 h-14 object-cover rounded-xl border border-gray-200 dark:border-gray-700 mb-2" />
                )}
                <input type="file" name="imageFile" accept="image/*" className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-600 dark:file:bg-brand-900/20 dark:file:text-brand-400 hover:file:bg-brand-100 cursor-pointer" />
              </div>

              <div>
                <label className={labelClass}>Yönləndiriləcək Link (URL)</label>
                <input name="targetUrl" defaultValue={selectedBanner?.targetUrl} placeholder="https://..." className={inputClass} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Başlama Tarixi</label>
                  <input type="date" name="startDate" required defaultValue={selectedBanner?.startDate ? new Date(selectedBanner.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Bitmə Tarixi</label>
                  <input type="date" name="endDate" required defaultValue={selectedBanner?.endDate ? new Date(selectedBanner.endDate).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" name="isActive" defaultChecked={selectedBanner ? selectedBanner.isActive : true} className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Aktiv</span>
                </label>
                <div className="flex items-center gap-2">
                  <label className={labelClass + ' mb-0'}>Prioritet:</label>
                  <input type="number" name="priority" defaultValue={selectedBanner?.priority || 0} className="w-16 px-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-center font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 rounded-xl bg-brand-500 text-white text-sm font-bold hover:bg-brand-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div> Saxlanılır...</>
                ) : 'Yadda Saxla'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
