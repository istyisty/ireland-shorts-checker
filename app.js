const statusEl = document.getElementById("status");
const tempEl = document.getElementById("temperature");
const detailsEl = document.getElementById("details");
const refreshBtn = document.getElementById("refreshBtn");
const countySelectEl = document.getElementById("countySelect");
const verdictArtEl = document.getElementById("verdictArt");
const lastUpdatedEl = document.getElementById("lastUpdated");
const infoBtnEl = document.getElementById("infoBtn");
const infoTooltipEl = document.getElementById("infoTooltip");
const infoTooltipTextEl = document.getElementById("infoTooltipText");

const NO_THRESHOLD_C = 10;
const WIND_WARNING_KMH = 40;
const YES_IMAGE = "./assets/yes_shorts.png";
const NO_IMAGE = "./assets/no_shorts.png";

const COUNTY_COORDS = [
  { name: "Antrim", lat: 54.7195, lon: -6.2072 },
  { name: "Armagh", lat: 54.3503, lon: -6.6528 },
  { name: "Carlow", lat: 52.7188, lon: -6.8504 },
  { name: "Cavan", lat: 53.9908, lon: -7.3606 },
  { name: "Clare", lat: 52.8477, lon: -8.9863 },
  { name: "Cork", lat: 51.8985, lon: -8.4756 },
  { name: "Derry", lat: 54.9966, lon: -7.3086 },
  { name: "Donegal", lat: 54.6549, lon: -8.1041 },
  { name: "Down", lat: 54.328, lon: -5.7157 },
  { name: "Dublin", lat: 53.3498, lon: -6.2603 },
  { name: "Fermanagh", lat: 54.3448, lon: -7.6389 },
  { name: "Galway", lat: 53.2707, lon: -9.0568 },
  { name: "Kerry", lat: 52.1545, lon: -9.5669 },
  { name: "Kildare", lat: 53.1598, lon: -6.9097 },
  { name: "Kilkenny", lat: 52.6541, lon: -7.2448 },
  { name: "Laois", lat: 53.0344, lon: -7.2998 },
  { name: "Leitrim", lat: 54.1224, lon: -8.0006 },
  { name: "Limerick", lat: 52.6638, lon: -8.6267 },
  { name: "Longford", lat: 53.7275, lon: -7.7932 },
  { name: "Louth", lat: 53.9508, lon: -6.5402 },
  { name: "Mayo", lat: 53.8572, lon: -9.2972 },
  { name: "Meath", lat: 53.6055, lon: -6.6564 },
  { name: "Monaghan", lat: 54.2492, lon: -6.9683 },
  { name: "Offaly", lat: 53.2739, lon: -7.7783 },
  { name: "Roscommon", lat: 53.6279, lon: -8.1896 },
  { name: "Sligo", lat: 54.2766, lon: -8.4761 },
  { name: "Tipperary", lat: 52.4738, lon: -8.1619 },
  { name: "Tyrone", lat: 54.598, lon: -7.3092 },
  { name: "Waterford", lat: 52.2593, lon: -7.1101 },
  { name: "Westmeath", lat: 53.5359, lon: -7.3385 },
  { name: "Wexford", lat: 52.3369, lon: -6.4633 },
  { name: "Wicklow", lat: 52.9864, lon: -6.3672 },
];

// WMO weather codes >= 51 indicate precipitation (drizzle, rain, snow, showers, thunderstorm)
function isPrecipitation(weatherCode) {
  return typeof weatherCode === "number" && weatherCode >= 51;
}

function pickShortsMessage(feelsLikeC, rainy, windSpeedKmh) {
  if (feelsLikeC < NO_THRESHOLD_C) {
    return { answer: "NO", details: "Too chilly for shorts.", wearShorts: false };
  }
  const qualifiers = [];
  if (rainy) qualifiers.push("it's going to rain");
  if (typeof windSpeedKmh === "number" && windSpeedKmh >= WIND_WARNING_KMH) {
    qualifiers.push("it's very windy");
  }
  const suffix = qualifiers.length > 0 ? `, but ${qualifiers.join(" and ")}` : "";
  return {
    answer: "YES",
    details: `Warm enough for shorts${suffix}.`,
    wearShorts: true,
  };
}

function buildVerdictExplanation(feelsLikeC, rainy, windSpeedKmh) {
  const precipText = rainy ? "precipitation forecast" : "no precipitation forecast";
  const windText =
    typeof windSpeedKmh === "number"
      ? `wind speed ${Math.round(windSpeedKmh)} km/h`
      : "wind speed unavailable";
  return `Verdict based on: feels-like max of ${feelsLikeC.toFixed(1)}°C (threshold: ${NO_THRESHOLD_C}°C), ${precipText}, ${windText}.`;
}

function updateOGTags(countyName, verdict, feelsLikeC) {
  const base = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, "");
  const imageFile = verdict.wearShorts ? "yes_shorts.png" : "no_shorts.png";
  document
    .querySelector('meta[property="og:title"]')
    .setAttribute("content", `Should I wear shorts in ${countyName} today? ${verdict.answer}`);
  document
    .querySelector('meta[property="og:description"]')
    .setAttribute("content", `Feels like ${feelsLikeC.toFixed(1)}°C. ${verdict.details}`);
  document
    .querySelector('meta[property="og:image"]')
    .setAttribute("content", `${base}/assets/${imageFile}`);
  document
    .querySelector('meta[property="og:url"]')
    .setAttribute("content", window.location.href);
}

