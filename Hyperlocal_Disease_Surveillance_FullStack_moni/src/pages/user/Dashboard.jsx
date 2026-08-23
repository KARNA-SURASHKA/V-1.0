import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Bell,
  CalendarDays,
  ChevronDown,
  MapPin,
  ShieldCheck,
  TrendingUp,
  User,
  ArrowRight,
} from "lucide-react";

import {
  api,
} from "../../api";

import {
  getDiseaseVisual,
} from "../../data/diseaseVisuals";

import HeroBg
  from "../../assets/hero-bg.png";

import TodaysUpdate
  from "./dashboard/TodaysUpdate";

import RiskAroundYou
  from "./dashboard/RiskAroundYou";

import PreventiveMeasures
  from "./dashboard/PreventiveMeasures";

import QuickAccess
  from "./dashboard/QuickAccess";

import DashboardChatbot
  from "./dashboard/DashboardChatbot.jsx";


// ============================================================
// RISK COLORS
// ============================================================

const riskTone = {

  Low: {
    text: "#16803C",
    icon: "#E2F1E4",
  },

  Moderate: {
    text: "#D98200",
    icon: "#FFF0D7",
  },

  High: {
    text: "#F04444",
    icon: "#FFE1D9",
  },

  Critical: {
    text: "#C62828",
    icon: "#F6D4D4",
  },

};


// ============================================================
// NORMALIZE RISK
// ============================================================

function normalizeRisk(
  value
) {

  const text =
    String(
      value ||
        "Low"
    ).toLowerCase();


  if (
    text.includes(
      "critical"
    )
  ) {
    return "Critical";
  }


  if (
    text.includes(
      "high"
    )
  ) {
    return "High";
  }


  if (
    text.includes(
      "moderate"
    )
  ) {
    return "Moderate";
  }


  return "Low";

}


// ============================================================
// LOCATION LABEL
// ============================================================

function locationLabel(
  location
) {

  if (!location) {
    return "Selected location";
  }


  if (
    location.talukName &&
    location.districtName
  ) {

    return `${
      location.talukName
    }, ${
      location.districtName
    }`;

  }


  return (
    location.talukName ||
    location.districtName ||
    location.stateName ||
    "Selected location"
  );

}


// ============================================================
// DASHBOARD
// ============================================================

