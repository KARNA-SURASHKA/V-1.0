import { ShieldCheck } from "lucide-react";
import { getPrecautionVisual } from "../../../data/precautionData";

export default function PrecautionaryCard({
  number,
  type,
  title,
  description,
  benefit,
  theme,
  disease,
  compact = false,
}) {
  const image = getPrecautionVisual(type, disease);

  return (
    <article
      className={`group flex min-w-0 flex-col overflow-hidden rounded-[12px] border bg-white ${
        compact ? "min-h-[224px]" : "min-h-[226px]"
      }`}
      style={{
        borderColor: "#E6E5E3",
        boxShadow: "0 1px 4px rgba(0,0,0,0.025)",
      }}
    >
      <div
        className={`grid flex-1 items-center ${
          compact
            ? "grid-cols-[112px_minmax(0,1fr)] gap-[10px] px-[10px] py-[10px]"
            : "grid-cols-[136px_minmax(0,1fr)] gap-[10px] px-[12px] py-[11px]"
        }`}
      >
        <div
          className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full ${
            compact ? "h-[108px] w-[108px]" : "h-[128px] w-[128px]"
          }`}
          style={{
            backgroundColor: theme.softStrong,
          }}
        >
          <img
            src={image}
            alt=""
            draggable="false"
            className={`object-contain mix-blend-multiply ${
              compact ? "h-[105px] w-[105px]" : "h-[124px] w-[124px]"
            } transition-transform duration-200 group-hover:scale-[1.015]`}
          />
        </div>

        <div className="min-w-0 self-center pr-[7px]">
          <div className="flex items-start gap-[9px]">
            <span
              className={`flex shrink-0 items-center justify-center rounded-full font-bold text-white ${
                compact ? "h-[28px] w-[28px] text-[12px]" : "h-[29px] w-[29px] text-[13px]"
              }`}
              style={{ backgroundColor: theme.accent }}
            >
              {number}
            </span>

            <h3
              className={`min-w-0 font-semibold leading-[1.25] text-[#12161A] ${
                compact ? "text-[14px]" : "text-[16px]"
              }`}
            >
              {title}
            </h3>
          </div>

          <p
            className={`mt-[14px] leading-[1.48] text-[#252B30] ${
              compact ? "text-[12px]" : "text-[13px]"
            }`}
          >
            {description}
          </p>
        </div>
      </div>

      <div
        className={`mx-[12px] mb-[11px] flex items-center justify-center gap-[9px] rounded-[7px] font-medium ${
          compact ? "h-[35px] text-[11px]" : "h-[38px] text-[12px]"
        }`}
        style={{
          backgroundColor: theme.benefit,
          color: theme.benefitText,
        }}
      >
        <ShieldCheck size={16} strokeWidth={2} />
        <span>{benefit}</span>
      </div>
    </article>
  );
}
