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
    api: "NeoWs · SBDB Close Approach",
    title: "Near-Earth asteroids",
    blurb: "Every object passing Earth this week: size, speed, miss distance and hazard status.",
    host: "api.nasa.gov/neo · ssd-api.jpl.nasa.gov/cad.api",
    keyed: true,
  },
  {
    href: "/space-weather",
    nav: "Space weather",
    api: "DONKI",
    title: "Space weather",
    blurb: "Solar flares, coronal mass ejections and geomagnetic storms as forecasters log them.",
    host: "ccmc.gsfc.nasa.gov/DONKI",
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
];
