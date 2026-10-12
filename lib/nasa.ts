import "server-only";

const KEY = process.env.NASA_API_KEY || "DEMO_KEY";

const API = "https://api.nasa.gov";
const DONKI = "https://ccmc.gsfc.nasa.gov/DONKI/WS/get";
const EPIC = "https://epic.gsfc.nasa.gov";
const EONET = "https://eonet.gsfc.nasa.gov/api/v3";
const IMAGES = "https://images-api.nasa.gov";
const EXOPLANETS = "https://exoplanetarchive.ipac.caltech.edu/TAP/sync";
const SSD = "https://ssd-api.jpl.nasa.gov";

const HOUR = 3600;
const LD_PER_AU = 389.17;

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function get<T>(url: string, revalidate = HOUR, timeout = 15000): Promise<Result<T>> {
  try {
    const res = await fetch(url, {
      next: { revalidate },
      signal: AbortSignal.timeout(timeout),
    });
    if (res.status === 429) {
      return { ok: false, error: "Rate limit reached. Add your own NASA_API_KEY to lift it." };
    }
    if (!res.ok) return { ok: false, error: `The service responded with ${res.status}.` };
    return { ok: true, data: (await res.json()) as T };
  } catch (e) {
    const timedOut = e instanceof Error && e.name === "TimeoutError";
    return {
      ok: false,
      error: timedOut ? "The service took too long to respond." : "The service could not be reached.",
    };
  }
}

function map<T, U>(r: Result<T>, fn: (data: T) => U): Result<U> {
  return r.ok ? { ok: true, data: fn(r.data) } : r;
}

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
  return map(r, (d) => [...d].reverse());
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

// ── GIBS ────────────────────────────────────────────────────────────────────

/** Blue Marble base map rendered by the GIBS WMS service (equirectangular). */
export const WORLD_MAP =
  "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0" +
  "&LAYERS=BlueMarble_ShadedRelief_Bathymetry&CRS=EPSG:4326&BBOX=-90,-180,90,180&WIDTH=1600&HEIGHT=800&FORMAT=image/jpeg";
