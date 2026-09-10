import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Share2,
  Settings as SettingsIcon,
  Plus,
  WifiOff,
  CheckCircle2,
  Calendar,
  Cloud,
  Layers,
  FileDown,
  AlertTriangle
} from 'lucide-react';
import {
  getMonthsList,
  saveMonthsList,
  getMonthData,
  saveMonthData,
  getAppSettings,
  saveAppSettings,
  createAutoSnapshot,
  formatMonthLabel,
  resetMonthData,
  factoryResetAll,
  DEFAULT_SETTINGS
} from './services/storage';
import { exportMonthToPDF } from './services/pdfGenerator';
import { AdvanceEntry, AppSettings, CostEntry, MonthData } from './types';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { PWAInstallButton } from './components/PWAInstallButton';
import { BalanceCard } from './components/BalanceCard';
import { AdvanceCard } from './components/AdvanceCard';
import { CostCard } from './components/CostCard';
import { BackupModal } from './components/BackupModal';
import { ShareLiveLinkModal } from './components/ShareLiveLinkModal';
import { SettingsModal } from './components/SettingsModal';
import { ResetModal } from './components/ResetModal';

export default function App() {
  const isOnline = useOnlineStatus();

  const [months, setMonths] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState<string>('');
  const [monthData, setMonthData] = useState<MonthData>({ advances: [], costs: [] });
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [saveStatus, setSaveStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);

  // Modals
  const [isNewMonthOpen, setIsNewMonthOpen] = useState(false);
  const [newMonthValue, setNewMonthValue] = useState('');
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);

  // Initialize data on mount
  useEffect(() => {
    async function init() {
      try {
        const loadedSettings = await getAppSettings();
        setSettings(loadedSettings);

        const loadedMonths = await getMonthsList();
        setMonths(loadedMonths);

        if (loadedMonths.length > 0) {
          const firstMonth = loadedMonths[0];
          setCurrentMonth(firstMonth);
          const data = await getMonthData(firstMonth);
          setMonthData(data);
        }
      } catch (err) {
        console.error('Initialization error', err);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // Persist current month data whenever it changes
  const persistMonthData = useCallback(
    async (updatedData: MonthData, targetMonth = currentMonth) => {
      if (!targetMonth) return;
      setSaveStatus('সেভ হচ্ছে...');
      try {
        await saveMonthData(targetMonth, updatedData);
        setSaveStatus('সেভ হয়েছে ✓');

        // Create background auto-snapshot with current snapshot of months
        const allMonthsData: Record<string, MonthData> = {};
        for (const m of months) {
          if (m === targetMonth) {
            allMonthsData[m] = updatedData;
          } else {
            allMonthsData[m] = await getMonthData(m);
          }
        }
        await createAutoSnapshot(months, allMonthsData);
      } catch (e) {
        console.error('Failed to save data', e);
        setSaveStatus('সেভ করতে সমস্যা হয়েছে');
      }
    },
    [currentMonth, months]
  );

  // Advance actions
  const handleAddAdvance = (entry: AdvanceEntry) => {
    const updated: MonthData = {
      ...monthData,
      advances: [entry, ...monthData.advances],
    };
    setMonthData(updated);
    persistMonthData(updated);
  };

  const handleUpdateAdvance = (id: string, partial: Partial<AdvanceEntry>) => {
    const updated: MonthData = {
      ...monthData,
      advances: monthData.advances.map((a) => (a.id === id ? { ...a, ...partial } : a)),
    };
    setMonthData(updated);
    persistMonthData(updated);
  };

  const handleDeleteAdvance = (id: string) => {
    const updated: MonthData = {
      ...monthData,
      advances: monthData.advances.filter((a) => a.id !== id),
    };
    setMonthData(updated);
    persistMonthData(updated);
  };

  // Cost actions
  const handleAddCost = (entry: CostEntry) => {
    const updated: MonthData = {
      ...monthData,
      costs: [entry, ...monthData.costs],
    };
    setMonthData(updated);
    persistMonthData(updated);
  };

  const handleUpdateCost = (id: string, partial: Partial<CostEntry>) => {
    const updated: MonthData = {
      ...monthData,
      costs: monthData.costs.map((c) => (c.id === id ? { ...c, ...partial } : c)),
    };
    setMonthData(updated);
    persistMonthData(updated);
  };

  const handleDeleteCost = (id: string) => {
    const updated: MonthData = {
      ...monthData,
      costs: monthData.costs.filter((c) => c.id !== id),
    };
    setMonthData(updated);
    persistMonthData(updated);
  };

  // Month Switcher
  const handleSwitchMonth = async (ym: string) => {
    if (ym === currentMonth) return;
    setCurrentMonth(ym);
    setSaveStatus('');
    const data = await getMonthData(ym);
    setMonthData(data);
  };

  // Create new month
  const handleConfirmNewMonth = async () => {
    if (!newMonthValue) return;
    let updatedMonths = months;
    if (!months.includes(newMonthValue)) {
      updatedMonths = Array.from(new Set([newMonthValue, ...months])).sort().reverse();
      setMonths(updatedMonths);
      await saveMonthsList(updatedMonths);
    }
    setIsNewMonthOpen(false);
    setCurrentMonth(newMonthValue);
    const data = await getMonthData(newMonthValue);
    setMonthData(data);
  };

  // Delete current month
  const handleDeleteCurrentMonth = async () => {
    if (months.length <= 1) {
      alert('কমপক্ষে একটি মাস তালিকায় থাকতে হবে। পুরো মাস মুছে ফেলা সম্ভব নয়।');
      return;
    }
    if (!window.confirm(`আপনি কি সত্যিই ${formatMonthLabel(currentMonth)} মাসের সব হিসাব মুছে ফেলতে চান?`)) {
      return;
    }

    const updatedMonths = months.filter((m) => m !== currentMonth);
    setMonths(updatedMonths);
    await saveMonthsList(updatedMonths);

    // switch to first available
    const nextMonth = updatedMonths[0];
    setCurrentMonth(nextMonth);
    const nextData = await getMonthData(nextMonth);
    setMonthData(nextData);
    setIsSettingsOpen(false);
  };

  // Data restored from backup
  const handleDataRestored = async () => {
    const updatedMonths = await getMonthsList();
    const updatedSettings = await getAppSettings();
    setMonths(updatedMonths);
    setSettings(updatedSettings);

    const targetMonth = updatedMonths[0];
    setCurrentMonth(targetMonth);
    const data = await getMonthData(targetMonth);
    setMonthData(data);
  };

  const handleSaveSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    await saveAppSettings(newSettings);
  };

  // Reset Handlers
  const handleResetCurrentMonth = async () => {
    if (!currentMonth) return;
    await resetMonthData(currentMonth);
    const refreshed = await getMonthData(currentMonth);
    setMonthData(refreshed);
    setSaveStatus(`${formatMonthLabel(currentMonth)} মাসের হিসাব সফলভাবে রিসেট করা হয়েছে ✓`);
    setTimeout(() => setSaveStatus(''), 4000);
  };

  const handleFactoryResetAll = async () => {
    const result = await factoryResetAll();
    const updatedMonths = await getMonthsList();
    const updatedSettings = await getAppSettings();
    setMonths(updatedMonths);
    setCurrentMonth(result.defaultMonth);
    setSettings(updatedSettings);
    const refreshed = await getMonthData(result.defaultMonth);
    setMonthData(refreshed);
    setSaveStatus('সব তথ্য সফলভাবে মুছে সম্পূর্ণ রিসেট করা হয়েছে ✓');
    setTimeout(() => setSaveStatus(''), 4000);
  };

  // Auto-scroll active month chip smoothly into view
  useEffect(() => {
    if (currentMonth) {
      const activeChip = document.getElementById(`month-chip-${currentMonth}`);
      activeChip?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentMonth]);

  const handleQuickPDF = async () => {
    if (!currentMonth || isGeneratingPDF) return;
    try {
      setIsGeneratingPDF(true);
      setSaveStatus('পিডিএফ তৈরি হচ্ছে...');
      await exportMonthToPDF(currentMonth, monthData, settings, (msg) => {
        setSaveStatus(msg);
      });
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (err) {
      console.error('Failed to generate PDF', err);
      setSaveStatus('পিডিএফ ডাউনলোড করতে সমস্যা হয়েছে');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f4f5f8] flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 border-3 border-[#3151e0] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-gray-600">হিসাব লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div id="khata-root" className="min-h-screen bg-[#f4f5f8] text-[#131722] antialiased">
      {/* Container constrained to 840px for comfortable desktop reading, 100% on mobile */}
      <main className="max-w-[840px] mx-auto px-3.5 sm:px-5 py-4 sm:py-6">
        {/* Offline indicator bar */}
        {!isOnline && (
          <div
            id="offline-banner"
            className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 text-amber-900 rounded-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in duration-200"
          >
            <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
            <span>অফলাইন মোড চালু: ইন্টারনেট ছাড়াই আপনার ফোনের মেমোরিতে সব হিসাব নিরাপদে সেভ হচ্ছে।</span>
          </div>
        )}

        {/* Top Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#e4e7ec]/80">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#131722] flex items-center gap-2">
              <span>Hishab Tracker</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#eaefff] text-[#3151e0] border border-[#3151e0]/20">
                PWA লাইভ
              </span>
            </h1>
            <p className="text-xs sm:text-[13px] text-[#667085] mt-0.5">
              পেজের অগ্রিম ও বাড়তি খরচের মাসিক হিসাব
            </p>
          </div>

          {/* Action buttons toolbar */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              id="header-quick-pdf-btn"
              type="button"
              onClick={handleQuickPDF}
              disabled={isGeneratingPDF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-[#131722] border border-[#e4e7ec] hover:border-[#e0623f]/60 hover:bg-[#fff9f7] transition active:scale-95 shadow-2xs"
              title="বর্তমান মাসের হিসাব সরাসরি PDF হিসেবে ডাউনলোড করুন"
            >
              <FileDown className="w-3.5 h-3.5 text-[#e0623f]" />
              <span>{isGeneratingPDF ? 'PDF হচ্ছে...' : 'PDF সেভ'}</span>
            </button>

            <button
              id="header-share-link-btn"
              type="button"
              onClick={() => setIsShareOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-[#131722] border border-[#e4e7ec] hover:border-[#c9cfda] transition active:scale-95 shadow-2xs"
              title="লাইভ লিংক কপি ও শেয়ার করুন"
            >
              <Share2 className="w-3.5 h-3.5 text-[#3151e0]" />
              <span>লাইভ লিংক</span>
            </button>

            <button
              id="header-backup-btn"
              type="button"
              onClick={() => setIsBackupOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-[#131722] border border-[#e4e7ec] hover:border-[#c9cfda] transition active:scale-95 shadow-2xs"
              title="ডেটা ব্যাকআপ ও রিস্টোর"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#0f9d74]" />
              <span>ব্যাকআপ</span>
            </button>

            <button
              id="header-reset-btn"
              type="button"
              onClick={() => setIsResetOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-red-600 border border-red-200 hover:border-red-400 hover:bg-red-50/80 transition active:scale-95 shadow-2xs"
              title="হিসাব রিসেট করার অপশন (Danger Zone)"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
              <span>রিসেট</span>
            </button>

            <PWAInstallButton />

            <button
              id="header-settings-btn"
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-200/60 transition"
              title="সেটিংস"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Month selection chips */}
        <section aria-label="মাস নির্বাচন" className="mb-3">
          <div id="months-tabs-scroll" className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none smooth-scroll">
            {months.map((ym) => (
              <button
                key={ym}
                id={`month-chip-${ym}`}
                type="button"
                onClick={() => handleSwitchMonth(ym)}
                className={`text-xs sm:text-[13px] font-semibold px-3.5 py-1.5 rounded-full border transition whitespace-nowrap active:scale-95 ${
                  ym === currentMonth
                    ? 'bg-[#131722] border-[#131722] text-white shadow-xs'
                    : 'bg-white border-[#e4e7ec] text-[#667085] hover:border-[#c9cfda] hover:text-[#131722]'
                }`}
              >
                {formatMonthLabel(ym)}
              </button>
            ))}

            <button
              id="open-new-month-btn"
              type="button"
              onClick={() => {
                setNewMonthValue(currentMonth || new Date().toISOString().slice(0, 7));
                setIsNewMonthOpen(!isNewMonthOpen);
              }}
              className="text-xs sm:text-[13px] font-semibold px-3.5 py-1.5 rounded-full bg-[#eaefff] text-[#3151e0] border border-transparent hover:bg-[#dfe6ff] transition whitespace-nowrap active:scale-95 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ নতুন মাস</span>
            </button>
          </div>

          {/* New Month Popover */}
          {isNewMonthOpen && (
            <div
              id="new-month-popover"
              className="flex flex-wrap items-center gap-2 p-3 bg-white border border-[#e4e7ec] rounded-xl shadow-xs my-2 animate-in fade-in duration-150"
            >
              <span className="text-xs font-semibold text-gray-600">মাস নির্বাচন করুন:</span>
              <input
                id="new-month-picker-input"
                type="month"
                value={newMonthValue}
                onChange={(e) => setNewMonthValue(e.target.value)}
                className="text-xs px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white"
              />
              <button
                id="confirm-new-month-btn"
                type="button"
                onClick={handleConfirmNewMonth}
                className="px-3 py-1.5 bg-[#3151e0] text-white text-xs font-semibold rounded-lg hover:bg-[#2540b8] transition"
              >
                যোগ করো
              </button>
              <button
                id="cancel-new-month-btn"
                type="button"
                onClick={() => setIsNewMonthOpen(false)}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-200 transition"
              >
                বাতিল
              </button>
            </div>
          )}
        </section>

        {/* Balance Hero Card */}
        <BalanceCard currentMonth={currentMonth} data={monthData} settings={settings} />

        {/* Two column grid for Advances & Costs */}
        <section aria-label="অগ্রিম ও খরচের হিসাব" className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <AdvanceCard
            entries={monthData.advances}
            onAdd={handleAddAdvance}
            onUpdate={handleUpdateAdvance}
            onDelete={handleDeleteAdvance}
          />

          <CostCard
            entries={monthData.costs}
            onAdd={handleAddCost}
            onUpdate={handleUpdateCost}
            onDelete={handleDeleteCost}
          />
        </section>

        {/* Save Status & Safe storage info */}
        <div className="text-center space-y-1 my-5 text-xs text-[#98a2b3]">
          <div id="app-save-status-display" className="h-4 font-medium text-[#0f9d74]">
            {saveStatus}
          </div>
          <div className="flex items-center justify-center gap-1 text-[11.5px] text-gray-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#0f9d74]" />
            <span>{formatMonthLabel(currentMonth)}-এর সব হিসাব ফোনে তাৎক্ষণিক সুরক্ষিত আছে</span>
          </div>
        </div>

        {/* Credit line from original template */}
        <footer className="text-center text-xs text-[#98a2b3] pt-4 pb-6 border-t border-[#e4e7ec] space-y-2">
          <div className="flex items-center justify-center gap-3 text-[11px] text-gray-500 flex-wrap">
            <button
              onClick={() => setIsBackupOpen(true)}
              className="hover:text-[#3151e0] transition underline"
            >
              ⭳ ব্যাকআপ ফাইল ডাউনলোড
            </button>
            <span>•</span>
            <button
              onClick={() => setIsShareOpen(true)}
              className="hover:text-[#3151e0] transition underline"
            >
              🔗 ফ্রি লাইভ লিংক
            </button>
            <span>•</span>
            <button
              onClick={() => setIsResetOpen(true)}
              className="hover:text-red-600 text-red-600/90 transition underline font-medium flex items-center gap-1"
            >
              <span>⚠️ হিসাব রিসেট</span>
            </button>
          </div>
          <div className="font-mono text-[11px] tracking-wide text-gray-400">
            Developed by Tasin (Claude Code)
          </div>
        </footer>
      </main>

      {/* Modals */}
      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        months={months}
        currentMonth={currentMonth}
        currentMonthData={monthData}
        settings={settings}
        onDataRestored={handleDataRestored}
      />

      <ShareLiveLinkModal isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
        onDeleteCurrentMonth={handleDeleteCurrentMonth}
        currentMonthLabel={formatMonthLabel(currentMonth)}
        onOpenResetModal={() => setIsResetOpen(true)}
      />

      <ResetModal
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        currentMonth={currentMonth}
        currentMonthData={monthData}
        totalMonthsCount={months.length}
        onResetCurrentMonth={handleResetCurrentMonth}
        onFactoryResetAll={handleFactoryResetAll}
      />
    </div>
  );
}
