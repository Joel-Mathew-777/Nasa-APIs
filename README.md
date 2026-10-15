# Open NASA

A Next.js site that shows what NASA's open APIs return, using live data. Each page is built from one or two APIs and explains what the data means.

**Live site:** [nasa-ap-is-brown.vercel.app](https://nasa-ap-is-brown.vercel.app)

## Run it

```bash
npm install
cp .env.example .env.local   # optional, see below
npm run dev                  # http://localhost:3000
```

Requires Node 20 or newer. `npm run build && npm start` serves the production build.

### API key

Only APOD and NeoWs need a key. Without one the app uses NASA's shared `DEMO_KEY`, which is limited to 30 requests an hour and 50 a day per IP address. A personal key is free and raises the limit to 1,000 an hour:

1. Sign up at [api.nasa.gov](https://api.nasa.gov). The key arrives by email.
2. Put it in `.env.local` as `NASA_API_KEY=your_key`.

The key is only read on the server, so it never reaches the browser.

## APIs used

| Page | API | Endpoint | Key | What the page shows |
| --- | --- | --- | --- | --- |
| `/apod` | Astronomy Picture of the Day | `api.nasa.gov/planetary/apod` | Yes | Today's picture and explanation, plus the previous eight days |
| `/asteroids` | Asteroids NeoWs | `api.nasa.gov/neo/rest/v1/feed` | Yes | Every asteroid passing Earth in the next 7 days: size, speed, miss distance, hazard flag |
| `/asteroids` | SBDB Close Approach Data | `ssd-api.jpl.nasa.gov/cad.api` | No | The closest predicted passes (within 10 lunar distances) over the next 60 days |
| `/space-weather` | DONKI | `ccmc.gsfc.nasa.gov/DONKI/WS/get/{FLR,CME,GST}` | No | Solar flares (30 days), coronal mass ejections (7 days), geomagnetic storms (55 days) |
| `/space-weather` | NOAA SWPC | `services.swpc.noaa.gov/{json,products}/...` | No | Live X-ray flux (flare class), solar wind, NOAA R/S/G scales, and the Kp index with a 3-day forecast |
| `/asteroids` | Sentry | `ssd-api.jpl.nasa.gov/sentry.api` | No | Asteroids whose future impact can't yet be ruled out, ranked by Palermo scale |
| `/launches` | Launch Library 2 | `ll.thespacedevs.com/2.3.0/launches/upcoming` | No | The next 12 launches worldwide with countdowns (free tier: 15 requests an hour) |
| `/launches` | Spaceflight News API | `api.spaceflightnewsapi.net/v4/articles` | No | The latest spaceflight news articles |
| `/satellites` | Where the ISS at | `api.wheretheiss.at/v1/satellites/25544` | No | The ISS position, polled live from the browser, over a one-orbit ground track |
| `/satellites` | CelesTrak GP | `celestrak.org/NORAD/elements/gp.php` | No | Orbital elements for stations, the brightest satellites, GPS and weather satellites (cached 4 hours, as CelesTrak asks) |
| `/visualizations` | Scientific Visualization Studio | `svs.gsfc.nasa.gov/api/search` | No | Keyword search across Goddard's data visualizations and animations |
| `/technology` | Technology Transfer | `technology.nasa.gov/api/api/{patent,software,spinoff}/{q}` | No | NASA patents, free software and spinoff products |
| `/earth` | EPIC | `epic.gsfc.nasa.gov/api/natural` | No | The latest full-disc photographs of Earth from the DSCOVR spacecraft |
| `/events` | EONET v3 | `eonet.gsfc.nasa.gov/api/v3/events` | No | Open wildfires, storms, volcanoes and icebergs, plotted on a map |
| `/fireballs` | CNEOS Fireball | `ssd-api.jpl.nasa.gov/fireball.api` | No | The 80 most recent atmospheric fireballs with location, energy and speed |
| `/exoplanets` | Exoplanet Archive (TAP) | `exoplanetarchive.ipac.caltech.edu/TAP/sync` | No | Total confirmed planets, discoveries per year, discovery methods, recent confirmations |
| `/library` | NASA Image and Video Library | `images-api.nasa.gov/search` | No | Keyword search across NASA's photo archive |
| `/events`, `/fireballs` | GIBS (WMS) | `gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi` | No | The Blue Marble base map behind the plotted points |

The home page combines several of these into four live figures and features today's APOD. If APOD is down, it shows the latest EPIC frame instead.

## What else is available

These are open NASA APIs the site does not use yet.

| API | Endpoint | Key | What it offers |
| --- | --- | --- | --- |
| NeoWs lookup and browse | `api.nasa.gov/neo/rest/v1/neo/{id}`, `/neo/browse` | Yes | Full orbit and every past and future close approach for one asteroid |
| DONKI, other event types | `ccmc.gsfc.nasa.gov/DONKI/WS/get/{SEP,IPS,MPC,RBE,HSS,notifications}` | No | Solar energetic particles, interplanetary shocks, radiation belt enhancements, forecaster notifications |
| EPIC enhanced, aerosol, cloud | `epic.gsfc.nasa.gov/api/{enhanced,aerosol,cloud}` | No | Other EPIC image collections, and any past date via `/date/YYYY-MM-DD` |
| EONET categories and sources | `eonet.gsfc.nasa.gov/api/v3/{categories,sources,layers}` | No | Event filtering by category, and matching imagery layers |
| Image Library assets | `images-api.nasa.gov/{asset,metadata,captions}/{nasa_id}` | No | Original files, EXIF metadata and video captions; search also covers video and audio |
| GIBS tiles | `gibs.earthdata.nasa.gov/wmts/...` | No | Over 1,000 daily global satellite layers as map tiles (WMTS, WMS, TWMS) |
| Earth imagery (Landsat) | `api.nasa.gov/planetary/earth/{imagery,assets}` | Yes | A Landsat 8 image for a latitude, longitude and date |
| TechPort | `techport.nasa.gov/api` | No | NASA's portfolio of technology development projects |
| Open Science Data Repository | `osdr.nasa.gov/osdr/data/` | No | Space biology experiments, datasets and metadata (formerly GeneLab) |
| Satellite Situation Center | `sscweb.gsfc.nasa.gov/WS/sscr/2` | No | Positions of spacecraft over time |
| SBDB, Scout, Horizons | `ssd-api.jpl.nasa.gov/{sbdb,scout,horizons}.api` | No | Small-body orbits, newly found objects, ephemerides |
| Mars, Moon and Vesta Trek | `trek.nasa.gov/tiles/...` | No | Planetary surface imagery as WMTS map tiles |
| TLE API | `tle.ivanstanojevic.me/api/tle` | No | Two-line orbital elements for Earth satellites (community-run, listed by NASA) |

Two APIs that appear in older tutorials no longer work:

- **Mars Rover Photos** (`api.nasa.gov/mars-photos`) has been retired and returns an error.
- **InSight Mars Weather** stopped when the lander's mission ended in 2022.

DONKI also moved hosts on 30 September 2026. The old `api.nasa.gov/DONKI` and `kauai.ccmc.gsfc.nasa.gov/DONKI` addresses now redirect to an announcement page, so this app calls `ccmc.gsfc.nasa.gov/DONKI` directly.

## How it works

- **Next.js 16 App Router, React 19, Tailwind CSS 4, TypeScript.** No other runtime dependencies.
- **All NASA requests run on the server.** [lib/nasa.ts](lib/nasa.ts) holds one typed function per API and reduces each response to the fields the pages use.
- **Responses are cached for an hour** (12 hours for exoplanets, 24 for image searches), which keeps the app inside the `DEMO_KEY` limit. Pages are prerendered and refreshed in the background.
- **A failing API does not break the page.** Each fetch returns either data or an error message, and the affected section shows a notice while the rest of the page renders.

```
app/                 one folder per page
components/          nav, shared UI, world map, EPIC viewer
lib/nasa.ts          API clients and types
lib/catalog.ts       the list of pages shown in the nav and on the home page
lib/format.ts        number, date and coordinate formatting
```

To add an API, write a fetcher in `lib/nasa.ts`, add a page under `app/`, and add an entry to `lib/catalog.ts`.

Data is courtesy of NASA, JPL and Caltech/IPAC. This project is not affiliated with or endorsed by NASA.
