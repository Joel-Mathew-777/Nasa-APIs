import "server-only";

import { get, HOUR, map, type Result } from "./http";

/** Clients for the non-NASA services the site uses alongside NASA's own APIs. */

const SWPC = "https://services.swpc.noaa.gov";
const ISS = "https://api.wheretheiss.at/v1/satellites/25544";
const LL2 = "https://ll.thespacedevs.com/2.3.0";
const SNAPI = "https://api.spaceflightnewsapi.net/v4";
const CELESTRAK = "https://celestrak.org/NORAD/elements/gp.php";

const MINUTE = 60;

// ── NOAA Space Weather Prediction Center ────────────────────────────────────

export type KpReading = { time: string; kp: number; kind: "observed" | "estimated" | "predicted" };

/** Planetary Kp index: the past week observed, plus NOAA's three-day forecast. */
export async function getKp(): Promise<Result<KpReading[]>> {
  type Raw = { time_tag: string; kp: number; observed: KpReading["kind"] }[];
  return map(await get<Raw>(`${SWPC}/products/noaa-planetary-k-index-forecast.json`, MINUTE * 10), (d) =>
    d.map((r) => ({ time: r.time_tag, kp: r.kp, kind: r.observed })),
  );
}

export type SolarWind = { time: string; speed: number; bt: number; bz: number };

/** Latest solar wind speed and interplanetary magnetic field measured at L1. */
export async function getSolarWind(): Promise<Result<SolarWind>> {
  const [speed, mag] = await Promise.all([
    get<{ proton_speed: number; time_tag: string }[]>(`${SWPC}/products/summary/solar-wind-speed.json`, MINUTE * 5),
    get<{ bt: number; bz_gsm: number }[]>(`${SWPC}/products/summary/solar-wind-mag-field.json`, MINUTE * 5),
  ]);
  if (!speed.ok) return speed;
  if (!mag.ok) return mag;
  const s = speed.data[0];
  const m = mag.data[0];
  if (!s || !m) return { ok: false, error: "The service returned no readings." };
  return { ok: true, data: { time: s.time_tag, speed: s.proton_speed, bt: m.bt, bz: m.bz_gsm } };
}

export type XrayFlux = { time: string; flux: number; class: string; peak: { time: string; class: string } };

/** GOES long-band (0.1–0.8 nm) X-ray flux: the current level and the six-hour peak. */
export async function getXrayFlux(): Promise<Result<XrayFlux>> {
  type Raw = { time_tag: string; flux: number; energy: string }[];
  const r = await get<Raw>(`${SWPC}/json/goes/primary/xrays-6-hour.json`, MINUTE * 5);
  if (!r.ok) return r;
  const long = r.data.filter((x) => x.energy === "0.1-0.8nm" && x.flux > 0);
  const last = long[long.length - 1];
  if (!last) return { ok: false, error: "The service returned no readings." };
  const peak = long.reduce((a, b) => (b.flux > a.flux ? b : a));
  return {
    ok: true,
    data: {
      time: last.time_tag,
      flux: last.flux,
      class: xrayClass(last.flux),
      peak: { time: peak.time_tag, class: xrayClass(peak.flux) },
    },
  };
}

/** Converts a flux in W/m² to a GOES flare class such as C2.4. */
export function xrayClass(flux: number): string {
  const i = Math.max(0, Math.min(4, Math.floor(Math.log10(flux)) + 8));
  return `${"ABCMX"[i]}${(flux / 10 ** (i - 8)).toFixed(1)}`;
}

export type NoaaScales = { r: number; s: number; g: number };

/** Current NOAA space weather scale levels (0–5) for radio blackouts, radiation and storms. */
export async function getNoaaScales(): Promise<Result<NoaaScales>> {
  type Level = { Scale: string | null };
  type Raw = Record<string, { R: Level; S: Level; G: Level }>;
  return map(await get<Raw>(`${SWPC}/products/noaa-scales.json`, MINUTE * 10), (d) => ({
    r: Number(d["0"]?.R.Scale ?? 0),
    s: Number(d["0"]?.S.Scale ?? 0),
    g: Number(d["0"]?.G.Scale ?? 0),
  }));
}

// ── Where the ISS at ────────────────────────────────────────────────────────

const ISS_LIMIT = "The ISS position service is rate limited. Try again in a minute.";

export type IssPosition = {
  timestamp: number;
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  visibility: string;
  footprint: number;
};

/**
 * ISS positions from 45 minutes ago to 50 minutes ahead, five minutes apart: roughly one
 * orbit. The API takes up to ten timestamps per request, so this makes two.
 */
export async function getIssTrack(): Promise<Result<{ now: IssPosition; track: IssPosition[] }>> {
  const now = Math.floor(Date.now() / 60000) * 60;
  const times = Array.from({ length: 20 }, (_, i) => now + (i - 9) * 300);
  const batches = await Promise.all(
    [times.slice(0, 10), times.slice(10)].map((ts) =>
      get<IssPosition[]>(`${ISS}/positions?timestamps=${ts.join(",")}&units=kilometers`, MINUTE, 15000, ISS_LIMIT),
    ),
  );
  const track: IssPosition[] = [];
  for (const b of batches) {
    if (!b.ok) return b;
    track.push(...b.data);
  }
  return { ok: true, data: { now: track[9], track } };
}

