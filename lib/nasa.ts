import "server-only";

import { get, HOUR, map, type Result } from "./http";

export type { Result };

const KEY = process.env.NASA_API_KEY || "DEMO_KEY";

const API = "https://api.nasa.gov";
const DONKI = "https://ccmc.gsfc.nasa.gov/DONKI/WS/get";
const EPIC = "https://epic.gsfc.nasa.gov";
const EONET = "https://eonet.gsfc.nasa.gov/api/v3";
const IMAGES = "https://images-api.nasa.gov";
const EXOPLANETS = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync";
const SSD = "https://ssd-api.jpl.nasa.gov";
const SVS = "https://svs.gsfc.nasa.gov/api";
const TECH = "https://technology.nasa.gov/api/api";

const LD_PER_AU = 389.17;

/** UTC calendar day as YYYY-MM-DD, offset in days from today. */
export function isoDay(offset = 0): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

// ── APOD ────────────────────────────────────────────────────────────────────

export type Apod = {
  date: string;
  title: string;
  explanation: string;
  media_type: "image" | "video" | string;
  url?: string;
  hdurl?: string;
  thumbnail_url?: string;
  copyright?: string;
};

/** Last nine days of Astronomy Picture of the Day, newest first. */
export async function getApod(): Promise<Result<Apod[]>> {
  const url = `${API}/planetary/apod?api_key=${KEY}&start_date=${isoDay(-8)}&thumbs=true`;
  const r = await get<Apod[]>(url, HOUR, 10000);
  if (!r.ok) return r;
  const days = [...r.data].reverse();
  if (!days.some(isBrokenApod)) return { ok: true, data: days };
  const archive = await fetchHtml(`${APOD_SITE}/apod/archive/`);
  return { ok: true, data: await Promise.all(days.map((a) => (isBrokenApod(a) ? repairApod(a, archive) : a))) };
}

// Since APOD moved to science.nasa.gov the API sometimes scrapes the page chrome
// instead of the entry: the title comes back as "NASA Science" and the image as
// the site logo, while the explanation is correct.
const APOD_SITE = "https://science.nasa.gov";
const MONTHS = "january february march april may june july august september october november december".split(" ");

function isBrokenApod(a: Apod): boolean {
  return a.title.trim() === "NASA Science" || /nasa-logo/i.test(`${a.url} ${a.hdurl}`);
}

async function fetchHtml(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(url, { next: { revalidate: HOUR }, signal: AbortSignal.timeout(10000) });
    return res.ok ? await res.text() : undefined;
  } catch {
    return undefined;
  }
}

/** Recovers the real title and image from the entry's science.nasa.gov article. */
async function repairApod(a: Apod, archive: string | undefined): Promise<Apod> {
  const [y, m, d] = a.date.split("-");
  const slug = `apod-${y}-${MONTHS[Number(m) - 1]}-${Number(d)}-`;
  const path = archive?.match(new RegExp(`/image-article/${slug}[a-z0-9-]*/`))?.[0];
  const html = path ? await fetchHtml(APOD_SITE + path) : undefined;
  const title = html?.match(/<h1[^>]*>([^<]+)/)?.[1];
  const image = html?.match(/property="og:image" content="([^"]+)"/)?.[1];
  const link = path ? APOD_SITE + path : `${APOD_SITE}/apod/archive/`;
  const base = { ...a, media_type: "image", thumbnail_url: undefined };

  // Better no picture than the NASA logo; the card still links to the source.
  if (!title || !image) return { ...base, title: "Astronomy Picture of the Day", url: undefined, hdurl: link };
  return { ...base, title: plain(title), url: image, hdurl: image.replace(/\/jcr:content\/.*$/, "") };
}

export function apodImage(a: Apod): string | undefined {
  return a.media_type === "image" ? a.url : a.thumbnail_url;
}

// ── NeoWs ───────────────────────────────────────────────────────────────────

type NeoRaw = {
  id: string;
  name: string;
  nasa_jpl_url: string;
  is_potentially_hazardous_asteroid: boolean;
  estimated_diameter: { meters: { estimated_diameter_min: number; estimated_diameter_max: number } };
  close_approach_data: {
    close_approach_date: string;
    close_approach_date_full: string;
    miss_distance: { lunar: string; kilometers: string };
    relative_velocity: { kilometers_per_second: string };
  }[];
};

export type Neo = {
  id: string;
  name: string;
  url: string;
  hazardous: boolean;
  minM: number;
  maxM: number;
  day: string;
  when: string;
  lunar: number;
  km: number;
  kps: number;
};

