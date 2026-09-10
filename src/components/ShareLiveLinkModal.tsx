import React, { useState } from 'react';
import { Share2, Copy, Check, ExternalLink, Globe, Smartphone, X, Zap } from 'lucide-react';

interface ShareLiveLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareLiveLinkModal: React.FC<ShareLiveLinkModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  // Live URL provided in environment / metadata
  const liveUrl = 'https://ais-pre-hvgi3hyp2aoj46mma5ge4k-37270771607.asia-southeast1.run.app';

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(liveUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = liveUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div
      id="share-live-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden text-left animate-in fade-in zoom-in-95 duration-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-[#131722] text-white">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#3151e0] flex items-center justify-center text-white">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">ফ্রি লাইভ লিংক ও মোবাইল শেয়ার</h3>
              <p className="text-xs text-gray-300">যেকোনো সময় যেকোনো ডিভাইস থেকে ব্যবহারের লিংক</p>
            </div>
          </div>
          <button
            id="close-share-modal-btn"
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="bg-[#eaefff] p-3.5 rounded-xl border border-[#3151e0]/20 text-[#131722] space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-[#3151e0] text-xs">
              <Zap className="w-4 h-4 fill-current" />
              <span>সার্বক্ষণিক সচল (100% Free & Always Active)</span>
            </div>
            <p className="text-[12px] text-[#475467] leading-relaxed">
              এই লিংকটি গুগল ক্লাউডে হোস্ট করা এবং সম্পূর্ণ ফ্রি। আপনি এই লিংকটি ফোনে ওপেন করে সরাসরি ব্যবহার করতে পারবেন।
            </p>
          </div>

          <div>
            <label className="block font-semibold text-[#131722] mb-1">
              অ্যাপের সরাসরি লাইভ লিংক:
            </label>
            <div className="flex items-center gap-2">
              <input
                id="live-link-input-display"
                type="text"
                readOnly
                value={liveUrl}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-[11px] font-mono text-gray-700 select-all focus:outline-hidden"
              />
              <button
                id="copy-live-link-btn"
                onClick={handleCopy}
                className="px-3.5 py-2.5 rounded-xl bg-[#3151e0] text-white font-semibold hover:bg-[#2540b8] transition flex items-center gap-1.5 active:scale-95 shrink-0"
              >
                {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'কপি হয়েছে' : 'কপি করুন'}</span>
              </button>
            </div>
          </div>

          <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-2">
            <div className="font-bold text-[#131722] flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-[#3151e0]" />
              <span>ফোনে কীভাবে অ্যাপের মতো সেট করবেন?</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-gray-600 text-[11px] leading-relaxed">
              <li>
                কপি করা লিংকটি আপনার ফোনের <strong>Chrome</strong> বা <strong>Safari</strong> ব্রাউজারে ওপেন করুন।
              </li>
              <li>
                ব্রাউজার মেনু থেকে <strong>&quot;Add to Home Screen&quot;</strong> অথবা <strong>&quot;Install App&quot;</strong> এ চাপ দিন।
              </li>
              <li>
                ফোনের ডিসপ্লেতে অ্যাপের আইকন যুক্ত হয়ে যাবে। এরপর যেকোনো সময় ক্লিক করলেই সরাসরি ওপেন হবে।
              </li>
            </ol>
          </div>
        </div>

        <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            id="close-share-footer-btn"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#131722] text-white text-xs font-semibold hover:bg-black transition"
          >
            ঠিক আছে
          </button>
        </div>
      </div>
    </div>
  );
};
