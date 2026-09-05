import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  AlertCircle,
  ArrowRight,
  ClipboardList,
  FileCheck2,
  FileText,
  Plus,
  ShieldCheck,
  UserCog,
  UserRound,
} from "lucide-react";

import { api } from "../../api";
import KpiCard from "../../components/admin/KpiCard";

import kodaguBanner from "../../assets/ui/admin-kodagu-banner.jpg";


/* ============================================================
   REFERENCE VALUES
============================================================ */

const REFERENCE_DATA = {
  reportsSubmitted: 186,
  reportsReviewed: 179,
  pendingReview: 7,

  activeAgents: 24,
  activeAgentsReporting: 22,

  supervisors: 4,

  pendingActions: 7,

  weeklyReportingRate: 96,

  agentIssues: 3,

  supervisorRequests: 2,
};


const REPORTING_VALUES = [
  68,
  112,
  154,
  176,
  198,
];


/* ============================================================
   ADMIN DASHBOARD
============================================================ */

export default function AdminDashboard({
  location,
  onNavigate,
}) {

  const [stats, setStats] =
    useState(null);

  const [activities, setActivities] =
    useState([]);

  const [agentIssues, setAgentIssues] =
    useState([]);

  const [loading, setLoading] =
    useState(true);


  /* ==========================================================
     LOAD DATA
  ========================================================== */

  const loadDashboard =
    useCallback(async () => {

      try {

        const [
          statsResult,
          activityResult,
          issuesResult,
        ] =
          await Promise.allSettled([

            api.getAdminStats(),

            api.getActivityLogs(),

            api.getAgentIssues(),

          ]);


        if (
          statsResult.status ===
          "fulfilled"
        ) {

          setStats(
            statsResult.value || {}
          );

        } else {

          setStats({});

        }


        if (
          activityResult.status ===
          "fulfilled"
        ) {

          const value =
            activityResult.value;

          setActivities(
            Array.isArray(value)
              ? value
              : Array.isArray(
                  value?.items
                )
                ? value.items
                : []
          );

        }


        if (
          issuesResult.status ===
          "fulfilled"
        ) {

          const value =
            issuesResult.value;

          setAgentIssues(
            Array.isArray(value)
              ? value
              : Array.isArray(
                  value?.items
                )
                ? value.items
                : []
          );

        }

      } finally {

        setLoading(false);

      }

    }, []);


  useEffect(() => {

    loadDashboard();

  }, [
    loadDashboard,
    location?.state?.id,
    location?.district?.id,
    location?.taluk?.id,
  ]);


  /* ==========================================================
     NORMALIZE API DATA
  ========================================================== */

  const data =
    useMemo(() => {

      const source =
        stats || {};


      return {

        reportsSubmitted:
          source.reports_submitted ??
          source.reports_received_this_week ??
          source.total_reports ??
          source.reports_this_week ??
          REFERENCE_DATA.reportsSubmitted,


        reportsReviewed:
          source.reports_reviewed ??
          source.reviewed_reports ??
          REFERENCE_DATA.reportsReviewed,


        pendingReview:
          source.pending_reports ??
          source.pending_reports_this_week ??
          REFERENCE_DATA.pendingReview,


        activeAgents:
          source.total_agents ??
          source.active_agents ??
          source.activeAgents ??
          REFERENCE_DATA.activeAgents,


        activeAgentsReporting:
          source.active_agents_reporting ??
          source.submitted_agents_this_week ??
          REFERENCE_DATA.activeAgentsReporting,


        supervisors:
          source.total_supervisors ??
          source.medical_supervisors ??
          source.supervisors ??
          REFERENCE_DATA.supervisors,


        pendingActions:
          source.pending_actions ??
          source.pendingActions ??
          source.pending_reports_this_week ??
          REFERENCE_DATA.pendingActions,


        weeklyReportingRate:
          source.weekly_reporting_rate ??
          source.reporting_coverage_percent ??
          source.reporting_rate ??
          REFERENCE_DATA.weeklyReportingRate,

      };

    }, [stats]);


  /* ==========================================================
     ISSUE COUNT
  ========================================================== */

  const issueCount =
    agentIssues.length > 0
      ? agentIssues.length
      : REFERENCE_DATA.agentIssues;


  /* ==========================================================
     ACTIVITY DATA
  ========================================================== */

  const activitiesForDisplay =
    useMemo(() => {

      if (!activities.length) {

        return [

          {
            time: "09:42 AM",
            title:
              "Agent account created",
            place: "Virajpet",
          },

          {
            time: "09:31 AM",
            title:
              "Disease report submitted",
            place: "Kodagu",
          },

          {
            time: "09:18 AM",
            title:
              "Supervisor assignment updated",
            place: "Madikeri",
          },

          {
            time: "08:54 AM",
            title:
              "Weekly report submitted",
            place: "Somwarpet",
          },

          {
            time: "08:30 AM",
            title:
              "Supervisor account activated",
            place: "Kodagu",
          },

        ];

      }


      return activities
        .slice(0, 5)
        .map(
          (item, index) => ({

            time:
              item.time ||
              item.created_at ||
              [
                "09:42 AM",
                "09:31 AM",
                "09:18 AM",
                "08:54 AM",
                "08:30 AM",
              ][index],

            title:
              item.title ||
              item.action ||
              item.activity ||
              "System activity",

            place:
              item.place ||
              item.location ||
              item.taluk_name ||
              item.district_name ||
              "Kodagu",

          })
        );

    }, [activities]);


  /* ==========================================================
     LOADING
  ========================================================== */

  if (loading) {

    return (
      <div className="admin-dashboard-loading">

        <div className="admin-loading-top" />

        <div className="admin-loading-kpis">

          {[1, 2, 3, 4].map(
            (item) => (
              <div
                key={item}
                className="admin-loading-card"
              />
            )
          )}

        </div>

        <div className="admin-loading-middle" />

        <div className="admin-loading-bottom" />

      </div>
    );

  }


  return (

    <div className="admin-dashboard">


      {/* =====================================================
          WELCOME AREA
      ===================================================== */}

      <section className="admin-welcome-row">


        {/* GREETING */}

        <div className="admin-welcome-copy">

          <h1>
            Good Morning, Monish{" "}
            <span>👋</span>
          </h1>

          <p>
            Here's the current
            system-wide surveillance
            summary.
          </p>

        </div>


        {/* KODAGU IMAGE */}

        <div className="admin-kodagu-banner">

          <img
            src={kodaguBanner}
            alt="Kodagu Karnataka landscape"
          />

        </div>

      </section>


      {/* =====================================================
          KPI CARDS
      ===================================================== */}

      <section className="admin-kpi-grid">


        <KpiCard
          label="REPORTS THIS MONTH"
          value={
            data.reportsSubmitted
          }
          note="Submitted reports"
          trend="↑ 21% vs last month"
          icon={FileText}
          tone="blue"
        />


        <KpiCard
          label="ACTIVE AGENTS"
          value={
            data.activeAgents
          }
          note="Currently operational"
          trend={`${data.activeAgentsReporting} reporting this week`}
          icon={UserRound}
          tone="green"
        />


        <KpiCard
          label="MEDICAL SUPERVISORS"
          value={
            data.supervisors
          }
          note="District supervisors"
          trend="All assignments active"
          icon={ShieldCheck}
          tone="green"
        />


        <KpiCard
          label="PENDING ACTIONS"
          value={
            data.pendingActions
          }
          note="Require administrator attention"
          trend="Requires administrator attention"
          icon={AlertCircle}
          tone="amber"
        />

      </section>


      {/* =====================================================
          REPORT OVERVIEW + PENDING ACTIONS
      ===================================================== */}

      <section className="admin-middle-grid">


        {/* ===================================================
            REPORT OVERVIEW
        =================================================== */}

        <section className="admin-panel admin-report-panel">

          <PanelTitle
            title="REPORT OVERVIEW"
          />


          <div className="admin-report-body">


            {/* METRICS */}

            <div className="admin-overview-metrics">


              <OverviewMetric
                icon={UserRound}
                label="Reports Submitted"
                value={
                  data.reportsSubmitted
                }
              />


              <OverviewMetric
                icon={FileCheck2}
                label="Reports Reviewed"
                value={
                  data.reportsReviewed
                }
              />


              <OverviewMetric
                icon={AlertCircle}
                label="Pending Review"
                value={
                  data.pendingReview
                }
                tone="orange"
              />


              <OverviewMetric
                icon={Activity}
                label="Rejected Reports"
                value="3"
                tone="red"
              />


              <OverviewMetric
                icon={Activity}
                label="Weekly Reporting Rate"
                value={`${data.weeklyReportingRate}%`}
                tone="green"
              />

            </div>


            {/* CHART */}

            <div className="admin-report-chart">

              <div className="admin-chart-title">

                <strong>
                  Reporting Activity
                </strong>

                <span>
                  (Last 5 Weeks)
                </span>

              </div>


              <ReportingChart />

            </div>

          </div>


          <PanelFooter
            label="View Full Overview"
            onClick={() =>
              onNavigate("monitoring")
            }
          />

        </section>


        {/* ===================================================
            PENDING ACTIONS
        =================================================== */}

        <section className="admin-panel admin-pending-panel">

          <PanelTitle
            title="PENDING ACTIONS"
          />


          <div className="admin-pending-list">


            <PendingAction
              icon={FileText}
              tone="orange"
              title={`${data.pendingReview} Disease Reports`}
              subtitle="Awaiting medical review"
              action="View Reports"
              onClick={() =>
                onNavigate("reports")
              }
            />


            <PendingAction
              icon={UserRound}
              tone="red"
              title={`${issueCount} Agent Issues`}
              subtitle="Need administrator attention"
              action="Manage Agents"
              onClick={() =>
                onNavigate("agents")
              }
            />


            <PendingAction
              icon={UserCog}
              tone="blue"
              title={`${REFERENCE_DATA.supervisorRequests} Supervisor Requests`}
              subtitle="Awaiting approval"
              action="Manage Supervisors"
              onClick={() =>
                onNavigate("supervisors")
              }
            />

          </div>


          <PanelFooter
            label="View All Actions"
            onClick={() =>
              onNavigate("reports")
            }
          />

        </section>

      </section>


      {/* =====================================================
          LOWER ROW
      ===================================================== */}

      <section className="admin-bottom-grid">


        {/* ===================================================
            SURVEILLANCE PULSE
        =================================================== */}

        <section className="admin-panel admin-pulse-panel">

          <PanelTitle
            title="SURVEILLANCE PULSE"
            icon={Activity}
          />


          <div className="admin-pulse-content">

            {activitiesForDisplay.map(
              (item, index) => (

                <PulseItem
                  key={`${item.time}-${index}`}
                  {...item}
                />

              )
            )}

          </div>


          <PanelFooter
            label="View All Activity"
            onClick={() =>
              onNavigate("activity")
            }
          />

        </section>


        {/* ===================================================
            RISK SUMMARY
        =================================================== */}

        <section className="admin-panel admin-risk-panel">

          <PanelTitle
            title="RISK SUMMARY"
          />


          <div className="admin-risk-content">

            <RiskDonut />


            <div className="admin-risk-legend">

              <RiskLegend
                color="#168B47"
                title="Low Risk"
                value="8 Taluks (32%)"
              />

              <RiskLegend
                color="#F4B400"
                title="Moderate Risk"
                value="10 Taluks (40%)"
              />

              <RiskLegend
                color="#F66A16"
                title="High Risk"
                value="5 Taluks (20%)"
              />

              <RiskLegend
                color="#D9232E"
                title="Very High Risk"
                value="2 Taluks (8%)"
              />

            </div>

          </div>


          <PanelFooter
            label="View Risk Map"
            onClick={() =>
              onNavigate("risk-map")
            }
          />

        </section>


        {/* ===================================================
            QUICK ACTIONS
        =================================================== */}

        <section className="admin-panel admin-quick-panel">

          <PanelTitle
            title="QUICK ACTIONS"
          />


          <div className="admin-quick-actions">


            <QuickAction
              icon={Plus}
              label="Add Agent"
              onClick={() =>
                onNavigate("agents")
              }
            />


            <QuickAction
              icon={Plus}
              label="Add Medical Supervisor"
              onClick={() =>
                onNavigate("supervisors")
              }
            />


            <QuickAction
              icon={ClipboardList}
              label="Review Reports"
              onClick={() =>
                onNavigate("reports")
              }
            />


            <QuickAction
              icon={FileText}
              label="Activity Logs"
              onClick={() =>
                onNavigate("activity")
              }
            />

          </div>

        </section>

      </section>

    </div>

  );

}


