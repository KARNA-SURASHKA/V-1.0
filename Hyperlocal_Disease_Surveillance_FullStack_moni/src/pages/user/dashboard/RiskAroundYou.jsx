import {
  ArrowRight,
  MapPin,
  ShieldCheck,
} from "lucide-react";

import KarnatakaMap
  from "../../../assets/maps/karnataka-risk-map-dashboard.png";


export default function RiskAroundYou({
  taluk,
  risk = "Low",
  onViewMap,
}) {

  // ============================================================
  // LOCATION
  // ============================================================

  const locationName =
    taluk?.talukName ||
    taluk?.name ||
    taluk?.districtName ||
    "Selected area";


  // ============================================================
  // RISK
  // ============================================================

  const normalizedRisk =
    String(risk || "Low");


  const riskClass =
    normalizedRisk === "High" ||
    normalizedRisk === "Critical"
      ? "text-[#F04444]"
      : normalizedRisk === "Moderate"
        ? "text-[#D98200]"
        : "text-[#16803C]";


  // ============================================================
  // OPEN DISEASE RISK MAP
  // ============================================================

  const openRiskMap = () => {

    if (
      typeof onViewMap === "function"
    ) {
      onViewMap();
    }

  };


  return (

    <section
      className="
        flex
        h-full
        min-h-0
        flex-col
        overflow-hidden
        rounded-[14px]
        border
        border-[#E6DFD4]
        bg-white
        p-[16px]
        shadow-[0_1px_4px_rgba(44,35,24,0.035)]
      "
    >

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div
        className="
          flex
          h-[31px]
          shrink-0
          items-center
          gap-[8px]
        "
      >

        <ShieldCheck
          size={18}
          strokeWidth={1.8}
          className="
            shrink-0
            text-[#253744]
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


      {/* ======================================================
          MAIN CONTENT

          IMPORTANT:
          The right column is now 136px wide.

          This gives:
          - enough room for the legend
          - enough room for Current risk
          - enough room for "View Risk Map →"
          - no text clipping
      ====================================================== */}

      <div
        className="
          mt-[8px]
          grid
          min-h-0
          flex-1
          grid-cols-[minmax(0,1fr)_136px]
          gap-[12px]
        "
      >

        {/* ====================================================
            KARNATAKA MAP
        ==================================================== */}

        <button
          type="button"
          onClick={openRiskMap}
          aria-label="Open Disease Risk Map"
          className="
            relative
            min-h-0
            h-full
            min-w-0
            w-full
            overflow-hidden
            rounded-[8px]
            border
            border-[#E8E3DB]
            bg-[#F8F7F3]
            text-left
            outline-none
            transition
            hover:border-[#A9CDB1]
            focus:ring-2
            focus:ring-[#8FC6A0]
            focus:ring-offset-1
          "
        >

          <img
            src={KarnatakaMap}
            alt="Karnataka disease risk map"
            draggable="false"
            className="
              absolute
              inset-0
              h-full
              w-full
              object-contain
              object-center
            "
          />


          {/* ==================================================
              CURRENT LOCATION MARKER
          ================================================== */}

          <span
            className="
              pointer-events-none
              absolute
              left-[52%]
              top-[55%]
              flex
              h-[31px]
              w-[31px]
              -translate-x-1/2
              -translate-y-1/2
              items-center
              justify-center
              rounded-full
              border-[2px]
              border-white
              bg-[#1688F5]
              text-white
              shadow-[0_2px_8px_rgba(0,0,0,0.22)]
            "
          >

            <MapPin
              size={16}
              fill="currentColor"
              strokeWidth={1.5}
            />

          </span>

        </button>


        {/* ====================================================
            RIGHT INFORMATION PANEL
        ==================================================== */}

        <div
          className="
            flex
            min-h-0
            min-w-0
            flex-col
          "
        >

          {/* ==================================================
              RISK LEGEND
          ================================================== */}

          <div
            className="
              shrink-0
              space-y-[12px]
              pt-[4px]
            "
          >

            <Legend
              color="#149447"
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


          {/* ==================================================
              CURRENT RISK
          ================================================== */}

          <div
            className="
              mt-auto
              w-full
              shrink-0
              rounded-[9px]
              border
              border-[#E8E3DB]
              bg-white
              px-[10px]
              py-[9px]
            "
          >

            <p
              className="
                text-[9px]
                font-medium
                leading-[12px]
                text-[#2B3035]
              "
            >
              Current risk
            </p>


            <p
              className={`
                mt-[3px]
                text-[18px]
                font-semibold
                leading-[20px]
                ${riskClass}
              `}
            >
              {normalizedRisk}
            </p>


            <p
              className="
                mt-[5px]
                truncate
                text-[9px]
                leading-[11px]
                text-[#6D747A]
              "
              title={locationName}
            >
              {locationName}
            </p>

          </div>


          {/* ==================================================
              VIEW RISK MAP BUTTON

              This is deliberately NOT allowed to shrink.

              The text and arrow are separate flex items and
              the text has enough room because this column is
              now 136px wide.
          ================================================== */}

          <button
            type="button"
            onClick={openRiskMap}
            aria-label="View Disease Risk Map"
            className="
              mt-[8px]
              flex
              h-[35px]
              w-full
              shrink-0
              items-center
              justify-center
              gap-[6px]
              rounded-[7px]
              border
              border-[#58AE70]
              bg-white
              px-[8px]
              text-[10px]
              font-semibold
              leading-none
              text-[#16803C]
              transition
              hover:bg-[#F1FAF3]
              hover:border-[#3F9A5C]
              focus:outline-none
              focus:ring-2
              focus:ring-[#9ACDA6]
              focus:ring-offset-1
            "
          >

            <span
              className="
                block
                shrink-0
                whitespace-nowrap
              "
            >
              View Risk Map
            </span>


            <ArrowRight
              size={12}
              strokeWidth={2}
              className="
                block
                shrink-0
              "
            />

          </button>

        </div>

      </div>

    </section>

  );
}


/* ==============================================================
   LEGEND
============================================================== */

function Legend({
  color,
  label,
}) {

  return (

    <div
      className="
        flex
        w-full
        min-w-0
        items-center
        gap-[7px]
      "
    >

      <span
        className="
          h-[9px]
          w-[9px]
          shrink-0
          rounded-full
        "
        style={{
          backgroundColor: color,
        }}
      />

      <span
        className="
          truncate
          whitespace-nowrap
          text-[10px]
          leading-[12px]
          text-[#2D3236]
        "
      >
        {label}
      </span>

    </div>

  );

}