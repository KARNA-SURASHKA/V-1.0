import {
  Bell,
  CalendarDays,
  ChevronDown,
  Info,
  MapPin,
} from "lucide-react";

import PrecautionaryCard from "./PrecautionaryCard";
import {
  getPrecautionData,
  getPrecautionTheme,
} from "../../../data/precautionData";

import {
  getPrecautionDiseaseVisuals,
} from "../../../data/precautionVisuals";

import skyline from "../../../assets/health/precautions/skyline.png";

function getDiseaseFromDashboard(dashboardData) {
  return (
    dashboardData?.dominant_disease ||
    dashboardData?.top_disease ||
    dashboardData?.cards?.[0]?.disease ||
    null
  );
}

function getDiseaseRisk(dashboardData, disease) {
  if (!disease) return dashboardData?.overall_risk || "Low";

  const target = String(disease).trim().toLowerCase();

  const matchingCard = dashboardData?.cards?.find(
    (card) =>
      String(card.disease || "").trim().toLowerCase() === target
  );

  return matchingCard?.risk_level || dashboardData?.overall_risk || "Low";
}

function getFallbackData(disease) {
  const name = disease || "Current health concern";
  const visuals = getPrecautionDiseaseVisuals(name);

  return {
    name,
    key: "fallback",
    theme: "blue",
    subtitle: "Follow these simple steps to protect yourself and your community.",
    intro:
      "Follow verified local health guidance and the precautions provided by your health authority for this disease.",
    warning:
      "If symptoms are severe, persistent, or worsening, seek medical attention promptly.",
    warningSub:
      "Use the Medical Assistant or local health services for verified guidance.",
    visuals,
    precautions: [
      {
        type: "hand_hygiene",
        title: "Maintain Good Hygiene",
        description:
          "Wash your hands regularly and avoid touching your face with unwashed hands.",
        benefit: "Reduces exposure to germs",
      },
      {
        type: "stay_home",
        title: "Stay Home If Unwell",
        description:
          "Rest at home and avoid close contact with others when you are sick.",
        benefit: "Protects others",
      },
      {
        type: "doctor",
        title: "Seek Medical Advice",
        description:
          "Contact a qualified healthcare professional if symptoms are concerning or worsening.",
        benefit: "Supports early care",
      },
    ],
  };
}

function formatLocation(talukName, districtName) {
  const values = [talukName, districtName].filter(Boolean);
  return values.length ? values.join(", ") : "Bengaluru, Karnataka";
}

function UserAvatar({ username }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-[#F2E8DC] text-[#8B7259]">
        <div className="relative h-[28px] w-[28px]">
          <span className="absolute left-[9px] top-0 h-[10px] w-[10px] rounded-full bg-[#9B8066]" />
          <span className="absolute bottom-0 left-[3px] h-[15px] w-[22px] rounded-t-full bg-[#9B8066]" />
        </div>
      </div>

      <div className="leading-none">
        <p className="text-[14px] font-semibold text-[#151A1E]">
          {username || "Monish"}
        </p>
        <p className="mt-[6px] text-[11px] font-medium text-[#30373D]">
          User
        </p>
      </div>

      <ChevronDown size={17} className="ml-3 text-[#111315]" />
    </div>
  );
}

function TopControl({ children, className = "" }) {
  return (
    <div
      className={`flex h-[45px] items-center rounded-[10px] border border-[#E6E3DE] bg-white px-4 ${className}`}
    >
      {children}
    </div>
  );
}

