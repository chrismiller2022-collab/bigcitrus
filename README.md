# Big Citrus 🍊

Care calendar for a backyard orange tree. Defaults to Savannah, GA (UGA Extension guidance); anyone can enter a US city, state or ZIP.

- **Page (`index.html`)**: location search; climate card (USDA hardiness zone, cautious frost dates, how well oranges fit); today's tasks from the live forecast (freeze, frost, heat, wind, rain chance, watering from rain vs. evapotranspiration); tree-relevant National Weather Service alerts; year-round calendar; sources for the state.
- **State guidance (`lib/care.js`)**: GA (UGA), SC (Clemson HGIC), FL (UF/IFAS), AL (ACES/Auburn), MS (Gulf Coast/Auburn), LA (LSU AgCenter), TX (AgriLife), AZ (Univ. of Arizona), CA (UC ANR), HI (CTAHR). Other states get generic container guidance and a link to their Extension service.
- **Climate (`api/climate.js`, `lib/climate.js`)**: zone from the USDA 2023 map by ZIP (phzmapi.org), else estimated; frost dates from 20 years of Open-Meteo history. Cached at the edge for 30 days.
- **Calendar feed (`/calendar.ics`, `api/calendar.js`)**: seasonal reminders plus forecast-driven freeze events. Params: `lat, lon, name, state, zip, age=young|mature, setting=ground|pot`. No params = Savannah.

Your location and settings are stored only in your browser (localStorage). Nothing is stored on the server.

## Deploy
Import in Vercel with default settings (Framework: Other, no build command, no environment variables).
