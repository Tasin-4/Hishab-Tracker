import React from 'react';
import { formatTaka, formatMonthLabel } from '../services/storage';
import { AppSettings, MonthData } from '../types';

interface BalanceCardProps {
  currentMonth: string;
  data: MonthData;
  settings: AppSettings;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({ currentMonth, data, settings }) => {
  const totalAdv = data.advances.reduce((s, a) => s + Number(a.amount || 0), 0);
  const totalCost = data.costs.reduce((s, c) => s + Number(c.amount || 0), 0);
  const balance = totalAdv - totalCost;

  let whoText = 'হিসাব সমান';
  let whoClass = 'bg-[#3a3f4d] text-[#c6cad6]';

  if (balance > 0) {
    whoText = `${settings.uncleName} পাবে`;
    whoClass = 'bg-[#e0623f] text-white';
  } else if (balance < 0) {
    whoText = `${settings.myName} পাবে`;
    whoClass = 'bg-[#0f9d74] text-white';
  }

  return (
    <div
      id="monthly-balance-card"
      className="bg-[#131722] text-white rounded-2xl p-5 sm:p-6 mb-5 relative overflow-hidden shadow-lg border border-[#22293d]"
    >
      {/* Background glow accent */}
      <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#3151e0]/15 rounded-full blur-3xl pointer-events-none" />

      <p className="text-xs sm:text-[13px] text-[#a9afc0] font-medium mb-1.5">
        {formatMonthLabel(currentMonth)} মাসের ব্যালেন্স
      </p>

      <div className="flex items-baseline gap-3 flex-wrap">
        <span
          id="balance-amount-display"
          className="text-3xl sm:text-4xl font-bold font-mono tracking-tight tabular-nums"
        >
          {formatTaka(Math.abs(balance))}
        </span>
        <span
          id="balance-who-badge"
          className={`text-xs sm:text-sm font-semibold px-3 py-1 rounded-full transition-all duration-200 ${whoClass}`}
        >
          {whoText}
        </span>
      </div>

      <div className="flex gap-6 sm:gap-10 mt-4 pt-4 border-t border-[#2c3040] flex-wrap">
        <div className="stat">
          <div className="text-[11.5px] text-[#8f95a6] mb-0.5">মোট অগ্রিম</div>
          <div id="sum-advance-display" className="text-sm sm:text-base font-semibold text-[#688bf5] tabular-nums">
            {formatTaka(totalAdv)}
          </div>
        </div>

        <div className="stat">
          <div className="text-[11.5px] text-[#8f95a6] mb-0.5">মোট খরচ</div>
          <div id="sum-cost-display" className="text-sm sm:text-base font-semibold text-[#f88f72] tabular-nums">
            {formatTaka(totalCost)}
          </div>
        </div>

        <div className="stat">
          <div className="text-[11.5px] text-[#8f95a6] mb-0.5">মোট এন্ট্রি</div>
          <div className="text-sm sm:text-base font-semibold text-gray-300 tabular-nums">
            {data.advances.length + data.costs.length} টি
          </div>
        </div>
      </div>
    </div>
  );
};
