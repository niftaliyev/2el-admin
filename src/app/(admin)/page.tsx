'use client';

import { useEffect, useState } from 'react';
import { adminService } from '@/services/admin.service';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await adminService.getStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600"></div>
      </div>
    );
  }

  const statCards = [
    { title: "Gözləyən Elanlar", value: stats?.pendingApprovals ?? stats?.pendingAds ?? 0, color: "text-warning-500", bg: "bg-warning-50 dark:bg-warning-900/20", icon: "pending" },
    { title: "Aktiv Elanlar", value: stats?.activeAds ?? 0, color: "text-success-500", bg: "bg-success-50 dark:bg-success-900/20", icon: "check_circle" },
    { title: "Cəmi Elanlar", value: stats?.totalAds ?? 0, color: "text-brand-500", bg: "bg-brand-50 dark:bg-brand-900/20", icon: "article" },
    { title: "Cəmi Gəlir", value: `${stats?.totalRevenue ?? 0} ₼`, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-900/20", icon: "payments" },
  ];

  const quickLinks = [
    { title: "Elanlar", path: "/ads", desc: "Elanları idarə et", icon: "article", color: "bg-blue-50 text-blue-600" },
    { title: "İstifadəçilər", path: "/users", desc: "İstifadəçiləri idarə et", icon: "group", color: "bg-purple-50 text-purple-600" },
    { title: "Şikayətlər", path: "/reports", desc: "Şikayətlərə bax", icon: "report", color: "bg-error-50 text-error-600" },
    { title: "Bannerlər", path: "/banners", desc: "Reklamları tənzimlə", icon: "view_carousel", color: "bg-indigo-50 text-indigo-600" },
    { title: "Mağaza Sorğuları", path: "/store-requests", desc: "Yeni mağazalar", icon: "storefront", color: "bg-success-50 text-success-600" },
    { title: "Müraciətlər", path: "/ad-applications", desc: "Reklam müraciətləri", icon: "mail", color: "bg-orange-50 text-orange-600" },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Xoş gəldiniz! 👋</h1>
          <p className="text-gray-500 dark:text-gray-400">Admin paneldən bütün sistem fəaliyyətlərini idarə edə bilərsiniz.</p>
        </div>
        <div className="hidden lg:block absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-brand-50 to-transparent dark:from-brand-900/10"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-xl ${card.bg}`}>
                <span className={`material-symbols-outlined ${card.color}`}>{card.icon}</span>
              </div>
            </div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{card.title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Quick Access */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="w-2 h-6 bg-brand-500 rounded-full"></span>
          Sürətli Keçidlər
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link, i) => (
            <Link
              key={i}
              href={link.path}
              className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${link.color} dark:bg-gray-800 transition-colors group-hover:scale-110`}>
                  <span className="material-symbols-outlined">{link.icon}</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-0.5">{link.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{link.desc}</p>
                </div>
                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-gray-300">chevron_right</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
