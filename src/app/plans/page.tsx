import type { Metadata } from "next";
import { Card, CardHead, PageHead, Stat } from "@/components/ui";

export const metadata: Metadata = {
  title: "Plans — BuildTrack",
  description: "The design-intent drawing set for the 35 × 72 apartment block on Plot B.",
};

const SET_URL = "/plans/plot-b.html";

const LEVELS = [
  { level: "Ground", use: "Car park, stair, store, rear garden", flats: "—", nia: "—", balcony: "—" },
  { level: "Level 1", use: "Two one-bedroom flats, mirrored", flats: "2", nia: "769 ft² each", balcony: "84 ft² each" },
  { level: "Level 2", use: "One two-bedroom apartment", flats: "1", nia: "1,528 ft²", balcony: "178 ft²" },
  { level: "Level 3", use: "One two-bedroom apartment", flats: "1", nia: "1,528 ft²", balcony: "178 ft²" },
  { level: "Roof", use: "Terrace, pergola, water tanks", flats: "—", nia: "—", balcony: "—" },
];

const SHEETS = [
  ["3D", "The building, turned — five views including inside each floor type"],
  ["00", "What the overhang buys"],
  ["01", "Site plan on the surveyed boundary"],
  ["02", "Ground floor — car park, seven bays"],
  ["03", "Levels 2 and 3 — the two-bedroom apartment"],
  ["03b", "Level 1 — two one-bedroom apartments"],
  ["04", "Front elevation — the six moves"],
  ["05", "Long section — the drawing to hand over"],
  ["06", "Door and window schedule"],
  ["07", "What Plot A is worth"],
  ["08", "Finishes"],
  ["09", "Eight changes from the reference building"],
  ["10", "Take this to your builder"],
];

const OPEN_QUESTIONS = [
  {
    q: "Is the setback measured to the wall, or to the furthest projection?",
    why:
      "Ask the district assembly. If it is measured to the projection, the 6 ft front overhang breaks the front setback and the whole massing changes — either a 3 ft overhang, or the ground floor comes forward too. Everything else waits on this answer.",
  },
  {
    q: "What is the surveyed length of the A / B dividing line?",
    why:
      "The drawing set derives 2,752 ft² for Plot B by interpolating that line at 80'-2\". The presentation board states 2,581 ft² with both sides at 72'-6\". At 72'-6\" the 64 ft building plus 4 ft front and rear needs 72 ft exactly, with no tolerance — so the surveyor needs to give that one dimension before setting out.",
  },
];

export default function PlansPage() {
  return (
    <>
      <PageHead
        title="Plans"
        hint="Design intent for the 35 × 72 apartment block on Plot B. Dimensioned in feet and inches."
        action={
          <a
            href={SET_URL}
            target="_blank"
            rel="noopener"
            className="inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-ctl bg-accent px-4 text-[14px] font-semibold text-white shadow-btn-accent transition-colors duration-200 ease-linear hover:bg-[#6941C6]"
          >
            Open the full set
          </a>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Flats" value="4" sub="Two 1-bed, two 2-bed" />
        <Stat label="Bedrooms" value="6" sub="Every one en-suite" />
        <Stat label="Lettable internal" value="4,594 ft²" sub="Plus 524 ft² of balconies" />
        <Stat label="Parking" value="8 cars" sub="Seven covered bays, one on the apron" />
      </div>

      <Card pad={false}>
        <div className="p-6">
          <CardHead
            title="What is on each level"
            hint="One stair core serves all four levels. The internal walls do not stack between level 1 and level 2."
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-[15px]">
            <thead>
              <tr className="bg-bg-alt">
                {["Level", "What is on it", "Flats", "Net internal", "Balcony"].map((h) => (
                  <th
                    key={h}
                    className="border-b border-line px-6 py-3 text-left text-[12px] font-semibold uppercase tracking-wide text-tertiary"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {LEVELS.map((r) => (
                <tr key={r.level}>
                  <td className="border-b border-line-subtle px-6 py-3 font-semibold text-ink">
                    {r.level}
                  </td>
                  <td className="border-b border-line-subtle px-6 py-3">{r.use}</td>
                  <td className="border-b border-line-subtle px-6 py-3 tabular-nums text-ink">
                    {r.flats}
                  </td>
                  <td className="border-b border-line-subtle px-6 py-3 tabular-nums text-ink">
                    {r.nia}
                  </td>
                  <td className="border-b border-line-subtle px-6 py-3 tabular-nums text-ink">
                    {r.balcony}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHead
          title="Settle these before anything is priced"
          hint="Both are single questions with single answers, and both can invalidate work already done."
        />
        <div className="flex flex-col gap-5">
          {OPEN_QUESTIONS.map((o) => (
            <div key={o.q} className="border-l-2 border-accent pl-4">
              <h3 className="mb-1 text-[15px] font-semibold text-ink">{o.q}</h3>
              <p className="m-0 text-[14px]">{o.why}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card pad={false}>
        <div className="p-6">
          <CardHead
            title="The drawing set"
            hint="Thirteen sheets. Drag the 3D model to turn it; the two inside views cut the walls down to 4'-6&quot;."
            action={
              <a
                href={SET_URL}
                target="_blank"
                rel="noopener"
                className="text-[14px] font-semibold text-accent-text underline decoration-accent underline-offset-[3px]"
              >
                Open in a new tab
              </a>
            }
          />
          <ul className="m-0 grid list-none gap-x-6 gap-y-2 p-0 sm:grid-cols-2">
            {SHEETS.map(([no, label]) => (
              <li key={no} className="flex items-baseline gap-3 text-[14px]">
                <span className="w-8 shrink-0 tabular-nums text-[12px] font-semibold text-tertiary">
                  {no}
                </span>
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="border-t border-line">
          <iframe
            src={SET_URL}
            title="Plot B apartment block — design intent drawing set"
            loading="lazy"
            className="block h-[75vh] min-h-[520px] w-full rounded-b-card border-0 bg-bg"
          />
        </div>
      </Card>

      <Card>
        <CardHead title="What this document is, and is not" />
        <p className="m-0 text-[14px]">
          It fixes the idea, the arrangement and the dimensions so you and your builder are looking
          at the same building. It is <strong className="font-semibold text-ink">not</strong> a
          construction drawing set and it cannot be submitted for a permit. Structure,
          reinforcement, drainage runs, electrical layouts and foundation design sit with a licensed
          engineer — and with an overhang carrying three storeys, that is not optional. Areas are
          calculated from the layouts drawn here rather than measured off a survey. The figures on
          this screen are read off the drawing set, not from your live project data.
        </p>
      </Card>
    </>
  );
}
