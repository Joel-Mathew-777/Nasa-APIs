"use client";

import { useState } from "react";
import { coords, date } from "@/lib/format";
import type { EpicFrame } from "@/lib/nasa";

export function EpicViewer({ frames }: { frames: EpicFrame[] }) {
  const [index, setIndex] = useState(0);
  const frame = frames[index];

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-black">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_18rem]">
        <img
          key={frame.id}
          src={frame.image}
          alt={`Earth seen from DSCOVR on ${date(frame.date, true)} UTC`}
          className="mx-auto aspect-square w-full max-w-2xl object-contain"
        />
        <div className="flex flex-col justify-end gap-6 border-t border-line p-6 lg:border-t-0 lg:border-l">
          <dl className="space-y-5 text-sm">
            <div>
              <dt className="text-muted">Captured</dt>
              <dd className="mt-1 text-lg tabular-nums">{date(frame.date, true)} UTC</dd>
            </div>
            <div>
              <dt className="text-muted">Centred over</dt>
              <dd className="mt-1 text-lg tabular-nums">{coords(frame.lat, frame.lon)}</dd>
            </div>
            <div>
              <dt className="text-muted">Frame</dt>
              <dd className="mt-1 text-lg tabular-nums">
                {index + 1} of {frames.length}
              </dd>
            </div>
          </dl>
          <a href={frame.image} target="_blank" rel="noreferrer" className="text-sm text-muted hover:text-white">
            Open full resolution ↗
          </a>
        </div>
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto border-t border-line p-3">
        {frames.map((f, i) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Show frame from ${date(f.date, true)} UTC`}
            aria-pressed={i === index}
            className={`size-16 shrink-0 overflow-hidden rounded-lg border transition-opacity ${
              i === index ? "border-accent" : "border-transparent opacity-50 hover:opacity-100"
            }`}
          >
            <img src={f.thumb} alt="" loading="lazy" className="size-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
