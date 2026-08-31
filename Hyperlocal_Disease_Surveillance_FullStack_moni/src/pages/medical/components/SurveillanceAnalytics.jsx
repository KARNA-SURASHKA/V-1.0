import { BarChart3, TrendingUp } from "lucide-react";
import { Panel } from "./MedicalUi";

export default function SurveillanceAnalytics({ data }) {
  if (!data) return <div className="py-20 text-center text-[12px] text-[#718096]">Loading analytics…</div>;
  const weekly = data.weeks || data.weekly || [];
  const totals = data.disease_totals || [];
  const max = Math.max(1, ...weekly.map((w) => Number(w.total_cases || 0)));
  return <div className="space-y-5">
    <div><h1 className="text-[27px] font-semibold tracking-[-.035em]">Surveillance Analytics</h1><p className="mt-1 text-[12px] text-[#66727D]">District-level trends and disease burden across the monitored reporting cycles.</p></div>
    <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
      <Panel title="Weekly Case Trend" subtitle="Total reported cases per surveillance week."><div className="space-y-4">{weekly.map((w)=><div key={`${w.year}-${w.week_number}`}><div className="mb-1 flex justify-between text-[10px]"><span>{w.label || `W${w.week_number}`} / {w.year}</span><b>{w.total_cases} cases</b></div><div className="h-8 rounded-lg bg-[#EDF4EF]"><div className="flex h-full items-center rounded-lg bg-[#159447] px-2 text-[9px] font-bold text-white" style={{width:`${Math.max(8,(w.total_cases/max)*100)}%`}}>{w.total_cases}</div></div></div>)}{!weekly.length && <div className="py-10 text-center text-[11px] text-[#718096]">No analytics data available.</div>}</div></Panel>
      <Panel title="Disease Burden" subtitle="Cumulative cases represented in the district dataset."><div className="space-y-2">{totals.map((d,i)=><div key={d.disease} className="flex items-center justify-between rounded-xl bg-[#F7FAF8] px-4 py-3"><div className="flex items-center gap-2"><span className="text-[10px] text-[#8A93A3]">{i+1}</span><span className="text-[11px] font-semibold">{d.disease}</span></div><b className="text-[12px] text-[#087A32]">{d.cases}</b></div>)}</div></Panel>
    </div>
    <Panel title="What this means"><div className="grid gap-3 md:grid-cols-3"><div className="rounded-xl border border-[#E7ECE9] p-4"><TrendingUp size={17} className="text-[#087A32]"/><div className="mt-2 text-[11px] font-semibold">Trend visibility</div><div className="mt-1 text-[10px] leading-4 text-[#718096]">Compare weekly totals to identify sustained increases or decreases.</div></div><div className="rounded-xl border border-[#E7ECE9] p-4"><BarChart3 size={17} className="text-[#3977D5]"/><div className="mt-2 text-[11px] font-semibold">Burden distribution</div><div className="mt-1 text-[10px] leading-4 text-[#718096]">Use disease totals to prioritise review and field follow-up.</div></div><div className="rounded-xl border border-[#E7ECE9] p-4"><span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#FFF3DD] text-[11px] text-[#D88B0D]">!</span><div className="mt-2 text-[11px] font-semibold">Decision support</div><div className="mt-1 text-[10px] leading-4 text-[#718096]">Analytics inform surveillance action; they are not a clinical diagnosis.</div></div></div></Panel>
  </div>;
}
