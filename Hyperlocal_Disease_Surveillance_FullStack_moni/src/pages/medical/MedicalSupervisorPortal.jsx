import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import api from "../../api";

import MedicalSupervisorLayout from "./components/MedicalSupervisorLayout";
import Overview from "./components/Overview";
import DiseaseReports from "./components/DiseaseReports";
import WeeklyMonitoring from "./components/WeeklyMonitoring";
import RiskMap from "./components/RiskMap";
import SurveillanceAnalytics from "./components/SurveillanceAnalytics";
import AgentOversight from "./components/AgentOversight";
import Alerts from "./components/Alerts";
import HomeReliefManagement from "./HomeReliefManagement";

import {
  Loading,
} from "./components/MedicalUi";


// ============================================================
// WEEK HELPERS
// ============================================================

function normalizeWeekNumber(
  weekNumber,
  year
) {
  if (
    weekNumber === undefined ||
    weekNumber === null ||
    weekNumber === ""
  ) {
    return null;
  }

  const numericWeek =
    Number(weekNumber);

  if (!Number.isFinite(numericWeek)) {
    return null;
  }

  /*
   * Backend normally stores:
   *
   * YYYYWW
   *
   * Example:
   * 202635
   *
   * Older records may contain:
   *
   * 35
   */

  if (
    numericWeek >= 1000
  ) {
    return numericWeek;
  }

  const numericYear =
    Number(year);

  if (
    Number.isFinite(numericYear) &&
    numericYear >= 2000
  ) {
    return (
      numericYear * 100 +
      numericWeek
    );
  }

  return null;
}


function getISOWeekFromDate(
  value
) {
  if (!value) {
    return null;
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  const utcDate =
    new Date(
      Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      )
    );

  const day =
    utcDate.getUTCDay() || 7;

  utcDate.setUTCDate(
    utcDate.getUTCDate() +
      4 -
      day
  );

  const yearStart =
    new Date(
      Date.UTC(
        utcDate.getUTCFullYear(),
        0,
        1
      )
    );

  const week =
    Math.ceil(
      (
        (
          (
            utcDate -
            yearStart
          ) /
          86400000
        ) +
        1
      ) /
      7
    );

  return (
    utcDate.getUTCFullYear() *
      100 +
    week
  );
}


// ============================================================
// BUILD AVAILABLE REPORTING WEEKS
// ============================================================

function buildAvailableWeeks(
  reports
) {
  if (
    !Array.isArray(reports)
  ) {
    return [];
  }

  const map =
    new Map();

  for (
    const report of reports
  ) {
    let value =
      normalizeWeekNumber(
        report?.week_number,
        report?.year
      );

    /*
     * Fallback for older records.
     */

    if (!value) {
      value =
        getISOWeekFromDate(
          report?.created_at
        );
    }

    if (!value) {
      continue;
    }

    const numericValue =
      Number(value);

    const year =
      Math.floor(
        numericValue / 100
      );

    const week =
      numericValue % 100;

    if (
      week < 1 ||
      week > 53
    ) {
      continue;
    }

    if (
      !map.has(
        numericValue
      )
    ) {
      map.set(
        numericValue,
        {
          value:
            numericValue,
          year,
          week,
        }
      );
    }
  }

  return Array.from(
    map.values()
  ).sort(
    (a, b) =>
      b.value -
      a.value
  );
}


// ============================================================
// MAIN COMPONENT
// ============================================================

