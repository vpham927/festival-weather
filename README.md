# Festival Weather

Clean, simple current weather for festival sites — blended from multiple APIs for a clearer picture.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Festivals in Neon Postgres via Drizzle ORM, seeded from `src/data/festivals.ts`
- Weather aggregation via `/api/weather` (and server-side on festival pages)

## Weather sources


| Provider                                  | Key required             | Notes                    |
| ----------------------------------------- | ------------------------ | ------------------------ |
| [Open-Meteo](https://open-meteo.com)      | No                       | Always used              |
| [OpenWeather](https://openweathermap.org) | `OPENWEATHER_API_KEY`    | Current + forecast       |
| [Tomorrow.io](https://www.tomorrow.io)    | `TOMORROW_API_KEY`       | Realtime + forecast      |
| [WeatherAPI](https://www.weatherapi.com)  | `WEATHERAPI_API_KEY`     | Current + forecast       |
| [Google Weather](https://developers.google.com/maps/documentation/weather) | `GOOGLE_WEATHER_API_KEY` | Maps Platform Weather API |


The app works with **Open-Meteo alone**. Extra keys raise confidence when sources agree.

## Caching

Weather responses are cached **in memory** (works in `next dev` and production) so refreshes don’t re-hit every API.

- Default TTL: **30 minutes**
- Override with `WEATHER_CACHE_TTL_SECONDS` (e.g. `3600` while testing)
- Set `0` to disable
- Restart the dev server clears the cache (process memory)

Providers also set Next.js `fetch` revalidate tags (5–30 min); the in-memory layer is what protects you during local testing.

## Setup

```bash
npm install
cp .env.local.example .env.local
# add OPENWEATHER_API_KEY, TOMORROW_API_KEY, WEATHERAPI_API_KEY
# optional: WEATHER_CACHE_TTL_SECONDS=3600
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database

Festivals live in Postgres (Neon) and are read through `src/data/festival-repository.ts`. Without `DATABASE_URL` the app logs a warning and serves the curated list in `src/data/festivals.ts`, so it runs before the database exists.

```bash
# 1. Create a project at https://neon.tech and copy the connection string
#    into DATABASE_URL in .env.local
# 2. Create the table
npm run db:migrate
# 3. Load the curated festivals (safe to re-run — it upserts by id)
npm run db:seed
```

| Script              | What it does                                        |
| ------------------- | --------------------------------------------------- |
| `npm run db:migrate`| Applies SQL migrations from `drizzle/`              |
| `npm run db:generate`| Regenerates migration SQL after editing the schema |
| `npm run db:push`   | Pushes the schema straight to the DB (quick dev use) |
| `npm run db:seed`   | Upserts `festivalSeed` into the `festivals` table   |
| `npm run db:import-uk` | Regenerates UK rows from TripSapien + geocoding  |
| `npm run db:studio` | Opens Drizzle Studio to browse rows                 |

Schema lives in `src/db/schema.ts`: slug `id` primary key, `name`, `location`, `country`, `lat`/`lon`, `start_date`/`end_date`, `website`, `icon_url`, `category` (`music` | `film` | `food` | `other`), timestamps, plus indexes on start date, country, and category. Search filtering runs in SQL (`ilike`), so the table can grow worldwide without shipping every row to the client.

## Festivals

The seed list is the UK slice of the [TripSapien festival calendar](https://github.com/forrestmill-cmd/tripsapien-public-data) (CC BY 4.0), geocoded to city centres, plus hand-curated venue overrides in `curatedFestivals`.

```bash
# Refresh generated UK rows (writes src/data/uk-festivals.generated.ts)
npm run db:import-uk
# Upsert into Neon
npm run db:seed
```

To tweak a known festival (precise venue coords / official site), edit `curatedFestivals` in `src/data/festivals.ts`, then re-run `npm run db:seed`. Each festival needs:

- `id` — URL slug  
- `name`, `location`, `country` (ISO 3166-1 alpha-2, e.g. `GB`)  
- `lat`, `lon`  
- `startDate`, `endDate` — `YYYY-MM-DD` (shown on the page; weather uses lat/lon)  
- `website` — official site URL  
- `iconUrl` — icon/favicon image URL (seed defaults from the website host if omitted)

## API

`GET /api/weather?lat=&lon=`

Returns consensus **current** conditions plus per-source payloads.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run db:migrate   # see Database above
npm run db:seed
```

