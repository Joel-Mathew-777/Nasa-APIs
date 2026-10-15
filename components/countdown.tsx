"use client";

import { useEffect, useState } from "react";

function format(ms: number): string {
  const s = Math.floor(Math.abs(ms) / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${ms < 0 ? "T+" : "T−"}${d > 0 ? `${d}d ` : ""}${pad(h)}:${pad(m)}:${pad(sec)}`;
}

/** Ticking T-minus clock to `target`; renders nothing until mounted so server and client agree. */
export function Countdown({ target }: { target: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (now == null) return <span className="opacity-0">T−00:00:00</span>;
  return <span className="tabular-nums">{format(new Date(target).getTime() - now)}</span>;
}
