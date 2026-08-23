import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  MapPinned,
  AlertCircle,
} from "lucide-react";

import {
  api,
  DISEASES,
} from "../../api";

import TaluqMap from "../../components/TaluqMap";
import RiskBadge from "../../components/RiskBadge";

export default function RiskMap({
  location,
}) {
  const [predictions, setPredictions] =
    useState([]);

  const [disease, setDisease] =
    useState("");

  const [error, setError] =
    useState("");

  const [selectedId, setSelectedId] =
    useState(location.taluk?.id || null);

  useEffect(() => {

    api
      .getLatestPredictions({
        state_id: location.state?.id,
        district_id:
          location.district?.id,
        taluk_id:
          location.taluk?.id,
      })

      .then(setPredictions)

      .catch((e) =>
        setError(e.message)
      );

  }, [
    location.state?.id,
    location.district?.id,
    location.taluk?.id,
  ]);

  const filtered = useMemo(
    () =>
      disease
        ? predictions.filter(
            (p) =>
              p.disease === disease
          )
        : predictions,
    [predictions, disease]
  );

  const effectiveSelectedId =
    location.taluk?.id ||
    selectedId;

  const entries = useMemo(() => {

    const grouped = new Map();

    filtered.forEach((p) => {

      if (!grouped.has(p.taluk_id)) {

        grouped.set(
          p.taluk_id,
          {
            taluk_id: p.taluk_id,
            taluk_name:
              p.taluk_name,
            current_cases: 0,
            predicted_cases: 0,
            risk_level: "Low",
            trend: p.trend,
            confidence:
              p.confidence,
            top_disease:
              p.disease,
          }
        );

      }

      const item =
        grouped.get(p.taluk_id);

      item.current_cases +=
        p.current_cases;

      item.predicted_cases +=
        p.predicted_cases;

      const rank = {
        Low: 0,
        Moderate: 1,
        High: 2,
        Critical: 3,
      };

      if (
        (rank[p.risk_level] ?? 0) >
        (rank[item.risk_level] ?? 0)
      ) {

        item.risk_level =
          p.risk_level;

        item.top_disease =
          p.disease;

        item.trend =
          p.trend;

        item.confidence =
          p.confidence;
      }

    });

    return Array.from(
      grouped.values()
    ).map((entry) => ({
      ...entry,

      is_selected:
        entry.taluk_id ===
        (
          effectiveSelectedId ||
          filtered[0]?.taluk_id
        ),
    }));

  }, [
    filtered,
    effectiveSelectedId,
  ]);

  const scope =
    location.taluk?.name ||
    location.district?.name ||
    location.state?.name ||
    "All available locations";

  return (
    <div>

      <div className="flex flex-wrap items-end justify-between gap-4 mb-5">

        <div>

          <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-[#9A9489]">
            Geographic surveillance
          </p>

          <h2 className="text-[20px] font-semibold text-[#1F3144] mt-1">
            Risk Map
          </h2>

          <p className="text-[13px] text-[#7A8598] mt-1">
            Prediction risk across the selected geographic scope: {scope}.
          </p>

        </div>

        <select
          value={disease}
          onChange={(e) =>
            setDisease(e.target.value)
          }
          className="rounded-xl border border-[#E8E2D8] bg-white px-3 py-2.5 text-[13px] text-[#1F3144]"
        >

          <option value="">
            All Diseases
          </option>

          {DISEASES.map((d) => (
            <option
              key={d}
              value={d}
            >
              {d}
            </option>
          ))}

        </select>

      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-[#FBEAEA] border border-[#F1C7C7] p-3 text-[13px] text-[#C62828]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_330px] gap-5">

        <div className="bg-white rounded-2xl border border-[#E8E2D8] p-4 sm:p-6 min-h-[560px] flex items-center justify-center">

          {entries.length ? (

            <div className="max-w-full overflow-auto">

              <TaluqMap
                entries={entries}
                onSelectTaluk={(id) =>
                  setSelectedId(id)
                }
              />

            </div>

          ) : (

            <div className="text-center text-[#7A8598] max-w-[320px]">

              <MapPinned
                size={28}
                className="mx-auto mb-3 text-[#9A9489]"
              />

              <p className="font-semibold text-[#526073]">
                No prediction data for this scope
              </p>

              <p className="text-[12px] mt-1">
                Run a prediction or choose a broader geographic selection.
              </p>

            </div>

          )}

        </div>

        <div className="bg-white rounded-2xl border border-[#E8E2D8] p-5">

          <div className="flex items-center gap-2 mb-4">

            <AlertCircle
              size={18}
              className="text-[#0B7A33]"
            />

            <h3 className="font-semibold text-[15px] text-[#1F3144]">
              Selected Area
            </h3>

          </div>

          {effectiveSelectedId &&
          entries.find(
            (e) =>
              e.taluk_id ===
              effectiveSelectedId
          ) ? (

            <RiskDetails
              entry={entries.find(
                (e) =>
                  e.taluk_id ===
                  effectiveSelectedId
              )}
            />

          ) : (

            <p className="text-[13px] leading-5 text-[#7A8598]">
              Select a taluk on the map to inspect current and predicted cases.
            </p>

          )}

        </div>

      </div>

    </div>
  );
}

function RiskDetails({
  entry,
}) {
  return (
    <div>

      <h4 className="text-[18px] font-semibold text-[#1F3144]">
        {entry.taluk_name}
      </h4>

      <div className="mt-4 space-y-3 text-[13px]">

        <Row
          label="Current Cases"
          value={entry.current_cases}
        />

        <Row
          label="Predicted Cases"
          value={entry.predicted_cases}
        />

        <div className="flex items-center justify-between">

          <span className="text-[#7A8598]">
            Risk Level
          </span>

          <RiskBadge
            level={entry.risk_level}
          />

        </div>

        <Row
          label="Trend"
          value={entry.trend}
        />

        <Row
          label="Confidence"
          value={`${Math.round(
            entry.confidence * 100
          )}%`}
        />

        {entry.top_disease && (
          <Row
            label="Leading Disease"
            value={entry.top_disease}
          />
        )}

      </div>

    </div>
  );
}

function Row({
  label,
  value,
}) {
  return (
    <div className="flex items-center justify-between gap-4">

      <span className="text-[#7A8598]">
        {label}
      </span>

      <span className="font-medium text-[#1F3144] text-right">
        {value}
      </span>

    </div>
  );
}