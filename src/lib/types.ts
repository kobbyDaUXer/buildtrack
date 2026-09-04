export type Currency = "GHS" | "USD" | "EUR" | "GBP" | "NGN" | "ZAR" | "KES";

export type Status = "not-started" | "in-progress" | "blocked" | "done";

export type Priority = "low" | "medium" | "high";

export interface Project {
  name: string;
  address: string;
  startDate: string;
  targetDate: string;
  currency: Currency;
  budgetTotal: number;
  notes: string;
}

export interface Phase {
  id: string;
  name: string;
  status: Status;
  start: string;
  end: string;
  progress: number;
  notes: string;
}

export type CostCategory =
  | "Land & permits"
  | "Professional fees"
  | "Materials"
  | "Labour"
  | "Equipment hire"
  | "Utilities"
  | "Contingency"
  | "Other";

export interface BudgetItem {
  id: string;
  description: string;
  category: CostCategory;
  phaseId: string | null;
  budgeted: number;
  actual: number;
  vendor: string;
  paid: boolean;
  date: string;
}

export interface Task {
  id: string;
  title: string;
  phaseId: string | null;
  assignee: string;
  due: string;
  priority: Priority;
  done: boolean;
}

export interface Contractor {
  id: string;
  name: string;
  trade: string;
  phone: string;
  email: string;
  rate: string;
  notes: string;
}

export interface LogEntry {
  id: string;
  date: string;
  title: string;
  body: string;
  weather: string;
  crewOnSite: number;
  /** IndexedDB keys — the blobs themselves live in the photo store. */
  photos: string[];
}

export interface AppState {
  project: Project;
  phases: Phase[];
  budget: BudgetItem[];
  tasks: Task[];
  contractors: Contractor[];
  log: LogEntry[];
}

export const CATEGORIES: CostCategory[] = [
  "Land & permits",
  "Professional fees",
  "Materials",
  "Labour",
  "Equipment hire",
  "Utilities",
  "Contingency",
  "Other",
];

export const STATUSES: Status[] = ["not-started", "in-progress", "blocked", "done"];

export const CURRENCIES: Currency[] = ["GHS", "USD", "EUR", "GBP", "NGN", "ZAR", "KES"];
