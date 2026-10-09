
function createPokemonCard(pokemon) {
  const card = document.createElement("article");
  
  card.className = "pokemon-card";
  card.dataset.pokemonName = pokemon.name;
  
  const artwork =
    pokemon.sprites.other["official-artwork"].front_default ||
    pokemon.sprites.front_default;

  const image = document.createElement("img");
  image.src = artwork || "";
  image.alt = pokemon.name;
  image.loading = "lazy";

  const number = document.createElement("p");
  number.textContent = `#${String(pokemon.id).padStart(3, "0")}`;

  const name = document.createElement("h2");
  name.textContent =
    pokemon.name.charAt(0).toUpperCase() +
    pokemon.name.slice(1);

  const typeList = document.createElement("div");
  typeList.className = "type-list";

  pokemon.types.forEach((item) => {
    const badge = document.createElement("span");
    badge.className = "type-badge";
    badge.textContent = item.type.name;
    typeList.append(badge);
  });

  const details = document.createElement("p");
  details.textContent =
    `Height: ${pokemon.height / 10} m · ` +
    `Weight: ${pokemon.weight / 10} kg`;

  card.append(image, number, name, typeList, details);

  return card;
}

export function renderPokemon(pokemon, container) {
  container.replaceChildren(createPokemonCard(pokemon));
}

export function renderPokemonGrid(pokemonList, container) {
  const fragment = document.createDocumentFragment();

  pokemonList.forEach((pokemon) => {
    fragment.append(createPokemonCard(pokemon));
  });

  container.replaceChildren(fragment);
}

export function renderPokemonModal(pokemon, modal) {
  const card = modal.querySelector(".pokemon-modal-card");
  const artwork = modal.querySelector(".modal-pokemon-image");
  card.classList.remove("is-flipped");

  modal.querySelector(".modal-pokemon-id").textContent =
    `#${String(pokemon.id).padStart(3, "0")}`;
  modal.querySelector(".modal-pokemon-name").textContent =
    pokemon.name.replaceAll("-", " ");
  artwork.src = pokemon.sprites.other?.["official-artwork"]?.front_default ||
    pokemon.sprites.front_default || "";
  artwork.alt = `${pokemon.name} official artwork`;

  const typesContainer = modal.querySelector(".modal-pokemon-types");
  typesContainer.replaceChildren();
  pokemon.types.forEach(({ type }) => typesContainer.append(makeTypeBadge(type.name)));

  const statsContainer = modal.querySelector(".modal-pokemon-stats");
  statsContainer.replaceChildren();
  pokemon.stats.forEach(({ base_stat, stat }) => {
    const row = document.createElement("div");
    row.className = "modal-stat";
    const label = document.createElement("span");
    const labels = { hp: "HP", attack: "Attack", defense: "Defense", "special-attack": "Sp. Attack", "special-defense": "Sp. Defense", speed: "Speed" };
    label.textContent = labels[stat.name] || stat.name;
    const track = document.createElement("div");
    track.className = "modal-stat-track";
    const fill = document.createElement("span");
    fill.className = "modal-stat-fill";
    fill.style.width = `${Math.min(base_stat / 255 * 100, 100)}%`;
    track.append(fill);
    const value = document.createElement("span");
    value.className = "modal-stat-value";
    value.textContent = base_stat;
    row.append(label, track, value);
    statsContainer.append(row);
  });

  const height = modal.querySelector(".modal-pokemon-height");
  if (height) height.textContent = `${pokemon.height / 10} m`;
  const weight = modal.querySelector(".modal-pokemon-weight");
  if (weight) weight.textContent = `${pokemon.weight / 10} kg`;
  const abilities = modal.querySelector(".modal-pokemon-abilities");
  if (abilities) {
    abilities.replaceChildren();
    pokemon.abilities.forEach(({ ability, is_hidden }) => {
      const badge = document.createElement("span");
      badge.className = "modal-ability";
      badge.textContent = `${ability.name.replaceAll("-", " ")}${is_hidden ? " (Hidden)" : ""}`;
      abilities.append(badge);
    });
  }

  const description = modal.querySelector(".modal-pokemon-description");
  if (description) description.textContent = "";
  modal.hidden = false;
}

