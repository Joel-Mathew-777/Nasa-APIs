import type { Metadata } from "next";
import { SearchForm } from "@/components/search-form";
import { Empty, PageHeader, Unavailable } from "@/components/ui";
import { date } from "@/lib/format";
import { searchVisualizations } from "@/lib/nasa";

export const metadata: Metadata = { title: "Visualizations" };

const suggestions = ["Moon", "Sea ice", "Hurricane", "Solar eclipse", "Black hole", "Carbon dioxide"];

export default async function VisualizationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";
  const results = await searchVisualizations(q);

  return (
    <>
      <PageHeader api="Scientific Visualization Studio" title="Visualizations" endpoint="svs.gsfc.nasa.gov/api/search">
        Goddard&apos;s Scientific Visualization Studio turns mission data into animations: sea ice shrinking,
        hurricanes forming, the Moon&apos;s phases hour by hour. Its API searches more than ten thousand
        releases. Leave the search empty to see the newest.
      </PageHeader>

      <SearchForm
        action="/visualizations"
        q={q}
        label="Search NASA visualizations"
        placeholder="Search for a topic, mission or phenomenon"
        suggestions={suggestions}
      />

      <div className="mt-10">
        {!results.ok ? (
          <Unavailable what="The visualization archive" error={results.error} />
        ) : results.data.length === 0 ? (
          <Empty>No visualizations match &ldquo;{q}&rdquo;. Try a broader search.</Empty>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.data.map((v) => (
              <li key={v.id}>
                <a
                  href={v.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-panel"
                >
                  {v.image ? (
                    <img
                      src={v.image}
                      alt=""
                      loading="lazy"
                      className="aspect-video w-full bg-black object-cover transition-opacity group-hover:opacity-85"
                    />
                  ) : (
                    <div className="aspect-video w-full bg-raised" />
                  )}
                  <div className="flex flex-1 flex-col p-4">
                    <p className="leading-snug font-medium text-pretty">{v.title}</p>
                    <p className="mt-auto pt-3 text-xs text-faint tabular-nums">
                      {v.type} · {date(v.date)}
                    </p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
