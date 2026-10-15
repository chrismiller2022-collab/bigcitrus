// Climate summary for a location: hardiness zone and cautious frost dates.
// Zone comes from the official USDA 2023 map (phzmapi.org, by ZIP) when a ZIP is known;
// otherwise it is estimated from 20 years of ERA5 daily lows, which run a little warm
// on clear, calm nights, so the estimate is nudged 2°F colder.
const Care = require("./care.js");

const YEARS = [2005, 2024];

async function getJson(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.json();
}

async function getClimate({ lat, lon, zip }) {
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}` +
    `&start_date=${YEARS[0]}-01-01&end_date=${YEARS[1]}-12-31&daily=temperature_2m_min` +
    `&temperature_unit=fahrenheit&timezone=auto`;
  const [arch, usda] = await Promise.all([
    getJson(url),
    zip ? getJson(`https://phzmapi.org/${zip}.json`).catch(() => null) : null,
  ]);

  const byYear = {};
  arch.daily.time.forEach((t, i) => {
    const v = arch.daily.temperature_2m_min[i];
    if (v !== null) (byYear[t.slice(0, 4)] = byYear[t.slice(0, 4)] || []).push([t.slice(5), v]);
  });
  const years = Object.values(byYear);
  const extremeMin = years.reduce((s, y) => s + Math.min(...y.map(x => x[1])), 0) / years.length;
  const lasts = [], firsts = [];
  for (const y of years) {
    const spring = y.filter(([d, v]) => v <= 32 && d < "07-01"), fall = y.filter(([d, v]) => v <= 32 && d >= "07-01");
    if (spring.length) lasts.push(spring[spring.length - 1][0]);
    if (fall.length) firsts.push(fall[0][0]);
  }
  lasts.sort(); firsts.sort();
  // Cautious dates: frost is over by lastFrost in ~4 of 5 years, and hasn't arrived by firstFrost in ~4 of 5.
  const pick = (a, p) => a.length ? a[Math.min(a.length - 1, Math.floor(a.length * p))] : null;
  const zone = usda && usda.zone ? usda.zone : Care.zoneFromTemp(extremeMin - 2);
  return {
    zone, zoneSource: usda && usda.zone ? "usda" : "estimate",
    extremeMin: Math.round(extremeMin),
    lastFrost: pick(lasts, 0.8), firstFrost: pick(firsts, 0.2),
    frostYears: Math.round((lasts.length / years.length) * 100) / 100,
    timezone: arch.timezone,
  };
}

module.exports = { getClimate };