function makeTypeBadge(typeName) {
  const badge = document.createElement("span");
  badge.className = `type-badge type-${typeName}`;
  badge.textContent = typeName;
  return badge;
}

function getArtworkUrl(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

export function renderPokemonEvolutions(paths, container, currentPokemon) {
  container.replaceChildren();
  const matchingPaths = paths.filter((path) => path.some((stage) => stage.name === currentPokemon.name));
  const pathsToShow = matchingPaths.length ? matchingPaths : paths;

  if (!pathsToShow.length) {
    const empty = document.createElement("p");
    empty.className = "evolution-empty";
    empty.textContent = `${currentPokemon.name.replaceAll("-", " ")} has no recorded evolution stages.`;
    container.append(empty);
    return;
  }

  const uniquePaths = new Map();
  pathsToShow.forEach((path) => uniquePaths.set(path.map((stage) => stage.name).join("/"), path));
  [...uniquePaths.values()].forEach((path) => {
    const pathElement = document.createElement("div");
    pathElement.className = "evolution-path";
    path.forEach((stageData, index) => {
      const stage = document.createElement("div");
      stage.className = "evolution-stage";
      if (stageData.name === currentPokemon.name) stage.classList.add("is-current");

      const artworkFrame = document.createElement("div");
      artworkFrame.className = "evolution-artwork-frame";
      const image = document.createElement("img");
      image.src = getArtworkUrl(stageData.id);
      image.alt = `${stageData.name} official artwork`;
      image.loading = "lazy";
      image.onerror = () => {
        image.onerror = null;
        image.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${stageData.id}.png`;
      };
      artworkFrame.append(image);

      const label = document.createElement("strong");
      label.textContent = stageData.name.replaceAll("-", " ");
      const badges = document.createElement("div");
      badges.className = "evolution-types";
      (stageData.types || []).forEach((typeName) => badges.append(makeTypeBadge(typeName)));
      const requirement = document.createElement("small");
      requirement.className = "evolution-requirement";
      requirement.textContent = stageData.requirement || (index === 0 ? "Base form" : "Evolution condition unavailable");

      // Type data is fetched lazily from the API cache, not inferred from names.
      stage.append(artworkFrame, label, badges, requirement);
      pathElement.append(stage);
      if (index < path.length - 1) {
        const arrow = document.createElement("span");
        arrow.className = "evolution-arrow";
        arrow.textContent = "→";
        arrow.setAttribute("aria-hidden", "true");
        pathElement.append(arrow);
      }
    });
    container.append(pathElement);
  });
}

export function renderMegaForms(forms, container, basePokemon) {
  container.replaceChildren();
  if (!forms.length) {
    container.hidden = true;
    return;
  }
  container.hidden = false;
  forms.forEach((form) => {
    const item = document.createElement("article");
    item.className = "mega-form-card";
    const base = document.createElement("div");
    base.className = "mega-form-side";
    const baseImage = document.createElement("img");
    baseImage.src = basePokemon?.sprites?.other?.["official-artwork"]?.front_default || getArtworkUrl(basePokemon?.id || form.id);
    baseImage.alt = `${(basePokemon?.name || "Pokémon").replaceAll("-", " ")} artwork`;
    const baseName = document.createElement("span");
    baseName.textContent = (basePokemon?.name || "Pokémon").replaceAll("-", " ");
    base.append(baseImage, baseName);
    const arrow = document.createElement("span");
    arrow.className = "evolution-arrow";
    arrow.textContent = "→";
    const detail = document.createElement("div");
    detail.className = "mega-form-detail";
    const title = document.createElement("h4");
    title.textContent = form.name.replaceAll("-", " ");
    const types = document.createElement("div");
    types.className = "evolution-types";
    form.types.forEach(({ type }) => types.append(makeTypeBadge(type.name)));
    const image = document.createElement("img");
    image.src = form.sprites.other?.["official-artwork"]?.front_default || getArtworkUrl(form.id);
    image.alt = title.textContent;
    detail.append(title, types);
    item.append(base, arrow, detail, image);
    container.append(item);
  });
}
