// src/data/precautionVisuals.js

const visualModules = import.meta.glob(
  "../assets/health/precautions/**/*.{png,jpg,jpeg,webp,svg}",
  {
    eager: true,
    query: "?url",
    import: "default",
  }
);

/**
 * Converts a disease/type name into a consistent key.
 *
 * Examples:
 * "COVID-19"    -> "covid19"
 * "Covid 19"    -> "covid19"
 * "Chikungunya" -> "chikungunya"
 * "standing_water" -> "standingwater"
 */
export function normalizePrecautionDisease(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/covid[-\s]?19/g, "covid19")
    .replace(/[^a-z0-9]/g, "");
}

/*
 * Backward-compatible alias.
 */
function normalize(value = "") {
  return normalizePrecautionDisease(value);
}

/**
 * Find a disease-specific visual first.
 *
 * Expected structure:
 *
 * assets/
 *   health/
 *     precautions/
 *       malaria/
 *         icon.png
 *         hero.png
 *         mosquito_nets.png
 *
 *       dengue/
 *         icon.png
 *         hero.png
 *         standing_water.png
 */
function findVisual(disease, type) {
  const diseaseKey = normalizePrecautionDisease(disease);
  const typeKey = normalize(type);

  const entries = Object.entries(visualModules);

  /*
   * ----------------------------------------------------------
   * 1. Disease-specific artwork
   * ----------------------------------------------------------
   */
  const diseaseMatch = entries.find(([path]) => {
    const pathParts = path.split("/");

    // Find the disease folder exactly.
    const hasDiseaseFolder = pathParts.some(
      (part) => normalize(part) === diseaseKey
    );

    if (!hasDiseaseFolder) {
      return false;
    }

    // Match the requested image type against the filename/path.
    return pathParts.some((part) =>
      normalize(part).includes(typeKey)
    );
  });

  if (diseaseMatch) {
    return diseaseMatch[1];
  }

  /*
   * ----------------------------------------------------------
   * 2. Common artwork
   * ----------------------------------------------------------
   *
   * This is kept for future use if you add:
   *
   * precautions/common/
   *
   * later.
   */
  const commonMatch = entries.find(([path]) => {
    const pathParts = path.split("/");

    const isCommon = pathParts.some(
      (part) => normalize(part) === "common"
    );

    if (!isCommon) {
      return false;
    }

    return pathParts.some((part) =>
      normalize(part).includes(typeKey)
    );
  });

  if (commonMatch) {
    return commonMatch[1];
  }

  return null;
}

/**
 * Returns all precaution illustrations for a disease.
 *
 * Example:
 *
 * getPrecautionDiseaseVisuals("Dengue")
 *
 * Returns:
 *
 * {
 *   icon: "...",
 *   hero: "...",
 *   standing_water: "...",
 *   water_containers: "...",
 *   screens_nets: "...",
 *   repellent: "...",
 *   protective_clothing: "...",
 *   clean_surroundings: "..."
 * }
 */
export function getPrecautionDiseaseVisuals(disease) {
  const types = [
    "icon",
    "hero",

    // Mosquito-borne diseases
    "mosquito_nets",
    "repellent",
    "protective_clothing",
    "standing_water",
    "clean_surroundings",
    "screens_nets",
    "water_containers",
    "rest_daytime",

    // COVID-19 / Influenza
    "mask",
    "hand_hygiene",
    "social_distance",
    "avoid_touching_face",
    "stay_home",
    "vaccination",
    "ventilation",
    "respiratory_hygiene",
    "healthy_lifestyle",

    // Future precaution types
    "hydration",
    "safe_food",
    "safe_water",
    "doctor",
  ];

  return Object.fromEntries(
    types.map((type) => [
      type,
      findVisual(disease, type),
    ])
  );
}

/**
 * Get one particular visual.
 *
 * Example:
 *
 * getPrecautionVisual("standing_water", "Dengue")
 */
export function getPrecautionVisual(type, disease) {
  return findVisual(disease, type);
}

/*
 * Default export retained for compatibility.
 */
export default getPrecautionDiseaseVisuals;