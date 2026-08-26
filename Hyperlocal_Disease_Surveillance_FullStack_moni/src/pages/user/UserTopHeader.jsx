import {
  Bell,
  ChevronDown,
  MapPin,
} from "lucide-react";

export default function UserTopHeader({
  username = "Monish",
  selectedLocation,
  title = "",
  subtitle = "",
  portalLabel = "CITIZEN PORTAL",
}) {
  const location =
    selectedLocation?.talukName ||
    "Virajpet";

  return (
    <header
      className="
        flex
        min-h-[126px]
        w-full
        items-start
        justify-between
        bg-white
        px-[40px]
        pb-[20px]
        pt-[28px]
      "
    >
      {/* LEFT */}
      <div className="min-w-0">

        <p
          className="
            text-[12px]
            font-semibold
            tracking-[0.12em]
            text-[#697383]
          "
        >
          {portalLabel}
        </p>

        <h1
          className="
            mt-[5px]
            text-[30px]
            font-bold
            tracking-[-0.03em]
            text-[#101A31]
          "
        >
          {title}
        </h1>

        {subtitle && (
          <p
            className="
              mt-[5px]
              max-w-[650px]
              text-[14px]
              leading-[1.55]
              text-[#26384D]
            "
          >
            {subtitle}
          </p>
        )}

      </div>


      {/* RIGHT */}
      <div
        className="
          flex
          shrink-0
          items-center
          gap-[17px]
        "
      >

        {/* MONITORING */}
        <div
          className="
            flex
            h-[50px]
            min-w-[140px]
            items-center
            gap-3
            rounded-[11px]
            border
            border-[#E5E8EB]
            bg-white
            px-[13px]
            shadow-[0_2px_8px_rgba(16,42,67,0.06)]
          "
        >

          <span
            className="
              flex
              h-[32px]
              w-[32px]
              items-center
              justify-center
              rounded-[9px]
              bg-[#EFF8F0]
              text-[#087A32]
            "
          >
            <MapPin size={18} />
          </span>

          <div>

            <p
              className="
                text-[8px]
                font-medium
                uppercase
                tracking-[0.1em]
                text-[#8A919A]
              "
            >
              Monitoring
            </p>

            <p
              className="
                text-[13px]
                font-semibold
                text-[#102A43]
              "
            >
              {location}
            </p>

          </div>

        </div>


        {/* NOTIFICATIONS */}
        <button
          type="button"
          className="
            relative
            flex
            h-[44px]
            w-[44px]
            items-center
            justify-center
            rounded-full
            text-[#101820]
          "
          aria-label="Notifications"
        >

          <Bell
            size={23}
            strokeWidth={1.8}
          />

          <span
            className="
              absolute
              right-[2px]
              top-[0px]
              h-[8px]
              w-[8px]
              rounded-full
              bg-[#0B8A43]
            "
          />

        </button>


        {/* USER */}
        <button
          type="button"
          className="
            flex
            h-[46px]
            items-center
            gap-2
            rounded-full
            bg-[#EAF5EA]
            px-[13px]
            text-[#087A32]
          "
          aria-label="User profile"
        >

          <span
            className="
              flex
              h-[34px]
              w-[34px]
              items-center
              justify-center
              rounded-full
              bg-[#DCEBDD]
              text-[17px]
              font-semibold
            "
          >
            {String(username || "M")
              .charAt(0)
              .toUpperCase()}
          </span>

          <span
            className="
              hidden
              text-[13px]
              font-semibold
              xl:block
            "
          >
            {username}
          </span>

          <ChevronDown size={15} />

        </button>

      </div>

    </header>
  );
}