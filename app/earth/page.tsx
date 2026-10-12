import type { Metadata } from "next";
import { EpicViewer } from "@/components/epic-viewer";
import { Empty, PageHeader, Unavailable } from "@/components/ui";
import { getEpic } from "@/lib/nasa";

export const revalidate = 3600;
export const metadata: Metadata = { title: "Earth from a million miles" };

export default async function EarthPage() {
  const epic = await getEpic();

  return (
    <>
      <PageHeader api="EPIC" title="Earth from a million miles" endpoint="epic.gsfc.nasa.gov/api/natural">
        The EPIC camera on the DSCOVR spacecraft sits between Earth and the Sun and photographs the whole
        sunlit face of the planet several times a day. These are the most recent frames; step through them to
        watch the Earth turn.
      </PageHeader>

      {!epic.ok ? (
        <Unavailable what="EPIC imagery" error={epic.error} />
      ) : epic.data.length === 0 ? (
        <Empty>No recent frames have been published.</Empty>
      ) : (
        <EpicViewer frames={epic.data} />
      )}
    </>
  );
}
