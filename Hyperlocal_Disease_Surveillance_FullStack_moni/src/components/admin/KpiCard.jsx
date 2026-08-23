export default function KpiCard({
  label,
  value,
  icon: Icon,
  note,
  tone = "green",
}) {
  const tones = {
    green: "bg-[#0B7A33]/10 text-[#0B7A33]",
    amber: "bg-[#E0A800]/10 text-[#9A7200]",
    red: "bg-[#C62828]/10 text-[#C62828]",
    slate: "bg-[#1F3144]/8 text-[#1F3144]",
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E8E2D8] p-5">

      <div className="flex items-start justify-between gap-3">

        <div>

          <p className="text-[12px] text-[#7A8598]">
            {label}
          </p>

          <p className="text-[29px] leading-none font-bold text-[#1F3144] mt-2">
            {value}
          </p>

          {note && (
            <p className="text-[11px] text-[#9A9489] mt-2">
              {note}
            </p>
          )}

        </div>

        {Icon && (
          <div
            className={`
              w-10 h-10 rounded-xl
              flex items-center justify-center
              ${tones[tone] || tones.green}
            `}
          >
            <Icon size={19} />
          </div>
        )}

      </div>

    </div>
  );
}