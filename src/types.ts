export interface AdvanceEntry {
  id: string;
  name: string;
  detail?: string;
  amount: number;
  date?: string;
}

export interface CostEntry {
  id: string;
  detail: string;
  amount: number;
  date?: string;
}

export interface MonthData {
  advances: AdvanceEntry[];
  costs: CostEntry[];
  note?: string;
}

export interface AppSettings {
  uncleName: string; // e.g. "নিলয় আঙ্কেল"
  myName: string; // e.g. "আমি"
  currencySymbol: string; // "৳"
}

export interface BackupSnapshot {
  timestamp: string;
  label: string;
  monthsCount: number;
  totalEntries: number;
  data: Record<string, MonthData>;
}

export interface BackupBundle {
  appName: string;
  version: number;
  exportedAt: string;
  months: string[];
  settings?: AppSettings;
  data: Record<string, MonthData>;
}
