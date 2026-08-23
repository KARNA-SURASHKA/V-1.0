import { useEffect, useState } from "react";

import {
  Users,
  FileCheck2,
  FileClock,
  MapPinned,
  AlertTriangle,
  BrainCircuit,
  BellRing,
  Activity,
} from "lucide-react";

import { api } from "../../api";

import KpiCard from "../../components/admin/KpiCard";
import AttentionCard from "../../components/admin/AttentionCard";

export default function AdminDashboard({
  location,
  onNavigate,
}) {
  const [stats, setStats] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {

    Promise.all([
      api.getAdminStats({
        state_id: location.state?.id,
        district_id: location.district?.id,
        taluk_id: location.taluk?.id,
      }),

      api.getLatestPredictions({
        state_id: location.state?.id,
        district_id: location.district?.id,
        taluk_id: location.taluk?.id,
      }),

      api.listAdminNotifications({
        state_id: location.state?.id,
        district_id: location.district?.id,
        taluk_id: location.taluk?.id,
      }),
    ])

      .then(([statsData, predictionData, notificationData]) => {

        setStats(statsData);
        setPredictions(predictionData);
        setNotifications(notificationData);

      })

      .catch((e) => {
        setError(e.message);
      });

  }, [
    location.state?.id,
    location.district?.id,
    location.taluk?.id,
  ]);

  if (error) {
    return (
      <ErrorState message={error} />
    );
  }

  if (!stats) {
    return (
      <LoadingState />
    );
  }

  const highRisk = predictions.filter(
    (p) =>
      ["High", "Critical"].includes(
        p.risk_level
      )
  );

  const contextLabel =
    location.taluk?.name ||
    location.district?.name ||
    location.state?.name ||
    "All available locations";

  let contextValue = stats.total_taluks;

  let contextLabelText =
    "Taluks in scope";

  if (location.taluk) {

    const topRisk = predictions.find(
      (p) =>
        [
          "Critical",
          "High",
          "Moderate",
          "Low",
        ].includes(p.risk_level)
    );

    contextValue =
      topRisk?.risk_level || "—";

    contextLabelText = "Current risk";

  } else if (location.district) {

    contextLabelText =
      "Taluks in district";

  } else if (location.state) {

    contextLabelText =
      "Taluks in state";

  }

  return (
    <div>

      <div className="mb-5">

        <p className="text-[12px] text-[#7A8598]">
          Current scope
        </p>

        <h2 className="text-[20px] font-semibold text-[#1F3144] mt-0.5">
          {contextLabel}
        </h2>

      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        <KpiCard
          label="Active Agents"
          value={stats.total_agents}
          icon={Users}
          note="Assigned within this scope"
        />

        <KpiCard
          label="Reports Received"
          value={stats.reports_received_this_week}
          icon={FileCheck2}
          note="Current reporting week"
        />

        <KpiCard
          label="Pending Reports"
          value={stats.pending_reports_this_week}
          icon={FileClock}
          tone={
            stats.pending_reports_this_week
              ? "amber"
              : "green"
          }
          note="Current reporting week"
        />

        <KpiCard
          label={contextLabelText}
          value={contextValue}
          icon={
            location.taluk
              ? Activity
              : MapPinned
          }
          tone={
            location.taluk
              ? "red"
              : "slate"
          }
          note={
            location.taluk
              ? "Latest available prediction risk"
              : "Based on selected location"
          }
        />

      </div>

      <div className="flex items-end justify-between mt-8 mb-4">

        <div>

          <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-[#9A9489]">
            Command center
          </p>

          <h2 className="text-[18px] font-semibold text-[#1F3144] mt-1">
            Attention Required
          </h2>

        </div>

        <p className="text-[12px] text-[#9A9489] hidden sm:block">
          Actionable signals for {contextLabel}
        </p>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <AttentionCard
          icon={AlertTriangle}
          title="Pending Reports"
          tone={
            stats.pending_reports_this_week
              ? "warning"
              : "success"
          }
          action="View Weekly Monitoring"
          onClick={() =>
            onNavigate("monitoring")
          }
        >
          {stats.pending_reports_this_week
            ? `${stats.pending_reports_this_week} taluk${
                stats.pending_reports_this_week === 1
                  ? ""
                  : "s"
              } have not submitted this week's report.`
            : "All taluks in the selected scope have submitted this week's report."}
        </AttentionCard>

        <AttentionCard
          icon={MapPinned}
          title="High Risk Areas"
          tone={
            highRisk.length
              ? "danger"
              : "success"
          }
          action="View Risk Map"
          onClick={() =>
            onNavigate("risk-map")
          }
        >
          {highRisk.length
            ? `${highRisk.length} high-risk prediction${
                highRisk.length === 1
                  ? ""
                  : "s"
              } found in the selected scope.`
            : "No High or Critical predictions are currently in this scope."}
        </AttentionCard>

        <AttentionCard
          icon={BrainCircuit}
          title="Prediction Status"
          tone={
            stats.last_prediction_run
              ? "success"
              : "warning"
          }
          action="View Predictions"
          onClick={() =>
            onNavigate("predictions")
          }
        >
          {stats.last_prediction_run
            ? `Latest prediction run: ${new Date(
                stats.last_prediction_run
              ).toLocaleString()}`
            : "No prediction run has been recorded yet."}
        </AttentionCard>

        <AttentionCard
          icon={BellRing}
          title="Recent Notifications"
          tone="neutral"
          action="View Notifications"
          onClick={() =>
            onNavigate("notifications")
          }
        >
          {notifications.length
            ? `${notifications
                .slice(0, 3)
                .map((n) => n.title)
                .join(" • ")}${
                notifications.length > 3
                  ? " • …"
                  : ""
              }`
            : "No notifications have been published yet."}
        </AttentionCard>

      </div>

    </div>
  );
}

function LoadingState() {
  return (
    <div className="bg-white rounded-2xl border border-[#E8E2D8] p-8 text-[14px] text-[#7A8598]">
      Loading dashboard…
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="rounded-2xl border border-[#F1C7C7] bg-[#FBEAEA] p-5 text-[13px] text-[#C62828]">
      {message}
    </div>
  );
}