import {
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

import DiseaseVisual from "../../../components/DiseaseVisual";

import {
  getPreventionVisual,
} from "../../../data/diseaseVisuals";


export default function PreventiveMeasures({
  disease,
  category,
  onMorePrecautions,
}) {

  const visual =
    getPreventionVisual(
      disease,
      category
    );


  return (
    <section
      className="
        relative
        overflow-hidden
        rounded-[14px]
        border
        border-[#E4E9E3]
        bg-[#F3F8F2]
        px-5
        py-4
        shadow-[0_1px_4px_rgba(0,0,0,0.03)]
      "
    >

      {/* ======================================================
          TEXT CONTENT
      ====================================================== */}

      <div
        className="
          relative
          z-10
          max-w-[58%]
        "
      >

        {/* LABEL */}

        <div
          className="
            flex
            items-center
            gap-2
          "
        >

          <ShieldCheck
            size={19}
            className="text-[#16803C]"
          />

          <p
            className="
              text-[13px]
              font-semibold
              uppercase
              tracking-[0.03em]
              text-[#16803C]
            "
          >
            PRECAUTION OF THE WEEK
          </p>

        </div>


        {/* TITLE */}

        <h2
          className="
            mt-4
            max-w-[420px]
            text-[20px]
            font-semibold
            leading-[1.25]
            text-[#121617]
          "
        >
          {visual.preventionTitle}
        </h2>


        {/* DESCRIPTION */}

        <p
          className="
            mt-2
            max-w-[440px]
            text-[14px]
            leading-6
            text-[#3E4840]
          "
        >
          {visual.preventionDescription}
        </p>


        {/* MORE PRECAUTIONS */}

        <button
          type="button"
          onClick={
            onMorePrecautions
          }
          className="
            mt-4
            inline-flex
            items-center
            gap-3
            rounded-[7px]
            bg-[#2E9649]
            px-5
            py-2.5
            text-[13px]
            font-medium
            text-white
            shadow-sm
            transition
            hover:bg-[#247E3B]
            focus:outline-none
            focus:ring-2
            focus:ring-[#2E9649]/30
          "
        >

          More Precautions

          <ArrowRight
            size={16}
          />

        </button>

      </div>


      {/* ======================================================
          PREVENTION IMAGE
      ====================================================== */}

      <DiseaseVisual
        disease={
          disease
        }

        category={
          category
        }

        type="prevention"

        alt={`${visual.name} prevention illustration`}

        className="
          absolute
          bottom-[-12px]
          right-[5%]
          h-[205px]
          w-[300px]
          object-contain
        "
      />

    </section>
  );
}
