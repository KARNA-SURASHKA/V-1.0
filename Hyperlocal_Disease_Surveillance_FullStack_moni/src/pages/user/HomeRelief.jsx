import { useMemo, useState } from "react";

import {
  AlertTriangle,
  CheckCircle2,
  HeartPulse,
  Search,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";

import { api } from "../../api";


// ============================================================
// COMMON SEARCHES
// ============================================================

const COMMON_SEARCHES = [
  "Cough",
  "Sore Throat",
  "Cold",
  "Headache",
  "Fever",
];


// ============================================================
// STATUS HELPERS
// ============================================================

const normalizeStatus = (value) => {
  if (!value) return "UNKNOWN";

  return String(value)
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
};


const getSafetyStatus = (item) => {
  return normalizeStatus(
    item?.safety?.status ||
      item?.suitability ||
      item?.safety_status ||
      item?.status_for_context ||
      item?.context_status ||
      item?.recommendation_status
  );
};


const isApproved = (item) => {
  const status = getSafetyStatus(item);

  return [
    "SAFE",
    "APPROVED",
    "SUITABLE",
    "RECOMMENDED",
  ].includes(status);
};


const isCaution = (item) => {
  return getSafetyStatus(item) === "CAUTION";
};


const isRestricted = (item) => {
  const status = getSafetyStatus(item);

  return [
    "RESTRICTED",
    "NOT_RECOMMENDED",
    "UNSUITABLE",
    "CONTRAINDICATED",
    "DO_NOT_USE",
    "UNKNOWN",
  ].includes(status);
};


// ============================================================
// GENERAL HELPERS
// ============================================================

const getRemedyId = (item) => {
  return (
    item?.id ||
    item?.remedy_id ||
    item?.home_relief_remedy_id
  );
};


const getRemedyName = (item) => {
  return (
    item?.name ||
    item?.remedy_name ||
    "Supportive measure"
  );
};


const getDescription = (item) => {
  return (
    item?.description ||
    item?.expected_benefit ||
    item?.how_it_may_help ||
    "May provide temporary supportive relief."
  );
};


const getConditionLabel = (value) => {
  if (!value) return "";

  const text = String(value)
    .replace(/_/g, " ")
    .trim();

  return text.charAt(0).toUpperCase() + text.slice(1);
};


const getContextLabels = (context) => {
  if (!context) return [];

  const labels = [];

  if (context.pregnancy) {
    labels.push("Pregnancy");
  }

  if (context.breastfeeding) {
    labels.push("Breastfeeding");
  }

  const map = {
    diabetes: "Diabetes",
    hypertension: "Hypertension",
    kidney_disease: "Kidney disease",
    liver_disease: "Liver disease",
    heart_disease: "Heart disease",
    asthma: "Asthma",
    immunocompromised: "Immunocompromised",
    older_adult: "Older adult",
    child: "Child",
    infant: "Infant",
    allergy: "Allergy / ingredient sensitivity",
    medication_interaction: "Medication interaction",
  };

  (context.conditions || []).forEach((condition) => {
    if (
      condition !== "pregnancy" &&
      condition !== "breastfeeding" &&
      map[condition]
    ) {
      labels.push(map[condition]);
    }
  });

  return [...new Set(labels)];
};


// ============================================================
// NORMALIZE BACKEND RESPONSE
// ============================================================

/*
 * IMPORTANT:
 *
 * The backend returns:
 *
 * {
 *   query,
 *   context,
 *   recommended: [],
 *   use_with_caution: [],
 *   restricted: [],
 *   alternatives: [],
 *   total_found,
 *   safety_filter_applied
 * }
 *
 * Older frontend versions expected:
 *
 * {
 *   results: []
 * }
 *
 * This function supports BOTH formats.
 */

const normalizeSearchResponse = (data, query) => {
  // Backend already returned the expected object.
  if (
    data &&
    typeof data === "object" &&
    !Array.isArray(data)
  ) {
    const recommended = Array.isArray(
      data.recommended
    )
      ? data.recommended
      : [];

    const caution = Array.isArray(
      data.use_with_caution
    )
      ? data.use_with_caution
      : [];

    const restricted = Array.isArray(
      data.restricted
    )
      ? data.restricted
      : [];

    const alternatives = Array.isArray(
      data.alternatives
    )
      ? data.alternatives
      : [];

    /*
     * Compatibility with an older API response:
     *
     * {
     *   results: [...]
     * }
     */
    if (
      recommended.length === 0 &&
      caution.length === 0 &&
      restricted.length === 0 &&
      Array.isArray(data.results)
    ) {
      const legacyResults = data.results;

      return {
        query:
          data.query ||
          query,

        context:
          data.context ||
          {
            conditions: [],
          },

        recommended:
          legacyResults.filter(
            (item) => isApproved(item)
          ),

        use_with_caution:
          legacyResults.filter(
            (item) => isCaution(item)
          ),

        restricted:
          legacyResults.filter(
            (item) => isRestricted(item)
          ),

        alternatives:
          alternatives,

        total_found:
          legacyResults.length,

        safety_filter_applied:
          Boolean(
            data.safety_filter_applied
          ),
      };
    }

    return {
      query:
        data.query ||
        query,

      context:
        data.context ||
        {
          conditions: [],
        },

      recommended,
      use_with_caution: caution,
      restricted,
      alternatives,

      total_found:
        Number.isFinite(data.total_found)
          ? data.total_found
          :
            recommended.length +
            caution.length +
            restricted.length,

      safety_filter_applied:
        Boolean(
          data.safety_filter_applied
        ),
    };
  }


  // If the API ever directly returns an array.
  if (Array.isArray(data)) {
    return {
      query,

      context: {
        conditions: [],
      },

      recommended: data.filter(
        (item) => isApproved(item)
      ),

      use_with_caution: data.filter(
        (item) => isCaution(item)
      ),

      restricted: data.filter(
        (item) => isRestricted(item)
      ),

      alternatives: [],

      total_found: data.length,

      safety_filter_applied: false,
    };
  }


  // Safe fallback.
  return {
    query,

    context: {
      conditions: [],
    },

    recommended: [],
    use_with_caution: [],
    restricted: [],
    alternatives: [],

    total_found: 0,

    safety_filter_applied: false,
  };
};


// ============================================================
// MAIN COMPONENT
// ============================================================

export default function HomeRelief() {
  const [query, setQuery] = useState("");

  const [results, setResults] = useState(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [details, setDetails] = useState(null);

  const [safety, setSafety] = useState(null);

  const [detailsLoading, setDetailsLoading] =
    useState(false);


  // ==========================================================
  // SEARCH
  // ==========================================================

  const search = async (value = query) => {
    const text = String(value || "").trim();

    if (!text) {
      setResults(null);
      setError("");
      return;
    }

    setLoading(true);
    setError("");

    setDetails(null);
    setSafety(null);

    try {
      /*
       * IMPORTANT:
       *
       * Use searchHomeRelief because this function
       * is present in the API client and directly calls:
       *
       * GET /home-relief/search
       */
      const data =
        await api.searchHomeRelief(text);

      console.log(
        "Home Relief search response:",
        data
      );

      const normalized =
        normalizeSearchResponse(
          data,
          text
        );

      setResults(normalized);
    } catch (e) {
      console.error(
        "Home Relief search failed:",
        e
      );

      setResults(null);

      setError(
        e?.message ||
          "Unable to search approved Home Relief information."
      );
    } finally {
      setLoading(false);
    }
  };


  // ==========================================================
  // COMMON SEARCH
  // ==========================================================

  const handleCommonSearch = (value) => {
    setQuery(value);
    search(value);
  };


  // ==========================================================
  // CONTEXT LABELS
  // ==========================================================

  const contextLabels = useMemo(() => {
    return getContextLabels(
      results?.context
    );
  }, [results]);


  // ==========================================================
  // OPEN DETAILS
  // ==========================================================

  const openDetails = async (item) => {
    setDetails(item);

    const id = getRemedyId(item);

    if (!id) {
      return;
    }

    setDetailsLoading(true);

    try {
      const response =
        await api.getHomeReliefRemedy(
          id
        );

      const detailed =
        response?.remedy ||
        response?.data ||
        response ||
        item;

      setDetails(detailed);
    } catch (error) {
      console.error(
        "Unable to load remedy details:",
        error
      );

      // Keep search result visible.
      setDetails(item);
    } finally {
      setDetailsLoading(false);
    }
  };


  // ==========================================================
  // OPEN SAFETY INFORMATION
  // ==========================================================

  const openSafety = async (item) => {
    /*
     * Immediately open using the safety data already
     * returned by the search endpoint.
     *
     * This is important because the search endpoint
     * has already evaluated the Medical Supervisor rules.
     */
    setSafety(item);

    const id = getRemedyId(item);

    if (!id) {
      return;
    }

    try {
      const conditions =
        results?.context?.conditions || [];

      /*
       * Fetch the most specific safety rule if possible.
       *
       * The backend safety endpoint accepts:
       *
       * ?condition=diabetes
       */
      const condition =
        conditions.length > 0
          ? conditions[0]
          : null;

      const response =
        await api.getHomeReliefSafety(
          id,
          condition
        );

      const safetyData =
        response?.safety ||
        response?.data ||
        response;

      if (
        safetyData &&
        typeof safetyData === "object"
      ) {
        setSafety({
          ...item,

          safety:
            safetyData.safety ||
            safetyData,

          matched_rules:
            safetyData.matched_rules ||
            item?.safety?.matched_rules ||
            [],

          alternatives:
            safetyData.alternatives ||
            item?.alternatives ||
            [],
        });
      }
    } catch (error) {
      /*
       * The search result itself remains usable.
       */
      console.error(
        "Unable to load detailed safety information:",
        error
      );
    }
  };


  // ==========================================================
  // CLOSE MODALS
  // ==========================================================

  const closeDetails = () => {
    setDetails(null);
  };


  const closeSafety = () => {
    setSafety(null);
  };


  // ==========================================================
  // RESULTS
  // ==========================================================

  const recommended =
    results?.recommended || [];

  const caution =
    results?.use_with_caution || [];

  const restricted =
    results?.restricted || [];

  const alternatives =
    results?.alternatives || [];

  const totalResults =
    recommended.length +
    caution.length +
    restricted.length;


  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="w-full max-w-[1500px] mx-auto px-5 sm:px-6 lg:px-8 py-6 sm:py-8">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="mb-6">
        <div className="flex items-start gap-3">

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF6EE] text-[#0B7A33]">
            <HeartPulse size={22} />
          </div>

          <div>
            <h2 className="text-[30px] sm:text-[34px] font-bold text-[#13264B]">
              Home Relief & Supportive Care
            </h2>

            <p className="mt-1 text-[14px] text-[#667085]">
              Temporary supportive measures reviewed by Medical Supervisors.
            </p>
          </div>

        </div>
      </div>


      {/* ======================================================
          SEARCH
      ====================================================== */}

      <div className="rounded-2xl border border-[#E7E2D8] bg-white p-4 shadow-sm">

        <div className="flex flex-col gap-2 rounded-xl border border-[#DCD7CE] bg-[#FCFAF6] px-3 py-2 sm:flex-row sm:items-center">

          <Search
            size={17}
            className="hidden text-[#7A8798] sm:block"
          />

          <input
            type="text"
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                search();
              }
            }}
            placeholder="Search a symptom or disease..."
            className="flex-1 bg-transparent py-2 text-sm text-[#1F3144] outline-none"
          />

          <button
            type="button"
            onClick={() => search()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#13264B] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            <Search size={15} />

            {loading
              ? "Searching..."
              : "Search"}
          </button>

        </div>


        <p className="mt-3 text-[11px] leading-5 text-[#8A857B]">
          For context-specific results, include the context in your search, for example “fever for pregnant woman” or “throat ache for diabetic patient”.
        </p>


        {/* COMMON SEARCHES */}

        <div className="mt-4">

          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[#9A9489]">
            Common Searches
          </p>

          <div className="flex flex-wrap gap-2">

            {COMMON_SEARCHES.map(
              (item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() =>
                    handleCommonSearch(item)
                  }
                  className="rounded-full border border-[#DDD8CE] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#52606D] hover:border-[#AEBEB4]"
                >
                  {item}
                </button>
              )
            )}

          </div>

        </div>

      </div>


      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="mt-4 rounded-xl border border-[#F1D0D0] bg-[#FFF5F5] p-3 text-xs text-[#B42318]">
          {error}
        </div>
      )}


      {/* ======================================================
          RESULTS
      ====================================================== */}

      {results && !loading && (

        <div className="mt-6 space-y-6">

          {/* ====================================================
              SAFETY CONTEXT
          ==================================================== */}

          {results.safety_filter_applied &&
            contextLabels.length > 0 && (

              <div className="rounded-2xl border border-[#F0D8A6] bg-[#FFF9EA] p-4">

                <div className="flex items-start gap-3">

                  <ShieldAlert
                    size={19}
                    className="mt-0.5 shrink-0 text-[#9A6A00]"
                  />

                  <div>

                    <p className="text-xs font-bold text-[#6D4C00]">
                      Safety filter applied
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">

                      {contextLabels.map(
                        (label) => (
                          <span
                            key={label}
                            className="rounded-full bg-white px-3 py-1 text-[10px] font-bold text-[#806000]"
                          >
                            {label}
                          </span>
                        )
                      )}

                    </div>

                    <p className="mt-2 text-[11px] leading-5 text-[#806000]">
                      Results have been evaluated according to the Medical Supervisor safety rules recorded for these user groups.
                    </p>

                  </div>

                </div>

              </div>
            )}


          {/* ====================================================
              RESULT HEADER
          ==================================================== */}

          <div>

            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">

              <p className="text-xs font-bold uppercase tracking-wide text-[#667085]">
                Results for "{results.query}"
              </p>

              <span className="text-[11px] font-semibold text-[#7A8798]">
                {results.total_found ??
                  totalResults}{" "}
                result
                {(results.total_found ??
                  totalResults) === 1
                  ? ""
                  : "s"}{" "}
                found
              </span>

            </div>


            {/* ==================================================
                NO RESULTS
            ================================================== */}

            {totalResults === 0 && (

              <div className="rounded-2xl border border-[#E7E2D8] bg-white p-7 text-center">

                <AlertTriangle
                  className="mx-auto text-[#9A6A00]"
                  size={25}
                />

                <h3 className="mt-3 text-sm font-bold text-[#13264B]">
                  No supportive remedy found
                </h3>

                <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-[#7A8798]">
                  No Medical Supervisor-approved Home Relief measure matched this search and safety context.
                </p>

                <p className="mx-auto mt-2 max-w-md text-[11px] leading-5 text-[#9A9489]">
                  This does not mean that no treatment exists. Please consult a qualified healthcare professional.
                </p>

              </div>
            )}


            {/* ==================================================
                APPROVED
            ================================================== */}

            {recommended.length > 0 && (

              <section className="space-y-4">

                <div className="text-sm font-bold text-[#0B7A33]">
                  Approved supportive options
                </div>

                {recommended.map(
                  (item) => (
                    <ApprovedCard
                      key={getRemedyId(item)}
                      item={item}
                      onDetails={() =>
                        openDetails(item)
                      }
                      onSafety={() =>
                        openSafety(item)
                      }
                    />
                  )
                )}

              </section>
            )}


            {/* ==================================================
                CAUTION
            ================================================== */}

            {caution.length > 0 && (

              <section className="mt-7 space-y-4">

                <div className="text-sm font-bold text-[#9A6A00]">
                  Use with caution
                </div>

                {caution.map(
                  (item) => (
                    <CautionCard
                      key={getRemedyId(item)}
                      item={item}
                      onDetails={() =>
                        openDetails(item)
                      }
                      onSafety={() =>
                        openSafety(item)
                      }
                    />
                  )
                )}

              </section>
            )}


            {/* ==================================================
                RESTRICTED
            ================================================== */}

            {restricted.length > 0 && (

              <section className="mt-7 space-y-4">

                <div className="text-sm font-bold text-[#B42318]">
                  Safety-restricted options
                </div>

                {restricted.map(
                  (item) => (
                    <RestrictedCard
                      key={getRemedyId(item)}
                      item={item}
                      onSafety={() =>
                        openSafety(item)
                      }
                    />
                  )
                )}

              </section>
            )}

          </div>


          {/* ====================================================
              APPROVED ALTERNATIVES
          ==================================================== */}

          {restricted.length > 0 &&
            alternatives.length > 0 && (

              <section>

                <h3 className="mb-3 text-xs font-bold uppercase tracking-wide text-[#0B7A33]">
                  Approved Alternatives
                </h3>

                <div className="grid gap-4 md:grid-cols-2">

                  {alternatives.map(
                    (item) => (
                      <ApprovedCard
                        key={getRemedyId(item)}
                        item={item}
                        onDetails={() =>
                          openDetails(item)
                        }
                      />
                    )
                  )}

                </div>

              </section>
            )}


          {/* ====================================================
              IMPORTANT
          ==================================================== */}

          <div className="rounded-2xl border border-[#BFD7FF] bg-[#F3F8FF] p-4 text-[11px] leading-5 text-[#315C88]">

            <strong>Important:</strong>{" "}

            Home Relief information is intended only for temporary supportive care. It does not replace diagnosis, treatment, prescription medication, or professional medical advice.

            <span className="block mt-2">
              Seek medical attention promptly if symptoms are severe, worsening, persistent, unusual, or associated with warning signs.
            </span>

          </div>

        </div>
      )}


      {/* ======================================================
          DETAILS MODAL
      ====================================================== */}

      {details && (

        <DetailsModal
          item={details}
          loading={detailsLoading}
          onClose={closeDetails}
          onSafety={() => {
            setDetails(null);
            openSafety(details);
          }}
        />

      )}


      {/* ======================================================
          SAFETY MODAL
      ====================================================== */}

      {safety && (

        <SafetyModal
          item={safety}
          contextLabels={contextLabels}
          onClose={closeSafety}
          onAlternative={(alternative) => {
            setSafety(null);
            openDetails(alternative);
          }}
        />

      )}

    </div>
  );
}


