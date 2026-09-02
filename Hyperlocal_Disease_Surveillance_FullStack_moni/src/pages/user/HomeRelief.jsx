import { useMemo, useState } from "react";

import {
  ArrowRight,
  Check,
  CircleAlert,
  HeartPulse,
  Info,
  Search,
  ShieldCheck,
  X,
  GlassWater,
  CupSoda,
  Soup,
  UserRound,
  Thermometer,
  Wind,
} from "lucide-react";

import { api } from "../../api";

import familyImage from "../../assets/ui/home-family.png";
import doctorImage from "../../assets/ui/home-doctor.png";
import botImage from "../../assets/ui/home-bot.png";

// ============================================================
// POPULAR SYMPTOMS
// ============================================================

const INITIAL_SYMPTOMS = [
  ["Sore Throat", "Sore throat"],
  ["Headache", "Headache"],
  ["Fever", "Fever"],
  ["Cough", "Cough"],
  ["Stomach Pain", "Stomach pain"],
  ["Cold & Congestion", "Cold and congestion"],
];

// ============================================================
// DEFAULT EMPTY RESPONSE
// ============================================================

const EMPTY_RESULT = {
  query: "",
  recommended: [],
  use_with_caution: [],
  restricted: [],
  alternatives: [],
  context: {},
  total_found: 0,
};

// ============================================================
// NORMALIZE SEARCH RESPONSE
// ============================================================

function normalizeSearchResponse(data, query) {
  if (!data || typeof data !== "object") {
    return {
      ...EMPTY_RESULT,
      query,
    };
  }

  return {
    query: data.query || query,

    recommended: Array.isArray(data.recommended)
      ? data.recommended
      : [],

    use_with_caution: Array.isArray(data.use_with_caution)
      ? data.use_with_caution
      : [],

    restricted: Array.isArray(data.restricted)
      ? data.restricted
      : [],

    alternatives: Array.isArray(data.alternatives)
      ? data.alternatives
      : [],

    context:
      data.context &&
      typeof data.context === "object"
        ? data.context
        : {},

    total_found: Number(data.total_found || 0),
  };
}

// ============================================================
// NORMALIZE SAFETY RULE
//
// The backend may store safety information using fields such as:
//
// suitability
// status
// rule_type
// condition_type
// condition_value
// reason
//
// This function makes the User Portal tolerant of all of them.
// ============================================================

function normalizeSafetyRule(rule, index = 0) {
  if (!rule || typeof rule !== "object") {
    return null;
  }

  const suitability = String(
    rule.suitability ||
      rule.status ||
      rule.rule_status ||
      rule.recommendation ||
      ""
  )
    .trim()
    .toUpperCase();

  const conditionType = String(
    rule.condition_type ||
      rule.conditionType ||
      rule.type ||
      rule.category ||
      ""
  ).trim();

  const conditionValue = String(
    rule.condition_value ||
      rule.conditionValue ||
      rule.value ||
      rule.condition ||
      rule.group ||
      ""
  ).trim();

  const reason = String(
    rule.reason ||
      rule.safety_reason ||
      rule.explanation ||
      rule.notes ||
      rule.description ||
      ""
  ).trim();

  const id =
    rule.id ||
    rule.rule_id ||
    `${conditionType}-${conditionValue}-${index}`;

  return {
    ...rule,
    id,
    suitability,
    condition_type: conditionType,
    condition_value: conditionValue,
    reason,
  };
}

// ============================================================
// COLLECT SAFETY RULES FROM ALL REMEDIES
//
// This is important because the search can return multiple
// approved remedies. We do not want the safety section to look
// only at recommended[0].
// ============================================================

