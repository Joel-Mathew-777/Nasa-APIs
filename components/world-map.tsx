/** Blue Marble base map rendered by the GIBS WMS service (equirectangular). */
const WORLD_MAP =
  "https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0" +
  "&LAYERS=BlueMarble_ShadedRelief_Bathymetry&CRS=EPSG:4326&BBOX=-90,-180,90,180&WIDTH=1600&HEIGHT=800&FORMAT=image/jpeg";

export type MapPoint = {
  id: string;
  lat: number;
  lon: number;
  label: string;
  color?: string;
  /** Dot diameter in pixels. */
  size?: number;
};

/** Equirectangular world map (GIBS Blue Marble) with points placed by lat/lon. */
export function WorldMap({ points }: { points: MapPoint[] }) {
  return (
    <div className="relative aspect-2/1 overflow-hidden rounded-xl border border-line bg-panel">
      <img
        src={WORLD_MAP}
        alt="World map"
        className="absolute inset-0 size-full object-cover opacity-55 saturate-50"
      />
      {points.map((p) => {
        const size = p.size ?? 8;
        return (
          <span
            key={p.id}
            title={p.label}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-ink/70 transition-transform hover:z-10 hover:scale-150"
            style={{
              left: `${((p.lon + 180) / 360) * 100}%`,
              top: `${((90 - p.lat) / 180) * 100}%`,
              width: size,
              height: size,
              background: p.color ?? "var(--color-accent)",
            }}
          />
        );
      })}
    </div>
  );
}