/** Near-Earth objects with a close approach in the next seven days. */
export async function getNeoFeed(): Promise<Result<Neo[]>> {
  const url = `${API}/neo/rest/v1/feed?start_date=${isoDay()}&end_date=${isoDay(6)}&api_key=${KEY}`;
  const r = await get<{ near_earth_objects: Record<string, NeoRaw[]> }>(url);
  return map(r, (d) =>
    Object.values(d.near_earth_objects)
      .flat()
      .filter((n) => n.close_approach_data.length > 0)
      .map((n) => {
        const ca = n.close_approach_data[0];
        return {
          id: n.id,
          name: n.name.replace(/[()]/g, ""),
          url: n.nasa_jpl_url,
          hazardous: n.is_potentially_hazardous_asteroid,
          minM: n.estimated_diameter.meters.estimated_diameter_min,
          maxM: n.estimated_diameter.meters.estimated_diameter_max,
          day: ca.close_approach_date,
          when: ca.close_approach_date_full,
          lunar: Number(ca.miss_distance.lunar),
          km: Number(ca.miss_distance.kilometers),
          kps: Number(ca.relative_velocity.kilometers_per_second),
        };
      })
      .sort((a, b) => a.lunar - b.lunar),
  );
}

// ── JPL SSD / CNEOS ─────────────────────────────────────────────────────────

type Table = { fields: string[]; data: (string | null)[][] | undefined };

function rows(t: Table): Record<string, string | null>[] {
  return (t.data ?? []).map((row) => Object.fromEntries(t.fields.map((f, i) => [f, row[i]])));
}

export type CloseApproach = { name: string; when: string; lunar: number; kps: number; h: number };

/** Closest predicted passes within 10 lunar distances over the next 60 days. */
export async function getCloseApproaches(): Promise<Result<CloseApproach[]>> {
  const url = `${SSD}/cad.api?dist-max=10LD&date-min=now&date-max=%2B60&sort=dist&limit=12`;
  return map(await get<Table>(url), (t) =>
    rows(t).map((r) => ({
      name: r.des ?? "",
      when: r.cd ?? "",
      lunar: Number(r.dist) * LD_PER_AU,
      kps: Number(r.v_rel),
      h: Number(r.h),
    })),
  );
}

export type Fireball = {
  date: string;
  energyKt: number;
  lat: number | null;
  lon: number | null;
  altKm: number | null;
  velKps: number | null;
};

/** Most recent bolides detected by US government sensors. */
export async function getFireballs(): Promise<Result<Fireball[]>> {
  const signed = (v: string | null, dir: string | null, neg: string) =>
    v == null ? null : Number(v) * (dir === neg ? -1 : 1);
  return map(await get<Table>(`${SSD}/fireball.api?limit=80`), (t) =>
    rows(t).map((r) => ({
      date: r.date ?? "",
      energyKt: Number(r["impact-e"]),
      lat: signed(r.lat, r["lat-dir"], "S"),
      lon: signed(r.lon, r["lon-dir"], "W"),
      altKm: r.alt == null ? null : Number(r.alt),
      velKps: r.vel == null ? null : Number(r.vel),
    })),
  );
}

export type ImpactRisk = {
  name: string;
  url: string;
  years: string;
  impacts: number;
  probability: number;
  palermo: number;
  torino: number;
  diameterM: number;
  kps: number;
  lastObs: string;
};

/** Objects on JPL's Sentry impact-monitoring list, ranked by cumulative Palermo scale. */
export async function getImpactRisks(): Promise<Result<{ total: number; list: ImpactRisk[] }>> {
  type Raw = {
    count: string;
    data: {
      des: string;
      range: string;
      n_imp: number;
      ip: string;
      ps_cum: string;
      ts_max: string | null;
      diameter: string;
      v_inf: string;
      last_obs: string;
    }[];
  };
  return map(await get<Raw>(`${SSD}/sentry.api`, HOUR * 12, 20000), (d) => ({
    total: Number(d.count),
    list: d.data
      .map((r) => ({
        name: r.des,
        url: `https://cneos.jpl.nasa.gov/sentry/details.html#?des=${encodeURIComponent(r.des)}`,
        years: r.range,
        impacts: r.n_imp,
        probability: Number(r.ip),
        palermo: Number(r.ps_cum),
        torino: Number(r.ts_max ?? 0),
        diameterM: Number(r.diameter) * 1000,
        kps: Number(r.v_inf),
        // Some dates carry a fractional day ("2020-10-3.80160"); keep the calendar day.
        lastObs: r.last_obs.replace(/-(\d+)(\.\d+)?$/, (_, d: string) => `-${d.padStart(2, "0")}`),
      }))
      .sort((a, b) => b.palermo - a.palermo),
  }));
}

// ── DONKI ───────────────────────────────────────────────────────────────────

export type Flare = {
  flrID: string;
  beginTime: string;
  peakTime: string | null;
  classType: string;
  sourceLocation: string | null;
  activeRegionNum: number | null;
  link: string;
};