function collectSafetyRules(items = []) {
  const collected = [];

  items.forEach((item, itemIndex) => {
    if (!item || typeof item !== "object") {
      return;
    }

    const rules = Array.isArray(item.safety_rules)
      ? item.safety_rules
      : Array.isArray(item.safetyRules)
      ? item.safetyRules
      : [];

    rules.forEach((rule, ruleIndex) => {
      const normalized = normalizeSafetyRule(
        rule,
        `${itemIndex}-${ruleIndex}`
      );

      if (normalized) {
        collected.push({
          ...normalized,
          remedy_name:
            item.name ||
            item.remedy_name ||
            "Home Relief",
          remedy_id:
            item.id ||
            item.remedy_id ||
            item.home_relief_remedy_id ||
            null,
        });
      }
    });
  });

  // Remove duplicate rules.
  const seen = new Set();

  return collected.filter((rule) => {
    const key = [
      String(rule.condition_type || "").toLowerCase(),
      String(rule.condition_value || "").toLowerCase(),
      String(rule.suitability || "").toLowerCase(),
      String(rule.reason || "").toLowerCase(),
    ].join("|");

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

// ============================================================
// SAFETY CLASSIFICATION
//
// Medical Supervisor currently uses CAUTION in the stored data.
// CAUTION must therefore appear on the User Portal as a warning
// rather than disappearing.
// ============================================================

function isSuitableRule(rule) {
  const value = String(rule?.suitability || "")
    .trim()
    .toUpperCase();

  return [
    "SUITABLE",
    "RECOMMENDED",
    "APPROVED",
    "SAFE",
  ].includes(value);
}

function isUnsafeRule(rule) {
  const value = String(rule?.suitability || "")
    .trim()
    .toUpperCase();

  return [
    "NOT_RECOMMENDED",
    "NOT RECOMMENDED",
    "CONTRAINDICATED",
    "CONTRAINDICATION",
    "UNSUITABLE",
    "NOT_SUITABLE",
    "NOT SUITABLE",
    "RESTRICTED",
    "RESTRICTION",
    "CAUTION",
    "USE_WITH_CAUTION",
    "USE WITH CAUTION",
    "WARNING",
    "AVOID",
  ].includes(value);
}

// ============================================================
// SAFETY LABEL
// ============================================================

function getSafetyLabel(rule) {
  const value = String(rule?.suitability || "")
    .trim()
    .toUpperCase();

  if (
    [
      "CAUTION",
      "USE_WITH_CAUTION",
      "USE WITH CAUTION",
      "WARNING",
    ].includes(value)
  ) {
    return "Use With Caution";
  }

  if (
    [
      "CONTRAINDICATED",
      "CONTRAINDICATION",
      "AVOID",
    ].includes(value)
  ) {
    return "Not Recommended";
  }

  return "Not Suitable";
}

// ============================================================
// FORMAT CONDITION
// ============================================================

function formatCondition(rule) {
  const type = String(
    rule?.condition_type || ""
  ).trim();

  const value = String(
    rule?.condition_value || ""
  ).trim();

  if (type && value) {
    return `${type} — ${value}`;
  }

  if (value) {
    return value;
  }

  if (type) {
    return type;
  }

  return "Specific users or conditions";
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function HomeRelief({
  onGoMedicalAssistant,
}) {
  const [query, setQuery] = useState("");

  const [results, setResults] = useState(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [details, setDetails] = useState(null);

  const searched = Boolean(results);

  const resultData =
    results || {
      ...EMPTY_RESULT,
    };

  const queryLabel =
    resultData.query ||
    query ||
    "Home Relief";

  const recommended =
    resultData.recommended || [];

  const caution =
    resultData.use_with_caution || [];

  const restricted =
    resultData.restricted || [];

  // ============================================================
  // ALL RESULT REMEDIES
  // ============================================================

  const allResultRemedies = useMemo(
    () => [
      ...recommended,
      ...caution,
      ...restricted,
    ],
    [
      recommended,
      caution,
      restricted,
    ]
  );

  // ============================================================
  // COLLECT ALL SAFETY RULES
  // ============================================================

  const safetyRules = useMemo(
    () =>
      collectSafetyRules(
        allResultRemedies
      ),
    [allResultRemedies]
  );

  // ============================================================
  // SUITABLE RULES
  // ============================================================

  const suitableRules = useMemo(
    () =>
      safetyRules.filter(
        isSuitableRule
      ),
    [safetyRules]
  );

  // ============================================================
  // UNSAFE / CAUTION RULES
  //
  // This is the important change.
  // CAUTION from Medical Supervisor is now displayed.
  // ============================================================

  const unsafeRules = useMemo(
    () =>
      safetyRules.filter(
        isUnsafeRule
      ),
    [safetyRules]
  );

  // ============================================================
  // SELECTED REMEDY
  // ============================================================

  const selectedRemedy =
    recommended[0] ||
    caution[0] ||
    restricted[0] ||
    null;

  // ============================================================
  // SEARCH
  // ============================================================

  const search = async (
    value = query
  ) => {
    const text = String(
      value || ""
    ).trim();

    if (!text) {
      return;
    }

    setQuery(text);

    setLoading(true);

    setError("");

    try {
      const data =
        await api.searchHomeRelief(
          text
        );

      setResults(
        normalizeSearchResponse(
          data,
          text
        )
      );
    } catch (err) {
      console.error(
        "Home Relief search failed:",
        err
      );

      setResults({
        ...EMPTY_RESULT,
        query: text,
      });

      setError(
        "Unable to connect to the medical supervisor's approved Home Relief records."
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // OPEN REMEDY DETAILS
  // ============================================================

  const openDetails = async (
    item
  ) => {
    setDetails(item);

    const id =
      item?.id ||
      item?.remedy_id ||
      item?.home_relief_remedy_id;

    if (!id) {
      return;
    }

    try {
      const response =
        await api.getHomeReliefRemedy(
          id
        );

      setDetails(
        response?.remedy ||
          response?.data ||
          response ||
          item
      );
    } catch {
      // Keep already-loaded information.
    }
  };

  // ============================================================
  // REMEDY ICONS
  // ============================================================

  const icons = [
    GlassWater,
    CupSoda,
    Soup,
    Wind,
    UserRound,
  ];

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-[calc(100vh-126px)] w-full bg-white px-[28px] pb-[24px] pt-[24px]">
      <div className="mx-auto max-w-[1250px]">

        {/* ======================================================
            INITIAL VIEW
        ====================================================== */}

        {!searched ? (
          <>
            <section className="grid grid-cols-[1.02fr_0.98fr] gap-[26px]">

              <div className="rounded-[16px] border border-[#E4E8E5] bg-white px-[27px] pb-[24px] pt-[27px] shadow-[0_1px_5px_rgba(16,42,67,0.03)]">

                <h2 className="text-[26px] font-bold tracking-[-0.02em] text-[#087A32]">
                  How can we help you today?
                </h2>

                <p className="mt-[8px] text-[14px] text-[#26384D]">
                  Search any symptom or discomfort to get simple home care tips.
                </p>

                <div className="mt-[20px] flex h-[58px] items-center rounded-full border border-[#E3E7E4] bg-white px-[18px] shadow-[0_3px_10px_rgba(16,42,67,0.08)] focus-within:border-[#62B987]">

                  <Search
                    size={25}
                    strokeWidth={1.8}
                    className="shrink-0 text-[#111820]"
                  />

                  <input
                    value={query}
                    onChange={(e) =>
                      setQuery(
                        e.target.value
                      )
                    }
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      search()
                    }
                    placeholder="Search any symptom or discomfort"
                    className="ml-[15px] min-w-0 flex-1 bg-transparent text-[14px] text-[#151719] outline-none placeholder:text-[#687487]"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      search()
                    }
                    disabled={loading}
                    className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-[#149047] text-white transition hover:bg-[#087A32] disabled:opacity-50"
                  >
                    <ArrowRight size={22} />
                  </button>
                </div>

                <p className="mt-[17px] text-[13px] text-[#26384D]">
                  <span className="font-medium">
                    Examples:
                  </span>{" "}
                  <span className="text-[#087A32]">
                    Sore throat, Headache, Fever, Cough, Stomach pain
                  </span>
                </p>
              </div>

              <div className="relative min-h-[219px] overflow-hidden rounded-[16px]">
                <img
                  src={familyImage}
                  alt="Family receiving home health care"
                  className="absolute inset-0 h-full w-full object-cover object-left"
                />
              </div>
            </section>

            {/* ==================================================
                POPULAR SYMPTOMS
            ================================================== */}

            <section className="mt-[18px] grid grid-cols-[1.02fr_0.98fr] gap-[26px]">

              <div className="rounded-[16px] border border-[#E4E8E5] bg-white px-[27px] py-[22px]">

                <h3 className="text-[16px] font-bold text-[#101A31]">
                  Popular Symptoms
                </h3>

                <p className="mt-[6px] text-[13px] text-[#26384D]">
                  Quick access to common health concerns
                </p>

                <div className="mt-[18px] grid grid-cols-2 gap-[12px]">

                  {INITIAL_SYMPTOMS.map(
                    (
                      [label, value],
                      index
                    ) => {
                      const Icon =
                        [
                          HeartPulse,
                          UserRound,
                          Thermometer,
                          Wind,
                          Soup,
                          Wind,
                        ][index];

                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() =>
                            search(value)
                          }
                          className="flex h-[64px] items-center gap-[14px] rounded-[15px] border border-[#E8ECE9] bg-white px-[14px] text-left shadow-[0_1px_5px_rgba(16,42,67,0.03)] transition hover:border-[#BBDDC8] hover:bg-[#FBFEFC]"
                        >
                          <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-[#EEF8EF] text-[#087A32]">
                            <Icon
                              size={21}
                              strokeWidth={1.7}
                            />
                          </span>

                          <span className="text-[14px] font-semibold text-[#087A32]">
                            {label}
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setResults(null);
                    setError("");
                  }}
                  className="mt-[17px] flex items-center gap-2 text-[13px] font-semibold text-[#087A32]"
                >
                  Browse all symptoms
                  <ArrowRight size={17} />
                </button>
              </div>

              {/* ==================================================
                  WHAT YOU'LL GET
              ================================================== */}

              <div className="rounded-[16px] border border-[#E4E8E5] bg-white px-[27px] py-[22px]">

                <h3 className="text-[16px] font-bold text-[#101A31]">
                  What You’ll Get
                </h3>

                <p className="mt-[6px] text-[13px] text-[#26384D]">
                  Simple, safe and helpful guidance
                </p>

                <div className="mt-[17px] space-y-[12px]">

                  {[
                    [
                      HeartPulse,
                      "Home Relief Tips",
                      "Easy-to-follow home care measures for quick relief.",
                    ],
                    [
                      ShieldCheck,
                      "Suitability & Safety",
                      "Know who can follow these measures safely.",
                    ],
                    [
                      CircleAlert,
                      "When to Be Cautious",
                      "Understand when to avoid home remedies.",
                    ],
                    [
                      UserRound,
                      "When to Seek Help",
                      "Clear guidance on when to consult a doctor.",
                    ],
                  ].map(
                    ([
                      Icon,
                      title,
                      text,
                    ]) => (
                      <div
                        key={title}
                        className="flex items-center gap-[14px]"
                      >
                        <span className="flex h-[47px] w-[47px] shrink-0 items-center justify-center rounded-[12px] bg-[#EEF8EF] text-[#087A32]">
                          <Icon
                            size={23}
                            strokeWidth={1.7}
                          />
                        </span>

                        <div>
                          <p className="text-[13px] font-bold text-[#151719]">
                            {title}
                          </p>

                          <p className="mt-[3px] text-[12px] leading-[1.45] text-[#26384D]">
                            {text}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </section>

            {/* ==================================================
                IMPORTANT NOTE
            ================================================== */}

            <section className="mt-[18px] flex min-h-[115px] items-center rounded-[16px] border border-[#DDE7F1] bg-[#FBFDFF] px-[25px]">

              <div className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full bg-[#EEF5FF] text-[#1670F0]">
                <ShieldCheck size={24} />
              </div>

              <div className="ml-[18px]">
                <h3 className="text-[15px] font-bold text-[#111820]">
                  Important Note
                </h3>

                <p className="mt-[5px] text-[13px] text-[#151719]">
                  Home relief measures provide temporary comfort and are not a cure.
                </p>

                <p className="mt-[3px] text-[13px] text-[#151719]">
                  For persistent, severe, or recurring symptoms, consult a healthcare professional.
                </p>
              </div>

              <div className="ml-auto flex h-[104px] w-[390px] items-center rounded-[12px] border border-[#E3E9E3] bg-[#F8FCF8] px-[20px]">

                <div>
                  <p className="text-[13px] font-semibold text-[#111315]">
                    Need more guidance?
                  </p>

                  <p className="mt-[4px] text-[13px] text-[#111315]">
                    Talk to our Medical Assistant
                  </p>

                  <button
                    type="button"
                    onClick={
                      onGoMedicalAssistant
                    }
                    className="mt-[7px] flex h-[33px] w-[240px] items-center justify-between rounded-[8px] border border-[#218B45] px-[14px] text-[12px] font-semibold text-[#08712F]"
                  >
                    Go to Medical Assistant
                    <ArrowRight size={18} />
                  </button>
                </div>

                <img
                  src={botImage}
                  alt=""
                  className="ml-auto h-[78px] w-[78px] object-contain"
                />
              </div>
            </section>

            <div className="mt-[20px] flex items-center justify-center gap-2 rounded-[13px] bg-[#F6FBF6] py-[15px] text-center text-[12px] text-[#087A32]">
              <Info size={18} />
              Home relief is not a substitute for medical treatment. Seek professional help if symptoms persist or get worse.
            </div>
          </>
        ) : (

          /* ====================================================
             SEARCH RESULT VIEW
          ==================================================== */

          <>
            <section className="relative grid min-h-[205px] grid-cols-[1fr_0.9fr] overflow-hidden rounded-[2px]">

              <div className="relative z-10 pt-[3px]">

                <div className="flex h-[59px] w-[625px] max-w-full items-center rounded-full border border-[#7BC59B] bg-white px-[20px] shadow-[0_1px_5px_rgba(34,113,70,0.12)]">

                  <Search
                    size={25}
                    strokeWidth={1.8}
                    className="text-[#111820]"
                  />

                  <input
                    value={query}
                    onChange={(e) =>
                      setQuery(
                        e.target.value
                      )
                    }
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      search()
                    }
                    className="ml-[16px] min-w-0 flex-1 bg-transparent text-[16px] font-medium text-[#111315] outline-none"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      search()
                    }
                    disabled={loading}
                    className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full bg-[#168B42] text-white disabled:opacity-50"
                  >
                    <ArrowRight size={22} />
                  </button>
                </div>

                <p className="mt-[10px] pl-[16px] text-[13px] text-[#44516A]">
                  Search any symptom or discomfort (e.g. sore throat, headache, fever)
                </p>
              </div>

              <img
                src={familyImage}
                alt=""
                className="pointer-events-none absolute right-[-4px] top-[-4px] h-[224px] w-[585px] object-cover object-left"
              />
            </section>

            {/* =================================================
                NO APPROVED REMEDY
            ================================================= */}

            {recommended.length === 0 &&
            caution.length === 0 &&
            restricted.length === 0 ? (

              <section className="min-h-[360px] rounded-[12px] border border-[#E3E7E6] bg-white px-[35px] py-[70px] text-center">

                <div className="mx-auto flex h-[70px] w-[70px] items-center justify-center rounded-full bg-[#F1F8F3] text-[#178842]">

                  <ShieldCheck
                    size={35}
                    strokeWidth={1.6}
                  />
                </div>

                <h2 className="mt-[20px] text-[22px] font-bold text-[#101316]">
                  No Home Relief Available
                </h2>

                <p className="mx-auto mt-[10px] max-w-[600px] text-[14px] leading-[1.7] text-[#536174]">
                  The Medical Supervisor hasn't provided an approved home remedy for{" "}
                  <span className="font-semibold text-[#087A32]">
                    {queryLabel}
                  </span>{" "}
                  yet.
                </p>

                <p className="mx-auto mt-[8px] max-w-[580px] text-[13px] leading-[1.6] text-[#687487]">
                  No unapproved or unrelated remedy will be displayed.
                </p>

                {error && (
                  <p className="mx-auto mt-[15px] max-w-[650px] rounded-[9px] border border-[#F3C7C7] bg-[#FFF5F5] px-[15px] py-[11px] text-[12px] text-[#B42318]">
                    {error}
                  </p>
                )}
              </section>

            ) : (

              /* =================================================
                 APPROVED REMEDY RESULT
              ================================================= */

              <div className="grid grid-cols-2 gap-[18px]">

                {/* =================================================
                    HOME RELIEF
                ================================================= */}

                <section className="min-h-[577px] rounded-[12px] border border-[#E3E7E6] bg-white px-[24px] pt-[16px]">

                  <div className="flex items-center gap-3">

                    <ShieldCheck
                      size={23}
                      className="text-[#11833A]"
                      fill="#11833A"
                      strokeWidth={1.4}
                    />

                    <h2 className="text-[16px] font-bold uppercase text-[#101316]">
                      Home Relief for{" "}
                      {queryLabel}
                    </h2>
                  </div>

                  <p className="mt-[12px] text-[13px] text-[#15181A]">
                    These simple home care tips can help you get temporary relief.
                  </p>

                  <div className="mt-[11px]">

                    {recommended
                      .slice(0, 5)
                      .map(
                        (
                          item,
                          index
                        ) => {

                          const Icon =
                            icons[index] ||
                            HeartPulse;

                          return (
                            <button
                              type="button"
                              key={
                                item.id ||
                                item.name ||
                                index
                              }
                              onClick={() =>
                                openDetails(
                                  item
                                )
                              }
                              className="flex min-h-[78px] w-full items-center gap-[27px] border-b border-[#E9E9E9] text-left last:border-b-0"
                            >

                              <div
                                className={`flex h-[67px] w-[67px] shrink-0 items-center justify-center rounded-full ${
                                  index === 0
                                    ? "bg-[#E5F0FF] text-[#2C83F6]"
                                    : index === 1
                                    ? "bg-[#EAF7EE] text-[#2FA55C]"
                                    : index === 2
                                    ? "bg-[#F0E5FF] text-[#8A45D6]"
                                    : index === 3
                                    ? "bg-[#FFF0DE] text-[#F28A13]"
                                    : "bg-[#DFF5F4] text-[#1B9994]"
                                }`}
                              >
                                <Icon
                                  size={27}
                                  strokeWidth={1.7}
                                />
                              </div>

                              <div className="min-w-0 flex-1 py-[7px]">

                                <h3 className="text-[15px] font-bold text-[#121416]">
                                  {item.name ||
                                    item.remedy_name ||
                                    "Approved supportive measure"}
                                </h3>

                                <p className="mt-[5px] max-w-[490px] text-[13px] leading-[1.45] text-[#111315]">
                                  {item.description ||
                                    item.expected_benefit ||
                                    "Medical Supervisor-approved supportive guidance."}
                                </p>

                              </div>
                            </button>
                          );
                        }
                      )}
                  </div>

                  <div className="mt-[10px] flex h-[60px] items-center gap-3 rounded-[9px] border border-[#D7E7D8] bg-[#F5FBF5] px-[16px]">

                    <Info
                      size={20}
                      className="text-[#19863C]"
                    />

                    <p className="text-[12px] leading-[1.45] text-[#101315]">
                      If symptoms persist for more than 3 days, or worsen,
                      <br />
                      please consult a doctor.
                    </p>
                  </div>
                </section>

                {/* =================================================
                    SUITABILITY & SAFETY
                ================================================= */}

                <section className="min-h-[577px] rounded-[12px] border border-[#E3E7E6] bg-white px-[18px] pt-[16px]">

                  <div className="flex items-center gap-3 px-[5px]">

                    <ShieldCheck
                      size={23}
                      className="text-[#11833A]"
                      fill="#11833A"
                      strokeWidth={1.4}
                    />

                    <h2 className="text-[16px] font-bold uppercase text-[#101316]">
                      Suitability &amp; Safety
                    </h2>
                  </div>

                  {/* =================================================
                      SUITABLE FOR
                  ================================================= */}

                  {suitableRules.length > 0 && (

                    <div className="mt-[18px] rounded-[10px] bg-[#F4FAF5] px-[18px] py-[17px]">

                      <p className="flex items-center gap-2 text-[14px] font-semibold text-[#111315]">

                        <Check
                          size={20}
                          className="text-[#18843D]"
                        />

                        Suitable For
                      </p>

                      <ul className="mt-[10px] space-y-[7px] pl-[20px] text-[13px] leading-[1.45] text-[#151719]">

                        {suitableRules.map(
                          (rule, index) => (
                            <li
                              key={
                                rule.id ||
                                index
                              }
                              className="list-disc"
                            >
                              {formatCondition(
                                rule
                              )}

                              {rule.reason
                                ? ` — ${rule.reason}`
                                : ""}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  {/* =================================================
                      NOT SUITABLE / CAUTION
                      
                      IMPORTANT:
                      This section now catches:
                      CAUTION
                      NOT_RECOMMENDED
                      CONTRAINDICATED
                      UNSUITABLE
                      RESTRICTED
                      AVOID
                      WARNING
                      
                      So the "Age — CAUTION" stored by the
                      Medical Supervisor will now appear here.
                  ================================================= */}

                  {unsafeRules.length > 0 && (

                    <div className="mt-[18px] rounded-[10px] border border-[#F4D1D1] bg-[#FFF5F5] px-[18px] py-[16px]">

                      <div className="flex items-start gap-3">

                        <div className="mt-[1px] flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[#FDE5E5]">

                          <CircleAlert
                            size={18}
                            className="text-[#D92D20]"
                          />
                        </div>

                        <div className="min-w-0">

                          <p className="text-[14px] font-semibold text-[#111315]">
                            Not Suitable / Use With Caution For
                          </p>

                          <p className="mt-[3px] text-[11px] leading-[1.45] text-[#7A3030]">
                            Follow the Medical Supervisor's recorded safety guidance for these groups or conditions.
                          </p>
                        </div>
                      </div>

                      <div className="mt-[13px] space-y-[9px]">

                        {unsafeRules.map(
                          (
                            rule,
                            index
                          ) => (
                            <div
                              key={
                                rule.id ||
                                index
                              }
                              className="rounded-[8px] border border-[#F1DADA] bg-white px-[12px] py-[10px]"
                            >

                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">

                                <span className="text-[12px] font-bold text-[#8F1D1D]">
                                  {formatCondition(
                                    rule
                                  )}
                                </span>

                                <span className="rounded-full bg-[#FDEAEA] px-[8px] py-[3px] text-[9px] font-bold uppercase tracking-[0.04em] text-[#B42318]">
                                  {getSafetyLabel(
                                    rule
                                  )}
                                </span>

                              </div>

                              {rule.reason && (
                                <p className="mt-[6px] text-[11px] leading-[1.5] text-[#4E3A3A]">
                                  {rule.reason}
                                </p>
                              )}

                              {rule.remedy_name && (
                                <p className="mt-[5px] text-[9px] text-[#8A7777]">
                                  Applies to:{" "}
                                  <span className="font-semibold">
                                    {rule.remedy_name}
                                  </span>
                                </p>
                              )}

                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* =================================================
                      NO SAFETY RULES RECORDED
                      
                      This is intentionally shown only when the
                      Medical Supervisor has not stored any rules.
                  ================================================= */}

                  {safetyRules.length === 0 && (

                    <div className="mt-[18px] rounded-[10px] border border-[#E5E9E7] bg-[#FAFCFB] px-[18px] py-[17px]">

                      <div className="flex items-start gap-3">

                        <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[#F1F4F3]">

                          <Info
                            size={18}
                            className="text-[#6D7884]"
                          />

                        </div>

                        <div>

                          <p className="text-[13px] font-semibold text-[#22272B]">
                            Suitability information not recorded
                          </p>

                          <p className="mt-[5px] text-[11px] leading-[1.5] text-[#65717D]">
                            The Medical Supervisor has not recorded specific suitability or restriction rules for this home relief measure.
                          </p>

                        </div>

                      </div>
                    </div>
                  )}

                  {/* =================================================
                      MEDICAL ATTENTION
                  ================================================= */}

                  <div className="mt-[18px] flex min-h-[71px] items-center gap-3 rounded-[9px] border border-[#B7D1F4] bg-[#F8FBFF] px-[16px]">

                    <ShieldCheck
                      size={22}
                      className="shrink-0 text-[#1670F0]"
                    />

                    <p className="text-[12px] leading-[1.55] text-[#101315]">

                      {selectedRemedy?.when_to_seek_care ||
                        "Home relief is not a substitute for medical treatment. Seek professional help if symptoms persist or get worse."}

                    </p>
                  </div>

                </section>
              </div>
            )}

            {/* =================================================
                IMPORTANT NOTE
            ================================================= */}

            <div className="mt-[12px] flex h-[105px] items-center rounded-[12px] bg-[#F5FBF5] px-[24px]">

              <img
                src={doctorImage}
                alt=""
                className="h-[94px] w-[92px] object-contain object-bottom"
              />

              <div className="ml-[20px]">

                <h3 className="text-[15px] font-bold text-[#0A7B32]">
                  Important Note
                </h3>

                <p className="mt-[7px] text-[13px] text-[#151719]">
                  Home relief measures provide temporary comfort and are not a cure.
                </p>

                <p className="mt-[3px] text-[13px] text-[#151719]">
                  For persistent, severe, or recurring symptoms, consult a healthcare professional.
                </p>
              </div>

              <div className="ml-auto flex h-[104px] w-[390px] items-center rounded-[12px] border border-[#E3E9E3] bg-[#F8FCF8] px-[20px]">

                <div>

                  <p className="text-[13px] font-semibold text-[#111315]">
                    Need more guidance?
                  </p>

                  <p className="mt-[4px] text-[13px] text-[#111315]">
                    Talk to our Medical Assistant
                  </p>

                  <button
                    type="button"
                    onClick={
                      onGoMedicalAssistant
                    }
                    className="mt-[7px] flex h-[33px] w-[240px] items-center justify-between rounded-[8px] border border-[#218B45] px-[14px] text-[12px] font-semibold text-[#08712F]"
                  >
                    Go to Medical Assistant
                    <ArrowRight size={18} />
                  </button>
                </div>

                <img
                  src={botImage}
                  alt=""
                  className="ml-auto h-[78px] w-[78px] object-contain"
                />
              </div>
            </div>

            {/* =================================================
                DISCLAIMER
            ================================================= */}

            <div className="mt-[20px] flex items-center justify-center gap-2 rounded-[13px] bg-[#F6FBF6] py-[15px] text-center text-[12px] text-[#087A32]">

              <Info size={18} />

              Home relief is not a substitute for medical treatment. Seek professional help if symptoms persist or get worse.

            </div>
          </>
        )}

        {/* ====================================================
            DETAILS MODAL
        ==================================================== */}

        {details && (

          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/25 p-5">

            <div className="max-h-[85vh] w-full max-w-[720px] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">

              <div className="flex items-center justify-between">

                <h3 className="text-[20px] font-bold text-[#13264B]">
                  {details.name ||
                    details.remedy_name ||
                    "Home Relief"}
                </h3>

                <button
                  type="button"
                  onClick={() =>
                    setDetails(null)
                  }
                  aria-label="Close details"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="mt-5 text-sm leading-6 text-[#44516A]">
                {details.description ||
                  details.expected_benefit}
              </p>

              {details.instructions && (
                <p className="mt-4 text-sm leading-6 text-[#44516A]">
                  <b>
                    How to use:
                  </b>{" "}
                  {details.instructions}
                </p>
              )}

              {/* ==================================================
                  SAFETY INFORMATION INSIDE DETAILS MODAL
              ================================================== */}

              {Array.isArray(
                details.safety_rules
              ) &&
                details.safety_rules.length >
                  0 && (

                  <div className="mt-6 rounded-xl border border-[#F0D5D5] bg-[#FFF7F7] p-4">

                    <div className="flex items-center gap-2">

                      <CircleAlert
                        size={19}
                        className="text-[#C92A2A]"
                      />

                      <h4 className="text-[14px] font-bold text-[#8F1D1D]">
                        Suitability & Safety
                      </h4>
                    </div>

                    <div className="mt-3 space-y-2">

                      {details.safety_rules.map(
                        (
                          rule,
                          index
                        ) => {

                          const normalized =
                            normalizeSafetyRule(
                              rule,
                              index
                            );

                          if (
                            !normalized
                          ) {
                            return null;
                          }

                          return (
                            <div
                              key={
                                normalized.id ||
                                index
                              }
                              className="rounded-lg border border-[#F1DADA] bg-white px-3 py-3"
                            >

                              <div className="flex flex-wrap items-center gap-2">

                                <span className="text-[12px] font-bold text-[#8F1D1D]">
                                  {formatCondition(
                                    normalized
                                  )}
                                </span>

                                <span className="rounded-full bg-[#FDEAEA] px-2 py-1 text-[9px] font-bold uppercase text-[#B42318]">
                                  {getSafetyLabel(
                                    normalized
                                  )}
                                </span>
                              </div>

                              {normalized.reason && (
                                <p className="mt-2 text-[11px] leading-[1.5] text-[#4E3A3A]">
                                  {
                                    normalized.reason
                                  }
                                </p>
                              )}
                            </div>
                          );
                        }
                      )}
                    </div>
                  </div>
                )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}