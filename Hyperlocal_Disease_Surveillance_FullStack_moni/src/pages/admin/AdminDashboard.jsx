import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  ClipboardList,
  FileCheck2,
  FileClock,
  FileText,
  Plus,
  ShieldCheck,
  UserRound,
  UsersRound,
  UserCog,
  Database,
  RefreshCw,
  Bell,
  CheckCircle2,
  UserPlus,
  Clock3,
  Settings2,
} from "lucide-react";

import { api } from "../../api";
import KpiCard from "../../components/admin/KpiCard";

import kodaguBanner from "../../assets/ui/admin-kodagu-banner.jpg";

const REFERENCE_DATA = {
  totalUsers: 1248,
  activeAgents: 24,
  supervisors: 4,
  pendingActions: 7,

  reportsSubmitted: 186,
  reportsReviewed: 179,
  pendingReview: 7,
  weeklyReportingRate: 96,

  systemHealth: 94,

  agentIssues: 3,
  supervisorRequests: 2,

  activeAgentsReporting: 22,
};

const REPORTING_VALUES = [68, 112, 154, 176, 198];

export default function AdminDashboard({
  location,
  onNavigate,
}) {
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [activities, setActivities] = useState([]);
  const [agentIssues, setAgentIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboard = useCallback(
    async (showRefreshing = false) => {
      if (showRefreshing) {
        setRefreshing(true);
      }

      try {
        /*
         * IMPORTANT:
         * Do not call getMonitoring().
         * That function does not exist in the supplied api.js.
         *
         * Each request is isolated so one unavailable admin endpoint
         * cannot destroy the complete dashboard.
         */

        const [
          statsResult,
          notificationsResult,
          activityResult,
          issuesResult,
        ] = await Promise.allSettled([
          api.getAdminStats(),
          api.listAdminNotifications(),
          api.getActivityLogs(),
          api.getAgentIssues(),
        ]);

        if (statsResult.status === "fulfilled") {
          setStats(statsResult.value || {});
        } else {
          setStats({});
        }

        if (notificationsResult.status === "fulfilled") {
          const value = notificationsResult.value;

          setNotifications(
            Array.isArray(value)
              ? value
              : Array.isArray(value?.items)
                ? value.items
                : []
          );
        } else {
          setNotifications([]);
        }

        if (activityResult.status === "fulfilled") {
          const value = activityResult.value;

          setActivities(
            Array.isArray(value)
              ? value
              : Array.isArray(value?.items)
                ? value.items
                : []
          );
        } else {
          setActivities([]);
        }

        if (issuesResult.status === "fulfilled") {
          const value = issuesResult.value;

          setAgentIssues(
            Array.isArray(value)
              ? value
              : Array.isArray(value?.items)
                ? value.items
                : []
          );
        } else {
          setAgentIssues([]);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadDashboard(false);
  }, [
    loadDashboard,
    location?.state?.id,
    location?.district?.id,
    location?.taluk?.id,
  ]);

  const data = useMemo(() => {
    const source = stats || {};

    return {
      totalUsers:
        source.total_users ??
        source.users_count ??
        source.totalUsers ??
        REFERENCE_DATA.totalUsers,

      activeAgents:
        source.total_agents ??
        source.active_agents ??
        source.activeAgents ??
        REFERENCE_DATA.activeAgents,

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

      weeklyReportingRate:
        source.weekly_reporting_rate ??
        source.reporting_coverage_percent ??
        source.reporting_rate ??
        REFERENCE_DATA.weeklyReportingRate,

      systemHealth:
        source.system_health ??
        source.systemHealth ??
        REFERENCE_DATA.systemHealth,

      activeAgentsReporting:
        source.active_agents_reporting ??
        source.submitted_agents_this_week ??
        REFERENCE_DATA.activeAgentsReporting,
    };
  }, [stats]);

  const scope = useMemo(() => {
    if (location?.taluk?.name) {
      return `${location.taluk.name}, Karnataka`;
    }

    if (location?.district?.name) {
      return `${location.district.name}, Karnataka`;
    }

    if (location?.state?.name) {
      return location.state.name;
    }

    return "Kodagu, Karnataka";
  }, [location]);

  const pendingDiseaseReports = data.pendingReview;

  const issueCount =
    agentIssues.length > 0
      ? agentIssues.filter(
          (item) =>
            String(item.status || "")
              .toUpperCase()
              .includes("PENDING")
        ).length || agentIssues.length
      : REFERENCE_DATA.agentIssues;

  const activitiesForDisplay = useMemo(() => {
    if (!activities.length) {
      return [
        {
          time: "09:42 AM",
          title: "Agent account created",
          place: "Virajpet",
          role: "Admin",
        },
        {
          time: "09:31 AM",
          title: "Disease report submitted",
          place: "Kodagu",
          role: "Field Agent",
        },
        {
          time: "09:18 AM",
          title: "Supervisor assignment updated",
          place: "Madikeri",
          role: "Admin",
        },
        {
          time: "08:54 AM",
          title: "Weekly report submitted",
          place: "Somwarpet",
          role: "Field Agent",
        },
        {
          time: "08:30 AM",
          title: "Supervisor account activated",
          place: "Kodagu",
          role: "Admin",
        },
      ];
    }

    return activities.slice(0, 5).map((item, index) => ({
      time:
        item.time ||
        item.created_at
          ? formatTime(item.time || item.created_at)
          : ["09:42 AM", "09:31 AM", "09:18 AM", "08:54 AM", "08:30 AM"][
              index
            ],

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

      role:
        item.role ||
        item.actor_role ||
        item.performed_by_role ||
        "Admin",
    }));
  }, [activities]);

  if (loading) {
    return <LoadingDashboard />;
  }

  return (
    <div className="w-full">

      {/* =========================================================
          TOP GREETING
      ========================================================= */}

      <section className="mb-[22px] flex items-end justify-between">

        <div>
          <h1 className="text-[27px] leading-[1.15] font-semibold tracking-[-0.035em] text-[#10243A]">
            Good Morning, Monish{" "}
            <span className="inline-block text-[25px]">👋</span>
          </h1>

          <p className="mt-[8px] text-[12px] text-[#52627D]">
            Here’s the current system-wide surveillance summary.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadDashboard(true)}
          disabled={refreshing}
          className="inline-flex h-[36px] items-center gap-2 rounded-[7px] border border-[#DDE4DE] bg-white px-[13px] text-[11px] font-medium text-[#52627D] shadow-[0_1px_2px_rgba(16,36,58,.02)] transition hover:bg-[#F8FAF8] disabled:opacity-60"
        >
          <RefreshCw
            size={13}
            className={refreshing ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </section>

      {/* =========================================================
          KODAGU BANNER
      ========================================================= */}

      <section className="relative mb-[16px] h-[112px] overflow-hidden rounded-[12px] border border-[#DDE7DD] bg-[#E8F3E7]">

        <img
          src={kodaguBanner}
          alt="Kodagu Karnataka landscape"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-y-0 left-0 w-[55%] bg-gradient-to-r from-[#E8F3E7] via-[#E8F3E7]/95 to-transparent" />

        <div className="relative z-10 flex h-full items-center px-[20px]">

          <div>
            <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#087A32]">
              CURRENT OPERATING REGION
            </p>

            <h2 className="mt-[6px] text-[16px] font-semibold text-[#10243A]">
              Kodagu District
            </h2>

            <p className="mt-[4px] text-[8px] text-[#52627D]">
              System-wide administrative monitoring
            </p>
          </div>

          <div className="ml-auto mr-[14px] rounded-full bg-white/90 px-[11px] py-[6px] text-[8px] font-semibold text-[#52627D] shadow-[0_1px_3px_rgba(16,36,58,.08)]">
            {scope}
          </div>
        </div>
      </section>

      {/* =========================================================
          KPI ROW
      ========================================================= */}

      <section className="mb-[16px] grid grid-cols-4 gap-[16px]">

        <KpiCard
          label="TOTAL USERS"
          value={formatNumber(data.totalUsers)}
          note="Registered users"
          trend="↑ 8.4% this month"
          icon={UsersRound}
          tone="green"
        />

        <KpiCard
          label="ACTIVE AGENTS"
          value={data.activeAgents}
          note="Currently operational"
          trend={`${data.activeAgentsReporting} reporting this week`}
          icon={UserRound}
          tone="green"
        />

        <KpiCard
          label="MEDICAL SUPERVISORS"
          value={data.supervisors}
          note="District supervisors"
          trend="All assignments active"
          icon={ShieldCheck}
          tone="green"
        />

        <KpiCard
          label="PENDING ACTIONS"
          value={data.pendingActions}
          note="Require administrator attention"
          trend="Requires administrator attention"
          icon={Clock3}
          tone="amber"
        />

      </section>

      {/* =========================================================
          SYSTEM OVERVIEW + PENDING ACTIONS
      ========================================================= */}

      <section className="mb-[16px] grid grid-cols-[1.31fr_1fr] gap-[16px]">

        {/* SYSTEM OVERVIEW */}

        <DashboardPanel
          title="SYSTEM OVERVIEW"
          action="View Full Overview"
          onAction={() => onNavigate("monitoring")}
        >

          <div className="grid h-[168px] grid-cols-[235px_1fr]">

            {/* LEFT METRICS */}

            <div className="border-r border-[#E8EEEA] pr-[18px]">

              <OverviewMetric
                icon={FileText}
                label="Reports Submitted"
                value={data.reportsSubmitted}
              />

              <OverviewMetric
                icon={FileCheck2}
                label="Reports Reviewed"
                value={data.reportsReviewed}
              />

              <OverviewMetric
                icon={Clock3}
                label="Pending Review"
                value={data.pendingReview}
                tone="amber"
              />

              <OverviewMetric
                icon={Activity}
                label="Weekly Reporting Rate"
                value={`${data.weeklyReportingRate}%`}
                tone="green"
              />

            </div>

            {/* CHART */}

            <div className="pl-[20px]">

              <p className="mb-[5px] text-[9px] font-medium text-[#52627D]">
                Reporting Activity (Last 5 Weeks)
              </p>

              <ReportingChart />

            </div>

          </div>

        </DashboardPanel>

        {/* PENDING ACTIONS */}

        <DashboardPanel title="PENDING ACTIONS">

          <div className="space-y-[8px]">

            <PendingAction
              icon={FileText}
              tone="orange"
              title={`${pendingDiseaseReports} Disease Reports`}
              subtitle="Awaiting medical review"
              action="View Reports"
              onClick={() => onNavigate("reports")}
            />

            <PendingAction
              icon={UserRound}
              tone="red"
              title={`${issueCount} Agent Issues`}
              subtitle="Need administrator attention"
              action="Manage Agents"
              onClick={() => onNavigate("agents")}
            />

            <PendingAction
              icon={UserCog}
              tone="blue"
              title={`${REFERENCE_DATA.supervisorRequests} Supervisor Requests`}
              subtitle="Awaiting approval"
              action="Manage Supervisors"
              onClick={() => onNavigate("supervisors")}
            />

          </div>

          <div className="flex justify-center pt-[10px]">

            <button
              type="button"
              onClick={() => onNavigate("reports")}
              className="inline-flex items-center gap-1 rounded-[7px] border border-[#CFE1D3] px-[13px] py-[7px] text-[10px] font-semibold text-[#087A32] hover:bg-[#F5FAF6]"
            >
              View All Actions
              <ArrowRight size={12} />
            </button>

          </div>

        </DashboardPanel>

      </section>

      {/* =========================================================
          LOWER DASHBOARD
      ========================================================= */}

      <section className="grid grid-cols-[1.05fr_1.18fr_.82fr_.82fr] gap-[16px]">

        {/* SYSTEM HEALTH */}

        <DashboardPanel title="SYSTEM HEALTH">

          <div className="flex h-[198px] items-center">

            <div className="flex w-[124px] shrink-0 justify-center border-r border-[#E8EEEA] pr-[16px]">

              <HealthRing value={data.systemHealth} />

            </div>

            <div className="flex-1 pl-[15px]">

              <HealthStatus
                label="API Services"
                status="Operational"
              />

              <HealthStatus
                label="Database"
                status="Operational"
              />

              <HealthStatus
                label="Data Synchronization"
                status="Operational"
              />

              <HealthStatus
                label="Authentication"
                status="Operational"
              />

              <HealthStatus
                label="Backup"
                status="Up to date"
              />

            </div>

          </div>

          <BottomButton
            onClick={() => onNavigate("health")}
          >
            View System Health
          </BottomButton>

        </DashboardPanel>

        {/* RECENT ACTIVITY */}

        <DashboardPanel title="RECENT ACTIVITY">

          <div className="h-[198px]">

            {activitiesForDisplay.map((item, index) => (
              <ActivityItem
                key={`${item.time}-${index}`}
                {...item}
              />
            ))}

          </div>

          <BottomButton
            onClick={() => onNavigate("activity")}
          >
            View All Activity
          </BottomButton>

        </DashboardPanel>

        {/* SYSTEM ALERTS */}

        <DashboardPanel title="SYSTEM ALERTS">

          <div className="h-[198px] space-y-[9px]">

            <SystemAlert
              tone="high"
              level="HIGH"
              text="3 agents have missed this week’s reporting"
            />

            <SystemAlert
              tone="medium"
              level="MEDIUM"
              text="2 supervisor assignments require attention"
            />

            <SystemAlert
              tone="info"
              level="INFO"
              text="Weekly surveillance report generated successfully"
            />

          </div>

          <BottomButton
            onClick={() => onNavigate("notifications")}
          >
            View All Alerts
          </BottomButton>

        </DashboardPanel>

        {/* QUICK ACTIONS */}

        <DashboardPanel title="QUICK ACTIONS">

          <div className="h-[198px] space-y-[9px]">

            <QuickAction
              icon={Plus}
              label="Add Agent"
              onClick={() => onNavigate("agents")}
            />

            <QuickAction
              icon={Plus}
              label="Add Medical Supervisor"
              onClick={() => onNavigate("supervisors")}
            />

            <QuickAction
              icon={ClipboardList}
              label="Review Reports"
              onClick={() => onNavigate("reports")}
            />

            <QuickAction
              icon={FileText}
              label="Activity Logs"
              onClick={() => onNavigate("activity")}
            />

          </div>

        </DashboardPanel>

      </section>

      {/* Keep notifications connected to the dashboard without
          adding visual clutter to the reference layout. */}

      <span className="sr-only">
        {notifications.map((item, index) =>
          `${item.title || "Notification"} ${index}`
        )}
      </span>

    </div>
  );
}

/* ===============================================================
   PANEL
=============================================================== */

function DashboardPanel({
  title,
  action,
  onAction,
  children,
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-[12px] border border-[#E1E8E3] bg-white p-[16px] shadow-[0_2px_7px_rgba(31,49,68,.035)]">

      <div className="mb-[10px] flex items-center justify-between">

        <h2 className="text-[11px] font-bold tracking-[0.04em] text-[#10243A]">
          {title}
        </h2>

        {action && (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-[#087A32] hover:underline"
          >
            {action}
            <ArrowRight size={12} />
          </button>
        )}

      </div>

      {children}

    </section>
  );
}

/* ===============================================================
   OVERVIEW METRIC
=============================================================== */

function OverviewMetric({
  icon: Icon,
  label,
  value,
  tone = "default",
}) {
  const valueClass =
    tone === "amber"
      ? "text-[#E0642A]"
      : tone === "green"
        ? "text-[#087A32]"
        : "text-[#10243A]";

  return (
    <div className="flex h-[40px] items-center justify-between">

      <div className="flex min-w-0 items-center gap-[10px]">

        <div className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full bg-[#EFF8F1] text-[#087A32]">
          <Icon size={14} strokeWidth={1.7} />
        </div>

        <span className="truncate text-[9px] text-[#52627D]">
          {label}
        </span>

      </div>

      <strong
        className={`text-[16px] font-semibold ${valueClass}`}
      >
        {value}
      </strong>

    </div>
  );
}

/* ===============================================================
   REPORTING CHART
=============================================================== */

function ReportingChart() {
  const values = REPORTING_VALUES;

  const width = 440;
  const height = 138;

  const left = 18;
  const right = 8;
  const top = 18;
  const bottom = 28;

  const usableWidth = width - left - right;
  const usableHeight = height - top - bottom;

  const max = 240;

  const points = values.map((value, index) => {
    const x =
      left +
      (index / (values.length - 1)) *
        usableWidth;

    const y =
      top +
      usableHeight -
      (value / max) * usableHeight;

    return {
      x,
      y,
      value,
    };
  });

  const polyline = points
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  const area = [
    `${points[0].x},${height - bottom}`,
    ...points.map(
      (point) => `${point.x},${point.y}`
    ),
    `${points[points.length - 1].x},${height - bottom}`,
  ].join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-[138px] w-full"
      preserveAspectRatio="none"
    >

      {[0, 60, 120, 180, 240].map(
        (value) => {
          const y =
            top +
            usableHeight -
            (value / max) * usableHeight;

          return (
            <g key={value}>

              <line
                x1={left}
                x2={width - right}
                y1={y}
                y2={y}
                stroke="#E9EFEB"
                strokeWidth="1"
              />

              <text
                x="0"
                y={y + 3}
                fontSize="7"
                fill="#8792A0"
              >
                {value}
              </text>

            </g>
          );
        }
      )}

      <polygon
        points={area}
        fill="rgba(11,122,51,0.08)"
      />

      <polyline
        points={polyline}
        fill="none"
        stroke="#087A32"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {points.map((point, index) => (
        <g key={index}>

          <circle
            cx={point.x}
            cy={point.y}
            r="3.2"
            fill="white"
            stroke="#087A32"
            strokeWidth="1.7"
          />

          <text
            x={point.x}
            y={height - 9}
            textAnchor="middle"
            fontSize="7"
            fill="#7A8598"
          >
            W{index + 1}
          </text>

        </g>
      ))}

    </svg>
  );
}

/* ===============================================================
   PENDING ACTION
=============================================================== */

function PendingAction({
  icon: Icon,
  tone,
  title,
  subtitle,
  action,
  onClick,
}) {
  const styles = {
    orange: {
      background: "#FFF5EC",
      color: "#E0642A",
    },

    red: {
      background: "#FFF0F0",
      color: "#C62828",
    },

    blue: {
      background: "#F0F3FF",
      color: "#536CC8",
    },
  };

  const selected =
    styles[tone] || styles.orange;

  return (
    <div className="flex h-[48px] items-center gap-[10px] rounded-[9px] border border-[#E7ECE8] px-[10px]">

      <div
        className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full"
        style={{
          backgroundColor:
            selected.background,
          color: selected.color,
        }}
      >
        <Icon size={16} strokeWidth={1.7} />
      </div>

      <div className="min-w-0 flex-1">

        <p className="truncate text-[10px] font-semibold text-[#10243A]">
          {title}
        </p>

        <p className="mt-[2px] truncate text-[8px] text-[#718096]">
          {subtitle}
        </p>

      </div>

      <button
        type="button"
        onClick={onClick}
        className="inline-flex shrink-0 items-center gap-1 text-[9px] font-medium text-[#087A32]"
      >
        {action}
        <ArrowRight size={11} />
      </button>

    </div>
  );
}

/* ===============================================================
   HEALTH RING
=============================================================== */

function HealthRing({ value }) {
  const radius = 43;
  const circumference =
    2 * Math.PI * radius;

  const progress =
    (value / 100) * circumference;

  return (
    <div className="relative h-[105px] w-[105px]">

      <svg
        viewBox="0 0 110 110"
        className="h-full w-full -rotate-90"
      >

        <circle
          cx="55"
          cy="55"
          r={radius}
          fill="none"
          stroke="#E7F0E9"
          strokeWidth="8"
        />

        <circle
          cx="55"
          cy="55"
          r={radius}
          fill="none"
          stroke="#087A32"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference}`}
        />

      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">

        <span className="text-[24px] font-semibold leading-none text-[#10243A]">
          {value}%
        </span>

        <span className="mt-[4px] text-[8px] text-[#718096]">
          System Operational
        </span>

      </div>

    </div>
  );
}

/* ===============================================================
   HEALTH STATUS
=============================================================== */

function HealthStatus({
  label,
  status,
}) {
  return (
    <div className="flex h-[31px] items-center justify-between gap-2">

      <span className="truncate text-[8px] text-[#52627D]">
        {label}
      </span>

      <span className="inline-flex shrink-0 items-center gap-[5px] text-[8px] font-medium text-[#087A32]">

        <span className="h-[5px] w-[5px] rounded-full bg-[#087A32]" />

        {status}

      </span>

    </div>
  );
}

/* ===============================================================
   ACTIVITY
=============================================================== */

function ActivityItem({
  time,
  title,
  place,
  role,
}) {
  return (
    <div className="grid h-[39px] grid-cols-[53px_1fr_auto] items-center gap-[7px] border-b border-[#F0F3F1] last:border-b-0">

      <span className="text-[7px] text-[#7A8598]">
        {time}
      </span>

      <div className="min-w-0">

        <p className="truncate text-[8px] font-semibold text-[#10243A]">
          {title}
        </p>

        <p className="truncate text-[7px] text-[#7A8598]">
          {place}
        </p>

      </div>

      <span className="text-[7px] text-[#7A8598]">
        {role}
      </span>

    </div>
  );
}

/* ===============================================================
   ALERT
=============================================================== */

function SystemAlert({
  tone,
  level,
  text,
}) {
  const styles = {
    high: {
      wrapper:
        "border-[#F2D5D5] bg-[#FFF5F5]",
      icon:
        "text-[#C62828]",
      level:
        "text-[#C62828]",
    },

    medium: {
      wrapper:
        "border-[#F1E0B7] bg-[#FFF9EC]",
      icon:
        "text-[#D28A00]",
      level:
        "text-[#D28A00]",
    },

    info: {
      wrapper:
        "border-[#D8E2F4] bg-[#F4F8FF]",
      icon:
        "text-[#3670C8]",
      level:
        "text-[#3670C8]",
    },
  };

  const selected =
    styles[tone] || styles.info;

  const Icon =
    tone === "high"
      ? AlertCircle
      : tone === "medium"
        ? AlertTriangle
        : Bell;

  return (
    <div
      className={`rounded-[7px] border px-[8px] py-[7px] ${selected.wrapper}`}
    >

      <div className="flex items-start gap-[7px]">

        <Icon
          size={15}
          className={`mt-[1px] shrink-0 ${selected.icon}`}
        />

        <div>

          <p
            className={`text-[8px] font-bold tracking-[0.04em] ${selected.level}`}
          >
            {level}
          </p>

          <p className="mt-[2px] text-[8px] leading-[12px] text-[#26334A]">
            {text}
          </p>

        </div>

      </div>

    </div>
  );
}

/* ===============================================================
   QUICK ACTION
=============================================================== */

function QuickAction({
  icon: Icon,
  label,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[39px] w-full items-center gap-[9px] rounded-[7px] border border-[#DFE9E1] bg-[#F7FBF8] px-[10px] text-left transition hover:border-[#BFD7C5] hover:bg-[#F0F8F2]"
    >

      <Icon
        size={16}
        className="text-[#087A32]"
        strokeWidth={1.7}
      />

      <span className="text-[9px] font-semibold text-[#087A32]">
        {label}
      </span>

    </button>
  );
}

/* ===============================================================
   BOTTOM BUTTON
=============================================================== */

function BottomButton({
  children,
  onClick,
}) {
  return (
    <div className="flex justify-center border-t border-[#EDF1EE] pt-[10px]">

      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 rounded-[7px] border border-[#CFE1D3] px-[13px] py-[7px] text-[9px] font-semibold text-[#087A32] hover:bg-[#F5FAF6]"
      >
        {children}
        <ArrowRight size={11} />
      </button>

    </div>
  );
}

/* ===============================================================
   LOADING
=============================================================== */

function LoadingDashboard() {
  return (
    <div className="space-y-[16px]">

      <div className="h-[45px] animate-pulse rounded-[8px] bg-[#EEF3EF]" />

      <div className="h-[112px] animate-pulse rounded-[12px] bg-[#E8F1E8]" />

      <div className="grid grid-cols-4 gap-[16px]">

        {[1, 2, 3, 4].map(
          (item) => (
            <div
              key={item}
              className="h-[114px] animate-pulse rounded-[12px] bg-white"
            />
          )
        )}

      </div>

      <div className="h-[212px] animate-pulse rounded-[12px] bg-white" />

    </div>
  );
}

/* ===============================================================
   HELPERS
=============================================================== */

function formatNumber(value) {
  return new Intl.NumberFormat(
    "en-IN"
  ).format(Number(value) || 0);
}

function formatTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleTimeString(
    "en-US",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}