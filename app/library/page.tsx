import type { Metadata } from "next";
import Link from "next/link";
import { Empty, PageHeader, Unavailable } from "@/components/ui";
import { date } from "@/lib/format";
import { searchImages } from "@/lib/nasa";

export const metadata: Metadata = { title: "Image library" };

const suggestions = ["Apollo 11", "Nebula", "Saturn", "James Webb", "Aurora", "Perseverance", "Space Shuttle"];

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const raw = (await searchParams).q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim() || "Nebula";
  const results = await searchImages(q);

  return (
    <>
      <PageHeader api="Image and Video Library" title="Image library" endpoint="images-api.nasa.gov/search">
        The same archive that powers images.nasa.gov: photographs, illustrations and footage from every NASA
        centre, searchable by keyword. No API key is needed.
      </PageHeader>

      <form action="/library" role="search" className="flex gap-2">
        <label htmlFor="q" className="sr-only">
          Search NASA images
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Search for a mission, planet or person"
          className="min-w-0 flex-1 rounded-full border border-line bg-panel px-4 py-3 text-base placeholder:text-faint focus:border-muted focus:outline-none sm:px-5"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-white px-5 py-3 text-sm font-medium text-ink transition-opacity hover:opacity-85 sm:px-6"
        >
          Search
        </button>
      </form>
      <ul className="mt-4 flex flex-wrap gap-2">
        {suggestions.map((s) => {
          const active = s.toLowerCase() === q.toLowerCase();
          return (
            <li key={s}>
              <Link
                href={`/library?q=${encodeURIComponent(s)}`}
                aria-current={active ? "true" : undefined}
                className={`inline-block rounded-full border px-3 py-1.5 text-sm transition-colors sm:py-1 ${
                  active ? "border-muted text-white" : "border-line text-muted hover:text-white"
                }`}
              >
                {s}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-10">
        {!results.ok ? (
          <Unavailable what="The image library" error={results.error} />
        ) : results.data.length === 0 ? (
          <Empty>No images match &ldquo;{q}&rdquo;. Try a broader search.</Empty>
        ) : (
          <ul className="columns-1 gap-4 sm:columns-2 lg:columns-3">
            {results.data.map((item) => (
              <li key={item.id} className="mb-4 break-inside-avoid">
                <a
                  href={`https://images.nasa.gov/details/${encodeURIComponent(item.id)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group block overflow-hidden rounded-xl border border-line bg-panel"
                >
                  <img
                    src={item.image}
                    alt=""
                    loading="lazy"
                    className="w-full transition-opacity group-hover:opacity-85"
                  />
                  <div className="p-4">
                    <p className="leading-snug font-medium text-pretty">{item.title}</p>
                    <p className="mt-1.5 text-xs text-faint tabular-nums">
                      {[date(item.date), item.center].filter(Boolean).join(" · ")}
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
