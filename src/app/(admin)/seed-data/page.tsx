'use client';
import PermissionGuard from '@/components/auth/PermissionGuard';

import { useEffect, useState, useMemo } from 'react';
import { adminService } from '@/services/admin.service';
import toast from 'react-hot-toast';
import { ConfirmationModal } from '@/components/ui/modal';

type DataType = 'cars' | 'phones';
type BrandData = Record<string, string[]>;

function SeedDataPageContent() {
  const [activeTab, setActiveTab] = useState<DataType>('cars');
  const [data, setData] = useState<BrandData>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [brandSearch, setBrandSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Modal states
  const [isAddBrandOpen, setIsAddBrandOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [isRenameBrandOpen, setIsRenameBrandOpen] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [newModelName, setNewModelName] = useState('');

  // Confirmation modal state
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
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = activeTab === 'cars'
        ? await adminService.getSeedDataCars()
        : await adminService.getSeedDataPhones();
      
      const parsedData = typeof result === 'string' ? JSON.parse(result) : result;
      setData(parsedData);
      setSelectedBrand(Object.keys(parsedData)[0] || null);
      setHasChanges(false);
    } catch (error) {
      console.error(error);
      toast.error('Məlumatlar yüklənərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    let currentData = { ...data };
    let hasPendingModel = false;

    // Automatically add pending model name if user typed something but didn't click add
    if (selectedBrand && newModelName.trim()) {
      const modelName = newModelName.trim();
      if (!currentData[selectedBrand].includes(modelName)) {
        const digerIndex = currentData[selectedBrand].indexOf("Digər");
        const newModels = [...currentData[selectedBrand]];
        if (digerIndex !== -1) {
          newModels.splice(digerIndex, 0, modelName);
        } else {
          newModels.push(modelName);
        }
        currentData[selectedBrand] = newModels;
        setData(currentData);
        setNewModelName('');
        hasPendingModel = true;
      }
    }

    try {
      setSaving(true);
      const jsonString = JSON.stringify(currentData, null, 2);
      if (activeTab === 'cars') await adminService.updateSeedDataCars(jsonString);
      else await adminService.updateSeedDataPhones(jsonString);
      
      toast.success(hasPendingModel ? `"${newModelName}" əlavə edildi və məlumatlar yeniləndi` : 'Məlumatlar uğurla yeniləndi');
      setHasChanges(false);
    } catch {
      toast.error('Yadda saxlayarkən xəta baş verdi');
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      await adminService.syncSeedData();
      toast.success('Məlumatlar baza ilə uğurla sinxronizasiya edildi');
    } catch {
      toast.error('Sinxronizasiya zamanı xəta baş verdi');
    } finally {
      setSyncing(false);
    }
  };

  // Brand Operations
  const addBrand = () => {
    if (!newBrandName.trim()) return;
    if (data[newBrandName.trim()]) {
      toast.error('Bu marka artıq mövcuddur');
      return;
    }
    const newData = { ...data, [newBrandName.trim()]: ["Digər"] };
    setData(newData);
    setSelectedBrand(newBrandName.trim());
    setNewBrandName('');
    setIsAddBrandOpen(false);
    setHasChanges(true);
    toast.success('Marka əlavə edildi');
  };

  const deleteBrand = (brand: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Markanı Sil',
      message: `"${brand}" markasını və bütün modellərini silmək istədiyinizə əminsiniz?`,
      onConfirm: () => {
        const newData = { ...data };
        delete newData[brand];
        setData(newData);
        if (selectedBrand === brand) {
          setSelectedBrand(Object.keys(newData)[0] || null);
        }
        setHasChanges(true);
        toast.success('Marka silindi');
      },
    });
  };

  const renameBrand = () => {
    if (!renameValue.trim() || !selectedBrand) return;
    if (data[renameValue.trim()] && renameValue.trim() !== selectedBrand) {
      toast.error('Bu adda marka artıq mövcuddur');
      return;
    }
    
    const newData = { ...data };
    const models = newData[selectedBrand];
    delete newData[selectedBrand];
    newData[renameValue.trim()] = models;
    
    setData(newData);
    setSelectedBrand(renameValue.trim());
    setIsRenameBrandOpen(false);
    setHasChanges(true);
    toast.success('Marka adı dəyişdirildi');
  };

  // Model Operations
  const addModel = (modelName: string) => {
    if (!selectedBrand || !modelName.trim()) return;
    if (data[selectedBrand].includes(modelName.trim())) {
      toast.error('Bu model artıq mövcuddur');
      return;
    }
    
    const newData = { ...data };
    const newModels = [...newData[selectedBrand]];
    // Add before "Digər" if it exists, otherwise at the end
    const digerIndex = newModels.indexOf("Digər");
    if (digerIndex !== -1) {
      newModels.splice(digerIndex, 0, modelName.trim());
    } else {
      newModels.push(modelName.trim());
    }
    
    newData[selectedBrand] = newModels;
    setData(newData);
    setNewModelName(''); // Clear state
    setHasChanges(true);
    toast.success('Model əlavə edildi');
  };

  const deleteModel = (model: string) => {
    if (!selectedBrand) return;
    setConfirmModal({
      isOpen: true,
      title: 'Modeli Sil',
      message: `"${model}" modelini silmək istədiyinizə əminsiniz?`,
      onConfirm: () => {
        const newData = { ...data };
        newData[selectedBrand] = newData[selectedBrand].filter(m => m !== model);
        setData(newData);
        setHasChanges(true);
        toast.success('Model silindi');
      },
    });
  };

  const editModel = (oldName: string, newName: string) => {
    if (!selectedBrand || !newName.trim() || oldName === newName) return;
    if (data[selectedBrand].includes(newName.trim())) {
      toast.error('Bu model artıq mövcuddur');
      return;
    }

    const newData = { ...data };
    newData[selectedBrand] = newData[selectedBrand].map(m => m === oldName ? newName.trim() : m);
    setData(newData);
    setHasChanges(true);
    toast.success('Model yeniləndi');
  };

  const filteredBrands = useMemo(() => {
    return Object.keys(data)
      .filter(brand => brand.toLowerCase().includes(brandSearch.toLowerCase()))
      .sort((a, b) => a.localeCompare(b));
  }, [data, brandSearch]);

  const filteredModels = useMemo(() => {
    if (!selectedBrand || !data[selectedBrand]) return [];
    return data[selectedBrand]
      .filter(model => model.toLowerCase().includes(modelSearch.toLowerCase()));
  }, [data, selectedBrand, modelSearch]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm">
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Marka / Model İdarəetməsi</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-300 mt-1">
            {activeTab === 'cars' ? '🚗 Avtomobil' : '📱 Telefon'} markalarını və modellərini idarə edin
          </p>
        </div>
        <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
          {(['cars', 'phones'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => {
                if (hasChanges) {
                  setConfirmModal({
                    isOpen: true,
                    title: 'Yadda Saxlanılmamış Dəyişikliklər',
                    message: 'Yadda saxlanılmamış dəyişikliklər var. Davam etmək istəyirsiniz?',
                    onConfirm: () => {
                      setActiveTab(tab);
                      setSelectedBrand(null);
                    },
                  });
                } else {
                  setActiveTab(tab);
                  setSelectedBrand(null);
                }
              }}
              className={`px-3 sm:px-5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === tab
                  ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {tab === 'cars' ? '🚗 Avtomobillər' : '📱 Telefonlar'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px] lg:min-h-[600px]">
        {/* Left Column: Brands */}
        <div className={`lg:col-span-4 flex flex-col rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm ${selectedBrand ? 'hidden lg:flex' : 'flex'}`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <svg className="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                Markalar
              </h3>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">{Object.keys(data).length}</span>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Marka axtar..."
                value={brandSearch}
                onChange={e => setBrandSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-white"
              />
              <svg className="w-4 h-4 absolute left-3 top-2.5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto max-h-[500px] p-2 space-y-1 custom-scrollbar">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-8 h-8 border-3 border-brand-500/30 border-t-brand-500 rounded-full animate-spin"></div>
                <span className="text-sm text-gray-400">Yüklənir...</span>
              </div>
            ) : filteredBrands.length > 0 ? (
              filteredBrands.map(brand => (
                <div
                  key={brand}
                  onClick={() => setSelectedBrand(brand)}
                  className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${
                    selectedBrand === brand
                      ? 'bg-brand-50 dark:bg-brand-500/15 text-brand-600 dark:text-brand-400'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/80 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  <span className="text-sm font-medium truncate">{brand}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteBrand(brand);
                      }}
                      className="p-1.5 rounded-lg hover:bg-error-50 dark:hover:bg-error-500/10 text-gray-400 hover:text-error-500 transition-colors"
                      title="Sil"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-sm text-gray-400">Nəticə tapılmadı</div>
            )}
          </div>
          
          <div className="p-3 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setIsAddBrandOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors shadow-sm shadow-brand-500/20"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Yeni Marka
            </button>
          </div>
        </div>

        {/* Right Column: Models */}
        <div className={`lg:col-span-8 flex flex-col rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden shadow-sm ${!selectedBrand ? 'hidden lg:flex' : 'flex'}`}>
          {selectedBrand ? (
            <>
              <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setSelectedBrand(null)}
                      className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
                      title="Geri"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500 shrink-0">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedBrand}</h2>
                        <button
                          onClick={() => {
                            setRenameValue(selectedBrand);
                            setIsRenameBrandOpen(true);
                          }}
                          className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-300">{data[selectedBrand]?.length || 0} model</p>
                    </div>
                  </div>
                  <div className="relative flex-1 w-full sm:max-w-xs">
                    <input
                      type="text"
                      placeholder="Model axtar..."
                      value={modelSearch}
                      onChange={e => setModelSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                    <svg className="w-4 h-4 absolute left-3 top-2.5 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-4 sm:p-6 overflow-y-auto max-h-[400px] lg:max-h-[500px] custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {/* Add Model Input Card */}
                  <div className={`p-0.5 rounded-xl border border-dashed transition-all duration-200 ${
                    newModelName.trim() 
                      ? 'border-brand-500 bg-brand-50/30 dark:bg-brand-500/5' 
                      : 'border-gray-300 dark:border-gray-700 hover:border-brand-500/50'
                  }`}>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        addModel(newModelName);
                      }}
                      className="flex"
                    >
                      <input
                        value={newModelName}
                        onChange={e => {
                          setNewModelName(e.target.value);
                          if (!hasChanges && e.target.value.trim()) setHasChanges(true);
                        }}
                        placeholder="Yeni model..."
                        className="flex-1 px-3 py-2 bg-transparent text-sm outline-none text-gray-700 dark:text-gray-300 font-medium"
                        autoComplete="off"
                      />
                      <button 
                        type="submit" 
                        disabled={!newModelName.trim()}
                        className={`px-3 transition-colors ${newModelName.trim() ? 'text-brand-500' : 'text-gray-300 dark:text-gray-600'}`}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      </button>
                    </form>
                  </div>

                  {filteredModels.map(model => (
                    <ModelItem
                      key={model}
                      name={model}
                      onDelete={() => deleteModel(model)}
                      onEdit={(newName) => editModel(model, newName)}
                    />
                  ))}
                </div>
                
                {filteredModels.length === 0 && modelSearch && (
                  <div className="py-20 text-center text-sm text-gray-400 italic">Nəticə tapılmadı</div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10 space-y-4">
              <div className="w-20 h-20 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-gray-300 dark:text-gray-700">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Marka Seçilməyib</h3>
                <p className="text-sm text-gray-500 max-w-xs">Modellərə baxmaq və onları redaktə etmək üçün soldakı siyahıdan bir marka seçin.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="fixed bottom-0 left-0 lg:left-[290px] right-0 p-5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 z-40">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${hasChanges ? 'bg-warning-500 animate-pulse' : 'bg-success-500'}`}></div>
            <p className="text-xs text-gray-500 dark:text-gray-300">
              {hasChanges ? 'Yadda saxlanılmamış dəyişikliklər var' : 'Bütün dəyişikliklər yadda saxlanılıb'}
            </p>
          </div>
          
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={handleSave}
              disabled={loading || saving || syncing || !hasChanges}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl bg-brand-500 text-white text-xs sm:text-sm font-semibold hover:bg-brand-600 transition-all disabled:opacity-50 shadow-lg shadow-brand-500/20"
            >
              {saving ? (
                <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>Saxlanılır...</>
              ) : (
                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>Yadda Saxla</>
              )}
            </button>
            <button
              onClick={handleSync}
              disabled={loading || saving || syncing}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl bg-warning-500 text-white text-xs sm:text-sm font-semibold hover:bg-warning-600 transition-all disabled:opacity-50 shadow-lg shadow-warning-500/20"
              title="Fayldakı modelləri bazaya köçür"
            >
              {syncing ? (
                <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>Sinxronlaşır...</>
              ) : (
                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>Bazaya Köçür</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Add Brand Modal */}
      {isAddBrandOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Yeni Marka Əlavə Et</h3>
              <button onClick={() => setIsAddBrandOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l18 18" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Marka Adı</label>
                <input
                  type="text"
                  autoFocus
                  value={newBrandName}
                  onChange={e => setNewBrandName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addBrand()}
                  placeholder="Məs: Mercedes"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                />
              </div>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 flex gap-3">
              <button
                onClick={() => setIsAddBrandOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Ləğv et
              </button>
              <button
                onClick={addBrand}
                className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors"
              >
                Əlavə et
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Brand Modal */}
      {isRenameBrandOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Marka Adını Dəyişdir</h3>
              <button onClick={() => setIsRenameBrandOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l18 18" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Yeni Ad</label>
                <input
                  type="text"
                  autoFocus
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && renameBrand()}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none"
                />
              </div>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 flex gap-3">
              <button
                onClick={() => setIsRenameBrandOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Ləğv et
              </button>
              <button
                onClick={renameBrand}
                className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors"
              >
                Yadda saxla
              </button>
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

function ModelItem({ name, onDelete, onEdit }: { name: string; onDelete: () => void; onEdit: (newName: string) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);

  if (isEditing) {
    return (
      <div className="group flex items-center justify-between p-2.5 pl-3 rounded-xl bg-brand-50/50 dark:bg-brand-500/5 border border-brand-200 dark:border-brand-500/20 animate-in fade-in zoom-in duration-200">
        <input
          autoFocus
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              onEdit(editValue);
              setIsEditing(false);
            }
            if (e.key === 'Escape') {
              setEditValue(name);
              setIsEditing(false);
            }
          }}
          className="flex-1 bg-transparent text-sm font-medium text-brand-600 dark:text-brand-400 outline-none"
        />
        <div className="flex items-center gap-1">
          <button onClick={() => { onEdit(editValue); setIsEditing(false); }} className="p-1 text-success-500 hover:bg-success-50 dark:hover:bg-success-500/10 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </button>
          <button onClick={() => { setEditValue(name); setIsEditing(false); }} className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l18 18" /></svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-center justify-between p-2.5 pl-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-brand-500/30 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:shadow-sm transition-all duration-200">
      <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{name}</span>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-1 group-hover:translate-x-0">
        <button
          onClick={() => setIsEditing(true)}
          className="p-1.5 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-500/10 text-gray-400 hover:text-brand-500 transition-colors"
          title="Redaktə et"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg hover:bg-error-50 dark:hover:bg-error-500/10 text-gray-400 hover:text-error-500 transition-colors"
          title="Sil"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>
    </div>
  );
}
export default function SeedDataPage() {
  return (
    <PermissionGuard roles={["SuperAdmin", "Admin"]}>
      <SeedDataPageContent />
    </PermissionGuard>
  );
}