/* ============================================================
   PANEL TITLE
============================================================ */

function PanelTitle({
  title,
  icon: Icon,
}) {

  return (

    <div className="admin-panel-title">

      {Icon && (
        <Icon
          size={18}
          strokeWidth={1.8}
        />
      )}

      <h2>
        {title}
      </h2>

    </div>

  );

}


/* ============================================================
   PANEL FOOTER
============================================================ */

function PanelFooter({
  label,
  onClick,
}) {

  return (

    <div className="admin-panel-footer">

      <button
        type="button"
        onClick={onClick}
      >

        {label}

        <ArrowRight
          size={15}
          strokeWidth={1.8}
        />

      </button>

    </div>

  );

}


/* ============================================================
   OVERVIEW METRIC
============================================================ */

function OverviewMetric({
  icon: Icon,
  label,
  value,
  tone = "default",
}) {

  return (

    <div className="admin-overview-metric">

      <div className="admin-overview-left">

        <div
          className={`
            admin-overview-icon
            ${
              tone === "orange"
                ? "orange"
                : tone === "red"
                  ? "red"
                  : tone === "green"
                    ? "green"
                    : ""
            }
          `}
        >

          <Icon
            size={16}
            strokeWidth={1.7}
          />

        </div>


        <span>
          {label}
        </span>

      </div>


      <strong
        className={`
          ${
            tone === "orange"
              ? "orange"
              : tone === "red"
                ? "red"
                : tone === "green"
                  ? "green"
                  : ""
          }
        `}
      >
        {value}
      </strong>

    </div>

  );

}