// ============================================================
// APPROVED CARD
// ============================================================

function ApprovedCard({
  item,
  onDetails,
  onSafety,
}) {
  return (

    <div className="rounded-2xl border border-[#E3E9E5] bg-white p-5 shadow-sm">

      <div className="flex items-start gap-3">

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EAF6EE] text-[#0B7A33]">
          <ShieldCheck size={17} />
        </div>

        <div className="min-w-0 flex-1">

          <h4 className="text-sm font-bold text-[#13264B]">
            {getRemedyName(item)}
          </h4>

          <p className="mt-1 text-[11px] text-[#0B7A33]">
            ✓ Approved supportive measure
          </p>

        </div>

      </div>


      <p className="mt-4 text-xs leading-5 text-[#526173]">
        {getDescription(item)}
      </p>


      {item.expected_benefit && (
        <Info
          label="How it may help"
          value={item.expected_benefit}
        />
      )}


      <div className="mt-4 flex flex-wrap gap-2">

        <button
          type="button"
          onClick={onDetails}
          className="rounded-lg border border-[#D9E2DC] bg-white px-3 py-2 text-[11px] font-semibold text-[#315C88]"
        >
          View Details
        </button>


        {item.has_safety_restrictions && (
          <button
            type="button"
            onClick={onSafety}
            className="rounded-lg border border-[#E4C98F] bg-[#FFF9EA] px-3 py-2 text-[11px] font-semibold text-[#806000]"
          >
            View Safety Information
          </button>
        )}

      </div>

    </div>
  );
}


