import { useEffect, useState } from "react";
import { api } from "../../api";
import TaluqMap from "../../components/TaluqMap";

export default function SpreadMapTab({ talukId }) {
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .getSpreadMap(talukId)
      .then(setEntries)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [talukId]);

  if (loading) return <p className="text-[14px] text-[#7A8598]">Loading spread predictions...</p>;
  if (error) return <p className="text-[14px] text-[#C62828]">{error}</p>;

  const hasPredictions = entries.some((e) => e.predicted_cases > 0);

  return (
    <div className="space-y-4">
      <h2 className="text-[20px] font-semibold text-[#1F3144]">Predicted Spread — Neighbouring Taluks</h2>
      <p className="text-[14px] text-[#7A8598] max-w-[640px]">
        The selected taluk is shown in the centre; neighbouring taluks are arranged around it.
        Click any taluk to see its current cases, predicted cases, and confidence.
      </p>

      {!hasPredictions && (
        <p className="text-[13px] text-[#7A8598] bg-[#FFF7E6] border border-[#F2D98A] rounded-lg px-4 py-3 max-w-[640px]">
          No prediction run has been generated yet for this area. Ask an admin to run predictions from the Admin Portal.
        </p>
      )}

      <div className="bg-white rounded-2xl border border-[#E8E2D8] p-6 flex justify-center">
        <TaluqMap entries={entries} />
      </div>
    </div>
  );
}
