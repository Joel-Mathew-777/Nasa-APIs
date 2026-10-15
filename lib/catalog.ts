export type CatalogEntry = {
  href: string;
  nav: string;
  api: string;
  title: string;
  blurb: string;
  host: string;
  keyed: boolean;
};

export const catalog: CatalogEntry[] = [
  {
    href: "/apod",
    nav: "APOD",
    api: "APOD",
    title: "Astronomy Picture of the Day",
    blurb: "One image or video of the cosmos each day, explained by a professional astronomer.",
    host: "api.nasa.gov/planetary/apod",
    keyed: true,
  },
  {
    href: "/asteroids",
    nav: "Asteroids",
    api: "NeoWs · SBDB Close Approach · Sentry",
    title: "Near-Earth asteroids",
    blurb: "Every object passing Earth this week: size, speed, miss distance and hazard status.",
    host: "api.nasa.gov/neo · ssd-api.jpl.nasa.gov/{cad,sentry}.api",
    keyed: true,
  },
  {
    href: "/space-weather",
    nav: "Space weather",
    api: "NOAA SWPC · DONKI",
    title: "Space weather",
    blurb: "Live X-ray flux, solar wind and Kp forecast, plus the flares, CMEs and storms forecasters log.",
    host: "services.swpc.noaa.gov · ccmc.gsfc.nasa.gov/DONKI",
    keyed: false,
  },
  {
    href: "/launches",
    nav: "Launches",
    api: "Launch Library 2 · Spaceflight News",
    title: "Rocket launches",
    blurb: "Every upcoming launch worldwide with a live countdown, and the latest spaceflight news.",
    host: "ll.thespacedevs.com · api.spaceflightnewsapi.net",
    keyed: false,
  },
  {
    href: "/satellites",
    nav: "Satellites",
    api: "Where the ISS at · CelesTrak",
    title: "Satellites",
    blurb: "The space station's live position and ground track, and the orbits of tracked satellites.",
    host: "api.wheretheiss.at · celestrak.org",
    keyed: false,
  },
  {
    href: "/earth",
    nav: "Earth",
    api: "EPIC",
    title: "Earth from a million miles",
    blurb: "Full-disc portraits of the sunlit Earth taken by DSCOVR from the L1 Lagrange point.",
    host: "epic.gsfc.nasa.gov/api",
    keyed: false,
  },
  {
    href: "/events",
    nav: "Events",
    api: "EONET · GIBS",
    title: "Natural events",
    blurb: "Wildfires, storms, volcanoes and icebergs currently tracked from orbit, on a live map.",
    host: "eonet.gsfc.nasa.gov/api/v3",
    keyed: false,
  },
  {
    href: "/fireballs",
    nav: "Fireballs",
    api: "CNEOS Fireball · GIBS",
    title: "Fireballs",
    blurb: "Bright meteors that exploded in the atmosphere, with impact energy and location.",
    host: "ssd-api.jpl.nasa.gov/fireball.api",
    keyed: false,
  },
  {
    href: "/exoplanets",
    nav: "Exoplanets",
    api: "Exoplanet Archive",
    title: "Exoplanets",
    blurb: "Every confirmed planet beyond the solar system, queryable with SQL-like ADQL.",
    host: "exoplanetarchive.ipac.caltech.edu/TAP",
    keyed: false,
  },
  {
    href: "/library",
    nav: "Library",
    api: "Image and Video Library",
    title: "Image library",
    blurb: "Search more than a century of NASA photography, from Mercury capsules to Webb.",
    host: "images-api.nasa.gov",
    keyed: false,
  },
  {
    href: "/visualizations",
    nav: "Visualizations",
    api: "Scientific Visualization Studio",
    title: "Visualizations",
    blurb: "Animations built from mission data at Goddard: sea ice, hurricanes, eclipses and more.",
    host: "svs.gsfc.nasa.gov/api",
    keyed: false,
  },
  {
    href: "/technology",
    nav: "Technology",
    api: "Technology Transfer",
    title: "NASA technology",
    blurb: "Patents NASA licenses, software it gives away, and products that grew out of its work.",
    host: "technology.nasa.gov/api",
    keyed: false,
  },
];