/* ============================================================
   REPORTING CHART
============================================================ */

function ReportingChart() {

  const width = 500;

  const height = 160;

  const left = 38;

  const right = 10;

  const top = 12;

  const bottom = 27;

  const max = 240;


  const usableWidth =
    width - left - right;

  const usableHeight =
    height - top - bottom;


  const points =
    REPORTING_VALUES.map(
      (value, index) => {

        const x =
          left +
          (index /
            (REPORTING_VALUES.length - 1)) *
            usableWidth;


        const y =
          top +
          usableHeight -
          (value / max) *
            usableHeight;


        return {
          x,
          y,
        };

      }
    );


  const polyline =
    points
      .map(
        (point) =>
          `${point.x},${point.y}`
      )
      .join(" ");


  const areaPoints = [
    `${points[0].x},${height - bottom}`,

    ...points.map(
      (point) =>
        `${point.x},${point.y}`
    ),

    `${points.at(-1).x},${height - bottom}`,
  ].join(" ");


  return (

    <svg
      className="admin-reporting-chart"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >


      {[0, 60, 120, 180, 240].map(
        (value) => {

          const y =
            top +
            usableHeight -
            (value / max) *
              usableHeight;


          return (

            <g key={value}>

              <line
                x1={left}
                x2={width - right}
                y1={y}
                y2={y}
                stroke="#E7ECE9"
                strokeWidth="1"
              />


              <text
                x="0"
                y={y + 3}
                fontSize="9"
                fill="#788597"
              >
                {value}
              </text>

            </g>

          );

        }
      )}


      <polygon
        points={areaPoints}
        fill="rgba(22,139,71,.08)"
      />


      <polyline
        points={polyline}
        fill="none"
        stroke="#168B47"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />


      {points.map(
        (point, index) => (

          <g key={index}>

            <circle
              cx={point.x}
              cy={point.y}
              r="3.5"
              fill="#FFFFFF"
              stroke="#168B47"
              strokeWidth="2"
            />


            <text
              x={point.x}
              y={height - 8}
              textAnchor="middle"
              fontSize="9"
              fill="#6E7B8E"
            >
              W{index + 1}
            </text>

          </g>

        )
      )}

    </svg>

  );

}


