// Shared care logic for the page (window.Care) and the calendar feed (require).
(function (root) {
  const DEFAULT_LOC = { name: "Savannah", state: "Georgia", lat: 32.0835, lon: -81.0998, zip: "31401" };
  // Savannah climate, used until the climate lookup answers (or if it fails).
  const DEFAULT_CLIMATE = { zone: "9a", zoneSource: "usda", extremeMin: 24, lastFrost: "03-05", firstFrost: "11-29", frostYears: 1 };
  const T = { protect: 28, hard: 26, frost: 32, hot: 90, cool: 50, windy: 10, gusty: 20 };

  // Per-state guidance. fert: [month, day] dates for a mature tree, or "lastFrost" to key the
  // first feeding to the local climate. Only claims the cited sources make are stated here.
  const GUIDES = {
    Georgia: {
      org: "UGA Cooperative Extension",
      links: [
        ["Cold Protection and Citrus", "https://site.extension.uga.edu/colquitthomeowners/2022/01/cold-protection-and-citrus"],
        ["Oranges, grapefruits and tangerines from Georgia?", "https://fieldreport.caes.uga.edu/news/oranges-grapefruits-and-tangerines-from-georgia/"],
        ["B 1589 Freeze Injury and Protection Practices in Georgia Citrus", "https://extension.uga.edu/publications.html"]],
      fert: [[3, 15], [5, 1], [6, 15]], noFertAfter: 7,
      fertNote: "UGA split schedule: mid-March, May 1 and mid-June. No fertilizer after July so new growth hardens before winter.",
      water: "About 1 in. of water a week (rain plus watering) during bloom and fruit set.",
      bank: "Bank young trees (up to 4 years old) with clean soil about 15 in. up the trunk before the first freeze.",
      notes: [] },
    "South Carolina": {
      org: "Clemson Extension (HGIC)",
      links: [["In-Ground Citrus Production", "https://hgic.clemson.edu/factsheet/in-ground-citrus-production/"]],
      fert: [[3, 15], [5, 1], [6, 15]], noFertAfter: 7,
      fertNote: "Clemson: 6 feedings the first year, 5 the second, 4 the third, then 3 a year (rates by age in the factsheet). Finish by the end of July — later feeding leaves the tree too tender going into winter.",
      water: "Check the top 2–3 in. of soil before watering; never let the root ball dry out completely.",
      bank: "In November, mound soil around the tree to cover the graft union — protecting the graft union is what keeps trees alive in a hard freeze. Burlap, pipe insulation or pool noodles also work.",
      notes: ["Citrus greening quarantine: citrus plants can't be taken out of Charleston, Beaufort or Colleton counties."] },
    Florida: {
      org: "UF/IFAS Extension",
      links: [["UF/IFAS Home Citrus: Fertilizing", "https://crec.ifas.ufl.edu/home-citrus/fertilizing"],
              ["Late Winter Citrus Considerations (Panhandle)", "https://nwdistrict.ifas.ufl.edu/phag/2017/02/10/late-winter-citrus-considerations"]],
      fert: [[2, 15], [9, 15]], noFertAfter: 10, lateFrostShift: [3, 15],
      fertNote: "UF/IFAS recommends slow- or controlled-release citrus fertilizer twice a year: Feb/March before bloom and Sept/Oct. Young trees get lighter, more frequent feedings (6 the first year, tapering to 3 by year five). In the Panhandle, wait until mid-March for the first feeding.",
      water: "Water when the top few inches of soil are dry; keep fertilizer granules off the trunk.",
      bank: "Bank young trees with soil over the graft union before the first freeze.",
      notes: ["Citrus greening (HLB) is widespread: buy certified trees from a registered nursery and don't move citrus plants out of the area."] },
    Alabama: {
      org: "Alabama Cooperative Extension (ACES) / Auburn",
      links: [["Peel into Alabama Citrus Production", "https://www.aces.edu/blog/topics/farming/peel-into-alabama-citrus-production/"]],
      fert: [[3, 1], [5, 1], [6, 1]], noFertAfter: 8,
      fertNote: "Auburn's Satsuma production guide splits the yearly amount into three feedings (budbreak, fruit set, June). Avoid nitrogen from September to mid-February — it reduces cold hardiness.",
      water: "Keep soil evenly moist during bloom and fruit set.",
      bank: "Bank young trees with soil over the graft union before the first freeze; trees on trifoliate rootstock are the most cold-tolerant.",
      notes: [] },
    Mississippi: {
      org: "Gulf Coast guidance (Auburn) — MSU Extension has no current home citrus schedule online",
      links: [["MSU Extension county offices", "https://extension.msstate.edu/county-offices"]],
      fert: [[3, 15], [5, 1], [6, 15]], noFertAfter: 8,
      fertNote: "Three feedings, March through June (Auburn's Gulf Coast schedule). Avoid nitrogen from September to mid-February.",
      water: "Keep soil evenly moist during bloom and fruit set.",
      bank: "Bank young trees with soil over the graft union before the first freeze.",
      notes: ["Ask your county Extension office for a soil test before feeding."] },
    Louisiana: {
      org: "LSU AgCenter",
      links: [["How to prune and fertilize citrus", "https://www.lsuagcenter.com/profiles/tviso/articles/page1614365011069"]],
      fert: [[2, 1]],
      fertNote: "LSU AgCenter: one feeding in late January–early February — 1 to 1½ lb of 8-8-8 (or 13-13-13) per year of tree age, up to 12 years. Newly planted trees: wait for new growth, then ½ lb in mid-March. More than this delays fruit and lowers cold hardiness.",
      water: "Keep soil evenly moist during bloom and fruit set.",
      bank: "Bank young trees with soil over the graft union before the first freeze.",
      notes: [] },
    Texas: {
      org: "Texas A&M AgriLife Extension",
      links: [["Time to Fertilize Citrus (Travis County)", "https://travis-tx.tamu.edu/?p=10631"],
              ["Growing Your Own Citrus (Bexar County)", "https://bexar-tx.tamu.edu/homehort/archives-of-weekly-articles-davids-plant-of-the-week/growing-your-own-citrus-part-1/"]],
      fert: "lastFrost",
      fertNote: "AgriLife: feed in late winter as the cold ends (around Valentine's Day in Austin; earlier in the Valley, later up north), using a fertilizer with micronutrients for alkaline soils. Container trees: slow-release fertilizer in early spring.",
      water: "Water deeply when the top few inches of soil are dry.",
      bank: "Plant on the south or southeast side of the house for cold protection; bank young trees with soil before a freeze.",
      notes: [] },
    Arizona: {
      org: "University of Arizona Cooperative Extension",
      links: [["Citrus Fertilization Chart for Arizona (AZ1671)", "https://extension.arizona.edu/pubs/citrus-fertilization-chart-arizona"]],
      fert: [[2, 1], [4, 1], [6, 1]], noFertAfter: 10,
      fertNote: "AZ1671: oranges get ⅓ of the yearly amount in Jan–Feb, ⅓ in Mar–Apr and ⅓ in May–Jun. Never fertilize after October.",
      water: "Water deeply (2–3 ft down) every 7–10 days in summer and every 2–4 weeks in winter; let the top 6 in. dry out between waterings.",
      bank: "",
      notes: [] },
    California: {
      org: "UC Agriculture and Natural Resources",
      links: [["UC IPM: Fertilizing Citrus", "https://ipm.ucanr.edu/home-and-landscape/fertilizing-citrus/"]],
      fert: [[2, 1], [5, 1], [6, 15]],
      fertNote: "UC IPM: nitrogen in January or February just before bloom, again in May and perhaps June. Late-season feeding can delay coloring and roughen the rind.",
      water: "Little summer rain: water deeply whenever the top few inches of soil are dry.",
      bank: "",
      notes: [] },
    Hawaii: {
      org: "UH Mānoa CTAHR",
      links: [["Citrus for Hawai‘i's Yards and Gardens (FN-14)", "https://scholarspace.manoa.hawaii.edu/items/ab0737e8-5890-4796-9fff-a8375be072f8"]],
      fert: [],
      fertNote: "Feed regularly through the year following the fertilizer label; see CTAHR's FN-14 for rates.",
      water: "Water deeply and less often rather than shallow and frequent.",
      bank: "", notes: [] },
  };
  const OTHER = {
    org: "your state's Cooperative Extension service",
    links: [["Find your land-grant university Extension", "https://www.nifa.usda.gov/land-grant-colleges-and-universities-partner-website-directory"]],
    fert: "lastFrost",
    fertNote: "Feed with a slow-release citrus fertilizer in spring after the last frost, following the label. Your local Extension office can give state-specific timing.",
    water: "Water when the top few inches of soil are dry; container trees may need water every day in summer heat.",
    bank: "", notes: [] };
  const guideFor = state => GUIDES[state] || OTHER;

  // ---- climate ----
  const zoneNum = z => { const m = /^(\d+)([ab])?$/.exec(z || ""); return m ? Number(m[1]) + (m[2] === "b" ? 0.5 : 0) : null; };
  function zoneFromTemp(t) {
    const i = Math.floor((t + 60) / 5);
    return `${Math.floor(i / 2) + 1}${i % 2 ? "b" : "a"}`;
  }
  const frostFree = c => !c.lastFrost || c.frostYears < 0.3;

  // How well an orange tree fits this climate.
  function verdict(c) {
    const z = zoneNum(c.zone);
    if (z === null) return { level: "unknown", text: "Couldn't determine the hardiness zone for this location." };
    if (z >= 10) return { level: "great", text: `Zone ${c.zone}: oranges grow well in the ground here${frostFree(c) ? " and freezes are rare." : ", with occasional frost protection."}` };
    if (z >= 9.5) return { level: "good", text: `Zone ${c.zone}: good for an in-ground orange tree with protection on the coldest nights.` };
    if (z >= 9) return { level: "ok", text: `Zone ${c.zone}: in-ground oranges work with freeze protection most winters (cover the tree, bank young trunks).` };
    if (z >= 8.5) return { level: "marginal", text: `Zone ${c.zone}: marginal for sweet oranges — expect freeze damage in many winters. Grow in a container you can move indoors, or choose a hardier satsuma.` };
    return { level: "pot", text: `Zone ${c.zone}: too cold for an orange tree outdoors year-round. Grow it in a container and bring it indoors when nights drop toward 32°F.` };
  }

  // ---- dated reminders for a given year ----
  function md(year, s) { return `${year}-${s}`; }
  function shift(iso, days) {
    const d = new Date(iso + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10);
  }
  const pad = n => String(n).padStart(2, "0");

  // opts: { state, climate, age: young|mature, setting: ground|pot }
  function plan(year, opts) {
    const g = guideFor(opts.state), c = opts.climate || DEFAULT_CLIMATE;
    const pot = opts.setting === "pot", young = opts.age === "young", ff = frostFree(c);
    const out = [];
    const add = (id, date, title, desc) => out.push({ uid: `${id}-${year}`, date, title, desc });

    let fert = g.fert === "lastFrost"
      ? [[...(ff ? "02-15" : c.lastFrost).split("-").map(Number)]]
      : g.fert.map(x => x.slice());
    if (g.lateFrostShift && !ff && c.lastFrost > "03-01" && fert.length) fert[0] = g.lateFrostShift;
    fert.forEach(([m, d], i) => add(`fert${i + 1}`, `${year}-${pad(m)}-${pad(d)}`,
      `Fertilize orange tree${fert.length > 1 ? ` (${i + 1} of ${fert.length})` : ""}`,
      g.fertNote + (young ? " Young tree: use the smaller amount for its size on the label." : "")));
    if (g.noFertAfter) add("nofert", `${year}-${pad(g.noFertAfter)}-${new Date(Date.UTC(year, g.noFertAfter, 0)).getUTCDate()}`,
      "Fertilizer season over", "No more feeding this year — late growth won't harden off before cold weather.");

    if (!ff) {
      const last = md(year, c.lastFrost), first = md(year, c.firstFrost);
      add("coldprep", shift(first, -30), "Get freeze gear ready",
        "Frost cloth big enough to reach the ground, incandescent (not LED) string lights, an outdoor-rated extension cord, and bricks or clips to hold the cloth down.");
      if (pot) add("potplan", shift(first, -14), "Plan a freeze spot for the container tree",
        "Garage or enclosed porch for freeze nights; a plant caddy makes moving it easy.");
      else {
        if (young && g.bank) add("bank", shift(first, -14), "Bank young tree with soil", g.bank);
        if (young && g.bank) add("unbank", shift(last, 7), "Pull soil bank away from young trunk",
          "Frost risk is mostly past. Remove the winter soil bank so the trunk can dry out.");
        add("prune", shift(last, 30), "Prune freeze damage & remove suckers",
          "New growth now shows where live wood ends. Cut back dead wood and remove shoots below the graft union.");
      }
    }
    add("pests1", `${year}-06-01`, "Check new growth for pests",
      "Look for citrus leafminer trails, scale, aphids and whiteflies (sooty mold is a sign). Spray oils only below 90°F, early morning or evening.");
    add("pests2", `${year}-08-15`, "Check late-summer growth for pests",
      "Inspect for scale and leafminer. Water evenly in dry spells to prevent fruit splitting.");
    add("harvest", `${year}-11-01`, "Start taste-testing oranges",
      "Many oranges ripen late fall into winter. Color isn't a reliable sign, and fruit doesn't ripen off the tree.");
    return out.sort((a, b) => a.date.localeCompare(b.date));
  }

  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  // Twelve monthly task lists for the page.
  function monthly(year, opts) {
    const c = opts.climate || DEFAULT_CLIMATE, g = guideFor(opts.state), ff = frostFree(c);
    const events = plan(year, opts);
    const lastM = ff ? -1 : Number(c.lastFrost.slice(0, 2)) - 1, firstM = ff ? -1 : Number(c.firstFrost.slice(0, 2)) - 1;
    const inFrost = m => !ff && (firstM <= lastM ? m >= firstM && m <= lastM : m >= firstM || m <= lastM);
    return MONTHS.map((name, m) => {
      const tasks = events.filter(e => Number(e.date.slice(5, 7)) - 1 === m)
        .map(e => `${e.title} (${Number(e.date.slice(8))} ${name.slice(0, 3)}).`);
      if (inFrost(m)) tasks.unshift(opts.setting === "pot"
        ? "Freeze season: move the container indoors on nights forecast at 32°F or below."
        : "Freeze season: cover the tree when lows are forecast at 28°F or below; water dry soil a day or two before.");
      if (m >= 2 && m <= 8) tasks.push(g.water);
      if (m >= 5 && m <= 7) tasks.push("Heat: water early in the morning; containers may need water daily.");
      if (!tasks.length) tasks.push("Light month: keep the mulch ring weed-free and check the tree now and then.");
      return { m: name, tasks };
    });
  }

  // ---- weather ----
  function forecastUrl(loc, pastDays) {
    return `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}` +
      `&current=temperature_2m,wind_speed_10m` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,` +
      `et0_fao_evapotranspiration,wind_speed_10m_max,wind_gusts_10m_max` +
      `&past_days=${pastDays}&forecast_days=7&temperature_unit=fahrenheit&precipitation_unit=inch` +
      `&wind_speed_unit=mph&timezone=auto`;
  }
  const alertsUrl = loc => `https://api.weather.gov/alerts/active?point=${(+loc.lat).toFixed(4)},${(+loc.lon).toFixed(4)}`;
  const COLD_ALERTS = /freeze|frost|cold|wind chill/i;
  // NWS alerts worth showing for a tree (skips air quality, rip currents, etc.).
  const TREE_ALERTS = /freeze|frost|cold|wind|heat|hurricane|tropical|storm|tornado|flood/i;
  const todayKey = (tz, now) => (now || new Date()).toLocaleDateString("en-CA", { timeZone: tz || "America/New_York" });

  // Weather-driven reminders from an Open-Meteo response (past_days=0) plus NWS alerts.
  // A daily low usually happens just before sunrise, so cover the tree the evening before.
  function weatherEvents(wx, alerts, opts) {
    const out = [], d = wx.daily, pot = opts.setting === "pot";
    const shortDay = iso => new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
    d.time.forEach((date, i) => {
      const lo = Math.round(d.temperature_2m_min[i]);
      const gust = d.wind_gusts_10m_max[i], windy = d.wind_speed_10m_max[i] >= T.windy || gust >= T.gusty;
      if (lo <= T.protect || (pot && lo <= T.frost)) {
        const steps = pot
          ? ["Move the container into a garage or enclosed porch before dark."]
          : ["Water the soil today if it's dry.",
             "Before sunset, drape frost cloth all the way to the ground and run incandescent lights under it.",
             "Uncover mid-morning once it's above freezing."];
        if (windy && !pot) steps.push(`Windy (gusts ${Math.round(gust)} mph): weigh the cloth edges down; wind strips heat out of covers, so the lights matter more.`);
        if (lo <= T.hard) steps.push("Hard freeze: pick any ripe fruit first.");
        out.push({ uid: `freeze-${date}`, date: shift(date, -1), time: "16:00", alarm: 60,
          title: `🔴 ${pot ? "Bring orange tree inside" : "Cover orange tree"} tonight (low ${lo}°F ${shortDay(date)})`, desc: steps.join("\n") });
      } else if (lo <= T.frost) {
        out.push({ uid: `freeze-${date}`, date: shift(date, -1), time: "17:00",
          title: `🟡 Frost watch (low ${lo}°F ${shortDay(date)})`,
          desc: "Have frost cloth ready. Recheck the forecast this evening; cover the tree if it's heading to 28°F." });
      }
    });
    (alerts || []).filter(a => COLD_ALERTS.test(a.event)).forEach(a => {
      const date = (a.onset || a.effective || "").slice(0, 10);
      if (date) out.push({ uid: `nws-${String(a.id).split(/[/:.]/).filter(Boolean).pop()}`, date,
        title: `⚠️ NWS ${a.event}`, desc: (a.headline || "") + "\n\n" + (a.instruction || "") });
    });
    return out;
  }

  // Location from URL params (used by shared links and the calendar feed). Returns null if absent/invalid.
  function locFromParams(get) {
    const lat = parseFloat(get("lat")), lon = parseFloat(get("lon"));
    if (!(lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180)) return null;
    const clean = (s, n) => String(s || "").replace(/[^\p{L}\p{N} .,'’-]/gu, "").slice(0, n);
    const zip = /^\d{5}$/.test(get("zip") || "") ? get("zip") : "";
    return { name: clean(get("name"), 60) || "My location", state: clean(get("state"), 30), lat, lon, zip };
  }

  const api = { DEFAULT_LOC, DEFAULT_CLIMATE, T, GUIDES, OTHER, guideFor, zoneNum, zoneFromTemp, frostFree, verdict,
    plan, monthly, forecastUrl, alertsUrl, COLD_ALERTS, TREE_ALERTS, todayKey, weatherEvents, locFromParams, shift };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Care = api;
})(this);
