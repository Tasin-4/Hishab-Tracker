import React, { useState } from 'react';
import { Smartphone, Download, CheckCircle, Share2, HelpCircle, X, ExternalLink } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  return (
    <>
      {isInstalled ? (
        <div
          id="pwa-installed-badge"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[#0f9d74]/10 text-[#0f9d74] border border-[#0f9d74]/20"
          title="অ্যাপটি সফলভাবে ইনস্টল করা আছে"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>ইনস্টল করা অ্যাপ</span>
        </div>
      ) : isInstallable ? (
        <button
          id="pwa-direct-install-btn"
          onClick={install}
          type="button"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#3151e0] text-white hover:bg-[#2540b8] shadow-sm transition active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>ফোনে ইনস্টল করুন</span>
        </button>
      ) : (
        <button
          id="pwa-guide-btn"
          onClick={() => setShowGuide(true)}
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white text-[#131722] border border-[#e4e7ec] hover:border-[#c9cfda] transition active:scale-95"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#3151e0]" />
          <span>হোম স্ক্রিনে রাখুন</span>
        </button>
      )}

      {showGuide && (
        <div
          id="pwa-install-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowGuide(false);
          }}
        >
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#eaefff] text-[#3151e0] flex items-center justify-center font-bold">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#131722]">ফোনে অ্যাপ হিসেবে যুক্ত করুন</h3>
                  <p className="text-xs text-[#667085]">Add to Home Screen / Desktop নির্দেশিকা</p>
                </div>
              </div>
              <button
                id="close-pwa-guide-btn"
                onClick={() => setShowGuide(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-sm text-[#131722]">
              {isIOS ? (
                <div className="space-y-3 bg-[#f8f9fc] p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 text-[#3151e0] font-semibold text-xs uppercase tracking-wide">
                    <span>আইফোন / আইপ্যাড (Safari)</span>
                  </div>
                  <ol className="space-y-2 text-xs text-[#344054] list-decimal list-inside leading-relaxed">
                    <li>
                      Safari ব্রাউজারের নিচে থাকা <span className="font-semibold text-[#131722] bg-white px-1.5 py-0.5 rounded border border-gray-200">শেয়ার (Share)</span> বাটনে ট্যাপ করুন।
                    </li>
                    <li>
                      তালিকায় নিচে স্ক্রোল করে <span className="font-semibold text-[#131722] bg-white px-1.5 py-0.5 rounded border border-gray-200">Add to Home Screen</span> অপশনটিতে চাপ দিন।
                    </li>
                    <li>
                      উপরে ডানপাশে <span className="font-semibold text-[#3151e0]">Add</span> চাপলেই ফোনের ডিসপ্লেতে অ্যাপ চলে আসবে!
                    </li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-3 bg-[#f8f9fc] p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 text-[#3151e0] font-semibold text-xs uppercase tracking-wide">
                    <span>অ্যান্ড্রয়েড ফোন (Chrome ব্রাউজার)</span>
                  </div>
                  <ol className="space-y-2 text-xs text-[#344054] list-decimal list-inside leading-relaxed">
                    <li>
                      ব্রাউজারের উপরের ডানদিকের <span className="font-semibold text-[#131722] bg-white px-1.5 py-0.5 rounded border border-gray-200">তিনটি ডট (⋮)</span> মেনুতে চাপ দিন।
                    </li>
                    <li>
                      <span className="font-semibold text-[#131722] bg-white px-1.5 py-0.5 rounded border border-gray-200">Install app</span> অথবা <span className="font-semibold text-[#131722] bg-white px-1.5 py-0.5 rounded border border-gray-200">Add to Home screen</span> অপশনে ক্লিক করুন।
                    </li>
                    <li>
                      <span className="font-semibold text-[#3151e0]">Install</span> বাটনে চাপ দিন। আপনার ফোনের মেন্যুতে আসল অ্যাপের মতো সেভ হয়ে যাবে।
                    </li>
                  </ol>
                </div>
              )}

              <div className="bg-[#e6f7f1] p-3 rounded-xl border border-[#b2e5d5] text-xs text-[#0a6349] leading-relaxed">
                <span className="font-semibold">অফলাইনেও চলবে:</span> ফোনে হোম স্ক্রিনে যুক্ত করার পর ইন্টারনেট না থাকলেও অ্যাপটি সবসময় তাৎক্ষণিক ওপেন হবে এবং সব হিসাব ঠিক থাকবে।
              </div>
            </div>

            <button
              id="pwa-guide-confirm-btn"
              onClick={() => setShowGuide(false)}
              className="w-full py-2.5 rounded-xl bg-[#131722] text-white text-xs font-semibold hover:bg-black transition"
            >
              বুঝেছি, বন্ধ করুন
            </button>
          </div>
        </div>
      )}
    </>
  );
};