export type Cme = {
  activityID: string;
  startTime: string;
  sourceLocation: string | null;
  note: string | null;
  link: string;
  cmeAnalyses: { speed: number | null; type: string | null; isMostAccurate: boolean }[] | null;
};

export type Storm = {
  gstID: string;
  startTime: string;
  link: string;
  allKpIndex: { observedTime: string; kpIndex: number }[] | null;
};

const donki = <T>(type: string, days: number) =>
  get<T[] | null>(`${DONKI}/${type}?startDate=${isoDay(-days)}&endDate=${isoDay()}`).then((r) =>
    map(r, (d) => (Array.isArray(d) ? [...d].reverse() : [])),
  );

export const getFlares = () => donki<Flare>("FLR", 30);
export const getCmes = () => donki<Cme>("CME", 7);
export const getStorms = () => donki<Storm>("GST", 55);

/** Ranks GOES flare classes (A < B < C < M < X) on a continuous scale. */
export function flareRank(cls: string): number {
  const i = "ABCMX".indexOf(cls[0]?.toUpperCase() ?? "");
  return i * 10 + (Number(cls.slice(1)) || 0);
}

// ── EPIC ────────────────────────────────────────────────────────────────────

export type EpicFrame = {
  id: string;
  date: string;
  image: string;
  thumb: string;
  lat: number;
  lon: number;
};

/** Latest day of full-disc Earth imagery from DSCOVR at L1. */
export async function getEpic(): Promise<Result<EpicFrame[]>> {
  type Raw = {
    identifier: string;
    image: string;
    date: string;
    centroid_coordinates: { lat: number; lon: number };
  };
  return map(await get<Raw[]>(`${EPIC}/api/natural`), (d) =>
    d.map((f) => {
      const base = `${EPIC}/archive/natural/${f.date.slice(0, 10).replaceAll("-", "/")}`;
      return {
        id: f.identifier,
        date: f.date,
        image: `${base}/jpg/${f.image}.jpg`,
        thumb: `${base}/thumbs/${f.image}.jpg`,
        lat: f.centroid_coordinates.lat,
        lon: f.centroid_coordinates.lon,
      };
    }),
  );
}

// ── EONET ───────────────────────────────────────────────────────────────────

export type EarthEvent = {
  id: string;
  title: string;
  category: string;
  categoryId: string;
  date: string;
  source?: string;
  lat: number | null;
  lon: number | null;
  magnitude?: string;
};

/** Natural events currently open in the Earth Observatory tracker. */
export async function getEvents(): Promise<Result<EarthEvent[]>> {
  type Raw = {
    events: {
      id: string;
      title: string;
      categories: { id: string; title: string }[];
      sources: { url: string }[];
      geometry: {
        date: string;
        type: string;
        coordinates: unknown;
        magnitudeValue?: number | null;
        magnitudeUnit?: string | null;
      }[];
    }[];
  };
  return map(await get<Raw>(`${EONET}/events?status=open&days=45&limit=120`), (d) =>
    d.events.map((e) => {
      const g = e.geometry[e.geometry.length - 1];
      const point = g?.type === "Point" ? (g.coordinates as [number, number]) : null;
      return {
        id: e.id,
        title: e.title,
        category: e.categories[0]?.title ?? "Event",
        categoryId: e.categories[0]?.id ?? "other",
        date: g?.date ?? "",
        source: e.sources[0]?.url,
        lon: point ? point[0] : null,
        lat: point ? point[1] : null,
        magnitude:
          g?.magnitudeValue != null
            ? `${g.magnitudeValue.toLocaleString("en-US")} ${g.magnitudeUnit ?? ""}`.trim()
            : undefined,
      };
    }),
  );
}

// ── Image and Video Library ─────────────────────────────────────────────────

export type LibraryItem = {
  id: string;
  title: string;
  description: string;
  date: string;
  center?: string;
  image: string;
};

export async function searchImages(q: string): Promise<Result<LibraryItem[]>> {
  type Raw = {
    collection: {
      items: {
        data: {
          nasa_id: string;
          title: string;
          description?: string;
          date_created: string;
          center?: string;
        }[];
        links?: { href: string; render?: string }[];
      }[];
    };
  };
  const url = `${IMAGES}/search?${new URLSearchParams({ q, media_type: "image", page_size: "30" })}`;
  return map(await get<Raw>(url, HOUR * 24), (d) =>
    d.collection.items.flatMap((item) => {
      const meta = item.data[0];
      const links = item.links ?? [];
      const link = links.find((l) => l.href.includes("~small")) ?? links[0];
      if (!meta || !link) return [];
      return [
        {
          id: meta.nasa_id,
          title: meta.title,
          description: meta.description ?? "",
          date: meta.date_created,
          center: meta.center,
          image: encodeURI(link.href),
        },
      ];
    }),
  );
}

// ── Exoplanet Archive ───────────────────────────────────────────────────────

