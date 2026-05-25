'use client';

import { useEffect, useState } from 'react';
import { adminService } from '@/services/admin.service';
import toast from 'react-hot-toast';
import Link from 'next/link';
import PermissionGuard from '@/components/auth/PermissionGuard';
import dynamic from 'next/dynamic';

// Dynamically import react-apexcharts with ssr: false to prevent Next.js SSR mismatch errors
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

function DashboardContent() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Traffic analytics state
  const [trafficData, setTrafficData] = useState<any>(null);
  const [trafficDays, setTrafficDays] = useState<number>(7);
  const [chartLoading, setChartLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await adminService.getStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast.error('Dashboard məlumatlarını yükləmək mümkün olmadı');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchTraffic = async () => {
      try {
        setChartLoading(true);
        const data = await adminService.getTrafficStats(trafficDays);
        setTrafficData(data);
      } catch (error) {
        console.error('Error fetching traffic statistics:', error);
      } finally {
        setChartLoading(false);
      }
    };
    fetchTraffic();
  }, [trafficDays]);

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
    { title: "Elanlar", path: "/ads", desc: "Elanları idarə et", icon: "article", color: "bg-blue-50 text-blue-600 dark:bg-gray-800 dark:text-blue-400" },
    { title: "İstifadəçilər", path: "/users", desc: "İstifadəçiləri idarə et", icon: "group", color: "bg-purple-50 text-purple-600 dark:bg-gray-800 dark:text-purple-400" },
    { title: "Şikayətlər", path: "/reports", desc: "Şikayətlərə bax", icon: "report", color: "bg-error-50 text-error-600 dark:bg-gray-800 dark:text-red-400" },
    { title: "Bannerlər", path: "/banners", desc: "Reklamları tənzimlə", icon: "view_carousel", color: "bg-indigo-50 text-indigo-600 dark:bg-gray-800 dark:text-indigo-400" },
    { title: "Mağaza Sorğuları", path: "/store-requests", desc: "Yeni mağazalar", icon: "storefront", color: "bg-success-50 text-success-600 dark:bg-gray-800 dark:text-emerald-400" },
    { title: "Müraciətlər", path: "/ad-applications", desc: "Reklam müraciətləri", icon: "mail", color: "bg-orange-50 text-orange-600 dark:bg-gray-800 dark:text-orange-400" },
  ];

  // Calculate high-fidelity traffic helper stats
  const trafficCounts = trafficData?.visitorCounts || [];
  const totalTrafficSum = trafficCounts.reduce((acc: number, val: number) => acc + val, 0);
  const averageTraffic = trafficCounts.length > 0 ? Math.round(totalTrafficSum / trafficCounts.length) : 0;
  const maxTraffic = trafficCounts.length > 0 ? Math.max(...trafficCounts) : 0;

  // Chart configuration
  const chartOptions: any = {
    chart: {
      type: 'area',
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
      }
    },
    stroke: {
      curve: 'smooth',
      width: 3.5,
      colors: ['#4f46e5'] // sleek dark violet/indigo
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.02,
        stops: [0, 100],
        colorStops: [
          { offset: 0, color: '#6366f1', opacity: 0.35 },
          { offset: 100, color: '#6366f1', opacity: 0.001 }
        ]
      }
    },
    xaxis: {
      categories: trafficData?.dates?.map((d: string) => {
        const parts = d.split('-');
        if (parts.length === 3) {
          const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'İyn', 'İyl', 'Avq', 'Sen', 'Okt', 'Noy', 'Dek'];
          const day = parseInt(parts[2], 10);
          const monthIndex = parseInt(parts[1], 10) - 1;
          return `${day} ${months[monthIndex]}`;
        }
        return d;
      }) || [],
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        style: {
          colors: '#9ca3af',
          fontSize: '11px',
          fontWeight: 500
        }
      }
    },
    yaxis: {
      labels: {
        style: {
          colors: '#9ca3af',
          fontSize: '11px',
          fontWeight: 500
        }
      }
    },
    dataLabels: { enabled: false },
    grid: {
      borderColor: '#e5e7eb',
      strokeDashArray: 5,
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } }
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val: number) => `${val} unikal istifadəçi`
      }
    },
    markers: {
      size: 4,
      colors: ['#4f46e5'],
      strokeColors: '#ffffff',
      strokeWidth: 2,
      hover: { size: 6 }
    }
  };

  const chartSeries = [
    {
      name: 'İstifadəçi Trafiki',
      data: trafficCounts
    }
  ];

  return (
    <div className="space-y-8 pb-12">
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

      {/* Traffic Analytics Graph */}
      <div className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span className="w-2.5 h-6 bg-indigo-500 rounded-full"></span>
              Ziyarətçi Trafiki
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Ana saytdan toplanan unikal IP saylarına görə istifadəçi trafiki.</p>
          </div>

          {/* Time range picker buttons */}
          <div className="flex bg-gray-50 dark:bg-gray-800 p-1.5 rounded-xl border border-gray-100 dark:border-gray-700 w-fit shrink-0">
            <button
              onClick={() => setTrafficDays(7)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${trafficDays === 7
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              Son 7 Gün
            </button>
            <button
              onClick={() => setTrafficDays(30)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${trafficDays === 30
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
            >
              Son 30 Gün
            </button>
          </div>
        </div>

        {/* Analytic micro-KPI metrics row inside the container */}
        <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-2xl border border-gray-100 dark:border-gray-800/50">
          <div className="text-center sm:text-left sm:pl-4 border-r border-gray-200 dark:border-gray-800">
            <p className="text-[10px] sm:text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Cəmi Ziyarət</p>
            <p className="text-lg sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">{totalTrafficSum}</p>
          </div>
          <div className="text-center sm:text-left sm:pl-4 border-r border-gray-200 dark:border-gray-800">
            <p className="text-[10px] sm:text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Ortalama Günlük</p>
            <p className="text-lg sm:text-2xl font-black text-gray-800 dark:text-white mt-1">{averageTraffic}</p>
          </div>
          <div className="text-center sm:text-left sm:pl-4">
            <p className="text-[10px] sm:text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Pik Gün</p>
            <p className="text-lg sm:text-2xl font-black text-emerald-500 mt-1">{maxTraffic}</p>
          </div>
        </div>

        {/* Chart area */}
        <div className="relative min-h-[300px] flex items-center justify-center">
          {chartLoading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-indigo-200 border-t-indigo-600"></div>
              <p className="text-xs text-gray-400">Analitika yüklənir...</p>
            </div>
          ) : trafficCounts.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <span className="material-symbols-outlined text-gray-300 dark:text-gray-700 text-5xl">bar_chart</span>
              <p className="text-sm font-semibold text-gray-400">Hal-hazırda trafik məlumatı yoxdur</p>
              <p className="text-xs text-gray-500">Ziyarətçilər ana sayta daxil olduqdan sonra burada görünəcək.</p>
            </div>
          ) : (
            <div className="w-full">
              <Chart options={chartOptions} series={chartSeries} type="area" height={320} />
            </div>
          )}
        </div>
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
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${link.color} transition-colors group-hover:scale-110`}>
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

export default function AdminDashboard() {
  return (
    <PermissionGuard>
      <DashboardContent />
    </PermissionGuard>
  );
}

