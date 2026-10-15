import type { Metadata } from "next";
import Link from "next/link";
import { SearchForm } from "@/components/search-form";
import { Empty, PageHeader, Tag, Unavailable } from "@/components/ui";
import { num } from "@/lib/format";
import { searchTechnology, type TechKind } from "@/lib/nasa";

export const metadata: Metadata = { title: "Technology" };

const kinds: { id: TechKind; label: string; noun: string }[] = [
  { id: "patent", label: "Patents", noun: "patents" },
  { id: "software", label: "Software", noun: "software releases" },
  { id: "spinoff", label: "Spinoffs", noun: "spinoffs" },
];

const suggestions = ["Battery", "Robotics", "Medical", "Solar", "Sensor", "Water"];

type Params = { q?: string | string[]; type?: string | string[] };

export default async function TechnologyPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const first = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);
  const q = first(params.q)?.trim() || "Battery";
  const kind = kinds.find((k) => k.id === first(params.type)) ?? kinds[0];
  const results = await searchTechnology(kind.id, q);

  return (
    <>
      <PageHeader api="Technology Transfer" title="NASA technology" endpoint={`technology.nasa.gov/api/api/${kind.id}/{query}`}>
        NASA licenses the inventions it develops to companies, publishes much of its software for free, and
        tracks the commercial products that grew out of its work. This search covers all three.
      </PageHeader>

      <ul className="mb-5 flex flex-wrap gap-2">
        {kinds.map((k) => (
          <li key={k.id}>
            <Link
              href={`/technology?${new URLSearchParams({ type: k.id, q })}`}
              aria-current={k.id === kind.id ? "true" : undefined}
              className={`inline-block rounded-md px-3 py-1.5 text-sm transition-colors ${
                k.id === kind.id ? "bg-raised text-white" : "text-muted hover:text-white"
              }`}
            >
              {k.label}
            </Link>
          </li>
        ))}
      </ul>

      <SearchForm
        action="/technology"
        q={q}
        label={`Search NASA ${kind.noun}`}
        placeholder="Search for a material, device or field"
        suggestions={suggestions}
        hidden={{ type: kind.id }}
      />

      <div className="mt-10">
        {!results.ok ? (
          <Unavailable what="The technology catalogue" error={results.error} />
        ) : results.data.items.length === 0 ? (
          <Empty>
            No {kind.noun} match &ldquo;{q}&rdquo;. Try a broader search.
          </Empty>
        ) : (
          <>
            <p className="mb-5 text-sm text-faint">
              {num(results.data.total)} {kind.noun} match &ldquo;{q}&rdquo;
              {results.data.total > results.data.items.length ? `, showing the top ${results.data.items.length}` : ""}.
            </p>
            <ul className="grid gap-4 md:grid-cols-2">
              {results.data.items.map((t) => (
                <li key={t.id}>
                  <a
                    href={t.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex h-full overflow-hidden rounded-xl border border-line bg-panel transition-colors hover:bg-raised"
                  >
                    {t.image && (
                      <img src={t.image} alt="" loading="lazy" className="hidden w-32 shrink-0 object-cover sm:block" />
                    )}
                    <div className="flex min-w-0 flex-1 flex-col p-5">
                      <p className="leading-snug font-medium text-pretty">{t.title}</p>
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{t.description}</p>
                      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4 text-xs text-faint">
                        {t.category && <Tag>{t.category}</Tag>}
                        {t.release && <Tag tone="accent">{t.release}</Tag>}
                        <span className="tabular-nums">
                          {t.code} · {t.center}
                        </span>
                      </div>
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
