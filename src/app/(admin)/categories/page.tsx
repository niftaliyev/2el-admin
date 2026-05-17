'use client';
import PermissionGuard from '@/components/auth/PermissionGuard';

import { useState, useEffect } from 'react';
import { adminService } from '@/services/admin.service';
import toast from 'react-hot-toast';
import {
  FolderIcon,
  PlusIcon,
  PencilIcon,
  TrashBinIcon,
  GridIcon,
  ChevronDownIcon,
  BoxCubeIcon,
  DocsIcon,
  PlugInIcon,
  HorizontaLDots,
  ListIcon,
  PieChartIcon
} from '@/icons';
import { ConfirmationModal } from '@/components/ui/modal';

interface SubCategory {
  id: string;
  name: string;
  nameRu?: string;
  slug: string;
  imageUrl?: string;
  categoryId: string;
}

interface Category {
  id: string;
  name: string;
  nameRu?: string;
  slug: string;
  imageUrl?: string;
  parentId?: string;
  children: Category[];
  subCategories: SubCategory[];
  freeLimit: number;
  paidPrice1: number;
  paidPrice3: number;
  paidPrice5: number;
  paidPrice10: number;
  paidPrice20: number;
  paidPrice25: number;
  paidPrice50: number;
  paidPrice75: number;
  paidPrice80: number;
  fieldCount: number;
}

