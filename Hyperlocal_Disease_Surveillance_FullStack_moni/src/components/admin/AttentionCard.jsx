export default function AttentionCard({
  icon: Icon,
  title,
  children,
  action,
  onClick,
  tone = "neutral",
}) {
  const accents = {
    neutral:
      "bg-[#EEF2FF] text-[#5C72C9]",

    warning:
      "bg-[#FFF4E7] text-[#DF6A17]",

    danger:
      "bg-[#FDEEEF] text-[#D72E42]",

    success:
      "bg-[#EAF6EE] text-[#0A8542]",
  };

  return (
    <div
      className="
        rounded-[13px]
        border
        border-[#DCE2DF]
        bg-white
        p-3.5
        shadow-[0_2px_8px_rgba(20,40,55,0.03)]
      "
    >

      <div
        className="
          flex
          items-center
          gap-3
          rounded-[10px]
          border
          border-[#E6EAE8]
          px-3
          py-2.5
        "
      >

        <div
          className={`
            h-9 w-9
            shrink-0
            rounded-full
            flex items-center
            justify-center
            ${
              accents[tone]
            }
          `}
        >
          {Icon && (
            <Icon
              size={18}
              strokeWidth={1.8}
            />
          )}
        </div>

        <div
          className="
            min-w-0
            flex-1
          "
        >

          <div
            className="
              text-[11px]
              font-semibold
              text-[#102943]
            "
          >
            {title}
          </div>

          <div
            className="
              mt-0.5
              text-[9px]
              leading-4
              text-[#6B7B8E]
            "
          >
            {children}
          </div>

        </div>

        {action && (
          <button
            type="button"
            onClick={onClick}
            className="
              shrink-0
              text-[10px]
              font-semibold
              text-[#087D3D]
              hover:underline
            "
          >
            {action} →
          </button>
        )}

      </div>

    </div>
  );
}