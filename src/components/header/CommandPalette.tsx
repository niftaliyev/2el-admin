"use client";

import React, { useState, useEffect, useRef } from "react";
import { Modal } from "@/components/ui/modal";
import { adminService } from "@/services/admin.service";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const staticPages = [
  { title: "Panel (Dashboard)", path: "/", icon: "dashboard" },
  { title: "Bütün Elanlar", path: "/ads", icon: "article" },
  { title: "Gözləyən Elanlar", path: "/ads?status=pending", icon: "pending" },
  { title: "İstifadəçilər", path: "/users", icon: "group" },
  { title: "Şikayətlər", path: "/reports", icon: "report" },
  { title: "Bannerlər", path: "/banners", icon: "view_carousel" },
];

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    users: any[];
    ads: any[];
    pages: any[];
  }>({ users: [], ads: [], pages: [] });
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Combine all results into a single flat list for keyboard navigation
  const allResults = query.length < 2 
    ? staticPages.map(p => ({ ...p, type: 'page' }))
    : [
        ...results.users.map(u => ({ ...u, type: 'user', path: `/users/${u.id}` })),
        ...results.ads.map(a => ({ ...a, type: 'ad', path: `/ads/${a.id}` }))
      ];

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setQuery("");
      setSelectedIndex(0);
      setResults({ users: [], ads: [], pages: staticPages });
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, results]);

  useEffect(() => {
    const search = async () => {
      if (query.length < 2) {
        setResults(prev => ({ ...prev, users: [], ads: [] }));
        return;
      }

      setLoading(true);
      try {
        const [usersData, adsData] = await Promise.all([
          adminService.getUsers(1, 5, undefined, query),
          adminService.getAds(1, 5, undefined, query)
        ]);

        setResults(prev => ({
          ...prev,
          users: usersData.data || [],
          ads: adsData.data || []
        }));
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleNavigate = (path: string) => {
    router.push(path);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % allResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + allResults.length) % allResults.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (allResults[selectedIndex]) {
        handleNavigate(allResults[selectedIndex].path);
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false} className="max-w-2xl p-0">
      <div className="flex items-center px-4 py-4 border-b border-gray-100 dark:border-gray-800">
        <span className="material-symbols-outlined text-gray-400 mr-3">search</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Axtar (İstifadəçilər, Elanlar və ya Səhifələr)..."
          className="flex-1 bg-transparent border-none outline-none text-gray-900 dark:text-white placeholder:text-gray-400 text-lg"
        />
        <div className="flex items-center gap-2">
          {loading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>}
          <span className="text-[10px] font-bold px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-lg">ESC</span>
        </div>
      </div>

      <div className="max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
        {query.length < 2 && results.pages.length > 0 && (
          <div className="mb-4">
            <h4 className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sürətli Keçidlər</h4>
            <div className="space-y-1">
              {staticPages.map((page, i) => (
                <button
                  key={i}
                  onClick={() => handleNavigate(page.path)}
                  onMouseEnter={() => setSelectedIndex(i)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl group transition-all ${
                    selectedIndex === i && query.length < 2
                      ? "bg-brand-50 dark:bg-brand-900/20" 
                      : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }`}
                >
                  <span className={`material-symbols-outlined transition-colors ${
                    selectedIndex === i && query.length < 2 ? "text-brand-500" : "text-gray-400 group-hover:text-brand-500"
                  }`}>{page.icon}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{page.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {results.users.length > 0 && (
          <div className="mb-4">
            <h4 className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">İstifadəçilər</h4>
            <div className="space-y-1">
              {results.users.map((user, i) => {
                const globalIndex = i;
                const isSelected = selectedIndex === globalIndex && query.length >= 2;
                return (
                  <button
                    key={user.id}
                    onClick={() => handleNavigate(`/users/${user.id}`)}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl group transition-all ${
                      isSelected ? "bg-brand-50 dark:bg-brand-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-brand-600 font-bold text-xs">
                      {user.fullName?.charAt(0) || "U"}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.fullName}</p>
                      <p className="text-[10px] text-gray-500">{user.email}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {results.ads.length > 0 && (
          <div className="mb-4">
            <h4 className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Elanlar</h4>
            <div className="space-y-1">
              {results.ads.map((ad, i) => {
                const globalIndex = results.users.length + i;
                const isSelected = selectedIndex === globalIndex && query.length >= 2;
                return (
                  <button
                    key={ad.id}
                    onClick={() => handleNavigate(`/ads/${ad.id}`)}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl group transition-all ${
                      isSelected ? "bg-brand-50 dark:bg-brand-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    {ad.images?.[0] ? (
                      <img src={ad.images[0]} className="w-8 h-8 rounded-lg object-cover" alt="" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <span className="material-symbols-outlined text-gray-400 text-sm">image</span>
                      </div>
                    )}
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{ad.title}</p>
                      <p className="text-[10px] text-gray-500">{ad.price} {ad.currency}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {query.length >= 2 && results.users.length === 0 && results.ads.length === 0 && !loading && (
          <div className="py-12 text-center">
            <span className="material-symbols-outlined text-gray-300 text-4xl mb-2">search_off</span>
            <p className="text-gray-500 text-sm">Heç bir nəticə tapılmadı: "{query}"</p>
          </div>
        )}
      </div>

      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/30 border-t border-gray-100 dark:border-gray-800 rounded-b-3xl flex justify-between items-center">
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-[10px] text-gray-500 shadow-sm">↑↓</kbd>
            <span className="text-[10px] text-gray-400">Naviqasiya</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-[10px] text-gray-500 shadow-sm">Enter</kbd>
            <span className="text-[10px] text-gray-400">Seç</span>
          </div>
        </div>
        <p className="text-[10px] text-gray-400">Axtarış üçün ən azı 2 simvol daxil edin</p>
      </div>
    </Modal>
  );
};

export default CommandPalette;
