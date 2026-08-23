import { ArrowRight } from "lucide-react";

export default function EmergencyCard({
  icon,
  iconBg,
  iconColor,
  title,
  contact,
  description,
  buttonText,
}) {
  return (
    <div
      className="
        flex
        min-h-[220px]
        flex-col
        rounded-3xl
        border
        border-[#E7E2D8]
        bg-white
        p-6
        shadow-sm
        transition-all
        duration-300
        hover:-translate-y-2
        hover:shadow-xl
      "
    >
      {/* Icon */}

      <div
        className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ backgroundColor: iconBg }}
      >
        <div style={{ color: iconColor }}>
          {icon}
        </div>
      </div>

      {/* Title */}

      <h3 className="text-[20px] font-bold text-[#13264B] leading-tight">
        {title}
      </h3>

      {/* Contact */}

      <p className="mt-3 text-[18px] font-semibold text-[#16A34A]">
        {contact}
      </p>

      {/* Description */}

      <p className="mt-3 text-[14px] leading-6 text-gray-500">
        {description}
      </p>

      {/* Button */}

      <button
        className="
          mt-auto
          pt-6
          flex
          items-center
          gap-2
          text-[15px]
          font-semibold
          text-[#16A34A]
          transition-all
          hover:gap-3
        "
      >
        {buttonText}

        <ArrowRight size={17} />
      </button>
    </div>
  );
}