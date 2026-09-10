import React, { useState } from 'react';
import {
  AlertTriangle,
  Flame,
  X,
  RotateCcw,
  Trash2,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react';
import { formatMonthLabel } from '../services/storage';
import { MonthData } from '../types';

interface ResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMonth: string;
  currentMonthData: MonthData;
  totalMonthsCount: number;
  onResetCurrentMonth: () => Promise<void>;
  onFactoryResetAll: () => Promise<void>;
}

export const ResetModal: React.FC<ResetModalProps> = ({
  isOpen,
  onClose,
  currentMonth,
  currentMonthData,
  totalMonthsCount,
  onResetCurrentMonth,
  onFactoryResetAll,
}) => {
  const [confirmMode, setConfirmMode] = useState<'none' | 'month' | 'factory'>('none');
  const [isProcessing, setIsProcessing] = useState(false);
  const [typedConfirm, setTypedConfirm] = useState('');

  if (!isOpen) return null;

  const monthLabel = formatMonthLabel(currentMonth);
  const currentEntriesCount =
    (currentMonthData.advances?.length || 0) + (currentMonthData.costs?.length || 0);

  const handleExecuteMonthReset = async () => {
    setIsProcessing(true);
    try {
      await onResetCurrentMonth();
      setConfirmMode('none');
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteFactoryReset = async () => {
    setIsProcessing(true);
    try {
      await onFactoryResetAll();
      setConfirmMode('none');
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      id="reset-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-4 text-left"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border-2 border-red-500/40 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Danger Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-red-600 to-rose-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white shrink-0 animate-pulse">
              <AlertTriangle className="w-5 h-5 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold leading-tight">ডেটা রিসেট অপশন</h3>
                <span className="text-[10px] font-black uppercase tracking-wider bg-red-950/60 text-red-200 px-2 py-0.5 rounded-full border border-red-400/40 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-red-300" />
                  DANGER ZONE
                </span>
              </div>
              <p className="text-xs text-red-100">হিসাব মুছে ফেলা ও নতুন করে শুরু করার কন্ট্রোল</p>
            </div>
          </div>
          <button
            id="close-reset-modal-btn"
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-full text-red-100 hover:text-white hover:bg-white/15 transition disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs text-[#131722]">
          {/* Main Warning Banner */}
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-900">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-[12px] leading-relaxed">
              <strong className="font-bold block text-red-950">
                ⚠️ সতর্কবার্তা (Data Loss Warning):
              </strong>
              রিসেট করলে উল্লেখিত হিসাবগুলো স্থায়ীভাবে মুছে যাবে। প্রয়োজন হলে রিসেটের আগে <strong>&quot;ব্যাকআপ ফাইল&quot;</strong> ডাউনলোড করে সংরক্ষণ রাখুন।
            </div>
          </div>

          {/* If NOT in a confirmation sub-step, show the two choices */}
          {confirmMode === 'none' && (
            <div className="space-y-3.5">
              {/* Option 1: Reset Current Month Only */}
              <div className="p-4 rounded-xl border-2 border-amber-300/80 bg-amber-50/40 hover:bg-amber-50 transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-amber-950 text-sm">
                      <RotateCcw className="w-4 h-4 text-amber-700" />
                      <span>১. বর্তমান মাস রিসেট ({monthLabel})</span>
                    </div>
                    <p className="text-[11.5px] text-gray-600 leading-relaxed">
                      শুধুমাত্র <strong>{monthLabel}</strong> মাসের যাবতীয় অগ্রিম ও খরচের এন্ট্রি (মোট {currentEntriesCount} টি) মুছে শূন্য করে দেবে। অন্য সব মাসের হিসাব অক্ষত থাকবে।
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-amber-200 flex justify-end">
                  <button
                    id="trigger-month-reset-btn"
                    type="button"
                    onClick={() => setConfirmMode('month')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>শুধুমাত্র {monthLabel} রিসেট করুন</span>
                  </button>
                </div>
              </div>

              {/* Option 2: Full Factory Reset */}
              <div className="p-4 rounded-xl border-2 border-red-400/80 bg-red-50/40 hover:bg-red-50 transition">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-red-950 text-sm">
                      <Flame className="w-4 h-4 text-red-600" />
                      <span>২. সম্পূর্ণ ফ্যাক্টরি রিসেট (All Data Wipe)</span>
                    </div>
                    <p className="text-[11.5px] text-gray-600 leading-relaxed">
                      অ্যাপের <strong>সকল {totalMonthsCount}টি মাসের হিসাব</strong>, সকল এন্ট্রি এবং সেটিংস মুছে সম্পূর্ণ নতুন অবস্থায় ফিরে যাবে।
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-red-200 flex items-center justify-between">
                  <span className="text-[11px] text-red-700 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                    সব ডেটা মুছে যাবে
                  </span>
                  <button
                    id="trigger-factory-reset-btn"
                    type="button"
                    onClick={() => {
                      setTypedConfirm('');
                      setConfirmMode('factory');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>সম্পূর্ণ অ্যাপ রিসেট করুন</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sub-step 1: Confirm Month Reset */}
          {confirmMode === 'month' && (
            <div className="p-4 rounded-xl border-2 border-amber-500 bg-amber-50/80 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <span>আপনি কি নিশ্চিত {monthLabel} মাসের হিসাব রিসেট করতে চান?</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                এই মাসের মোট <strong>{currentEntriesCount} টি এন্ট্রি</strong> মুছে যাবে এবং ব্যালেন্স শূন্য হয়ে যাবে।
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200">
                <button
                  type="button"
                  onClick={() => setConfirmMode('none')}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-xl bg-white border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
                >
                  না, ফিরে যান
                </button>
                <button
                  id="confirm-month-reset-btn"
                  type="button"
                  onClick={handleExecuteMonthReset}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isProcessing ? 'রিসেট হচ্ছে...' : 'হ্যাঁ, এই মাস রিসেট করুন'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Sub-step 2: Confirm Factory Reset */}
          {confirmMode === 'factory' && (
            <div className="p-4 rounded-xl border-2 border-red-600 bg-red-50 space-y-3.5 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-red-950 font-bold text-sm">
                <Flame className="w-5 h-5 text-red-600 shrink-0" />
                <span>🚨 চরম সতর্কতা: সম্পূর্ণ অ্যাপ মুছে ফেলা হবে</span>
              </div>
              <p className="text-xs text-red-900 leading-relaxed">
                আপনার সেভ করা <strong>{totalMonthsCount} টি মাসের সকল হিসাব</strong> চিরতরে মুছে যাবে।
                (নিরাপত্তার সুবিধার্থে ব্যাকগ্রাউন্ডে একটি সেফটি স্ন্যাপশট রাখা হবে)।
              </p>

              <div>
                <label className="block text-[11px] font-bold text-red-950 mb-1">
                  নিশ্চিত করতে নিচের ঘরে <span className="underline font-mono text-red-700">RESET</span> লিখুন:
                </label>
                <input
                  id="factory-reset-confirm-input"
                  type="text"
                  value={typedConfirm}
                  onChange={(e) => setTypedConfirm(e.target.value)}
                  placeholder="RESET"
                  className="w-full px-3 py-2 text-xs border-2 border-red-300 rounded-xl bg-white font-mono uppercase focus:border-red-600 focus:outline-hidden"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-red-200">
                <button
                  type="button"
                  onClick={() => setConfirmMode('none')}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-xl bg-white border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
                >
                  বাতিল করুন
                </button>
                <button
                  id="confirm-factory-reset-btn"
                  type="button"
                  onClick={handleExecuteFactoryReset}
                  disabled={isProcessing || typedConfirm.trim().toUpperCase() !== 'RESET'}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isProcessing ? 'মুছে ফেলা হচ্ছে...' : 'সব হিসাব মুছে রিসেট করুন'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            <span>অটো-স্ন্যাপশট ব্যাকআপ কার্যকর আছে</span>
          </span>
          <button
            onClick={onClose}
            className="font-semibold text-gray-600 hover:text-gray-900 transition"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