function CategoriesPageContent() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'category' | 'subcategory'>('category');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Category Fields State
  const [isFieldsModalOpen, setIsFieldsModalOpen] = useState(false);
  const [fieldsCategoryId, setFieldsCategoryId] = useState<string | null>(null);
  const [categoryFields, setCategoryFields] = useState<any[]>([]);
  const [selectedField, setSelectedField] = useState<any>(null);
  const [isFieldFormOpen, setIsFieldFormOpen] = useState(false);

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

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAdminCategories();
      setCategories(data);
    } catch {
      toast.error('Kateqoriyaları yükləmək mümkün olmadı');
    } finally {
      setLoading(false);
    }
  };

  // Category Fields Logic
  const openFieldsModal = async (categoryId: string) => {
    setFieldsCategoryId(categoryId);
    setIsFieldsModalOpen(true);
    fetchFields(categoryId);
  };

  const fetchFields = async (categoryId: string) => {
    try {
      const data = await adminService.getCategoryFields(categoryId);
      setCategoryFields(data);
    } catch {
      toast.error('Sahələri yükləmək mümkün olmadı');
    }
  };

  const handleSaveField = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const field: any = {
      id: selectedField?.id || '00000000-0000-0000-0000-000000000000',
      categoryId: fieldsCategoryId,
      name: formData.get('name'),
      nameRu: formData.get('nameRu'),
      fieldType: formData.get('fieldType'),
      isRequired: formData.get('isRequired') === 'on',
      optionsJson: formData.get('optionsJson'),
      optionsJsonRu: formData.get('optionsJsonRu'),
    };

    try {
      setIsProcessing(true);
      await adminService.upsertCategoryField(field);
      toast.success('Sahə yadda saxlanıldı');
      setIsFieldFormOpen(false);
      fetchFields(fieldsCategoryId!);
      fetchCategories(); // Refresh field counts
    } catch {
      toast.error('Xəta baş verdi');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteField = async (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Sahəni Sil',
      message: 'Bu sahəni silmək istədiyinizə əminsiniz?',
      onConfirm: async () => {
        try {
          await adminService.deleteCategoryField(id);
          toast.success('Sahə silindi');
          fetchFields(fieldsCategoryId!);
          fetchCategories(); // Refresh field counts
        } catch (error: any) {
          toast.error(error?.response?.data?.message || 'Xəta baş verdi');
        }
      },
    });
  };

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedIds(newSet);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const item: any = {
      id: selectedItem?.id || '00000000-0000-0000-0000-000000000000',
      name: formData.get('name'),
      nameRu: formData.get('nameRu'),
      slug: formData.get('slug'),
      image: (e.currentTarget.querySelector('input[name="image"]') as HTMLInputElement).files?.[0],
    };

    try {
      setIsProcessing(true);
      if (modalType === 'category') {
        item.parentId = parentId || formData.get('parentId') || null;
        item.freeLimit = parseInt(formData.get('freeLimit') as string) || 0;
        item.paidPrice1 = parseFloat(formData.get('paidPrice1') as string) || 0;
        item.paidPrice3 = parseFloat(formData.get('paidPrice3') as string) || 0;
        item.paidPrice5 = parseFloat(formData.get('paidPrice5') as string) || 0;
        item.paidPrice10 = parseFloat(formData.get('paidPrice10') as string) || 0;
        item.paidPrice20 = parseFloat(formData.get('paidPrice20') as string) || 0;
        item.paidPrice25 = parseFloat(formData.get('paidPrice25') as string) || 0;
        item.paidPrice50 = parseFloat(formData.get('paidPrice50') as string) || 0;
        item.paidPrice75 = parseFloat(formData.get('paidPrice75') as string) || 0;
        item.paidPrice80 = parseFloat(formData.get('paidPrice80') as string) || 0;

        await adminService.upsertCategory(item);
      } else {
        item.categoryId = parentId || formData.get('categoryId');
        await adminService.upsertSubCategory(item);
      }

      toast.success('Məlumat yadda saxlanıldı');
      setIsModalOpen(false);
      fetchCategories();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Xəta baş verdi');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (id: string, type: 'category' | 'subcategory') => {
    setConfirmModal({
      isOpen: true,
      title: type === 'category' ? 'Kateqoriyanı Sil' : 'Alt Kateqoriyanı Sil',
      message: 'Silmək istədiyinizə əminsiniz?',
      onConfirm: async () => {
        try {
          if (type === 'category') await adminService.deleteCategory(id);
          else await adminService.deleteSubCategory(id);
          toast.success('Silindi');
          fetchCategories();
        } catch (error: any) {
          toast.error(error?.response?.data?.message || 'Silinmə zamanı xəta baş verdi');
        }
      },
    });
  };

  const filterCategories = (cats: Category[]): Category[] => {
    if (!searchTerm) return cats;
    const lowerTerm = searchTerm.toLowerCase();

    const matchesSearch = (cat: Category): boolean => {
      // Check current category
      const matchesCategory =
        cat.name.toLowerCase().includes(lowerTerm) ||
        cat.nameRu?.toLowerCase().includes(lowerTerm) ||
        cat.slug.toLowerCase().includes(lowerTerm) ||
        cat.id.toLowerCase().includes(lowerTerm);

      if (matchesCategory) return true;

      // Check subcategories
      const matchesSubCategory = cat.subCategories?.some(
        sc =>
          sc.name.toLowerCase().includes(lowerTerm) ||
          sc.nameRu?.toLowerCase().includes(lowerTerm) ||
          sc.slug.toLowerCase().includes(lowerTerm) ||
          sc.id.toLowerCase().includes(lowerTerm)
      );

      if (matchesSubCategory) return true;

      // Check children recursively
      const matchesChildren = cat.children?.some(child => matchesSearch(child));

      return matchesChildren;
    };

    return cats.filter(c => matchesSearch(c));
  };

  const renderCategoryRow = (cat: Category, level: number = 0) => {
    const lowerTerm = searchTerm.toLowerCase();

    const checkDescendants = (item: Category): boolean => {
      // Check subcategories of this item
      if (item.subCategories?.some(sc =>
        sc.name.toLowerCase().includes(lowerTerm) ||
        sc.nameRu?.toLowerCase().includes(lowerTerm) ||
        sc.slug.toLowerCase().includes(lowerTerm) ||
        sc.id.toLowerCase().includes(lowerTerm)
      )) return true;

      // Check children of this item recursively
      if (item.children?.some(child =>
        child.name.toLowerCase().includes(lowerTerm) ||
        child.nameRu?.toLowerCase().includes(lowerTerm) ||
        child.slug.toLowerCase().includes(lowerTerm) ||
        child.id.toLowerCase().includes(lowerTerm) ||
        checkDescendants(child)
      )) return true;

      return false;
    };

    const hasMatchInDescendants = searchTerm && checkDescendants(cat);
    const isExpanded = expandedIds.has(cat.id) || !!hasMatchInDescendants;
    const hasChildren = (cat.children?.length > 0) || (cat.subCategories?.length > 0);

    return (
      <div key={cat.id} className="w-full">
        <div
          className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl transition-all duration-300 border group
            ${isExpanded ? 'bg-brand-50/50 dark:bg-brand-900/10 border-brand-100 dark:border-brand-900/30' : 'bg-white dark:bg-gray-900/50 border-gray-100 dark:border-gray-800'}
            hover:shadow-lg hover:shadow-gray-200/50 dark:hover:shadow-none hover:border-brand-200 dark:hover:border-brand-800/50 mb-2`}
          style={{ marginLeft: `${level * (typeof window !== 'undefined' && window.innerWidth < 640 ? 12 : 28)}px` }}
        >
          <div className="flex items-center gap-4 flex-1">
            <button
              onClick={() => toggleExpand(cat.id)}
              className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all
                ${isExpanded ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}
                ${!hasChildren ? 'opacity-0 cursor-default' : ''}`}
            >
              <ChevronDownIcon className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? '' : '-rotate-90'}`} />
            </button>

            <div className="relative group/img">
              <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 border-2 border-white dark:border-gray-700 shadow-sm overflow-hidden flex-shrink-0 transition-transform group-hover/img:scale-110">
                {cat.imageUrl ? (
                  <img src={cat.imageUrl} alt="" className="w-full h-full object-contain p-2" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <GridIcon className="w-6 h-6" />
                  </div>
                )}
              </div>
              {cat.fieldCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-brand-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white dark:border-gray-900 shadow-sm">
                  {cat.fieldCount}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
                  {cat.name}
                </h4>
                <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-[10px] font-semibold text-gray-500 tracking-wider">
                  {cat.slug}
                </span>
              </div>
              {cat.nameRu && (
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5 truncate italic">
                  {cat.nameRu}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-1.5 px-2 border-t sm:border-t-0 border-gray-100 dark:border-gray-800 pt-3 sm:pt-0">
            <button
              onClick={() => openFieldsModal(cat.id)}
              className="p-2.5 rounded-xl text-gray-500 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all group/btn"
              title="Sahələri (Filters) İdarə Et"
            >
              <DocsIcon className="w-5 h-5" />
            </button>
            <div className="h-6 w-[1px] bg-gray-100 dark:bg-gray-800 mx-1"></div>
            <button
              onClick={() => {
                setModalType('category');
                setSelectedItem(null);
                setParentId(cat.id);
                setIsModalOpen(true);
              }}
              className="p-2.5 rounded-xl text-gray-500 hover:text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20 transition-all"
              title="Alt Kateqoriya Əlavə Et"
            >
              <PlusIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setModalType('subcategory');
                setSelectedItem(null);
                setParentId(cat.id);
                setIsModalOpen(true);
              }}
              className="p-2.5 rounded-xl text-gray-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all"
              title="Son Alt Kateqoriya Əlavə Et"
            >
              <BoxCubeIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setModalType('category');
                setSelectedItem(cat);
                setParentId(cat.parentId || null);
                setIsModalOpen(true);
              }}
              className="p-2.5 rounded-xl text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
              title="Redaktə"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleDelete(cat.id, 'category')}
              className="p-2.5 rounded-xl text-gray-500 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20 transition-all"
              title="Sil"
            >
              <TrashBinIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="relative ml-4 pl-8 border-l-2 border-gray-100 dark:border-gray-800/50 mt-1 mb-4 space-y-2">
            {/* Decorative curves for hierarchy visibility */}
            <div className="absolute top-0 left-0 w-8 h-8 border-b-2 border-l-0 border-gray-100 dark:border-gray-800/50 rounded-bl-3xl -translate-x-[2px] -translate-y-8"></div>

            {cat.children?.map(child => renderCategoryRow(child, 0))}

            {cat.subCategories?.map(sub => (
              <div key={sub.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-3 rounded-2xl bg-gray-50/50 dark:bg-gray-800/60 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:bg-white dark:hover:bg-gray-800 transition-all group/sub shadow-sm hover:shadow-md">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 overflow-hidden flex-shrink-0 shadow-inner">
                    {sub.imageUrl ? (
                      <img src={sub.imageUrl} alt="" className="w-full h-full object-contain p-2" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <HorizontaLDots className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h5 className="font-bold text-gray-700 dark:text-gray-300 group-hover/sub:text-brand-500 transition-colors text-sm">{sub.name}</h5>
                      <span className="text-[10px] font-bold text-gray-400 opacity-60 tracking-widest">/ {sub.slug}</span>
                    </div>
                    {sub.nameRu && <p className="text-[10px] font-medium text-gray-500 truncate italic">{sub.nameRu}</p>}
                  </div>
                </div>
                <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 group-hover/sub:opacity-100 transition-opacity pr-2 border-t sm:border-t-0 border-gray-100 dark:border-gray-800 pt-2 sm:pt-0">
                  <button
                    onClick={() => {
                      setModalType('subcategory');
                      setSelectedItem(sub);
                      setParentId(sub.categoryId);
                      setIsModalOpen(true);
                    }}
                    className="p-2 rounded-lg text-gray-400 hover:text-brand-500 hover:bg-white dark:hover:bg-gray-900 shadow-sm transition-all"
                  >
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(sub.id, 'subcategory')}
                    className="p-2 rounded-lg text-gray-400 hover:text-error-500 hover:bg-white dark:hover:bg-gray-900 shadow-sm transition-all"
                  >
                    <TrashBinIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {cat.subCategories?.length === 0 && cat.children?.length === 0 && (
              <div className="py-4 px-6 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
                <p className="text-xs text-gray-400 font-medium italic">Bu kateqoriya hələlik boşdur</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const inputClass = "w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-gray-800 transition-all shadow-inner";
  const labelClass = "block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-2 pl-1";

  return (
    <div className="min-h-screen pb-20">
      {/* Header Section */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-2xl bg-brand-500 shadow-xl shadow-brand-500/20 text-white">
              <FolderIcon className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Kateqoriya İdarəetməsi</h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 font-medium max-w-lg leading-relaxed">
            Kateqoriya ağacını vizual olaraq izləyin, dinamik filtrləri (CategoryFields) tənzimləyin və qiymət limitlərini idarə edin.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-500 transition-colors">
              <HorizontaLDots className="w-5 h-5 rotate-90" />
            </div>
            <input
              type="text"
              placeholder="Ad, slug və ya ID axtar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all w-full sm:w-64 shadow-sm"
            />
          </div>

          <button
            onClick={() => {
              setModalType('category');
              setSelectedItem(null);
              setParentId(null);
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-brand-500 text-white text-sm font-black hover:bg-brand-600 active:scale-95 transition-all shadow-xl shadow-brand-500/30"
          >
            <PlusIcon className="w-5 h-5" />
            Yeni Kateqoriya
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative">
        {loading ? (
          <div className="flex flex-col justify-center items-center py-32 space-y-4">
            <div className="relative">
              <div className="h-20 w-20 rounded-full border-4 border-brand-100 dark:border-gray-800"></div>
              <div className="absolute top-0 h-20 w-20 animate-spin rounded-full border-4 border-transparent border-t-brand-500"></div>
            </div>
            <p className="text-gray-400 font-bold animate-pulse tracking-widest uppercase text-xs">Yüklənir...</p>
          </div>
        ) : filterCategories(categories).length === 0 ? (
          <div className="py-32 flex flex-col items-center justify-center text-center bg-white dark:bg-gray-900/50 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
            <div className="w-24 h-24 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-6 shadow-inner">
              <HorizontaLDots className="w-10 h-10 text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Məlumat Tapılmadı</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">Kateqoriya ağacı boşdur və ya axtarışa uyğun nəticə yoxdur.</p>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {filterCategories(categories).map(cat => renderCategoryRow(cat))}
          </div>
        )}
      </div>

      {/* Upsert Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => !isProcessing && setIsModalOpen(false)} />
          <div className="relative bg-white dark:bg-gray-900 w-full max-w-3xl rounded-[2.5rem] shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] border border-white/10 dark:border-gray-800 overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-10 py-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
              <div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                  {selectedItem ? 'Məlumatı Redaktə Et' : 'Yeni Məlumat Əlavə Et'}
                </h3>
                <p className="text-sm text-gray-500 font-medium mt-1 uppercase tracking-tight">
                  {modalType === 'category' ? 'Kateqoriya' : 'Alt Kateqoriya'} Bölməsi
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-3 rounded-2xl bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-900 dark:hover:text-white shadow-sm hover:shadow-md transition-all active:scale-90"
              >
                <PlusIcon className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <form key={selectedItem?.id || 'new'} onSubmit={handleSave} className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className={labelClass}>Ad (Azərbaycan)</label>
                  <input name="name" defaultValue={selectedItem?.name} required placeholder="Məs: Daşınmaz Əmlak" className={inputClass} />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Ad (Rus)</label>
                  <input name="nameRu" defaultValue={selectedItem?.nameRu} required placeholder="Məs: Недвижимость" className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className={labelClass}>Slug (URL Dostu)</label>
                  <div className="relative">
                    <input name="slug" defaultValue={selectedItem?.slug} placeholder="Məs: dasinmaz-emlak" className={inputClass} />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-brand-500 uppercase">Auto-gen</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Şəkil / Icon</label>
                  <label className="flex items-center gap-4 p-3 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 cursor-pointer hover:border-brand-500 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center text-gray-400">
                      <GridIcon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-gray-500">Fayl seçin (SVG, PNG, JPG)</span>
                    <input type="file" name="image" accept="image/*" className="hidden" />
                  </label>
                </div>
              </div>

              {modalType === 'category' && (
                <div className="space-y-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2 mb-4">
                    <PlugInIcon className="w-5 h-5 text-brand-500" />
                    <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Limitlər və Qiymətlər</h4>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Pulsuz Limit</label>
                      <input type="number" name="freeLimit" defaultValue={selectedItem?.freeLimit || 1} className={inputClass} />
                    </div>
                    {[1, 3, 5, 10, 20, 25, 50, 75, 80].map(count => (
                      <div key={count} className="space-y-1.5">
                        <label className="text-[10px] font-black text-gray-400 uppercase">{count} Elan (₼)</label>
                        <input type="number" step="0.01" name={`paidPrice${count}`} defaultValue={selectedItem?.[`paidPrice${count}`] || 0} className={inputClass} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <input type="hidden" name="parentId" value={parentId || ''} />
              <input type="hidden" name="categoryId" value={parentId || ''} />

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-5 rounded-[1.5rem] bg-brand-500 text-white text-lg font-black hover:bg-brand-600 active:scale-[0.98] transition-all shadow-[0_20px_40px_-10px_rgba(59,130,246,0.5)] disabled:opacity-60 flex items-center justify-center gap-3"
                >
                  {isProcessing ? (
                    <div className="h-6 w-6 animate-spin rounded-full border-4 border-white/30 border-t-white"></div>
                  ) : (
                    <>
                      <div className="p-1.5 rounded-lg bg-white/20">
                        <PlusIcon className="w-5 h-5" />
                      </div>
                      Yadda Saxla
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Fields Modal */}
      {isFieldsModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-950/90 backdrop-blur-md animate-in fade-in duration-300" onClick={() => !isProcessing && setIsFieldsModalOpen(false)} />
          <div className="relative bg-white dark:bg-gray-900 w-full max-w-5xl rounded-[3rem] shadow-2xl border border-white/5 dark:border-gray-800 max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-right-10 duration-500">
            <div className="px-10 py-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/30">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-brand-500 text-white shadow-lg shadow-brand-500/20">
                  <DocsIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Kateqoriya Sahələri (Filters)</h3>
                  <p className="text-xs font-bold text-brand-500 uppercase tracking-widest mt-0.5">Dinamik parametr idarəetməsi</p>
                </div>
              </div>
              <button
                onClick={() => setIsFieldsModalOpen(false)}
                className="p-3 rounded-2xl bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-900 dark:hover:text-white shadow-sm transition-all"
              >
                <PlusIcon className="w-6 h-6 rotate-45" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 no-scrollbar">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Form Section */}
                <div className="lg:col-span-5">
                  <div className="sticky top-0 space-y-6">
                    <div className="p-8 rounded-[2rem] bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 shadow-inner">
                      <h4 className="text-lg font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <span className="w-2 h-6 bg-brand-500 rounded-full"></span>
                        {selectedField ? 'Sahəni Redaktə Et' : 'Yeni Sahə Əlavə Et'}
                      </h4>

                      <form key={selectedField?.id || 'new'} onSubmit={handleSaveField} className="space-y-6">
                        <div className="space-y-4">
                          <div>
                            <label className={labelClass}>Ad (Azərbaycan)</label>
                            <input name="name" defaultValue={selectedField?.name} required placeholder="Məs: Rəng" className={inputClass} />
                          </div>
                          <div>
                            <label className={labelClass}>Ad (Rus)</label>
                            <input name="nameRu" defaultValue={selectedField?.nameRu} required placeholder="Məs: Цвет" className={inputClass} />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className={labelClass}>Məlumat Tipi</label>
                            <select name="fieldType" defaultValue={selectedField?.fieldType || 'text'} className={inputClass}>
                              <option value="text">Mətn (Text)</option>
                              <option value="number">Rəqəm (Number)</option>
                              <option value="select">Seçim (Dropdown)</option>
                              <option value="checkbox">Bəli/Xeyr (Checkbox)</option>
                            </select>
                          </div>
                          <div className="flex items-end pb-3">
                            <label className="flex items-center gap-3 cursor-pointer group">
                              <input type="checkbox" name="isRequired" defaultChecked={selectedField?.isRequired} className="w-5 h-5 rounded-lg border-gray-300 text-brand-500 focus:ring-brand-500 transition-all" />
                              <span className="text-xs font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest group-hover:text-brand-500 transition-colors">Mütləq</span>
                            </label>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className={labelClass}>Variantlar (JSON - Az)</label>
                            <textarea name="optionsJson" defaultValue={selectedField?.optionsJson} placeholder='["Ağ", "Qara", "Qırmızı"]' className={inputClass + " h-24 font-mono text-[10px]"} />
                          </div>
                          <div>
                            <label className={labelClass}>Variantlar (JSON - Ru)</label>
                            <textarea name="optionsJsonRu" defaultValue={selectedField?.optionsJsonRu} placeholder='["Белый", "Черный", "Красный"]' className={inputClass + " h-24 font-mono text-[10px]"} />
                          </div>
                        </div>

                        <div className="flex gap-4 pt-2">
                          <button type="submit" disabled={isProcessing} className="flex-1 py-4 rounded-2xl bg-brand-500 text-white text-sm font-black hover:bg-brand-600 shadow-xl shadow-brand-500/20 active:scale-95 transition-all">
                            {isProcessing ? 'Gözləyin...' : (selectedField ? 'Yadda Saxla' : 'Sahəni Yarat')}
                          </button>
                          {selectedField && (
                            <button type="button" onClick={() => { setSelectedField(null); setIsFieldFormOpen(false); }} className="px-6 py-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 font-bold text-sm hover:bg-gray-100 transition-all">
                              Ləğv
                            </button>
                          )}
                        </div>
                      </form>
                    </div>
                  </div>
                </div>

                {/* List Section */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center justify-between mb-2 px-2">
                    <h4 className="font-black text-gray-400 uppercase tracking-[0.2em] text-[10px]">Mövcud Sahələr ({categoryFields.length})</h4>
                  </div>

                  {categoryFields.length === 0 ? (
                    <div className="py-20 text-center bg-gray-50/50 dark:bg-gray-800/20 rounded-[2rem] border-2 border-dashed border-gray-100 dark:border-gray-800">
                      <DocsIcon className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Hələlik heç bir sahə yoxdur</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {categoryFields.map(field => (
                        <div key={field.id} className="p-6 rounded-[1.5rem] bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-brand-300 dark:hover:border-brand-900/50 hover:shadow-xl hover:shadow-gray-200/40 dark:hover:shadow-none transition-all flex items-center justify-between group/card">
                          <div className="flex items-center gap-6">
                            <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-brand-500 shadow-inner group-hover/card:scale-110 transition-transform">
                              {field.fieldType === 'select' ? <ListIcon className="w-6 h-6" /> : (field.fieldType === 'number' ? <PieChartIcon className="w-6 h-6" /> : <DocsIcon className="w-6 h-6" />)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h5 className="font-black text-gray-900 dark:text-gray-100 tracking-tight">{field.name}</h5>
                                {field.isRequired && <span className="px-2 py-0.5 rounded-md bg-error-50 dark:bg-error-900/20 text-[8px] font-black text-error-600 uppercase tracking-widest border border-error-100 dark:border-error-900/30">Mütləq</span>}
                              </div>
                              <p className="text-xs font-bold text-gray-400 italic mb-2">{field.nameRu}</p>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-brand-500 uppercase bg-brand-50 dark:bg-brand-900/20 px-2 py-0.5 rounded-md">{field.fieldType}</span>
                                {field.optionsJson && (
                                  <span className="text-[10px] font-bold text-success-500 uppercase bg-success-50 dark:bg-success-900/20 px-2 py-0.5 rounded-md">
                                    {JSON.parse(field.optionsJson).length} Seçim
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
                            <button onClick={() => setSelectedField(field)} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-brand-500 hover:bg-white dark:hover:bg-gray-700 shadow-sm transition-all">
                              <PencilIcon className="w-5 h-5" />
                            </button>
                            <button onClick={() => handleDeleteField(field.id)} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:text-error-500 hover:bg-white dark:hover:bg-gray-700 shadow-sm transition-all">
                              <TrashBinIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
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
export default function CategoriesPage() {
  return (
    <PermissionGuard permission="Categories_Manage">
      <CategoriesPageContent />
    </PermissionGuard>
  );
}