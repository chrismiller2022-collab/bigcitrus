// iCalendar feed: /calendar.ics?lat=..&lon=..&name=..&state=..&zip=..&age=young|mature&setting=ground|pot
// Without a location it uses Savannah, GA. Subscribe from Google Calendar ("Other calendars" > "From URL").
const Care = require("../lib/care.js");
const { getClimate } = require("../lib/climate.js");

const esc = s => String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const compact = iso => iso.replace(/-/g, "");

// Lines over 75 octets must be folded (RFC 5545).
function fold(line) {
  const out = []; let cur = "";
  for (const ch of line) {
    if (Buffer.byteLength(cur + ch) > 74) { out.push(cur); cur = " "; }
    cur += ch;
  }
  out.push(cur);
  return out.join("\r\n");
}

function vevent(ev, stamp, tz) {
  const lines = ["BEGIN:VEVENT", `UID:${ev.uid}@bigcitrus`, `DTSTAMP:${stamp}`];
  if (ev.time) {
    lines.push(`DTSTART;TZID=${tz}:${compact(ev.date)}T${ev.time.replace(":", "")}00`, "DURATION:PT30M");
  } else {
    lines.push(`DTSTART;VALUE=DATE:${compact(ev.date)}`, `DTEND;VALUE=DATE:${compact(Care.shift(ev.date, 1))}`,
      "TRANSP:TRANSPARENT");
  }
  lines.push(`SUMMARY:${esc(ev.title)}`, `DESCRIPTION:${esc(ev.desc)}`);
  if (ev.alarm) lines.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(ev.title)}`,
    `TRIGGER:-PT${ev.alarm}M`, "END:VALARM");
  lines.push("END:VEVENT");
  return lines.map(fold).join("\r\n");
}

async function getJson(url, headers) {
  try {
    const r = await fetch(url, { headers });
    return r.ok ? await r.json() : null;
  } catch (e) { return null; }
}

// Prefer the edge-cached /api/climate response; fall back to computing it here.
async function climateFor(loc, host) {
  const lat = loc.lat.toFixed(1), lon = loc.lon.toFixed(1);
  if (host) {
    const c = await getJson(`https://${host}/api/climate?lat=${lat}&lon=${lon}${loc.zip ? `&zip=${loc.zip}` : ""}`);
    if (c && c.zone) return c;
  }
  try { return await getClimate({ lat, lon, zip: loc.zip }); } catch (e) { return null; }
}

module.exports = async function handler(req, res) {
  const q = req.query || {};
  const loc = Care.locFromParams(k => q[k]) || Care.DEFAULT_LOC;
  const isDefault = loc === Care.DEFAULT_LOC;
  const opts = { state: loc.state, age: q.age === "mature" ? "mature" : "young", setting: q.setting === "pot" ? "pot" : "ground" };

  const [climate, wx, nws] = await Promise.all([
    isDefault ? Care.DEFAULT_CLIMATE : climateFor(loc, req.headers && req.headers.host),
    getJson(Care.forecastUrl(loc, 0)),
    getJson(Care.alertsUrl(loc), { "User-Agent": "bigcitrus orange tree care calendar", Accept: "application/geo+json" }),
  ]);
  opts.climate = climate || Care.DEFAULT_CLIMATE;
  const tz = (wx && wx.timezone) || (climate && climate.timezone) || "America/New_York";

  const now = new Date(), y = Number(Care.todayKey(tz, now).slice(0, 4));
  const alerts = nws && nws.features ? nws.features.map(f => f.properties) : [];
  const events = [y - 1, y, y + 1].flatMap(yr => Care.plan(yr, opts))
    .map(e => ({ ...e, title: "🍊 " + e.title }))
    .concat(wx ? Care.weatherEvents(wx, alerts, opts) : []);
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");

  const body = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//bigcitrus//Orange Tree Care//EN", "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH", fold(`X-WR-CALNAME:${esc(`🍊 Orange Tree Care (${loc.name})`)}`), `X-WR-TIMEZONE:${tz}`,
    "REFRESH-INTERVAL;VALUE=DURATION:PT6H", "X-PUBLISHED-TTL:PT6H",
    ...events.map(e => vevent(e, stamp, tz)),
    "END:VCALENDAR",
  ].join("\r\n") + "\r\n";

  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader("Content-Disposition", 'inline; filename="orange-tree-care.ics"');
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=3600");
  res.status(200).send(body);
};
