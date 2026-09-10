import React, { useState, useRef } from 'react';
import { Plus, Trash2, Edit2, Check, X, Search } from 'lucide-react';
import { formatTaka, uid } from '../services/storage';
import { CostEntry } from '../types';

interface CostCardProps {
  entries: CostEntry[];
  onAdd: (entry: CostEntry) => void;
  onUpdate: (id: string, updated: Partial<CostEntry>) => void;
  onDelete: (id: string) => void;
}

export const CostCard: React.FC<CostCardProps> = ({ entries, onAdd, onUpdate, onDelete }) => {
  const [detail, setDetail] = useState('');
  const [amount, setAmount] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDetail, setEditDetail] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [hasError, setHasError] = useState(false);

  const detailInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const total = entries.reduce((s, c) => s + Number(c.amount || 0), 0);

  const handleAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanDetail = detail.trim();
    const cleanAmount = parseFloat(amount);

    if (!cleanDetail || !isFinite(cleanAmount) || cleanAmount <= 0) {
      setHasError(true);
      setTimeout(() => setHasError(false), 1200);
      return;
    }

    onAdd({
      id: uid(),
      detail: cleanDetail,
      amount: cleanAmount,
      date: new Date().toISOString(),
    });

    setDetail('');
    setAmount('');
    detailInputRef.current?.focus();
    listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startEdit = (entry: CostEntry) => {
    setEditingId(entry.id);
    setEditDetail(entry.detail);
    setEditAmount(entry.amount.toString());
  };

  const saveEdit = () => {
    if (!editingId) return;
    const cleanDetail = editDetail.trim();
    const cleanAmount = parseFloat(editAmount);
    if (!cleanDetail || !isFinite(cleanAmount) || cleanAmount <= 0) return;

    onUpdate(editingId, {
      detail: cleanDetail,
      amount: cleanAmount,
    });
    setEditingId(null);
  };

  const filteredEntries = entries.filter((e) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return e.detail.toLowerCase().includes(q);
  });

  return (
    <div
      id="cost-card"
      className="bg-white border border-[#e4e7ec] rounded-2xl p-4 sm:p-5 border-t-3 border-t-[#e0623f] shadow-xs flex flex-col h-full text-left"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-[#131722]">বাড়তি খরচ</h2>
          <span className="text-xs text-gray-400 font-normal">({entries.length})</span>
        </div>
        <span
          id="cost-total-pill"
          className="text-xs font-bold font-mono px-2.5 py-1 rounded-full bg-[#fdeee9] text-[#e0623f] tabular-nums"
        >
          {formatTaka(total)}
        </span>
      </div>

      {/* Add Form */}
      <p className="text-[11.5px] font-semibold text-[#98a2b3] mb-2 uppercase tracking-wide">
        নতুন খরচ যোগ করো
      </p>
      <form
        onSubmit={handleAdd}
        className={`flex flex-col gap-2 p-3 bg-[#fafbfc] border rounded-xl mb-4 transition-colors ${
          hasError ? 'border-[#e0623f] bg-red-50/20' : 'border-[#e4e7ec]'
        }`}
      >
        <div className="flex gap-2">
          <input
            id="cost-detail-input"
            ref={detailInputRef}
            type="text"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="খরচের বিবরণ *"
            className="flex-1 text-xs sm:text-[13px] px-3 py-2 border border-[#e4e7ec] rounded-lg bg-white focus:border-[#e0623f] focus:outline-hidden"
          />
          <input
            id="cost-amount-input"
            type="number"
            min="1"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="টাকা *"
            className="w-24 sm:w-28 text-xs sm:text-[13px] px-3 py-2 border border-[#e4e7ec] rounded-lg bg-white focus:border-[#e0623f] focus:outline-hidden font-mono"
          />
        </div>

        <button
          id="cost-add-submit-btn"
          type="submit"
          className="mt-1 w-full py-2 px-3 text-xs font-semibold bg-[#e0623f] text-white rounded-lg hover:bg-[#c34f31] transition active:scale-98 flex items-center justify-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>খরচ যোগ করো</span>
        </button>
      </form>

      {/* Entry List Header */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11.5px] font-semibold text-[#98a2b3] uppercase tracking-wide">
          সব খরচের তালিকা
        </p>
        {entries.length > 3 && (
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="খুঁজুন..."
              className="text-[11px] pl-6 pr-2 py-1 rounded-md border border-gray-200 w-28 sm:w-36 focus:outline-hidden focus:border-[#e0623f]"
            />
            <Search className="w-3 h-3 text-gray-400 absolute left-2 top-2" />
          </div>
        )}
      </div>

      {/* Entry Rows */}
      <div
        ref={listRef}
        id="cost-entries-list"
        className="flex-1 overflow-y-auto max-h-[380px] divide-y divide-[#e4e7ec] smooth-scroll"
      >
        {entries.length === 0 ? (
          <div className="text-center py-7 text-xs text-[#98a2b3] border border-dashed border-[#e4e7ec] rounded-xl my-2">
            এখনো কোনো খরচ যোগ করা হয়নি
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-5 text-xs text-gray-400">
            কোনো খরচ খুঁজে পাওয়া যায়নি
          </div>
        ) : (
          filteredEntries.map((c) => (
            <div key={c.id} className="py-2.5 flex items-center gap-2 group text-xs sm:text-[13px]">
              {editingId === c.id ? (
                <div className="flex-1 flex flex-col gap-1.5 p-2 bg-orange-50/50 rounded-lg border border-orange-200">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={editDetail}
                      onChange={(e) => setEditDetail(e.target.value)}
                      className="flex-1 px-2 py-1 bg-white border border-gray-300 rounded text-xs"
                      placeholder="খরচের বিবরণ"
                    />
                    <input
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      className="w-20 px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono"
                      placeholder="টাকা"
                    />
                  </div>
                  <div className="flex justify-end gap-1.5 mt-1">
                    <button
                      onClick={saveEdit}
                      className="px-2 py-0.5 rounded bg-[#e0623f] text-white text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> সেভ
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-2 py-0.5 rounded bg-gray-200 text-gray-700 text-[11px]"
                    >
                      বাতিল
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="font-semibold text-[#131722] truncate">{c.detail}</div>
                  </div>

                  <span className="font-bold text-[#131722] font-mono tabular-nums shrink-0">
                    {formatTaka(c.amount)}
                  </span>

                  <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => startEdit(c)}
                      title="সম্পাদনা করুন"
                      className="p-1 text-gray-400 hover:text-[#e0623f] hover:bg-gray-100 rounded transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(c.id)}
                      title="মুছে ফেলো"
                      className="p-1 text-gray-400 hover:text-[#e0623f] hover:bg-red-50 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
