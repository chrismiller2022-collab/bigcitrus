// /api/climate?lat=..&lon=..&zip=..  ->  zone and frost dates (cached at the edge for 30 days)
const { getClimate } = require("../lib/climate.js");

module.exports = async function handler(req, res) {
  const q = req.query || {};
  const lat = Number(parseFloat(q.lat).toFixed(1)), lon = Number(parseFloat(q.lon).toFixed(1));
  if (!(lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180)) return res.status(400).json({ error: "lat/lon required" });
  const zip = /^\d{5}$/.test(q.zip || "") ? q.zip : "";
  try {
    const c = await getClimate({ lat, lon, zip });
    res.setHeader("Cache-Control", "public, s-maxage=2592000, stale-while-revalidate=86400");
    res.status(200).json(c);
  } catch (e) {
    res.status(502).json({ error: "climate lookup failed" });
  }
};
