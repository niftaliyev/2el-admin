'use client';

import { useEffect, useState } from 'react';
import { adminService } from '@/services/admin.service';
import { helpService } from '@/services/help.service';
import { HelpCategory, HelpItem, StaticPage, LegalPolicy, PrivacyPolicy } from '@/types/admin';
import toast from 'react-hot-toast';
import Button from '@/components/ui/button/Button';
import { Modal } from '@/components/ui/modal';
import Input from '@/components/form/input/InputField';
import Label from '@/components/form/Label';
import QuillEditor from '@/components/form/QuillEditor';
import { PencilIcon, TrashBinIcon, PlusIcon, FileIcon, InfoIcon, LockIcon } from '@/icons';

type TabType = 'categories' | 'static' | 'legal' | 'privacy';

export default function AdminHelpPage() {
  const [activeTab, setActiveTab] = useState<TabType>('categories');
  const [loading, setLoading] = useState(true);

  // Data states
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [staticPages, setStaticPages] = useState<StaticPage[]>([]);
  const [legalPolicies, setLegalPolicies] = useState<LegalPolicy[]>([]);
  const [privacyPolicy, setPrivacyPolicy] = useState<PrivacyPolicy | null>(null);

  // Modals state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isStaticModalOpen, setIsStaticModalOpen] = useState(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  // Editing states
  const [editingCategory, setEditingCategory] = useState<Partial<HelpCategory> | null>(null);
  const [editingItem, setEditingItem] = useState<Partial<HelpItem> & { categoryId?: string } | null>(null);
  const [editingStatic, setEditingStatic] = useState<Partial<StaticPage> | null>(null);
  const [editingLegal, setEditingLegal] = useState<Partial<LegalPolicy> | null>(null);
  const [editingPrivacy, setEditingPrivacy] = useState<Partial<PrivacyPolicy> | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [catData, staticData, legalData] = await Promise.all([
        helpService.getContent(),
        helpService.getStaticPages(),
        helpService.getLegalPolicies()
      ]);

      setCategories(catData);
      setStaticPages(staticData);
      setLegalPolicies(legalData);

      try {
        const priv = await helpService.getPrivacyPolicy('privacy');
        setPrivacyPolicy(priv);
      } catch {
        setPrivacyPolicy(null);
      }

    } catch (error) {
      console.error('Error fetching help content:', error);
      toast.error('Məlumatları yükləmək mümkün olmadı');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Category Actions
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory?.name) return;
    try {
      await adminService.upsertHelpCategory(editingCategory);
      toast.success('Kateqoriya yadda saxlanıldı');
      setIsCategoryModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Xəta baş verdi');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Bu kateqoriyanı və bütün suallarını silmək istədiyinizə əminsiniz?')) return;
    try {
      await adminService.deleteHelpCategory(id);
      toast.success('Kateqoriya silindi');
      fetchData();
    } catch (error) {
      toast.error('Xəta baş verdi');
    }
  };

  // Item Actions
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.question || !editingItem?.categoryId) return;
    try {
      await adminService.upsertHelpItem(editingItem.categoryId, editingItem);
      toast.success('Sual-cavab yadda saxlanıldı');
      setIsItemModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Xəta baş verdi');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Bu sualı silmək istədiyinizə əminsiniz?')) return;
    try {
      await adminService.deleteHelpItem(id);
      toast.success('Sual silindi');
      fetchData();
    } catch (error) {
      toast.error('Xəta baş verdi');
    }
  };

  // Static Page Actions
  const handleSaveStatic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStatic?.title || !editingStatic?.content) return;
    try {
      await adminService.upsertStaticPage(editingStatic);
      toast.success('Səhifə yadda saxlanıldı');
      setIsStaticModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Xəta baş verdi');
    }
  };

  const handleDeleteStatic = async (id: string) => {
    if (!confirm('Bu səhifəni silmək istədiyinizə əminsiniz?')) return;
    try {
      await adminService.deleteStaticPage(id);
      toast.success('Səhifə silindi');
      fetchData();
    } catch (error) {
      toast.error('Xəta baş verdi');
    }
  };

  // Legal Policy Actions
  const handleSaveLegal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLegal?.title || !editingLegal?.content) return;
    try {
      await adminService.upsertLegalPolicy(editingLegal);
      toast.success('Sənəd yadda saxlanıldı');
      setIsLegalModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Xəta baş verdi');
    }
  };

  const handleDeleteLegal = async (id: string) => {
    if (!confirm('Bu hüquqi sənədi silmək istədiyinizə əminsiniz?')) return;
    try {
      await adminService.deleteLegalPolicy(id);
      toast.success('Sənəd silindi');
      fetchData();
    } catch (error) {
      toast.error('Xəta baş verdi');
    }
  };

  // Privacy Policy Actions
  const handleSavePrivacy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrivacy?.title || !editingPrivacy?.content) return;
    try {
      await adminService.upsertPrivacyPolicy(editingPrivacy);
      toast.success('Məxfilik siyasəti yeniləndi');
      setIsPrivacyModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error('Xəta baş verdi');
    }
  };

  const tabs = [
    { id: 'categories', label: 'Yardım Kateqoriyaları', icon: <InfoIcon /> },
    { id: 'static', label: 'Statik Səhifələr', icon: <FileIcon /> },
    { id: 'legal', label: 'Hüquqi Sənədlər', icon: <FileIcon /> },
    { id: 'privacy', label: 'Məxfilik', icon: <LockIcon /> },
  ];

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Yardım və Səhifələr</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Bütün yardım menyularını və hüquqi sənədləri idarə edin</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'categories' && (
            <Button size="sm" onClick={() => { setEditingCategory({ displayOrder: 0 }); setIsCategoryModalOpen(true); }}>Yeni Kateqoriya</Button>
          )}
          {activeTab === 'static' && (
            <Button size="sm" onClick={() => { setEditingStatic({ displayOrder: 0 }); setIsStaticModalOpen(true); }}>Yeni Səhifə</Button>
          )}
          {activeTab === 'legal' && (
            <Button size="sm" onClick={() => { setEditingLegal({ displayOrder: 0 }); setIsLegalModalOpen(true); }}>Yeni Hüquqi Sənəd</Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <span className="w-4 h-4">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 min-h-[400px]">
        {activeTab === 'categories' && (
          <div className="space-y-6">
            {categories.map((category) => (
              <div key={category.id} className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-800/50 px-5 py-3 flex justify-between items-center border-b border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div>
                      <h2 className="font-bold text-gray-900 dark:text-white">{category.name}</h2>
                      <p className="text-[10px] text-gray-500 font-medium">{category.nameRu}</p>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded uppercase">Sıra: {category.displayOrder}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingItem({ categoryId: category.id, displayOrder: 0 }); setIsItemModalOpen(true); }} className="text-xs font-bold text-brand-500 hover:underline px-2 py-1">Sual əlavə et</button>
                    <button onClick={() => { setEditingCategory(category); setIsCategoryModalOpen(true); }} className="p-1.5 rounded-lg text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20"><PencilIcon className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteCategory(category.id)} className="p-1.5 rounded-lg text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20"><TrashBinIcon className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {category.helpItems?.length > 0 ? (
                    category.helpItems.map((item) => (
                      <div key={item.id} className="group flex justify-between items-start p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-700">
                        <div className="flex-1 min-w-0 pr-4">
                          <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{item.question}</p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 italic mb-1">{item.questionRu}</p>
                          <div className="text-xs text-gray-500 dark:text-gray-300 mt-1 line-clamp-1" dangerouslySetInnerHTML={{ __html: item.answer }} />
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <button onClick={() => { setEditingItem({ ...item, categoryId: category.id }); setIsItemModalOpen(true); }} className="p-1.5 rounded-lg text-brand-500 hover:bg-white dark:hover:bg-gray-700 shadow-sm"><PencilIcon className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDeleteItem(item.id)} className="p-1.5 rounded-lg text-error-500 hover:bg-white dark:hover:bg-gray-700 shadow-sm"><TrashBinIcon className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-2">Heç bir sual əlavə edilməyib</p>
                  )}
                </div>
              </div>
            ))}
            {categories.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20">
                <p className="text-gray-500">Kateqoriya tapılmadı</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'static' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {staticPages.map(page => (
              <div key={page.id} className="p-5 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand-500 dark:hover:border-brand-500 transition-all group">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{page.title}</h3>
                    <p className="text-xs text-gray-500">{page.titleRu}</p>
                    <p className="text-xs text-brand-500 font-medium mt-1">/{page.slug}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { setEditingStatic(page); setIsStaticModalOpen(true); }} className="p-1.5 rounded-lg text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20"><PencilIcon className="w-4 h-4" /></button>
                    <button onClick={() => handleDeleteStatic(page.id)} className="p-1.5 rounded-lg text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20"><TrashBinIcon className="w-4 h-4" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'legal' && (
          <div className="space-y-3">
            {legalPolicies.map(policy => (
              <div key={policy.id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 hover:border-brand-500 dark:hover:border-brand-500 transition-all group flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{policy.title}</h3>
                  <p className="text-xs text-gray-500">{policy.titleRu}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Versiya: {policy.version} • Tarix: {new Date(policy.effectiveDate).toLocaleDateString('az-AZ')}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingLegal(policy); setIsLegalModalOpen(true); }} className="p-1.5 rounded-lg text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20"><PencilIcon className="w-4 h-4" /></button>
                  <button onClick={() => handleDeleteLegal(policy.id)} className="p-1.5 rounded-lg text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20"><TrashBinIcon className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="max-w-3xl mx-auto py-4">
            {privacyPolicy ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-800">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{privacyPolicy.title}</h2>
                    <p className="text-sm text-gray-500 italic">{privacyPolicy.titleRu}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Son yenilənmə: {new Date(privacyPolicy.effectiveDate).toLocaleDateString('az-AZ')}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditingPrivacy(privacyPolicy); setIsPrivacyModalOpen(true); }}>Redaktə</Button>
                  </div>
                </div>
                <div className="prose dark:prose-invert max-w-none p-6 rounded-2xl border border-gray-100 dark:border-gray-800 line-clamp-[15] text-sm text-gray-700 dark:text-gray-300" dangerouslySetInnerHTML={{ __html: privacyPolicy.content }} />
              </div>
            ) : (
              <div className="text-center py-20 bg-gray-50 dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                <LockIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Məxfilik siyasəti yaradılmayıb</p>
                <Button size="sm" onClick={() => { setEditingPrivacy({ title: 'Məxfilik Siyasəti', content: '', slug: 'privacy' }); setIsPrivacyModalOpen(true); }}>Yarat</Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <Modal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} title="Kateqoriya" className="max-w-[500px]">
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="catName">Ad (AZ)</Label>
              <Input id="catName" required value={editingCategory?.name || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingCategory({ ...editingCategory, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="catNameRu">Ad (RU)</Label>
              <Input id="catNameRu" required value={editingCategory?.nameRu || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingCategory({ ...editingCategory, nameRu: e.target.value })} />
            </div>
          </div>
          <div>
            <Label htmlFor="catOrder">Sıra</Label>
            <Input id="catOrder" type="number" value={editingCategory?.displayOrder || 0} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingCategory({ ...editingCategory, displayOrder: parseInt(e.target.value) })} />
          </div>
          <Button type="submit" className="w-full mt-2">Yadda Saxla</Button>
        </form>
      </Modal>

      <Modal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} title="Sual-Cavab" className="max-w-[600px]">
        <form onSubmit={handleSaveItem} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="itemQ">Sual (AZ)</Label>
              <Input id="itemQ" required value={editingItem?.question || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingItem({ ...editingItem, question: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="itemQRu">Sual (RU)</Label>
              <Input id="itemQRu" required value={editingItem?.questionRu || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingItem({ ...editingItem, questionRu: e.target.value })} />
            </div>
          </div>
          <div>
            <Label htmlFor="itemA">Cavab (AZ)</Label>
            <QuillEditor
              value={editingItem?.answer || ''}
              onChange={(content) => { if(content !== editingItem?.answer) setEditingItem(prev => prev ? { ...prev, answer: content } : null); }}
              placeholder="Sualın cavabını daxil edin..."
            />
          </div>
          <div>
            <Label htmlFor="itemARu">Cavab (RU)</Label>
            <QuillEditor
              value={editingItem?.answerRu || ''}
              onChange={(content) => { if(content !== editingItem?.answerRu) setEditingItem(prev => prev ? { ...prev, answerRu: content } : null); }}
              placeholder="Sualın cavabını rusca daxil edin..."
            />
          </div>
          <div>
            <Label htmlFor="itemOrder">Sıra</Label>
            <Input id="itemOrder" type="number" value={editingItem?.displayOrder || 0} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingItem({ ...editingItem, displayOrder: parseInt(e.target.value) })} />
          </div>
          <Button type="submit" className="w-full mt-2">Yadda Saxla</Button>
        </form>
      </Modal>

      <Modal isOpen={isStaticModalOpen} onClose={() => setIsStaticModalOpen(false)} title="Statik Səhifə" className="max-w-[700px]">
        <form onSubmit={handleSaveStatic} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stTitle">Başlıq (AZ)</Label>
              <Input id="stTitle" required value={editingStatic?.title || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingStatic({ ...editingStatic, title: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="stTitleRu">Başlıq (RU)</Label>
              <Input id="stTitleRu" required value={editingStatic?.titleRu || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingStatic({ ...editingStatic, titleRu: e.target.value })} />
            </div>
          </div>
          <div>
            <Label htmlFor="stSlug">Slug (URL)</Label>
            <Input id="stSlug" required value={editingStatic?.slug || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingStatic({ ...editingStatic, slug: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="stContent">Məzmun (AZ)</Label>
            <QuillEditor
              value={editingStatic?.content || ''}
              onChange={(content) => { if(content !== editingStatic?.content) setEditingStatic(prev => prev ? { ...prev, content: content } : null); }}
              placeholder="Səhifə məzmununu daxil edin..."
            />
          </div>
          <div>
            <Label htmlFor="stContentRu">Məzmun (RU)</Label>
            <QuillEditor
              value={editingStatic?.contentRu || ''}
              onChange={(content) => { if(content !== editingStatic?.contentRu) setEditingStatic(prev => prev ? { ...prev, contentRu: content } : null); }}
              placeholder="Səhifə məzmununu rusca daxil edin..."
            />
          </div>
          <div>
            <Label htmlFor="stOrder">Sıra</Label>
            <Input id="stOrder" type="number" value={editingStatic?.displayOrder || 0} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingStatic({ ...editingStatic, displayOrder: parseInt(e.target.value) })} />
          </div>
          <Button type="submit" className="w-full mt-2">Yadda Saxla</Button>
        </form>
      </Modal>

      <Modal isOpen={isLegalModalOpen} onClose={() => setIsLegalModalOpen(false)} title="Hüquqi Sənəd" className="max-w-[800px]">
        <form onSubmit={handleSaveLegal} className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lgTitle">Başlıq (AZ)</Label>
              <Input id="lgTitle" required value={editingLegal?.title || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingLegal({ ...editingLegal, title: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="lgTitleRu">Başlıq (RU)</Label>
              <Input id="lgTitleRu" required value={editingLegal?.titleRu || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingLegal({ ...editingLegal, titleRu: e.target.value })} />
            </div>
          </div>
          <div>
            <Label htmlFor="lgSlug">Slug</Label>
            <Input id="lgSlug" required value={editingLegal?.slug || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingLegal({ ...editingLegal, slug: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="lgVer">Versiya</Label>
              <Input id="lgVer" value={editingLegal?.version || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingLegal({ ...editingLegal, version: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="lgDate">Effektiv Tarix</Label>
              <Input id="lgDate" type="date" value={editingLegal?.effectiveDate?.split('T')[0] || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingLegal({ ...editingLegal, effectiveDate: e.target.value })} />
            </div>
          </div>
          <div>
            <Label htmlFor="lgContent">Məzmun (AZ)</Label>
            <QuillEditor
              value={editingLegal?.content || ''}
              onChange={(content) => { if(content !== editingLegal?.content) setEditingLegal(prev => prev ? { ...prev, content: content } : null); }}
              placeholder="Hüquqi sənəd məzmununu daxil edin..."
            />
          </div>
          <div>
            <Label htmlFor="lgContentRu">Məzmun (RU)</Label>
            <QuillEditor
              value={editingLegal?.contentRu || ''}
              onChange={(content) => { if(content !== editingLegal?.contentRu) setEditingLegal(prev => prev ? { ...prev, contentRu: content } : null); }}
              placeholder="Hüquqi sənəd məzmununu rusca daxil edin..."
            />
          </div>
          <div>
            <Label htmlFor="lgOrder">Sıra</Label>
            <Input id="lgOrder" type="number" value={editingLegal?.displayOrder || 0} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingLegal({ ...editingLegal, displayOrder: parseInt(e.target.value) })} />
          </div>
          <Button type="submit" className="w-full mt-2">Yadda Saxla</Button>
        </form>
      </Modal>

      <Modal isOpen={isPrivacyModalOpen} onClose={() => setIsPrivacyModalOpen(false)} title="Məxfilik Siyasəti" className="max-w-[800px]">
        <form onSubmit={handleSavePrivacy} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="prTitle">Başlıq (AZ)</Label>
              <Input id="prTitle" required value={editingPrivacy?.title || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingPrivacy({ ...editingPrivacy, title: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="prTitleRu">Başlıq (RU)</Label>
              <Input id="prTitleRu" required value={editingPrivacy?.titleRu || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingPrivacy({ ...editingPrivacy, titleRu: e.target.value })} />
            </div>
          </div>
          <div>
            <Label htmlFor="prDate">Effektiv Tarix</Label>
            <Input id="prDate" type="date" value={editingPrivacy?.effectiveDate?.split('T')[0] || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingPrivacy({ ...editingPrivacy, effectiveDate: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="prContent">Məzmun (AZ)</Label>
            <QuillEditor
              value={editingPrivacy?.content || ''}
              onChange={(content) => { if(content !== editingPrivacy?.content) setEditingPrivacy(prev => prev ? { ...prev, content: content } : null); }}
              placeholder="Məxfilik siyasəti məzmununu daxil edin..."
            />
          </div>
          <div>
            <Label htmlFor="prContentRu">Məzmun (RU)</Label>
            <QuillEditor
              value={editingPrivacy?.contentRu || ''}
              onChange={(content) => { if(content !== editingPrivacy?.contentRu) setEditingPrivacy(prev => prev ? { ...prev, contentRu: content } : null); }}
              placeholder="Məxfilik siyasəti məzmununu rusca daxil edin..."
            />
          </div>
          <Button type="submit" className="w-full mt-2">Yadda Saxla</Button>
        </form>
      </Modal>
    </div>
  );
}