/* ============================================================
   PENDING ACTION
============================================================ */

function PendingAction({
  icon: Icon,
  tone,
  title,
  subtitle,
  action,
  onClick,
}) {

  const style = {

    orange: {
      background: "#FFF0E8",
      color: "#F05A18",
    },

    red: {
      background: "#FFF0F1",
      color: "#D92A36",
    },

    blue: {
      background: "#F0EDFF",
      color: "#6755D9",
    },

  }[tone];


  return (

    <div className="admin-pending-action">

      <div
        className="admin-pending-icon"
        style={{
          backgroundColor:
            style.background,
          color:
            style.color,
        }}
      >

        <Icon
          size={19}
          strokeWidth={1.7}
        />

      </div>


      <div className="admin-pending-copy">

        <strong>
          {title}
        </strong>

        <span>
          {subtitle}
        </span>

      </div>


      <button
        type="button"
        onClick={onClick}
      >

        {action}

        <ArrowRight
          size={15}
        />

      </button>

    </div>

  );

}


/* ============================================================
   SURVEILLANCE PULSE ITEM
============================================================ */

function PulseItem({
  time,
  title,
  place,
}) {

  return (

    <div className="admin-pulse-item">


      <div className="admin-pulse-time">

        <span className="admin-pulse-dot" />

        <span>
          {formatTime(time)}
        </span>

      </div>


      <div className="admin-pulse-vertical" />


      <div className="admin-pulse-description">

        <strong>
          {title}
        </strong>

        <span>
          {place}
        </span>

      </div>

    </div>

  );

}