export type Exoplanet = {
  pl_name: string;
  hostname: string;
  disc_year: number;
  discoverymethod: string;
  disc_facility: string | null;
  pl_rade: number | null;
  pl_bmasse: number | null;
  pl_orbper: number | null;
  sy_dist: number | null;
};

export type ExoplanetSummary = {
  total: number;
  methods: { discoverymethod: string; n: number }[];
  years: { disc_year: number; n: number }[];
  latest: Exoplanet[];
};

const tap = <T>(query: string) =>
  get<T[]>(`${EXOPLANETS}?${new URLSearchParams({ query, format: "json" })}`, HOUR * 12, 25000);

export async function getExoplanetCount(): Promise<Result<number>> {
  return map(await tap<{ n: number }>("select count(*) as n from pscomppars"), (d) => d[0]?.n ?? 0);
}

export async function getExoplanets(): Promise<Result<ExoplanetSummary>> {
  const year = new Date().getUTCFullYear();
  const [total, methods, years, latest] = await Promise.all([
    getExoplanetCount(),
    tap<ExoplanetSummary["methods"][number]>(
      "select discoverymethod,count(*) as n from pscomppars group by discoverymethod order by n desc",
    ),
    tap<ExoplanetSummary["years"][number]>(
      "select disc_year,count(*) as n from pscomppars group by disc_year order by disc_year",
    ),
    tap<Exoplanet>(
      "select pl_name,hostname,disc_year,discoverymethod,disc_facility,pl_rade,pl_bmasse,pl_orbper,sy_dist " +
        `from pscomppars where disc_year>=${year - 1} order by disc_year desc,pl_name`,
    ),
  ]);
  if (!total.ok) return total;
  if (!methods.ok) return methods;
  if (!years.ok) return years;
  if (!latest.ok) return latest;
  return {
    ok: true,
    data: {
      total: total.data,
      methods: methods.data,
      years: years.data,
      latest: latest.data.slice(0, 40),
    },
  };
}

// ── Scientific Visualization Studio ─────────────────────────────────────────

export type Visualization = {
  id: number;
  title: string;
  type: string;
  date: string;
  url: string;
  image?: string;
};

const https = (u: string) => u.replace(/^http:/, "https:");

/** Newest SVS releases matching `q` (or simply the newest), each with its lead image. */
export async function searchVisualizations(q: string): Promise<Result<Visualization[]>> {
  type Hit = { id: number; url: string; result_type: string; release_date: string; title: string };
  type Page = { main_image: { url: string } | null };
  const params = new URLSearchParams({ limit: "12" });
  if (q) params.set("search", q);
  const hits = await get<{ results: Hit[] }>(`${SVS}/search/?${params}`, HOUR * 6, 20000);
  if (!hits.ok) return hits;
  const pages = await Promise.all(hits.data.results.map((h) => get<Page>(`${SVS}/${h.id}`, HOUR * 24)));
  return {
    ok: true,
    data: hits.data.results.map((h, i) => {
      const page = pages[i];
      return {
        id: h.id,
        title: h.title,
        type: h.result_type,
        date: h.release_date,
        url: https(h.url),
        image: page.ok && page.data.main_image ? https(page.data.main_image.url) : undefined,
      };
    }),
  };
}

// ── Technology Transfer ─────────────────────────────────────────────────────

export type TechKind = "patent" | "software" | "spinoff";

export type Technology = {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  center: string;
  release?: string;
  image?: string;
  url: string;
};

const techUrl: Record<TechKind, (code: string) => string> = {
  patent: (code) => `https://technology.nasa.gov/patent/${code}`,
  software: (code) => `https://software.nasa.gov/software/${code}`,
  spinoff: () => "https://spinoff.nasa.gov/",
};

/** Strips the search-highlight markup and HTML entities TechTransfer returns. */
function plain(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}

/**
 * Keyword search over NASA patents, software or spinoffs. Rows are positional arrays:
 * [id, code, title, description, _, category, release, _, _, center, image, ...].
 */
export async function searchTechnology(
  kind: TechKind,
  q: string,
): Promise<Result<{ total: number; items: Technology[] }>> {
  type Raw = { results: string[][]; total: number };
  const r = await get<Raw>(`${TECH}/${kind}/${encodeURIComponent(q)}`, HOUR * 24, 20000);
  return map(r, (d) => ({
    total: d.total,
    items: d.results.slice(0, 12).map((row) => ({
      id: row[0],
      code: row[1],
      title: plain(row[2] ?? ""),
      description: plain(row[3] ?? ""),
      category: row[5] ?? "",
      center: row[9] ?? "",
      release: kind === "software" ? row[6] || undefined : undefined,
      image: row[10] ? encodeURI(row[10]) : undefined,
      url: techUrl[kind](row[1]),
    })),
  }));
}
