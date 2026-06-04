'use client';
import PermissionGuard from '@/components/auth/PermissionGuard';
import { useEffect, useState } from 'react';
import { seoService, SearchQueryDto } from '@/services/seo.service';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { TrashBinIcon } from '@/icons';
import { ConfirmationModal } from '@/components/ui/modal';

function AdminSearchesContent() {
  const [searches, setSearches] = useState<SearchQueryDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<'newest' | 'count'>('newest');

  // Deletion state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    searchId: string;
  }>({
    isOpen: false,
    searchId: '',
  });

  const fetchSearches = async () => {
    try {
      setLoading(true);
      const data = await seoService.getSearches();
      setSearches(data);
    } catch (error) {
      console.error('Error fetching searches:', error);
      toast.error('Məlumatları yükləmək mümkün olmadı');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSearches();
  }, []);

  const handleDelete = async () => {
    if (!confirmModal.searchId) return;
    try {
      await seoService.deleteSearch(confirmModal.searchId);
      toast.success('Axtarış sorğusu silindi');
      setConfirmModal({ isOpen: false, searchId: '' });
      fetchSearches();
    } catch (error) {
      toast.error('Xəta baş verdi');
    }
  };

  // Sort Calculations
  const sortedSearches = [...searches].sort((a, b) => {
    if (sortBy === 'count') {
      return b.count - a.count;
    } else {
      const dateA = new Date(a.updatedDate || a.createdDate).getTime();
      const dateB = new Date(b.updatedDate || b.createdDate).getTime();
      return dateB - dateA;
    }
  });

  // Pagination Calculations
  const totalCount = sortedSearches.length;
  const totalPages = Math.ceil(totalCount / pageSize);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [sortedSearches.length, pageSize, totalPages, currentPage]);

  const paginatedSearches = sortedSearches.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Axtarışlar (Searched Terms)</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            İstifadəçilərin saytda hansı açar sözləri axtardıqlarını və axtarış saylarını izləyin
          </p>
        </div>
        
        {/* Sort Select */}
        <div className="flex items-center gap-2.5 shrink-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-1.5 px-3.5 rounded-xl shadow-sm">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sıralama:</span>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as 'newest' | 'count');
              setCurrentPage(1);
            }}
            className="h-9 px-2 bg-transparent rounded-lg text-sm text-gray-700 dark:text-gray-300 font-bold focus:outline-none cursor-pointer"
          >
            <option value="newest">Ən yeni</option>
            <option value="count">Axtarış sayı</option>
          </select>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Axtarış açar sözü</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Axtarış sayı</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase">Son axtarış tarixi</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase text-right">Əməliyyat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {paginatedSearches.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 text-xs font-bold w-5">#{(currentPage - 1) * pageSize + index + 1}</span>
                      <span className="font-bold text-gray-900 dark:text-white text-sm">
                        {item.query}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
                      {item.count} dəfə
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(item.updatedDate || item.createdDate).toLocaleString('az-AZ')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/seo-pages/create?query=${encodeURIComponent(item.query)}`}
                        className="inline-flex items-center px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm shadow-brand-500/10 active:scale-95 hover:-translate-y-0.5"
                      >
                        SEO Səhifəsi Yarat
                      </Link>
                      <button
                        onClick={() => setConfirmModal({ isOpen: true, searchId: item.id })}
                        className="p-1.5 rounded-lg text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
                        title="Sil"
                      >
                        <TrashBinIcon className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedSearches.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Hələ heç bir axtarış qeydə alınmayıb.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="block md:hidden divide-y divide-gray-200 dark:divide-gray-800">
          {paginatedSearches.map((item, index) => (
            <div key={item.id} className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-gray-400 text-xs font-bold mr-2">#{(currentPage - 1) * pageSize + index + 1}</span>
                  <span className="font-bold text-gray-900 dark:text-white text-sm">{item.query}</span>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400">
                  {item.count} dəfə
                </span>
              </div>
              <div className="flex justify-between items-center pt-1.5">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(item.updatedDate || item.createdDate).toLocaleString('az-AZ')}
                </span>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/seo-pages/create?query=${encodeURIComponent(item.query)}`}
                    className="inline-flex items-center px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
                  >
                    SEO Səhifəsi Yarat
                  </Link>
                  <button
                    onClick={() => setConfirmModal({ isOpen: true, searchId: item.id })}
                    className="p-1.5 rounded-lg text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
                  >
                    <TrashBinIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {paginatedSearches.length === 0 && (
            <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 text-sm">
              Hələ heç bir axtarış qeydə alınmayıb.
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
              className="h-8 px-3 rounded-lg text-xs font-bold bg-gray-50 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-gray-50 dark:bg-gray-800/50 dark:hover:bg-gray-700 dark:disabled:opacity-40 text-gray-700 dark:text-gray-300 transition-all"
            >
              Növbəti
            </button>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, searchId: '' })}
        onConfirm={handleDelete}
        title="Axtarış Sorğusunu Sil"
        message="Bu axtarış sorğusunu silmək istədiyinizə əminsiniz?"
      />
    </div>
  );
}

export default function AdminSearches() {
  return (
    <PermissionGuard roles={["SuperAdmin", "Admin"]}>
      <AdminSearchesContent />
    </PermissionGuard>
  );
}