// ============================================================
// CAUTION CARD
// ============================================================

function CautionCard({
  item,
  onDetails,
  onSafety,
}) {
  return (

    <div className="rounded-2xl border border-[#F0D8A6] bg-[#FFFDF7] p-5 shadow-sm">

      <div className="flex items-start gap-3">

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FFF5D9] text-[#9A6A00]">
          <ShieldAlert size={17} />
        </div>

        <div className="min-w-0 flex-1">

          <h4 className="text-sm font-bold text-[#13264B]">
            {getRemedyName(item)}
          </h4>

          <p className="mt-1 text-[11px] font-semibold text-[#9A6A00]">
            ⚠ Use with caution
          </p>

        </div>

      </div>


      <p className="mt-4 text-xs leading-5 text-[#526173]">
        {getDescription(item)}
      </p>


      <div className="mt-4 flex flex-wrap gap-2">

        <button
          type="button"
          onClick={onDetails}
          className="rounded-lg border border-[#D9E2DC] bg-white px-3 py-2 text-[11px] font-semibold text-[#315C88]"
        >
          View Details
        </button>

        <button
          type="button"
          onClick={onSafety}
          className="rounded-lg border border-[#E4C98F] bg-[#FFF9EA] px-3 py-2 text-[11px] font-semibold text-[#806000]"
        >
          View Safety Information
        </button>

      </div>

    </div>
  );
}


