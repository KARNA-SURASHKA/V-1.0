import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { api } from "../../api";

export default function Advice({ talukId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .getAdvice(talukId)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [talukId]);

  if (loading) return <p className="text-[14px] text-[#7A8598]">Loading advice...</p>;
  if (error) return <p className="text-[14px] text-[#C62828]">{error}</p>;
  if (!data) return null;

  return (
    <div className="space-y-4 max-w-[640px]">
      <h2 className="text-[20px] font-semibold text-[#1F3144]">Precautionary Advice</h2>
      {data.top_disease ? (
        <p className="text-[14px] text-[#445064]">
          Based on the most-reported disease in your area: <b className="text-[#0B6D2E]">{data.top_disease}</b>
        </p>
      ) : (
        <p className="text-[14px] text-[#445064]">{data.tips[0]}</p>
      )}

      {data.top_disease && (
        <div className="bg-white rounded-2xl border border-[#E8E2D8] p-6">
          <ul className="space-y-3">
            {data.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-3 text-[14.5px] text-[#1F3144]">
                <ShieldCheck size={18} className="text-[#0B7A33] mt-0.5 flex-shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.agent_notes && (
        <div className="bg-[#F6F3ED] rounded-xl border border-[#E8E2D8] p-5">
          <h4 className="text-[13px] font-semibold text-[#445064] mb-1">Notes from local field agent</h4>
          <p className="text-[14px] text-[#1F3144]">{data.agent_notes}</p>
        </div>
      )}
    </div>
  );
}
