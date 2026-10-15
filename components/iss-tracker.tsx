"use client";

import { useEffect, useState } from "react";
import { Stat, Stats } from "@/components/ui";
import { WorldMap } from "@/components/world-map";
import { coords, num } from "@/lib/format";
import type { IssPosition } from "@/lib/space";

const NOW_URL = "https://api.wheretheiss.at/v1/satellites/25544";
const POLL_MS = 5000;

/** Live ISS position, polled from the browser, over a server-rendered ground track. */
export function IssTracker({ initial, track }: { initial: IssPosition; track: IssPosition[] }) {
  const [pos, setPos] = useState(initial);
  const [stale, setStale] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch(NOW_URL, { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const next = (await res.json()) as IssPosition;
        if (!cancelled) {
          setPos(next);
          setStale(false);
        }
      } catch {
        if (!cancelled) setStale(true);
      }
    };
    const id = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const updated = new Date(pos.timestamp * 1000).toLocaleTimeString("en-US", {
    timeZone: "UTC",
    hour12: false,
  });

  return (
    <>
      <Stats>
        <Stat label="Position" value={coords(pos.latitude, pos.longitude)} hint={`Updated ${updated} UTC`} />
        <Stat label="Altitude" value={`${num(pos.altitude)} km`} hint="Above mean sea level" />
        <Stat label="Speed" value={`${num(pos.velocity)} km/h`} hint={`${num(pos.velocity / 3600, 2)} km/s`} />
        <Stat
          label="Lighting"
          value={pos.visibility === "daylight" ? "Sunlit" : "In shadow"}
          hint={`Visible from a ${num(pos.footprint)} km wide area`}
        />
      </Stats>

      <div className="mt-6">
        <WorldMap
          points={[
            ...track.map((p) => ({
              id: `t-${p.timestamp}`,
              lat: p.latitude,
              lon: p.longitude,
              label: `${new Date(p.timestamp * 1000).toISOString().slice(11, 16)} UTC`,
              color: p.timestamp < initial.timestamp ? "rgb(255 255 255 / 0.35)" : "rgb(255 255 255 / 0.75)",
              size: 5,
            })),
            { id: "now", lat: pos.latitude, lon: pos.longitude, label: "ISS now", size: 16 },
          ]}
        />
        <p className="mt-3 text-sm text-faint" aria-live="polite">
          {stale
            ? "Live updates paused: the position service did not respond. Retrying."
            : "Updates every 5 seconds. Faint dots are the last 45 minutes, bright dots the next 50."}
        </p>
      </div>
    </>
  );
}
