import type { Metadata } from "next";
import { PageHeader, Section, Tag, Unavailable } from "@/components/ui";
import { date } from "@/lib/format";
import { apodImage, getApod, type Apod } from "@/lib/nasa";

export const revalidate = 3600;
export const metadata: Metadata = { title: "Astronomy Picture of the Day" };

export default async function ApodPage() {
  const apod = await getApod();

  return (
    <>
      <PageHeader api="APOD" title="Astronomy Picture of the Day" endpoint="api.nasa.gov/planetary/apod">
        Since 1995, one image or video of the universe has been published every day with a short explanation
        written by a professional astronomer. The API returns any day in that archive.
      </PageHeader>

      {!apod.ok ? (
        <Unavailable what="APOD" error={apod.error} />
      ) : apod.data.length === 0 ? (
        <Unavailable what="APOD" error="The service returned no entries." />
      ) : (
        <>
          <Today entry={apod.data[0]} />
          <Section title="Earlier this week" note="Select a picture to open the original">
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {apod.data.slice(1).map((a) => (
                <li key={a.date}>
                  <a href={a.hdurl ?? a.url} target="_blank" rel="noreferrer" className="group block">
                    <div className="aspect-square overflow-hidden rounded-xl border border-line bg-panel">
                      {apodImage(a) && (
                        <img
                          src={apodImage(a)}
                          alt=""
                          loading="lazy"
                          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                    </div>
                    <p className="mt-3 text-xs text-faint tabular-nums">{date(a.date)}</p>
                    <p className="mt-1 leading-snug font-medium text-pretty">{a.title}</p>
                  </a>
                </li>
              ))}
            </ul>
          </Section>
        </>
      )}
    </>
  );
}

function Today({ entry }: { entry: Apod }) {
  const image = apodImage(entry);
  return (
    <article className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-12">
      <a
        href={entry.hdurl ?? entry.url}
        target="_blank"
        rel="noreferrer"
        className="block overflow-hidden rounded-2xl border border-line bg-black"
      >
        {image && <img src={image} alt={entry.title} className="w-full object-cover" />}
      </a>
      <div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted tabular-nums">
          {date(entry.date)}
          {entry.media_type !== "image" && <Tag>Video</Tag>}
        </div>
        <h2 className="mt-3 text-3xl font-medium tracking-tight text-balance">{entry.title}</h2>
        <p className="mt-5 leading-relaxed text-pretty text-muted">{entry.explanation}</p>
        {entry.copyright && (
          <p className="mt-6 text-sm text-faint">Image credit: {entry.copyright.replace(/\s+/g, " ").trim()}</p>
        )}
      </div>
    </article>
  );
}
