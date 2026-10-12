import type { Metadata } from "next";
import { Empty, PageHeader, Section, Unavailable } from "@/components/ui";
import { WorldMap } from "@/components/world-map";
import { coords, date } from "@/lib/format";
import { getEvents, type EarthEvent } from "@/lib/nasa";

export const revalidate = 3600;
export const metadata: Metadata = { title: "Natural events" };

const colors: Record<string, string> = {
  wildfires: "#ff6a3d",
  severeStorms: "#5cc8ff",
  volcanoes: "#f5c542",
  seaLakeIce: "#e8ecf1",
};
const fallbackColor = "#b48cff";
const colorOf = (categoryId: string) => colors[categoryId] ?? fallbackColor;

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <>
      <PageHeader api="EONET · GIBS" title="Natural events" endpoint="eonet.gsfc.nasa.gov/api/v3/events">
        The Earth Observatory Natural Event Tracker gathers wildfires, storms, volcanic eruptions and drifting
        icebergs from agencies around the world into one feed. The base map is rendered by GIBS, NASA&apos;s
        satellite imagery service.
      </PageHeader>

      {!events.ok ? (
        <Unavailable what="The event tracker" error={events.error} />
      ) : events.data.length === 0 ? (
        <Empty>No events have been reported in the last 45 days.</Empty>
      ) : (
        <Events events={events.data} />
      )}
    </>
  );
}

function Events({ events }: { events: EarthEvent[] }) {
  const counts = new Map<string, { title: string; id: string; n: number }>();
  for (const e of events) {
    const c = counts.get(e.categoryId) ?? { title: e.category, id: e.categoryId, n: 0 };
    c.n += 1;
    counts.set(e.categoryId, c);
  }
  const categories = [...counts.values()].sort((a, b) => b.n - a.n);

  return (
    <>
      <WorldMap
        points={events.flatMap((e) =>
          e.lat == null || e.lon == null
            ? []
            : [{ id: e.id, lat: e.lat, lon: e.lon, label: `${e.title} · ${e.category}`, color: colorOf(e.categoryId) }],
        )}
      />
      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center gap-2">
            <span className="size-2 rounded-full" style={{ background: colorOf(c.id) }} aria-hidden />
            {c.title}
            <span className="text-faint tabular-nums">{c.n}</span>
          </li>
        ))}
      </ul>

      <Section title="Open events" note={`${events.length} reported in the last 45 days`}>
        <ul className="grid gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-2">
          {events.slice(0, 40).map((e) => (
            <li key={e.id} className="flex gap-4 bg-panel p-5">
              <span
                className="mt-1.5 size-2 shrink-0 rounded-full"
                style={{ background: colorOf(e.categoryId) }}
                aria-hidden
              />
              <div className="min-w-0">
                <p className="leading-snug font-medium text-pretty">
                  {e.source ? (
                    <a href={e.source} target="_blank" rel="noreferrer" className="hover:text-accent">
                      {e.title}
                    </a>
                  ) : (
                    e.title
                  )}
                </p>
                <p className="mt-1.5 text-sm text-muted tabular-nums">
                  {[
                    e.category,
                    e.date && date(e.date),
                    e.lat != null && e.lon != null && coords(e.lat, e.lon),
                    e.magnitude,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
