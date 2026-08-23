import {
  MapPin,
  Activity,
  ShieldAlert,
  Users,
  Thermometer,
  X,
} from "lucide-react";

export default function MapPopup({
  x,
  y,
  location,
  onClose,
}) {
  return (
    <div
      className="absolute z-50"
      style={{
        left: x,
        top: y,
        transform: "translate(-50%, -105%)",
      }}
      onClick={(e) => e.stopPropagation()}
    >

      {/* ================= POPUP ================= */}

      <div className="relative w-[380px] rounded-[26px] border border-[#E7E2D8] bg-white shadow-2xl">

        {/* Close Button */}

        <button
          onClick={onClose}
          className="
            absolute
            right-5
            top-5
            flex
            h-8
            w-8
            items-center
            justify-center
            rounded-full
            text-gray-400
            transition
            hover:bg-gray-100
            hover:text-gray-700
          "
        >
          <X size={18} />
        </button>

        <div className="p-7">

          {/* ================= HEADER ================= */}

          <div className="flex items-start gap-4">

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#FEECEC]">

              <MapPin
                size={25}
                fill="#EF4444"
                className="text-red-500"
              />

            </div>

            <div>

              <h2 className="text-[27px] font-bold leading-none text-[#13264B]">
                {location}
              </h2>

              <p className="mt-2 text-[14px] text-gray-500">
                Kodagu District
              </p>

            </div>

          </div>

          <div className="my-6 border-t border-[#EFEFEF]" />

          {/* ================= DETAILS ================= */}

          <div className="space-y-5">

            {/* Active Cases */}

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-3">

                <Activity
                  size={20}
                  className="text-green-600"
                />

                <span className="text-[15px] text-gray-600">
                  Active Cases
                </span>

              </div>

              <span className="text-[17px] font-bold text-[#13264B]">
                128
              </span>

            </div>

            {/* Risk */}

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-3">

                <ShieldAlert
                  size={20}
                  className="text-amber-500"
                />

                <span className="text-[15px] text-gray-600">
                  Risk Level
                </span>

              </div>

              <span className="rounded-full bg-[#FFF4D6] px-3 py-1 text-[13px] font-semibold text-[#B45309]">
                Moderate
              </span>

            </div>

            {/* Population */}

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-3">

                <Users
                  size={20}
                  className="text-blue-600"
                />

                <span className="text-[15px] text-gray-600">
                  Population
                </span>

              </div>

              <span className="text-[17px] font-bold text-[#13264B]">
                2.1 Lakh
              </span>

            </div>

            {/* Temperature */}

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-3">

                <Thermometer
                  size={20}
                  className="text-red-500"
                />

                <span className="text-[15px] text-gray-600">
                  Temperature
                </span>

              </div>

              <span className="text-[17px] font-bold text-[#13264B]">
                27°C
              </span>

            </div>

          </div>

          {/* ================= STATUS ================= */}

          <div className="mt-7 rounded-2xl border border-[#D7F5E3] bg-[#F0FDF4] p-4">

            <p className="text-[14px] font-medium leading-6 text-[#15803D]">
              ✓ Disease surveillance is active in this locality.
            </p>

          </div>

        </div>

        {/* ================= POPUP ARROW ================= */}

        <div
          className="
            absolute
            bottom-[-9px]
            left-1/2
            h-[18px]
            w-[18px]
            -translate-x-1/2
            rotate-45
            border-r
            border-b
            border-[#E7E2D8]
            bg-white
          "
        />

      </div>

    </div>
  );
}