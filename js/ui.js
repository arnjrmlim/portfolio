
function createPokemonCard(pokemon) {
  const card = document.createElement("article");
  card.className = "pokemon-card";

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
