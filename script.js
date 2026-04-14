const API_BASE = "https://boxing-data-api.p.rapidapi.com/v2";
const API_HOST = "boxing-data-api.p.rapidapi.com";
const API_KEY = window.RAPIDAPI_KEY;

console.log("API KEY actief:", API_KEY);
console.log("API HOST actief:", API_HOST);

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
  };

  return imageMap[name] || "images/default-fighter.jpg";
}

function renderFighters(responseData) {
  if (!fightersList) return;

  console.log("Volledige API response:", responseData);

  const fighters = responseData?.data || [];

  console.log("Gevonden fighters array:", fighters);

  if (!Array.isArray(fighters) || fighters.length === 0) {
    fightersList.innerHTML = "<p>Geen vechters gevonden.</p>";
    return;
  }

  fightersList.innerHTML = fighters
    .map((fighter) => {
      const name = fighter.name || "Onbekende naam";
      const nationality = fighter.nationality || "Onbekend";
      const division = fighter.division?.name || "Onbekend";
      const wins = fighter.stats?.wins ?? "?";
      const losses = fighter.stats?.losses ?? "?";
      const draws = fighter.stats?.draws ?? "?";
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
}

async function searchFighters() {
  const searchTerm = searchInput.value.trim();

  if (!searchTerm) {
    fightersList.innerHTML = "<p>Typ eerst een naam van een vechter in.</p>";
    return;
  }

  fightersList.innerHTML = "<p>Bezig met zoeken...</p>";

  const url = `${API_BASE}/fighters?name=${encodeURIComponent(
    searchTerm
  )}&page_num=1&page_size=10`;

  console.log("Request URL:", url);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-RapidAPI-Key": API_KEY,
        "X-RapidAPI-Host": API_HOST,
      },
    });

    console.log("Response status:", response.status);

    const data = await response.json();
    console.log("RESPONSE DATA:", data);

    if (!response.ok) {
      fightersList.innerHTML = `<p>API fout ${response.status}: ${
        data?.message || data?.error?.message || "Onbekende fout"
      }</p>`;
      return;
    }

    renderFighters(data);
  } catch (error) {
    console.error("Fetch fout:", error);
    fightersList.innerHTML =
      "<p>Er ging iets mis bij het ophalen van de data.</p>";
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
  upcomingFightsList.innerHTML = `
    <article class="fight-block">
      <div class="fight-head">
        <div class="fight-logo">BOX</div>
        <div class="fight-meta">
          <div class="fight-title">Fighter search actief</div>
          <div class="fight-location">Zoek hierboven naar een bokser via de API</div>
        </div>
      </div>
      <div class="fight-body">
        <div class="fight-topline">
          <span>API gekoppeld</span>
          <span class="fight-type">Fighters v2</span>
          <span class="fight-star">☆</span>
        </div>
        <div class="fight-row">
          <h3 class="fighter-name">Zoek</h3>
          <div class="fight-vs">VS</div>
          <h3 class="fighter-name right">Resultaat</h3>
        </div>
      </div>
    </article>
  `;
}
