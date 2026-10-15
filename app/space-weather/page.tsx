import type { Metadata } from "next";
import { DataTable, Empty, PageHeader, Panel, Section, Stat, Stats, Tag, Unavailable } from "@/components/ui";
import { date, num } from "@/lib/format";
import { flareRank, getCmes, getFlares, getStorms } from "@/lib/nasa";
import { getKp, getNoaaScales, getSolarWind, getXrayFlux, type KpReading } from "@/lib/space";

export const revalidate = 600;
export const metadata: Metadata = { title: "Space weather" };

const flareTone = (cls: string) => (cls.startsWith("X") ? "accent" : cls.startsWith("M") ? "warn" : "neutral");

export default async function SpaceWeatherPage() {
  const [flares, cmes, storms, kp, wind, xray, scales] = await Promise.all([
    getFlares(),
    getCmes(),
    getStorms(),
    getKp(),
    getSolarWind(),
    getXrayFlux(),
    getNoaaScales(),
  ]);

  const strongest = flares.ok
    ? flares.data.reduce<string | null>(
        (best, f) => (best == null || flareRank(f.classType) > flareRank(best) ? f.classType : best),
        null,
      )
    : null;
  const majorFlares = flares.ok ? flares.data.filter((f) => /^[MX]/.test(f.classType)).length : 0;
  const stormKp = (s: { allKpIndex: { kpIndex: number }[] | null }) =>
    Math.max(0, ...(s.allKpIndex ?? []).map((k) => k.kpIndex));
  const peakKp = storms.ok ? Math.max(0, ...storms.data.map(stormKp)) : 0;
  const measured = kp.ok ? kp.data.filter((r) => r.kind !== "predicted") : [];
  const kpNow = measured[measured.length - 1];
  const forecast = kp.ok ? kp.data.filter((r) => r.kind === "predicted") : [];
  const kpNext = forecast.length ? Math.max(...forecast.map((r) => r.kp)) : null;

  return (
    <>
      <PageHeader api="NOAA SWPC · DONKI" title="Space weather" endpoint="services.swpc.noaa.gov/json · ccmc.gsfc.nasa.gov/DONKI">
        NOAA&apos;s Space Weather Prediction Center publishes live readings from satellites watching the Sun,
        and DONKI is the log kept by NASA&apos;s forecasters. Flares are graded A, B, C, M or X, each class ten
        times stronger than the last. Geomagnetic storms are measured on the Kp index, from 0 to 9.
      </PageHeader>

      <Stats>
        <Stat
          label="X-ray flux now"
          value={xray.ok ? xray.data.class : "—"}
          hint={xray.ok ? `6-hour peak ${xray.data.peak.class}` : xray.error}
        />
        <Stat
          label="Solar wind"
          value={wind.ok ? `${num(wind.data.speed)} km/s` : "—"}
          hint={wind.ok ? `Bz ${num(wind.data.bz)} nT · Bt ${num(wind.data.bt)} nT` : wind.error}
        />
        <Stat
          label="Kp index now"
          value={kpNow ? num(kpNow.kp, 2) : "—"}
          hint={kpNext ? `Forecast peak ${num(kpNext, 2)} in 3 days` : kp.ok ? undefined : kp.error}
        />
        <Stat
          label="NOAA scales"
          value={scales.ok ? `R${scales.data.r} S${scales.data.s} G${scales.data.g}` : "—"}
          hint={scales.ok ? "Radio · radiation · storms, 0–5" : scales.error}
        />
      </Stats>

      <Section title="Kp index" note="NOAA SWPC · 3-hour readings, past week and forecast">
        {!kp.ok ? (
          <Unavailable what="Kp data" error={kp.error} />
        ) : kp.data.length === 0 ? (
          <Empty>No Kp readings are available.</Empty>
        ) : (
          <KpChart readings={kp.data} />
        )}
      </Section>

      <Section title="The past month" note="DONKI">
        <Stats>
          <Stat label="Solar flares" value={flares.ok ? num(flares.data.length) : "—"} hint="Last 30 days" />
          <Stat
            label="Strongest flare"
            value={strongest ?? "—"}
            hint={flares.ok ? `${num(majorFlares)} of class M or X` : undefined}
          />
          <Stat label="Coronal mass ejections" value={cmes.ok ? num(cmes.data.length) : "—"} hint="Last 7 days" />
          <Stat
            label="Geomagnetic storms"
            value={storms.ok ? num(storms.data.length) : "—"}
            hint={storms.ok && storms.data.length > 0 ? `Peak Kp ${num(peakKp, 2)} in 55 days` : "Last 55 days"}
          />
        </Stats>
      </Section>

      <Section title="Solar flares" note="Last 30 days, newest first">
        {!flares.ok ? (
          <Unavailable what="Flare data" error={flares.error} />
        ) : flares.data.length === 0 ? (
          <Empty>No flares were logged in the last 30 days.</Empty>
        ) : (
          <DataTable head={["Class", "Began (UTC)", "Peaked (UTC)", "Location on Sun", "Active region", ""]}>
            {flares.data.slice(0, 40).map((f) => (
              <tr key={f.flrID}>
                <td>
                  <Tag tone={flareTone(f.classType)}>{f.classType}</Tag>
                </td>
                <td className="whitespace-nowrap">{date(f.beginTime, true)}</td>
                <td className="whitespace-nowrap text-muted">{f.peakTime ? date(f.peakTime, true) : "—"}</td>
                <td className="text-muted">{f.sourceLocation || "—"}</td>
                <td className="text-muted">{f.activeRegionNum ? `AR ${f.activeRegionNum}` : "—"}</td>
                <td className="text-right">
                  <a href={f.link} target="_blank" rel="noreferrer" className="text-muted hover:text-white">
                    Details ↗
                  </a>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Section>

      <Section title="Coronal mass ejections" note="Last 7 days">
        {!cmes.ok ? (
          <Unavailable what="CME data" error={cmes.error} />
        ) : cmes.data.length === 0 ? (
          <Empty>No coronal mass ejections were logged in the last 7 days.</Empty>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {cmes.data.slice(0, 12).map((c) => {
              const analysis = c.cmeAnalyses?.find((a) => a.isMostAccurate) ?? c.cmeAnalyses?.[0];
              return (
                <li key={c.activityID} className="rounded-xl border border-line bg-panel p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="font-medium tabular-nums">{date(c.startTime, true)} UTC</p>
                    {analysis?.speed != null && (
                      <p className="shrink-0 text-sm text-muted tabular-nums">{num(analysis.speed)} km/s</p>
                    )}
                  </div>
                  {c.note && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{c.note}</p>}
                  <a
                    href={c.link}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-block text-sm text-muted hover:text-white"
                  >
                    Details ↗
                  </a>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section title="Geomagnetic storms" note="Last 55 days">
        {!storms.ok ? (
          <Unavailable what="Storm data" error={storms.error} />
        ) : storms.data.length === 0 ? (
          <Empty>No geomagnetic storms were logged in the last 55 days.</Empty>
        ) : (
          <DataTable head={["Began (UTC)", "Peak Kp index", "Readings", ""]}>
            {storms.data.map((s) => (
              <tr key={s.gstID}>
                <td className="whitespace-nowrap">{date(s.startTime, true)}</td>
                <td>{num(stormKp(s), 2)}</td>
                <td className="text-muted">{s.allKpIndex?.length ?? 0}</td>
                <td className="text-right">
                  <a href={s.link} target="_blank" rel="noreferrer" className="text-muted hover:text-white">
                    Details ↗
                  </a>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </Section>
    </>
  );
}

/** Kp of 5 or more is a geomagnetic storm (NOAA G1 and up). */
function kpBar(r: KpReading): string {
  const storm = r.kp >= 5;
  if (r.kind === "predicted") return storm ? "bg-accent/50" : "bg-white/20";
  return storm ? "bg-accent" : r.kind === "estimated" ? "bg-white/40" : "bg-white/60";
}

function KpChart({ readings }: { readings: KpReading[] }) {
  const firstPredicted = readings.find((r) => r.kind === "predicted");
  return (
    <Panel className="p-4 sm:p-6">
      <div className="flex h-40 items-end gap-px sm:h-48" role="img" aria-label="Bar chart of the Kp index over ten days">
        {readings.map((r) => (
          <div
            key={r.time}
            title={`${date(r.time, true)} UTC · Kp ${num(r.kp, 2)} (${r.kind})`}
            className={`min-h-px flex-1 rounded-t-sm transition-colors hover:bg-white ${kpBar(r)}`}
            style={{ height: `${(r.kp / 9) * 100}%` }}
          />
        ))}
      </div>
      <div className="mt-3 flex justify-between gap-4 text-xs text-faint tabular-nums">
        <span>{date(readings[0].time)}</span>
        {firstPredicted && <span>Forecast from {date(firstPredicted.time, true)}</span>}
        <span>{date(readings[readings.length - 1].time)}</span>
      </div>
      <p className="mt-3 text-xs text-faint">
        Solid bars are measured, faint bars forecast. Orange marks storm levels (Kp 5 or more), when aurora
        can reach lower latitudes.
      </p>
    </Panel>
  );
}
