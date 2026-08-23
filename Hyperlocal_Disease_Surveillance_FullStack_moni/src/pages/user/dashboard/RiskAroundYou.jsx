import {
  ArrowRight,
  MapPin,
} from "lucide-react";

import KarnatakaMap
  from "../../../assets/maps/Karnataka-map.png";


export default function RiskAroundYou({
  taluk,
  risk = "Low",
  onViewMap,
}) {

  const normalizedRisk =
    String(
      risk || "Low"
    );


  const riskClass =
    normalizedRisk === "High" ||
    normalizedRisk === "Critical"

      ? "text-[#F04444]"

      : normalizedRisk === "Moderate"

        ? "text-[#D98B00]"

        : "text-[#16803C]";


  const locationName =
    taluk?.talukName ||
    taluk?.districtName ||
    "Selected area";


  return (

    <section
      className="
        h-full
        rounded-[14px]
        border
        border-[#E6DFD4]
        bg-white
        p-4
        shadow-[0_1px_4px_rgba(44,35,24,0.035)]
      "
    >

      {/* HEADER */}

      <div
        className="
          flex
          items-center
          gap-2
          border-b
          border-[#EEE9E2]
          pb-3
        "
      >

        <MapPin
          size={18}
          strokeWidth={1.8}
          className="
            text-[#1B252A]
          "
        />

        <h2
          className="
            text-[12px]
            font-semibold
            uppercase
            tracking-[0.025em]
            text-[#1B1D1F]
          "
        >
          RISK AROUND YOU
        </h2>

      </div>


      <div
        className="
          mt-3
          grid
          grid-cols-[minmax(0,1fr)_112px]
          gap-3
        "
      >

        {/* MAP */}

        <div
          className="
            relative
            flex
            min-h-[252px]
            items-center
            justify-center
            overflow-hidden
            rounded-[8px]
            border
            border-[#E8E3DB]
            bg-[#F7F5F0]
          "
        >

          <img
            src={
              KarnatakaMap
            }
            alt="Karnataka disease risk map"
            draggable="false"
            className="
              h-full
              w-full
              object-contain
              p-1.5
            "
          />


          {/* LOCATION MARKER */}

          <div
            className="
              pointer-events-none
              absolute
              left-1/2
              top-1/2
              flex
              h-8
              w-8
              -translate-x-1/2
              -translate-y-1/2
              items-center
              justify-center
              rounded-full
              border-2
              border-white
              bg-[#1976D2]
              text-white
              shadow-md
            "
          >

            <MapPin
              size={17}
              fill="currentColor"
            />

          </div>

        </div>


        {/* LEGEND / RISK */}

        <div
          className="
            flex
            min-w-0
            flex-col
          "
        >

          <div
            className="
              space-y-3
              pt-1
              text-[10px]
              text-[#2D3236]
            "
          >

            <Legend
              color="#4A9A54"
              label="Low Risk"
            />

            <Legend
              color="#F4A51C"
              label="Moderate Risk"
            />

            <Legend
              color="#F04444"
              label="High Risk"
            />

          </div>


          <div
            className="
              mt-auto
              rounded-[8px]
              border
              border-[#E8E3DB]
              bg-white
              p-2.5
            "
          >

            <p
              className="
                text-[9px]
                font-medium
                text-[#2B3035]
              "
            >
              Current risk
            </p>


            <p
              className={`
                mt-1
                text-[13px]
                font-semibold
                ${riskClass}
              `}
            >
              {normalizedRisk}
            </p>


            <p
              className="
                mt-1
                truncate
                text-[9px]
                text-[#6D747A]
              "
            >
              {locationName}
            </p>

          </div>


          {/* THIS NOW NAVIGATES TO DISEASE RISK MAP */}

          <button
            type="button"
            onClick={
              onViewMap
            }
            className="
              mt-2
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-[7px]
              border
              border-[#F04444]
              py-2
              text-[10px]
              font-medium
              text-[#F04444]
              transition
              hover:bg-[#FFF7F7]
            "
          >

            View Risk Map

            <ArrowRight
              size={14}
            />

          </button>

        </div>

      </div>

    </section>

  );
}


function Legend({
  color,
  label,
}) {

  return (

    <div
      className="
        flex
        items-center
        gap-2
      "
    >

      <span
        className="
          h-3
          w-3
          shrink-0
          rounded-full
        "
        style={{
          backgroundColor:
            color,
        }}
      />

      <span>
        {label}
      </span>

    </div>

  );

}
