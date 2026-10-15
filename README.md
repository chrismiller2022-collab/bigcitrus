# Big Citrus 🍊

Care calendar for a backyard orange tree in Savannah, GA, based on UGA Extension guidance and the live forecast.

- **Page (`index.html`)**: today's tasks by temperature, time of day and month; 7-day forecast with freeze, frost, heat, wind and rain chance; watering advice from rain vs. evapotranspiration; National Weather Service alerts; year-round calendar.
- **Calendar feed (`/calendar.ics`)**: Vercel function in `api/calendar.js`. Subscribe from Google Calendar (Other calendars → From URL). Query options: `?age=young|mature&setting=ground|pot`.
- **Shared data (`lib/care.js`)**: monthly tasks, dated reminders, thresholds and weather logic.

Weather from [Open-Meteo](https://open-meteo.com) (free, no key) and [api.weather.gov](https://www.weather.gov/documentation/services-web-api).

## Deploy
Import the repo in Vercel with the default settings (Framework: Other, no build command). No environment variables needed.
