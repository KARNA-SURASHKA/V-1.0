import { RISK_COLORS } from "../api";

export default function RiskBadge({ level }) {
  const color = RISK_COLORS[level] || "#999";
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold text-white"
      style={{ backgroundColor: color }}
    >
      {level}
    </span>
  );
}
