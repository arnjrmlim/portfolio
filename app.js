
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

async function loadPokemonGrid() {
  status.textContent = "Loading Pokémon...";
  searchButton.disabled = true;

  try {
    const pokemonList = await getPokemonList(20, 0);

    renderPokemonGrid(pokemonList, pokemonGrid);

    status.textContent =
      `Showing ${pokemonList.length} Pokémon.`;
  } catch (error) {
    status.textContent = error.message;
  } finally {
    searchButton.disabled = false;
  }
}

async function handleSearch() {
  const query = searchInput.value.trim();

  if (!query) {
    await loadPokemonGrid();
    return;
  }

  status.textContent = "Searching...";
  searchButton.disabled = true;

  try {
    const pokemon = await searchPokemon(query);

    renderPokemon(pokemon, pokemonGrid);
    status.textContent = `Found ${pokemon.name}!`;
  } catch (error) {
    status.textContent = error.message;
    pokemonGrid.replaceChildren();
  } finally {
    searchButton.disabled = false;
  }
}

searchButton.addEventListener("click", handleSearch);

searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    handleSearch();
  }
});

loadPokemonGrid();