export default function PrecautionarySection({
  talukName,
  districtName,
  dashboardData,
  loading = false,
  error = "",
  username,
}) {
  if (loading) {
    return (
      <section className="min-h-screen bg-white px-8 py-12">
        <div className="mx-auto max-w-[1228px] rounded-[12px] border border-[#E5E5E5] bg-white p-12 text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-[#E8E8E8] border-t-[#16803C]" />
          <p className="mt-4 text-[14px] text-[#667085]">
            Loading the latest precautionary measures...
          </p>
        </div>
      </section>
    );
  }

  if (error && !dashboardData) {
    return (
      <section className="min-h-screen bg-white px-8 py-12">
        <div className="rounded-[12px] border border-red-200 bg-red-50 px-5 py-4 text-[14px] text-red-700">
          {error}
        </div>
      </section>
    );
  }

  const disease = getDiseaseFromDashboard(dashboardData);
  const data = getPrecautionData(disease) || getFallbackData(disease);
  const theme = getPrecautionTheme(data.name, data.theme);
  const risk = getDiseaseRisk(dashboardData, disease);
  const riskLabel = String(risk || "Low").toUpperCase();
  const locationLabel = formatLocation(talukName, districtName);
  const cardGrid =
    data.precautions.length >= 8
      ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
      : "grid-cols-1 md:grid-cols-2 xl:grid-cols-3";

  const visuals = data.visuals || getPrecautionDiseaseVisuals(data.name);

  return (
    <section className="min-h-screen overflow-x-hidden bg-white text-[#111315]">
      {/* =========================================================
          REFERENCE-MATCHED TOP AREA
      ========================================================= */}
      <header className="relative h-[178px] overflow-hidden bg-white">
        <div className="absolute left-[38px] top-[28px] z-20">
          <h1 className="text-[31px] font-bold leading-[1.05] tracking-[-0.025em] text-[#111827]">
            Precautionary Measures
          </h1>

          <p
            className="mt-[18px] text-[17px] font-semibold"
            style={{ color: theme.accentDark }}
          >
            Stay Safe, Stay Protected
          </p>

          <p className="mt-[10px] text-[14px] text-[#41474D]">
            {data.subtitle}
          </p>
        </div>

        <div className="absolute right-[29px] top-[24px] z-30 flex items-center gap-[16px]">
          <TopControl className="relative w-[51px] justify-center px-0">
            <Bell size={21} strokeWidth={1.8} />
            <span className="absolute -right-[2px] -top-[7px] flex h-[20px] min-w-[20px] items-center justify-center rounded-full bg-[#E31313] px-1 text-[10px] font-bold text-white">
              3
            </span>
          </TopControl>

          <TopControl className="w-[236px] gap-3">
            <MapPin size={20} strokeWidth={1.8} />
            <span className="flex-1 truncate text-[14px] font-medium text-[#20252A]">
              {locationLabel}
            </span>
            <ChevronDown size={17} />
          </TopControl>

          <TopControl className="w-[184px] gap-3">
            <CalendarDays size={20} strokeWidth={1.8} />
            <span className="flex-1 text-[14px] font-medium text-[#20252A]">
              28 July 2026
            </span>
            <ChevronDown size={17} />
          </TopControl>

          <UserAvatar username={username} />
        </div>

        <img
          src={skyline}
          alt=""
          aria-hidden="true"
          draggable="false"
          className="pointer-events-none absolute bottom-0 right-0 z-10 h-[108px] w-[795px] object-contain object-right opacity-[0.92]"
        />
      </header>

      {/* =========================================================
          HERO
      ========================================================= */}
      <div
        className="mx-[38px] grid h-[204px] items-center overflow-hidden rounded-[12px] border px-[28px]"
        style={{
          borderColor: theme.border,
          backgroundColor: theme.heroTint,
        }}
      >
        <div className="grid h-full min-w-0 grid-cols-[1fr_1.03fr] items-center">
          <div className="flex min-w-0 items-center gap-[28px]">
            <div
              className="flex h-[145px] w-[145px] shrink-0 items-center justify-center overflow-hidden rounded-full border"
              style={{
                borderColor: theme.accent,
                backgroundColor: theme.softStrong,
              }}
            >
              <img
                src={visuals.icon}
                alt=""
                draggable="false"
                className="h-[132px] w-[132px] object-contain mix-blend-multiply"
              />
            </div>

            <div className="min-w-0 max-w-[485px]">
              <span
                className="inline-flex rounded-[5px] px-[7px] py-[2px] text-[12px] font-bold leading-none"
                style={{
                  color: theme.accent,
                  backgroundColor: theme.softStrong,
                }}
              >
                {riskLabel} RISK
              </span>

              <h2
                className="mt-[14px] text-[34px] font-bold leading-none tracking-[-0.02em]"
                style={{ color: theme.accent }}
              >
                {data.name}
              </h2>

              <p className="mt-[14px] max-w-[455px] text-[15px] leading-[1.55] text-[#20262B]">
                {data.intro}
              </p>
            </div>
          </div>

          <div className="flex h-full items-center justify-end overflow-hidden">
            <img
              src={visuals.hero}
              alt={`${data.name} precaution illustration`}
              draggable="false"
              className="h-[204px] w-full max-w-[620px] object-contain object-right mix-blend-multiply"
            />
          </div>
        </div>
      </div>

      {/* =========================================================
          PRECAUTIONS GRID
      ========================================================= */}
      <div className="mx-[38px] pb-[23px] pt-[26px]">
        <h3
          className="text-[16px] font-semibold uppercase tracking-[0.025em]"
          style={{ color: theme.accent }}
        >
          Precautions for {data.name}
        </h3>

        <div className={`mt-[12px] grid ${cardGrid} gap-[14px]`}>
          {data.precautions.map((item, index) => (
            <PrecautionaryCard
              key={`${item.type}-${item.title}`}
              number={index + 1}
              disease={data.name}
              compact={data.precautions.length >= 8}
              theme={theme}
              {...item}
            />
          ))}
        </div>

        {/* =======================================================
            WARNING BAR
        ======================================================= */}
        <div
          className="mt-[17px] flex min-h-[72px] items-center justify-between gap-5 rounded-[11px] border px-[17px]"
          style={{
            borderColor: theme.border,
            backgroundColor: theme.soft,
          }}
        >
          <div className="flex min-w-0 items-center gap-[16px]">
            <div
              className="flex h-[31px] w-[31px] shrink-0 items-center justify-center rounded-full text-white"
              style={{ backgroundColor: theme.accent }}
            >
              <Info size={17} strokeWidth={2.2} />
            </div>

            <div className="min-w-0">
              {data.warningTitle ? (
                <p className="text-[14px] font-semibold leading-[1.25] text-[#161B20]">
                  {data.warningTitle}
                </p>
              ) : (
                <p className="text-[14px] font-semibold leading-[1.25] text-[#161B20]">
                  {data.warning}
                </p>
              )}

              <p className="mt-[4px] text-[13px] leading-[1.35] text-[#30373D]">
                {data.warningTitle ? data.warning : data.warningSub}
              </p>

              {data.warningTitle && data.warningSub ? (
                <p className="text-[12px] leading-[1.35] text-[#667085]">
                  {data.warningSub}
                </p>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            className="flex h-[40px] shrink-0 items-center gap-4 rounded-[7px] border bg-white px-[18px] text-[13px] font-semibold"
            style={{
              borderColor: theme.accent,
              color: theme.accent,
            }}
          >
            When to Seek Help
            <span className="text-[20px] leading-none">→</span>
          </button>
        </div>
      </div>
    </section>
  );
}