// ============================================================
// RESTRICTED CARD
// ============================================================

function RestrictedCard({
  item,
  onSafety,
}) {
  const rule =
    item?.safety?.matched_rules?.[0] ||
    item?.matched_rules?.[0] ||
    item?.safety_rules?.[0];

  const reason =
    rule?.reason ||
    "The Medical Supervisor has restricted this remedy for the selected safety context.";

  return (

    <div className="rounded-2xl border border-[#F0CACA] bg-[#FFF8F8] p-5 shadow-sm">

      <div className="flex items-start gap-3">

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FFF0F0] text-[#B42318]">
          <ShieldAlert size={17} />
        </div>

        <div className="min-w-0 flex-1">

          <h4 className="text-sm font-bold text-[#13264B]">
            {getRemedyName(item)}
          </h4>

          <p className="mt-1 text-[11px] font-semibold text-[#B42318]">
            ✕ Not Recommended
          </p>

        </div>

      </div>


      <p className="mt-4 text-xs leading-5 text-[#526173]">
        This remedy is not recommended for the selected safety context.
      </p>


      <div className="mt-4 rounded-xl bg-white border border-[#F0D8D8] p-3">

        <p className="text-[10px] font-bold uppercase tracking-wide text-[#9A6A00]">
          Medical Supervisor safety reason
        </p>

        <p className="mt-1 text-[11px] leading-5 text-[#526173]">
          {reason}
        </p>

      </div>


      <button
        type="button"
        onClick={onSafety}
        className="mt-4 rounded-lg border border-[#E4B7B7] bg-[#FFF0F0] px-3 py-2 text-[11px] font-semibold text-[#B42318]"
      >
        View Safety Information
      </button>

    </div>
  );
}


