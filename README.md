# BuildTrack

A single-project construction tracker: budget, phases, tasks, contractors and a dated site log,
in one app. Built with Next.js 16, React 19 and Tailwind 4.

## Running it

```bash
npm run dev
```

Then open http://localhost:3000.

## Where the data lives

Project data is kept in your browser's `localStorage` under the key `buildtrack.v1`. Site photos
are too large for that, so they live in IndexedDB (`buildtrack-photos`), downscaled to 1600px on
the way in — a 4MB camera JPEG lands at roughly 200KB. There is no server, no database and no
account — which means:

- The data is private to this browser on this machine.
- Clearing site data wipes it.
- It does not sync between your laptop and your phone.

**Settings → Export backup** writes the project to a JSON file; **Import backup** reads one back.
Use it before clearing anything, and as your off-machine copy.

**The backup does not include site photos** — only the text of each log entry. Photos stay on the
device. Settings shows how many you are holding and how much space they take.

The app opens with a sample project so the screens are legible on first run.
**Settings → Clear all data** wipes it and gives you an empty project.

## The screens

| Screen | What it is for |
|---|---|
| Dashboard | Spend against budget, work done against time elapsed, what is next, what has overrun |
| Schedule | Timeline view — phases on a shared time axis with a today marker, so overlaps and slippage are visible; List view for editing and progress sliders |
| Budget | Line items with budgeted vs actual, grouped totals by category, paid/unpaid |
| Tasks | Open work with owner, phase, priority and due date; overdue shown in red |
| Contractors | Directory with paid-to-date and open-task counts derived from the other screens |
| Site log | Dated notes with weather, crew count and site photos — the record you will wish you had kept |
| Plans | The design-intent drawing set for the building, plus the two questions that must be answered before anything is priced |
| Settings | Project details, currency, backup, reset |

## Three things worth knowing

- **Contractor totals match on name.** "Paid to date" sums budget line items whose *vendor* string
  equals the contractor's *name*. Keep the spelling identical or the total reads zero.
- **Budget ceiling vs allocated.** The ceiling is what you set in Settings. Allocated is the sum of
  your line-item budgets. They are allowed to differ — the gap is the point.
- **Photos are the one thing a backup cannot carry.** If the browser profile goes, they go. On a
  build that matters, keep the originals on your phone or in cloud storage as well.

## Deploying

It is a static-export-friendly Next app with no server dependencies:

```bash
npx vercel
```

Because state is per-browser, a deployed copy gives you the app on your phone but *not* your
laptop's data. Move data across with export/import.

## Structure

```
src/app/          one route per screen
src/components/   Shell (nav) and ui.tsx (Card, Button, Modal, Stat, …)
src/lib/types.ts  the data model
src/lib/store.tsx React context + localStorage persistence, and derived totals
src/lib/seed.ts   the sample project
src/lib/photos.ts IndexedDB photo store, downscaling and size reporting
public/plans/     the drawing set, one self-contained HTML file
```

## The plans screen is static, on purpose

`public/plans/plot-b.html` is the whole drawing set in one self-contained file — thirteen sheets
of plans, an elevation, a long section and a 3D model, all drawn in JavaScript with no external
assets beyond Google Fonts. The Plans screen frames it and repeats its headline figures.

Those figures are **read off the drawings, not from your live project data.** The plan is a record
of a decision; the rest of the app tracks what happens after it. If the design changes, replace
that one file and update the numbers in `src/app/plans/page.tsx` — they are deliberately not wired
to the store, because a drawing set that silently followed your budget edits would be worse than
useless.

The served copy carries `data-theme="light"` on its `<html>` tag. The drawing set is theme-aware on
its own, and BuildTrack is not, so without that attribute the embed would render dark inside a
light app whenever the reader's machine is in dark mode.
