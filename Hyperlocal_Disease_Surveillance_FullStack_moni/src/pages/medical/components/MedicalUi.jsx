import { CheckCircle2, ArrowUpRight, ArrowDownRight } from "lucide-react";

export const cn = (...items) => items.filter(Boolean).join(" ");

export function Panel({ title, subtitle, action, onAction, children, className = "" }) {
  return <section className={cn("rounded-2xl border border-[#E6EBE8] bg-white shadow-[0_3px_14px_rgba(25,50,40,.035)]", className)}>
    <div className="flex items-start justify-between gap-4 border-b border-[#EEF1EF] px-5 py-4">
      <div><h3 className="text-[14px] font-semibold text-[#17233D]">{title}</h3>{subtitle && <p className="mt-1 text-[11px] text-[#718096]">{subtitle}</p>}</div>
      {action && <button type="button" onClick={onAction} className="shrink-0 text-[11px] font-semibold text-[#087A32] hover:text-[#065F28]">{action} →</button>}
    </div>
    <div className="p-5">{children}</div>
  </section>;
}

export function Kpi({ icon, label, value, note, tone = "green", trend }) {
  const tones = { green: "bg-[#E8F6EC] text-[#087A32]", blue: "bg-[#E9F0FF] text-[#3977D5]", amber: "bg-[#FFF3DE] text-[#E79B19]", purple: "bg-[#F0E8FF] text-[#8A59D6]" };
  return <div className="flex min-h-[116px] items-center gap-4 rounded-2xl border border-[#E9EEEB] bg-white px-5 shadow-[0_3px_14px_rgba(25,50,40,.035)]">
    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${tones[tone]}`}>{icon}</div>
    <div className="min-w-0"><div className="text-[11px] font-semibold text-[#536174]">{label}</div><div className="mt-1 text-[26px] font-semibold tracking-[-.03em] text-[#101B38]">{value}</div>{trend ? <div className={`mt-0.5 flex items-center gap-1 text-[10px] font-semibold ${trend > 0 ? "text-[#D34B4B]" : "text-[#087A32]"}`}>{trend > 0 ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>} {Math.abs(trend)}% vs last week</div> : note && <div className="mt-0.5 text-[10px] text-[#087A32]">{note}</div>}</div>
  </div>;
}

export function StatusBadge({ children, tone = "green" }) {
  const styles = { green: "bg-[#E8F5EC] text-[#177341]", red: "bg-[#FDEBEC] text-[#D23A3A]", amber: "bg-[#FFF3DD] text-[#D88B0D]", blue: "bg-[#EAF1FF] text-[#356FD1]", gray: "bg-[#F0F2F2] text-[#66727D]" };
  return <span className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-semibold ${styles[tone] || styles.gray}`}>{children}</span>;
}

export function RiskBadge({ level }) {
  const tone = level === "Critical" || level === "High" ? "red" : level === "Moderate" ? "amber" : "green";
  return <StatusBadge tone={tone}>{level || "Low"}</StatusBadge>;
}

export function Empty({ text }) { return <div className="rounded-xl border border-dashed border-[#DDE5E0] bg-[#FAFCFB] px-4 py-8 text-center text-[12px] text-[#718096]">{text}</div>; }
export function Loading() { return <div className="flex min-h-[260px] items-center justify-center text-[12px] text-[#718096]">Loading surveillance data…</div>; }

export function PageHeading({ eyebrow, title, subtitle, image, children }) {
  return <div className="relative mb-5 min-h-[108px] overflow-hidden rounded-2xl bg-white px-1 py-1">
    <div className="relative z-10 max-w-[62%] py-4 pl-1"><div className="text-[10px] font-bold uppercase tracking-[.13em] text-[#087A32]">{eyebrow}</div><h1 className="mt-1 text-[28px] font-semibold tracking-[-.035em] text-[#101B38]">{title}</h1><p className="mt-1 max-w-[660px] text-[12px] text-[#5C687A]">{subtitle}</p>{children}</div>
    {image && <img src={image} alt="" className="pointer-events-none absolute bottom-0 right-0 h-[104px] w-auto object-contain opacity-95" />}
  </div>;
}

export function Toast({ message, onClose }) { if (!message) return null; return <div className="fixed bottom-5 right-5 z-[80] flex max-w-[380px] items-center gap-3 rounded-xl bg-[#17233D] px-4 py-3 text-[12px] font-medium text-white shadow-2xl"><CheckCircle2 size={17} className="text-[#8DE0A7]"/><span>{message}</span><button onClick={onClose} className="ml-2 text-white/70">×</button></div>; }
