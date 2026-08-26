import {
  ArrowRight,
  CalendarDays,
} from "lucide-react";

import DiseaseVisual
  from "../../../components/DiseaseVisual";

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
    <section className="
      h-full
      rounded-[14px]
      border
      border-[#E5E2DC]
      bg-white
      p-[17px]
      shadow-[0_1px_5px_rgba(44,35,24,0.035)]
    ">

      {/* HEADER */}

      <div className="
        flex
        items-center
        gap-2
        pb-2
      ">

        <CalendarDays
          size={19}
          strokeWidth={1.8}
          className="
            text-[#2E9649]
          "
        />

        <h2 className="
          text-[12px]
          font-semibold
          uppercase
          tracking-[0.025em]
          text-[#1B1D1F]
        ">
          WEEK&apos;S UPDATE
        </h2>

      </div>


      {/* CONTENT */}

      <div className="
        grid
        min-h-0
        grid-cols-[1fr_125px]
        items-center
        gap-1
        pt-[8px]
      ">

        <div className="
          min-w-0
        ">

          <h3 className="
            max-w-[270px]
            text-[20px]
            font-semibold
            leading-[1.28]
            tracking-[-0.02em]
            text-[#101214]
          ">

            {visual.name} activity is{" "}
            {trendText} in{" "}
            {location || "your area"}.

          </h3>


          <p className="
            mt-4
            max-w-[275px]
            text-[13px]
            leading-[1.8]
            text-[#272B30]
          ">

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
              mt-4
              inline-flex
              items-center
              gap-3
              rounded-[7px]
              border
              border-[#57B77A]
              bg-white
              px-4
              py-[9px]
              text-[12px]
              font-medium
              text-[#16803C]
              transition
              hover:bg-[#F3FAF4]
            "
          >

            View Details

            <ArrowRight
              size={16}
            />

          </button>

        </div>


        {/* DISEASE IMAGE */}

        <div className="
          flex
          h-full
          items-center
          justify-center
        ">

          <DiseaseVisual
            disease={
              disease
            }
            category={
              category
            }
            type="update"
            alt={`${visual.name} surveillance illustration`}
            className="
              h-[130px]
              w-[130px]
              rounded-[10px]
              object-contain
            "
          />

        </div>

      </div>

    </section>
  );
}