import {
  ArrowRight,
  BarChart3,
  BellRing,
  HeartPulse,
  Stethoscope,
} from "lucide-react";

export default function QuickAccess({ onNavigate }) {
  const items = [
    {
      key: "analytics",
      label: "Analytics",
      icon: BarChart3,
      iconColor: "#2E9649",
      bg: "#F3F9F4",
    },
    {
      key: "alerts",
      label: "Emergency\nAlerts",
      icon: BellRing,
      iconColor: "#F28C00",
      bg: "#FFF7EC",
    },
    {
      key: "medical-chat",
      label: "Medical\nAssistant",
      icon: Stethoscope,
      iconColor: "#8B4DE8",
      bg: "#FAF4FF",
    },
    {
      key: "home-relief",
      label: "Home\nRelief",
      icon: HeartPulse,
      iconColor: "#F04444",
      bg: "#FFF5F5",
    },
  ];

  return (
    <section className="rounded-[14px] border border-[#ECE8E1] bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.02em] text-[#1B1D1F]">
        QUICK ACCESS
      </h2>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {items.map(({ key, label, icon: Icon, iconColor, bg }) => (
          <button
            key={key}
            type="button"
            onClick={() => onNavigate?.(key)}
            className="flex min-h-[64px] items-center gap-3 rounded-[9px] border border-[#E8E5DF] px-3 text-left transition hover:-translate-y-0.5 hover:shadow-sm"
            style={{ backgroundColor: bg }}
          >
            <Icon size={24} style={{ color: iconColor }} />

            <span className="flex-1 whitespace-pre-line text-[11px] font-medium leading-4 text-[#1C2024]">
              {label}
            </span>

            <ArrowRight size={14} style={{ color: iconColor }} />
          </button>
        ))}
      </div>
    </section>
  );
}
