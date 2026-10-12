import type { ReactNode } from "react";

export function PageHeader({
  api,
  title,
  endpoint,
  children,
}: {
  api: string;
  title: string;
  endpoint: string;
  children: ReactNode;
}) {
  return (
    <header className="pt-14 pb-10 sm:pt-20">
      <p className="font-mono text-xs tracking-widest text-accent uppercase">{api}</p>
      <h1 className="mt-4 max-w-3xl text-4xl font-medium tracking-tight text-balance sm:text-5xl">{title}</h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-pretty text-muted">{children}</p>
      <p className="mt-6 inline-flex max-w-full items-center gap-2 rounded-md border border-line bg-panel px-3 py-1.5 font-mono text-xs text-muted">
        <span className="text-faint">GET</span>
        <span className="truncate">{endpoint}</span>
      </p>
    </header>
  );
}

export function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-14">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-xl font-medium tracking-tight">{title}</h2>
        {note && <p className="text-sm text-faint">{note}</p>}
      </div>
      {children}
    </section>
  );
}

export function Stats({ children }: { children: ReactNode }) {
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line lg:grid-cols-4">
      {children}
    </dl>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="flex flex-col bg-panel p-5">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-3 text-3xl font-medium tracking-tight tabular-nums">{value}</dd>
      {hint && <dd className="mt-1.5 truncate text-sm text-faint">{hint}</dd>}
    </div>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`overflow-hidden rounded-xl border border-line bg-panel ${className}`}>{children}</div>;
}

export function Unavailable({ what, error }: { what: string; error: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line px-6 py-12 text-center">
      <p className="font-medium">{what} is unavailable right now</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">{error} Try again in a few minutes.</p>
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-line bg-panel px-6 py-10 text-center text-sm text-muted">{children}</p>;
}

const tones = {
  neutral: "border-line text-muted",
  accent: "border-accent/40 bg-accent/10 text-accent",
  warn: "border-amber-400/30 bg-amber-400/10 text-amber-300",
} as const;

export function Tag({ children, tone = "neutral" }: { children: ReactNode; tone?: keyof typeof tones }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs whitespace-nowrap ${tones[tone]}`}>
      {children}
    </span>
  );
}

/** Horizontally scrollable table shell; cells are styled by the `th`/`td` selectors here. */
export function DataTable({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <Panel>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm [&_td]:px-5 [&_td]:py-3 [&_th]:px-5 [&_th]:py-3 [&_tbody_tr]:border-t [&_tbody_tr]:border-line">
          <thead className="text-xs text-faint">
            <tr>
              {head.map((h) => (
                <th key={h} scope="col" className="font-normal whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="tabular-nums">{children}</tbody>
        </table>
      </div>
    </Panel>
  );
}

/** Thin proportional bar for comparing a value against the largest in its column. */
export function Meter({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.max(2, Math.min(100, (value / max) * 100)) : 0;
  return (
    <span className="block h-1 w-full overflow-hidden rounded-full bg-raised" aria-hidden>
      <span className="block h-full rounded-full bg-white/70" style={{ width: `${pct}%` }} />
    </span>
  );
}
