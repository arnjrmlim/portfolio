
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

  return {
    pokemonList,
    totalCount: data.count
  };
}

const speciesCache = new Map();
const evolutionCache = new Map();
const pokemonCache = new Map();

async function fetchJson(url, message) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(message);
  return response.json();
}

export async function getPokemonEvolutionPaths(pokemon) {
  const speciesUrl = pokemon.species?.url;
  if (!speciesUrl) throw new Error("Species information is unavailable.");

  let species = speciesCache.get(speciesUrl);
  if (!species) {
    species = await fetchJson(speciesUrl, "Unable to load Pokémon species.");
    speciesCache.set(speciesUrl, species);
  }

  const chainUrl = species.evolution_chain?.url;
  if (!chainUrl) return [];

  let paths = evolutionCache.get(chainUrl);
  if (paths) return paths;

  const evolutionData = await fetchJson(
    chainUrl,
    "Unable to load Pokémon evolution data."
  );

  function getSpeciesId(url) {
    return Number(url.split("/").filter(Boolean).at(-1));
  }

  function describeRequirements(details = []) {
    if (!details.length) return "Evolution condition not specified";
    return details.map((detail) => {
      const conditions = [];
      if (detail.min_level != null) conditions.push(`Lv. ${detail.min_level}`);
      if (detail.item?.name) conditions.push(detail.item.name.replaceAll("-", " "));
      if (detail.held_item?.name) conditions.push(`hold ${detail.held_item.name.replaceAll("-", " ")}`);
      if (detail.trigger?.name === "trade") conditions.push("Trade");
      else if (detail.trigger?.name && detail.trigger.name !== "level-up") conditions.push(detail.trigger.name.replaceAll("-", " "));
      if (detail.min_happiness != null) conditions.push(`Friendship ${detail.min_happiness}+`);
      if (detail.min_affection != null) conditions.push(`Affection ${detail.min_affection}+`);
      if (detail.time_of_day) conditions.push(detail.time_of_day);
      if (detail.location?.name) conditions.push(detail.location.name.replaceAll("-", " "));
      if (detail.known_move?.name) conditions.push(`Know ${detail.known_move.name.replaceAll("-", " ")}`);
      if (detail.known_move_type?.name) conditions.push(`Know a ${detail.known_move_type.name} move`);
      if (detail.needs_overworld_rain) conditions.push("Rain in overworld");
      if (detail.turn_upside_down) conditions.push("Turn device upside down");
      if (detail.gender === 1) conditions.push("Female");
      if (detail.gender === 2) conditions.push("Male");
      if (detail.min_beauty != null) conditions.push(`Beauty ${detail.min_beauty}+`);
      if (detail.party_species?.name) conditions.push(`${detail.party_species.name} in party`);
      if (detail.party_type?.name) conditions.push(`${detail.party_type.name} type in party`);
      if (detail.trade_species?.name) conditions.push(`Trade for ${detail.trade_species.name}`);
      return conditions.length ? conditions.join(" · ") : "Special condition";
    }).join(" / ");
  }

  function buildPaths(node, currentPath = [], incomingRequirement = null) {
    const current = {
      name: node.species.name,
      id: getSpeciesId(node.species.url),
      requirement: incomingRequirement
    };
    const nextPath = [...currentPath, current];
    if (!node.evolves_to?.length) return [nextPath];
    return node.evolves_to.flatMap((child) =>
      buildPaths(child, nextPath, describeRequirements(child.evolution_details))
    );
  }

  paths = buildPaths(evolutionData.chain);

  // Enrich each stage with real Pokémon type data from the API.
  const uniqueStages = new Map();
  paths.flat().forEach((stage) => uniqueStages.set(stage.name, stage));
  await Promise.all([...uniqueStages.values()].map(async (stage) => {
    try {
      let details = pokemonCache.get(stage.name);
      if (!details) {
        details = await fetchJson(
          `${API_BASE_URL}/pokemon/${stage.id}`,
          `Unable to load details for ${stage.name}.`
        );
        pokemonCache.set(stage.name, details);
      }
      stage.types = details.types.map(({ type }) => type.name);
    } catch {
      stage.types = [];
    }
  }));

  evolutionCache.set(chainUrl, paths);
  return paths;
}

// Mega forms are queried from PokéAPI itself. This list only names known form
// endpoints to check; a section is rendered only when the endpoint exists.
const MEGA_FORM_CANDIDATES = {
  venusaur: ["venusaur-mega"],
  charizard: ["charizard-mega-x", "charizard-mega-y"],
  blastoise: ["blastoise-mega"],
  alakazam: ["alakazam-mega"],
  gengar: ["gengar-mega"],
  kangaskhan: ["kangaskhan-mega"],
  pinsir: ["pinsir-mega"],
  gyarados: ["gyarados-mega"],
  aerodactyl: ["aerodactyl-mega"],
  mewtwo: ["mewtwo-mega-x", "mewtwo-mega-y"],
  ampharos: ["ampharos-mega"],
  scizor: ["scizor-mega"],
  heracross: ["heracross-mega"],
  houndoom: ["houndoom-mega"],
  tyranitar: ["tyranitar-mega"],
  blaziken: ["blaziken-mega"],
  gardevoir: ["gardevoir-mega"],
  mawile: ["mawile-mega"],
  aggron: ["aggron-mega"],
  medicham: ["medicham-mega"],
  manectric: ["manectric-mega"],
  banette: ["banette-mega"],
  absol: ["absol-mega"],
  latias: ["latias-mega"],
  latios: ["latios-mega"],
  garchomp: ["garchomp-mega"],
  lucario: ["lucario-mega"],
  abomasnow: ["abomasnow-mega"],
  gallade: ["gallade-mega"],
  audino: ["audino-mega"],
  lopunny: ["lopunny-mega"],
  salamence: ["salamence-mega"],
  metagross: ["metagross-mega"],
  sharpedo: ["sharpedo-mega"],
  slowbro: ["slowbro-mega"],
  steelix: ["steelix-mega"],
  pidgeot: ["pidgeot-mega"],
  beedrill: ["beedrill-mega"],
  diancie: ["diancie-mega"]
};

export async function getPokemonMegaForms(pokemon) {
  const names = MEGA_FORM_CANDIDATES[pokemon.name] || [];
  if (!names.length) return [];
  return Promise.all(names.map(async (name) => {
    try {
      if (pokemonCache.has(name)) return pokemonCache.get(name);
      const form = await fetchJson(
        `${API_BASE_URL}/pokemon/${name}`,
        `Mega form ${name} is unavailable.`
      );
      pokemonCache.set(name, form);
      return form;
    } catch {
      // A missing endpoint is omitted rather than inventing a form.
      return null;
    }
  })).then((forms) => forms.filter(Boolean));
}
