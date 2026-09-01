import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import api from "../../api";

import MedicalSupervisorLayout
  from "./components/MedicalSupervisorLayout";

import Overview
  from "./components/Overview";

import DiseaseReports
  from "./components/DiseaseReports";

import WeeklyMonitoring
  from "./components/WeeklyMonitoring";

import RiskMap
  from "./components/RiskMap";

import SurveillanceAnalytics
  from "./components/SurveillanceAnalytics";

import AgentOversight
  from "./components/AgentOversight";

import Alerts
  from "./components/Alerts";

import HomeReliefManagement
  from "./HomeReliefManagement";

import {
  Loading,
} from "./components/MedicalUi";


export default function MedicalSupervisorPortal({
  onExit,
}) {

  const [tab, setTab] =
    useState("overview");

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [monitoringWeek, setMonitoringWeek] =
    useState(null);

  const [data, setData] = useState({
    overview: null,

    reports: [],

    monitoring: {
      district: null,
      week: null,
      summary: {
        total_agents: 0,
        on_time: 0,
        late: 0,
        missed: 0,
        pending: 0,
        compliance_percent: 0,
        repeated_missed: 0,
      },
      follow_up: [],
      rows: [],
      available_weeks: [],
    },

    analytics: null,

    riskMap: [],

    emerging: [],

    agents: [],

    issues: [],

    diseases: [],
  });


  // ==========================================================
  // LOAD EVERYTHING
  // ==========================================================

  const load = useCallback(
    async (
      showSpinner = true,
      selectedWeek = monitoringWeek
    ) => {

      try {

        setError("");

        if (showSpinner) {
          setRefreshing(true);
        }

        const weekNumber =
          selectedWeek?.week_number ?? null;

        const year =
          selectedWeek?.year ?? null;


        const [
          overview,
          reports,
          monitoring,
          analytics,
          riskMap,
          emerging,
          agents,
          issues,
          diseases,
        ] = await Promise.all([
          api.getMedicalOverview(),

          api.getMedicalReports(),

          api.getMedicalMonitoring(
            weekNumber,
            year
          ),

          api.getMedicalAnalytics(8),

          api.getMedicalRiskMap(),

          api.getMedicalEmergingDiseases(),

          api.getSupervisorAgents(),

          api.getSupervisorAgentIssues(),

          api.getMedicalDiseases(),
        ]);


        const normalizedMonitoring =
          monitoring &&
          !Array.isArray(monitoring)
            ? monitoring
            : {
                district: null,

                week: null,

                summary: {
                  total_agents: Array.isArray(
                    monitoring
                  )
                    ? monitoring.length
                    : 0,

                  on_time: 0,

                  late: 0,

                  missed: 0,

                  pending: 0,

                  compliance_percent: 0,

                  repeated_missed: 0,
                },

                follow_up: [],

                rows: Array.isArray(
                  monitoring
                )
                  ? monitoring
                  : [],

                available_weeks: [],
              };


        setData({
          overview,

          reports:
            Array.isArray(reports)
              ? reports
              : [],

          monitoring:
            normalizedMonitoring,

          analytics,

          riskMap:
            Array.isArray(riskMap)
              ? riskMap
              : [],

          emerging:
            Array.isArray(emerging)
              ? emerging
              : [],

          agents:
            Array.isArray(agents)
              ? agents
              : [],

          issues:
            Array.isArray(issues)
              ? issues
              : [],

          diseases:
            Array.isArray(diseases)
              ? diseases
              : [],
        });


        // Backend chooses last completed week
        // when no week is supplied.
        if (
          !selectedWeek &&
          normalizedMonitoring.week
        ) {
          setMonitoringWeek(
            normalizedMonitoring.week
          );
        }

      } catch (e) {

        console.error(
          "Medical Supervisor load error:",
          e
        );

        setError(
          e?.message ||
            "Unable to load Medical Supervisor data."
        );

      } finally {

        setLoading(false);

        setRefreshing(false);
      }
    },
    [monitoringWeek]
  );


  useEffect(() => {
    load(true, null);
  }, []);


  // ==========================================================
  // REFRESH
  // ==========================================================

  const refreshAll = useCallback(
    () => {
      load(true, monitoringWeek);
    },
    [load, monitoringWeek]
  );


  // ==========================================================
  // CHANGE MONITORING WEEK
  // ==========================================================

  const changeMonitoringWeek =
    useCallback(
      async (week) => {

        if (!week) {
          return;
        }

        setMonitoringWeek(week);

        await load(
          true,
          week
        );
      },
      [load]
    );


  // ==========================================================
  // REMIND ONE AGENT
  // ==========================================================

  const remindAgent =
    async (agent) => {

      try {

        await api.remindSupervisorAgent(
          agent.agent_id ??
          agent.id
        );

        await load(
          false,
          monitoringWeek
        );

      } catch (e) {

        setError(
          e?.message ||
            "Unable to send reminder."
        );
      }
    };


  // ==========================================================
  // REMIND ALL FOLLOW-UP AGENTS
  // ==========================================================

  const remindAllMonitoringAgents =
    async () => {

      try {

        await api.remindAllMonitoringAgents(
          monitoringWeek?.week_number,
          monitoringWeek?.year
        );

        await load(
          false,
          monitoringWeek
        );

      } catch (e) {

        setError(
          e?.message ||
            "Unable to send weekly reminders."
        );
      }
    };


  // ==========================================================
  // AGENT ISSUE
  // ==========================================================

  const submitIssue =
    async (payload) => {

      await api.submitAgentIssue(
        payload
      );

      await load(
        false,
        monitoringWeek
      );
    };


  // ==========================================================
  // CREATE REPORT
  // ==========================================================

  const createMedicalReport =
    async (payload) => {

      await api.createMedicalReport(
        payload
      );

      await load(
        false,
        monitoringWeek
      );
    };


  // ==========================================================
  // EMERGING DISEASE REVIEW
  // ==========================================================

  const reviewEmerging =
    async (
      id,
      decision,
      notes,
      extra = {}
    ) => {

      await api.reviewEmergingDisease(
        id,
        {
          decision,
          review_notes:
            notes || "",
          ...extra,
        }
      );

      await load(
        false,
        monitoringWeek
      );
    };


  // ==========================================================
  // ALERT COUNT
  // ==========================================================

  const alertCount =
    (data.overview?.high_risk_alerts || 0) +
    (data.overview?.pending_emerging_reviews || 0) +
    (data.overview?.pending_agent_submissions || 0);


  const districtName =
    data.overview
      ?.supervisor_district
      ?.name ||
    data.overview
      ?.district
      ?.name ||
    data.monitoring
      ?.district
      ?.name ||
    "Kodagu District";


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <MedicalSupervisorLayout
      activeTab={tab}
      onTabChange={setTab}
      onExit={onExit}
      alertCount={alertCount}
      districtName={districtName}
    >

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div
          className="
            mb-5
            flex
            items-center
            justify-between
            gap-3
            rounded-xl
            border
            border-[#F0CACA]
            bg-[#FFF5F5]
            px-4
            py-3
            text-[11px]
            text-[#C62828]
          "
        >

          <div className="flex items-center gap-2">
            <AlertCircle size={15} />

            <span>
              {error}
            </span>
          </div>


          <button
            type="button"
            onClick={refreshAll}
            disabled={refreshing}
            className="
              inline-flex
              items-center
              gap-2
              rounded-lg
              border
              border-[#F0CACA]
              bg-white
              px-3
              py-2
              font-semibold
            "
          >

            <RefreshCw
              size={13}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            Retry

          </button>

        </div>
      )}


      {/* =====================================================
          GLOBAL REFRESH
      ===================================================== */}

      {tab !== "home-relief" && (
        <div className="mb-3 flex justify-end">

          <button
            type="button"
            onClick={refreshAll}
            disabled={refreshing}
            className="
              inline-flex
              items-center
              gap-2
              rounded-lg
              border
              border-[#DDE5E0]
              bg-white
              px-3
              py-2
              text-[10px]
              font-semibold
              text-[#52627D]
              hover:bg-[#F7FAF8]
            "
          >

            <RefreshCw
              size={13}
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh

          </button>

        </div>
      )}


      {/* =====================================================
          PAGE CONTENT
      ===================================================== */}

      {loading ? (

        <Loading />

      ) : tab === "overview" ? (

        <Overview
          data={data.overview}
          onReports={() =>
            setTab("reports")
          }
          onMonitoring={() =>
            setTab("monitoring")
          }
          onAlerts={() =>
            setTab("alerts")
          }
        />

      ) : tab === "reports" ? (

        <DiseaseReports
          reports={data.reports}
          overview={data.overview}
          agents={data.agents}
          onRefresh={() =>
            load(true, monitoringWeek)
          }
          onCreateReport={
            createMedicalReport
          }
        />

      ) : tab === "monitoring" ? (

        <WeeklyMonitoring
          monitoring={data.monitoring}
          rows={
            data.monitoring?.rows || []
          }
          onRemind={remindAgent}
          onRemindAll={
            remindAllMonitoringAgents
          }
          onRefresh={refreshAll}
          onWeekChange={
            changeMonitoringWeek
          }
        />

      ) : tab === "risk-map" ? (

        <RiskMap
          data={data.riskMap}
        />

      ) : tab === "analytics" ? (

        <SurveillanceAnalytics
          data={data.analytics}
        />

      ) : tab === "agents" ? (

        <AgentOversight
          agents={data.agents}
          issues={data.issues}
          onSubmitIssue={
            submitIssue
          }
        />

      ) : tab === "alerts" ? (

        <Alerts
          alerts={
            data.overview
              ?.recent_alerts || []
          }
          emerging={
            data.emerging
          }
          diseases={
            data.diseases
          }
          onReviewEmerging={
            reviewEmerging
          }
        />

      ) : (

        <HomeReliefManagement />

      )}

    </MedicalSupervisorLayout>
  );
}