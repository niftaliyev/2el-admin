'use client';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { useEffect, useState, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { seoService, SeoPageDto } from '@/services/seo.service';
import { adminService } from '@/services/admin.service';
import toast from 'react-hot-toast';
import Button from '@/components/ui/button/Button';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import QuillEditor from '@/components/form/QuillEditor';
import Link from 'next/link';

interface FlatCategory {
  id: string;
  name: string;
  depth: number;
}

function getFlatCategories(cats: any[], depth = 0): FlatCategory[] {
  let list: FlatCategory[] = [];
  for (const cat of cats) {
    list.push({
      id: cat.id,
      name: cat.name,
      depth: depth,
    });
    if (cat.children && cat.children.length > 0) {
      list = list.concat(getFlatCategories(cat.children, depth + 1));
    }
  }
  return list;
}

function AdminSeoPageCreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('id');

  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New state for pinned ads
  const [pinnedAds, setPinnedAds] = useState<{ id: string; title: string; pinCode: number }[]>([]);
  const [adSearchQuery, setAdSearchQuery] = useState('');
  const [adSearchResults, setAdSearchResults] = useState<any[]>([]);
  const [searchingAds, setSearchingAds] = useState(false);

  const [formData, setFormData] = useState<SeoPageDto>({
    slug: '',
    titleH1: '',
    contentTop: '',
    titleH2: '',
    contentBottom: '',
    categoryId: '',
    adIds: [],
    metaTitle: '',
    metaDescription: '',
  });

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await adminService.getAdminCategories();
        // Filter out parent category items or include all. Let's include all.
        setCategories(cats);
      } catch (err) {
        console.error('Error loading categories:', err);
        toast.error('Kateqoriyaları yükləmək mümkün olmadı');
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    if (!editId) {
      const queryParam = searchParams.get('query');
      if (queryParam) {
        const slugified = queryParam
          .toLowerCase()
          .replace(/ə/g, 'e')
          .replace(/ı/g, 'i')
          .replace(/ö/g, 'o')
          .replace(/ü/g, 'u')
          .replace(/ç/g, 'c')
          .replace(/ş/g, 's')
          .replace(/ğ/g, 'g')
          .replace(/[^a-z0-9\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-');

        const capitalized = queryParam
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        setFormData(prev => ({
          ...prev,
          slug: slugified,
          titleH1: capitalized,
        }));
      }
      setLoading(false);
      return;
    }

    const loadPageData = async () => {
      try {
        setLoading(true);
        const data = await seoService.getPageById(editId);
        setFormData({
          id: data.id,
          slug: data.slug,
          titleH1: data.titleH1,
          contentTop: data.contentTop || '',
          titleH2: data.titleH2 || '',
          contentBottom: data.contentBottom || '',
          categoryId: data.categoryId || '',
          adIds: data.adIds || [],
          metaTitle: data.metaTitle || '',
          metaDescription: data.metaDescription || '',
        });
        if (data.ads) {
          setPinnedAds(data.ads);
        }
      } catch (err) {
        console.error('Error loading SEO page:', err);
        toast.error('SEO səhifəsini yükləmək mümkün olmadı');
        router.push('/seo-pages');
      } finally {
        setLoading(false);
      }
    };

    loadPageData();
  }, [editId, router]);

  const handleAdSearch = async () => {
    if (!adSearchQuery.trim()) {
      setAdSearchResults([]);
      return;
    }
    try {
      setSearchingAds(true);
      const res = await adminService.getAds(1, 15, 'active', adSearchQuery.trim());
      setAdSearchResults(res.data || []);
    } catch (err) {
      console.error('Error searching ads:', err);
      toast.error('Elanları axtarmaq mümkün olmadı');
    } finally {
      setSearchingAds(false);
    }
  };

  const addPinnedAd = (ad: any) => {
    if (pinnedAds.some(a => a.id === ad.id)) {
      toast.error('Bu elan artıq əlavə edilib');
      return;
    }
    setPinnedAds([...pinnedAds, { id: ad.id, title: ad.title, pinCode: ad.pinCode }]);
    toast.success('Elan əlavə edildi');
  };

  const removePinnedAd = (id: string) => {
    setPinnedAds(pinnedAds.filter(a => a.id !== id));
    toast.success('Elan silindi');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.slug || !formData.titleH1) {
      toast.error('Slug və H1 başlıq mütləqdir');
      return;
    }

    // Validate slug (letters, numbers, hyphens)
    const slugRegex = /^[a-z0-9-_]+$/;
    if (!slugRegex.test(formData.slug.trim().toLowerCase())) {
      toast.error('Slug yalnız kiçik ingilis hərfləri, rəqəmlər və defis (-) ola bilər.');
      return;
    }

    try {
      setSaving(true);
      const payload: SeoPageDto = {
        ...formData,
        slug: formData.slug.trim().toLowerCase(),
        categoryId: formData.categoryId || undefined, // Send undefined if empty
        adIds: pinnedAds.map(a => a.id),
        metaTitle: formData.metaTitle?.trim() || undefined,
        metaDescription: formData.metaDescription?.trim() || undefined,
      };

      if (editId) {
        await seoService.updatePage(editId, payload);
        toast.success('SEO Səhifəsi uğurla yeniləndi');
      } else {
        await seoService.createPage(payload);
        toast.success('SEO Səhifəsi uğurla yaradıldı');
      }
      router.push('/seo-pages');
    } catch (err: any) {
      console.error('Error saving SEO page:', err);
      toast.error(err.response?.data?.message || 'Xəta baş verdi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {editId ? 'SEO Səhifəsini Redaktə Et' : 'Yeni SEO Səhifəsi Yarat'}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            SEO dostu filtr səhifəsi detallarını daxil edin
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="slug">Slug (URL segmenti) *</Label>
            <Input
              id="slug"
              placeholder="məs. ucuz-telefonlar"
              required
              value={formData.slug}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, slug: e.target.value })}
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Bu slug vasitəsilə səhifə https://2el.az/[slug] ünvanında görünəcək.
            </p>
          </div>

          <div>
            <Label htmlFor="category">Məhsul Kateqoriyası</Label>
            <select
              id="category"
              className="w-full h-11 px-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-500"
              value={formData.categoryId || ''}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            >
              <option value="">Hamısı (Heç bir filtr yoxdur)</option>
              {getFlatCategories(categories).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.depth > 0 ? '\u00A0\u00A0'.repeat(cat.depth) + '↳ ' : ''}{cat.name}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-gray-400 mt-1">
              Seçilmiş kateqoriyanın elanları avtomatik olaraq bu səhifədə listələnəcək.
            </p>
          </div>
        </div>

        <hr className="border-gray-200 dark:border-gray-800" />

        <div className="space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-white text-base">Seçilmiş Konkret Elanlar (Məhsullar)</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Bu SEO səhifəsində nümayiş olunmasını istədiyiniz konkret elanları axtarıb əlavə edə bilərsiniz. Əgər heç bir elan seçilməzsə, yuxarıda seçdiyiniz kateqoriyanın bütün elanları göstəriləcək.
          </p>

          {/* Search interface */}
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Elanın adı və ya Pin kodu ilə axtar..."
                className="w-full h-11 px-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-500"
                value={adSearchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAdSearchQuery(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAdSearch();
                  }
                }}
              />
            </div>
            <Button type="button" onClick={handleAdSearch} disabled={searchingAds}>
              {searchingAds ? 'Axtarılır...' : 'Axtar'}
            </Button>
          </div>

          {/* Search results */}
          {adSearchResults.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto space-y-2">
              <div className="flex justify-between items-center text-xs text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-1 mb-2">
                <span>Axtarış Nəticələri</span>
                <button type="button" onClick={() => setAdSearchResults([])} className="hover:text-red-500 text-xs">Təmizlə</button>
              </div>
              {adSearchResults.map((ad) => {
                const isAdded = pinnedAds.some(a => a.id === ad.id);
                return (
                  <div key={ad.id} className="flex justify-between items-center text-sm p-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-150 dark:border-gray-800 hover:border-brand-500 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-brand-600 dark:text-brand-400">PIN: {ad.pinCode}</span>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{ad.title}</span>
                    </div>
                    <Button
                      type="button"
                      variant={isAdded ? 'outline' : 'primary'}
                      size="sm"
                      onClick={() => addPinnedAd(ad)}
                      disabled={isAdded}
                    >
                      {isAdded ? 'Əlavə edilib' : 'Əlavə et'}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pinned ads list */}
          <div className="space-y-2">
            <Label>Seçilmiş Elanlar ({pinnedAds.length})</Label>
            {pinnedAds.length === 0 ? (
              <div className="text-center py-6 text-sm text-gray-400 bg-gray-50 dark:bg-gray-800/30 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                Hələ heç bir elan seçilməyib.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto pr-1">
                {pinnedAds.map((ad, index) => (
                  <div key={ad.id} className="flex justify-between items-center p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-50 dark:bg-brand-900/30 text-xs font-bold text-brand-600 dark:text-brand-400">
                        {index + 1}
                      </span>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white text-sm">{ad.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">PIN: {ad.pinCode}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removePinnedAd(ad.id)}
                      className="p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      title="Sil"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <hr className="border-gray-200 dark:border-gray-800" />

        <div className="space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-white text-base">Üst SEO Məzmunu</h3>
          <div>
            <Label htmlFor="titleH1">H1 Başlığı *</Label>
            <Input
              id="titleH1"
              placeholder="məs. Ucuz və Sərfəli Telefonlar"
              required
              value={formData.titleH1}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, titleH1: e.target.value })}
            />
          </div>

          <div>
            <Label>Üst Təsvir (Mətn redaktoru - HTML qəbul edir)</Label>
            <QuillEditor
              value={formData.contentTop || ''}
              onChange={(content) => {
                if (content !== formData.contentTop) {
                  setFormData(prev => ({ ...prev, contentTop: content }));
                }
              }}
              placeholder="Elanların yuxarısında görünəcək mətni daxil edin..."
            />
          </div>
        </div>

        <hr className="border-gray-200 dark:border-gray-800" />

        <div className="space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-white text-base">Alt SEO Məzmunu</h3>
          <div>
            <Label htmlFor="titleH2">H2 Başlığı</Label>
            <Input
              id="titleH2"
              placeholder="məs. Telefon alarkən nələrə diqqət etməli?"
              value={formData.titleH2}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, titleH2: e.target.value })}
            />
          </div>

          <div>
            <Label>Alt Təsvir (Mətn redaktoru - HTML qəbul edir)</Label>
            <QuillEditor
              value={formData.contentBottom || ''}
              onChange={(content) => {
                if (content !== formData.contentBottom) {
                  setFormData(prev => ({ ...prev, contentBottom: content }));
                }
              }}
              placeholder="Elanların aşağısında görünəcək mətni daxil edin..."
            />
          </div>
        </div>

        <hr className="border-gray-200 dark:border-gray-800" />

        <div className="space-y-4">
          <h3 className="font-bold text-gray-900 dark:text-white text-base">SEO Meta Məlumatları (Axtarış motorları üçün)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="metaTitle">Meta Başlıq (Meta Title)</Label>
              <Input
                id="metaTitle"
                placeholder="məs. Attestatla Türkiyədə Təhsil Qiymətləri"
                value={formData.metaTitle || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, metaTitle: e.target.value })}
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Axtarış motorlarında görünəcək səhifə başlığı. Boş buraxılsa, H1 başlığı istifadə olunacaq.
              </p>
            </div>

            <div className="flex flex-col">
              <Label htmlFor="metaDescription">Meta Təsvir (Meta Description)</Label>
              <textarea
                id="metaDescription"
                rows={3}
                placeholder="məs. Türkiyədə attestatla təhsil qiymətləri, universitetlər və ixtisaslar haqqında ətraflı məlumat..."
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:border-brand-500 placeholder:text-gray-400"
                value={formData.metaDescription || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, metaDescription: e.target.value })}
              />
              <p className="text-[10px] text-gray-400 mt-1">
                Axtarış motorlarında görünəcək qısa təsvir. Boş buraxılsa, üst təsvirin ilk 160 simvolu istifadə olunacaq.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-4">
          <Link href="/seo-pages">
            <Button variant="outline" type="button" disabled={saving}>
              Ləğv et
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            {saving ? 'Yadda saxlanılır...' : 'Yadda saxla'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function AdminSeoPageCreate() {
  return (
    <PermissionGuard roles={["SuperAdmin", "Admin"]}>
      <AdminSeoPageCreateContent />
    </PermissionGuard>
  );
}
