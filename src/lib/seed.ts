import type { AppState } from "./types";

/**
 * Sample project so the app is legible on first open. Dates sit around
 * September 2026 — a build roughly a third of the way through. Wipe it
 * from Settings when the real project starts.
 */
export const seed: AppState = {
  project: {
    name: "3 bedroom house (sample)",
    address: "Set your site address in Settings",
    startDate: "2026-04-06",
    targetDate: "2027-04-30",
    currency: "GHS",
    budgetTotal: 620000,
    notes: "Sample data. Clear it from Settings and start your own.",
  },
  phases: [
    { id: "p1", name: "Site prep & setting out", status: "done", start: "2026-04-06", end: "2026-04-24", progress: 100, notes: "Clearing, hoarding, site office." },
    { id: "p2", name: "Foundation & substructure", status: "done", start: "2026-04-27", end: "2026-06-12", progress: 100, notes: "Strip footing, DPC, oversite concrete." },
    { id: "p3", name: "Superstructure & walls", status: "in-progress", start: "2026-06-15", end: "2026-09-25", progress: 65, notes: "Blockwork up to lintel level on three elevations." },
    { id: "p4", name: "Roofing", status: "not-started", start: "2026-09-28", end: "2026-10-30", progress: 0, notes: "Timber trusses, aluzinc sheets." },
    { id: "p5", name: "First fix — electrical & plumbing", status: "not-started", start: "2026-10-12", end: "2026-11-20", progress: 0, notes: "Runs chased before plastering starts." },
    { id: "p6", name: "Plastering & screeding", status: "not-started", start: "2026-11-23", end: "2026-12-24", progress: 0, notes: "" },
    { id: "p7", name: "Windows, doors & joinery", status: "not-started", start: "2026-12-14", end: "2027-01-15", progress: 0, notes: "Aluminium lead time is 6 weeks — order well ahead." },
    { id: "p8", name: "Second fix & finishes", status: "not-started", start: "2027-01-18", end: "2027-02-26", progress: 0, notes: "Tiling, sanitaryware, fittings." },
    { id: "p9", name: "Painting & snagging", status: "not-started", start: "2027-02-15", end: "2027-03-19", progress: 0, notes: "" },
    { id: "p10", name: "External works & handover", status: "not-started", start: "2027-03-08", end: "2027-04-30", progress: 0, notes: "Driveway, fence, landscaping." },
  ],
  budget: [
    { id: "b1", description: "Building permit & district assembly fees", category: "Land & permits", phaseId: "p1", budgeted: 18000, actual: 19400, vendor: "District Assembly", paid: true, date: "2026-03-24" },
    { id: "b2", description: "Architectural & structural drawings", category: "Professional fees", phaseId: null, budgeted: 25000, actual: 25000, vendor: "Nsuo Studio", paid: true, date: "2026-03-10" },
    { id: "b3", description: "Site clearing & hoarding", category: "Labour", phaseId: "p1", budgeted: 9000, actual: 8600, vendor: "Kwesi Mensah", paid: true, date: "2026-04-10" },
    { id: "b4", description: "Foundation concrete & reinforcement", category: "Materials", phaseId: "p2", budgeted: 78000, actual: 84200, vendor: "Ashfoam Hardware", paid: true, date: "2026-05-08" },
    { id: "b5", description: "Masonry labour — substructure", category: "Labour", phaseId: "p2", budgeted: 32000, actual: 32000, vendor: "Kwesi Mensah", paid: true, date: "2026-06-10" },
    { id: "b6", description: "Blocks — 6in & 9in (3,400 units)", category: "Materials", phaseId: "p3", budgeted: 62000, actual: 58900, vendor: "Tema Block Co.", paid: true, date: "2026-06-20" },
    { id: "b7", description: "Cement — 420 bags", category: "Materials", phaseId: "p3", budgeted: 48000, actual: 31000, vendor: "Ashfoam Hardware", paid: false, date: "2026-07-14" },
    { id: "b8", description: "Masonry labour — superstructure", category: "Labour", phaseId: "p3", budgeted: 40000, actual: 22000, vendor: "Kwesi Mensah", paid: false, date: "2026-08-01" },
    { id: "b9", description: "Roof trusses & aluzinc sheets", category: "Materials", phaseId: "p4", budgeted: 71000, actual: 0, vendor: "Roofmart", paid: false, date: "" },
    { id: "b10", description: "Electrical first fix — cable & conduit", category: "Materials", phaseId: "p5", budgeted: 26000, actual: 0, vendor: "", paid: false, date: "" },
    { id: "b11", description: "Plumbing first fix — PPR pipework", category: "Materials", phaseId: "p5", budgeted: 21000, actual: 0, vendor: "", paid: false, date: "" },
    { id: "b12", description: "Aluminium windows & doors", category: "Materials", phaseId: "p7", budgeted: 54000, actual: 0, vendor: "Glasstek", paid: false, date: "" },
    { id: "b13", description: "Floor & wall tiling (materials + labour)", category: "Materials", phaseId: "p8", budgeted: 46000, actual: 0, vendor: "", paid: false, date: "" },
    { id: "b14", description: "Paint & painting labour", category: "Labour", phaseId: "p9", budgeted: 24000, actual: 0, vendor: "", paid: false, date: "" },
    { id: "b15", description: "Concrete mixer & vibrator hire", category: "Equipment hire", phaseId: "p2", budgeted: 12000, actual: 11200, vendor: "Adom Plant Hire", paid: true, date: "2026-05-22" },
    { id: "b16", description: "Site water & temporary power", category: "Utilities", phaseId: null, budgeted: 14000, actual: 6800, vendor: "ECG / water tanker", paid: false, date: "2026-07-03" },
    { id: "b17", description: "Contingency reserve (10%)", category: "Contingency", phaseId: null, budgeted: 56000, actual: 0, vendor: "", paid: false, date: "" },
  ],
  tasks: [
    { id: "t1", title: "Pay outstanding balance on cement supply", phaseId: "p3", assignee: "You", due: "2026-09-01", priority: "high", done: false },
    { id: "t2", title: "Confirm roof truss timber sizes with engineer", phaseId: "p4", assignee: "Nsuo Studio", due: "2026-09-08", priority: "high", done: false },
    { id: "t3", title: "Cast lintel beam over the north elevation", phaseId: "p3", assignee: "Kwesi Mensah", due: "2026-09-11", priority: "medium", done: false },
    { id: "t4", title: "Order aluminium windows — 6 week lead time", phaseId: "p7", assignee: "Glasstek", due: "2026-09-12", priority: "high", done: false },
    { id: "t5", title: "Get three quotes for electrical first fix", phaseId: "p5", assignee: "You", due: "2026-09-25", priority: "medium", done: false },
    { id: "t6", title: "Confirm septic tank position with plumber", phaseId: "p5", assignee: "Yaw Boateng", due: "2026-10-02", priority: "low", done: false },
    { id: "t7", title: "Set out building lines and check diagonals", phaseId: "p1", assignee: "Nsuo Studio", due: "2026-04-20", priority: "high", done: true },
    { id: "t8", title: "Backfill and compact around foundation", phaseId: "p2", assignee: "Kwesi Mensah", due: "2026-06-10", priority: "medium", done: true },
  ],
  contractors: [
    { id: "c1", name: "Kwesi Mensah", trade: "Mason / general contractor", phone: "+233 24 000 0000", email: "", rate: "Lump sum per phase", notes: "Crew of 6. Reliable on programme, slow on paperwork." },
    { id: "c2", name: "Yaw Boateng", trade: "Plumber", phone: "+233 20 000 0000", email: "", rate: "Day rate", notes: "Quoted first fix only — second fix still to be agreed." },
    { id: "c3", name: "Ama Owusu", trade: "Electrician", phone: "+233 27 000 0000", email: "", rate: "Per point", notes: "Certified. Quote outstanding." },
    { id: "c4", name: "Nsuo Studio", trade: "Architect & structural engineer", phone: "", email: "hello@example.com", rate: "6% of build cost", notes: "Fortnightly site visits included in the fee." },
    { id: "c5", name: "Glasstek", trade: "Aluminium windows & doors", phone: "+233 30 000 0000", email: "", rate: "Per m²", notes: "6 week lead time from deposit." },
  ],
  log: [
    { id: "l1", date: "2026-08-28", title: "Blockwork reached lintel level", body: "North and east elevations are at lintel level. Mason wants the beam cast before the rains pick up. Two courses left on the west wall.", weather: "Overcast", crewOnSite: 6, photos: [] },
    { id: "l2", date: "2026-08-21", title: "Cement delivery short by 40 bags", body: "Supplier delivered 380 of 420 bags. Balance promised for next week — flagged so it does not stall the lintel pour.", weather: "Hot, dry", crewOnSite: 5, photos: [] },
    { id: "l3", date: "2026-08-09", title: "Engineer site visit", body: "Reinforcement for the lintel signed off. Advised 150mm bearing each side. No issues with the blockwork bond.", weather: "Light rain", crewOnSite: 4, photos: [] },
    { id: "l4", date: "2026-06-12", title: "Substructure complete", body: "Oversite concrete cured and DPC laid across the full footprint. Phase closed out slightly under budget.", weather: "Clear", crewOnSite: 7, photos: [] },
  ],
};

export const blank: AppState = {
  project: {
    name: "My build",
    address: "",
    startDate: new Date().toISOString().slice(0, 10),
    targetDate: "",
    currency: "GHS",
    budgetTotal: 0,
    notes: "",
  },
  phases: [],
  budget: [],
  tasks: [],
  contractors: [],
  log: [],
};
