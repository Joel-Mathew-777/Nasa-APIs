import type { Metadata } from "next";
import Link from "next/link";
import { IssTracker } from "@/components/iss-tracker";
import { DataTable, Empty, PageHeader, Section, Unavailable } from "@/components/ui";
import { date, num } from "@/lib/format";
import { getIssTrack, getSatellites, SATELLITE_GROUPS, type SatelliteGroup } from "@/lib/space";

export const revalidate = 60;
export const metadata: Metadata = { title: "Satellites" };

export default async function SatellitesPage({
  searchParams,
}: {
  searchParams: Promise<{ group?: string | string[] }>;
}) {
  const raw = (await searchParams).group;
  const wanted = Array.isArray(raw) ? raw[0] : raw;
  const group = SATELLITE_GROUPS.find((g) => g.id === wanted) ?? SATELLITE_GROUPS[0];
  const [iss, sats] = await Promise.all([getIssTrack(), getSatellites(group.id)]);

  return (
    <>
      <PageHeader api="Where the ISS at · CelesTrak" title="Satellites" endpoint="api.wheretheiss.at/v1/satellites/25544">
        The International Space Station circles Earth about every 92 minutes, roughly 420 km up. Its position
        below comes live from the Where the ISS at API. Further down, CelesTrak publishes the orbital elements
        of tracked satellites, from which each orbit&apos;s height and period follow.
      </PageHeader>

      {!iss.ok ? <Unavailable what="The ISS position" error={iss.error} /> : <IssTracker initial={iss.data.now} track={iss.data.track} />}

      <Section title="Satellite orbits" note="CelesTrak GP data · refreshed every few hours">
        <GroupTabs active={group.id} />
        {!sats.ok ? (
          <Unavailable what="Orbital data" error={sats.error} />
        ) : sats.data.length === 0 ? (
          <Empty>CelesTrak lists no objects in this group.</Empty>
        ) : (
          <DataTable head={["Object", "NORAD ID", "Perigee", "Apogee", "Period", "Inclination", "Elements from (UTC)"]}>
            {sats.data.slice(0, 60).map((s) => (
              <tr key={s.noradId}>
                <td className="font-medium">{s.name}</td>
                <td className="text-muted">{s.noradId}</td>
                <td>{num(s.perigeeKm)} km</td>
                <td>{num(s.apogeeKm)} km</td>
                <td className="text-muted">{periodLabel(s.periodMin)}</td>
                <td className="text-muted">{num(s.inclination, 1)}°</td>
                <td className="whitespace-nowrap text-muted">{date(s.epoch, true)}</td>
              </tr>
            ))}
          </DataTable>
        )}
        {sats.ok && sats.data.length > 60 && (
          <p className="mt-3 text-sm text-faint">Showing 60 of {num(sats.data.length)} objects.</p>
        )}
      </Section>
    </>
  );
}

function periodLabel(min: number): string {
  return min < 600 ? `${num(min, 1)} min` : `${num(min / 60, 1)} h`;
}

function GroupTabs({ active }: { active: SatelliteGroup }) {
  return (
    <ul className="mb-5 flex flex-wrap gap-2">
      {SATELLITE_GROUPS.map((g) => (
        <li key={g.id}>
          <Link
            href={`/satellites?group=${g.id}`}
            scroll={false}
            aria-current={g.id === active ? "true" : undefined}
            className={`inline-block rounded-full border px-3 py-1.5 text-sm transition-colors sm:py-1 ${
              g.id === active ? "border-muted text-white" : "border-line text-muted hover:text-white"
            }`}
          >
            {g.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
