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

export type MovementKind = "purchased" | "delivered" | "used";

/**
 * One movement of one material. Stock on site is derived, never stored:
 * delivered − used. Purchased − delivered is what is still owed to you.
 */
export interface MaterialMove {
  id: string;
  date: string;
  material: string;
  unit: string;
  qty: number;
  kind: MovementKind;
  phaseId: string | null;
  party: string;
  /** Purchase price, or haulage for a delivery. Not rolled into the budget. */
  cost: number;
  note: string;
  photos: string[];
}

export interface AppState {
  project: Project;
  phases: Phase[];
  budget: BudgetItem[];
  tasks: Task[];
  contractors: Contractor[];
  log: LogEntry[];
  materials: MaterialMove[];
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

export const MOVEMENT_KINDS: MovementKind[] = ["purchased", "delivered", "used"];

export const UNITS = [
  "bags", "tonnes", "pieces", "lengths", "trips", "m³", "m²", "litres", "rolls", "sets",
];

export const CURRENCIES: Currency[] = ["GHS", "USD", "EUR", "GBP", "NGN", "ZAR", "KES"];
