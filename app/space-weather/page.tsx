import type { Metadata } from "next";
import { DataTable, Empty, PageHeader, Section, Stat, Stats, Tag, Unavailable } from "@/components/ui";
import { date, num } from "@/lib/format";
import { flareRank, getCmes, getFlares, getStorms } from "@/lib/nasa";

export const revalidate = 3600;
export const metadata: Metadata = { title: "Space weather" };

const flareTone = (cls: string) => (cls.startsWith("X") ? "accent" : cls.startsWith("M") ? "warn" : "neutral");

export default async function SpaceWeatherPage() {
  const [flares, cmes, storms] = await Promise.all([getFlares(), getCmes(), getStorms()]);

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

  return (
    <>
      <PageHeader api="DONKI" title="Space weather" endpoint="ccmc.gsfc.nasa.gov/DONKI/WS/get/{FLR|CME|GST}">
        DONKI is the log kept by NASA&apos;s space weather forecasters. Flares are graded A, B, C, M or X,
        each class ten times stronger than the last. Geomagnetic storms are measured on the Kp index, from 0
        to 9.
      </PageHeader>

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
