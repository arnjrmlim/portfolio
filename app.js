
import {
  searchPokemon,
  getPokemonList,
  getPokemonEvolutionPaths,
  getPokemonMegaForms
} from "./js/api.js";

import {
  renderPokemon,
  renderPokemonGrid,
  renderPokemonModal,
  renderPokemonEvolutions,
  renderMegaForms
} from "./js/ui.js";

// DOM elements
const searchInput = document.querySelector("#pokemonSearch");
const searchButton = document.querySelector("#searchBtn");
const status = document.querySelector("#status");
const pokemonGrid = document.querySelector("#pokemonGrid");
const pokemonModal = document.querySelector("#pokemonModal");

const prevBtn = document.querySelector("#prevBtn");
const nextBtn = document.querySelector("#nextBtn");
const pageInfo = document.querySelector("#pageInfo");
const typeFilter = document.querySelector("#typeFilter");

// Configuration
const PAGE_SIZE = 20;

// Application state
let currentPage = 1;
let totalCount = 0;
let selectedType = "all";
let lastFocusedElement = null;
let modalRequestId = 0;

// Load Pokémon for the current page
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

    const displayedPokemon =
      selectedType === "all"
        ? pokemonList
        : pokemonList.filter((pokemon) =>
            pokemon.types.some(
              (item) => item.type.name === selectedType
            )
          );

    renderPokemonGrid(displayedPokemon, pokemonGrid);

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    pageInfo.textContent =
      `Page ${currentPage} of ${totalPages}`;

    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;

    status.textContent =
      selectedType === "all"
        ? `Showing ${pokemonList.length} Pokémon.`
        : `Showing ${displayedPokemon.length} matching Pokémon on this page.`;
  } catch (error) {
    console.error("Failed to load Pokémon:", error);
    status.textContent =
      "Unable to load Pokémon. Please try again.";
    pokemonGrid.replaceChildren();
  } finally {
    searchButton.disabled = false;

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
  }
}

// Search for one Pokémon
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
    console.error("Search failed:", error);

    pokemonGrid.replaceChildren();
    status.textContent =
      "Pokémon not found. Check the name and try again.";

    pageInfo.textContent = "No matching result";
    prevBtn.disabled = true;
    nextBtn.disabled = true;
  } finally {
    searchButton.disabled = false;
  }
}

// Handle search button and Enter key
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

// Pagination
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

// Type filter
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

// Close the Pokémon modal
function closePokemonModal() {
  // Invalidate any modal request still in progress.
  modalRequestId++;

  pokemonModal.hidden = true;

  pokemonModal
    .querySelector(".pokemon-modal-card")
    .classList.remove("is-flipped");

  lastFocusedElement?.focus();
}

// Open the modal and load evolution information
pokemonGrid.addEventListener("click", async (event) => {
  const pokemonCard = event.target.closest(".pokemon-card");

  if (!pokemonCard || !pokemonGrid.contains(pokemonCard)) {
    return;
  }

  const pokemonName = pokemonCard.dataset.pokemonName;

  if (!pokemonName) {
    console.warn(
      "Pokémon card is missing data-pokemon-name."
    );
    return;
  }

  lastFocusedElement = pokemonCard;

  const requestId = ++modalRequestId;

  pokemonModal.hidden = false;

  const evolutionContainer = pokemonModal.querySelector(
    ".modal-evolution-chain"
  );
  const megaContainer = pokemonModal.querySelector(".modal-mega-forms");
  const megaSection = pokemonModal.querySelector(".mega-evolution-section");

  evolutionContainer.textContent = "Loading evolution data...";
  megaContainer.replaceChildren();
  megaSection.hidden = true;

  try {
    // Fetch complete Pokémon data.
    const pokemon = await searchPokemon(pokemonName);

    // Ignore outdated requests if another Pokémon was selected.
    if (requestId !== modalRequestId) return;

    renderPokemonModal(pokemon, pokemonModal);

    const dialog = pokemonModal.querySelector(".pokemon-modal-dialog");
    dialog.tabIndex = -1;
    dialog.focus();

    const closeButton = pokemonModal.querySelector(".modal-close");
    const frontFace = pokemonModal.querySelector(".pokemon-card-front");
    const backFace = pokemonModal.querySelector(".pokemon-card-back");
    if (closeButton.parentElement !== frontFace) {
      frontFace.prepend(closeButton);
      backFace.prepend(closeButton.cloneNode(true));
    }

    // Load evolution data separately.
    try {
      const paths = await getPokemonEvolutionPaths(pokemon);

      if (
        requestId !== modalRequestId ||
        pokemonModal.hidden
      ) {
        return;
      }

      renderPokemonEvolutions(paths, evolutionContainer, pokemon);
    } catch (error) {
      console.error("Failed to load Pokémon evolution data:", error);

      if (requestId === modalRequestId) {
        evolutionContainer.textContent =
          "Evolution information is temporarily unavailable.";
      }
      return;
    }

    // Mega forms are optional. A failure here must not erase the evolution line.
    try {
      const megaForms = await getPokemonMegaForms(pokemon);
      if (requestId === modalRequestId && !pokemonModal.hidden) {
        renderMegaForms(megaForms, megaContainer, pokemon);
        megaSection.hidden = megaForms.length === 0;
      }
    } catch (error) {
      console.warn("Mega Evolution data is unavailable:", error);
      if (requestId === modalRequestId) megaSection.hidden = true;
    }
  } catch (error) {
    console.error(
      "Failed to load Pokémon details:",
      error
    );

    if (requestId === modalRequestId) {
      closePokemonModal();
      status.textContent =
        "Unable to load Pokémon details. Please try again.";
    }
  }
});

// Flip the card and close through the close button or overlay.
pokemonModal.addEventListener("click", (event) => {
  if (event.target.closest("[data-flip-card]")) {
    pokemonModal
      .querySelector(".pokemon-modal-card")
      .classList.toggle("is-flipped");
  }

  if (event.target.closest("[data-close-modal]")) {
    closePokemonModal();
  }
});

// Escape key closes the modal.
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !pokemonModal.hidden) {
    closePokemonModal();
  }
});

// Initial page load
loadPokemonGrid();
