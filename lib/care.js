// Shared care data for the page (window.Care) and the calendar feed (require).
(function (root) {
  const LAT = 32.0809, LON = -81.0912; // Savannah, GA
  const TZ = "America/New_York";
  const T = { protect: 28, hard: 26, frost: 32, hot: 90, cool: 50, windy: 10, gusty: 20 };

  // Monthly plan for Savannah. Fertilizer timing follows UGA's split schedule
  // (mid-March, May 1, mid-June; nothing after July so new growth hardens before winter).
  const CALENDAR = [
    { m: "January", tasks: [
        "Peak freeze risk: check the forecast daily and protect when lows hit 28°F or below.",
        "Keep young trees banked with clean soil (about 15 in. up the trunk) all winter.",
        "Water only if the soil is dry; moist soil holds more heat before a freeze.",
        "Finish harvesting navels/sweet oranges before a hard freeze; fruit does not ripen off the tree.",
        "Do not prune or fertilize." ] },
    { m: "February", tasks: [
        "Still freeze season: keep frost cloth and incandescent lights ready.",
        "Do not prune freeze-damaged wood yet; wait to see where new growth starts.",
        "Buy a citrus fertilizer with micronutrients (e.g. 8-8-8 or a citrus blend) for March." ] },
    { m: "March", tasks: [
        "Mid-March: 1st fertilizer application (or a single slow-release citrus fertilizer in early March).",
        "Pull the soil bank away from young trunks once the last frost has passed (usually mid-March).",
        "Best month to plant a new tree, after frost danger.",
        "Bloom starts: water deeply weekly if rain is under about 1 in./week; dry soil drops blossoms." ] },
    { m: "April", tasks: [
        "Fruit set: keep soil evenly moist; mulch 2–3 in. deep, kept a foot away from the trunk.",
        "Prune out freeze-killed wood now that new growth shows where the live wood ends.",
        "Remove suckers growing below the graft union.",
        "Check new flush for aphids and leafminer trails." ] },
    { m: "May", tasks: [
        "May 1: 2nd fertilizer application.",
        "Water deeply about weekly in dry spells; early morning is best.",
        "Normal 'June drop' of small fruit may start — not a problem if the tree is watered." ] },
    { m: "June", tasks: [
        "Mid-June: 3rd (last) fertilizer application of the year.",
        "Heat: water early morning; check containers daily.",
        "Watch new leaves for citrus leafminer, scale and whiteflies (sooty mold is a whitefly/scale sign).",
        "If spraying horticultural oil, only when below 90°F, early morning or evening." ] },
    { m: "July", tasks: [
        "No more fertilizer after July — late feeding pushes tender growth that freezes in winter.",
        "Water deeply during dry stretches; hurricane season — stake young trees if needed.",
        "Keep grass and weeds out of the mulch ring." ] },
    { m: "August", tasks: [
        "Do not fertilize.",
        "Keep watering in dry spells; fruit is sizing up and uneven water causes splitting.",
        "Inspect for scale and leafminer on late-summer flush." ] },
    { m: "September", tasks: [
        "Do not fertilize or prune (both trigger growth that won't harden before cold).",
        "Ease off watering as rains and temperatures drop, but don't let the tree wilt.",
        "Check that frost cloth, stakes and an outdoor-rated extension cord are on hand." ] },
    { m: "October", tasks: [
        "Get cold protection ready: frost cloth big enough to reach the ground, incandescent string lights.",
        "Satsumas and early types start coloring; navels need longer.",
        "Container trees: plan where they'll go (garage/porch) on freeze nights." ] },
    { m: "November", tasks: [
        "Before the first freeze (often late Nov), bank young trees with clean soil about 15 in. up the trunk.",
        "Harvest begins for many oranges — taste-test; color isn't a reliable ripeness sign.",
        "Pick any ripe fruit ahead of a forecast hard freeze (≤ 26°F)." ] },
    { m: "December", tasks: [
        "Freeze season: protect the tree whenever lows are forecast at 28°F or below.",
        "Water the soil 1–2 days before a freeze if it's dry.",
        "Keep harvesting; fruit holds well on the tree until a hard freeze." ] },
  ];

  // Fixed-date reminders for the calendar feed. month is 1-12.
  // only: "young" | "pot" | "ground" limits an event to that tree setup.
  const SEASONAL = [
    { id: "fert1", month: 3, day: 15, title: "Fertilize orange tree (1 of 3)",
      desc: "UGA split schedule: mid-March. Citrus fertilizer with micronutrients, spread under the canopy past the drip line, then water in. Young trees get a smaller amount per the label." },
    { id: "unbank", month: 3, day: 20, only: "young", title: "Pull soil bank away from young trunk",
      desc: "Last frost has usually passed in Savannah by now. Remove the winter soil bank so the trunk can dry out." },
    { id: "prune", month: 4, day: 10, title: "Prune freeze damage & remove suckers",
      desc: "New growth now shows where live wood ends. Cut back dead wood and remove any shoots below the graft union." },
    { id: "fert2", month: 5, day: 1, title: "Fertilize orange tree (2 of 3)",
      desc: "UGA split schedule: May 1. Spread past the drip line and water in." },
    { id: "pests1", month: 6, day: 1, title: "Check new growth for pests",
      desc: "Look for citrus leafminer trails, scale, aphids and whiteflies (sooty mold is a sign). Spray oils only below 90°F, early morning or evening." },
    { id: "fert3", month: 6, day: 15, title: "Fertilize orange tree (3 of 3 — last)",
      desc: "UGA split schedule: mid-June. This is the last feeding of the year." },
    { id: "nofert", month: 7, day: 31, title: "Fertilizer season over",
      desc: "No fertilizer after July — late feeding pushes tender growth that freezes in winter." },
    { id: "pests2", month: 8, day: 15, title: "Check late-summer flush for pests",
      desc: "Inspect for scale and leafminer. Keep watering evenly during dry spells to prevent fruit splitting." },
    { id: "coldprep", month: 10, day: 15, title: "Get freeze gear ready",
      desc: "Frost cloth big enough to reach the ground, incandescent (not LED) string lights, outdoor-rated extension cord, clips or bricks to hold the cloth down." },
    { id: "harvest", month: 11, day: 1, title: "Start taste-testing oranges",
      desc: "Many oranges ripen Nov–Jan. Color isn't a reliable sign; fruit doesn't ripen off the tree." },
    { id: "bank", month: 11, day: 15, only: "young", title: "Bank young tree with soil",
      desc: "Before the first freeze: bank clean soil about 15 in. up the trunk (UGA guidance for trees up to 4 years old)." },
    { id: "potplan", month: 11, day: 15, only: "pot", title: "Plan a freeze spot for the container tree",
      desc: "Garage or enclosed porch for freeze nights; a dolly or plant caddy makes moving it easy." },
  ];

  function forecastUrl(pastDays) {
    return `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
      `&current=temperature_2m,wind_speed_10m` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,` +
      `et0_fao_evapotranspiration,wind_speed_10m_max,wind_gusts_10m_max` +
      `&past_days=${pastDays}&forecast_days=7&temperature_unit=fahrenheit&precipitation_unit=inch` +
      `&wind_speed_unit=mph&timezone=America%2FNew_York`;
  }
  const ALERTS_URL = `https://api.weather.gov/alerts/active?point=${LAT},${LON}`;
  const COLD_ALERTS = /freeze|frost|hard freeze|cold|wind chill/i;

  // Index of today's date (yyyy-mm-dd, Savannah time) in an Open-Meteo daily block.
  function todayKey(now) { return (now || new Date()).toLocaleDateString("en-CA", { timeZone: TZ }); }

  // Weather-driven reminders from an Open-Meteo response (past_days=0) plus NWS alerts.
  // A daily low usually happens just before sunrise, so cover the tree the evening before.
  function weatherEvents(wx, alerts, opts) {
    const out = [], d = wx.daily, pot = opts.setting === "pot";
    d.time.forEach((date, i) => {
      const lo = Math.round(d.temperature_2m_min[i]);
      const wind = d.wind_speed_10m_max[i], gust = d.wind_gusts_10m_max[i];
      const windy = wind >= T.windy || gust >= T.gusty;
      if (lo <= T.protect) {
        const steps = pot
          ? ["Move the container into a garage or enclosed porch before dark."]
          : ["Water the soil today if it's dry.",
             "Before sunset, drape frost cloth all the way to the ground and run incandescent lights under it.",
             "Uncover mid-morning once it's above freezing."];
        if (windy && !pot) steps.push(`Windy (gusts ${Math.round(gust)} mph): weigh the cloth edges down; wind strips heat out of covers, so the lights matter more.`);
        if (lo <= T.hard) steps.push("Hard freeze: pick any ripe fruit first.");
        out.push({ uid: `freeze-${date}`, date: prevDay(date), time: "16:00", alarm: 60,
          title: `🔴 Cover orange tree tonight (low ${lo}°F ${shortDay(date)})`, desc: steps.join("\n") });
      } else if (lo <= T.frost) {
        out.push({ uid: `freeze-${date}`, date: prevDay(date), time: "17:00",
          title: `🟡 Frost watch (low ${lo}°F ${shortDay(date)})`,
          desc: "Have frost cloth ready. Recheck the forecast this evening; cover the tree if it's heading to 28°F." });
      }
    });
    (alerts || []).filter(a => COLD_ALERTS.test(a.event)).forEach(a => {
      const date = (a.onset || a.effective || "").slice(0, 10);
      if (date) out.push({ uid: `nws-${a.id.split(/[/:.]/).filter(Boolean).pop()}`, date,
        title: `⚠️ NWS ${a.event}`, desc: (a.headline || "") + "\n\n" + (a.instruction || "") });
    });
    return out;
  }

  function prevDay(iso) {
    const dt = new Date(iso + "T12:00:00Z"); dt.setUTCDate(dt.getUTCDate() - 1);
    return dt.toISOString().slice(0, 10);
  }
  function shortDay(iso) {
    return new Date(iso + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
  }

  const api = { LAT, LON, TZ, T, CALENDAR, SEASONAL, forecastUrl, ALERTS_URL, COLD_ALERTS, todayKey, weatherEvents };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.Care = api;
})(this);
