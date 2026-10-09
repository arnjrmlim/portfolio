
const API_BASE_URL = "https://pokeapi.co/api/v2";

export async function searchPokemon(query) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    throw new Error("Please enter a Pokémon name or ID.");
  }

  const response = await fetch(
    `${API_BASE_URL}/pokemon/${encodeURIComponent(normalizedQuery)}`
  );

  if (!response.ok) {
    throw new Error("Pokémon not found. Check the name or ID.");
  }

  const pokemon = await response.json();

  return pokemon;
}

export async function getPokemonList(limit = 20, offset = 0) {
  const response = await fetch(
    `${API_BASE_URL}/pokemon?limit=${limit}&offset=${offset}`
  );

  if (!response.ok) {
    throw new Error("Unable to load the Pokémon list.");
  }

  const data = await response.json();

  const pokemonList = await Promise.all(
    data.results.map(async (item) => {
      const pokemonResponse = await fetch(item.url);

      if (!pokemonResponse.ok) {
        throw new Error(`Unable to load ${item.name}.`);
      }

      return pokemonResponse.json();
    })
  );

  return pokemonList;
}