/* ============================================================
   RISK DONUT
============================================================ */

function RiskDonut() {

  return (

    <div className="admin-risk-donut-wrapper">

      <svg
        viewBox="0 0 120 120"
        className="admin-risk-donut"
      >

        <circle
          cx="60"
          cy="60"
          r="42"
          fill="none"
          stroke="#EEF1EE"
          strokeWidth="18"
        />


        <circle
          cx="60"
          cy="60"
          r="42"
          fill="none"
          stroke="#168B47"
          strokeWidth="18"
          strokeDasharray="84.44 263.89"
          strokeDashoffset="0"
          transform="rotate(-90 60 60)"
        />


        <circle
          cx="60"
          cy="60"
          r="42"
          fill="none"
          stroke="#F4B400"
          strokeWidth="18"
          strokeDasharray="105.56 263.89"
          strokeDashoffset="-84.44"
          transform="rotate(-90 60 60)"
        />


        <circle
          cx="60"
          cy="60"
          r="42"
          fill="none"
          stroke="#F66A16"
          strokeWidth="18"
          strokeDasharray="52.78 263.89"
          strokeDashoffset="-190"
          transform="rotate(-90 60 60)"
        />


        <circle
          cx="60"
          cy="60"
          r="42"
          fill="none"
          stroke="#D9232E"
          strokeWidth="18"
          strokeDasharray="21.11 263.89"
          strokeDashoffset="-242.78"
          transform="rotate(-90 60 60)"
        />

      </svg>

    </div>

  );

}


/* ============================================================
   RISK LEGEND
============================================================ */

function RiskLegend({
  color,
  title,
  value,
}) {

  return (

    <div className="admin-risk-item">

      <span
        className="admin-risk-dot"
        style={{
          backgroundColor:
            color,
        }}
      />


      <div>

        <strong>
          {title}
        </strong>

        <span>
          {value}
        </span>

      </div>

    </div>

  );

}


/* ============================================================
   QUICK ACTION
============================================================ */

function QuickAction({
  icon: Icon,
  label,
  onClick,
}) {

  return (

    <button
      type="button"
      className="admin-quick-action"
      onClick={onClick}
    >

      <Icon
        size={21}
        strokeWidth={1.6}
      />

      <span>
        {label}
      </span>

    </button>

  );

}


/* ============================================================
   TIME FORMAT
============================================================ */

function formatTime(value) {

  if (!value) {
    return "";
  }


  if (
    typeof value ===
    "string"
  ) {

    if (
      value.includes("AM") ||
      value.includes("PM")
    ) {

      return value;

    }

  }


  try {

    const date =
      new Date(value);


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return String(value);

    }


    return new Intl.DateTimeFormat(
      "en-US",
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }
    ).format(date);

  } catch {

    return String(value);

  }

}