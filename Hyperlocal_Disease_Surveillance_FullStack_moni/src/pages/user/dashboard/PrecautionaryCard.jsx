import { ArrowRight } from "lucide-react";

export default function PrecautionaryCard({
  icon,
  iconBg,
  iconColor,
  title,
  description,
}) {
  return (
    <div
      className="
        flex
        min-h-[280px]
        flex-col
        rounded-3xl
        border
        border-[#E7E2D8]
        bg-white
        p-8
        shadow-sm
        transition-all
        duration-300
        hover:-translate-y-2
        hover:shadow-xl
      "
    >
      {/* Icon */}

      <div
        className="
          mb-6
          flex
          h-16
          w-16
          items-center
          justify-center
          rounded-2xl
        "
        style={{
          backgroundColor: iconBg,
        }}
      >
        <div
          style={{
            color: iconColor,
          }}
        >
          {icon}
        </div>
      </div>

      {/* Title */}

      <h3 className="text-[24px] font-bold text-[#13264B]">
        {title}
      </h3>

      {/* Description */}

      <p className="mt-4 text-[16px] leading-8 text-gray-500">
        {description}
      </p>

      {/* Learn More */}

      <button
        type="button"
        className="
          mt-auto
          flex
          items-center
          gap-2
          pt-8
          text-[16px]
          font-semibold
          text-[#16A34A]
          transition-all
          hover:gap-3
        "
      >
        Learn More
        <ArrowRight size={18} />
      </button>
    </div>
  );
}