// ============================================================
// DETAILS MODAL
// ============================================================

function DetailsModal({
  item,
  loading,
  onClose,
  onSafety,
}) {
  return (

    <Modal
      title={getRemedyName(item)}
      onClose={onClose}
      wide
    >

      {loading ? (

        <div className="py-12 text-center text-sm text-[#7A8798]">
          Loading remedy details...
        </div>

      ) : (

        <div className="space-y-5">

          <Info
            label="Description"
            value={item.description}
          />

          <Info
            label="How to use"
            value={item.instructions}
          />

          <Info
            label="How it may help"
            value={item.expected_benefit}
          />

          <Info
            label="Medical rationale"
            value={item.medical_rationale}
          />

          <Info
            label="Possible side effects / safety profile"
            value={item.possible_side_effects}
          />

          <Info
            label="General safety notes"
            value={item.general_safety_notes}
          />

          <Info
            label="Red flags"
            value={item.red_flags}
          />

          <Info
            label="When to seek professional care"
            value={item.when_to_seek_care}
          />


          {item.has_safety_restrictions && (

            <button
              type="button"
              onClick={onSafety}
              className="rounded-xl border border-[#E4C98F] bg-[#FFF9EA] px-4 py-2.5 text-[11px] font-semibold text-[#806000]"
            >
              View Safety Information
            </button>

          )}

        </div>

      )}

    </Modal>
  );
}


