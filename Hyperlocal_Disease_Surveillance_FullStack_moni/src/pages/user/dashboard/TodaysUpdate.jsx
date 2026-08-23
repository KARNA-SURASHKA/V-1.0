import {
  ArrowRight,
  BellRing,
} from "lucide-react";

import DiseaseVisual from "../../../components/DiseaseVisual";

import {
  getDiseaseVisual,
} from "../../../data/diseaseVisuals";


export default function TodaysUpdate({
  disease,
  category,
  location,
  trend,
  percentageChange,
  onViewDetails,
}) {

  const visual =
    getDiseaseVisual(
      disease,
      category
    );


  const direction =
    String(
      trend || "stable"
    ).toLowerCase();


  const numericChange =
    Number(
      percentageChange
    );


  const hasChange =
    Number.isFinite(
      numericChange
    );


  const increasing =
    direction.includes(
      "increas"
    ) ||
    numericChange > 0;


  const decreasing =
    direction.includes(
      "decreas"
    ) ||
    numericChange < 0;


  const trendText =
    increasing
      ? "increasing"
      : decreasing
        ? "decreasing"
        : "stable";


  return (

    <section
      className="
        h-full
        rounded-[14px]
        border
        border-[#E6DFD4]
        bg-white
        p-5
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

        <BellRing
          size={18}
          strokeWidth={1.8}
          className="
            text-[#F04444]
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
          WEEK&apos;S UPDATE
        </h2>

      </div>


      {/* CONTENT */}

      <div
        className="
          grid
          min-h-[260px]
          grid-cols-[1fr_145px]
          items-center
          gap-2
          pt-2
        "
      >

        <div>

          <h3
            className="
              max-w-[260px]
              text-[21px]
              font-semibold
              leading-[1.28]
              tracking-[-0.02em]
              text-[#101214]
            "
          >
            {visual.name} activity is{" "}
            {trendText} in{" "}
            {location || "your area"}.
          </h3>


          <p
            className="
              mt-4
              max-w-[260px]
              text-[13px]
              leading-6
              text-[#272B30]
            "
          >
            {hasChange
              ? `Cases have ${
                  increasing
                    ? "increased"
                    : decreasing
                      ? "decreased"
                      : "changed"
                } by ${Math.abs(
                  numericChange
                )}% compared with last week.`
              : `Current surveillance information for ${visual.name} is available for your selected area.`}
          </p>


          <button
            type="button"
            onClick={
              onViewDetails
            }
            className="
              mt-5
              inline-flex
              items-center
              gap-3
              rounded-[7px]
              border
              border-[#F04444]
              bg-white
              px-4
              py-2.5
              text-[12px]
              font-medium
              text-[#1D1F21]
              transition
              hover:bg-[#FFF7F7]
            "
          >

            View Details

            <ArrowRight
              size={16}
            />

          </button>

        </div>


        <div
          className="
            flex
            h-full
            items-center
            justify-center
          "
        >

          <DiseaseVisual
            disease={
              disease
            }

            category={
              category
            }

            type="update"

            className="
              h-[145px]
              w-[145px]
              object-contain
            "
          />

        </div>

      </div>

    </section>

  );
}
