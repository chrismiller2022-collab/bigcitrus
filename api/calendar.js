// iCalendar feed: /calendar.ics?age=young|mature&setting=ground|pot
// Subscribe to it from Google Calendar ("Other calendars" > "From URL").
const Care = require("../lib/care.js");

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

function vevent(ev, stamp) {
  const lines = ["BEGIN:VEVENT", `UID:${ev.uid}@citrus-care`, `DTSTAMP:${stamp}`];
  if (ev.time) {
    const t = ev.time.replace(":", "") + "00";
    lines.push(`DTSTART;TZID=${Care.TZ}:${compact(ev.date)}T${t}`, "DURATION:PT30M");
  } else {
    const next = new Date(ev.date + "T12:00:00Z"); next.setUTCDate(next.getUTCDate() + 1);
    lines.push(`DTSTART;VALUE=DATE:${compact(ev.date)}`, `DTEND;VALUE=DATE:${compact(next.toISOString().slice(0, 10))}`,
      "TRANSP:TRANSPARENT");
  }
  lines.push(`SUMMARY:${esc(ev.title)}`, `DESCRIPTION:${esc(ev.desc)}`);
  if (ev.alarm) lines.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(ev.title)}`,
    `TRIGGER:-PT${ev.alarm}M`, "END:VALARM");
  lines.push("END:VEVENT");
  return lines.map(fold).join("\r\n");
}

function seasonalEvents(opts, now) {
  const y = Number(Care.todayKey(now).slice(0, 4)), out = [];
  for (const year of [y - 1, y, y + 1]) {
    for (const s of Care.SEASONAL) {
      if (s.only === "young" && opts.age !== "young") continue;
      if (s.only === "pot" && opts.setting !== "pot") continue;
      if (s.only === "ground" && opts.setting === "pot") continue;
      const date = `${year}-${String(s.month).padStart(2, "0")}-${String(s.day).padStart(2, "0")}`;
      out.push({ uid: `${s.id}-${year}`, date, title: "🍊 " + s.title, desc: s.desc });
    }
  }
  return out;
}

async function getJson(url, headers) {
  try {
    const r = await fetch(url, { headers });
    return r.ok ? await r.json() : null;
  } catch (e) { return null; }
}

module.exports = async function handler(req, res) {
  const q = req.query || {};
  const opts = { age: q.age === "mature" ? "mature" : "young", setting: q.setting === "pot" ? "pot" : "ground" };
  const now = new Date();
  const [wx, nws] = await Promise.all([
    getJson(Care.forecastUrl(0)),
    getJson(Care.ALERTS_URL, { "User-Agent": "citrus-care calendar (personal orange tree app)", Accept: "application/geo+json" }),
  ]);
  const alerts = nws && nws.features ? nws.features.map(f => f.properties) : [];
  const events = seasonalEvents(opts, now).concat(wx ? Care.weatherEvents(wx, alerts, opts) : []);
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");

  const body = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//citrus-care//Orange Tree Care//EN", "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH", "X-WR-CALNAME:🍊 Orange Tree Care", `X-WR-TIMEZONE:${Care.TZ}`,
    "REFRESH-INTERVAL;VALUE=DURATION:PT6H", "X-PUBLISHED-TTL:PT6H",
    ...events.map(e => vevent(e, stamp)),
    "END:VCALENDAR",
  ].join("\r\n") + "\r\n";

  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader("Content-Disposition", 'inline; filename="orange-tree-care.ics"');
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=3600");
  res.status(200).send(body);
};
