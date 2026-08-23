import { useEffect, useState } from "react";

import {
  Droplets,
  Shield,
  GlassWater,
  Stethoscope,
  HandPlatter,
  TriangleAlert,
} from "lucide-react";

import { api } from "../../../api";
import PrecautionaryCard from "./PrecautionaryCard";

export default function PrecautionarySection({
  talukId,
  talukName,
  districtName,
}) {
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ==========================================================
  // LOAD LOCATION-SPECIFIC ADVICE
  // ==========================================================

  useEffect(() => {
    let cancelled = false;

    async function loadAdvice() {
      if (!talukId) {
        setAdvice(null);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const data = await api.getAdvice(
          Number(talukId)
        );

        if (!cancelled) {
          setAdvice(data);
        }
      } catch (err) {
        if (!cancelled) {
          setAdvice(null);
          setError(
            err.message ||
              "Unable to load precautionary measures."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadAdvice();

    return () => {
      cancelled = true;
    };
  }, [talukId]);

  // ==========================================================
  // BUILD CARDS FROM BACKEND ADVICE
  // ==========================================================

  const icons = [
    {
      icon: <Droplets size={30} />,
      iconBg: "#FEECEC",
      iconColor: "#EF4444",
    },
    {
      icon: <Shield size={30} />,
      iconBg: "#ECFDF3",
      iconColor: "#16A34A",
    },
    {
      icon: <GlassWater size={30} />,
      iconBg: "#EFF6FF",
      iconColor: "#2563EB",
    },
    {
      icon: <Stethoscope size={30} />,
      iconBg: "#FFF7ED",
      iconColor: "#F97316",
    },
    {
      icon: <HandPlatter size={30} />,
      iconBg: "#F5F3FF",
      iconColor: "#7C3AED",
    },
    {
      icon: <TriangleAlert size={30} />,
      iconBg: "#FEF3C7",
      iconColor: "#D97706",
    },
  ];

  const defaultTitles = [
    "Avoid Stagnant Water",
    "Protect Yourself",
    "Drink Clean Water",
    "Seek Early Treatment",
    "Maintain Hygiene",
    "Report Symptoms",
  ];

  const precautions =
    advice?.tips?.map((tip, index) => ({
      ...icons[index % icons.length],

      title:
        defaultTitles[index] ||
        "Health Precaution",

      description: tip,
    })) || [];

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <section className="space-y-6">
        <div>
          <h2 className="text-[42px] font-bold text-[#13264B]">
            Precautionary Measures
          </h2>

          <p className="mt-2 text-[17px] leading-8 text-gray-500">
            Loading recommendations for{" "}
            <strong>
              {talukName}
            </strong>
            {districtName
              ? `, ${districtName}`
              : ""}
            ...
          </p>
        </div>

        <div
          className="
            rounded-3xl
            border
            border-[#E7E2D8]
            bg-white
            p-10
            text-center
            shadow-sm
          "
        >
          <div
            className="
              mx-auto
              h-9
              w-9
              animate-spin
              rounded-full
              border-4
              border-[#E8E2D8]
              border-t-[#0B7A33]
            "
          />

          <p className="mt-4 text-gray-500">
            Loading location-specific health advice...
          </p>
        </div>
      </section>
    );
  }

  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {
    return (
      <section className="space-y-6">
        <div>
          <h2 className="text-[42px] font-bold text-[#13264B]">
            Precautionary Measures
          </h2>

          <p className="mt-2 text-[17px] leading-8 text-gray-500">
            Recommendations for{" "}
            <strong>
              {talukName}
            </strong>
            {districtName
              ? `, ${districtName}`
              : ""}
            .
          </p>
        </div>

        <div
          className="
            rounded-3xl
            border
            border-red-200
            bg-red-50
            px-6
            py-5
            text-red-700
          "
        >
          {error}
        </div>
      </section>
    );
  }

  // ==========================================================
  // NO DATA
  // ==========================================================

  if (!precautions.length) {
    return (
      <section className="space-y-6">
        <div>
          <h2 className="text-[42px] font-bold text-[#13264B]">
            Precautionary Measures
          </h2>

          <p className="mt-2 text-[17px] leading-8 text-gray-500">
            General health recommendations for{" "}
            <strong>
              {talukName}
            </strong>
            {districtName
              ? `, ${districtName}`
              : ""}
            .
          </p>
        </div>

        <div
          className="
            rounded-3xl
            border
            border-[#E7E2D8]
            bg-white
            p-8
            shadow-sm
          "
        >
          <div className="flex items-start gap-4">
            <div
              className="
                flex
                h-12
                w-12
                shrink-0
                items-center
                justify-center
                rounded-2xl
                bg-[#ECFDF3]
                text-[#16A34A]
              "
            >
              <Shield size={25} />
            </div>

            <div>
              <h3 className="text-xl font-bold text-[#13264B]">
                General Health Precautions
              </h3>

              <p className="mt-2 leading-7 text-gray-500">
                No recent disease-specific recommendations
                are available for{" "}
                <strong>
                  {talukName}
                </strong>
                {districtName
                  ? `, ${districtName}`
                  : ""}
                . Continue maintaining good hygiene,
                drinking safe water, and avoiding
                mosquito breeding areas.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ==========================================================
  // NORMAL DISPLAY
  // ==========================================================

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-[42px] font-bold text-[#13264B]">
          Precautionary Measures
        </h2>

        <p className="mt-2 text-[17px] leading-8 text-gray-500">
          Recommendations based on the latest surveillance
          information from{" "}
          <strong>
            {talukName}
          </strong>
          {districtName
            ? `, ${districtName}`
            : ""}.
        </p>

        {advice?.top_disease && (
          <p className="mt-2 text-[14px] font-medium text-[#0B7A33]">
            Current priority:{" "}
            {advice.top_disease}
          </p>
        )}
      </div>

      <div
        className="
          grid
          grid-cols-1
          gap-8
          md:grid-cols-2
          xl:grid-cols-3
        "
      >
        {precautions.map((item, index) => (
          <PrecautionaryCard
            key={`${item.title}-${index}`}
            {...item}
          />
        ))}
      </div>
    </section>
  );
}