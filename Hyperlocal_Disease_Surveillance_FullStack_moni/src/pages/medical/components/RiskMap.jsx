import { useMemo, useState } from "react";
import { MapPinned, ShieldAlert } from "lucide-react";
import mapImage from "../../../assets/maps/karnataka-risk-map-dashboard.png";
import { Panel, RiskBadge } from "./MedicalUi";

export default function RiskMap({ data = [] }) {
  const [disease, setDisease] = useState("All Diseases");
  const diseases = [...new Set(data.map((p) => p.disease).filter(Boolean))];
  const rows = useMemo(() => data.filter((p) => disease === "All Diseases" || p.disease === disease), [data, disease]);
  const grouped = useMemo(() => { const m = new Map(); rows.forEach((p) => { const k = p.taluk_id; const prev = m.get(k); const rank = {Low:1,Moderate:2,High:3,Critical:4}; if (!prev || (rank[p.risk_level] || 0) > (rank[prev.risk_level] || 0)) m.set(k,p); }); return [...m.values()]; }, [rows]);
  const counts = {Critical:0,High:0,Moderate:0,Low:0}; rows.forEach((r)=>{counts[r.risk_level]=(counts[r.risk_level]||0)+1});

  return <div className="space-y-5">
    <div><h1 className="text-[27px] font-semibold tracking-[-.035em]">Risk Map</h1><p className="mt-1 text-[12px] text-[#66727D]">District-scoped disease risk across Kodagu’s monitored taluks.</p></div>
    <div className="grid gap-4 sm:grid-cols-4"><div className="rounded-xl border border-[#E7ECE9] bg-white p-4"><div className="text-[10px] text-[#718096]">Critical</div><div className="mt-1 text-[23px] font-semibold text-[#D23A3A]">{counts.Critical}</div></div><div className="rounded-xl border border-[#E7ECE9] bg-white p-4"><div className="text-[10px] text-[#718096]">High</div><div className="mt-1 text-[23px] font-semibold text-[#D23A3A]">{counts.High}</div></div><div className="rounded-xl border border-[#E7ECE9] bg-white p-4"><div className="text-[10px] text-[#718096]">Moderate</div><div className="mt-1 text-[23px] font-semibold text-[#D88B0D]">{counts.Moderate}</div></div><div className="rounded-xl border border-[#E7ECE9] bg-white p-4"><div className="text-[10px] text-[#718096]">Low</div><div className="mt-1 text-[23px] font-semibold text-[#177341]">{counts.Low}</div></div></div>
    <Panel title="Kodagu Risk Surface" action={<select value={disease} onChange={(e)=>setDisease(e.target.value)} className="rounded-lg border border-[#DDE5E0] bg-white px-2 py-1 text-[10px]"><option>All Diseases</option>{diseases.map(d=><option key={d}>{d}</option>)}</select>}>
      <div className="grid gap-5 xl:grid-cols-[1.4fr_.8fr]"><div className="relative min-h-[410px] overflow-hidden rounded-2xl border border-[#E2E8E4] bg-[#F4FAF6]"><img src={mapImage} alt="Karnataka risk map" className="absolute inset-0 h-full w-full object-cover opacity-85"/><div className="absolute left-[38%] top-[49%] h-3 w-3 rounded-full bg-[#E11D48] ring-4 ring-white/80"/><div className="absolute left-[46%] top-[57%] h-3 w-3 rounded-full bg-[#F59E0B] ring-4 ring-white/80"/><div className="absolute left-[54%] top-[52%] h-3 w-3 rounded-full bg-[#159447] ring-4 ring-white/80"/><div className="absolute left-4 top-4 rounded-xl bg-white/90 px-3 py-2 text-[10px] font-semibold shadow-sm"><MapPinned size={14} className="mr-1 inline text-[#087A32]"/> Kodagu District</div></div>
        <div className="space-y-2">{grouped.map((r)=><div key={r.taluk_id} className="rounded-xl border border-[#E7ECE9] p-3"><div className="flex items-center justify-between gap-3"><div><div className="text-[12px] font-semibold">{r.taluk_name}</div><div className="mt-1 text-[10px] text-[#718096]">{r.disease} · {r.current_cases} current · {r.predicted_cases} predicted</div></div><RiskBadge level={r.risk_level}/></div><div className="mt-2 text-[10px] text-[#5F6D7D]">Trend: {r.trend || "stable"}</div></div>)}{!grouped.length && <div className="rounded-xl bg-[#F7FAF8] p-5 text-center text-[11px] text-[#718096]">No current risk predictions are available.</div>}</div></div>
    </Panel>
    <div className="rounded-xl border border-[#DDEBE1] bg-[#F3FAF5] p-4 text-[11px] text-[#2D7047]"><ShieldAlert size={17} className="mb-1"/><b>Risk interpretation:</b> Risk levels are based on current surveillance data and the prediction service. They support prioritisation and do not replace clinical assessment.</div>
  </div>;
}
