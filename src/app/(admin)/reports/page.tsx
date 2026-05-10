'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { adminService } from '@/services/admin.service';
import { AdminReport } from '@/types/admin';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/modal';
import Link from 'next/link';

const STATUSES = [
  { value: null, label: 'Hamısı' },
  { value: '1', label: 'Gözləmədə' },
  { value: '2', label: 'Baxılır' },
  { value: '3', label: 'Həll edilib' },
  { value: '4', label: 'Rədd edilib' },
];

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    Pending: 'bg-warning-100 text-warning-600 dark:bg-warning-900/20 dark:text-warning-400',
    InReview: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    Resolved: 'bg-success-100 text-success-600 dark:bg-success-900/20 dark:text-success-400',
    Rejected: 'bg-error-100 text-error-600 dark:bg-error-900/20 dark:text-error-400',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
};

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    Pending: 'Gözləmədə',
    InReview: 'Baxılır',
    Resolved: 'Həll edilib',
    Rejected: 'Rədd edilib',
  };
  return map[status] || status;
};

const reasonLabel = (reason: string) => {
  const map: Record<string, string> = {
    FalseInformation: 'Yalan məlumat',
    Fraud: 'Dələduzluq',
    OffensiveContent: 'Təhqiramiz məzmun',
    Duplicate: 'Təkrarlanan elan',
    WrongCategory: 'Yanlış kateqoriya',
    IllegalItem: 'Qadağan olunmuş məhsul',
    Other: 'Digər',
  };
  return map[reason] || reason;
};

export default function AdminReportsPage() {
  const [activeType, setActiveType] = useState<'ad' | 'store'>('ad');
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<AdminReport | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    
    if (type === 'ad' || type === 'store') {
      setActiveType(type);
    }
    
    if (status && STATUSES.some(s => s.value === status)) {
      setStatusFilter(status);
    }
  }, [searchParams]);

  useEffect(() => { fetchReports(); }, [activeType, page, statusFilter]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = activeType === 'ad'
        ? await adminService.getAdReports(page, 10, statusFilter)
        : await adminService.getStoreReports(page, 10, statusFilter);
      setReports(data.data);
      setTotalPages(data.totalPages);
    } catch {
      toast.error('Şikayətləri yükləyərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, report: AdminReport) => {
    try {
      if (action === 'delete') {
        if (!confirm('Bu şikayəti silmək istədiyinizə əminsiniz?')) return;
        if (activeType === 'ad') await adminService.deleteAdReport(report.id);
        else await adminService.deleteStoreReport(report.id);
        toast.success('Şikayət silindi');
      } else if (action.startsWith('status-')) {
        const newStatus = parseInt(action.split('-')[1]);
        if (activeType === 'ad') await adminService.updateAdReportStatus(report.id, newStatus);
        else await adminService.updateStoreReportStatus(report.id, newStatus);
        toast.success('Status yeniləndi');
      }
      fetchReports();
    } catch {
      toast.error('Əməliyyat zamanı xəta baş verdi');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Şikayətlər</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">İstifadəçilər tərəfindən göndərilən şikayətləri idarə edin</p>
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          {/* Type Toggle */}
          <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
            {(['ad', 'store'] as const).map(type => (
              <button
                key={type}
                onClick={() => { setActiveType(type); setPage(1); }}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeType === type
                    ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {type === 'ad' ? 'Elanlar' : 'Mağazalar'}
              </button>
            ))}
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            {STATUSES.map(s => (
              <button
                key={s.value === null ? 'null' : s.value}
                onClick={() => { setStatusFilter(s.value); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  statusFilter === s.value
                    ? 'bg-brand-500 border-brand-500 text-white shadow-sm'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-300'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <svg className="w-16 h-16 text-gray-200 dark:text-gray-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Heç bir şikayət tapılmadı</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Şikayət Edən</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{activeType === 'ad' ? 'Elan' : 'Mağaza'}</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Səbəb</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Tarix</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Əməliyyatlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {reports.map(report => (
                  <tr 
                    key={report.id} 
                    onClick={() => setSelectedReport(report)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{report.reporterName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{activeType === 'ad' ? report.adTitle : report.storeName}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell max-w-xs">
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{reasonLabel(report.reason)}</p>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-gray-400">{new Date(report.createdDate).toLocaleDateString('az-AZ')}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge(report.status)}`}>
                        {statusLabel(report.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <select
                          defaultValue=""
                          onClick={(e) => e.stopPropagation()}
                          onChange={e => { if (e.target.value) handleAction(e.target.value, report); e.target.value = ''; }}
                          className="text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-500"
                        >
                          <option value="" disabled>Status dəyiş</option>
                          <option value="status-1">Gözləmədə</option>
                          <option value="status-2">Baxılır</option>
                          <option value="status-3">Həll edilib</option>
                          <option value="status-4">Rədd edilib</option>
                        </select>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAction('delete', report); }}
                          className="p-1.5 rounded-lg text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors"
                          title="Sil"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        title="Şikayət Detalları"
        className="max-w-lg"
      >
        {selectedReport && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold">Şikayətçi</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedReport.reporterName}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold">Tarix</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">{new Date(selectedReport.createdDate).toLocaleString('az-AZ')}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-400 uppercase font-bold mb-1">{activeType === 'ad' ? 'Elan' : 'Mağaza'}</p>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{activeType === 'ad' ? selectedReport.adTitle : selectedReport.storeName}</span>
                <Link 
                  href={activeType === 'ad' ? `/ads/${selectedReport.adId}` : `/stores/${selectedReport.storeInformationId}`}
                  className="text-xs text-brand-600 font-bold hover:underline"
                >
                  Bax →
                </Link>
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-400 uppercase font-bold mb-1">Şikayət Səbəbi</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
                {reasonLabel(selectedReport.reason)}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400 uppercase font-bold mb-1">Əlavə Qeyd</p>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed italic">
                  {selectedReport.note || 'Qeyd yoxdur'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${statusBadge(selectedReport.status)}`}>
                  {statusLabel(selectedReport.status)}
                </span>
                <select
                  defaultValue=""
                  onChange={e => { if (e.target.value) { handleAction(e.target.value, selectedReport); setSelectedReport(null); } }}
                  className="text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="" disabled>Statusu dəyiş</option>
                  <option value="status-1">Gözləmədə</option>
                  <option value="status-2">Baxılır</option>
                  <option value="status-3">Həll edilib</option>
                  <option value="status-4">Rədd edilib</option>
                </select>
              </div>
              
              <div className="flex gap-2">
                 <button
                    onClick={() => { handleAction('delete', selectedReport); setSelectedReport(null); }}
                    className="px-4 py-2 text-sm font-bold text-error-600 hover:bg-error-50 rounded-xl transition-all"
                  >
                    Sil
                  </button>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="px-6 py-2 text-sm font-bold bg-gray-900 text-white dark:bg-white dark:text-gray-900 rounded-xl hover:opacity-90 transition-all"
                  >
                    Bağla
                  </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