// ── Launch Library 2 ────────────────────────────────────────────────────────

export type Launch = {
  id: string;
  name: string;
  net: string;
  status: string;
  statusAbbrev: string;
  provider: string;
  rocket: string;
  mission?: string;
  description?: string;
  orbit?: string;
  pad: string;
  location: string;
  image?: string;
  webcast?: string;
};

export type Launches = { total: number; list: Launch[] };

/** The next dozen orbital launch attempts worldwide. */
export async function getLaunches(): Promise<Result<Launches>> {
  type Raw = {
    count: number;
    results: {
      id: string;
      name: string;
      net: string;
      status: { name: string; abbrev: string };
      image: { image_url: string; thumbnail_url: string } | null;
      launch_service_provider: { name: string } | null;
      rocket: { configuration: { full_name: string } };
      mission: { name: string; description: string; orbit: { name: string } | null } | null;
      pad: { name: string; location: { name: string } };
      vid_urls?: { url: string }[];
    }[];
  };
  const url = `${LL2}/launches/upcoming/?limit=12&mode=normal&hide_recent_previous=true`;
  const limited = "Launch Library's free tier allows 15 requests an hour. Try again later.";
  return map(await get<Raw>(url, HOUR, 20000, limited), (d) => ({
    total: d.count,
    list: d.results.map((l) => ({
      id: l.id,
      name: l.name,
      net: l.net,
      status: l.status.name,
      statusAbbrev: l.status.abbrev,
      provider: l.launch_service_provider?.name ?? "Unknown provider",
      rocket: l.rocket.configuration.full_name,
      mission: l.mission?.name,
      description: l.mission?.description || undefined,
      orbit: l.mission?.orbit?.name,
      pad: l.pad.name,
      location: l.pad.location.name,
      image: l.image?.thumbnail_url ?? l.image?.image_url,
      webcast: l.vid_urls?.[0]?.url,
    })),
  }));
}

// ── Spaceflight News API ────────────────────────────────────────────────────

export type Article = {
  id: number;
  title: string;
  url: string;
  image?: string;
  site: string;
  summary: string;
  published: string;
};

/** The latest spaceflight news articles from agencies and outlets. */
export async function getNews(limit = 12): Promise<Result<Article[]>> {
  type Raw = {
    results: {
      id: number;
      title: string;
      url: string;
      image_url: string | null;
      news_site: string;
      summary: string;
      published_at: string;
    }[];
  };
  return map(await get<Raw>(`${SNAPI}/articles/?limit=${limit}`, MINUTE * 30), (d) =>
    d.results.map((a) => ({
      id: a.id,
      title: a.title,
      url: a.url,
      image: a.image_url || undefined,
      site: a.news_site,
      summary: a.summary,
      published: a.published_at,
    })),
  );
}

// ── CelesTrak ───────────────────────────────────────────────────────────────

export const SATELLITE_GROUPS = [
  { id: "stations", label: "Space stations" },
  { id: "visual", label: "100 brightest" },
  { id: "gps-ops", label: "GPS" },
  { id: "weather", label: "Weather" },
] as const;

export type SatelliteGroup = (typeof SATELLITE_GROUPS)[number]["id"];

export type Satellite = {
  name: string;
  noradId: number;
  intlId: string;
  epoch: string;
  inclination: number;
  periodMin: number;
  perigeeKm: number;
  apogeeKm: number;
};

const EARTH_RADIUS_KM = 6378.137;
const MU = 398600.4418;

/** Orbital elements for a CelesTrak group, with period and perigee/apogee heights derived. */
export async function getSatellites(group: SatelliteGroup): Promise<Result<Satellite[]>> {
  type Raw = {
    OBJECT_NAME: string;
    OBJECT_ID: string;
    NORAD_CAT_ID: number;
    EPOCH: string;
    MEAN_MOTION: number;
    ECCENTRICITY: number;
    INCLINATION: number;
  }[];
  // CelesTrak refreshes every two hours and blocks clients that poll more often.
  const url = `${CELESTRAK}?GROUP=${group}&FORMAT=json`;
  return map(await get<Raw>(url, HOUR * 4, 20000, "CelesTrak is limiting requests. Try again later."), (d) =>
    d.map((s) => {
      const n = (s.MEAN_MOTION * 2 * Math.PI) / 86400;
      const a = Math.cbrt(MU / (n * n));
      return {
        name: s.OBJECT_NAME,
        noradId: s.NORAD_CAT_ID,
        intlId: s.OBJECT_ID,
        epoch: s.EPOCH,
        inclination: s.INCLINATION,
        periodMin: 1440 / s.MEAN_MOTION,
        perigeeKm: a * (1 - s.ECCENTRICITY) - EARTH_RADIUS_KM,
        apogeeKm: a * (1 + s.ECCENTRICITY) - EARTH_RADIUS_KM,
      };
    }),
  );
}
