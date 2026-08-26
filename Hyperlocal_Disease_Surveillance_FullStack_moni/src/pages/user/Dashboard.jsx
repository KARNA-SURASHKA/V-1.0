import { useEffect, useMemo, useState } from "react";

import {
  ArrowRight,
  Bell,
  CalendarDays,
  ChevronDown,
  MapPin,
  ShieldCheck,
  TrendingUp,
  User,
} from "lucide-react";

import { api } from "../../api";
import { getDiseaseVisual } from "../../data/diseaseVisuals";
import HeroBg from "../../assets/hero-bg.png";

import TodaysUpdate from "./dashboard/TodaysUpdate";
import RiskAroundYou from "./dashboard/RiskAroundYou";
import PreventiveMeasures from "./dashboard/PreventiveMeasures";
import QuickAccess from "./dashboard/QuickAccess";
import DashboardChatbot from "./dashboard/DashboardChatbot.jsx";

const RISK_ORDER = {
  Low: 0,
  Moderate: 1,
  High: 2,
  Critical: 3,
};

const RISK_TONE = {
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

function normalizeRisk(value) {
  const text = String(value || "Low").toLowerCase();

  if (text.includes("critical")) return "Critical";
  if (text.includes("high")) return "High";
  if (text.includes("moderate")) return "Moderate";

  return "Low";
}

function locationLabel(location) {
  if (!location) {
    return "Selected location";
  }

  if (location.talukName && location.districtName) {
    return `${location.talukName}, ${location.districtName}`;
  }

  return (
    location.talukName ||
    location.districtName ||
    location.stateName ||
    "Selected location"
  );
}

function calculateWeeklyChange(data) {
  if (
    data?.trend_percentage !== undefined &&
    data?.trend_percentage !== null
  ) {
    const value = Number(
      String(data.trend_percentage).replace("%", "")
    );

    return Number.isFinite(value) ? value : null;
  }

  const trend = Array.isArray(data?.trend)
    ? data.trend
    : [];

  if (trend.length < 2) {
    return null;
  }

  const previous = Number(
    trend[trend.length - 2]?.total_cases ??
      trend[trend.length - 2]?.totalCases ??
      trend[trend.length - 2]?.cases ??
      0
  );

  const current = Number(
    trend[trend.length - 1]?.total_cases ??
      trend[trend.length - 1]?.totalCases ??
      trend[trend.length - 1]?.cases ??
      0
  );

  if (!previous) {
    return current ? 100 : 0;
  }

  return Math.round(
    ((current - previous) / previous) * 100
  );
}

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

  /*
   * ==========================================================
   * LOAD NOTIFICATIONS
   * ==========================================================
   */

  useEffect(() => {
    let cancelled = false;

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
            Array.isArray(data)
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
  }, [talukId]);

  /*
   * ==========================================================
   * DISEASE CARDS
   * ==========================================================
   */

  const cards = useMemo(
    () =>
      Array.isArray(
        dashboardData?.cards
      )
        ? dashboardData.cards
        : [],
    [dashboardData]
  );

  /*
   * ==========================================================
   * LOCALITY RISK DISEASE
   *
   * IMPORTANT:
   *
   * There is NO hardcoded Dengue here.
   *
   * The disease displayed by the dashboard is selected from
   * the disease cards returned for the currently selected
   * Taluk.
   *
   * Priority:
   *
   * Critical
   * High
   * Moderate
   * Low
   *
   * If two diseases have the same risk level, the disease
   * having more cases wins.
   * ==========================================================
   */

  const riskDiseaseCard =
    useMemo(() => {
      if (!cards.length) {
        return null;
      }

      return [...cards].sort(
        (a, b) => {
          const riskDifference =
            (
              RISK_ORDER[
                normalizeRisk(
                  b?.risk_level
                )
              ] ?? 0
            ) -
            (
              RISK_ORDER[
                normalizeRisk(
                  a?.risk_level
                )
              ] ?? 0
            );

          if (
            riskDifference !== 0
          ) {
            return riskDifference;
          }

          return (
            Number(
              b?.cases || 0
            ) -
            Number(
              a?.cases || 0
            )
          );
        }
      )[0];
    },
    [cards]
  );

  const riskDisease =
    riskDiseaseCard?.disease ||
    null;

  const diseaseCategory =
    riskDiseaseCard?.category ||
    dashboardData?.category ||
    null;

  const visual =
    getDiseaseVisual(
      riskDisease,
      diseaseCategory
    );

  /*
   * ==========================================================
   * TOTAL CASES
   * ==========================================================
   */

  const totalCases =
    dashboardData?.active_cases ??
    dashboardData?.total_cases ??
    dashboardData?.totalCases ??
    dashboardData?.cases ??
    cards.reduce(
      (sum, item) =>
        sum +
        Number(
          item?.cases || 0
        ),
      0
    );

  /*
   * ==========================================================
   * OVERALL LOCALITY RISK
   * ==========================================================
   */

  const risk =
    normalizeRisk(
      dashboardData?.overall_risk ||
        dashboardData?.risk_level ||
        dashboardData?.risk
    );

  const tone =
    RISK_TONE[risk];

  /*
   * ==========================================================
   * WEEKLY CHANGE
   * ==========================================================
   */

  const weeklyChange =
    useMemo(
      () =>
        calculateWeeklyChange(
          dashboardData
        ),
      [dashboardData]
    );

  /*
   * ==========================================================
   * DATE
   * ==========================================================
   */

  const today =
    new Date().toLocaleDateString(
      "en-IN",
      {
        day: "numeric",
        month: "long",
        year: "numeric",
      }
    );

  /*
   * ==========================================================
   * LAST UPDATED
   * ==========================================================
   */

  const lastUpdated =
    dashboardData?.last_updated_at
      ? new Date(
          dashboardData.last_updated_at
        ).toLocaleTimeString(
          "en-IN",
          {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }
        )
      : null;

  const trendLabel =
    weeklyChange > 0
      ? "Increasing"
      : weeklyChange < 0
        ? "Decreasing"
        : "Stable";

  /*
   * ==========================================================
   * LOADING
   * ==========================================================
   */

  if (loading) {
    return (
      <div className="
        min-h-screen
        bg-white
        px-8
        py-8
        lg:ml-[14px]
      ">
        <div className="
          flex
          min-h-[650px]
          items-center
          justify-center
          rounded-[14px]
          border
          border-[#E7E7E2]
          bg-white
        ">
          <div className="text-center">
            <div className="
              mx-auto
              h-9
              w-9
              animate-spin
              rounded-full
              border-4
              border-[#E8EEE9]
              border-t-[#2E9649]
            " />

            <p className="
              mt-4
              text-[13px]
              text-[#737A80]
            ">
              Loading surveillance data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /*
   * ==========================================================
   * ERROR
   * ==========================================================
   */

  if (error) {
    return (
      <div className="
        min-h-screen
        bg-white
        px-8
        py-8
        lg:ml-[14px]
      ">
        <div className="
          rounded-[14px]
          border
          border-red-200
          bg-red-50
          px-6
          py-5
          text-[13px]
          text-red-700
        ">
          {error}
        </div>
      </div>
    );
  }

  /*
   * ==========================================================
   * DASHBOARD
   * ==========================================================
   */

  return (
    <div className="
      ml-0
      min-h-screen
      bg-white
      text-[#17191C]
      lg:ml-[14px]
    ">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="
        relative
        h-[178px]
        overflow-hidden
        border-b
        border-[#ECEBE7]
        bg-white
      ">

        <img
          src={HeroBg}
          alt=""
          aria-hidden="true"
          draggable="false"
          className="
            pointer-events-none
            absolute
            bottom-[-35px]
            right-[-5px]
            h-[228px]
            w-[720px]
            object-cover
            object-center
            opacity-[0.62]
          "
        />

        <div className="
          relative
          z-10
          flex
          h-full
          items-start
          justify-between
          px-8
          pt-[30px]
          xl:px-9
        ">

          {/* =================================================
              GREETING
          ================================================= */}

          <div>

            <div className="
              flex
              items-center
              gap-2
            ">

              <h1 className="
                text-[27px]
                font-semibold
                leading-none
                tracking-[-0.035em]
                text-[#111315]
              ">
                Good Afternoon, {username}
              </h1>

              <span className="text-[22px]">
                👋
              </span>

            </div>


            <div className="
              mt-[18px]
              flex
              items-center
              gap-2
            ">

              <span className="
                text-[12px]
                text-[#20252A]
              ">
                Monitoring disease situation for
              </span>

              <span className="
                inline-flex
                items-center
                gap-1.5
                rounded-full
                bg-[#EAF5EC]
                px-3
                py-[7px]
                text-[12px]
                font-medium
                text-[#16803C]
              ">

                <MapPin size={13} />

                {
                  locationLabel(
                    selectedLocation
                  )
                }

              </span>

            </div>


            <div className="
              mt-[20px]
              flex
              items-center
              gap-1.5
              text-[11px]
              text-[#687078]
            ">

              <span className="
                text-[15px]
              ">
                ◷
              </span>

              <span>
                Last updated:{" "}
                {
                  lastUpdated
                    ? `Today • ${lastUpdated}`
                    : "Live surveillance"
                }
              </span>

            </div>

          </div>


          {/* =================================================
              HEADER CONTROLS
          ================================================= */}

          <div className="
            flex
            items-start
            gap-3
          ">

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
                h-[45px]
                w-[45px]
                items-center
                justify-center
                rounded-[11px]
                border
                border-[#E3E2DE]
                bg-white
              "
              aria-label="Notifications"
            >

              <Bell
                size={21}
                strokeWidth={1.8}
              />

              <span className="
                absolute
                -right-1
                -top-1
                flex
                h-6
                min-w-6
                items-center
                justify-center
                rounded-full
                bg-[#E3262E]
                px-1
                text-[10px]
                font-semibold
                text-white
              ">
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
                h-[45px]
                items-center
                gap-2
                rounded-[11px]
                border
                border-[#E3E2DE]
                bg-white
                px-4
                md:flex
              "
              aria-label="Selected location"
            >

              <MapPin
                size={19}
                strokeWidth={1.8}
              />

              <span className="
                max-w-[150px]
                truncate
                text-[12px]
                font-medium
              ">
                {
                  locationLabel(
                    selectedLocation
                  )
                }
              </span>

              <ChevronDown
                size={16}
              />

            </button>


            {/* DATE */}

            <div className="
              hidden
              h-[45px]
              items-center
              gap-2
              rounded-[11px]
              border
              border-[#E3E2DE]
              bg-white
              px-4
              lg:flex
            ">

              <CalendarDays
                size={19}
                strokeWidth={1.8}
              />

              <span className="
                whitespace-nowrap
                text-[12px]
                font-medium
              ">
                {today}
              </span>

              <ChevronDown
                size={16}
              />

            </div>


            {/* PROFILE */}

            <div className="relative">

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
                  h-[45px]
                  items-center
                  gap-2
                  rounded-[11px]
                  px-1.5
                  hover:bg-[#F7F8F6]
                "
                aria-label="User profile"
              >

                <span className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-full
                  bg-[#F0E8DC]
                  text-[#8B7258]
                ">
                  <User size={19} />
                </span>

                <span className="
                  hidden
                  text-left
                  sm:block
                ">

                  <span className="
                    block
                    text-[12px]
                    font-semibold
                  ">
                    {username}
                  </span>

                  <span className="
                    block
                    text-[10px]
                    text-[#626970]
                  ">
                    User
                  </span>

                </span>

                <ChevronDown
                  size={15}
                />

              </button>


              {profileOpen && (
                <div className="
                  absolute
                  right-0
                  top-[50px]
                  z-50
                  w-48
                  rounded-xl
                  border
                  border-[#E5DED3]
                  bg-white
                  p-2
                  shadow-xl
                ">

                  <div className="
                    px-3
                    py-2
                  ">

                    <p className="
                      text-[12px]
                      font-semibold
                    ">
                      {username}
                    </p>

                    <p className="
                      text-[10px]
                      text-[#737A80]
                    ">
                      User
                    </p>

                  </div>

                  <button
                    type="button"
                    onClick={onExit}
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


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="
        px-8
        py-[18px]
        xl:px-8
      ">

        <div className="
          mx-auto
          max-w-[1515px]
        ">

          {/* =================================================
              CURRENT HEALTH SITUATION
          ================================================= */}

          <section className="
            h-[181px]
            rounded-[14px]
            border
            border-[#E5E2DC]
            bg-white
            px-[22px]
            py-[16px]
            shadow-[0_1px_5px_rgba(44,35,24,0.035)]
          ">

            <p className="
              text-[11px]
              font-semibold
              uppercase
              tracking-[0.02em]
              text-[#263D57]
            ">
              CURRENT HEALTH SITUATION
            </p>


            <div className="
              mt-[11px]
              grid
              h-[125px]
              grid-cols-1
              md:grid-cols-2
              xl:grid-cols-[0.82fr_0.65fr_0.82fr_0.65fr]
            ">

              {/* =================================================
                  RISK
              ================================================= */}

              <div className="
                flex
                items-center
                gap-4
                border-b
                border-[#EEE9E1]
                py-2
                xl:border-b-0
                xl:border-r
                xl:pr-7
              ">

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

                  <p className="
                    mt-2
                    max-w-[250px]
                    text-[11px]
                    leading-5
                    text-[#353B40]
                  ">
                    Disease activity is{" "}
                    {
                      risk === "Low"
                        ? "low"
                        : "elevated"
                    }{" "}
                    in your monitored area.
                    <br />
                    Stay cautious.
                  </p>

                </div>

              </div>


              {/* =================================================
                  ACTIVE CASES
              ================================================= */}

              <div className="
                border-b
                border-[#EEE9E1]
                py-3
                md:pl-7
                xl:border-b-0
                xl:border-r
                xl:py-2
              ">

                <p className="
                  text-[28px]
                  font-medium
                  leading-none
                ">
                  {
                    Number(
                      totalCases || 0
                    ).toLocaleString(
                      "en-IN"
                    )
                  }
                </p>

                <p className="
                  mt-2
                  text-[12px]
                  font-semibold
                ">
                  Active Cases
                </p>

                <p className="
                  mt-1
                  text-[10px]
                  text-[#626970]
                ">
                  Total Reported
                </p>

                <p
                  className={`
                    mt-3
                    text-[10px]
                    font-medium
                    ${
                      weeklyChange > 0
                        ? "text-[#F04444]"
                        : weeklyChange < 0
                          ? "text-[#16803C]"
                          : "text-[#737A80]"
                    }
                  `}
                >

                  {
                    weeklyChange === null
                      ? "No trend data"
                      : `${
                          weeklyChange >= 0
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


              {/* =================================================
                  HIGHEST-RISK DISEASE
              ================================================= */}

              <div className="
                border-b
                border-[#EEE9E1]
                py-3
                md:pl-7
                xl:border-b-0
                xl:border-r
                xl:py-2
              ">

                <div className="
                  flex
                  items-center
                  gap-4
                ">

                  <div className="
                    flex
                    h-[68px]
                    w-[68px]
                    shrink-0
                    items-center
                    justify-center
                    overflow-hidden
                    rounded-[18px]
                    bg-[#EFF7F0]
                  ">

                    <img
                      src={
                        visual.diseaseImage
                      }
                      alt=""
                      draggable="false"
                      className="
                        h-[58px]
                        w-[58px]
                        object-contain
                      "
                    />

                  </div>


                  <div className="min-w-0">

                    <p className="
                      truncate
                      text-[22px]
                      font-semibold
                      leading-none
                    ">
                      {
                        riskDisease ||
                        "No active disease"
                      }
                    </p>

                    <p className="
                      mt-2
                      text-[10px]
                      text-[#626970]
                    ">
                      Highest Locality Risk
                    </p>

                    <p className="
                      mt-2
                      text-[10px]
                      font-semibold
                      text-[#16803C]
                    ">
                      {
                        riskDiseaseCard
                          ? `${riskDiseaseCard.cases} cases`
                          : "No cases"
                      }
                    </p>

                  </div>

                </div>

              </div>


              {/* =================================================
                  WEEKLY TREND
              ================================================= */}

              <div className="
                py-3
                md:pl-7
                xl:py-2
              ">

                <div className="
                  flex
                  items-center
                  gap-4
                ">

                  <div className="
                    flex
                    h-[68px]
                    w-[68px]
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-[#EDF4FD]
                  ">

                    <TrendingUp
                      size={29}
                      strokeWidth={1.8}
                      className="
                        text-[#1769D2]
                      "
                    />

                  </div>


                  <div>

                    <p className="
                      text-[24px]
                      font-semibold
                      leading-none
                    ">
                      {
                        weeklyChange === null
                          ? "—"
                          : `${
                              weeklyChange >= 0
                                ? "+"
                                : ""
                            }${
                              weeklyChange
                            }%`
                      }
                    </p>

                    <p className="
                      mt-2
                      text-[10px]
                      text-[#626970]
                    ">
                      Weekly Trend
                    </p>

                    <p className="
                      mt-1
                      text-[10px]
                      text-[#626970]
                    ">
                      vs Last Week
                    </p>

                    <span className="
                      mt-2
                      inline-flex
                      rounded-[6px]
                      bg-[#EDF4FD]
                      px-3
                      py-1
                      text-[9px]
                      font-medium
                      text-[#1769D2]
                    ">
                      {trendLabel}
                    </span>

                  </div>

                </div>

              </div>

            </div>

          </section>


          {/* =================================================
              THREE MAIN CARDS
          ================================================= */}

          <section className="
            mt-[14px]
            grid
            min-h-0
            grid-cols-1
            gap-[14px]
            xl:h-[312px]
            xl:grid-cols-[0.79fr_0.94fr_1fr]
            xl:grid-rows-[312px]
          ">

            {/* WEEK'S UPDATE */}

            <div className="
              min-h-0
              h-full
              overflow-hidden
            ">

              <TodaysUpdate
                disease={
                  riskDisease
                }
                category={
                  diseaseCategory
                }
                location={
                  selectedLocation?.talukName ||
                  selectedLocation?.districtName
                }
                trend={
                  weeklyChange > 0
                    ? "increasing"
                    : weeklyChange < 0
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


            {/* RISK AROUND YOU */}

            <div className="
              min-h-0
              h-full
              overflow-hidden
            ">

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


            {/* AI HEALTH ASSISTANT */}

            <section className="
              min-h-0
              h-full
              max-h-full
              overflow-hidden
              rounded-[14px]
              border
              border-[#E5E2DC]
              bg-white
              shadow-[0_1px_5px_rgba(44,35,24,0.035)]
            ">

              <DashboardChatbot
                selectedLocation={
                  selectedLocation
                }
                username={
                  username
                }
                disease={
                  riskDisease
                }
              />

            </section>

          </section>


          {/* =================================================
              PRECAUTION + QUICK ACCESS
          ================================================= */}

          <section className="
            mt-[14px]
            grid
            grid-cols-1
            gap-[14px]
            xl:h-[168px]
            xl:grid-cols-[1.52fr_1fr]
          ">

            <PreventiveMeasures
              disease={
                riskDisease
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


          {/* =================================================
              SAFETY BAR
          ================================================= */}

          <div className="
            mt-[14px]
            flex
            min-h-[39px]
            items-center
            gap-3
            rounded-[9px]
            border
            border-[#E5E2DC]
            bg-white
            px-4
            text-[10px]
            text-[#4E565C]
          ">

            <span className="
              flex
              h-5
              w-5
              items-center
              justify-center
              rounded-full
              border
              border-[#7A8084]
              text-[11px]
            ">
              i
            </span>

            <span>
              Stay safe, stay informed.
              Follow precautions and protect
              yourself and your loved ones.
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
              <ArrowRight size={13} />
            </button>

          </div>

        </div>

      </main>

    </div>
  );
}