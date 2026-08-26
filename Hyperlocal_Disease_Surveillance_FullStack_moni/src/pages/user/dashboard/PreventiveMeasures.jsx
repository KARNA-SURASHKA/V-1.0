import {
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

import DiseaseVisual
  from "../../../components/DiseaseVisual";

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
    <section className="
      relative
      h-full
      overflow-hidden
      rounded-[14px]
      border
      border-[#DDEBDD]
      bg-[#F1F8F1]
      px-[20px]
      py-[15px]
      shadow-[0_1px_5px_rgba(0,0,0,0.03)]
    ">

      {/* TEXT */}

      <div className="
        relative
        z-10
        max-w-[56%]
      ">

        <div className="
          flex
          items-center
          gap-2
        ">

          <ShieldCheck
            size={19}
            className="
              text-[#16803C]
            "
          />

          <p className="
            text-[12px]
            font-semibold
            uppercase
            tracking-[0.025em]
            text-[#16803C]
          ">
            PRECAUTION OF THE WEEK
          </p>

        </div>


        <h2 className="
          mt-[11px]
          max-w-[470px]
          text-[18px]
          font-semibold
          leading-[1.25]
          text-[#121617]
        ">
          {visual.preventionTitle}
        </h2>


        <p className="
          mt-1
          max-w-[480px]
          text-[12px]
          leading-[1.55]
          text-[#3E4840]
        ">
          {visual.preventionDescription}
        </p>


        <button
          type="button"
          onClick={
            onMorePrecautions
          }
          className="
            mt-[10px]
            inline-flex
            items-center
            gap-3
            rounded-[7px]
            bg-[#169447]
            px-[17px]
            py-[8px]
            text-[12px]
            font-medium
            text-white
            shadow-sm
            transition
            hover:bg-[#247E3B]
          "
        >

          More Precautions

          <ArrowRight
            size={15}
          />

        </button>

      </div>


      {/* PREVENTION IMAGE */}

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
          pointer-events-none
          absolute
          bottom-[-8px]
          right-[3%]
          h-[174px]
          w-[350px]
          object-contain
        "
      />

    </section>
  );
}