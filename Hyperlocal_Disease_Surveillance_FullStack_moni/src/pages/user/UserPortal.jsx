import {
  useEffect,
  useState,
} from "react";

import {
  MapPin,
  Activity,
  ShieldAlert,
  Users,
  TrendingUp,
  CheckCircle2,
  Bot,
} from "lucide-react";

import {
  api,
} from "../../api";

import UserSidebar from "./UserSidebar";

import Dashboard from "./Dashboard";
import MapSection from "./dashboard/MapSection";
import AnalyticsSection from "./dashboard/AnalyticsSection";
import PrecautionarySection from "./dashboard/PrecautionarySection";

import NotificationsTab from "./NotificationsTab";
import DiseaseDistribution from "./dashboard/DiseaseDistribution";

import MedicalChatbot from "./MedicalChatbot.jsx";
import HomeRelief from "./HomeRelief";
import WeeklyReport from "./WeeklyReport";


export default function UserPortal({
  username,
  defaultLocation,
  onExit,
}) {

  // ==========================================================
  // LOCATION
  // ==========================================================

  const [
    selectedLocation,
    setSelectedLocation,
  ] = useState(
    defaultLocation || null
  );


  // ==========================================================
  // ACTIVE PAGE
  // ==========================================================

  const [
    activePage,
    setActivePage,
  ] = useState("dashboard");


  // ==========================================================
  // DASHBOARD DATA
  // ==========================================================

  const [
    dashboardData,
    setDashboardData,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  // ==========================================================
  // KEEP DEFAULT LOCATION WHEN USER DATA ARRIVES
  // ==========================================================

  useEffect(() => {

    if (
      defaultLocation?.talukId &&
      !selectedLocation?.talukId
    ) {

      setSelectedLocation(
        defaultLocation
      );

    }

  }, [
    defaultLocation,
    selectedLocation?.talukId,
  ]);


  // ==========================================================
  // LOAD DASHBOARD DATA
  // ==========================================================

  useEffect(() => {

    if (!selectedLocation?.talukId) {

      setDashboardData(null);
      setLoading(false);

      return;
    }


    let cancelled = false;


    async function loadDashboard() {

      try {

        setLoading(true);
        setError("");


        const data =
          await api.getDashboard(
            selectedLocation.talukId
          );


        if (!cancelled) {

          setDashboardData(
            data
          );

        }

      } catch (err) {

        if (!cancelled) {

          setDashboardData(null);

          setError(
            err?.message ||
            "Unable to load surveillance data."
          );

        }

      } finally {

        if (!cancelled) {

          setLoading(false);

        }

      }

    }


    loadDashboard();


    return () => {

      cancelled = true;

    };

  }, [
    selectedLocation?.talukId,
  ]);


  // ==========================================================
  // LOCATION CHANGE
  // ==========================================================

  const handleLocationChange = (
    location
  ) => {

    if (!location?.talukId) {
      return;
    }


    setSelectedLocation(
      location
    );


    /*
     * Whenever the user changes the location,
     * return to the dashboard.
     */
    setActivePage(
      "dashboard"
    );

  };


  // ==========================================================
  // RESET TO DEFAULT LOCATION
  // ==========================================================

  const resetToDefault = () => {

    if (!defaultLocation?.talukId) {
      return;
    }


    setSelectedLocation(
      defaultLocation
    );


    setActivePage(
      "dashboard"
    );

  };


  // ==========================================================
  // CENTRAL NAVIGATION HANDLER
  // ==========================================================
  //
  // IMPORTANT:
  //
  // Dashboard.jsx uses:
  //
  // onNavigate("overview")
  // onNavigate("risk-map")
  // onNavigate("precautions")
  // onNavigate("alerts")
  // onNavigate("notifications")
  // onNavigate("medical-chat")
  // onNavigate("home-relief")
  //
  // This function controls those transitions.
  //
  // ==========================================================

  const handleNavigate = (
    page
  ) => {

    if (!page) {
      return;
    }


    const allowedPages = [
      "dashboard",
      "weekly-report",
      "risk-map",
      "analytics",
      "precautions",
      "alerts",
      "notifications",
      "medical-chat",
      "medical-chatbot",
      "chatbot",
      "home-relief",
    ];


    /*
     * Prevent accidental invalid navigation.
     */
    if (
      !allowedPages.includes(page)
    ) {
      return;
    }


    /*
     * Normalize alternative Medical Assistant
     * route names to the same page.
     */
    if (
      page === "medical-chatbot" ||
      page === "chatbot"
    ) {

      setActivePage(
        "medical-chat"
      );

      return;
    }


    setActivePage(
      page
    );

  };


  // ==========================================================
  // LOCATION ID
  // ==========================================================

  const talukId =
    selectedLocation?.talukId;


  // ==========================================================
  // PAGE TITLE
  // ==========================================================

  const pageTitle =
    getPageTitle(
      activePage
    );


  // ==========================================================
  // MAIN RENDER
  // ==========================================================

  return (
    <div
      className="
        min-h-screen
        bg-[#FCFAF6]
        text-[#1F3144]
      "
    >

      {/* ====================================================
          SIDEBAR
      ==================================================== */}

      <UserSidebar

        activePage={
          activePage
        }

        onNavigate={
          handleNavigate
        }

        onExit={
          onExit
        }

        selectedLocation={
          selectedLocation
        }

        defaultLocation={
          defaultLocation
        }

        onLocationChange={
          handleLocationChange
        }

        onResetToDefault={
          resetToDefault
        }

      />


      {/* ====================================================
          MAIN AREA
      ==================================================== */}

      <main
        className="
          min-h-screen
          lg:ml-[248px]
        "
      >

        {/* ==================================================
            TOP HEADER
        ================================================== */}

        {/*
          Do not show the generic UserPortal header on the
          dashboard itself.

          Dashboard.jsx already contains the complete
          dashboard header matching the requested design.

          Keeping another header here causes duplicate/
          overlapping header content.
        */}

        {activePage !== "dashboard" && (

          <header
            className="
              sticky
              top-0
              z-30
              h-[82px]
              bg-[#FCFAF6]/95
              backdrop-blur
              border-b
              border-[#E7E2D8]
              flex
              items-center
              justify-between
              px-6
              sm:px-8
            "
          >

            {/* PAGE TITLE */}

            <div>

              <p
                className="
                  text-[10px]
                  sm:text-[11px]
                  font-semibold
                  uppercase
                  tracking-[0.15em]
                  text-[#7A8798]
                "
              >
                Citizen Portal
              </p>

              <h1
                className="
                  mt-0.5
                  text-[19px]
                  sm:text-[21px]
                  font-bold
                  text-[#13264B]
                "
              >
                {pageTitle}
              </h1>

            </div>


            {/* =================================================
                CURRENT LOCATION
            ================================================= */}

            <div
              className="
                hidden
                sm:flex
                items-center
                gap-3
                rounded-xl
                border
                border-[#E7E2D8]
                bg-white
                px-3.5
                py-2
                shadow-sm
              "
            >

              <div
                className="
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-lg
                  bg-[#EAF6EE]
                  text-[#0B7A33]
                "
              >

                <MapPin
                  size={17}
                />

              </div>


              <div>

                <p
                  className="
                    text-[9px]
                    font-medium
                    uppercase
                    tracking-[0.12em]
                    text-[#9A9489]
                  "
                >
                  Monitoring
                </p>

                <p
                  className="
                    text-[13px]
                    font-semibold
                    text-[#13264B]
                    max-w-[180px]
                    truncate
                  "
                >
                  {selectedLocation?.talukName ||
                    selectedLocation?.districtName ||
                    "No location selected"}
                </p>

              </div>

            </div>

          </header>

        )}


        {/* ==================================================
            DASHBOARD
        ================================================== */}

        {activePage === "dashboard" && (

          <Dashboard

            username={
              username
            }

            defaultLocation={
              defaultLocation
            }

            selectedLocation={
              selectedLocation
            }

            dashboardData={
              dashboardData
            }

            loading={
              loading
            }

            error={
              error
            }

            /*
             * IMPORTANT FIX
             *
             * This was missing in the previous UserPortal.
             *
             * Dashboard.jsx needs this callback for:
             *
             * More Precautions
             * View Risk Map
             * View Details
             * Recent Alerts
             * Quick Access
             * Medical Assistant
             * Home Relief
             * Notifications
             */
            onNavigate={
              handleNavigate
            }

            onExit={
              onExit
            }

          />

        )}


        {/* ==================================================
            WEEKLY REPORT
        ================================================== */}

        {activePage === "weekly-report" && (

          <WeeklyReport
            username={username}
            selectedLocation={selectedLocation}
            dashboardData={dashboardData}
            onBack={() => setActivePage("dashboard")}
            onNavigate={handleNavigate}
          />

        )}

        {/* ==================================================
            HEALTH OVERVIEW
        ================================================== */}

        {activePage === "overview" && (

          <HealthOverviewPage

            dashboardData={
              dashboardData
            }

            selectedLocation={
              selectedLocation
            }

            loading={
              loading
            }

            error={
              error
            }

          />

        )}


        {/* ==================================================
            DISEASE RISK MAP
        ================================================== */}

        {activePage === "risk-map" && (

          <PageContainer>

            <div className="space-y-6">

              <div>

                <h2
                  className="
                    text-[30px]
                    sm:text-[34px]
                    font-bold
                    text-[#13264B]
                  "
                >
                  Disease Risk Map
                </h2>

                <p
                  className="
                    mt-1
                    text-[14px]
                    sm:text-[15px]
                    text-[#667085]
                  "
                >
                  Explore disease risk and surveillance
                  information for the selected location.
                </p>

              </div>


              {talukId ? (

                <MapSection
                  taluk={
                    selectedLocation
                  }
                />

              ) : (

                <NoLocationMessage />

              )}

            </div>

          </PageContainer>

        )}


        {/* ==================================================
            ANALYTICS
        ================================================== */}

        {activePage === "analytics" && (

          <PageContainer>

            {loading ? (

              <div
                className="
                  rounded-3xl
                  border
                  border-[#E7E2D8]
                  bg-white
                  p-12
                  text-center
                  shadow-sm
                "
              >

                <div
                  className="
                    mx-auto
                    h-10
                    w-10
                    animate-spin
                    rounded-full
                    border-4
                    border-[#E8E2D8]
                    border-t-[#0B7A33]
                  "
                />

                <p
                  className="
                    mt-4
                    text-gray-500
                  "
                >
                  Loading analytics...
                </p>

              </div>

            ) : error ? (

              <div
                className="
                  rounded-2xl
                  border
                  border-red-200
                  bg-red-50
                  px-6
                  py-4
                  text-red-700
                "
              >
                {error}
              </div>

            ) : dashboardData ? (

              <div className="space-y-6">

                <div>

                  <h2
                    className="
                      text-[30px]
                      font-bold
                      text-[#13264B]
                    "
                  >
                    Analytics
                  </h2>

                  <p
                    className="
                      mt-1
                      text-[14px]
                      text-[#7A8598]
                    "
                  >
                    Disease surveillance statistics and
                    trends for your selected location.
                  </p>

                </div>


                <div
                  className="
                    min-h-[500px]
                    w-full
                  "
                >

                  <AnalyticsSection
                    dashboardData={
                      dashboardData
                    }
                  />

                </div>


                <div
                  className="
                    min-h-[500px]
                    w-full
                  "
                >

                  <DiseaseDistribution
                    dashboardData={
                      dashboardData
                    }
                  />

                </div>

              </div>

            ) : (

              <NoLocationMessage />

            )}

          </PageContainer>

        )}


        {/* ==================================================
            PRECAUTIONARY MEASURES
        ================================================== */}

        {activePage === "precautions" && (

          <PageContainer>

            <div className="space-y-6">

              <div>

                <h2
                  className="
                    text-[30px]
                    sm:text-[34px]
                    font-bold
                    text-[#13264B]
                  "
                >
                  Precautionary Measures
                </h2>

                <p
                  className="
                    mt-1
                    text-[14px]
                    sm:text-[15px]
                    text-[#667085]
                  "
                >
                  Recommended precautionary measures for
                  the selected location.
                </p>

              </div>


              {talukId ? (

                <PrecautionarySection

                  talukId={
                    selectedLocation?.talukId
                  }

                  talukName={
                    selectedLocation?.talukName
                  }

                  districtName={
                    selectedLocation?.districtName
                  }

                />

              ) : (

                <NoLocationMessage />

              )}

            </div>

          </PageContainer>

        )}


        {/* ==================================================
            EMERGENCY ALERTS
        ================================================== */}

        {activePage === "alerts" && (

          <PageContainer>

            {talukId ? (

              <NotificationsTab

                talukId={
                  talukId
                }

                filterType="Emergency Alert"

              />

            ) : (

              <NoLocationMessage />

            )}

          </PageContainer>

        )}


        {/* ==================================================
            NOTIFICATIONS
        ================================================== */}

        {activePage === "notifications" && (

          <PageContainer>

            {talukId ? (

              <NotificationsTab

                talukId={
                  talukId
                }

              />

            ) : (

              <NoLocationMessage />

            )}

          </PageContainer>

        )}


        {/* ==================================================
            HOME RELIEF
        ================================================== */}

        {activePage === "home-relief" && (

          <HomeRelief />

        )}


        {/* ==================================================
            MEDICAL ASSISTANT
        ================================================== */}

        {activePage === "medical-chat" && (

          <PageContainer>

            <div className="space-y-6">

              {/* PAGE HEADER */}

              <div>

                <div
                  className="
                    flex
                    items-center
                    gap-3
                  "
                >

                  <div
                    className="
                      flex
                      h-11
                      w-11
                      items-center
                      justify-center
                      rounded-xl
                      bg-[#EAF6EE]
                      text-[#0B7A33]
                    "
                  >

                    <Bot
                      size={22}
                    />

                  </div>

                  <div>

                    <h2
                      className="
                        text-[30px]
                        sm:text-[34px]
                        font-bold
                        text-[#13264B]
                      "
                    >
                      Medical Assistant
                    </h2>

                    <p
                      className="
                        mt-1
                        text-[14px]
                        sm:text-[15px]
                        text-[#667085]
                      "
                    >
                      Ask general health and medical
                      information questions.
                    </p>

                  </div>

                </div>

              </div>


              {/* CHATBOT */}

              <div
                className="
                  w-full
                  overflow-hidden
                  rounded-3xl
                  border
                  border-[#E7E2D8]
                  bg-white
                  shadow-sm
                "
              >

                <MedicalChatbot
                  selectedLocation={
                    selectedLocation
                  }
                />

              </div>

            </div>

          </PageContainer>

        )}

      </main>

    </div>
  );
}


/* ============================================================
   HEALTH OVERVIEW PAGE
============================================================ */

function HealthOverviewPage({
  dashboardData,
  selectedLocation,
  loading,
  error,
}) {

  if (loading) {

    return (
      <PageContainer>

        <div
          className="
            rounded-3xl
            border
            border-[#E7E2D8]
            bg-white
            p-12
            text-center
            shadow-sm
          "
        >

          <div
            className="
              mx-auto
              h-10
              w-10
              animate-spin
              rounded-full
              border-4
              border-[#E8E2D8]
              border-t-[#0B7A33]
            "
          />

          <p
            className="
              mt-4
              text-[14px]
              text-[#7A8598]
            "
          >
            Loading health overview...
          </p>

        </div>

      </PageContainer>
    );

  }


  if (error) {

    return (
      <PageContainer>

        <div
          className="
            rounded-2xl
            border
            border-red-200
            bg-red-50
            px-6
            py-4
            text-[14px]
            text-red-700
          "
        >
          {error}
        </div>

      </PageContainer>
    );

  }


  if (!dashboardData) {

    return (
      <PageContainer>

        <NoLocationMessage />

      </PageContainer>
    );

  }


  const data =
    dashboardData || {};


  const totalCases =
    data.total_cases ??
    data.totalCases ??
    data.cases ??
    data.total ??
    "—";


  const riskLevel =
    data.risk_level ??
    data.riskLevel ??
    data.risk ??
    "—";


  const topDisease =
    data.top_disease ??
    data.topDisease ??
    "—";


  const locationName =
    selectedLocation?.talukName ||
    data.taluk_name ||
    data.talukName ||
    "Selected Location";


  const diseases =
    Array.isArray(data.diseases)
      ? data.diseases
      : [];


  const trend =
    Array.isArray(data.trend)
      ? data.trend
      : [];


  // ==========================================================
  // RISK STYLE
  // ==========================================================

  const riskText =
    String(riskLevel).toLowerCase();


  let riskClass =
    "bg-[#F3F4F6] text-[#526073]";


  let riskIconClass =
    "bg-[#F3F4F6] text-[#526073]";


  if (
    riskText.includes("high") ||
    riskText.includes("severe")
  ) {

    riskClass =
      "bg-[#FDECEC] text-[#C62828]";

    riskIconClass =
      "bg-[#FDECEC] text-[#C62828]";

  } else if (
    riskText.includes("moderate") ||
    riskText.includes("medium")
  ) {

    riskClass =
      "bg-[#FFF4E5] text-[#B86A00]";

    riskIconClass =
      "bg-[#FFF4E5] text-[#B86A00]";

  } else if (
    riskText.includes("low")
  ) {

    riskClass =
      "bg-[#EAF6EE] text-[#0B7A33]";

    riskIconClass =
      "bg-[#EAF6EE] text-[#0B7A33]";

  }


  // ==========================================================
  // LATEST TREND
  // ==========================================================

  let latestCases = "—";
  let previousCases = null;


  if (
    trend.length > 0
  ) {

    const latest =
      trend[
        trend.length - 1
      ];


    latestCases =
      Number(
        latest?.total_cases ??
        latest?.totalCases ??
        latest?.cases ??
        0
      );


    if (
      trend.length > 1
    ) {

      const previous =
        trend[
          trend.length - 2
        ];


      previousCases =
        Number(
          previous?.total_cases ??
          previous?.totalCases ??
          previous?.cases ??
          0
        );

    }

  }


  let trendText =
    "No recent trend available.";


  let trendPositive =
    false;


  if (
    previousCases !== null &&
    typeof latestCases === "number"
  ) {

    const difference =
      latestCases -
      previousCases;


    if (
      difference > 0
    ) {

      trendText =
        `Cases increased by ${difference} compared with the previous period.`;

      trendPositive =
        true;

    } else if (
      difference < 0
    ) {

      trendText =
        `Cases decreased by ${Math.abs(difference)} compared with the previous period.`;

    } else {

      trendText =
        "Cases remain unchanged compared with the previous period.";

    }

  }


  return (
    <PageContainer>

      <div className="space-y-6">

        {/* ==================================================
            PAGE HEADER
        ================================================== */}

        <div>

          <h2
            className="
              text-[30px]
              sm:text-[34px]
              font-bold
              text-[#13264B]
            "
          >
            Health Overview
          </h2>

          <p
            className="
              mt-1
              text-[14px]
              sm:text-[15px]
              text-[#667085]
            "
          >
            A quick overview of the current health
            and disease surveillance situation in{" "}
            <span
              className="
                font-semibold
                text-[#13264B]
              "
            >
              {locationName}
            </span>.
          </p>

        </div>


        {/* ==================================================
            OVERVIEW CARDS
        ================================================== */}

        <div
          className="
            grid
            grid-cols-1
            sm:grid-cols-2
            xl:grid-cols-4
            gap-4
          "
        >

          {/* TOTAL CASES */}

          <div
            className="
              rounded-2xl
              border
              border-[#E7E2D8]
              bg-white
              p-5
              shadow-sm
            "
          >

            <div
              className="
                flex
                items-start
                justify-between
              "
            >

              <div>

                <p
                  className="
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-[0.12em]
                    text-[#9A9489]
                  "
                >
                  Total Cases
                </p>

                <p
                  className="
                    mt-2
                    text-[28px]
                    font-bold
                    text-[#13264B]
                  "
                >
                  {String(totalCases)}
                </p>

                <p
                  className="
                    mt-1
                    text-[12px]
                    text-[#7A8598]
                  "
                >
                  Reported surveillance cases
                </p>

              </div>


              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  bg-[#EEF5FF]
                  text-[#2563EB]
                "
              >

                <Users
                  size={19}
                />

              </div>

            </div>

          </div>


          {/* CURRENT RISK */}

          <div
            className="
              rounded-2xl
              border
              border-[#E7E2D8]
              bg-white
              p-5
              shadow-sm
            "
          >

            <div
              className="
                flex
                items-start
                justify-between
              "
            >

              <div>

                <p
                  className="
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-[0.12em]
                    text-[#9A9489]
                  "
                >
                  Current Risk
                </p>

                <p
                  className="
                    mt-2
                    text-[28px]
                    font-bold
                    text-[#13264B]
                  "
                >
                  {String(riskLevel)}
                </p>

                <span
                  className={`
                    mt-2
                    inline-flex
                    rounded-full
                    px-2.5
                    py-1
                    text-[10px]
                    font-semibold
                    ${riskClass}
                  `}
                >
                  Current risk level
                </span>

              </div>


              <div
                className={`
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  ${riskIconClass}
                `}
              >

                <ShieldAlert
                  size={19}
                />

              </div>

            </div>

          </div>


          {/* TOP DISEASE */}

          <div
            className="
              rounded-2xl
              border
              border-[#E7E2D8]
              bg-white
              p-5
              shadow-sm
            "
          >

            <div
              className="
                flex
                items-start
                justify-between
              "
            >

              <div>

                <p
                  className="
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-[0.12em]
                    text-[#9A9489]
                  "
                >
                  Top Disease
                </p>

                <p
                  className="
                    mt-2
                    text-[24px]
                    font-bold
                    text-[#13264B]
                  "
                >
                  {String(topDisease)}
                </p>

                <p
                  className="
                    mt-1
                    text-[12px]
                    text-[#7A8598]
                  "
                >
                  Most reported disease
                </p>

              </div>


              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  bg-[#F3ECFF]
                  text-[#7C3AED]
                "
              >

                <Activity
                  size={19}
                />

              </div>

            </div>

          </div>


          {/* RECENT TREND */}

          <div
            className="
              rounded-2xl
              border
              border-[#E7E2D8]
              bg-white
              p-5
              shadow-sm
            "
          >

            <div
              className="
                flex
                items-start
                justify-between
              "
            >

              <div>

                <p
                  className="
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-[0.12em]
                    text-[#9A9489]
                  "
                >
                  Recent Trend
                </p>

                <p
                  className="
                    mt-2
                    text-[28px]
                    font-bold
                    text-[#13264B]
                  "
                >
                  {String(latestCases)}
                </p>

                <p
                  className="
                    mt-1
                    text-[12px]
                    text-[#7A8598]
                  "
                >
                  Latest reported cases
                </p>

              </div>


              <div
                className="
                  flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-xl
                  bg-[#EAF6EE]
                  text-[#0B7A33]
                "
              >

                <TrendingUp
                  size={19}
                />

              </div>

            </div>

          </div>

        </div>


        {/* ==================================================
            HEALTH STATUS
        ================================================== */}

        <div
          className="
            rounded-2xl
            border
            border-[#E7E2D8]
            bg-white
            p-6
            shadow-sm
          "
        >

          <div
            className="
              flex
              flex-col
              gap-4
              md:flex-row
              md:items-center
              md:justify-between
            "
          >

            <div>

              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >

                <div
                  className="
                    flex
                    h-9
                    w-9
                    items-center
                    justify-center
                    rounded-xl
                    bg-[#EAF6EE]
                    text-[#0B7A33]
                  "
                >

                  <CheckCircle2
                    size={18}
                  />

                </div>

                <h3
                  className="
                    text-[18px]
                    font-semibold
                    text-[#13264B]
                  "
                >
                  Current Health Status
                </h3>

              </div>


              <p
                className="
                  mt-3
                  max-w-3xl
                  text-[13px]
                  leading-6
                  text-[#667085]
                "
              >
                Surveillance information for{" "}
                <span
                  className="
                    font-semibold
                    text-[#13264B]
                  "
                >
                  {locationName}
                </span>{" "}
                is being monitored through the disease
                surveillance system. The current risk level
                is{" "}
                <span
                  className="
                    font-semibold
                    text-[#13264B]
                  "
                >
                  {String(riskLevel)}
                </span>
                .
              </p>

            </div>


            <div
              className={`
                shrink-0
                rounded-xl
                px-4
                py-3
                text-center
                ${riskClass}
              `}
            >

              <p
                className="
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.12em]
                "
              >
                Risk Status
              </p>

              <p
                className="
                  mt-1
                  text-[15px]
                  font-bold
                "
              >
                {String(riskLevel)}
              </p>

            </div>

          </div>

        </div>


        {/* ==================================================
            RECENT SURVEILLANCE TREND
        ================================================== */}

        <div
          className="
            rounded-2xl
            border
            border-[#E7E2D8]
            bg-white
            p-6
            shadow-sm
          "
        >

          <div
            className="
              flex
              items-center
              gap-3
            "
          >

            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-xl
                bg-[#EEF5FF]
                text-[#2563EB]
              "
            >

              <TrendingUp
                size={19}
              />

            </div>

            <div>

              <h3
                className="
                  text-[18px]
                  font-semibold
                  text-[#13264B]
                "
              >
                Recent Surveillance Trend
              </h3>

              <p
                className="
                  mt-0.5
                  text-[12px]
                  text-[#7A8598]
                "
              >
                Latest available disease reporting trend
              </p>

            </div>

          </div>


          <div
            className="
              mt-5
              rounded-xl
              border
              border-[#E8E2D8]
              bg-[#FCFAF6]
              px-5
              py-4
            "
          >

            <div
              className="
                flex
                flex-col
                gap-2
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >

              <p
                className="
                  text-[13px]
                  text-[#526073]
                "
              >
                {trendText}
              </p>


              {previousCases !== null && (

                <div
                  className={`
                    rounded-lg
                    px-3
                    py-1.5
                    text-[11px]
                    font-semibold
                    ${
                      trendPositive
                        ? "bg-[#FFF4E5] text-[#B86A00]"
                        : "bg-[#EAF6EE] text-[#0B7A33]"
                    }
                  `}
                >
                  Previous: {previousCases}
                </div>

              )}

            </div>

          </div>

        </div>


        {/* ==================================================
            DISEASE SUMMARY
        ================================================== */}

        <div
          className="
            rounded-2xl
            border
            border-[#E7E2D8]
            bg-white
            p-6
            shadow-sm
          "
        >

          <div>

            <h3
              className="
                text-[18px]
                font-semibold
                text-[#13264B]
              "
            >
              Disease Summary
            </h3>

            <p
              className="
                mt-1
                text-[13px]
                text-[#7A8598]
              "
            >
              Current disease composition in the selected
              monitoring location.
            </p>

          </div>


          {diseases.length > 0 ? (

            <div
              className="
                mt-5
                grid
                grid-cols-1
                sm:grid-cols-2
                lg:grid-cols-3
                gap-3
              "
            >

              {diseases
                .slice(0, 6)
                .map(
                  (
                    disease,
                    index
                  ) => {

                    const name =
                      disease?.name ??
                      disease?.disease ??
                      disease?.disease_name ??
                      "Unknown";


                    const cases =
                      disease?.cases ??
                      disease?.count ??
                      disease?.total ??
                      0;


                    return (

                      <div
                        key={index}
                        className="
                          rounded-xl
                          border
                          border-[#E8E2D8]
                          bg-[#FCFAF6]
                          px-4
                          py-3
                        "
                      >

                        <div
                          className="
                            flex
                            items-center
                            justify-between
                            gap-3
                          "
                        >

                          <p
                            className="
                              text-[13px]
                              font-medium
                              text-[#526073]
                              truncate
                            "
                          >
                            {name}
                          </p>

                          <p
                            className="
                              text-[14px]
                              font-bold
                              text-[#13264B]
                            "
                          >
                            {cases}
                          </p>

                        </div>

                      </div>

                    );

                  }
                )}

            </div>

          ) : (

            <div
              className="
                mt-5
                rounded-xl
                border
                border-[#E8E2D8]
                bg-[#FCFAF6]
                px-5
                py-5
                text-[13px]
                text-[#7A8598]
              "
            >
              Detailed disease information is not
              available for the selected location.
            </div>

          )}

        </div>

      </div>

    </PageContainer>
  );
}


/* ============================================================
   PAGE CONTAINER
============================================================ */

function PageContainer({
  children,
}) {

  return (
    <div
      className="
        w-full
        max-w-[1500px]
        mx-auto
        px-5
        sm:px-6
        lg:px-8
        py-6
        sm:py-8
      "
    >
      {children}
    </div>
  );
}


/* ============================================================
   NO LOCATION
============================================================ */

function NoLocationMessage() {

  return (
    <div
      className="
        bg-white
        rounded-2xl
        border
        border-[#E8E2D8]
        p-8
        text-center
      "
    >

      <div
        className="
          mx-auto
          w-12
          h-12
          rounded-xl
          bg-[#EAF6EE]
          text-[#0B7A33]
          flex
          items-center
          justify-center
        "
      >

        <MapPin
          size={21}
        />

      </div>


      <h2
        className="
          mt-4
          text-[18px]
          font-semibold
          text-[#1F3144]
        "
      >
        Select a location
      </h2>


      <p
        className="
          mt-1
          text-[14px]
          text-[#7A8598]
        "
      >
        Please select your State,
        District, and Taluk from
        the Location section in the sidebar.
      </p>

    </div>
  );
}


/* ============================================================
   PAGE TITLES
============================================================ */

function getPageTitle(
  page
) {

  const titles = {

    dashboard:
      "Dashboard",

    "weekly-report":
      "Weekly Health Report",

    "risk-map":
      "Disease Risk Map",

    analytics:
      "Analytics",

    precautions:
      "Precautionary Measures",

    alerts:
      "Emergency Alerts",

    notifications:
      "Notifications",

    "medical-chat":
      "Medical Assistant",

    "home-relief":
      "Home Relief & Supportive Care",

  };


  return (
    titles[page] ||
    "Dashboard"
  );
}
