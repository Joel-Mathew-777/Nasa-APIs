import type { Metadata } from "next";
import { Countdown } from "@/components/countdown";
import { Empty, PageHeader, Section, Stat, Stats, Tag, Unavailable } from "@/components/ui";
import { date, num } from "@/lib/format";
import { getLaunches, getNews, type Article, type Launch } from "@/lib/space";

export const revalidate = 3600;
export const metadata: Metadata = { title: "Launches" };

const statusTone = (abbrev: string) => (abbrev === "Go" ? "accent" : abbrev === "TBD" ? "neutral" : "warn");

export default async function LaunchesPage() {
  const [launches, news] = await Promise.all([getLaunches(), getNews()]);

  return (
    <>
      <PageHeader api="Launch Library 2 · Spaceflight News" title="Rocket launches" endpoint="ll.thespacedevs.com/2.3.0/launches/upcoming">
        The Space Devs keep a community-maintained schedule of every orbital launch attempt in the world,
        with the rocket, the pad and a target time (NET: no earlier than). Their Spaceflight News API collects
        the latest coverage from agencies and outlets.
      </PageHeader>

      {!launches.ok ? (
        <Unavailable what="The launch schedule" error={launches.error} />
      ) : launches.data.list.length === 0 ? (
        <Empty>No upcoming launches are listed.</Empty>
      ) : (
        <Schedule total={launches.data.total} list={launches.data.list} />
      )}

      <Section title="Spaceflight news" note="Spaceflight News API · newest first">
        {!news.ok ? (
          <Unavailable what="The news feed" error={news.error} />
        ) : news.data.length === 0 ? (
          <Empty>No articles are available.</Empty>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {news.data.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}

function Schedule({ total, list }: { total: number; list: Launch[] }) {
  const next = list[0];
  const providers = new Set(list.map((l) => l.provider));
  const sites = new Set(list.map((l) => l.location));

  return (
    <>
      <Stats>
        <Stat label="Next launch" value={<Countdown target={next.net} />} hint={next.name} />
        <Stat label="Upcoming launches" value={num(total)} hint="On the schedule" />
        <Stat label="Launch providers" value={num(providers.size)} hint={`In the next ${list.length}`} />
        <Stat label="Launch sites" value={num(sites.size)} hint={`In the next ${list.length}`} />
      </Stats>

      <Section title="Next launches" note="Times in UTC; dates far ahead often slip">
        <ul className="grid gap-4 md:grid-cols-2">
          {list.map((l) => (
            <li key={l.id} className="flex overflow-hidden rounded-xl border border-line bg-panel">
              {l.image && (
                <img src={l.image} alt="" loading="lazy" className="hidden w-32 shrink-0 object-cover sm:block" />
              )}
              <div className="flex min-w-0 flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-pretty">{l.name}</p>
                  <Tag tone={statusTone(l.statusAbbrev)}>{l.statusAbbrev}</Tag>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {l.provider} · {l.rocket}
                </p>
                <p className="mt-3 text-sm tabular-nums">
                  {date(l.net, true)} <span className="text-faint">·</span>{" "}
                  <span className="text-muted">
                    <Countdown target={l.net} />
                  </span>
                </p>
                <p className="mt-1 truncate text-sm text-faint">
                  {l.pad}, {l.location}
                  {l.orbit ? ` · ${l.orbit}` : ""}
                </p>
                {l.description && <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted">{l.description}</p>}
                {l.webcast && (
                  <a href={l.webcast} target="_blank" rel="noreferrer" className="mt-3 text-sm text-muted hover:text-white">
                    Webcast ↗
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}

function ArticleCard({ article: a }: { article: Article }) {
  return (
    <li>
      <a
        href={a.url}
        target="_blank"
        rel="noreferrer"
        className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-panel"
      >
        {a.image && (
          <img
            src={a.image}
            alt=""
            loading="lazy"
            className="aspect-video w-full object-cover transition-opacity group-hover:opacity-85"
          />
        )}
        <div className="flex flex-1 flex-col p-4">
          <p className="leading-snug font-medium text-pretty">{a.title}</p>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{a.summary}</p>
          <p className="mt-auto pt-3 text-xs text-faint tabular-nums">
            {a.site} · {date(a.published)}
          </p>
        </div>
      </a>
    </li>
  );
}
