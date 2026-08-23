import { useState } from "react";
import { RISK_COLORS } from "../api";

// entries: [{ taluk_id, taluk_name, is_selected, current_cases, predicted_cases, risk_level, trend, confidence, top_disease }]
// Renders the selected taluk in the centre and its neighbours arranged around it,
// connected by lines -- a schematic "spread network" view. Swap for Leaflet/Google
// Maps later by feeding the same `entries` prop with real lat/lng.
export default function TaluqMap({ entries, onSelectTaluk }) {
  const [activeId, setActiveId] = useState(null);
  const size = 460;
  const center = size / 2;
  const selected = entries.find((e) => e.is_selected);
  const neighbours = entries.filter((e) => !e.is_selected);
  const radius = 165;

  const positioned = neighbours.map((n, i) => {
    const angle = (2 * Math.PI * i) / Math.max(1, neighbours.length) - Math.PI / 2;
    return {
      ...n,
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  });

  const active = entries.find((e) => e.taluk_id === activeId);

  return (
    <div className="relative">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* connecting lines */}
        {positioned.map((n) => (
          <line
            key={`line-${n.taluk_id}`}
            x1={center}
            y1={center}
            x2={n.x}
            y2={n.y}
            stroke="#DDD7CC"
            strokeWidth="2"
          />
        ))}

        {/* neighbour nodes */}
        {positioned.map((n) => (
          <g
            key={n.taluk_id}
            className="cursor-pointer"
            onClick={() => {
              setActiveId(n.taluk_id);
              onSelectTaluk && onSelectTaluk(n.taluk_id);
            }}
          >
            <circle
              cx={n.x}
              cy={n.y}
              r={38}
              fill={RISK_COLORS[n.risk_level] || "#999"}
              opacity={activeId === n.taluk_id ? 1 : 0.85}
              stroke="#fff"
              strokeWidth="3"
            />
            <text x={n.x} y={n.y - 2} textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff">
              {n.taluk_name}
            </text>
            <text x={n.x} y={n.y + 14} textAnchor="middle" fontSize="11" fill="#fff">
              {n.predicted_cases} cases
            </text>
          </g>
        ))}

        {/* selected taluk, centre, larger */}
        {selected && (
          <g
            className="cursor-pointer"
            onClick={() => {
              setActiveId(selected.taluk_id);
              onSelectTaluk && onSelectTaluk(selected.taluk_id);
            }}
          >
            <circle
              cx={center}
              cy={center}
              r={54}
              fill={RISK_COLORS[selected.risk_level] || "#999"}
              stroke="#1F3144"
              strokeWidth="3"
            />
            <text x={center} y={center - 6} textAnchor="middle" fontSize="15" fontWeight="800" fill="#fff">
              {selected.taluk_name}
            </text>
            <text x={center} y={center + 14} textAnchor="middle" fontSize="12" fill="#fff">
              {selected.predicted_cases} cases
            </text>
          </g>
        )}
      </svg>

      {/* legend */}
      <div className="flex gap-4 mt-2 flex-wrap">
        {Object.entries(RISK_COLORS).map(([label, color]) => (
          <div key={label} className="flex items-center gap-1.5 text-[13px] text-[#445064]">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: color }} />
            {label}
          </div>
        ))}
      </div>

      {/* popup */}
      {active && (
        <div className="mt-4 rounded-xl border border-[#E8E2D8] bg-white p-4 shadow-sm max-w-[360px]">
          <h4 className="font-semibold text-[#1F3144] text-[16px]">{active.taluk_name}</h4>
          <div className="mt-2 grid grid-cols-2 gap-y-1 text-[14px] text-[#445064]">
            <span>Current Cases</span><span className="font-medium text-[#1F3144]">{active.current_cases}</span>
            <span>Predicted Cases</span><span className="font-medium text-[#1F3144]">{active.predicted_cases}</span>
            <span>Risk Level</span>
            <span className="font-medium" style={{ color: RISK_COLORS[active.risk_level] }}>{active.risk_level}</span>
            <span>Trend</span><span className="font-medium text-[#1F3144]">{active.trend}</span>
            <span>Confidence</span><span className="font-medium text-[#1F3144]">{Math.round(active.confidence * 100)}%</span>
            {active.top_disease && (<><span>Leading Disease</span><span className="font-medium text-[#1F3144]">{active.top_disease}</span></>)}
          </div>
        </div>
      )}
    </div>
  );
}
