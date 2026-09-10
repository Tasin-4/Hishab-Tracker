import React, { useState } from 'react';
import { Settings, X, Save, AlertTriangle, Trash2, Flame } from 'lucide-react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
  onDeleteCurrentMonth: () => void;
  currentMonthLabel: string;
  onOpenResetModal?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  onDeleteCurrentMonth,
  currentMonthLabel,
  onOpenResetModal,
}) => {
  const [uncleName, setUncleName] = useState(settings.uncleName);
  const [myName, setMyName] = useState(settings.myName);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...settings,
      uncleName: uncleName.trim() || 'নিলয় আঙ্কেল',
      myName: myName.trim() || 'আমি',
    });
    onClose();
  };

  return (
    <div
      id="settings-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 text-left"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-[#131722] text-white shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">সেটিংস</h3>
              <p className="text-xs text-gray-300">নাম ও হিসাবের বিবরণ পরিবর্তন</p>
            </div>
          </div>
          <button
            id="close-settings-modal-btn"
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs overflow-y-auto smooth-scroll flex-1">
          <div>
            <label className="block font-semibold text-[#131722] mb-1">
              প্রথম পক্ষের নাম (অগ্রিম ব্যালেন্সের সময় কে পাবে)
            </label>
            <input
              id="settings-uncle-name-input"
              type="text"
              value={uncleName}
              onChange={(e) => setUncleName(e.target.value)}
              placeholder="যেমন: নিলয় আঙ্কেল"
              className="w-full text-xs px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:border-[#3151e0] focus:outline-hidden"
            />
            <span className="text-[11px] text-gray-400 mt-0.5 block">
              ডিফল্ট: &quot;নিলয় আঙ্কেল পাবে&quot;
            </span>
          </div>

          <div>
            <label className="block font-semibold text-[#131722] mb-1">
              দ্বিতীয় পক্ষের নাম (খরচ বেশি হলে কে পাবে)
            </label>
            <input
              id="settings-my-name-input"
              type="text"
              value={myName}
              onChange={(e) => setMyName(e.target.value)}
              placeholder="যেমন: আমি"
              className="w-full text-xs px-3 py-2 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:border-[#3151e0] focus:outline-hidden"
            />
            <span className="text-[11px] text-gray-400 mt-0.5 block">
              ডিফল্ট: &quot;আমি পাবে&quot;
            </span>
          </div>

          {/* DANGER ZONE */}
          <div className="pt-3 border-t-2 border-red-200 space-y-3">
            <div className="flex items-center gap-1.5 text-red-600 font-bold text-xs uppercase tracking-wide">
              <Flame className="w-3.5 h-3.5 text-red-500" />
              <span>⚠️ বিপদজনক অঞ্চল (Danger Zone)</span>
            </div>

            <div className="p-3 bg-red-50/80 rounded-xl border border-red-200 space-y-2.5">
              <div>
                <span className="font-semibold text-red-950 block">১. বর্তমান মাস মুছে ফেলা</span>
                <p className="text-[11px] text-gray-600 leading-relaxed mt-0.5">
                  বর্তমান {currentMonthLabel} মাসের তালিকা ও যাবতীয় এন্ট্রি পুরোপুরি মুছে ফেলতে পারেন।
                </p>
              </div>
              <button
                id="delete-current-month-btn"
                type="button"
                onClick={onDeleteCurrentMonth}
                className="w-full py-2 px-3 rounded-lg border border-red-300 bg-white text-red-600 hover:bg-red-50 font-bold text-xs transition active:scale-98 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{currentMonthLabel} মাসটি পুরোপুরি মুছুন</span>
              </button>

              {onOpenResetModal && (
                <div className="pt-2 border-t border-red-200/80">
                  <span className="font-semibold text-red-950 block">২. হিসাব রিসেট / ফ্যাক্টরি রিসেট</span>
                  <p className="text-[11px] text-gray-600 leading-relaxed mt-0.5">
                    চলতি মাসের হিসাব শূন্য করা অথবা অ্যাপের সব তথ্য মুছে নতুন করে শুরু করতে চান?
                  </p>
                  <button
                    id="open-reset-modal-from-settings-btn"
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenResetModal();
                    }}
                    className="w-full mt-2 py-2 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition active:scale-98 flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-200" />
                    <span>ডেটা রিসেট মেনু খুলুন (Danger)</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold transition"
            >
              বাতিল
            </button>
            <button
              id="save-settings-submit-btn"
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#3151e0] hover:bg-[#2540b8] text-white font-semibold flex items-center gap-1.5 transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>সেভ করুন</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
