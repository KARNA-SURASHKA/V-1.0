import dengue from "../assets/health/diseases/dengue.webp";
import malaria from "../assets/health/diseases/malaria.webp";
import chikungunya from "../assets/health/diseases/chikungunya.webp";
import influenza from "../assets/health/diseases/influenza.webp";
import covid19 from "../assets/health/diseases/covid19.webp";
import tuberculosis from "../assets/health/diseases/tuberculosis.webp";
import genericDisease from "../assets/health/diseases/generic.webp";

import dengueUpdate from "../assets/health/updates/dengue.webp";
import malariaUpdate from "../assets/health/updates/malaria.webp";
import chikungunyaUpdate from "../assets/health/updates/chikungunya.webp";
import respiratoryUpdate from "../assets/health/updates/respiratory.webp";
import outbreakUpdate from "../assets/health/updates/outbreak.webp";
import genericUpdate from "../assets/health/updates/generic.webp";

import vectorPrevention from "../assets/health/prevention/vector-borne.webp";
import respiratoryPrevention from "../assets/health/prevention/respiratory.webp";
import foodWaterPrevention from "../assets/health/prevention/food-water.webp";
import hygienePrevention from "../assets/health/prevention/hygiene.webp";
import generalProtection from "../assets/health/prevention/general-protection.webp";
import emergencyPrevention from "../assets/health/prevention/emergency.webp";

const normalizeKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "")
    .replace(/^covid$/, "covid19");

export const preventionVisuals = {
  "vector-borne": vectorPrevention,
  respiratory: respiratoryPrevention,
  "food-water": foodWaterPrevention,
  hygiene: hygienePrevention,
  emergency: emergencyPrevention,
  general: generalProtection,
};

const categoryUpdateVisuals = {
  "vector-borne": outbreakUpdate,
  respiratory: respiratoryUpdate,
  "food-water": outbreakUpdate,
  hygiene: genericUpdate,
  emergency: outbreakUpdate,
  general: genericUpdate,
};

export const diseaseVisuals = {
  dengue: {
    key: "dengue",
    name: "Dengue",
    category: "vector-borne",
    transmissionType: "mosquito-borne",
    diseaseImage: dengue,
    updateImage: dengueUpdate,
    preventionImage: vectorPrevention,
    fallbackImage: genericDisease,
    preventionTitle: "Prevent mosquito breeding",
    preventionDescription:
      "Remove stagnant water and reduce mosquito breeding areas around your surroundings.",
  },

  malaria: {
    key: "malaria",
    name: "Malaria",
    category: "vector-borne",
    transmissionType: "mosquito-borne",
    diseaseImage: malaria,
    updateImage: malariaUpdate,
    preventionImage: vectorPrevention,
    fallbackImage: genericDisease,
    preventionTitle: "Prevent mosquito bites",
    preventionDescription:
      "Use mosquito nets or repellents, wear protective clothing, and reduce mosquito exposure.",
  },

  typhoid: {
    key: "typhoid",
    name: "Typhoid",
    category: "food-water",
    transmissionType: "food-and-water-borne",
    diseaseImage: genericDisease,
    updateImage: outbreakUpdate,
    preventionImage: foodWaterPrevention,
    fallbackImage: genericDisease,
    preventionTitle: "Use safe food and water",
    preventionDescription:
      "Use safe drinking water, maintain food hygiene, and follow verified local health guidance.",
  },

  chikungunya: {
    key: "chikungunya",
    name: "Chikungunya",
    category: "vector-borne",
    transmissionType: "mosquito-borne",
    diseaseImage: chikungunya,
    updateImage: chikungunyaUpdate,
    preventionImage: vectorPrevention,
    fallbackImage: genericDisease,
    preventionTitle: "Protect yourself from mosquito bites",
    preventionDescription:
      "Use mosquito repellents, wear protective clothing, and eliminate stagnant water.",
  },

  influenza: {
    key: "influenza",
    name: "Influenza",
    category: "respiratory",
    transmissionType: "respiratory",
    diseaseImage: influenza,
    updateImage: respiratoryUpdate,
    preventionImage: respiratoryPrevention,
    fallbackImage: genericDisease,
    preventionTitle: "Reduce respiratory infection risk",
    preventionDescription:
      "Maintain hand hygiene, avoid close contact with sick individuals, and follow local health guidance.",
  },

  covid19: {
    key: "covid19",
    name: "COVID-19",
    category: "respiratory",
    transmissionType: "respiratory",
    diseaseImage: covid19,
    updateImage: respiratoryUpdate,
    preventionImage: respiratoryPrevention,
    fallbackImage: genericDisease,
    preventionTitle: "Reduce respiratory infection risk",
    preventionDescription:
      "Maintain hand hygiene, avoid close contact with sick individuals, and follow verified local health guidance.",
  },

  tuberculosis: {
    key: "tuberculosis",
    name: "Tuberculosis",
    category: "respiratory",
    transmissionType: "airborne",
    diseaseImage: tuberculosis,
    updateImage: respiratoryUpdate,
    preventionImage: respiratoryPrevention,
    fallbackImage: genericDisease,
    preventionTitle: "Follow verified respiratory guidance",
    preventionDescription:
      "Follow approved public-health guidance and seek medical evaluation for persistent respiratory symptoms.",
  },
};

export function getDiseaseVisual(disease, category = null) {
  const key = normalizeKey(disease);
  const configured = diseaseVisuals[key];
  const resolvedCategory = configured?.category || category || "general";
  const categoryKey = String(resolvedCategory || "general").toLowerCase();

  if (configured) {
    return {
      ...configured,
      category: resolvedCategory,
      updateImage:
        configured.updateImage ||
        categoryUpdateVisuals[categoryKey] ||
        genericUpdate,
      preventionImage:
        configured.preventionImage ||
        preventionVisuals[categoryKey] ||
        generalProtection,
      fallbackImage: configured.fallbackImage || genericDisease,
    };
  }

  return {
    key: key || "unknown",
    name: disease || "Unknown disease",
    category: resolvedCategory,
    transmissionType: null,
    diseaseImage: genericDisease,
    updateImage:
      categoryUpdateVisuals[categoryKey] || genericUpdate,
    preventionImage:
      preventionVisuals[categoryKey] || generalProtection,
    fallbackImage: genericDisease,
    preventionTitle: "Follow verified health guidance",
    preventionDescription:
      "Disease-specific preventive information will be shown only when it has been verified by the health authority.",
  };
}

export function getPreventionVisual(disease, category = null) {
  const visual = getDiseaseVisual(disease, category);
  return {
    ...visual,
    preventionImage:
      preventionVisuals[String(visual.category || "general").toLowerCase()] ||
      visual.preventionImage ||
      generalProtection,
  };
}

export function getDiseaseCategory(disease, category = null) {
  return getDiseaseVisual(disease, category).category;
}

export { normalizeKey };