import { useEffect, useState } from "react";
import { Zap } from "lucide-react";

import { api } from "../../api";
import RiskBadge from "../../components/RiskBadge";

export default function PredictionManagement({
  location,
}) {
  const [predictions, setPredictions] =
    useState([]);

  const [error, setError] =
    useState("");

  const [running, setRunning] =
    useState(false);

  const [lastResult, setLastResult] =
    useState(null);

  const load = () =>
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

  useEffect(
    load,
    [
      location.state?.id,
      location.district?.id,
      location.taluk?.id,
    ]
  );

  const handleRun = async () => {

    setRunning(true);
    setError("");

    try {

      const result =
        await api.runPredictions();

      setLastResult(result);

      await load();

    } catch (e) {

      setError(e.message);

    } finally {

      setRunning(false);

    }
  };

  return (
    <div>

      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">

        <div>

          <h2 className="text-[20px] font-semibold text-[#1F3144]">
            Prediction Management
          </h2>

          <p className="text-[13px] text-[#7A8598]">
            Runs the ML model over every taluk's weekly report history, blended with neighbouring-taluk trends.
          </p>

        </div>

        <button
          onClick={handleRun}
          disabled={running}
          className="flex items-center gap-2 rounded-lg bg-[#0B7A33] hover:bg-[#0B6D2E] text-white text-[14px] font-medium px-4 py-2.5 transition-colors disabled:opacity-60"
        >
          <Zap size={17} />

          {running
            ? "Running..."
            : "Run Predictions"}
        </button>

      </div>

      {error && (
        <p className="text-[13px] text-[#C62828] bg-[#FBEAEA] rounded-lg px-3 py-2 mb-4">
          {error}
        </p>
      )}

      {lastResult && (
        <p className="text-[13px] text-[#0B7A33] bg-[#EAF7EE] rounded-lg px-3 py-2 mb-4">
          Generated{" "}
          {lastResult.predictions_created}{" "}
          predictions across{" "}
          {lastResult.taluks_processed}{" "}
          taluks for week{" "}
          {lastResult.week_number}.
        </p>
      )}

      <div className="bg-white rounded-xl border border-[#E8E2D8] overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full text-[14px]">

            <thead className="bg-[#F6F3ED] text-[#445064] text-left">

              <tr>

                <th className="px-4 py-3 font-medium">
                  Taluk
                </th>

                <th className="px-4 py-3 font-medium">
                  Disease
                </th>

                <th className="px-4 py-3 font-medium">
                  Current
                </th>

                <th className="px-4 py-3 font-medium">
                  Predicted
                </th>

                <th className="px-4 py-3 font-medium">
                  Trend
                </th>

                <th className="px-4 py-3 font-medium">
                  Risk
                </th>

                <th className="px-4 py-3 font-medium">
                  Confidence
                </th>

              </tr>

            </thead>

            <tbody>

              {predictions.map(
                (p, index) => (

                  <tr
                    key={index}
                    className="border-t border-[#E8E2D8]"
                  >

                    <td className="px-4 py-3 text-[#1F3144] font-medium">
                      {p.taluk_name}
                    </td>

                    <td className="px-4 py-3 text-[#1F3144]">
                      {p.disease}
                    </td>

                    <td className="px-4 py-3 text-[#1F3144]">
                      {p.current_cases}
                    </td>

                    <td className="px-4 py-3 text-[#1F3144] font-medium">
                      {p.predicted_cases}
                    </td>

                    <td className="px-4 py-3 text-[#7A8598]">
                      {p.trend}
                    </td>

                    <td className="px-4 py-3">
                      <RiskBadge
                        level={p.risk_level}
                      />
                    </td>

                    <td className="px-4 py-3 text-[#7A8598]">
                      {Math.round(
                        p.confidence * 100
                      )}
                      %
                    </td>

                  </tr>

                )
              )}

              {predictions.length === 0 && (

                <tr>

                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-[#7A8598]"
                  >
                    No predictions generated yet. Click "Run Predictions".
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}