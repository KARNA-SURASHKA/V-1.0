export default function AttentionCard({
  icon: Icon,
  title,
  children,
  action,
  onClick,
  tone = "neutral",
}) {
  const accents = {
    neutral: "bg-[#F6F3ED] text-[#526073]",
    warning: "bg-[#FFF4D6] text-[#9A7200]",
    danger: "bg-[#FBEAEA] text-[#C62828]",
    success: "bg-[#EAF7EE] text-[#0B7A33]",
  };

  return (
    <div className="bg-white rounded-2xl border border-[#E8E2D8] p-5 flex flex-col min-h-[164px]">

      <div className="flex items-start gap-3">

        <div
          className={`
            w-10 h-10 rounded-xl
            flex items-center justify-center
            shrink-0
            ${accents[tone]}
          `}
        >
          {Icon && <Icon size={19} />}
        </div>

        <div className="min-w-0">

          <h3 className="font-semibold text-[14px] text-[#1F3144]">
            {title}
          </h3>

          <div className="text-[13px] leading-5 text-[#6E798A] mt-1">
            {children}
          </div>

        </div>

      </div>

      {action && (
        <button
          onClick={onClick}
          className="mt-auto pt-4 text-left text-[12.5px] font-semibold text-[#0B7A33] hover:underline"
        >
          {action} →
        </button>
      )}

    </div>
  );
}