export default function Dashboard({
  username,
  selectedLocation,
  dashboardData,
  loading,
  error,
  onNavigate,
  onExit,
}) {

  const [
    profileOpen,
    setProfileOpen,
  ] = useState(false);


  const [
    alerts,
    setAlerts,
  ] = useState([]);


  const talukId =
    selectedLocation?.talukId;


  // ==========================================================
  // LOAD NOTIFICATIONS
  // ==========================================================

  useEffect(() => {

    let cancelled =
      false;


    async function loadAlerts() {

      if (!talukId) {

        setAlerts([]);

        return;

      }


      try {

        const data =
          await api.getNotifications(
            Number(talukId)
          );


        if (!cancelled) {

          setAlerts(
            Array.isArray(
              data
            )
              ? data
              : []
          );

        }

      } catch {

        if (!cancelled) {

          setAlerts([]);

        }

      }

    }


    loadAlerts();


    return () => {

      cancelled = true;

    };

  }, [
    talukId,
  ]);


  // ==========================================================
  // DOMINANT DISEASE
  // ==========================================================

  const latestDisease =
    dashboardData?.top_disease ||
    dashboardData?.dominant_disease ||
    dashboardData?.cards?.[0]?.disease ||
    null;


  // ==========================================================
  // DISEASE CARD
  // ==========================================================

  const diseaseCard =
    useMemo(
      () => {

        const cards =
          Array.isArray(
            dashboardData?.cards
          )
            ? dashboardData.cards
            : [];


        return cards.find(
          (
            item
          ) =>
            String(
              item?.disease ||
                ""
            ).toLowerCase() ===
            String(
              latestDisease ||
                ""
            ).toLowerCase()
        );

      },
      [
        dashboardData,
        latestDisease,
      ]
    );


  // ==========================================================
  // DISEASE CATEGORY
  // ==========================================================

  const diseaseCategory =
    diseaseCard?.category ||
    dashboardData?.top_disease_category ||
    dashboardData?.category ||
    null;


  // ==========================================================
  // DISEASE VISUAL
  // ==========================================================

  const visual =
    getDiseaseVisual(
      latestDisease,
      diseaseCategory
    );


  // ==========================================================
  // TOTAL CASES
  // ==========================================================

  const totalCases =
    dashboardData?.active_cases ??
    dashboardData?.total_cases ??
    dashboardData?.totalCases ??
    dashboardData?.cases ??
    (
      dashboardData?.cards ||
      []
    ).reduce(
      (
        sum,
        item
      ) =>
        sum +
        Number(
          item?.cases ||
            0
        ),
      0
    );


  // ==========================================================
  // RISK
  // ==========================================================

  const risk =
    normalizeRisk(
      dashboardData?.overall_risk ||
      dashboardData?.risk_level ||
      dashboardData?.risk
    );


  const tone =
    riskTone[risk];


  // ==========================================================
  // WEEKLY CHANGE
  // ==========================================================

  const weeklyChange =
    useMemo(
      () => {

        if (
          dashboardData?.trend_percentage !==
            undefined &&
          dashboardData?.trend_percentage !==
            null
        ) {

          const value =
            Number(
              String(
                dashboardData
                  .trend_percentage
              ).replace(
                "%",
                ""
              )
            );


          return Number.isFinite(
            value
          )
            ? value
            : null;

        }


        const trend =
          Array.isArray(
            dashboardData?.trend
          )
            ? dashboardData.trend
            : [];


        if (
          trend.length <
          2
        ) {
          return null;
        }


        const previous =
          Number(
            trend[
              trend.length - 2
            ]?.total_cases ??
            trend[
              trend.length - 2
            ]?.totalCases ??
            trend[
              trend.length - 2
            ]?.cases ??
            0
          );


        const current =
          Number(
            trend[
              trend.length - 1
            ]?.total_cases ??
            trend[
              trend.length - 1
            ]?.totalCases ??
            trend[
              trend.length - 1
            ]?.cases ??
            0
          );


        if (!previous) {

          return current
            ? 100
            : 0;

        }


        return Math.round(
          (
            (
              current -
              previous
            ) /
            previous
          ) *
            100
        );

      },
      [
        dashboardData,
      ]
    );


  // ==========================================================
  // DATE
  // ==========================================================

  const today =
    new Date().toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );


  // ==========================================================
  // LAST UPDATED
  // ==========================================================

  const lastUpdated =
    dashboardData?.last_updated_at
      ? new Date(
          dashboardData.last_updated_at
        ).toLocaleTimeString(
          "en-IN",
          {
            hour:
              "2-digit",
            minute:
              "2-digit",
            hour12:
              true,
          }
        )
      : null;


  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {

    return (

      <div
        className="
          min-h-screen
          bg-[#F5F1E9]
          p-8
        "
      >

        <div
          className="
            flex
            min-h-[600px]
            items-center
            justify-center
            rounded-[14px]
            border
            border-[#E8E1D7]
            bg-white
          "
        >

          <div
            className="
              text-center
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
                border-[#E7E0D5]
                border-t-[#2E9649]
              "
            />

            <p
              className="
                mt-4
                text-[13px]
                text-[#737A80]
              "
            >
              Loading surveillance data...
            </p>

          </div>

        </div>

      </div>

    );

  }


  // ==========================================================
  // ERROR
  // ==========================================================

  if (error) {

    return (

      <div
        className="
          min-h-screen
          bg-[#F5F1E9]
          p-8
        "
      >

        <div
          className="
            rounded-[14px]
            border
            border-red-200
            bg-red-50
            px-6
            py-5
            text-[13px]
            text-red-700
          "
        >
          {error}
        </div>

      </div>

    );

  }


  // ==========================================================
  // MAIN
  // ==========================================================

  return (

    <div
      className="
        min-h-screen
        bg-[#F5F1E9]
        text-[#17191C]
      "
    >

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header
        className="
          relative
          h-[178px]
          overflow-hidden
          border-b
          border-[#E8E1D7]
          bg-[#F8F5EF]
        "
      >

        <img
          src={
            HeroBg
          }
          alt=""
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            bottom-[-38px]
            right-[-10px]
            h-[235px]
            w-[920px]
            max-w-[67vw]
            object-cover
            object-center
            opacity-[0.72]
          "
        />


        <div
          className="
            relative
            z-10
            flex
            h-full
            items-start
            justify-between
            px-8
            pt-7
            xl:px-9
          "
        >

          {/* GREETING */}

          <div>

            <div
              className="
                flex
                items-center
                gap-2
              "
            >

              <h1
                className="
                  text-[26px]
                  font-semibold
                  leading-none
                  tracking-[-0.035em]
                  text-[#111315]
                "
              >
                Good Afternoon,
                {" "}
                {username}
              </h1>

              <span
                className="
                  text-[22px]
                "
              >
                👋
              </span>

            </div>


            <div
              className="
                mt-3
                flex
                items-center
                gap-2
              "
            >

              <span
                className="
                  text-[12px]
                  text-[#20252A]
                "
              >
                Monitoring disease
                situation for
              </span>


              <span
                className="
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-full
                  bg-[#E9F5EA]
                  px-3
                  py-[7px]
                  text-[12px]
                  font-medium
                  text-[#16803C]
                "
              >

                <MapPin
                  size={13}
                />

                {
                  locationLabel(
                    selectedLocation
                  )
                }

              </span>

            </div>


            <div
              className="
                mt-2.5
                flex
                items-center
                gap-1.5
                text-[10px]
                text-[#687078]
              "
            >

              <span
                className="
                  text-[13px]
                "
              >
                ◷
              </span>

              <span>

                Last Updated:
                {" "}

                {
                  lastUpdated
                    ? `Today • ${lastUpdated}`
                    : "Live surveillance"
                }

              </span>

            </div>

          </div>


          {/* HEADER CONTROLS */}

          <div
            className="
              flex
              items-start
              gap-3
            "
          >

            {/* NOTIFICATIONS */}

            <button
              type="button"
              onClick={() =>
                onNavigate?.(
                  "notifications"
                )
              }
              className="
                relative
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-[10px]
                border
                border-[#E4DED4]
                bg-white
              "
              aria-label="Notifications"
            >

              <Bell
                size={19}
                strokeWidth={1.8}
              />


              <span
                className="
                  absolute
                  -right-1
                  -top-1
                  flex
                  h-5
                  min-w-5
                  items-center
                  justify-center
                  rounded-full
                  bg-[#E3262E]
                  px-1
                  text-[10px]
                  font-semibold
                  text-white
                "
              >
                {
                  Math.min(
                    Math.max(
                      alerts.length,
                      1
                    ),
                    9
                  )
                }
              </span>

            </button>


            {/* LOCATION */}

            <button
              type="button"
              className="
                hidden
                h-11
                items-center
                gap-2
                rounded-[10px]
                border
                border-[#E4DED4]
                bg-white
                px-3.5
                md:flex
              "
            >

              <MapPin
                size={17}
                strokeWidth={1.8}
              />

              <span
                className="
                  max-w-[175px]
                  truncate
                  text-[12px]
                  font-medium
                "
              >
                {
                  locationLabel(
                    selectedLocation
                  )
                }
              </span>

              <ChevronDown
                size={15}
              />

            </button>


            {/* DATE */}

            <div
              className="
                hidden
                h-11
                items-center
                gap-2
                rounded-[10px]
                border
                border-[#E4DED4]
                bg-white
                px-3.5
                lg:flex
              "
            >

              <CalendarDays
                size={17}
                strokeWidth={1.8}
              />

              <span
                className="
                  whitespace-nowrap
                  text-[12px]
                  font-medium
                "
              >
                {today}
              </span>

              <ChevronDown
                size={15}
              />

            </div>


            {/* PROFILE */}

            <div
              className="
                relative
              "
            >

              <button
                type="button"
                onClick={() =>
                  setProfileOpen(
                    (value) =>
                      !value
                  )
                }
                className="
                  flex
                  items-center
                  gap-2
                  rounded-[10px]
                  px-1
                  py-1
                  hover:bg-white/70
                "
              >

                <span
                  className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-full
                    bg-[#EFE5D7]
                    text-[#8B7258]
                  "
                >

                  <User
                    size={18}
                  />

                </span>


                <span
                  className="
                    hidden
                    text-left
                    sm:block
                  "
                >

                  <span
                    className="
                      block
                      text-[12px]
                      font-semibold
                    "
                  >
                    {username}
                  </span>

                  <span
                    className="
                      block
                      text-[10px]
                      text-[#626970]
                    "
                  >
                    User
                  </span>

                </span>


                <ChevronDown
                  size={15}
                />

              </button>


              {profileOpen && (

                <div
                  className="
                    absolute
                    right-0
                    top-[48px]
                    z-50
                    w-48
                    rounded-xl
                    border
                    border-[#E5DED3]
                    bg-white
                    p-2
                    shadow-xl
                  "
                >

                  <div
                    className="
                      px-3
                      py-2
                    "
                  >

                    <p
                      className="
                        text-[12px]
                        font-semibold
                      "
                    >
                      {username}
                    </p>

                    <p
                      className="
                        text-[10px]
                        text-[#737A80]
                      "
                    >
                      User
                    </p>

                  </div>


                  <button
                    type="button"
                    onClick={
                      onExit
                    }
                    className="
                      w-full
                      rounded-lg
                      px-3
                      py-2
                      text-left
                      text-[12px]
                      text-[#C62828]
                      hover:bg-red-50
                    "
                  >
                    Logout
                  </button>

                </div>

              )}

            </div>

          </div>

        </div>

      </header>


      {/* ======================================================
          MAIN DASHBOARD
      ====================================================== */}

      <main
        className="
          px-7
          py-5
          xl:px-8
        "
      >

        <div
          className="
            mx-auto
            max-w-[1515px]
          "
        >

          {/* ==================================================
              CURRENT HEALTH SITUATION
          ================================================== */}

          <section
            className="
              rounded-[14px]
              border
              border-[#E6DFD4]
              bg-white
              px-6
              py-5
              shadow-[0_1px_4px_rgba(44,35,24,0.035)]
            "
          >

            <p
              className="
                text-[11px]
                font-semibold
                uppercase
                tracking-[0.17em]
                text-[#58493F]
              "
            >
              CURRENT HEALTH SITUATION
            </p>


            <div
              className="
                mt-4
                grid
                grid-cols-1
                md:grid-cols-2
                xl:grid-cols-[1.32fr_0.88fr_1fr_0.88fr]
              "
            >

              {/* RISK */}

              <div
                className="
                  flex
                  items-center
                  gap-4
                  border-b
                  border-[#EEE9E1]
                  py-2
                  xl:border-b-0
                  xl:border-r
                  xl:pr-7
                "
              >

                <div
                  className="
                    flex
                    h-[76px]
                    w-[76px]
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                  "
                  style={{
                    backgroundColor:
                      tone.icon,
                  }}
                >

                  <ShieldCheck
                    size={38}
                    strokeWidth={1.8}
                    style={{
                      color:
                        tone.text,
                    }}
                  />

                </div>


                <div>

                  <p
                    className="
                      text-[24px]
                      font-semibold
                      leading-none
                    "
                    style={{
                      color:
                        tone.text,
                    }}
                  >
                    {risk} Risk
                  </p>


                  <p
                    className="
                      mt-2
                      max-w-[250px]
                      text-[11px]
                      leading-5
                      text-[#353B40]
                    "
                  >
                    Disease activity is{" "}
                    {
                      risk ===
                      "Low"
                        ? "low"
                        : "elevated"
                    }{" "}
                    in your monitored
                    area. Stay cautious.
                  </p>

                </div>

              </div>


              {/* ACTIVE CASES */}

              <div
                className="
                  border-b
                  border-[#EEE9E1]
                  py-4
                  md:pl-7
                  xl:border-b-0
                  xl:border-r
                  xl:py-2
                "
              >

                <p
                  className="
                    text-[27px]
                    font-medium
                    leading-none
                  "
                >
                  {
                    Number(
                      totalCases ||
                        0
                    ).toLocaleString(
                      "en-IN"
                    )
                  }
                </p>


                <p
                  className="
                    mt-2
                    text-[12px]
                    font-medium
                  "
                >
                  Active Cases
                </p>


                <p
                  className="
                    mt-1
                    text-[10px]
                    text-[#626970]
                  "
                >
                  Total Reported
                </p>


                <p
                  className={`
                    mt-3
                    text-[10px]
                    font-medium
                    ${
                      weeklyChange >
                      0
                        ? "text-[#F04444]"
                        : weeklyChange <
                            0
                          ? "text-[#16803C]"
                          : "text-[#737A80]"
                    }
                  `}
                >

                  {
                    weeklyChange ===
                    null

                      ? "No trend data"

                      : `${
                          weeklyChange >=
                          0
                            ? "↗"
                            : "↘"
                        } ${
                          Math.abs(
                            weeklyChange
                          )
                        }% from last week`
                  }

                </p>

              </div>


              {/* DISEASE */}

              <div
                className="
                  border-b
                  border-[#EEE9E1]
                  py-4
                  md:pl-7
                  xl:border-b-0
                  xl:border-r
                  xl:py-2
                "
              >

                <div
                  className="
                    flex
                    items-center
                    gap-4
                  "
                >

                  <div
                    className="
                      flex
                      h-[68px]
                      w-[68px]
                      shrink-0
                      items-center
                      justify-center
                      overflow-hidden
                      rounded-full
                      bg-[#EFF7F0]
                    "
                  >

                    <img
                      src={
                        visual.diseaseImage
                      }
                      alt=""
                      className="
                        h-[55px]
                        w-[55px]
                        object-contain
                      "
                    />

                  </div>


                  <div>

                    <p
                      className="
                        text-[22px]
                        font-semibold
                        leading-none
                      "
                    >
                      {visual.name}
                    </p>


                    <p
                      className="
                        mt-2
                        text-[10px]
                        text-[#626970]
                      "
                    >
                      Dominant Disease
                    </p>


                    <p
                      className="
                        mt-2
                        text-[10px]
                        font-semibold
                        text-[#16803C]
                      "
                    >
                      {
                        diseaseCard
                          ? `${diseaseCard.cases} cases`
                          : "No cases"
                      }
                    </p>

                  </div>

                </div>

              </div>


              {/* TREND */}

              <div
                className="
                  py-4
                  md:pl-7
                  xl:py-2
                "
              >

                <div
                  className="
                    flex
                    items-center
                    gap-4
                  "
                >

                  <div
                    className="
                      flex
                      h-[68px]
                      w-[68px]
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      bg-[#EDF4FD]
                    "
                  >

                    <TrendingUp
                      size={29}
                      strokeWidth={1.8}
                      className="
                        text-[#1769D2]
                      "
                    />

                  </div>


                  <div>

                    <p
                      className="
                        text-[24px]
                        font-semibold
                        leading-none
                      "
                    >
                      {
                        weeklyChange ===
                        null
                          ? "—"
                          : `${
                              weeklyChange >=
                              0
                                ? "+"
                                : ""
                            }${
                              weeklyChange
                            }%`
                      }
                    </p>


                    <p
                      className="
                        mt-2
                        text-[10px]
                        text-[#626970]
                      "
                    >
                      Weekly Trend
                    </p>


                    <p
                      className="
                        mt-1
                        text-[10px]
                        text-[#626970]
                      "
                    >
                      vs Last Week
                    </p>


                    <span
                      className="
                        mt-2
                        inline-flex
                        rounded-[6px]
                        bg-[#EDF4FD]
                        px-3
                        py-1
                        text-[9px]
                        font-medium
                        text-[#1769D2]
                      "
                    >
                      {
                        weeklyChange >
                        0
                          ? "Increasing"
                          : weeklyChange <
                              0
                            ? "Decreasing"
                            : "Stable"
                      }
                    </span>

                  </div>

                </div>

              </div>

            </div>

          </section>


          {/* ==================================================
              MAIN THREE COLUMN ROW

              IMPORTANT FIX:
              - Fixed desktop row height
              - min-h-0 prevents intrinsic content from
                forcing the grid row to grow
              - overflow-hidden keeps children inside
          ================================================== */}

          <section
            className="
              mt-4
              grid
              min-h-0
              grid-cols-1
              gap-4
              xl:h-[520px]
              xl:min-h-[520px]
              xl:max-h-[520px]
              xl:grid-cols-[1.04fr_1.08fr_1fr]
              xl:grid-rows-[520px]
            "
          >

            {/* =================================================
                WEEK'S UPDATE
            ================================================= */}

            <div
              className="
                min-h-0
                h-full
                overflow-hidden
              "
            >

              <TodaysUpdate

                disease={
                  latestDisease
                }

                category={
                  diseaseCategory
                }

                location={
                  selectedLocation?.talukName ||
                  selectedLocation?.districtName
                }

                trend={
                  weeklyChange >
                  0
                    ? "increasing"
                    : weeklyChange <
                        0
                      ? "decreasing"
                      : "stable"
                }

                percentageChange={
                  weeklyChange
                }

                onViewDetails={() =>
                  onNavigate?.(
                    "analytics"
                  )
                }

              />

            </div>


            {/* =================================================
                RISK AROUND YOU
            ================================================= */}

            <div
              className="
                min-h-0
                h-full
                overflow-hidden
              "
            >

              <RiskAroundYou

                taluk={
                  selectedLocation
                }

                risk={
                  risk
                }

                onViewMap={() =>
                  onNavigate?.(
                    "risk-map"
                  )
                }

              />

            </div>


            {/* =================================================
                AI HEALTH ASSISTANT

                THIS CARD NOW HAS A REAL HEIGHT CONSTRAINT.
                A LONG RESPONSE MUST SCROLL INSIDE IT.
            ================================================= */}

            <section
              className="
                min-h-0
                h-full
                max-h-full
                overflow-hidden
                rounded-[14px]
                border
                border-[#E6DFD4]
                bg-white
                shadow-[0_1px_4px_rgba(44,35,24,0.035)]
              "
            >

              <DashboardChatbot

                selectedLocation={
                  selectedLocation
                }

                username={
                  username
                }

                disease={
                  visual.name
                }

              />

            </section>

          </section>


          {/* ==================================================
              PRECAUTION + QUICK ACCESS
          ================================================== */}

          <section
            className="
              mt-4
              grid
              grid-cols-1
              gap-4
              xl:grid-cols-[2.12fr_1fr]
            "
          >

            <PreventiveMeasures

              disease={
                latestDisease
              }

              category={
                diseaseCategory
              }

              onMorePrecautions={() =>
                onNavigate?.(
                  "precautions"
                )
              }

            />


            <QuickAccess
              onNavigate={
                onNavigate
              }
            />

          </section>


          {/* ==================================================
              FOOTER SAFETY BAR
          ================================================== */}

          <div
            className="
              mt-4
              flex
              min-h-[39px]
              items-center
              gap-3
              rounded-[9px]
              border
              border-[#E6DFD4]
              bg-white
              px-4
              text-[10px]
              text-[#4E565C]
            "
          >

            <span
              className="
                flex
                h-5
                w-5
                items-center
                justify-center
                rounded-full
                border
                border-[#7A8084]
                text-[11px]
              "
            >
              i
            </span>


            <span>
              Stay safe, stay informed.
              Follow precautions and
              protect yourself and your
              loved ones.
            </span>


            <button
              type="button"
              onClick={() =>
                onNavigate?.(
                  "precautions"
                )
              }
              className="
                ml-auto
                inline-flex
                items-center
                gap-1
                font-medium
                text-[#16803C]
                hover:underline
              "
            >

              More

              <ArrowRight
                size={13}
              />

            </button>

          </div>

        </div>

      </main>

    </div>

  );

}