export default function MedicalSupervisorPortal({
  onExit,
}) {
  const [
    tab,
    setTab,
  ] = useState(
    "overview"
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    monitoringLoading,
    setMonitoringLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    selectedWeek,
    setSelectedWeek,
  ] = useState(null);

  const [
    availableWeeks,
    setAvailableWeeks,
  ] = useState([]);

  const [
    data,
    setData,
  ] = useState({
    overview: null,
    reports: [],
    monitoring: [],
    analytics: null,
    riskMap: [],
    emerging: [],
    agents: [],
    issues: [],
    diseases: [],
  });


  // ==========================================================
  // FULL PAGE LOAD
  // ==========================================================

  const load =
    useCallback(
      async (
        showSpinner = true
      ) => {
        try {
          setError("");

          if (
            showSpinner
          ) {
            setRefreshing(
              true
            );
          }

          /*
           * Load all disease reports first.
           *
           * These are also used by:
           *
           * Agent Oversight
           *
           * to calculate:
           *
           * - Last submission
           * - 4 week history
           * - Compliance
           */

          const reports =
            await api.getMedicalReports(
              {
                limit: 1000,
              }
            );

          const normalizedReports =
            Array.isArray(
              reports
            )
              ? reports
              : [];

          const weeks =
            buildAvailableWeeks(
              normalizedReports
            );

          setAvailableWeeks(
            weeks
          );


          /*
           * Preserve selected week if it still
           * exists. Otherwise use latest submitted
           * reporting week.
           */

          const preferredWeek =
            selectedWeek &&
            weeks.some(
              (item) =>
                item.value ===
                Number(
                  selectedWeek
                )
            )
              ? Number(
                  selectedWeek
                )
              : weeks[0]
                  ?.value ||
                null;

          setSelectedWeek(
            preferredWeek
          );


          /*
           * Load the remaining Medical Supervisor
           * data.
           */

          const [
            overview,
            analytics,
            riskMap,
            emerging,
            agents,
            issues,
            diseases,
            monitoring,
          ] =
            await Promise.all([
              api.getMedicalOverview(),

              api.getMedicalAnalytics(
                8
              ),

              api.getMedicalRiskMap(),

              api.getMedicalEmergingDiseases(),

              api.getSupervisorAgents(),

              api.getSupervisorAgentIssues(),

              api.getMedicalDiseases(),

              api.getMedicalMonitoring(
                preferredWeek ||
                  undefined
              ),
            ]);


          setData({
            overview,

            reports:
              normalizedReports,

            monitoring:
              Array.isArray(
                monitoring
              )
                ? monitoring
                : [],

            analytics,

            riskMap:
              Array.isArray(
                riskMap
              )
                ? riskMap
                : [],

            emerging:
              Array.isArray(
                emerging
              )
                ? emerging
                : [],

            agents:
              Array.isArray(
                agents
              )
                ? agents
                : [],

            issues:
              Array.isArray(
                issues
              )
                ? issues
                : [],

            diseases:
              Array.isArray(
                diseases
              )
                ? diseases
                : [],
          });

        } catch (e) {
          setError(
            e?.message ||
              "Unable to load Medical Supervisor data."
          );
        } finally {
          setLoading(
            false
          );

          setRefreshing(
            false
          );
        }
      },
      [
        selectedWeek,
      ]
    );


  useEffect(
    () => {
      load(true);
    },
    []
  );


  // ==========================================================
  // CHANGE MONITORING WEEK
  // ==========================================================

  const handleWeekChange =
    useCallback(
      async (
        weekNumber
      ) => {
        if (
          weekNumber ===
            undefined ||
          weekNumber ===
            null ||
          weekNumber ===
            ""
        ) {
          return;
        }

        const numericWeek =
          Number(
            weekNumber
          );

        if (
          !Number.isFinite(
            numericWeek
          )
        ) {
          return;
        }

        try {
          setError("");

          setSelectedWeek(
            numericWeek
          );

          setMonitoringLoading(
            true
          );

          const monitoring =
            await api.getMedicalMonitoring(
              numericWeek
            );

          setData(
            (
              previous
            ) => ({
              ...previous,

              monitoring:
                Array.isArray(
                  monitoring
                )
                  ? monitoring
                  : [],
            })
          );

        } catch (e) {
          setError(
            e?.message ||
              "Unable to load the selected reporting week."
          );
        } finally {
          setMonitoringLoading(
            false
          );
        }
      },
      []
    );


  // ==========================================================
  // REMIND AGENT
  // ==========================================================

  const remindAgent =
    async (
      agent
    ) => {
      const agentId =
        agent?.agent_id ??
        agent?.id;

      if (
        agentId ===
          undefined ||
        agentId ===
          null
      ) {
        throw new Error(
          "Agent ID is missing."
        );
      }

      await api.remindSupervisorAgent(
        agentId
      );

      const monitoring =
        await api.getMedicalMonitoring(
          selectedWeek ||
            undefined
        );

      setData(
        (
          previous
        ) => ({
          ...previous,

          monitoring:
            Array.isArray(
              monitoring
            )
              ? monitoring
              : [],
        })
      );
    };


  // ==========================================================
  // SUBMIT AGENT ISSUE
  // ==========================================================

  const submitIssue =
    async (
      payload
    ) => {
      await api.submitAgentIssue(
        payload
      );

      /*
       * Reload all dashboard data so
       * Previously Filed Agent Complaints
       * immediately shows the new complaint.
       */

      await load(false);
    };


  // ==========================================================
  // REVIEW EMERGING DISEASE
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

      await load(false);
    };


  // ==========================================================
  // ALERT COUNT
  // ==========================================================

  const alertCount =
    (
      data.overview
        ?.high_risk_alerts ||
      0
    ) +
    (
      data.overview
        ?.pending_emerging_reviews ||
      0
    ) +
    (
      data.overview
        ?.pending_agent_submissions ||
      0
    );


  // ==========================================================
  // DISTRICT
  // ==========================================================

  const districtName =
    data.overview
      ?.supervisor_district
      ?.name ||
    data.overview
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
      alertCount={
        alertCount
      }
      districtName={
        districtName
      }
    >

      {/* ====================================================
          ERROR
          ==================================================== */}

      {error && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-[#F0CACA] bg-[#FFF5F5] px-4 py-3 text-[11px] text-[#C62828]">

          <div className="flex items-center gap-2">

            <AlertCircle
              size={15}
            />

            {error}

          </div>

          <button
            type="button"
            onClick={() =>
              load(true)
            }
            className="inline-flex items-center gap-2 rounded-lg border border-[#F0CACA] bg-white px-3 py-2 font-semibold"
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


      {/* ====================================================
          PAGE REFRESH
          ==================================================== */}

      {tab !==
        "home-relief" && (
        <div className="mb-3 flex justify-end">

          <button
            type="button"
            onClick={() =>
              load(true)
            }
            disabled={
              refreshing
            }
            className="inline-flex items-center gap-2 rounded-lg border border-[#DDE5E0] bg-white px-3 py-2 text-[10px] font-semibold text-[#52627D] hover:bg-[#F7FAF8] disabled:cursor-not-allowed disabled:opacity-60"
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


      {/* ====================================================
          CONTENT
          ==================================================== */}

      {loading ? (

        <Loading />

      ) : tab ===
        "overview" ? (

        <Overview
          data={
            data.overview
          }

          onReports={() =>
            setTab(
              "reports"
            )
          }

          onMonitoring={() =>
            setTab(
              "monitoring"
            )
          }

          onAlerts={() =>
            setTab(
              "alerts"
            )
          }
        />

      ) : tab ===
        "reports" ? (

        <DiseaseReports
          reports={
            data.reports
          }

          onRefresh={() =>
            load(true)
          }
        />

      ) : tab ===
        "monitoring" ? (

        <WeeklyMonitoring
          rows={
            data.monitoring
          }

          availableWeeks={
            availableWeeks
          }

          selectedWeek={
            selectedWeek
          }

          onWeekChange={
            handleWeekChange
          }

          onRemind={
            remindAgent
          }

          onRefresh={() =>
            load(true)
          }

          loading={
            monitoringLoading
          }
        />

      ) : tab ===
        "risk-map" ? (

        <RiskMap
          data={
            data.riskMap
          }
        />

      ) : tab ===
        "analytics" ? (

        <SurveillanceAnalytics
          data={
            data.analytics
          }
        />

      ) : tab ===
        "agents" ? (

        <AgentOversight
          agents={
            data.agents
          }

          issues={
            data.issues
          }

          reports={
            data.reports
          }

          onSubmitIssue={
            submitIssue
          }
        />

      ) : tab ===
        "alerts" ? (

        <Alerts
          alerts={
            data.overview
              ?.recent_alerts ||
            []
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