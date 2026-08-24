import { getPrecautionDiseaseVisuals, getPrecautionVisual as getVisual, normalizePrecautionDisease } from "./precautionVisuals";

const themes = {
  green: {
    accent: "#16803C",
    accentDark: "#116B32",
    soft: "#F3F8F2",
    softStrong: "#E7F2E7",
    border: "#CFE3D1",
    benefit: "#F0F7F0",
    benefitText: "#176B35",
    heroTint: "#F7FBF7",
  },
  red: {
    accent: "#E02424",
    accentDark: "#B91C1C",
    soft: "#FFF5F5",
    softStrong: "#FEECEC",
    border: "#FBCACA",
    benefit: "#FFF2F0",
    benefitText: "#B42318",
    heroTint: "#FFF7F7",
  },
  purple: {
    accent: "#6537B7",
    accentDark: "#5127A0",
    soft: "#F8F5FF",
    softStrong: "#EEE7FF",
    border: "#D9CCFA",
    benefit: "#F7F3FF",
    benefitText: "#5B2AA7",
    heroTint: "#FAF8FF",
  },
  blue: {
    accent: "#0B4EA2",
    accentDark: "#083B7D",
    soft: "#F3F8FF",
    softStrong: "#E6F0FF",
    border: "#C8DCFA",
    benefit: "#F1F6FC",
    benefitText: "#0B4EA2",
    heroTint: "#F7FAFF",
  },
};

const p = (type, title, description, benefit) => ({
  type,
  title,
  description,
  benefit,
});

const make = (key, config) => ({
  ...config,
  key,
  visuals: getPrecautionDiseaseVisuals(key),
});

