'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { adminService } from '@/services/admin.service';
import { AdminUser, AdminRole } from '@/types/admin';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

const USER_STATUSES = [
  { value: 'all', label: 'Hamısı' },
  { value: 'active', label: 'Aktiv' },
  { value: 'banned', label: 'Blok edilib' },
];

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    active: 'bg-success-100 text-success-600 dark:bg-success-900/20 dark:text-success-400',
    banned: 'bg-error-100 text-error-600 dark:bg-error-900/20 dark:text-error-400',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
};

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    active: 'Aktiv',
    banned: 'Blok edilib',
  };
  return map[status] || status;
};

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('date');
  const [isAscending, setIsAscending] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    action: 'block' | 'unblock' | 'delete';
    user: AdminUser | null;
  }>({ isOpen: false, action: 'block', user: null });
  const [roleModal, setRoleModal] = useState<{
    isOpen: boolean;
    user: AdminUser | null;
    selectedRoles: string[];
  }>({ isOpen: false, user: null, selectedRoles: [] });
  const [allRoles, setAllRoles] = useState<AdminRole[]>([]);

  const searchParams = useSearchParams();

  useEffect(() => {
    const status = searchParams.get('status');
    if (status && (status === 'all' || status === 'active' || status === 'blocked')) {
      setActiveTab(status);
    }
    fetchRoles();
  }, [searchParams]);

  useEffect(() => { fetchUsers(); }, [page, activeTab, searchQuery, sortBy, isAscending]);

  const fetchRoles = async () => {
    try {
      const roles = await adminService.getRoles();
      setAllRoles(roles);
    } catch (err) {
      console.error("Roles fetch error:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUsers(page, 10, activeTab, searchQuery, sortBy, isAscending);
      setUsers(data.data);
      setTotalPages(data.totalPages);
    } catch {
      toast.error('İstifadəçiləri yükləyərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleAll = () =>
    setSelectedIds(selectedIds.length === users.length ? [] : users.map(u => u.id));

  const handleConfirm = async () => {
    if (!modalState.user) return;
    try {
      if (modalState.action === 'block') await adminService.suspendUser(modalState.user.id);
      else if (modalState.action === 'unblock') await adminService.activateUser(modalState.user.id);
      else if (modalState.action === 'delete') await adminService.deleteUser(modalState.user.id);
      toast.success('Əməliyyat uğurla tamamlandı');
      setModalState({ isOpen: false, action: 'block', user: null });
      fetchUsers();
    } catch {
      toast.error('Xəta baş verdi');
    }
  };

  const handleBulkAction = async (action: 'block' | 'unblock' | 'delete') => {
    if (!selectedIds.length) return;
    try {
      const apiAction = action === 'block' ? 'suspend' : action === 'unblock' ? 'activate' : 'delete';
      await adminService.bulkUserAction({ action: apiAction, ids: selectedIds });
      toast.success('Toplu əməliyyat tamamlandı');
      setSelectedIds([]);
      fetchUsers();
    } catch {
      toast.error('Xəta baş verdi');
    }
  };

  const handleRoleUpdate = async () => {
    if (!roleModal.user) return;
    try {
      await adminService.setUserRoles(roleModal.user.id, roleModal.selectedRoles);
      toast.success('Rollar yeniləndi');
      setRoleModal({ isOpen: false, user: null, selectedRoles: [] });
      fetchUsers();
    } catch {
      toast.error('Rollar yenilənərkən xəta baş verdi');
    }
  };

  const openRoleModal = (user: AdminUser) => {
    setRoleModal({
      isOpen: true,
      user,
      selectedRoles: user.roles || []
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">İstifadəçi İdarəetməsi</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Bütün istifadəçiləri idarə edin və nəzarət edin</p>
        </div>

        {/* Sorting controls */}
        <div className="flex items-center gap-2">
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
            className="text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="date">Qeydiyyat tarixi</option>
            <option value="balance">Balansa görə</option>
          </select>
          <button
            onClick={() => { setIsAscending(!isAscending); setPage(1); }}
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-500 hover:text-brand-500 transition-colors"
            title={isAscending ? "Artan sıra" : "Azalan sıra"}
          >
            <svg className={`w-5 h-5 transition-transform ${isAscending ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Cəmi', count: users.length, icon: '👥', color: 'blue' },
          { label: 'Aktiv', count: users.filter(u => u.status === 'active').length, icon: '✅', color: 'green' },
          { label: 'Blok edilib', count: users.filter(u => u.status === 'banned').length, icon: '🚫', color: 'red' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{s.icon}</span>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.count}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Table */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 dark:border-gray-800 px-4">
          <nav className="flex gap-1 overflow-x-auto">
            {USER_STATUSES.map(s => (
              <button
                key={s.value}
                onClick={() => { setActiveTab(s.value); setPage(1); setSelectedIds([]); }}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium whitespace-nowrap transition-colors ${activeTab === s.value
                  ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Ad, e-poçt və ya telefon ilə axtar..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 bg-brand-50 dark:bg-brand-900/20 border-b border-gray-200 dark:border-gray-800">
            <span className="text-sm font-medium text-brand-600 dark:text-brand-400">{selectedIds.length} seçilib</span>
            <div className="flex gap-2 ml-auto">
              <button onClick={() => handleBulkAction('unblock')} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-success-500 text-white hover:bg-success-600 transition-colors">Blokdan çıxart</button>
              <button onClick={() => handleBulkAction('block')} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-error-500 text-white hover:bg-error-600 transition-colors">Blok et</button>
              <button onClick={() => handleBulkAction('delete')} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300">Sil</button>
              <button onClick={() => setSelectedIds([])} className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200">Sıfırla</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600"></div>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <svg className="w-16 h-16 text-gray-200 dark:text-gray-700 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Heç bir istifadəçi tapılmadı</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox" checked={selectedIds.length === users.length && users.length > 0} onChange={toggleAll} className="rounded border-gray-300 dark:border-gray-600 text-brand-500 focus:ring-brand-500" />
                  </th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">İstifadəçi</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">Telefon</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Elanlar</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rollar</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Əməliyyatlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {users.map(user => (
                  <tr key={user.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${selectedIds.includes(user.id) ? 'bg-brand-50 dark:bg-brand-900/10' : ''}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selectedIds.includes(user.id)} onChange={() => toggleSelect(user.id)} className="rounded border-gray-300 dark:border-gray-600 text-brand-500 focus:ring-brand-500" />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center shrink-0 overflow-hidden">
                          {user.profilePhoto ? (
                            <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-bold text-brand-600 dark:text-brand-400">{user.name?.[0]?.toUpperCase() || 'U'}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.name}</p>
                          <p className="text-xs text-gray-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{user.phone || '—'}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{user.adsCount}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {user.roles?.length > 0 ? user.roles.map(r => (
                          <span key={r} className="px-1.5 py-0.5 rounded bg-brand-50 dark:bg-brand-900/30 text-[10px] font-medium text-brand-600 dark:text-brand-400">
                            {r}
                          </span>
                        )) : <span className="text-gray-400 text-[10px]">Rol yoxdur</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusBadge(user.status)}`}>
                        {statusLabel(user.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/users/${user.id}`} className="p-1.5 rounded-lg text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors" title="Bax">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </Link>
                        {(currentUser?.roles?.includes('SuperAdmin') || currentUser?.roles?.includes('Admin')) && (
                          <button onClick={() => openRoleModal(user)} className="p-1.5 rounded-lg text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors" title="Rollar">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                          </button>
                        )}
                        {user.id !== currentUser?.id && (
                          <>
                            {user.status === 'banned' ? (
                              <button onClick={() => setModalState({ isOpen: true, action: 'unblock', user })} className="p-1.5 rounded-lg text-success-500 hover:bg-success-50 dark:hover:bg-success-900/20 transition-colors" title="Blokdan çıxart">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                            ) : (
                              <button onClick={() => setModalState({ isOpen: true, action: 'block', user })} className="p-1.5 rounded-lg text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors" title="Blok et">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                              </button>
                            )}
                            <button onClick={() => setModalState({ isOpen: true, action: 'delete', user })} className="p-1.5 rounded-lg text-gray-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors" title="Sil">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination UI */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage(prev => Math.max(1, prev - 1))}
            className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>

          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`w-9 h-9 rounded-lg text-sm font-semibold transition-all ${page === i + 1
                ? 'bg-brand-500 text-white shadow-sm'
                : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            disabled={page === totalPages}
            onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
            className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      )}

      {/* Modal */}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setModalState({ ...modalState, isOpen: false })} />
          <div className="relative bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              {modalState.action === 'unblock' ? 'Blokdan Çıxart' : modalState.action === 'block' ? 'İstifadəçini Blok Et' : 'İstifadəçini Sil'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              <strong className="text-gray-900 dark:text-white">"{modalState.user?.name}"</strong>{' '}
              {modalState.action === 'unblock' ? 'istifadəçisini blokdan çıxartmaq istədiyinizə əminsiniz?' : modalState.action === 'block' ? 'istifadəçisini blok etmək istədiyinizə əminsiniz?' : 'istifadəçisini silmək istədiyinizə əminsiniz?'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setModalState({ ...modalState, isOpen: false })} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Ləğv et</button>
              <button onClick={handleConfirm} className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors ${modalState.action === 'unblock' ? 'bg-success-500 hover:bg-success-600' : modalState.action === 'block' ? 'bg-error-500 hover:bg-error-600' : 'bg-error-500 hover:bg-error-600'}`}>
                {modalState.action === 'unblock' ? 'Blokdan çıxart' : modalState.action === 'block' ? 'Blok et' : 'Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Role Modal */}
      {roleModal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setRoleModal({ ...roleModal, isOpen: false })} />
          <div className="relative bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Rolları İdarə Et</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              <strong className="text-gray-900 dark:text-white">"{roleModal.user?.name}"</strong> üçün rolları seçin:
            </p>
            
            <div className="space-y-2 mb-8">
              {allRoles.map(role => (
                <label key={role.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={roleModal.selectedRoles.includes(role.name)}
                    onChange={(e) => {
                      const roles = e.target.checked 
                        ? [...roleModal.selectedRoles, role.name]
                        : roleModal.selectedRoles.filter(r => r !== role.name);
                      setRoleModal({ ...roleModal, selectedRoles: roles });
                    }}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-700 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{role.name}</span>
                </label>
              ))}
              {allRoles.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">Heç bir rol tapılmadı</p>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setRoleModal({ ...roleModal, isOpen: false })} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Ləğv et</button>
              <button onClick={handleRoleUpdate} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-500 hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/20">Yadda saxla</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
