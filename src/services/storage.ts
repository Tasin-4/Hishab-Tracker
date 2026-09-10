import { AppSettings, BackupBundle, BackupSnapshot, MonthData } from '../types';

const MONTHS_KEY = 'hishab_months_list';
const MONTH_PREFIX = 'hishab_month_';
const SETTINGS_KEY = 'hishab_settings';
const SNAPSHOTS_KEY = 'hishab_auto_snapshots';

export const DEFAULT_SETTINGS: AppSettings = {
  uncleName: 'নিলয় আঙ্কেল',
  myName: 'আমি',
  currencySymbol: '৳',
};

export const MONTH_NAMES_BN = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

export function formatMonthLabel(ym: string): string {
  if (!ym) return '';
  const [yearStr, monthStr] = ym.split('-');
  const y = Number(yearStr);
  const m = Number(monthStr);
  const name = MONTH_NAMES_BN[m - 1] || ym;
  return `${name} ${y}`;
}

export function formatTaka(amount: number): string {
  const v = Math.round(Number(amount) || 0);
  return `৳${v.toLocaleString('en-US')}`;
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ---------------- IndexedDB Persistence Mirror ----------------
const IDB_NAME = 'HishabTrackerDB';
const IDB_STORE = 'keyval';

function openIDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openIDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openIDB();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result as T || null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

// ---------------- Storage API ----------------
export async function getMonthsList(): Promise<string[]> {
  try {
    const raw = localStorage.getItem(MONTHS_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) {
        return Array.from(new Set(list)).sort().reverse();
      }
    }
    // Fallback to idb
    const idbList = await idbGet<string[]>(MONTHS_KEY);
    if (Array.isArray(idbList) && idbList.length > 0) {
      localStorage.setItem(MONTHS_KEY, JSON.stringify(idbList));
      return Array.from(new Set(idbList)).sort().reverse();
    }
  } catch (err) {
    console.warn('Failed to parse months list', err);
  }

  // Default to current year-month
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const defaultList = [ym];
  await saveMonthsList(defaultList);
  return defaultList;
}

export async function saveMonthsList(months: string[]): Promise<void> {
  const unique = Array.from(new Set(months)).sort().reverse();
  const json = JSON.stringify(unique);
  try {
    localStorage.setItem(MONTHS_KEY, json);
  } catch (e) {
    console.warn('LocalStorage save failed for months', e);
  }
  await idbSet(MONTHS_KEY, unique);
}

export async function getMonthData(ym: string): Promise<MonthData> {
  const key = MONTH_PREFIX + ym;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        advances: Array.isArray(parsed.advances) ? parsed.advances : [],
        costs: Array.isArray(parsed.costs) ? parsed.costs : [],
        note: parsed.note || '',
      };
    }
    // Check IDB
    const idbData = await idbGet<MonthData>(key);
    if (idbData) {
      localStorage.setItem(key, JSON.stringify(idbData));
      return {
        advances: Array.isArray(idbData.advances) ? idbData.advances : [],
        costs: Array.isArray(idbData.costs) ? idbData.costs : [],
        note: idbData.note || '',
      };
    }
  } catch (e) {
    console.warn(`Error loading month data for ${ym}`, e);
  }
  return { advances: [], costs: [] };
}

export async function saveMonthData(ym: string, data: MonthData): Promise<void> {
  const key = MONTH_PREFIX + ym;
  const safeData: MonthData = {
    advances: data.advances || [],
    costs: data.costs || [],
    note: data.note || '',
  };
  const json = JSON.stringify(safeData);
  try {
    localStorage.setItem(key, json);
  } catch (e) {
    console.warn(`LocalStorage save failed for month ${ym}`, e);
  }
  await idbSet(key, safeData);
}

export async function getAppSettings(): Promise<AppSettings> {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
    const idbSettings = await idbGet<AppSettings>(SETTINGS_KEY);
    if (idbSettings) {
      return { ...DEFAULT_SETTINGS, ...idbSettings };
    }
  } catch {}
  return DEFAULT_SETTINGS;
}

export async function saveAppSettings(settings: AppSettings): Promise<void> {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
  await idbSet(SETTINGS_KEY, settings);
}

// ---------------- Auto Snapshots ----------------
export async function createAutoSnapshot(months: string[], allData: Record<string, MonthData>): Promise<void> {
  try {
    let totalEntries = 0;
    Object.values(allData).forEach((md) => {
      totalEntries += (md.advances?.length || 0) + (md.costs?.length || 0);
    });

    const now = new Date();
    const snapshot: BackupSnapshot = {
      timestamp: now.toISOString(),
      label: `অটো-সেভ (${now.toLocaleDateString('bn-BD')} ${now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })})`,
      monthsCount: months.length,
      totalEntries,
      data: allData,
    };

    const existingSnapshots = getAutoSnapshots();
    // Keep max 10 snapshots to save local space
    const updated = [snapshot, ...existingSnapshots.slice(0, 9)];
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(updated));
    await idbSet(SNAPSHOTS_KEY, updated);
  } catch (e) {
    console.warn('Failed to record auto-snapshot', e);
  }
}

export function getAutoSnapshots(): BackupSnapshot[] {
  try {
    const raw = localStorage.getItem(SNAPSHOTS_KEY);
    if (raw) {
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list;
    }
  } catch {}
  return [];
}

