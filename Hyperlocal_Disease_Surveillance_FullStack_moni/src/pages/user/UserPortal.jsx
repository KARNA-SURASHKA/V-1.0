import {
  useEffect,
  useState,
} from "react";

import {
  MapPin,
} from "lucide-react";

import {
  api,
} from "../../api";

import UserSidebar
  from "./UserSidebar";

import UserTopHeader
  from "./UserTopHeader";

import Dashboard
  from "./Dashboard";

import HealthOverview
  from "./HealthOverview";

import WeeklyReport
  from "./WeeklyReport";

import MedicalChatbot
  from "./MedicalChatbot";

import HomeRelief
  from "./HomeRelief";

import NotificationsTab
  from "./NotificationsTab";

import MapSection
  from "./dashboard/MapSection";

import AnalyticsSection
  from "./dashboard/AnalyticsSection";

import DiseaseDistribution
  from "./dashboard/DiseaseDistribution";

import PrecautionarySection
  from "./dashboard/PrecautionarySection";


export default function UserPortal({
  username,
  defaultLocation,
  onExit,
}) {

  /*
   * ==========================================================
   * LOCATION
   * ==========================================================
   */

  const [
    selectedLocation,
    setSelectedLocation,
  ] = useState(
    defaultLocation || null
  );


  /*
   * ==========================================================
   * ACTIVE PAGE
   * ==========================================================
   */

  const [
    activePage,
    setActivePage,
  ] = useState(
    "dashboard"
  );


  /*
   * ==========================================================
   * DASHBOARD DATA
   * ==========================================================
   */

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


  /*
   * ==========================================================
   * DEFAULT LOCATION
   * ==========================================================
   */

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


  /*
   * ==========================================================
   * LOAD DASHBOARD
   * ==========================================================
   */

  useEffect(() => {

    if (
      !selectedLocation?.talukId
    ) {

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


  /*
   * ==========================================================
   * NAVIGATION
   * ==========================================================
   */

  const handleNavigate = (
    page
  ) => {

    if (!page) {
      return;
    }


    /*
     * Dashboard components may use
     * different names for Medical Assistant.
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


    const validPages = [
      "dashboard",
      "weekly-report",
      "overview",
      "risk-map",
      "analytics",
      "precautions",
      "alerts",
      "notifications",
      "medical-chat",
      "home-relief",
    ];


    if (
      !validPages.includes(
        page
      )
    ) {

      return;

    }


    setActivePage(
      page
    );

  };


  /*
   * ==========================================================
   * LOCATION CHANGE
   * ==========================================================
   */

  const handleLocationChange = (
    location
  ) => {

    if (
      !location?.talukId
    ) {

      return;

    }


    setSelectedLocation(
      location
    );


    setActivePage(
      "dashboard"
    );

  };


  /*
   * ==========================================================
   * RESET LOCATION
   * ==========================================================
   */

  const resetToDefault = () => {

    if (
      !defaultLocation?.talukId
    ) {

      return;

    }


    setSelectedLocation(
      defaultLocation
    );


    setActivePage(
      "dashboard"
    );

  };


  const talukId =
    selectedLocation?.talukId;


  /*
   * ==========================================================
   * PAGE WRAPPER
   * ==========================================================
   */

  const PageContainer = ({
    children,
  }) => (

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


  /*
   * ==========================================================
   * NO LOCATION
   * ==========================================================
   */

  const NoLocation = () => (

    <PageContainer>

      <div
        className="
          rounded-2xl
          border
          border-[#E8E2D8]
          bg-white
          p-10
          text-center
        "
      >

        <div
          className="
            mx-auto
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-xl
            bg-[#EAF6EE]
            text-[#0B7A33]
          "
        >

          <MapPin
            size={22}
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
          the Location section.
        </p>

      </div>

    </PageContainer>

  );


  /*
   * ==========================================================
   * MAIN
   * ==========================================================
   */

  return (

    <div
      className="
        min-h-screen
        bg-[#FCFAF6]
        text-[#1F3144]
      "
    >

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

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


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main
        className="
          min-h-screen
          lg:ml-[248px]
        "
      >

        {/* ===================================================
            HOME RELIEF HEADER
        =================================================== */}

        {activePage ===
          "home-relief" && (

          <UserTopHeader
            username={
              username
            }
            selectedLocation={
              selectedLocation
            }
            portalLabel="
              CITIZEN PORTAL
            "
            title="
              Home Relief & Supportive Care
            "
            subtitle="
              Simple home care tips to help you feel better and stay safe.
            "
          />

        )}


        {/* ===================================================
            DASHBOARD
        =================================================== */}

        {activePage ===
          "dashboard" && (

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

            onNavigate={
              handleNavigate
            }

            onExit={
              onExit
            }

          />

        )}


        {/* ===================================================
            WEEKLY REPORT
        =================================================== */}

        {activePage ===
          "weekly-report" && (

          <WeeklyReport
            username={
              username
            }
            selectedLocation={
              selectedLocation
            }
            dashboardData={
              dashboardData
            }
            onBack={() =>
              setActivePage(
                "dashboard"
              )
            }
            onNavigate={
              handleNavigate
            }
          />

        )}


        {/* ===================================================
            HEALTH OVERVIEW
        =================================================== */}

        {activePage ===
          "overview" && (

          <HealthOverview
            dashboardData={
              dashboardData
            }
            loading={
              loading
            }
            error={
              error
            }
          />

        )}


        {/* ===================================================
            DISEASE RISK MAP
        =================================================== */}

        {activePage ===
          "risk-map" && (

          <PageContainer>

            <div
              className="
                space-y-6
              "
            >

              <div>

                <h1
                  className="
                    text-[30px]
                    font-bold
                    text-[#13264B]
                  "
                >
                  Disease Risk Map
                </h1>


                <p
                  className="
                    mt-1
                    text-[14px]
                    text-[#667085]
                  "
                >
                  Explore disease risk and surveillance
                  information for your selected location.
                </p>

              </div>


              {talukId ? (

                <MapSection
                  taluk={
                    selectedLocation
                  }
                />

              ) : (

                <NoLocation />

              )}

            </div>

          </PageContainer>

        )}


        {/* ===================================================
            ANALYTICS
        =================================================== */}

        {activePage ===
          "analytics" && (

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

              <div
                className="
                  space-y-6
                "
              >

                <div>

                  <h1
                    className="
                      text-[30px]
                      font-bold
                      text-[#13264B]
                    "
                  >
                    Analytics
                  </h1>


                  <p
                    className="
                      mt-1
                      text-[14px]
                      text-[#7A8598]
                    "
                  >
                    Disease surveillance statistics
                    and trends for your selected location.
                  </p>

                </div>


                <AnalyticsSection
                  dashboardData={
                    dashboardData
                  }
                />


                <DiseaseDistribution
                  dashboardData={
                    dashboardData
                  }
                />

              </div>

            ) : (

              <NoLocation />

            )}

          </PageContainer>

        )}


        {/* ===================================================
            PRECAUTIONS
        =================================================== */}

        {activePage ===
          "precautions" && (

          <div className="w-full">

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

                dashboardData={
                  dashboardData
                }

                loading={
                  loading
                }

                error={
                  error
                }

                username={
                  username
                }

              />

            ) : (

              <NoLocation />

            )}

          </div>

        )}


        {/* ===================================================
            EMERGENCY ALERTS
        =================================================== */}

        {activePage ===
          "alerts" && (

          <PageContainer>

            {talukId ? (

              <NotificationsTab
                talukId={
                  talukId
                }
                filterType="
                  Emergency Alert
                "
              />

            ) : (

              <NoLocation />

            )}

          </PageContainer>

        )}


        {/* ===================================================
            NOTIFICATIONS
        =================================================== */}

        {activePage ===
          "notifications" && (

          <PageContainer>

            {talukId ? (

              <NotificationsTab
                talukId={
                  talukId
                }
              />

            ) : (

              <NoLocation />

            )}

          </PageContainer>

        )}


        {/* ===================================================
            HOME RELIEF
        =================================================== */}

        {activePage ===
          "home-relief" && (

          <HomeRelief
            onGoMedicalAssistant={() =>
              setActivePage(
                "medical-chat"
              )
            }
          />

        )}


        {/* ===================================================
            MEDICAL ASSISTANT
        =================================================== */}

        {activePage ===
          "medical-chat" && (

          <div
            className="
              min-h-screen
              bg-white
              px-[28px]
              pb-[30px]
              pt-[26px]
              lg:pr-[48px]
            "
          >

            <MedicalChatbot
              selectedLocation={
                selectedLocation
              }
            />

          </div>

        )}

      </main>

    </div>

  );

}