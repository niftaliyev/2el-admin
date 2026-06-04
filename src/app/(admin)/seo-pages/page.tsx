'use client';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { useEffect, useState } from 'react';
import { seoService, SeoPageDto } from '@/services/seo.service';
import toast from 'react-hot-toast';
import Button from '@/components/ui/button/Button';
import { ConfirmationModal } from '@/components/ui/modal';
import { PencilIcon, TrashBinIcon } from '@/icons';
import Link from 'next/link';

const getSiteUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }
  return typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? 'http://84.247.184.186'
    : 'http://localhost:3000';
};

function AdminSeoPagesContent() {
  const [pages, setPages] = useState<SeoPageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    pageId: string;
  }>({
    isOpen: false,
    pageId: '',
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const data = await seoService.getPages();
      setPages(data);
    } catch (error) {
      console.error('Error fetching SEO pages:', error);
      toast.error('Məlumatları yükləmək mümkün olmadı');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleDelete = async () => {
    if (!confirmModal.pageId) return;
    try {
      await seoService.deletePage(confirmModal.pageId);
      toast.success('SEO Səhifəsi silindi');
      setConfirmModal({ isOpen: false, pageId: '' });
      fetchPages();
    } catch (error) {
      toast.error('Xəta baş verdi');
    }
  };

  // Pagination Calculations
  const totalCount = pages.length;
  const totalPages = Math.ceil(totalCount / pageSize);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [pages.length, pageSize, totalPages, currentPage]);

  const paginatedPages = pages.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getPageNumbers = () => {
    const delta = 1;
    const range: (number | string)[] = [];
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }
    if (currentPage - delta > 2) {
      range.unshift('...');
    }
    if (currentPage + delta < totalPages - 1) {
      range.push('...');
    }
    range.unshift(1);
    if (totalPages > 1) {
      range.push(totalPages);
    }
    return range;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">SEO Səhifələri</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Sayt üçün xüsusi SEO filtr səhifələrini idarə edin
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Link href="/seo-pages/create" className="w-full sm:w-auto">
            <Button size="sm" className="w-full sm:w-auto text-center justify-center flex">
              Yeni SEO Səhifəsi
            </Button>
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Başlıq (H1)</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Slug (URL)</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Filtr Kateqoriyası</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {paginatedPages.map((page) => (
                <tr key={page.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-bold text-gray-900 dark:text-white text-sm">{page.titleH1}</span>
                    {page.titleH2 && (
                      <p className="text-xs text-gray-400 mt-0.5">Alt: {page.titleH2}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-brand-500 font-semibold">
                    <a
                      href={`${getSiteUrl()}/${page.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline flex items-center gap-1"
                    >
                      /{page.slug}
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300 font-medium">
                    {page.categoryName || <span className="text-gray-400 italic">Bütün elanlar</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex gap-2 justify-end">
                      <Link href={`/seo-pages/create?id=${page.id}`}>
                        <button className="p-2 rounded-lg text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20">
                          <PencilIcon className="w-4 h-4" />
                        </button>
                      </Link>
                      <button
                        onClick={() => setConfirmModal({ isOpen: true, pageId: page.id || '' })}
                        className="p-2 rounded-lg text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20"
                      >
                        <TrashBinIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedPages.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Heç bir SEO səhifəsi əlavə edilməyib.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="block md:hidden divide-y divide-gray-200 dark:divide-gray-800">
          {paginatedPages.map((page) => (
            <div key={page.id} className="p-4 space-y-3">
              <div>
                <span className="font-bold text-gray-900 dark:text-white text-base">{page.titleH1}</span>
                {page.titleH2 && (
                  <p className="text-xs text-gray-400 mt-0.5">Alt: {page.titleH2}</p>
                )}
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">Slug:</span>
                  <a
                    href={`${getSiteUrl()}/${page.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-500 font-semibold truncate max-w-[200px] hover:underline flex items-center gap-1"
                  >
                    /{page.slug}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">Kateqoriya:</span>
                  <span className="text-gray-800 dark:text-gray-200 font-medium">
                    {page.categoryName || <span className="text-gray-400 italic">Bütün elanlar</span>}
                  </span>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-150 dark:border-gray-850">
                <Link href={`/seo-pages/create?id=${page.id}`}>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/20 dark:hover:bg-brand-900/40 text-brand-600 dark:text-brand-400 rounded-lg text-xs font-bold transition-all">
                    <PencilIcon className="w-3.5 h-3.5" /> Redaktə et
                  </button>
                </Link>
                <button
                  onClick={() => setConfirmModal({ isOpen: true, pageId: page.id || '' })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-error-50 hover:bg-error-100 dark:bg-error-900/20 dark:hover:bg-error-900/40 text-error-600 dark:text-error-400 rounded-lg text-xs font-bold transition-all"
                >
                  <TrashBinIcon className="w-3.5 h-3.5" /> Sil
                </button>
              </div>
            </div>
          ))}
          {paginatedPages.length === 0 && (
            <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
              Heç bir SEO səhifəsi əlavə edilməyib.
            </div>
          )}
        </div>
      </div>

      {/* Pagination Controls */}
      {totalCount > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-200 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
            <span className="text-xs text-gray-500 dark:text-gray-400 text-center sm:text-left">
              Toplam {totalCount} nəticədən {totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0}-{Math.min(currentPage * pageSize, totalCount)} arası göstərilir
            </span>
            <div className="flex items-center gap-2 justify-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">Göstər:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-8 px-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-700 dark:text-gray-300 focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-end">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 px-3 rounded-lg text-xs font-bold bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 dark:disabled:opacity-40 text-gray-700 dark:text-gray-300 transition-all"
            >
              Əvvəlki
            </button>
            
            {getPageNumbers().map((p, idx) => (
              p === '...' ? (
                <span key={`dots-${idx}`} className="px-1 text-xs text-gray-400">...</span>
              ) : (
                <button
                  key={`page-${p}`}
                  onClick={() => setCurrentPage(Number(p))}
                  className={`h-8 w-8 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                    p === currentPage
                      ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/10'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {p}
                </button>
              )
            ))}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="h-8 px-3 rounded-lg text-xs font-bold bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 dark:disabled:opacity-40 text-gray-700 dark:text-gray-300 transition-all"
            >
              Növbəti
            </button>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, pageId: '' })}
        onConfirm={handleDelete}
        title="SEO Səhifəsini Sil"
        message="Bu SEO səhifəsini silmək istədiyinizə əminsiniz?"
      />
    </div>
  );
}

export default function AdminSeoPages() {
  return (
    <PermissionGuard roles={["SuperAdmin", "Admin"]}>
      <AdminSeoPagesContent />
    </PermissionGuard>
  );
}