// ---------------- Full Backup & Restore ----------------
export async function createBackupBundle(months: string[]): Promise<BackupBundle> {
  const settings = await getAppSettings();
  const data: Record<string, MonthData> = {};
  for (const ym of months) {
    data[ym] = await getMonthData(ym);
  }

  return {
    appName: 'Hishab Tracker',
    version: 2,
    exportedAt: new Date().toISOString(),
    months,
    settings,
    data,
  };
}

export function downloadJSONBackup(bundle: BackupBundle): void {
  const json = JSON.stringify(bundle, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `hishab-tracker-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function restoreBackupBundle(bundle: unknown): Promise<{ success: boolean; message: string; months: string[] }> {
  if (!bundle || typeof bundle !== 'object') {
    return { success: false, message: 'অবৈধ ফাইল ফরম্যাট', months: [] };
  }
  const b = bundle as Partial<BackupBundle>;
  if (!b.months || !Array.isArray(b.months) || !b.data || typeof b.data !== 'object') {
    return { success: false, message: 'ব্যাকআপ ফাইলে প্রয়োজনীয় ডেটা খুঁজে পাওয়া যায়নি', months: [] };
  }

  const validMonths = Array.from(new Set(b.months)).sort().reverse();
  await saveMonthsList(validMonths);

  for (const ym of validMonths) {
    const md = b.data[ym] || { advances: [], costs: [] };
    await saveMonthData(ym, {
      advances: Array.isArray(md.advances) ? md.advances : [],
      costs: Array.isArray(md.costs) ? md.costs : [],
      note: md.note || '',
    });
  }

  if (b.settings) {
    await saveAppSettings({ ...DEFAULT_SETTINGS, ...b.settings });
  }

  return {
    success: true,
    message: `সফলভাবে ${validMonths.length} টি মাসের ডেটা রিস্টোর করা হয়েছে!`,
    months: validMonths,
  };
}

export function generateCSV(ym: string, data: MonthData, settings: AppSettings): string {
  const rows: string[][] = [
    ['Hishab Tracker Monthly Report', formatMonthLabel(ym)],
    ['Generated At', new Date().toLocaleString('bn-BD')],
    [],
    ['অগ্রিম (Advances)'],
    ['ক্রমিক', 'কাস্টমারের নাম', 'বিস্তারিত বিবরণ', 'টাকা (BDT)'],
  ];

  let totalAdv = 0;
  data.advances.forEach((a, idx) => {
    totalAdv += a.amount;
    rows.push([(idx + 1).toString(), `"${(a.name || '').replace(/"/g, '""')}"`, `"${(a.detail || '').replace(/"/g, '""')}"`, a.amount.toString()]);
  });
  rows.push(['মোট অগ্রিম', '', '', totalAdv.toString()]);

  rows.push([]);
  rows.push(['বাড়তি খরচ (Extra Costs)']);
  rows.push(['ক্রমিক', 'খরচের বিবরণ', '', 'টাকা (BDT)']);

  let totalCost = 0;
  data.costs.forEach((c, idx) => {
    totalCost += c.amount;
    rows.push([(idx + 1).toString(), `"${(c.detail || '').replace(/"/g, '""')}"`, '', c.amount.toString()]);
  });
  rows.push(['মোট খরচ', '', '', totalCost.toString()]);

  rows.push([]);
  const balance = totalAdv - totalCost;
  let whoStatus = 'হিসাব সমান';
  if (balance > 0) whoStatus = `${settings.uncleName} পাবে`;
  else if (balance < 0) whoStatus = `${settings.myName} পাবে`;

  rows.push(['মাসিক চূড়ান্ত ফলাফল']);
  rows.push(['ব্যালেন্স টাকা', Math.abs(balance).toString()]);
  rows.push(['কে পাবে', whoStatus]);

  return rows.map((r) => r.join(',')).join('\r\n');
}

// ---------------- Reset Functions (Danger Zone) ----------------
export async function resetMonthData(ym: string): Promise<void> {
  const emptyData: MonthData = {
    advances: [],
    costs: [],
    note: '',
  };
  await saveMonthData(ym, emptyData);
}

export async function factoryResetAll(): Promise<{ defaultMonth: string }> {
  // Before wiping, try to make a safety snapshot of existing data
  try {
    const existingMonths = await getMonthsList();
    const allData: Record<string, MonthData> = {};
    for (const m of existingMonths) {
      allData[m] = await getMonthData(m);
    }
    const now = new Date();
    const safetySnapshot: BackupSnapshot = {
      timestamp: now.toISOString(),
      label: `রিসেটের আগের সেফটি কপি (${now.toLocaleDateString('bn-BD')} ${now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })})`,
      monthsCount: existingMonths.length,
      totalEntries: Object.values(allData).reduce((s, md) => s + (md.advances?.length || 0) + (md.costs?.length || 0), 0),
      data: allData,
    };
    const snapshots = getAutoSnapshots();
    const updatedSnapshots = [safetySnapshot, ...snapshots.slice(0, 8)];
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(updatedSnapshots));
    await idbSet(SNAPSHOTS_KEY, updatedSnapshots);
  } catch (e) {
    console.warn('Failed to take safety snapshot before factory reset', e);
  }

  // Clear all localStorage keys starting with MONTH_PREFIX
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(MONTH_PREFIX)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {}

  // Set default single month
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const newMonths = [defaultMonth];

  await saveMonthsList(newMonths);
  await saveMonthData(defaultMonth, { advances: [], costs: [], note: '' });
  await saveAppSettings(DEFAULT_SETTINGS);

  return { defaultMonth };
}

