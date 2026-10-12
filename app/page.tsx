import Link from "next/link";
import { Suspense } from "react";
import { Stat, Stats } from "@/components/ui";
import { catalog } from "@/lib/catalog";
import { date, num } from "@/lib/format";
import {
  apodImage,
  flareRank,
  getApod,
  getEpic,
  getEvents,
  getExoplanetCount,
  getFlares,
  getNeoFeed,
  isoDay,
} from "@/lib/nasa";

export const revalidate = 3600;

export default function Home() {
  return (
    <>
      <section className="pt-12 pb-10 sm:pt-28 sm:pb-16">
        <p className="font-mono text-xs tracking-widest text-accent uppercase">Ten open APIs · live data</p>
        <h1 className="mt-5 max-w-4xl text-4xl font-medium tracking-tight text-balance sm:text-7xl">
          What NASA knows, right now.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-pretty text-muted sm:mt-6 sm:text-xl">
          Asteroids passing this week, storms on the Sun, fires seen from orbit and every planet found around
          another star. All of it is public, and all of it is on this site.
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <a
            href="#apis"
            className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-85"
          >
            Browse the APIs
          </a>
          <a
            href="https://api.nasa.gov"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-line px-5 py-2.5 text-sm text-muted transition-colors hover:text-white"
          >
            Get an API key ↗
          </a>
        </div>
      </section>

      <Suspense fallback={<div className="skeleton aspect-4/3 rounded-2xl sm:aspect-21/9" />}>
        <Feature />
      </Suspense>

      <div className="mt-6">
        <Suspense fallback={<div className="skeleton h-32 rounded-xl" />}>
          <LiveStats />
        </Suspense>
      </div>

      <section id="apis" className="mt-16 scroll-mt-20 sm:mt-24 sm:scroll-mt-24">
        <h2 className="text-2xl font-medium tracking-tight sm:text-3xl">The APIs</h2>
        <p className="mt-3 max-w-2xl text-muted">
          Each page below is built from live responses. Only two of them need an API key.
        </p>
        <ul className="mt-8 grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
          {catalog.map((item) => (
            <li key={item.href} className="bg-panel">
              <Link
                href={item.href}
                className="group flex h-full flex-col p-5 transition-colors hover:bg-raised sm:p-7"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="font-mono text-xs tracking-wider text-accent uppercase">{item.api}</p>
                  <span className="text-xs text-faint">{item.keyed ? "API key" : "No key"}</span>
                </div>
                <h3 className="mt-4 text-xl font-medium tracking-tight">{item.title}</h3>
                <p className="mt-2 leading-relaxed text-pretty text-muted">{item.blurb}</p>
                <p className="mt-6 flex items-end justify-between gap-4 pt-1">
                  <span className="truncate font-mono text-xs text-faint">{item.host}</span>
                  <span
                    aria-hidden
                    className="text-muted transition-transform group-hover:translate-x-1 group-hover:text-white"
                  >
                    →
                  </span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

/** Today's APOD as the hero image; falls back to the latest EPIC frame when APOD is down. */
async function Feature() {
  const apod = await getApod();
  const today = apod.ok ? apod.data.find((a) => apodImage(a)) : undefined;

  if (today) {
    return (
      <FeatureCard
        href="/apod"
        image={apodImage(today)!}
        label={`Astronomy Picture of the Day · ${date(today.date)}`}
        title={today.title}
      />
    );
  }

  const epic = await getEpic();
  if (epic.ok && epic.data[0]) {
    return (
      <FeatureCard
        href="/earth"
        image={epic.data[0].image}
        label={`Earth from DSCOVR · ${date(epic.data[0].date, true)} UTC`}
        title="The most recent photograph of the whole Earth"
        contain
      />
    );
  }
  return null;
}

function FeatureCard({
  href,
  image,
  label,
  title,
  contain = false,
}: {
  href: string;
  image: string;
  label: string;
  title: string;
  contain?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group relative block aspect-4/3 overflow-hidden rounded-2xl border border-line bg-black sm:aspect-21/9"
    >
      <img
        src={image}
        alt=""
        className={`absolute inset-0 size-full transition-transform duration-700 group-hover:scale-[1.02] ${
          contain ? "object-contain" : "object-cover"
        }`}
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/85 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-5 sm:p-9">
        <p className="font-mono text-xs tracking-wider text-white/70 uppercase">{label}</p>
        <p className="mt-2 line-clamp-3 max-w-2xl text-xl font-medium tracking-tight text-balance sm:text-3xl">{title}</p>
      </div>
    </Link>
  );
}

async function LiveStats() {
  const [neos, events, flares, planets] = await Promise.all([
    getNeoFeed(),
    getEvents(),
    getFlares(),
    getExoplanetCount(),
  ]);

  const today = isoDay();
  const passing = neos.ok ? neos.data.filter((n) => n.day === today) : [];
  const strongest = flares.ok
    ? flares.data.reduce<string | null>(
        (best, f) => (best == null || flareRank(f.classType) > flareRank(best) ? f.classType : best),
        null,
      )
    : null;

  return (
    <Stats>
      <Stat
        label="Asteroids passing Earth today"
        value={neos.ok ? num(passing.length) : "—"}
        hint={neos.ok ? `${num(neos.data.length)} over the next 7 days` : neos.error}
      />
      <Stat
        label="Natural events being tracked"
        value={events.ok ? num(events.data.length) : "—"}
        hint={events.ok ? "Open in the last 45 days" : events.error}
      />
      <Stat
        label="Solar flares, last 30 days"
        value={flares.ok ? num(flares.data.length) : "—"}
        hint={flares.ok ? (strongest ? `Strongest was ${strongest}` : "A quiet Sun") : flares.error}
      />
      <Stat
        label="Confirmed exoplanets"
        value={planets.ok ? num(planets.data) : "—"}
        hint={planets.ok ? "In the NASA Exoplanet Archive" : planets.error}
      />
    </Stats>
  );
}