// ============================================================
// SAFETY MODAL
// ============================================================

function SafetyModal({
  item,
  contextLabels,
  onClose,
  onAlternative,
}) {
  const matchedRules =
    item?.safety?.matched_rules ||
    item?.matched_rules ||
    [];

  const allRules =
    item?.safety_rules ||
    [];

  /*
   * If the backend returned a matched rule, use it.
   * Otherwise use the first recorded rule.
   */
  const rule =
    matchedRules[0] ||
    allRules[0] ||
    null;


  const suitability =
    normalizeStatus(
      item?.safety?.status ||
        item?.suitability ||
        rule?.suitability
    );


  const restricted =
    [
      "RESTRICTED",
      "NOT_RECOMMENDED",
      "UNSUITABLE",
      "CONTRAINDICATED",
      "DO_NOT_USE",
    ].includes(suitability);


  const restrictionContext =
    rule?.condition_value ||
    rule?.condition_type ||
    contextLabels?.[0] ||
    "the selected context";


  const reason =
    rule?.reason ||
    item?.restriction_reason ||
    item?.reason ||
    "The Medical Supervisor has recorded a safety restriction for this remedy.";


  const concerns = [];


  if (item?.possible_side_effects) {
    if (
      Array.isArray(
        item.possible_side_effects
      )
    ) {
      concerns.push(
        ...item.possible_side_effects
      );
    } else {
      concerns.push(
        item.possible_side_effects
      );
    }
  }


  if (!concerns.length) {
    concerns.push(
      "Ingredient-specific risks may vary.",
      "Safety may depend on the formulation and dose.",
      "Individual circumstances may affect suitability."
    );
  }


  const alternatives = [
    ...(item?.alternatives || []),
  ];


  return (

    <Modal
      title="Safety Information"
      onClose={onClose}
      wide
    >

      <div className="mx-auto max-w-3xl">

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="text-center">

          <p className="text-lg font-bold text-[#13264B]">
            {getRemedyName(item)}
          </p>

          <p
            className={`mt-3 text-sm font-bold ${
              restricted
                ? "text-[#B42318]"
                : "text-[#0B7A33]"
            }`}
          >
            {restricted
              ? "✕ Not Recommended"
              : "✓ Approved for this context"}
          </p>


          <p className="mx-auto mt-3 max-w-xl text-xs leading-5 text-[#526173]">

            {restricted
              ? `This remedy is not recommended for ${getConditionLabel(
                  restrictionContext
                ).toLowerCase()}.`
              : "This remedy has been reviewed as suitable for the selected safety context."}

          </p>

        </div>


        <Divider />


        {/* ====================================================
            WHY RESTRICTED
        ==================================================== */}

        <div>

          <h4 className="text-sm font-bold text-[#13264B]">
            Why was it restricted?
          </h4>

          <p className="mt-2 text-xs leading-6 text-[#526173]">
            The Medical Supervisor has recorded the following population-specific safety restriction for this remedy.
          </p>


          <div className="mt-3 rounded-xl bg-[#F7FAF8] p-4">

            <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A948C]">
              Specific safety restriction recorded by the Medical Supervisor
            </p>

            <p className="mt-2 text-xs leading-6 text-[#526173]">
              "{reason}"
            </p>

          </div>

        </div>


        <Divider />


        {/* ====================================================
            IMPORTANT
        ==================================================== */}

        <div>

          <div className="flex items-start gap-3">

            <AlertTriangle
              size={19}
              className="mt-0.5 shrink-0 text-[#B26A00]"
            />

            <div>

              <h4 className="text-sm font-bold text-[#13264B]">
                Important
              </h4>

              <p className="mt-2 text-xs leading-6 text-[#526173]">

                {restricted
                  ? "Do not use this remedy in this context unless a qualified healthcare professional specifically advises you to do so."
                  : item?.general_safety_notes ||
                    "Follow the Medical Supervisor-approved safety information and seek professional care when appropriate."}

              </p>

            </div>

          </div>

        </div>


        <Divider />


        {/* ====================================================
            POSSIBLE CONCERNS
        ==================================================== */}

        <div>

          <h4 className="text-sm font-bold text-[#13264B]">
            Possible concerns
          </h4>

          <ul className="mt-3 space-y-2">

            {concerns.map(
              (concern, index) => (

                <li
                  key={index}
                  className="flex gap-2 text-xs leading-5 text-[#526173]"
                >

                  <span>•</span>

                  <span>
                    {typeof concern ===
                    "string"
                      ? concern
                      : concern?.text ||
                        concern?.description ||
                        JSON.stringify(
                          concern
                        )}
                  </span>

                </li>

              )
            )}

          </ul>

        </div>


        <Divider />


        {/* ====================================================
            ALTERNATIVES
        ==================================================== */}

        <div>

          <h4 className="text-sm font-bold text-[#13264B]">
            What can I do instead?
          </h4>


          {alternatives.length > 0 ? (

            <div className="mt-3 space-y-3">

              {alternatives.map(
                (alternative) => (

                  <div
                    key={getRemedyId(
                      alternative
                    )}
                    className="rounded-xl border border-[#E3E9E5] bg-white p-4"
                  >

                    <p className="text-xs font-bold text-[#13264B]">
                      {getRemedyName(
                        alternative
                      )}
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-[#526173]">
                      {getDescription(
                        alternative
                      )}
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        onAlternative(
                          alternative
                        )
                      }
                      className="mt-3 rounded-lg border border-[#D9E2DC] px-3 py-2 text-[10px] font-semibold text-[#315C88]"
                    >
                      View Alternative
                    </button>

                  </div>

                )
              )}

            </div>

          ) : (

            <p className="mt-2 text-xs leading-5 text-[#7A8798]">
              No context-specific alternative is currently recorded by the Medical Supervisor.
            </p>

          )}

        </div>


        <Divider />


        {/* ====================================================
            MEDICAL ATTENTION
        ==================================================== */}

        <div>

          <h4 className="text-sm font-bold text-[#13264B]">
            Medical attention
          </h4>

          <p className="mt-2 text-xs leading-6 text-[#526173]">
            {item?.when_to_seek_care ||
              "Supportive measures should not replace professional medical advice. Seek medical care if symptoms are severe, persistent, worsening, or concerning."}
          </p>

        </div>


        {/* ====================================================
            CLOSE
        ==================================================== */}

        <div className="mt-6 flex justify-end">

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#13264B] px-5 py-2.5 text-[11px] font-semibold text-white"
          >
            Close
          </button>

        </div>

      </div>

    </Modal>
  );
}


// ============================================================
// INFO
// ============================================================

function Info({
  label,
  value,
}) {
  return (

    <div className="mt-4">

      <p className="text-[10px] font-bold uppercase tracking-wide text-[#9A9489]">
        {label}
      </p>

      <p className="mt-1 whitespace-pre-line text-xs leading-5 text-[#526173]">
        {value || "—"}
      </p>

    </div>
  );
}


// ============================================================
// DIVIDER
// ============================================================

function Divider() {
  return (
    <div className="my-6 border-t border-[#E7E2D8]" />
  );
}


// ============================================================
// MODAL
// ============================================================

function Modal({
  title,
  onClose,
  children,
  wide = false,
}) {
  return (

    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4">

      <div
        className={`max-h-[90vh] w-full ${
          wide
            ? "max-w-4xl"
            : "max-w-2xl"
        } overflow-y-auto rounded-2xl bg-white p-6 shadow-xl`}
      >

        <div className="mb-5 flex items-start justify-between gap-4">

          <h3 className="text-lg font-bold text-[#13264B]">
            {title}
          </h3>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-[#F4F6F5] p-2 text-[#52606D]"
            aria-label="Close"
          >
            <X size={16} />
          </button>

        </div>

        {children}

      </div>

    </div>
  );
}