function populateCountySelector() {
  countySelectEl.innerHTML = COUNTY_COORDS.map(
    (county) => `<option value="${county.name}">${county.name}</option>`
  ).join("");
}

function getCountyFromQueryParam() {
  const params = new URLSearchParams(window.location.search);
  const countyParam = params.get("county");
  if (!countyParam) return null;
  const decodedCounty = countyParam.trim().toLowerCase();
  return (
    COUNTY_COORDS.find((county) => county.name.toLowerCase() === decodedCounty) || null
  );
}

function syncCountyQueryParam(countyName) {
  const params = new URLSearchParams(window.location.search);
  params.set("county", countyName);
  const hash = window.location.hash || "";
  const newUrl = `${window.location.pathname}?${params.toString()}${hash}`;
  window.history.replaceState({}, "", newUrl);
}

function initializeSelectedCounty() {
  const countyFromQuery = getCountyFromQueryParam();
  countySelectEl.value = countyFromQuery ? countyFromQuery.name : "Dublin";
  syncCountyQueryParam(countySelectEl.value);
}

function setScenarioTheme(wearShorts) {
  document.body.classList.toggle("scenario-yes", wearShorts);
  document.body.classList.toggle("scenario-no", !wearShorts);
}

function buildCharacterPairMarkup(wearShorts) {
  const mood = wearShorts ? "warm" : "cold";
  const moodLabel = wearShorts ? "Happy because it is warm" : "Sad because it is too cold";
  const imageSrc = wearShorts ? YES_IMAGE : NO_IMAGE;
  return `
    <div class="character-wrap character-wrap--${mood}">
      <img class="character-image character-image--${mood}" src="${imageSrc}" alt="${moodLabel}" />
    </div>
  `;
}

async function updateWeather() {
  statusEl.textContent = "Checking...";
  tempEl.textContent = "";
  detailsEl.textContent = "";
  verdictArtEl.innerHTML = "";
  infoBtnEl.hidden = true;
  infoTooltipEl.hidden = true;
  infoBtnEl.setAttribute("aria-expanded", "false");

  const selectedCounty = COUNTY_COORDS.find(
    (county) => county.name === countySelectEl.value
  );
  if (!selectedCounty) {
    statusEl.textContent = "County not found";
    return;
  }
  syncCountyQueryParam(selectedCounty.name);

  const endpoint =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${selectedCounty.lat}&longitude=${selectedCounty.lon}` +
    "&current=temperature_2m,apparent_temperature" +
    "&daily=apparent_temperature_max,weather_code,wind_speed_10m_max" +
    "&forecast_days=1" +
    "&timezone=auto";

  try {
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();
    const current = data.current;

    if (!current || typeof current.temperature_2m !== "number") {
      throw new Error("Unexpected weather response format.");
    }

    const tempC = current.temperature_2m;
    const feelsLike = current.apparent_temperature;
    const maxFeelsLikeToday = data?.daily?.apparent_temperature_max?.[0];
    const dailyWeatherCode = data?.daily?.weather_code?.[0];
    const windSpeedMax = data?.daily?.wind_speed_10m_max?.[0] ?? null;

    const decisionFeelsLike =
      typeof maxFeelsLikeToday === "number" ? maxFeelsLikeToday : feelsLike;
    const rainy = isPrecipitation(dailyWeatherCode);
    const verdict = pickShortsMessage(decisionFeelsLike, rainy, windSpeedMax);

    setScenarioTheme(verdict.wearShorts);
    statusEl.textContent = verdict.answer;
    verdictArtEl.innerHTML = buildCharacterPairMarkup(verdict.wearShorts);
    tempEl.textContent = `${tempC.toFixed(1)}°C in ${selectedCounty.name}`;

    const windDisplay =
      typeof windSpeedMax === "number" ? ` Wind: ${Math.round(windSpeedMax)} km/h.` : "";
    detailsEl.textContent = `Feels like ${feelsLike.toFixed(1)}°C now. Daily max feels like ${decisionFeelsLike.toFixed(1)}°C.${windDisplay} ${verdict.details}`;

    infoTooltipTextEl.textContent = buildVerdictExplanation(decisionFeelsLike, rainy, windSpeedMax);
    infoBtnEl.hidden = false;

    updateOGTags(selectedCounty.name, verdict, decisionFeelsLike);

    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-IE", { hour: "2-digit", minute: "2-digit" });
    lastUpdatedEl.textContent = `Last updated at ${timeStr}`;
  } catch (error) {
    console.error(error);
    setScenarioTheme(false);
    statusEl.textContent = "Weather unavailable";
    verdictArtEl.innerHTML = buildCharacterPairMarkup(false);
    if (!navigator.onLine) {
      detailsEl.textContent = "You appear to be offline. Check your connection and try again.";
    } else {
      detailsEl.textContent = "Could not load weather data. The API may be temporarily unavailable.";
    }
  }
}

infoBtnEl.addEventListener("click", () => {
  const nowHidden = !infoTooltipEl.hidden;
  infoTooltipEl.hidden = nowHidden;
  infoBtnEl.setAttribute("aria-expanded", String(!nowHidden));
});

populateCountySelector();
initializeSelectedCounty();
refreshBtn.addEventListener("click", updateWeather);
countySelectEl.addEventListener("change", updateWeather);
updateWeather();

setInterval(updateWeather, 10 * 60 * 1000);
