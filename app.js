
import {
  searchPokemon,
  getPokemonList
} from "./js/api.js";

import {
  renderPokemon,
  renderPokemonGrid
} from "./js/ui.js";

const searchInput = document.querySelector("#pokemonSearch");
const searchButton = document.querySelector("#searchBtn");
const status = document.querySelector("#status");
const pokemonGrid = document.querySelector("#pokemonGrid");

const prevBtn = document.querySelector("#prevBtn");
const nextBtn = document.querySelector("#nextBtn");
const pageInfo = document.querySelector("#pageInfo");
const typeFilter = document.querySelector("#typeFilter");

const PAGE_SIZE = 20;

let currentPage = 1;
let totalCount = 0;
let selectedType = "all";

async function loadPokemonGrid() {
  status.textContent = "Loading Pokémon...";
  searchButton.disabled = true;
  prevBtn.disabled = true;
  nextBtn.disabled = true;

  try {
    const offset = (currentPage - 1) * PAGE_SIZE;

    const {
      pokemonList,
      totalCount: count
    } = await getPokemonList(PAGE_SIZE, offset);

    totalCount = count;

    let displayedPokemon = pokemonList;

    if (selectedType !== "all") {
      displayedPokemon = pokemonList.filter((pokemon) =>
        pokemon.types.some(
          (item) => item.type.name === selectedType
        )
      );
    }

    renderPokemonGrid(displayedPokemon, pokemonGrid);

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage >= totalPages;

    status.textContent =
      selectedType === "all"
        ? `Showing ${pokemonList.length} Pokémon.`
        : `Showing ${displayedPokemon.length} matching Pokémon on this page.`;
  } catch (error) {
    status.textContent = error.message;
  } finally {
    searchButton.disabled = false;

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
  }
}

async function showSearchResult(query) {
  status.textContent = "Searching...";
  searchButton.disabled = true;

  try {
    const pokemon = await searchPokemon(query);

    const matchesType =
      selectedType === "all" ||
      pokemon.types.some(
        (item) => item.type.name === selectedType
      );

    if (!matchesType) {
      pokemonGrid.replaceChildren();
      status.textContent =
        `${pokemon.name} does not match the selected type: ${selectedType}.`;

      pageInfo.textContent = "No matching result";
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      return;
    }

    renderPokemon(pokemon, pokemonGrid);
    status.textContent = `Found ${pokemon.name}!`;
    pageInfo.textContent = "Search result";
    prevBtn.disabled = true;
    nextBtn.disabled = true;
  } catch (error) {
    pokemonGrid.replaceChildren();
    status.textContent = error.message;
    pageInfo.textContent = "No matching result";
    prevBtn.disabled = true;
    nextBtn.disabled = true;
  } finally {
    searchButton.disabled = false;
  }
}

async function handleSearch() {
  const query = searchInput.value.trim();

  if (!query) {
    currentPage = 1;
    await loadPokemonGrid();
    return;
  }

  await showSearchResult(query);
}

searchButton.addEventListener("click", handleSearch);

searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    handleSearch();
  }
});

prevBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    loadPokemonGrid();
  }
});

nextBtn.addEventListener("click", () => {
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  if (currentPage < totalPages) {
    currentPage++;
    loadPokemonGrid();
  }
});


typeFilter.addEventListener("change", async () => {
  selectedType = typeFilter.value;

  const query = searchInput.value.trim();

  if (query) {
    await showSearchResult(query);
  } else {
    currentPage = 1;
    await loadPokemonGrid();
  }
});

loadPokemonGrid();
