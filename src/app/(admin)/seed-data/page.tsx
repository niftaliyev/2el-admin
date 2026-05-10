'use client';

import { useEffect, useState } from 'react';
import { adminService } from '@/services/admin.service';
import toast from 'react-hot-toast';

type DataType = 'cars' | 'phones';

export default function SeedDataPage() {
  const [activeTab, setActiveTab] = useState<DataType>('cars');
  const [jsonContent, setJsonContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = activeTab === 'cars'
        ? await adminService.getSeedDataCars()
        : await adminService.getSeedDataPhones();
      setJsonContent(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
    } catch {
      toast.error('Məlumatlar yüklənərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      JSON.parse(jsonContent);
      setSaving(true);
      if (activeTab === 'cars') await adminService.updateSeedDataCars(jsonContent);
      else await adminService.updateSeedDataPhones(jsonContent);
      toast.success('Məlumatlar uğurla yeniləndi');
    } catch (error: any) {
      if (error instanceof SyntaxError) toast.error('JSON formatı düzgün deyil');
      else toast.error('Yadda saxlayarkən xəta baş verdi');
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      await adminService.syncSeedData();
      toast.success('Məlumatlar baza ilə uğurla sinxronizasiya edildi');
    } catch {
      toast.error('Sinxronizasiya zamanı xəta baş verdi');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Marka / Model İdarəetməsi</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Avtomobil və telefon modellərini JSON olaraq tənzimləyin</p>
        </div>
        <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          {(['cars', 'phones'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {tab === 'cars' ? '🚗 Avtomobillər' : '📱 Telefonlar'}
            </button>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden flex flex-col" style={{ minHeight: '600px' }}>
        {/* Editor Header */}
        <div className="flex items-center justify-between px-5 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2.5">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-error-400"></div>
              <div className="w-3 h-3 rounded-full bg-warning-400"></div>
              <div className="w-3 h-3 rounded-full bg-success-400"></div>
            </div>
            <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
              {activeTab === 'cars' ? 'car-models.json' : 'phone-models.json'}
            </span>
            {loading && <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500 ml-2"></div>}
          </div>
          <span className="text-xs text-gray-400 font-mono">JSON</span>
        </div>

        {/* Textarea */}
        <div className="flex-1 relative" style={{ minHeight: '500px' }}>
          <textarea
            value={jsonContent}
            onChange={e => setJsonContent(e.target.value)}
            disabled={loading || saving}
            className="absolute inset-0 w-full h-full p-5 font-mono text-sm bg-gray-900 text-green-400 focus:outline-none resize-none selection:bg-brand-500/30 leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
            <span className="text-warning-500 font-bold">Diqqət:</span> JSON strukturunu qoruyun. Xətalı JSON sistemi xarab edə bilər.
          </p>
          <div className="flex gap-3 shrink-0">
            <button
              onClick={handleSave}
              disabled={loading || saving || syncing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600 transition-colors disabled:opacity-60 shadow-sm"
            >
              {saving ? (
                <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>Saxlanılır...</>
              ) : (
                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>Yadda Saxla</>
              )}
            </button>
            <button
              onClick={handleSync}
              disabled={loading || saving || syncing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-warning-500 text-white text-sm font-semibold hover:bg-warning-600 transition-colors disabled:opacity-60 shadow-sm"
              title="Fayldakı modelləri bazaya köçür"
            >
              {syncing ? (
                <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>Sinxronlaşır...</>
              ) : (
                <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>Bazaya Köçür</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
