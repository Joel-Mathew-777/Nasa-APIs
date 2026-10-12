import type { Metadata } from "next";
import { DataTable, Empty, Meter, PageHeader, Panel, Section, Stat, Stats, Unavailable } from "@/components/ui";
import { num } from "@/lib/format";
import { getExoplanets, type ExoplanetSummary } from "@/lib/nasa";

export const revalidate = 43200;
export const metadata: Metadata = { title: "Exoplanets" };

export default async function ExoplanetsPage() {
  const planets = await getExoplanets();

  return (
    <>
      <PageHeader api="Exoplanet Archive" title="Exoplanets" endpoint="exoplanetarchive.ipac.caltech.edu/TAP/sync">
        The NASA Exoplanet Archive catalogues every confirmed planet outside the solar system. Its TAP
        service accepts ADQL, a dialect of SQL, so each figure on this page is the result of a single query.
      </PageHeader>

      {!planets.ok || planets.data.years.length === 0 || planets.data.methods.length === 0 ? <Unavailable what="The Exoplanet Archive" error={planets.ok ? "The service returned no rows." : planets.error} /> : <Summary data={planets.data} />}
    </>
  );
}

function Summary({ data }: { data: ExoplanetSummary }) {
  const years = data.years.filter((y) => y.disc_year >= 1992);
  const peak = years.reduce((a, b) => (b.n > a.n ? b : a), years[0]);
  const top = data.methods[0];
  const thisYear = new Date().getUTCFullYear();
  const foundThisYear = data.years.find((y) => y.disc_year === thisYear)?.n ?? 0;

  return (
    <>
      <Stats>
        <Stat label="Confirmed planets" value={num(data.total)} hint="All discovery methods" />
        <Stat label={`Confirmed in ${thisYear}`} value={num(foundThisYear)} hint="So far this year" />
        <Stat label="Busiest year" value={peak?.disc_year ?? "—"} hint={peak ? `${num(peak.n)} planets` : undefined} />
        <Stat
          label="Leading method"
          value={top ? `${num((top.n / data.total) * 100)}%` : "—"}
          hint={top?.discoverymethod}
        />
      </Stats>

      <Section title="Discoveries per year" note="Since the first confirmed detection in 1992">
        <Panel className="p-4 sm:p-6">
          <div className="flex h-40 items-end gap-px sm:h-48 sm:gap-1" role="img" aria-label="Bar chart of exoplanet discoveries per year">
            {years.map((y) => (
              <div
                key={y.disc_year}
                title={`${y.disc_year}: ${num(y.n)} planets`}
                className={`min-h-px flex-1 rounded-t-sm transition-colors hover:bg-accent ${
                  y.disc_year === peak.disc_year ? "bg-accent" : "bg-white/60"
                }`}
                style={{ height: `${(y.n / peak.n) * 100}%` }}
              />
            ))}
          </div>
          <div className="mt-3 flex justify-between text-xs text-faint tabular-nums">
            <span>{years[0]?.disc_year}</span>
            <span>
              Peak: {num(peak.n)} in {peak.disc_year}
            </span>
            <span>{years[years.length - 1]?.disc_year}</span>
          </div>
        </Panel>
      </Section>

      <Section title="How they were found">
        <Panel>
          <ul className="divide-y divide-line">
            {data.methods.slice(0, 8).map((m) => (
              <li key={m.discoverymethod} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-3 text-sm sm:grid-cols-[minmax(0,12rem)_1fr_4rem] sm:px-5">
                <span className="truncate">{m.discoverymethod}</span>
                <span className="order-last col-span-2 sm:order-none sm:col-span-1">
                  <Meter value={m.n} max={top.n} />
                </span>
                <span className="text-right text-muted tabular-nums">{num(m.n)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </Section>

      <Section title="Recently confirmed" note="Radius and mass are relative to Earth">
        {data.latest.length === 0 ? (
          <Empty>No recent confirmations are listed yet.</Empty>
        ) : (
          <DataTable head={["Planet", "Year", "Method", "Radius", "Mass", "Orbit", "Distance"]}>
            {data.latest.map((p) => (
              <tr key={p.pl_name}>
                <td className="font-medium whitespace-nowrap">{p.pl_name}</td>
                <td className="text-muted">{p.disc_year}</td>
                <td className="whitespace-nowrap text-muted">{p.discoverymethod}</td>
                <td>{p.pl_rade == null ? "—" : `${num(p.pl_rade, 1)}×`}</td>
                <td>{p.pl_bmasse == null ? "—" : `${num(p.pl_bmasse, 1)}×`}</td>
                <td className="whitespace-nowrap text-muted">
                  {p.pl_orbper == null ? "—" : `${num(p.pl_orbper, 1)} days`}
                </td>
                <td className="whitespace-nowrap text-muted">
                  {p.sy_dist == null ? "—" : `${num(p.sy_dist * 3.26156)} ly`}
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Section>
    </>
  );
}
