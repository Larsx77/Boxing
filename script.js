const API_BASE = "https://boxing-data-api.p.rapidapi.com/v2";
const API_HOST = "boxing-data-api.p.rapidapi.com";
const API_KEY = window.RAPIDAPI_KEY;

const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const fightersList = document.getElementById("fighters-list");
const upcomingFightsList = document.getElementById("upcoming-fights-list");

function getFighterImage(name) {
  const imageMap = {
    "Oleksandr Usyk": "images/usyk.jpg",
    "Tyson Fury": "images/fury.jpg",
    "Anthony Joshua": "images/joshua.jpg",
    "Canelo Alvarez": "images/canelo.jpg",
    "Terence Crawford": "images/crawford.jpg",
    "Naoya Inoue": "images/inoue.jpg",
    "Gervonta Davis": "images/davis.jpg",
    "Gervonta 'Tank' Davis": "images/davis.jpg",
  };

  return imageMap[name] || "images/default-fighter.jpg";
}

function getFromPaths(object, paths) {
  for (const path of paths) {
    const value = path.split(".").reduce((acc, key) => acc?.[key], object);
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return null;
}

function normalizeArray(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.items)) return payload.items;
  if (Array.isArray(payload.results)) return payload.results;
  return [];
}

function formatDate(value) {
  if (!value) return "Datum onbekend";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("nl-NL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fightDateValue(fight) {
  const rawDate = getFromPaths(fight, [
    "date",
    "event_date",
    "start_time",
    "datetime",
    "event.date",
  ]);
  const time = new Date(rawDate || 0).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function renderFightStatus(message) {
  if (!upcomingFightsList) return;
  upcomingFightsList.innerHTML = `
    <article class="fight-block">
      <div class="fight-head">
        <div class="fight-logo">BOX</div>
        <div class="fight-meta">
          <div class="fight-title">Meest recente gevecht</div>
          <div class="fight-location">${message}</div>
        </div>
      </div>
    </article>
  `;
}

function renderRecentFight(fight, fighterName) {
  if (!upcomingFightsList) return;

  const eventName =
    getFromPaths(fight, ["event_name", "event.title", "event", "title"]) ||
    `Recent gevecht van ${fighterName}`;
  const location =
    getFromPaths(fight, ["venue", "location", "event.location", "city"]) ||
    "Locatie onbekend";
  const date = formatDate(
    getFromPaths(fight, ["date", "event_date", "start_time", "datetime"]),
  );
  const leftName =
    getFromPaths(fight, [
      "fighter_1.name",
      "fighter1.name",
      "red_corner.name",
      "home.name",
      "fighters.0.name",
    ]) || fighterName;
  const rightName =
    getFromPaths(fight, [
      "fighter_2.name",
      "fighter2.name",
      "blue_corner.name",
      "away.name",
      "fighters.1.name",
    ]) || "Tegenstander";
  const cardType =
    getFromPaths(fight, ["card_type", "fight_type", "stage", "status"]) ||
    "Resultaat";

  upcomingFightsList.innerHTML = `
    <article class="fight-block">
      <div class="fight-head">
        <div class="fight-logo">BOX</div>
        <div class="fight-meta">
          <div class="fight-title">${eventName}</div>
          <div class="fight-location">${location}</div>
        </div>
      </div>
      <div class="fight-body">
        <div class="fight-topline">
          <span>${date}</span>
          <span class="fight-type">${cardType}</span>
          <span class="fight-star">☆</span>
        </div>
        <div class="fight-row">
          <h3 class="fighter-name">${leftName}</h3>
          <div class="fight-vs">VS</div>
          <h3 class="fighter-name right">${rightName}</h3>
        </div>
      </div>
    </article>
  `;
}

async function requestApi(path) {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "GET",
    headers: {
      "X-RapidAPI-Key": API_KEY,
      "X-RapidAPI-Host": API_HOST,
    },
  });

  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

async function fetchMostRecentFight(fighter, searchTerm) {
  const fighterId = fighter?.id || fighter?._id;
  const fighterName = fighter?.name || searchTerm;

  const candidatePaths = [
    fighterId ? `/fighters/${fighterId}/fights?page_num=1&page_size=20` : null,
    `/fights?fighter_name=${encodeURIComponent(fighterName)}&page_num=1&page_size=20`,
    `/fights?search=${encodeURIComponent(fighterName)}&page_num=1&page_size=20`,
    `/results?search=${encodeURIComponent(fighterName)}&page_num=1&page_size=20`,
  ].filter(Boolean);

  let collected = [];
  for (const path of candidatePaths) {
    try {
      const result = await requestApi(path);
      if (!result.ok) continue;
      const items = normalizeArray(result.data);
      if (items.length) {
        collected = items;
        break;
      }
    } catch (error) {
      console.error("Fight endpoint fout:", path, error);
    }
  }

  if (!collected.length) return null;

  const normalizedName = normalizeText(fighterName);
  const normalizedSearch = normalizeText(searchTerm);

  const filtered = collected.filter((fight) => {
    const ids = [
      getFromPaths(fight, [
        "fighter_1.id",
        "fighter1.id",
        "red_corner.id",
        "home.id",
        "fighters.0.id",
      ]),
      getFromPaths(fight, [
        "fighter_2.id",
        "fighter2.id",
        "blue_corner.id",
        "away.id",
        "fighters.1.id",
      ]),
    ]
      .filter(Boolean)
      .map((id) => String(id));

    const names = [
      getFromPaths(fight, [
        "fighter_1.name",
        "fighter1.name",
        "red_corner.name",
        "home.name",
        "fighters.0.name",
      ]),
      getFromPaths(fight, [
        "fighter_2.name",
        "fighter2.name",
        "blue_corner.name",
        "away.name",
        "fighters.1.name",
      ]),
    ]
      .filter(Boolean)
      .map((n) => normalizeText(n));

    const idMatch = fighterId ? ids.includes(String(fighterId)) : false;
    const nameMatch = names.some(
      (n) =>
        n === normalizedName ||
        n.includes(normalizedName) ||
        normalizedName.includes(n),
    );
    const searchMatch = normalizedSearch
      ? names.some(
          (n) =>
            n === normalizedSearch ||
            n.includes(normalizedSearch) ||
            normalizedSearch.includes(n),
        )
      : false;

    return idMatch || nameMatch || searchMatch;
  });

  if (!filtered.length) {
    return null;
  }

  const sorted = filtered.sort((a, b) => fightDateValue(b) - fightDateValue(a));
  return sorted[0] || null;
}

function renderFighters(responseData) {
  if (!fightersList) return [];

  const fighters = normalizeArray(responseData);
  if (!Array.isArray(fighters) || fighters.length === 0) {
    fightersList.innerHTML = "<p>Geen vechters gevonden.</p>";
    return [];
  }

  fightersList.innerHTML = fighters
    .map((fighter) => {
      const name = fighter.name || "Onbekende naam";
      const nationality = fighter.nationality || "Onbekend";
      const division =
        fighter.division?.name || fighter.weight_class || "Onbekend";
      const wins = fighter.stats?.wins ?? fighter.record?.wins ?? "?";
      const losses = fighter.stats?.losses ?? fighter.record?.losses ?? "?";
      const draws = fighter.stats?.draws ?? fighter.record?.draws ?? "?";
      const image = getFighterImage(name);

      return `
        <article class="fighter-card">
          <img src="${image}" alt="${name}" class="fighter-image" />
          <h3>${name}</h3>
          <p><strong>Nationaliteit:</strong> ${nationality}</p>
          <p><strong>Gewichtsklasse:</strong> ${division}</p>
          <p><strong>Record:</strong> ${wins}-${losses}-${draws}</p>
        </article>
      `;
    })
    .join("");

  return fighters;
}

async function searchFighters() {
  if (!searchInput || !fightersList) return;

  const searchTerm = searchInput.value.trim();
  if (!searchTerm) {
    fightersList.innerHTML = "<p>Typ eerst een naam van een vechter in.</p>";
    renderFightStatus(
      "Zoek een vechter om het meest recente gevecht te laden.",
    );
    return;
  }

  fightersList.innerHTML = "<p>Bezig met zoeken...</p>";
  renderFightStatus("Bezig met meest recente gevecht ophalen...");

  try {
    const response = await requestApi(
      `/fighters?name=${encodeURIComponent(searchTerm)}&page_num=1&page_size=10`,
    );

    if (!response.ok) {
      fightersList.innerHTML = `<p>API fout ${response.status}: ${
        response.data?.message ||
        response.data?.error?.message ||
        "Onbekende fout"
      }</p>`;
      renderFightStatus("Kon gevechten niet laden.");
      return;
    }

    const fighters = renderFighters(response.data);
    const normalizedSearch = normalizeText(searchTerm);
    const primaryFighter =
      fighters.find((f) => normalizeText(f?.name) === normalizedSearch) ||
      fighters.find((f) => normalizeText(f?.name).includes(normalizedSearch)) ||
      fighters[0];
    if (!primaryFighter) {
      renderFightStatus("Geen vechter gevonden.");
      return;
    }

    const recentFight = await fetchMostRecentFight(primaryFighter, searchTerm);
    if (!recentFight) {
      renderFightStatus(
        `Geen recent gevecht gevonden voor ${primaryFighter.name || searchTerm}.`,
      );
      return;
    }

    renderRecentFight(recentFight, primaryFighter.name || searchTerm);
  } catch (error) {
    console.error("Fetch fout:", error);
    fightersList.innerHTML =
      "<p>Er ging iets mis bij het ophalen van de data.</p>";
    renderFightStatus("Er ging iets mis met het laden van gevechten.");
  }
}

if (searchBtn) {
  searchBtn.addEventListener("click", searchFighters);
}

if (searchInput) {
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      searchFighters();
    }
  });
}

if (upcomingFightsList) {
  renderFightStatus(
    "Zoek hierboven naar een bokser om het meest recente gevecht te tonen.",
  );
}
