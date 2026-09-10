import React, { useState, useRef } from 'react';
import { Plus, Trash2, Edit2, Check, X, Search } from 'lucide-react';
import { formatTaka, uid } from '../services/storage';
import { AdvanceEntry } from '../types';

interface AdvanceCardProps {
  entries: AdvanceEntry[];
  onAdd: (entry: AdvanceEntry) => void;
  onUpdate: (id: string, updated: Partial<AdvanceEntry>) => void;
  onDelete: (id: string) => void;
}

export const AdvanceCard: React.FC<AdvanceCardProps> = ({ entries, onAdd, onUpdate, onDelete }) => {
  const [name, setName] = useState('');
  const [detail, setDetail] = useState('');
  const [amount, setAmount] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDetail, setEditDetail] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [hasError, setHasError] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const total = entries.reduce((s, a) => s + Number(a.amount || 0), 0);

  const handleAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = name.trim();
    const cleanAmount = parseFloat(amount);

    if (!cleanName || !isFinite(cleanAmount) || cleanAmount <= 0) {
      setHasError(true);
      setTimeout(() => setHasError(false), 1200);
      return;
    }

    onAdd({
      id: uid(),
      name: cleanName,
      detail: detail.trim() || undefined,
      amount: cleanAmount,
      date: new Date().toISOString(),
    });

    setName('');
    setDetail('');
    setAmount('');
    nameInputRef.current?.focus();
    listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startEdit = (entry: AdvanceEntry) => {
    setEditingId(entry.id);
    setEditName(entry.name);
    setEditDetail(entry.detail || '');
    setEditAmount(entry.amount.toString());
  };

  const saveEdit = () => {
    if (!editingId) return;
    const cleanName = editName.trim();
    const cleanAmount = parseFloat(editAmount);
    if (!cleanName || !isFinite(cleanAmount) || cleanAmount <= 0) return;

    onUpdate(editingId, {
      name: cleanName,
      detail: editDetail.trim() || undefined,
      amount: cleanAmount,
    });
    setEditingId(null);
  };

  const filteredEntries = entries.filter((e) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return e.name.toLowerCase().includes(q) || (e.detail && e.detail.toLowerCase().includes(q));
  });

  return (
    <div
      id="advance-card"
      className="bg-white border border-[#e4e7ec] rounded-2xl p-4 sm:p-5 border-t-3 border-t-[#3151e0] shadow-xs flex flex-col h-full text-left"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-bold text-[#131722]">অগ্রিম</h2>
          <span className="text-xs text-gray-400 font-normal">({entries.length})</span>
        </div>
        <span
          id="adv-total-pill"
          className="text-xs font-bold font-mono px-2.5 py-1 rounded-full bg-[#eaefff] text-[#3151e0] tabular-nums"
        >
          {formatTaka(total)}
        </span>
      </div>

      {/* Add Form */}
      <p className="text-[11.5px] font-semibold text-[#98a2b3] mb-2 uppercase tracking-wide">
        নতুন অগ্রিম যোগ করো
      </p>
      <form
        onSubmit={handleAdd}
        className={`flex flex-col gap-2 p-3 bg-[#fafbfc] border rounded-xl mb-4 transition-colors ${
          hasError ? 'border-[#e0623f] bg-red-50/20' : 'border-[#e4e7ec]'
        }`}
      >
        <input
          id="adv-name-input"
          ref={nameInputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="কাস্টমারের নাম *"
          className="text-xs sm:text-[13px] px-3 py-2 border border-[#e4e7ec] rounded-lg bg-white focus:border-[#3151e0] focus:outline-hidden"
        />

        <div className="flex gap-2">
          <input
            id="adv-detail-input"
            type="text"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="বিস্তারিত (ঐচ্ছিক)"
            className="flex-1 text-xs sm:text-[13px] px-3 py-2 border border-[#e4e7ec] rounded-lg bg-white focus:border-[#3151e0] focus:outline-hidden"
          />
          <input
            id="adv-amount-input"
            type="number"
            min="1"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="টাকা *"
            className="w-24 sm:w-28 text-xs sm:text-[13px] px-3 py-2 border border-[#e4e7ec] rounded-lg bg-white focus:border-[#3151e0] focus:outline-hidden font-mono"
          />
        </div>

        <button
          id="adv-add-submit-btn"
          type="submit"
          className="mt-1 w-full py-2 px-3 text-xs font-semibold bg-[#3151e0] text-white rounded-lg hover:bg-[#2540b8] transition active:scale-98 flex items-center justify-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>অগ্রিম যোগ করো</span>
        </button>
      </form>

      {/* Entry List Header */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11.5px] font-semibold text-[#98a2b3] uppercase tracking-wide">
          সব অগ্রিমের তালিকা
        </p>
        {entries.length > 3 && (
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="খুঁজুন..."
              className="text-[11px] pl-6 pr-2 py-1 rounded-md border border-gray-200 w-28 sm:w-36 focus:outline-hidden focus:border-[#3151e0]"
            />
            <Search className="w-3 h-3 text-gray-400 absolute left-2 top-2" />
          </div>
        )}
      </div>

      {/* Entry Rows */}
      <div
        ref={listRef}
        id="advance-entries-list"
        className="flex-1 overflow-y-auto max-h-[380px] divide-y divide-[#e4e7ec] smooth-scroll"
      >
        {entries.length === 0 ? (
          <div className="text-center py-7 text-xs text-[#98a2b3] border border-dashed border-[#e4e7ec] rounded-xl my-2">
            এখনো কোনো অগ্রিম যোগ করা হয়নি
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="text-center py-5 text-xs text-gray-400">
            কোনো অগ্রিম খুঁজে পাওয়া যায়নি
          </div>
        ) : (
          filteredEntries.map((a) => (
            <div key={a.id} className="py-2.5 flex items-center gap-2 group text-xs sm:text-[13px]">
              {editingId === a.id ? (
                <div className="flex-1 flex flex-col gap-1.5 p-2 bg-blue-50/50 rounded-lg border border-blue-200">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="px-2 py-1 bg-white border border-gray-300 rounded text-xs"
                    placeholder="নাম"
                  />
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={editDetail}
                      onChange={(e) => setEditDetail(e.target.value)}
                      className="flex-1 px-2 py-1 bg-white border border-gray-300 rounded text-xs"
                      placeholder="বিস্তারিত"
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
                      className="px-2 py-0.5 rounded bg-[#3151e0] text-white text-[11px] font-semibold flex items-center gap-1"
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
                    <div className="font-semibold text-[#131722] truncate">{a.name}</div>
                    {a.detail && (
                      <div className="text-[11px] text-[#98a2b3] truncate">{a.detail}</div>
                    )}
                  </div>

                  <span className="font-bold text-[#131722] font-mono tabular-nums shrink-0">
                    {formatTaka(a.amount)}
                  </span>

                  <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => startEdit(a)}
                      title="সম্পাদনা করুন"
                      className="p-1 text-gray-400 hover:text-[#3151e0] hover:bg-gray-100 rounded transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(a.id)}
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
