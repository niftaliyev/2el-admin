'use client';

import { use, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { adminService } from '@/services/admin.service';
import toast from 'react-hot-toast';
import Link from 'next/link';
import PermissionGuard from '@/components/auth/PermissionGuard';

function AdEditPageContent({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const router = useRouter();

  // Lookups
  const [parentCategories, setParentCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [adTypes, setAdTypes] = useState<any[]>([]);

  // Loadings
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingSubCategories, setLoadingSubCategories] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    categoryId: '',
    subcategoryId: '',
    brandId: '',
    adTypeId: '',
    title: '',
    description: '',
    price: '',
    fullName: '',
    email: '',
    phone: '',
    cityId: '',
    isDeliverable: false,
    isNew: false,
  });

  // Category specific dynamic fields
  const [categoryFields, setCategoryFields] = useState<any[]>([]);
  const [dynamicFieldValues, setDynamicFieldValues] = useState<Record<string, string>>({});

  // Images state
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [deletedImageIds, setDeletedImageIds] = useState<string[]>([]);
  const [mainImageId, setMainImageId] = useState<string | null>(null);
  const [newMainImageIndex, setNewMainImageIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initData();
  }, [id]);

  const initData = async () => {
    try {
      setLoading(true);
      // Fetch lookups
      const [categoriesData, citiesData, adTypesData] = await Promise.all([
        adminService.getCategories(),
        adminService.getCities(),
        adminService.getAdTypes(),
      ]);

      setParentCategories(categoriesData);
      setCities(citiesData);
      setAdTypes(adTypesData);

      // Fetch ad edit data
      const ad = await adminService.getEditData(id);

      // Map ad data to form state
      setFormData({
        categoryId: ad.categoryId || '',
        subcategoryId: ad.subCategoryId || '',
        brandId: ad.brandId || '', // Technical subcategory (Brand)
        adTypeId: ad.adTypeId || '',
        title: ad.title || '',
        description: ad.description || '',
        price: ad.price !== undefined ? ad.price.toString() : '',
        fullName: ad.fullName || '',
        email: ad.email || '',
        phone: ad.phoneNumber || '',
        cityId: ad.cityId || '',
        isDeliverable: !!ad.isDeliverable,
        isNew: !!ad.isNew,
      });

      // Set existing images
      if (ad.images && ad.images.length > 0) {
        setExistingImages(ad.images);
        const mainImg = ad.images.find((img: any) => img.isMain);
        if (mainImg) {
          setMainImageId(mainImg.id);
        } else if (ad.images[0]) {
          setMainImageId(ad.images[0].id);
        }
      }

      // Populate dynamic field values
      if (ad.dynamicFields && ad.dynamicFields.length > 0) {
        const fieldValues: Record<string, string> = {};
        ad.dynamicFields.forEach((f: any) => {
          fieldValues[f.categoryFieldId] = f.value;
        });
        setDynamicFieldValues(fieldValues);
      }

      // Fetch Subcategories if root category exists
      if (ad.categoryId) {
        setLoadingSubCategories(true);
        const subData = await adminService.getCategories(ad.categoryId);
        setSubCategories(subData);

        // Fetch brands and dynamic fields if subcategory exists
        if (ad.subCategoryId) {
          setLoadingBrands(true);
          const [brandsData, fieldsData] = await Promise.all([
            adminService.getSubCategories(ad.subCategoryId),
            adminService.getCategoryFields(ad.subCategoryId)
          ]);
          setBrands(brandsData);
          setCategoryFields(fieldsData);
          setLoadingBrands(false);
        } else {
          // If no subcategory, check if category has fields
          const fieldsData = await adminService.getCategoryFields(ad.categoryId);
          setCategoryFields(fieldsData);
        }
        setLoadingSubCategories(false);
      }
    } catch (err: any) {
      toast.error('Məlumatları yükləyərkən xəta baş verdi');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle Category Change
  const handleCategoryChange = async (catId: string) => {
    setFormData(prev => ({ ...prev, categoryId: catId, subcategoryId: '', brandId: '' }));
    setSubCategories([]);
    setBrands([]);
    setCategoryFields([]);
    setDynamicFieldValues({});
    if (!catId) return;

    try {
      setLoadingSubCategories(true);
      const subData = await adminService.getCategories(catId);
      setSubCategories(subData);

      // Fetch fields for root category just in case it doesn't have child categories
      const fieldsData = await adminService.getCategoryFields(catId);
      setCategoryFields(fieldsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSubCategories(false);
    }
  };

  // Handle SubCategory Change
  const handleSubCategoryChange = async (subCatId: string) => {
    setFormData(prev => ({ ...prev, subcategoryId: subCatId, brandId: '' }));
    setBrands([]);
    setCategoryFields([]);
    setDynamicFieldValues({});
    if (!subCatId) return;

    try {
      setLoadingBrands(true);
      const [brandsData, fieldsData] = await Promise.all([
        adminService.getSubCategories(subCatId),
        adminService.getCategoryFields(subCatId),
      ]);
      setBrands(brandsData);
      setCategoryFields(fieldsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBrands(false);
    }
  };

  // Input Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDynamicFieldChange = (fieldId: string, value: string) => {
    setDynamicFieldValues(prev => ({ ...prev, [fieldId]: value }));
  };

  // Image Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    // Validate sizes
    if (files.some(file => file.size > 10 * 1024 * 1024)) {
      toast.error('Şəkil ölçüsü 10MB-dan çox olmamalıdır.');
      return;
    }

    const previews = files.map(file => URL.createObjectURL(file));

    setNewImages(prev => [...prev, ...files]);
    setNewPreviews(prev => [...prev, ...previews]);
  };

  const removeExistingImage = (imgId: string) => {
    setDeletedImageIds(prev => [...prev, imgId]);
    setExistingImages(prev => prev.filter(img => img.id !== imgId));
    if (mainImageId === imgId) {
      setMainImageId(null);
    }
  };

  const removeNewImage = (idx: number) => {
    URL.revokeObjectURL(newPreviews[idx]);
    setNewImages(prev => prev.filter((_, i) => i !== idx));
    setNewPreviews(prev => prev.filter((_, i) => i !== idx));
    if (newMainImageIndex === idx) {
      setNewMainImageIndex(null);
    } else if (newMainImageIndex !== null && newMainImageIndex > idx) {
      setNewMainImageIndex(newMainImageIndex - 1);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) {
      toast.error('Kateqoriya seçilməlidir');
      return;
    }
    if (existingImages.length === 0 && newImages.length === 0) {
      toast.error('Ən azı 1 şəkil olmalıdır');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        CategoryId: formData.subcategoryId || formData.categoryId, // backend expects leaf category
        SubCategoryId: formData.brandId || undefined,
        CityId: formData.cityId,
        Price: parseFloat(formData.price) || 0,
        IsDeliverable: formData.isDeliverable,
        IsNew: formData.isNew,
        PhoneNumber: formData.phone,
        AdTypeId: formData.adTypeId,
        Title: formData.title,
        FullName: formData.fullName,
        Email: formData.email,
        Description: formData.description,
        Images: newImages,
        DeletedImageIds: deletedImageIds,
        DynamicFieldsJson: Object.keys(dynamicFieldValues).length > 0 ? JSON.stringify(dynamicFieldValues) : undefined,
        MainImageId: mainImageId || undefined,
        NewMainImageIndex: newMainImageIndex !== null ? newMainImageIndex : undefined,
      };

      await adminService.updateAd(id, payload);
      toast.success('Elan redaktə edildi');
      router.push(`/ads/${id}`);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Xəta baş verdi');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const getImageUrlHelper = (path: string) => {
    if (path.startsWith('http')) return path;
    const serverUrl = 'http://84.247.184.186:5000';
    return `${serverUrl}${path}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/ads" className="hover:text-brand-600">Elanlar</Link>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        <Link href={`/ads/${id}`} className="hover:text-brand-600 truncate max-w-[200px]">{formData.title}</Link>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
        <span className="text-gray-900 dark:text-white font-medium">Redaktə et</span>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Elanı Redaktə Et</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Fields */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Əsas Məlumatlar</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Başlıq</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Qiymət (AZN)</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Ana Kateqoriya</label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Seçin</option>
                {parentCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* SubCategory */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Alt Kateqoriya</label>
              <select
                name="subcategoryId"
                value={formData.subcategoryId}
                onChange={(e) => handleSubCategoryChange(e.target.value)}
                disabled={loadingSubCategories || subCategories.length === 0}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
              >
                <option value="">Seçin</option>
                {subCategories.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>

            {/* Brand */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Marka / Brand</label>
              <select
                name="brandId"
                value={formData.brandId}
                onChange={handleInputChange}
                disabled={loadingBrands || brands.length === 0}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50"
              >
                <option value="">Seçin</option>
                {brands.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* City */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Şəhər</label>
              <select
                name="cityId"
                value={formData.cityId}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Seçin</option>
                {cities.map(city => (
                  <option key={city.id} value={city.id}>{city.name}</option>
                ))}
              </select>
            </div>

            {/* Ad Type */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Elan Növü</label>
              <select
                name="adTypeId"
                value={formData.adTypeId}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Seçin</option>
                {adTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-6 pt-2">
            {/* isNew */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isNew"
                checked={formData.isNew}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Yeni (istifadə olunmamış)</span>
            </label>

            {/* isDeliverable */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="isDeliverable"
                checked={formData.isDeliverable}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Çatdırılma var</span>
            </label>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Təsvir</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={6}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
            />
          </div>
        </div>

        {/* Dynamic Fields Section */}
        {categoryFields.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Parametrlər</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categoryFields.map(field => {
                const value = dynamicFieldValues[field.id] || '';
                return (
                  <div key={field.id} className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {field.name} {field.isRequired && <span className="text-error-500">*</span>}
                    </label>
                    {field.fieldType === 'select' && field.optionsJson ? (
                      <select
                        value={value}
                        onChange={(e) => handleDynamicFieldChange(field.id, e.target.value)}
                        required={field.isRequired}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        <option value="">Seçin</option>
                        {JSON.parse(field.optionsJson).map((opt: string) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.fieldType === 'checkbox' ? (
                      <div className="pt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={value === 'true'}
                            onChange={(e) => handleDynamicFieldChange(field.id, e.target.checked ? 'true' : 'false')}
                            className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Bəli</span>
                        </label>
                      </div>
                    ) : (
                      <input
                        type={field.fieldType === 'number' ? 'number' : 'text'}
                        value={value}
                        onChange={(e) => handleDynamicFieldChange(field.id, e.target.value)}
                        required={field.isRequired}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Contact Info */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Əlaqə Məlumatları</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Ad / Soyad</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">E-poçt</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Telefon nömrəsi</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Images Upload */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Şəkillər</h2>

          <div className="space-y-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 transition-colors"
            >
              Şəkil əlavə et
            </button>
            <input
              type="file"
              ref={fileInputRef}
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-2">Mövcud Şəkillər</h3>
                <div className="flex flex-wrap gap-4">
                  {existingImages.map((img) => (
                    <div key={img.id} className={`relative w-24 h-24 rounded-xl overflow-hidden border-2 transition-all ${mainImageId === img.id ? 'border-brand-500 scale-105' : 'border-transparent opacity-85'}`}>
                      <img src={getImageUrlHelper(img.url)} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(img.id)}
                        className="absolute top-1 right-1 p-1 bg-red-500/80 rounded-full text-white hover:bg-red-600 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMainImageId(img.id);
                          setNewMainImageIndex(null);
                        }}
                        className={`absolute bottom-0 inset-x-0 py-0.5 text-[9px] font-bold text-center text-white transition-colors ${mainImageId === img.id ? 'bg-brand-500' : 'bg-black/60 hover:bg-black/80'}`}
                      >
                        {mainImageId === img.id ? 'Əsas Şəkil' : 'Əsas et'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Uploaded Previews */}
            {newPreviews.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-2">Yeni Yüklənən Şəkillər</h3>
                <div className="flex flex-wrap gap-4">
                  {newPreviews.map((preview, idx) => (
                    <div key={idx} className={`relative w-24 h-24 rounded-xl overflow-hidden border-2 transition-all ${newMainImageIndex === idx ? 'border-brand-500 scale-105' : 'border-transparent opacity-85'}`}>
                      <img src={preview} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeNewImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-red-500/80 rounded-full text-white hover:bg-red-600 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setNewMainImageIndex(idx);
                          setMainImageId(null);
                        }}
                        className={`absolute bottom-0 inset-x-0 py-0.5 text-[9px] font-bold text-center text-white transition-colors ${newMainImageIndex === idx ? 'bg-brand-500' : 'bg-black/60 hover:bg-black/80'}`}
                      >
                        {newMainImageIndex === idx ? 'Əsas Şəkil' : 'Əsas et'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3.5 rounded-xl bg-brand-500 text-white font-bold hover:bg-brand-600 active:scale-[0.99] transition-all shadow-lg shadow-brand-500/25 disabled:opacity-60 flex justify-center items-center gap-2"
          >
            {saving ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                Yadda saxlanılır...
              </>
            ) : (
              'Dəyişiklikləri Yadda Saxla'
            )}
          </button>
          <Link
            href={`/ads/${id}`}
            className="px-8 py-3.5 rounded-xl border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-850 font-bold transition-all text-center"
          >
            Ləğv Et
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function AdEditPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <PermissionGuard permission="Ads_Edit_Any">
      <AdEditPageContent params={params} />
    </PermissionGuard>
  );
}
