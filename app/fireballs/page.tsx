import type { Metadata } from "next";
import { DataTable, Empty, PageHeader, Section, Stat, Stats, Unavailable } from "@/components/ui";
import { WorldMap } from "@/components/world-map";
import { coords, date, num } from "@/lib/format";
import { getFireballs, type Fireball } from "@/lib/nasa";

export const revalidate = 3600;
export const metadata: Metadata = { title: "Fireballs" };

export default async function FireballsPage() {
  const fireballs = await getFireballs();

  return (
    <>
      <PageHeader api="CNEOS Fireball · GIBS" title="Fireballs" endpoint="ssd-api.jpl.nasa.gov/fireball.api">
        A fireball is a meteor bright enough to be picked up by US government sensors as it breaks apart in
        the atmosphere. JPL publishes where each one happened and how much energy it released, measured in
        kilotons of TNT.
      </PageHeader>

      {!fireballs.ok ? (
        <Unavailable what="Fireball data" error={fireballs.error} />
      ) : fireballs.data.length === 0 ? (
        <Empty>No fireballs are on record.</Empty>
      ) : (
        <Fireballs list={fireballs.data} />
      )}
    </>
  );
}

function Fireballs({ list }: { list: Fireball[] }) {
  const biggest = list.reduce((a, b) => (b.energyKt > a.energyKt ? b : a));
  const located = list.filter((f) => f.lat != null && f.lon != null);
  const speeds = list.flatMap((f) => (f.velKps == null ? [] : [f.velKps]));
  const oldest = list[list.length - 1];

  return (
    <>
      <Stats>
        <Stat label="Fireballs shown" value={num(list.length)} hint={`Since ${date(oldest.date)}`} />
        <Stat label="Most recent" value={date(list[0].date).replace(/, \d{4}$/, "")} hint={`${num(list[0].energyKt, 2)} kt`} />
        <Stat label="Most energetic" value={`${num(biggest.energyKt, 1)} kt`} hint={date(biggest.date)} />
        <Stat
          label="Fastest entry"
          value={speeds.length ? `${num(Math.max(...speeds), 1)} km/s` : "—"}
          hint="Where speed was measured"
        />
      </Stats>

      <Section title="Where they fell" note="Larger dots released more energy">
        <WorldMap
          points={located.map((f, i) => ({
            id: `${f.date}-${i}`,
            lat: f.lat!,
            lon: f.lon!,
            label: `${date(f.date)} · ${num(f.energyKt, 2)} kt`,
            size: 6 + Math.min(16, Math.sqrt(f.energyKt) * 5),
          }))}
        />
      </Section>

      <Section title="Latest fireballs" note="Newest first">
        <DataTable head={["Peak brightness (UTC)", "Location", "Impact energy", "Altitude", "Speed"]}>
          {list.slice(0, 30).map((f, i) => (
            <tr key={`${f.date}-${i}`}>
              <td className="whitespace-nowrap">{date(f.date, true)}</td>
              <td className="text-muted">{f.lat != null && f.lon != null ? coords(f.lat, f.lon) : "—"}</td>
              <td>{num(f.energyKt, 2)} kt</td>
              <td className="text-muted">{f.altKm == null ? "—" : `${num(f.altKm, 1)} km`}</td>
              <td className="text-muted">{f.velKps == null ? "—" : `${num(f.velKps, 1)} km/s`}</td>
            </tr>
          ))}
        </DataTable>
      </Section>
    </>
  );
}
