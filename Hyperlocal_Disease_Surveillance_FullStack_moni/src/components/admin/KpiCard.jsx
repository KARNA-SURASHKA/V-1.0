export default function KpiCard({
  label,
  value,
  icon: Icon,
  note,
  trend,
  tone = "green",
}) {
  const tones = {
    green: {
      background: "#EDF8F0",
      color: "#087A32",
    },

    amber: {
      background: "#FFF7E5",
      color: "#C48700",
    },

    red: {
      background: "#FFF0F0",
      color: "#C62828",
    },

    blue: {
      background: "#F0F4FF",
      color: "#536CC8",
    },
  };

  const selected =
    tones[tone] || tones.green;

  return (
    <div className="h-[114px] rounded-[12px] border border-[#E1E8E3] bg-white px-[15px] py-[13px] shadow-[0_2px_7px_rgba(31,49,68,.035)]">

      <div className="flex h-full items-start gap-[11px]">

        {/* ICON */}

        {Icon && (
          <div
            className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full"
            style={{
              backgroundColor:
                selected.background,
              color: selected.color,
            }}
          >
            <Icon
              size={18}
              strokeWidth={1.7}
            />
          </div>
        )}

        {/* CONTENT */}

        <div className="min-w-0">

          <p className="text-[8px] font-bold uppercase tracking-[0.05em] text-[#10243A]">
            {label}
          </p>

          <p className="mt-[5px] text-[24px] font-semibold leading-none tracking-[-0.025em] text-[#10243A]">
            {value}
          </p>

          {note && (
            <p className="mt-[5px] text-[8px] leading-[11px] text-[#52627D]">
              {note}
            </p>
          )}

          {trend && (
            <p
              className="mt-[6px] text-[8px] font-semibold"
              style={{
                color:
                  selected.color,
              }}
            >
              {trend}
            </p>
          )}

        </div>

      </div>

    </div>
  );
}