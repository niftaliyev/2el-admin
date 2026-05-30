'use client';

import PermissionGuard from '@/components/auth/PermissionGuard';
import { useState, useEffect } from 'react';
import { adminService } from '@/services/admin.service';
import toast from 'react-hot-toast';

enum NotificationType {
  System = 0,
  Info = 1,
  Confirm = 2,
  Warning = 3,
  Error = 4,
  Message = 5
}

interface SearchedUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profilePhoto?: string;
}

function AdminNotificationsPageContent() {
  // Form State
  const [targetType, setTargetType] = useState<'all' | 'single'>('all');
  const [selectedUser, setSelectedUser] = useState<SearchedUser | null>(null);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [link, setLink] = useState('');
  const [notifType, setNotifType] = useState<NotificationType>(NotificationType.Info);

  // User Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchedUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Submit State
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounced user search
  useEffect(() => {
    if (targetType !== 'single' || !searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await adminService.getUsers(1, 10, 'all', searchQuery);
        if (response && response.data) {
          setSearchResults(response.data);
        }
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, targetType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Mövzu (Başlıq) daxil edilməlidir');
      return;
    }
    if (!text.trim()) {
      toast.error('Bildiriş mətni daxil edilməlidir');
      return;
    }
    if (targetType === 'single' && !selectedUser) {
      toast.error('İstifadəçi seçilməyib');
      return;
    }

    setIsSubmitting(true);
    try {
      await adminService.sendNotification({
        userId: targetType === 'single' ? selectedUser?.id : 'all',
        title: title.trim(),
        text: text.trim(),
        link: link.trim() || undefined,
        notificationType: notifType
      });

      toast.success('Bildiriş uğurla göndərildi!');

      // Reset form fields
      setTitle('');
      setText('');
      setLink('');
      setNotifType(NotificationType.Info);
      setSelectedUser(null);
      setSearchQuery('');
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Bildiriş göndərilərkən xəta baş verdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper colors and icons for dynamic rendering
  const getTypeConfig = (type: NotificationType) => {
    switch (type) {
      case NotificationType.System:
        return {
          bg: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700',
          badgeBg: 'bg-gray-500/10 text-gray-500',
          accent: 'border-l-gray-500',
          icon: 'notifications',
          label: 'Sistem'
        };
      case NotificationType.Info:
        return {
          bg: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/30',
          badgeBg: 'bg-blue-500/10 text-blue-500',
          accent: 'border-l-blue-500',
          icon: 'info',
          label: 'Məlumat'
        };
      case NotificationType.Confirm:
        return {
          bg: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800/30',
          badgeBg: 'bg-green-500/10 text-green-500',
          accent: 'border-l-green-500',
          icon: 'check_circle',
          label: 'Təsdiq'
        };
      case NotificationType.Warning:
        return {
          bg: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/30',
          badgeBg: 'bg-yellow-500/10 text-yellow-500',
          accent: 'border-l-yellow-500',
          icon: 'warning',
          label: 'Xəbərdarlıq'
        };
      case NotificationType.Error:
        return {
          bg: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/30',
          badgeBg: 'bg-red-500/10 text-red-500',
          accent: 'border-l-red-500',
          icon: 'error',
          label: 'Xəta'
        };
      case NotificationType.Message:
        return {
          bg: 'bg-teal-100 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-800/30',
          badgeBg: 'bg-teal-500/10 text-teal-500',
          accent: 'border-l-teal-500',
          icon: 'chat',
          label: 'Mesaj'
        };
    }
  };

  const currentConfig = getTypeConfig(notifType);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manual Bildiriş Göndər</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">İstifadəçilərə fərdi və ya toplu real-time bildirişlər göndərin</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Composition Form */}
        <div className="lg:col-span-7 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/80 dark:border-gray-800/60 shadow-xl shadow-gray-100/10 dark:shadow-none p-6 md:p-8 space-y-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <span className="material-symbols-outlined text-brand-500">campaign</span>
            Yeni Bildiriş Hazırla
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Target Selection Switch */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Göndəriləcək Hədəf</label>
              <div className="grid grid-cols-2 gap-3 bg-gray-50 dark:bg-gray-800/40 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-800/60">
                <button
                  type="button"
                  onClick={() => { setTargetType('all'); setSelectedUser(null); }}
                  className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${targetType === 'all'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm border border-gray-100 dark:border-gray-700/50'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  <span className="material-symbols-outlined !text-lg">groups</span>
                  Bütün İstifadəçilər
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('single')}
                  className={`py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${targetType === 'single'
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm border border-gray-100 dark:border-gray-700/50'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                  <span className="material-symbols-outlined !text-lg">person_search</span>
                  Müəyyən İstifadəçi
                </button>
              </div>
            </div>

            {/* Dynamic Specific User Autocomplete Field */}
            {targetType === 'single' && (
              <div className="space-y-2 relative">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">İstifadəçi Axtarışı</label>

                {selectedUser ? (
                  <div className="flex items-center justify-between p-3.5 bg-brand-50/40 dark:bg-brand-500/5 border border-brand-200/50 dark:border-brand-500/20 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 font-bold flex items-center justify-center text-sm shadow-sm">
                        {selectedUser.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">{selectedUser.name}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{selectedUser.email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSelectedUser(null); setSearchQuery(''); }}
                      className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                    >
                      <span className="material-symbols-outlined !text-xl">close</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true); }}
                        onFocus={() => setShowDropdown(true)}
                        placeholder="Ad, email və ya telefon nömrəsi ilə axtarın..."
                        className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                      />
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">search</span>

                      {isSearching && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600"></div>
                        </div>
                      )}
                    </div>

                    {showDropdown && searchQuery.trim() && (
                      <div className="absolute left-0 right-0 top-[100%] mt-2 bg-white dark:bg-gray-950 border border-gray-150 dark:border-gray-800/80 rounded-2xl shadow-2xl z-[90] overflow-hidden max-h-[250px] overflow-y-auto custom-scrollbar">
                        {searchResults.length === 0 ? (
                          <div className="p-4 text-center text-xs text-gray-500">Heç bir istifadəçi tapılmadı</div>
                        ) : (
                          searchResults.map((user) => (
                            <div
                              key={user.id}
                              onClick={() => { setSelectedUser(user); setShowDropdown(false); }}
                              className="p-3.5 hover:bg-gray-50 dark:hover:bg-gray-900/60 cursor-pointer flex items-center justify-between transition-colors border-b border-gray-50 dark:border-gray-900 last:border-0"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold flex items-center justify-center text-xs">
                                  {user.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="text-left">
                                  <h4 className="text-xs font-bold text-gray-900 dark:text-white">{user.name}</h4>
                                  <p className="text-[10px] text-gray-500 dark:text-gray-400">{user.email}</p>
                                </div>
                              </div>
                              {user.phone && <span className="text-[10px] text-gray-400 font-mono">{user.phone}</span>}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Notification Subject */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mövzu / Başlıq</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Məs: Hesabınız təsdiqləndi"
                className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-semibold"
                required
              />
            </div>

            {/* Notification Body Text */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bildiriş Mətni</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
                placeholder="İstifadəçiyə ötürüləcək əsas mesajı daxil edin..."
                className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all resize-none leading-relaxed"
                required
              />
            </div>

            {/* Action Link Path & Notification Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Keçid Linki (Könüllü)</label>
                <input
                  type="text"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="Məs: /elanlar və ya /cabinet/messages"
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bildiriş növü</label>
                <select
                  value={notifType}
                  onChange={(e) => setNotifType(Number(e.target.value))}
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-bold cursor-pointer"
                >
                  <option value={NotificationType.Info}>🔵 Məlumat (Info)</option>
                  <option value={NotificationType.Confirm}>🟢 Təsdiq (Confirm)</option>
                  <option value={NotificationType.Warning}>🟡 Xəbərdarlıq (Warning)</option>
                  <option value={NotificationType.Error}>🔴 Xəta (Error)</option>
                  <option value={NotificationType.Message}>💬 Yeni Mesaj (Message)</option>
                  <option value={NotificationType.System}>⚙️ Sistem (System)</option>
                </select>
              </div>

            </div>

            {/* Send Dispatch Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-sm shadow-lg shadow-brand-500/10 dark:shadow-none hover:shadow-brand-500/20 active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2.5 cursor-pointer mt-8"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
                  Göndərilir...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined !text-lg">send</span>
                  Bildirişi Canlı Göndər
                </>
              )}
            </button>

          </form>
        </div>

        {/* Dynamic Visual Live Preview Panels */}
        <div className="lg:col-span-5 space-y-6">

          {/* Toast Notification Mockup */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/80 dark:border-gray-800/60 shadow-xl shadow-gray-100/10 dark:shadow-none p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800/80 pb-3">
              <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-brand-500 animate-pulse"></span>
                Real-Time Toast Ön Baxış
              </h3>
              <span className="text-[10px] bg-brand-50 dark:bg-brand-900/10 text-brand-600 dark:text-brand-400 font-bold px-2 py-0.5 rounded-md">Sonner</span>
            </div>

            <div className={`p-4 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl shadow-xl flex gap-3 relative transition-all border-l-4 ${currentConfig.accent}`}>
              <div className={`flex-shrink-0 size-9 rounded-full flex items-center justify-center ${currentConfig.bg}`}>
                <span className="material-symbols-outlined !text-[18px]">{currentConfig.icon}</span>
              </div>
              <div className="flex-1 min-w-0 pr-4">
                <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                  {title.trim() || 'Başlıq Yoxdur'}
                </h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed line-clamp-3">
                  {text.trim() || 'Bildirişin canlı mətni burada görünəcək...'}
                </p>
                {link && (
                  <div className="mt-2.5 flex items-center gap-1 text-[10px] font-bold text-brand-500 hover:underline">
                    Daha ətraflı bax
                    <span className="material-symbols-outlined !text-xs">arrow_forward</span>
                  </div>
                )}
              </div>
              <span className="material-symbols-outlined text-gray-300 absolute right-3 top-3 !text-sm">close</span>
            </div>
          </div>

          {/* Notification Menu Dropdown Mockup */}
          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/80 dark:border-gray-800/60 shadow-xl shadow-gray-100/10 dark:shadow-none p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800/80 pb-3">
              <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-brand-500"></span>
                Zəng Dropdown Ön Baxış
              </h3>
              <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold px-2 py-0.5 rounded-md">Dropdown</span>
            </div>

            <div className="border border-gray-100 dark:border-gray-800/80 rounded-2xl overflow-hidden shadow-sm bg-gray-50/20 dark:bg-gray-950/20">

              {/* Header */}
              <div className="p-3.5 bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <h4 className="text-xs font-black text-gray-800 dark:text-gray-200">Bildirişlər</h4>
                <span className="text-[10px] font-bold text-brand-500 hover:underline cursor-pointer">Hamısını oxundu et</span>
              </div>

              {/* List Item */}
              <div className="p-4 bg-brand-500/[0.03] dark:bg-brand-500/[0.01] border-b border-gray-50 dark:border-gray-900 flex gap-3 relative">
                <div className={`flex-shrink-0 size-9 rounded-full flex items-center justify-center bg-white dark:bg-gray-900 shadow-sm ${currentConfig.bg}`}>
                  <span className="material-symbols-outlined !text-[18px]">{currentConfig.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-1">
                    <h5 className="text-[11px] font-extrabold text-gray-900 dark:text-white truncate">
                      {title.trim() || 'Başlıq Yoxdur'}
                    </h5>
                    <span className="text-[8px] text-gray-400 whitespace-nowrap mt-0.5 font-medium">1 dəqiqə əvvəl</span>
                  </div>
                  <p className="text-[10px] text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed line-clamp-2">
                    {text.trim() || 'Mətni bura daxil edin...'}
                  </p>
                </div>
                {/* Active Indicator Blue Dot */}
                <div className="size-1.5 bg-brand-500 rounded-full absolute right-4 bottom-3"></div>
              </div>

              {/* See All */}
              <div className="p-2 text-center bg-gray-50/30 dark:bg-gray-900/20">
                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 hover:text-brand-500 transition-colors cursor-pointer">Bütün bildirişlər</span>
              </div>

            </div>
          </div>

          {/* Quick Informational Panel */}
          <div className="rounded-3xl bg-gray-900 dark:bg-gray-950 p-6 text-white border border-gray-800/20">
            <div className="flex items-center gap-2.5 mb-3.5">
              <span className="material-symbols-outlined text-brand-400 !text-xl">info</span>
              <span className="text-xs font-bold text-brand-400 uppercase tracking-wider">Qeydlər:</span>
            </div>
            <ul className="text-xs text-gray-300 space-y-2.5 opacity-90 pl-1 list-disc list-inside leading-relaxed">
              <li><strong>Fərdi Bildiriş:</strong> Seçdiyiniz istifadəçi saytdadırsa, bildiriş dərhal real vaxtda onun ekranında pop-up olaraq görünəcək.</li>
              <li><strong>Toplu Bildiriş:</strong> Bildiriş eyni anda bütün istifadəçilərə dərhal və sürətli şəkildə çatdırılır.</li>
              <li><strong>Keçid Linki:</strong> Link yazdıqda istifadəçi bildirişə klikləyərək birbaşa həmin səhifəyə (məsələn, elana və ya mesaj bölməsinə) keçə bilər.</li>
            </ul>
          </div>

        </div>

      </div>

      {/* Backdrop custom styles to lock dropdown scrolling and clean interfaces */}
      {showDropdown && (
        <div className="fixed inset-0 z-80" onClick={() => setShowDropdown(false)}></div>
      )}
    </div>
  );
}

export default function AdminNotificationsPage() {
  return (
    <PermissionGuard roles={["SuperAdmin", "Admin"]}>
      <AdminNotificationsPageContent />
    </PermissionGuard>
  );
}
