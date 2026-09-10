import React, { useState } from 'react';
import {
  Download,
  Upload,
  Copy,
  Check,
  FileSpreadsheet,
  Printer,
  History,
  ShieldCheck,
  AlertTriangle,
  X,
  RefreshCw,
  FileText
} from 'lucide-react';
import {
  createBackupBundle,
  downloadJSONBackup,
  restoreBackupBundle,
  getAutoSnapshots,
  generateCSV,
  getMonthData,
  formatMonthLabel
} from '../services/storage';
import { exportMonthToPDF } from '../services/pdfGenerator';
import { AppSettings, MonthData } from '../types';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  months: string[];
  currentMonth: string;
  currentMonthData: MonthData;
  settings: AppSettings;
  onDataRestored: () => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  months,
  currentMonth,
  currentMonthData,
  settings,
  onDataRestored,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'snapshots' | 'csv'>('export');
  const [copied, setCopied] = useState(false);
  const [pastedJson, setPastedJson] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const snapshots = getAutoSnapshots();

  const handleDownloadBackup = async () => {
    try {
      setIsProcessing(true);
      const bundle = await createBackupBundle(months);
      downloadJSONBackup(bundle);
      setStatusMessage({ text: 'ব্যাকআপ ফাইল সফলভাবে ডাউনলোড হয়েছে!', type: 'success' });
    } catch {
      setStatusMessage({ text: 'ব্যাকআপ তৈরিতে সমস্যা হয়েছে', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyBackup = async () => {
    try {
      const bundle = await createBackupBundle(months);
      await navigator.clipboard.writeText(JSON.stringify(bundle, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      setStatusMessage({ text: 'ব্যাকআপ ডেটা ক্লিপবোর্ডে কপি করা হয়েছে!', type: 'success' });
    } catch {
      setStatusMessage({ text: 'কপি করতে সমস্যা হয়েছে', type: 'error' });
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsProcessing(true);
      const text = await file.text();
      const bundle = JSON.parse(text);
      const result = await restoreBackupBundle(bundle);
      if (result.success) {
        setStatusMessage({ text: result.message, type: 'success' });
        onDataRestored();
      } else {
        setStatusMessage({ text: result.message, type: 'error' });
      }
    } catch {
      setStatusMessage({ text: 'ফাইলটি সঠিক ব্যাকআপ ফরম্যাটে নেই', type: 'error' });
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const handleTextRestore = async () => {
    if (!pastedJson.trim()) return;
    try {
      setIsProcessing(true);
      const bundle = JSON.parse(pastedJson);
      const result = await restoreBackupBundle(bundle);
      if (result.success) {
        setStatusMessage({ text: result.message, type: 'success' });
        setPastedJson('');
        onDataRestored();
      } else {
        setStatusMessage({ text: result.message, type: 'error' });
      }
    } catch {
      setStatusMessage({ text: 'প্রদত্ত টেক্সটটি সঠিক JSON ব্যাকআপ নয়', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestoreSnapshot = async (snapshotData: Record<string, MonthData>) => {
    if (!window.confirm('আপনি কি সত্যিই এই অটো-সেভ থেকে ডেটা পুনরুদ্ধার করতে চান? বর্তমান ডেটা পরিবর্তিত হবে।')) return;
    try {
      setIsProcessing(true);
      const snapshotMonths = Object.keys(snapshotData).sort().reverse();
      const bundle = {
        appName: 'Hishab Tracker',
        version: 2,
        exportedAt: new Date().toISOString(),
        months: snapshotMonths,
        data: snapshotData,
      };
      const result = await restoreBackupBundle(bundle);
      if (result.success) {
        setStatusMessage({ text: 'পূর্ববর্তী অটো-সেভ সফলভাবে রিস্টোর করা হয়েছে!', type: 'success' });
        onDataRestored();
      } else {
        setStatusMessage({ text: result.message, type: 'error' });
      }
    } catch {
      setStatusMessage({ text: 'রিস্টোর করতে সমস্যা হয়েছে', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadCSV = () => {
    try {
      const csv = generateCSV(currentMonth, currentMonthData, settings);
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hishab-${currentMonth}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusMessage({ text: `${formatMonthLabel(currentMonth)}-এর CSV ডাউনলোড হয়েছে!`, type: 'success' });
    } catch {
      setStatusMessage({ text: 'CSV তৈরিতে সমস্যা হয়েছে', type: 'error' });
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setIsProcessing(true);
      setStatusMessage({ text: 'পিডিএফ তৈরি হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...', type: 'success' });
      await exportMonthToPDF(currentMonth, currentMonthData, settings, (msg) => {
        setStatusMessage({ text: msg, type: 'success' });
      });
    } catch (err) {
      console.error('PDF generation error', err);
      setStatusMessage({ text: 'পিডিএফ ফাইলে সেভ করতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      id="backup-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden text-left my-auto">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-[#131722] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-[#3151e0]">
              <ShieldCheck className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">ডেটা ব্যাকআপ ও সুরক্ষা সেন্টার</h2>
              <p className="text-xs text-gray-300">দীর্ঘমেয়াদে ব্যবহারের জন্য সুরক্ষিত ব্যবস্থা</p>
            </div>
          </div>
          <button
            id="close-backup-modal-btn"
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 px-5 pt-2 bg-gray-50/80 gap-2 overflow-x-auto">
          <button
            id="tab-export-btn"
            type="button"
            onClick={() => setActiveTab('export')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
              activeTab === 'export'
                ? 'border-[#3151e0] text-[#3151e0]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            ⭳ ব্যাকআপ নিন
          </button>
          <button
            id="tab-import-btn"
            type="button"
            onClick={() => setActiveTab('import')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition ${
              activeTab === 'import'
                ? 'border-[#3151e0] text-[#3151e0]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            ⭱ রিস্টোর করুন
          </button>
          <button
            id="tab-snapshots-btn"
            type="button"
            onClick={() => setActiveTab('snapshots')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition flex items-center gap-1 ${
              activeTab === 'snapshots'
                ? 'border-[#3151e0] text-[#3151e0]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>অটো-সেভ হিস্টোরি ({snapshots.length})</span>
          </button>
          <button
            id="tab-csv-btn"
            type="button"
            onClick={() => setActiveTab('csv')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 whitespace-nowrap transition flex items-center gap-1 ${
              activeTab === 'csv'
                ? 'border-[#3151e0] text-[#3151e0]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-[#e0623f]" />
            <span>PDF ও Excel রিপোর্ট</span>
          </button>
        </div>

        {/* Status Message */}
        {statusMessage && (
          <div
            className={`mx-5 mt-4 p-3 rounded-xl text-xs font-medium flex items-center justify-between ${
              statusMessage.type === 'success'
                ? 'bg-[#e6f7f1] text-[#0f9d74] border border-[#b2e5d5]'
                : 'bg-[#fdeee9] text-[#e0623f] border border-[#f5c6b9]'
            }`}
          >
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)} className="opacity-70 hover:opacity-100 text-xs">
              ✕
            </button>
          </div>
        )}

        {/* Tab Content */}
        <div className="p-5 max-h-[70vh] overflow-y-auto">
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100">
                <h4 className="text-sm font-bold text-[#131722] mb-1">দীর্ঘমেয়াদী নিরাপদ ব্যাকআপ</h4>
                <p className="text-xs text-[#667085] leading-relaxed">
                  সব মাসের মোট {months.length} টি মাসের হিসাব এই ব্যাকআপ ফাইলে সংরক্ষিত থাকবে। যেকোনো নতুন ডিভাইসে বা ব্রাউজার পরিষ্কার করার পরেও এই ফাইল থেকে মুহূর্তের মধ্যে ফেরত আনা যাবে।
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                <button
                  id="download-backup-file-btn"
                  onClick={handleDownloadBackup}
                  disabled={isProcessing}
                  className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-[#3151e0]/30 bg-[#eaefff] hover:bg-[#dfe6ff] transition text-center group"
                >
                  <Download className="w-5 h-5 text-[#3151e0] mb-1.5 group-hover:-translate-y-0.5 transition-transform" />
                  <span className="text-xs font-bold text-[#3151e0]">JSON ব্যাকআপ ফাইল</span>
                  <span className="text-[10.5px] text-gray-500 mt-0.5">সব মাস রিস্টোর করার জন্য</span>
                </button>

                <button
                  id="download-pdf-report-export-tab-btn"
                  onClick={handleDownloadPDF}
                  disabled={isProcessing}
                  className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-[#e0623f]/30 bg-[#fdeee9] hover:bg-[#fae1d9] transition text-center group"
                >
                  <FileText className="w-5 h-5 text-[#e0623f] mb-1.5 group-hover:-translate-y-0.5 transition-transform" />
                  <span className="text-xs font-bold text-[#e0623f]">PDF রিপোর্ট ডাউনলোড</span>
                  <span className="text-[10.5px] text-gray-500 mt-0.5">প্রিন্ট বা ডকুমেন্টের জন্য</span>
                </button>

                <button
                  id="copy-backup-text-btn"
                  onClick={handleCopyBackup}
                  className="flex flex-col items-center justify-center p-3.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition text-center group"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-600 mb-1.5" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-600 mb-1.5 group-hover:-translate-y-0.5 transition-transform" />
                  )}
                  <span className="text-xs font-bold text-[#131722]">
                    {copied ? 'কপি হয়েছে!' : 'ক্লিপবোর্ডে কপি'}
                  </span>
                  <span className="text-[10.5px] text-gray-500 mt-0.5">WhatsApp এ রাখার জন্য</span>
                </button>
              </div>

              <div className="text-[11px] text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
                💡 <strong>পরামর্শ:</strong> প্রতি মাসের শেষে বা বড় হিসাব করার পর একবার ব্যাকআপ ফাইলটি ডাউনলোড করে আপনার Google Drive বা WhatsApp-এ রেখে দিন। তাহলে সারাজীবনেও আপনার ডেটা হারাবে না।
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 leading-relaxed">
                <strong>সতর্কতা:</strong> ব্যাকআপ ফাইল বা টেক্সট রিস্টোর করলে বর্তমানের হিসাবগুলো ব্যাকআপ ফাইলের ডেটা দ্বারা আপডেট হবে।
              </div>

              {/* File Upload Box */}
              <div>
                <label className="block text-xs font-semibold text-[#131722] mb-1.5">
                  ১. ব্যাকআপ ফাইল আপলোড করুন (.json)
                </label>
                <label
                  htmlFor="file-upload-input"
                  className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-6 bg-gray-50 hover:bg-gray-100 cursor-pointer transition"
                >
                  <Upload className="w-6 h-6 text-gray-400 mb-1" />
                  <span className="text-xs font-semibold text-[#3151e0]">কম্পিউটার বা ফোন থেকে ফাইল নির্বাচন করুন</span>
                  <span className="text-[11px] text-gray-400 mt-0.5">.json ফাইল ফরম্যাট</span>
                  <input
                    id="file-upload-input"
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileImport}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Text Paste Box */}
              <div className="pt-2 border-t border-gray-100">
                <label className="block text-xs font-semibold text-[#131722] mb-1.5">
                  ২. অথবা কপি করা ব্যাকআপ টেক্সট পেস্ট করুন
                </label>
                <textarea
                  id="backup-json-textarea"
                  rows={3}
                  value={pastedJson}
                  onChange={(e) => setPastedJson(e.target.value)}
                  placeholder="এখানে ব্যাকআপ JSON কোড পেস্ট করুন..."
                  className="w-full text-xs font-mono p-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[#3151e0] focus:outline-hidden"
                />
                <button
                  id="restore-from-text-btn"
                  onClick={handleTextRestore}
                  disabled={!pastedJson.trim() || isProcessing}
                  className="mt-2 w-full py-2 px-4 rounded-xl bg-[#131722] text-white text-xs font-semibold hover:bg-black disabled:opacity-40 transition"
                >
                  টেক্সট থেকে হিসাব রিস্টোর করুন
                </button>
              </div>
            </div>
          )}

          {activeTab === 'snapshots' && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 leading-relaxed">
                অ্যাপটি স্বয়ংক্রিয়ভাবে আপনার সাম্প্রতিক কাজের ব্যাকআপ সংরক্ষণ করে রাখে। ভুলবশত কোনো হিসাব মুছে ফেললে নিচে থেকে পূর্বের অবস্থায় ফিরে যেতে পারেন:
              </p>

              {snapshots.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl">
                  এখনো কোনো পূর্ববর্তী অটো-সেভ তৈরি হয়নি। ডেটা পরিবর্তন করার সাথে সাথে এখানে রেকর্ড জমবে।
                </div>
              ) : (
                <div className="space-y-2">
                  {snapshots.map((snap, idx) => (
                    <div
                      key={snap.timestamp || idx}
                      className="p-3 rounded-xl border border-gray-200 hover:border-gray-300 bg-white flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-[#131722]">{snap.label}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5">
                          {snap.monthsCount} টি মাস • মোট {snap.totalEntries} টি এন্ট্রি
                        </div>
                      </div>
                      <button
                        id={`restore-snapshot-btn-${idx}`}
                        type="button"
                        onClick={() => handleRestoreSnapshot(snap.data)}
                        className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-[#3151e0] hover:text-white text-[#131722] font-semibold text-xs transition"
                      >
                        রিস্টোর
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'csv' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-orange-50/80 border border-orange-200">
                <h4 className="text-sm font-bold text-orange-950 mb-1">পিডিএফ ও এক্সেল রিপোর্ট ডাউনলোড</h4>
                <p className="text-xs text-orange-900 leading-relaxed">
                  বর্তমান মাস ({formatMonthLabel(currentMonth)})-এর বিস্তারিত অগ্রিম, খরচ ও মোট ব্যালেন্স হিসাব সরাসরি <strong>.pdf</strong> ফাইল আকারে ডাউনলোড করে ফোনে সেভ করে রাখতে পারেন।
                </p>
              </div>

              <div className="space-y-2.5">
                {/* Primary Direct PDF Download Button */}
                <button
                  id="download-direct-pdf-btn"
                  onClick={handleDownloadPDF}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2.5 p-4 rounded-xl border border-[#e0623f] bg-[#e0623f] text-white hover:bg-[#c34f31] disabled:opacity-60 transition text-xs font-bold shadow-xs active:scale-98"
                >
                  <FileText className="w-5 h-5 text-white" />
                  <span>
                    {isProcessing ? 'পিডিএফ ফাইল তৈরি হচ্ছে...' : 'সরাসরি PDF ফাইল ডাউনলোড করুন (.pdf)'}
                  </span>
                </button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    id="download-csv-btn"
                    onClick={handleDownloadCSV}
                    disabled={isProcessing}
                    className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition text-xs font-bold"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>CSV ফাইল ডাউনলোড (Excel)</span>
                  </button>

                  <button
                    id="print-sheet-btn"
                    onClick={handlePrint}
                    disabled={isProcessing}
                    className="flex items-center justify-center gap-2 p-3.5 rounded-xl border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 transition text-xs font-bold"
                  >
                    <Printer className="w-4 h-4 text-gray-600" />
                    <span>ব্রাউজার প্রিন্ট প্রিভিউ</span>
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
                📌 <strong>টিপ:</strong> &quot;সরাসরি PDF ফাইল ডাউনলোড করুন&quot; বাটনে চাপ দিলে কোনো প্রিন্ট ডায়ালগের ঝামেলা ছাড়াই একটি পরিচ্ছন্ন A4 সাইজের অফিসিয়াল রিপোর্ট সরাসরি আপনার ফোনে/ডেস্কটপে সেভ হবে।
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>ডিভাইস স্টোরেজ: সুরক্ষিত ✓</span>
          <button
            id="close-backup-footer-btn"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-[#131722] font-semibold transition"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
