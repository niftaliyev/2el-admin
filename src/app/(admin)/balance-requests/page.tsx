'use client';
import PermissionGuard from '@/components/auth/PermissionGuard';

import { useEffect, useState } from 'react';
import { adminService } from '@/services/admin.service';
import toast from 'react-hot-toast';

interface BalanceRequest {
  id: string;
  amount: number;
  userId: string;
  image: string;
  userName: string;
}

function BalanceRequestsPageContent() {
  const [requests, setRequests] = useState<BalanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState<BalanceRequest | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [page]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await adminService.getPendingBalanceIncreases(page, 10);
      setRequests(response.data);
      setTotalPages(response.totalPages);
    } catch (error) {
      toast.error('Balans artırma sorğularını yükləyərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (request: BalanceRequest, customAmount?: number) => {
    try {
      setIsProcessing(true);
      await adminService.creditUser({
        userId: request.userId,
        amount: customAmount ?? request.amount,
        increaseBalanceId: request.id
      });
      toast.success('Sorğu təsdiqləndi və balans artırıldı');
      fetchRequests();
    } catch (error) {
      toast.error('Xəta baş verdi');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAmountChange = (id: string, newAmount: number) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, amount: newAmount } : r));
    if (selectedRequest?.id === id) {
      setSelectedRequest(prev => prev ? { ...prev, amount: newAmount } : null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Balans Artırma Sorğuları</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">İstifadəçilərin balans artırma müraciətlərini idarə edin</p>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600"></div>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <svg className="w-16 h-16 text-gray-200 dark:text-gray-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Heç bir aktiv sorğu yoxdur</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">İstifadəçi</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Məbləğ</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Qəbz</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Əməliyyat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {requests.map(request => (
                  <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-sm">
                          {request.userName?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{request.userName}</p>
                          <p className="text-xs text-gray-400">ID: {request.userId.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={request.amount}
                          onChange={(e) => handleAmountChange(request.id, parseFloat(e.target.value))}
                          className="w-20 px-2 py-1 text-sm font-bold bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none text-gray-900 dark:text-white"
                        />
                        <span className="text-sm font-medium text-gray-500">₼</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => setSelectedRequest(request)}
                        className="text-xs font-medium text-brand-500 hover:text-brand-600 underline"
                      >
                        Şəkilə bax
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleApprove(request)}
                        disabled={isProcessing}
                        className="px-4 py-2 rounded-xl bg-success-500 text-white text-xs font-bold hover:bg-success-600 transition-colors shadow-lg shadow-success-500/20 disabled:opacity-50"
                      >
                        Təsdiqlə
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            className="w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-center disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          
          <div className="flex items-center px-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
             <span className="text-sm font-bold text-gray-900 dark:text-white">{page}</span>
             <span className="text-sm text-gray-400 mx-2">/</span>
             <span className="text-sm text-gray-400">{totalPages}</span>
          </div>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            className="w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-center disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}

      {/* Image Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setSelectedRequest(null)} />
          <div className="relative max-w-4xl w-full bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
               <h3 className="font-bold text-gray-900 dark:text-white">Ödəniş Qəbzi - {selectedRequest.userName}</h3>
               <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>
            <div className="p-8 bg-gray-50 dark:bg-gray-950/50 flex justify-center items-center min-h-[400px] relative group overflow-hidden">
               {/* Background decoration */}
               <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
               <div className="absolute -top-24 -left-24 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>
               <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-success-500/10 rounded-full blur-3xl pointer-events-none"></div>

              {selectedRequest.image ? (
                <div className="relative group/img z-10">
                  <img 
                    src={selectedRequest.image} 
                    alt="Receipt" 
                    className="max-w-full max-h-[70vh] w-auto h-auto object-contain rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-4 border-white dark:border-gray-800 transition-all duration-500 hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 rounded-2xl ring-1 ring-black/5 dark:ring-white/5 pointer-events-none"></div>
                  
                  <a 
                    href={selectedRequest.image} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="absolute top-4 right-4 p-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-2xl shadow-xl opacity-0 group-hover/img:opacity-100 transition-all duration-300 hover:bg-white dark:hover:bg-gray-900 hover:scale-110 border border-gray-100 dark:border-gray-800"
                    title="Tam ölçüdə bax"
                  >
                    <svg className="w-5 h-5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              ) : (
                <div className="text-center relative z-10">
                  <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-gray-200 dark:border-gray-700">
                    <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">Qəbz şəkli tapılmadı</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
               <div className="mb-6 flex items-center justify-between p-4 bg-brand-50 dark:bg-brand-900/10 rounded-2xl border border-brand-100 dark:border-brand-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold">
                       <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                      <p className="text-xs text-brand-600 dark:text-brand-400 font-semibold uppercase tracking-wider">Artırılacaq Məbləğ</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">Dəqiqləşdirin və təsdiqləyin</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={selectedRequest.amount}
                      onChange={(e) => handleAmountChange(selectedRequest.id, parseFloat(e.target.value))}
                      className="w-28 px-4 py-2 text-xl font-bold bg-white dark:bg-gray-800 border-2 border-brand-500 rounded-xl focus:ring-4 focus:ring-brand-500/20 outline-none text-gray-900 dark:text-white text-center shadow-inner"
                    />
                    <span className="text-lg font-bold text-brand-500">₼</span>
                  </div>
               </div>
               <div className="flex justify-end gap-3">
                 <button 
                  onClick={() => setSelectedRequest(null)}
                  className="px-6 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                 >
                   Bağla
                 </button>
                 <button 
                  onClick={() => {
                    handleApprove(selectedRequest);
                    setSelectedRequest(null);
                  }}
                  disabled={isProcessing}
                  className="px-8 py-2.5 rounded-xl bg-success-500 text-white text-sm font-bold hover:bg-success-600 transition-colors shadow-lg shadow-success-500/20"
                 >
                   Təsdiqlə və Balansı Artır
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default function BalanceRequestsPage() {
  return (
    <PermissionGuard permission="Users_Balance_Increase">
      <BalanceRequestsPageContent />
    </PermissionGuard>
  );
}