export const precautionData = {
  malaria: make("malaria", {
    name: "Malaria",
    theme: "red",
    subtitle: "Follow these simple steps to protect yourself and your community.",
    intro:
      "Malaria activity is currently high in your monitored area. Follow these precautions to protect yourself and your family.",
    warning:
      "If you have high fever, chills, sweating, headache or body ache, seek medical attention immediately.",
    warningSub:
      "Early diagnosis and treatment can prevent complications.",
    precautions: [
      p("mosquito_nets", "Use Mosquito Nets", "Sleep under an insecticide-treated mosquito net especially during night.", "Best protection while sleeping"),
      p("repellent", "Use Repellents", "Apply mosquito repellents on exposed skin and wear long sleeves.", "Reapply as per instructions"),
      p("protective_clothing", "Wear Protective Clothing", "Wear full sleeves, long pants and light-colored clothing when outdoors.", "Helps reduce mosquito bites"),
      p("standing_water", "Remove Standing Water", "Empty and clean all containers, flower pots, and coolers regularly.", "Stops mosquito breeding"),
      p("clean_surroundings", "Keep Surroundings Clean", "Keep your home, yard and surroundings clean and free from waste.", "Clean areas, safe living"),
      p("screens_nets", "Use Screens & Doors", "Ensure windows and doors have proper screens to keep mosquitoes out.", "Keeps mosquitoes outside"),
    ],
  }),

  chikungunya: make("chikungunya", {
    name: "Chikungunya",
    theme: "purple",
    subtitle: "Follow these simple steps to protect yourself and your community.",
    intro:
      "Chikungunya cases are increasing in your monitored area. Follow these precautions to protect yourself and your family.",
    warning:
      "If you have sudden high fever, severe joint pain, rash or swelling, seek medical attention immediately.",
    warningSub:
      "Early diagnosis and proper care can help you recover faster.",
    precautions: [
      p("standing_water", "Eliminate Standing Water", "Remove or empty all containers that can collect water such as buckets, flower pots, coolers, tires and trays.", "Stops mosquito breeding"),
      p("screens_nets", "Use Screens & Nets", "Keep windows and doors fitted with screens. Use mosquito nets while sleeping during the day.", "Keeps mosquitoes out"),
      p("repellent", "Use Repellents", "Apply mosquito repellents on exposed skin and wear long sleeves when outdoors.", "Protects from mosquito bites"),
      p("protective_clothing", "Wear Protective Clothing", "Wear full sleeves, long pants and light-colored clothing to reduce mosquito bites.", "Reduces bite exposure"),
      p("rest_daytime", "Rest During Daytime", "Mosquitoes that spread Chikungunya bite mostly during the day. Rest during daytime when possible.", "Avoids peak biting hours"),
      p("clean_surroundings", "Keep Surroundings Clean", "Keep your home and surroundings clean. Proper waste disposal helps reduce mosquitoes.", "Promotes a healthy environment"),
    ],
  }),

  dengue: make("dengue", {
    name: "Dengue",
    theme: "red",
    subtitle: "Follow these simple steps to protect yourself and your community.",
    intro:
      "Dengue cases are increasing in your monitored area. Follow these precautions to protect yourself and your family.",
    warningTitle: "Watch for warning signs",
    warning:
      "High fever, severe headache, pain behind the eyes, joint and muscle pain, or rash.",
    warningSub:
      "Seek medical attention immediately if symptoms worsen.",
    precautions: [
      p("standing_water", "Remove Standing Water", "Eliminate all sources of standing water such as buckets, flower pots, coolers, plates under pots, tyres, and containers.", "Stops mosquito breeding"),
      p("water_containers", "Clean Water Containers Regularly", "Scrub and change water in storage containers, coolers and bird baths at least once a week.", "Prevents larvae growth"),
      p("screens_nets", "Use Screens & Nets", "Use window and door screens and sleep under mosquito nets, even during the day.", "Keeps mosquitoes out"),
      p("repellent", "Use Repellents", "Apply mosquito repellents on exposed skin and clothing. Reapply as per instructions.", "Protects from mosquito bites"),
      p("protective_clothing", "Wear Protective Clothing", "Wear full sleeves, long pants and light-colored clothing when outdoors.", "Reduces bite exposure"),
      p("clean_surroundings", "Keep Surroundings Clean", "Keep your home, yard and surroundings clean. Dispose of waste properly.", "Promotes a healthy environment"),
    ],
  }),

  covid19: make("covid19", {
    name: "COVID-19",
    theme: "red",
    subtitle: "Follow these simple steps to reduce the risk of COVID-19 infection.",
    intro:
      "Cases are increasing in your monitored area. Take preventive measures to stay safe and protect others.",
    warningTitle: "Watch for Warning Signs:",
    warning:
      "Fever, cough, sore throat, fatigue, or difficulty in breathing. Seek medical attention immediately if symptoms worsen.",
    warningSub: "",
    precautions: [
      p("mask", "Wear Masks", "Wear a mask in crowded places and poorly ventilated areas.", "Reduces virus transmission"),
      p("hand_hygiene", "Maintain Hand Hygiene", "Wash hands regularly with soap and water for at least 20 seconds.", "Kills the virus"),
      p("social_distance", "Maintain Social Distance", "Keep at least 2 meters distance from others and avoid crowded places.", "Reduces risk of infection"),
      p("avoid_touching_face", "Avoid Touching Face", "Do not touch eyes, nose and mouth with unwashed hands.", "Prevents entry of virus"),
      p("stay_home", "Stay Home If Unwell", "Stay home, rest and avoid contact with others if you have symptoms.", "Protects others"),
      p("vaccination", "Get Vaccinated", "Take COVID-19 vaccination as per health authority advice.", "Builds immunity"),
    ],
  }),

  influenza: make("influenza", {
    name: "Influenza (Flu)",
    theme: "blue",
    subtitle: "Follow these simple steps to reduce the risk of Influenza (Flu) infection.",
    intro:
      "Influenza cases are increasing in your monitored area. Follow these precautions to protect yourself and your family.",
    warningTitle: "Watch for Warning Signs:",
    warning:
      "High fever, difficulty breathing, chest pain, persistent dizziness or confusion.",
    warningSub:
      "Seek medical attention immediately if symptoms worsen.",
    precautions: [
      p("respiratory_hygiene", "Cover Your Cough and Sneeze", "Cover your mouth and nose with a tissue or your elbow when coughing or sneezing.", "Stops spread of germs"),
      p("hand_hygiene", "Wash Your Hands Frequently", "Wash hands with soap and water for at least 20 seconds, especially after coughing, sneezing or touching surfaces.", "Kills viruses and bacteria"),
      p("mask", "Wear a Mask", "Wear a mask in crowded places or if you have flu-like symptoms.", "Reduces risk of transmission"),
      p("ventilation", "Ensure Good Ventilation", "Keep rooms well ventilated and allow fresh air to circulate.", "Helps reduce airborne virus"),
      p("avoid_touching_face", "Avoid Touching Face", "Avoid touching your eyes, nose and mouth with unwashed hands.", "Prevents entry of virus"),
      p("stay_home", "Stay Home If Unwell", "Rest at home if you are sick and avoid contact with others to prevent spreading the virus.", "Protects others and speeds recovery"),
      p("healthy_lifestyle", "Stay Healthy", "Eat nutritious food, drink plenty of fluids and get enough sleep.", "Boosts your immunity"),
      p("vaccination", "Get Vaccinated", "Get your flu vaccine every year as per health authority advice.", "Helps prevent severe illness"),
    ],
  }),
};

export function getPrecautionData(disease) {
  const key = normalizePrecautionDisease(disease);
  return precautionData[key] || null;
}

export function getPrecautionTheme(disease, explicitTheme = null) {
  const data = getPrecautionData(disease);
  return themes[explicitTheme] || themes[data?.theme] || themes.green;
}

export function getPrecautionVisual(type, disease) {
  return getVisual(type, disease);
}

export { themes, normalizePrecautionDisease as normalizeKey };
