import type { Metadata } from "next";
import { DataTable, Empty, Meter, PageHeader, Section, Stat, Stats, Tag, Unavailable } from "@/components/ui";
import { num } from "@/lib/format";
import { getCloseApproaches, getNeoFeed, type Neo } from "@/lib/nasa";

export const revalidate = 3600;
export const metadata: Metadata = { title: "Near-Earth asteroids" };

export default async function AsteroidsPage() {
  const [neos, passes] = await Promise.all([getNeoFeed(), getCloseApproaches()]);

  return (
    <>
      <PageHeader api="NeoWs · SBDB Close Approach" title="Near-Earth asteroids" endpoint="api.nasa.gov/neo/rest/v1/feed">
        NeoWs lists every asteroid making a close approach on a given date, with its estimated size, speed
        and how far it will miss by. Distances are in lunar distances (LD): 1 LD is the gap between Earth and
        the Moon, about 384,400 km.
      </PageHeader>

      {!neos.ok ? (
        <Unavailable what="The asteroid feed" error={neos.error} />
      ) : neos.data.length === 0 ? (
        <Empty>No close approaches are listed for the next seven days.</Empty>
      ) : (
        <Week neos={neos.data} />
      )}

      <Section title="Closest passes in the next 60 days" note="JPL SBDB Close Approach API · within 10 LD">
        {!passes.ok ? (
          <Unavailable what="Close-approach data" error={passes.error} />
        ) : passes.data.length === 0 ? (
          <Empty>No passes within 10 lunar distances are predicted for the next 60 days.</Empty>
        ) : (
          <DataTable head={["Object", "Closest approach (UTC)", "Miss distance", "Relative speed", "Brightness (H)"]}>
            {passes.data.map((p) => (
              <tr key={`${p.name}-${p.when}`}>
                <td className="font-medium">{p.name}</td>
                <td className="text-muted">{p.when}</td>
                <td>{num(p.lunar, 2)} LD</td>
                <td className="text-muted">{num(p.kps, 1)} km/s</td>
                <td className="text-muted">{num(p.h, 1)}</td>
              </tr>
            ))}
          </DataTable>
        )}
      </Section>
    </>
  );
}

function Week({ neos }: { neos: Neo[] }) {
  const hazardous = neos.filter((n) => n.hazardous);
  const closest = neos[0];
  const largest = neos.reduce((a, b) => (b.maxM > a.maxM ? b : a));
  const farthest = Math.max(...neos.map((n) => n.lunar));

  return (
    <>
      <Stats>
        <Stat label="Approaches this week" value={num(neos.length)} hint="Next 7 days" />
        <Stat
          label="Potentially hazardous"
          value={num(hazardous.length)}
          hint="Large, with an orbit that nears Earth's"
        />
        <Stat label="Closest pass" value={`${num(closest.lunar, 1)} LD`} hint={closest.name} />
        <Stat label="Largest object" value={`${num(largest.maxM)} m`} hint={`${largest.name}, upper estimate`} />
      </Stats>

      <Section title="This week's approaches" note="Sorted by miss distance, closest first">
        <DataTable head={["Object", "Closest approach (UTC)", "Diameter", "Miss distance", "Speed", ""]}>
          {neos.map((n) => (
            <tr key={`${n.id}-${n.when}`}>
              <td className="font-medium">
                <a href={n.url} target="_blank" rel="noreferrer" className="hover:text-accent">
                  {n.name}
                </a>
              </td>
              <td className="whitespace-nowrap text-muted">{n.when}</td>
              <td className="whitespace-nowrap text-muted">
                {num(n.minM)}–{num(n.maxM)} m
              </td>
              <td className="w-56">
                <div className="flex items-center gap-3">
                  <span className="w-16 shrink-0 whitespace-nowrap">{num(n.lunar, 1)} LD</span>
                  <Meter value={n.lunar} max={farthest} />
                </div>
              </td>
              <td className="whitespace-nowrap text-muted">{num(n.kps, 1)} km/s</td>
              <td className="text-right">{n.hazardous && <Tag tone="accent">Hazardous</Tag>}</td>
            </tr>
          ))}
        </DataTable>
      </Section>
    </>
  );
}
