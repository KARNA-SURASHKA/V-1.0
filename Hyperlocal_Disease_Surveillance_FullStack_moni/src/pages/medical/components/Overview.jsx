import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Users,
} from "lucide-react";

import skyline from "../../../assets/ui/medical-dashboard-skyline.png";
import pulseIllustration from "../../../assets/ui/medical-pulse-illustration.png";

import { getDiseaseVisual } from "../../../data/diseaseVisuals";

import {
  Kpi,
  Panel,
  RiskBadge,
  StatusBadge,
} from "./MedicalUi";


const formatTime = (value) => {

  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(
    new Date(value)
  );
};


const formatActivityTime = (value) => {

  if (!value) {
    return "Today";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(
    new Date(value)
  );
};


const diseaseIcon = (disease) =>
  getDiseaseVisual(disease).diseaseImage;


function AlertCard({
  alert,
  onOpen,
}) {

  const high =
    alert.severity === "High" ||
    alert.severity === "Critical";

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`
        w-full
        rounded-xl
        border
        p-3.5
        text-left
        transition
        hover:-translate-y-0.5
        hover:shadow-sm
        ${
          high
            ? "border-[#F5D6D8] bg-[#FFF8F8]"
            : "border-[#F2E6CB] bg-[#FFFCF5]"
        }
      `}
    >

      <div className="flex items-start gap-2.5">

        <span
          className={`
            mt-1.5
            h-2.5
            w-2.5
            shrink-0
            rounded-full
            ${
              high
                ? "bg-[#E11D48]"
                : "bg-[#F59E0B]"
            }
          `}
        />

        <div className="min-w-0 flex-1">

          <div className="flex items-start justify-between gap-2">

            <p className="text-[11px] font-semibold leading-5 text-[#17233D]">
              {alert.title}
            </p>

            <StatusBadge
              tone={
                high
                  ? "red"
                  : "amber"
              }
            >
              {alert.severity || "Medium"}
            </StatusBadge>

          </div>

          <p className="mt-1 text-[10px] leading-4 text-[#718096]">
            {alert.message}
          </p>

          <p className="mt-2 text-[10px] text-[#718096]">
            {formatActivityTime(
              alert.created_at
            )}
          </p>

        </div>

      </div>

    </button>
  );
}


export default function Overview({
  data,
  onReports,
  onMonitoring,
  onAlerts,
}) {

  if (!data) {

    return (
      <div className="py-20 text-center text-[12px] text-[#718096]">
        Loading surveillance summary…
      </div>
    );
  }


  const coverage =
    Math.max(
      0,
      Math.min(
        100,
        Number(
          data.reporting_coverage_percent || 0
        )
      )
    );


  const circumference =
    2 * Math.PI * 50;


  const offset =
    circumference -
    (
      coverage / 100
    ) *
    circumference;


  const previous =
    Number(
      data.total_cases_previous_week || 0
    );


  const current =
    Number(
      data.total_cases_this_week || 0
    );


  const trend =
    previous
      ? Math.round(
          (
            (current - previous)
            / previous
          ) * 100
        )
      : 0;


  const district =
    data.supervisor_district?.name ||
    data.district?.name ||
    "Kodagu";


  const selectedTaluk =
    data.selected_location?.taluk_name ||
    "Virajpet";


  const reports =
    data.disease_overview || [];


  const alerts =
    data.recent_alerts || [];


  const pulse =
    data.surveillance_pulse || [];


  return (

    <div className="space-y-5">

      {/* ===================================================== */}
      {/* WELCOME SECTION                                       */}
      {/* ===================================================== */}

      <section className="relative min-h-[122px] overflow-hidden rounded-2xl bg-white px-1 py-1">

        <div className="relative z-10 max-w-[60%] py-4 pl-1">

          <h1 className="text-[27px] font-semibold tracking-[-.035em] text-[#101B38]">

            Good{" "}

            {
              new Date().getHours() < 12
                ? "Morning"
                : new Date().getHours() < 17
                  ? "Afternoon"
                  : "Evening"
            },

            {" "}

            <span className="whitespace-nowrap">

              {data.supervisor_name || "Dr. Monish"}

              {" "}👋

            </span>

          </h1>


          <p className="mt-1 text-[12px] text-[#66727D]">

            Here’s the current surveillance summary for{" "}

            {selectedTaluk},{" "}

            {district}.

          </p>


          <p className="mt-4 flex items-center gap-2 text-[10px] text-[#697587]">

            <Activity size={13} />

            Last updated: Today

            <span>•</span>

            {formatTime(
              data.updated_at
            )}

          </p>

        </div>


        <img
          src={skyline}
          alt=""
          className="
            pointer-events-none
            absolute
            bottom-0
            right-0
            h-[104px]
            w-auto
            object-contain
          "
        />

      </section>


      {/* ===================================================== */}
      {/* KPI CARDS                                             */}
      {/* ===================================================== */}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

        <Kpi
          icon={<Users size={25} />}
          label="Active Diseases"
          value={
            data.diseases_tracked ?? 0
          }
          note="Under Surveillance"
          tone="green"
        />


        <Kpi
          icon={<ClipboardList size={25} />}
          label="Total Cases (This Week)"
          value={current}
          trend={trend}
          tone="blue"
        />


        <Kpi
          icon={<AlertTriangle size={25} />}
          label="High Risk Alerts"
          value={
            data.high_risk_alerts ?? 0
          }
          note="Require Attention"
          tone="amber"
        />


        <Kpi
          icon={<BarChart3 size={25} />}
          label="Reports This Week"
          value={
            data.reports_this_week ?? 0
          }
          note="Submitted by Agents"
          tone="purple"
        />

      </div>


      {/* ===================================================== */}
      {/* DISEASE / ALERTS / COVERAGE                           */}
      {/* ===================================================== */}

      <div className="grid gap-5 xl:grid-cols-[1.25fr_.92fr_.72fr]">

        {/* --------------------------------------------------- */}
        {/* DISEASE OVERVIEW                                    */}
        {/* --------------------------------------------------- */}

        <Panel
          title="DISEASE OVERVIEW"
          action="View All Disease Reports"
          onAction={onReports}
        >

          <div className="overflow-hidden rounded-xl border border-[#EDF1EF]">

            <table className="w-full text-left text-[11px]">

              <thead className="bg-[#FAFBFA] text-[#7B8798]">

                <tr>

                  <th className="px-3 py-3 font-semibold">
                    Disease
                  </th>

                  <th className="px-3 py-3 font-semibold">
                    Cases (This Week)
                  </th>

                  <th className="px-3 py-3 font-semibold">
                    Change
                  </th>

                  <th className="px-3 py-3 font-semibold">
                    Risk Level
                  </th>

                  <th className="px-3 py-3 font-semibold">
                    Status
                  </th>

                </tr>

              </thead>


              <tbody>

                {reports
                  .slice(0, 6)
                  .map((row) => {

                    const visual =
                      diseaseIcon(
                        row.disease
                      );


                    return (

                      <tr
                        key={row.disease}
                        className="
                          border-t
                          border-[#EEF1EF]
                          transition
                          hover:bg-[#FBFDFB]
                        "
                      >

                        <td className="px-3 py-3">

                          <div className="flex items-center gap-2">

                            <span
                              className="
                                flex
                                h-7
                                w-7
                                shrink-0
                                items-center
                                justify-center
                                overflow-hidden
                                rounded-full
                                bg-[#F4F7F5]
                              "
                            >

                              <img
                                src={visual}
                                alt=""
                                className="
                                  h-6
                                  w-6
                                  object-contain
                                "
                              />

                            </span>

                            <span className="font-semibold text-[#25324A]">

                              {row.disease}

                            </span>

                          </div>

                        </td>


                        <td className="px-3 py-3 font-semibold">

                          {row.cases_this_week ?? 0}

                        </td>


                        <td
                          className={`
                            px-3
                            py-3
                            font-semibold
                            ${
                              row.change_percent > 0
                                ? "text-[#D64040]"
                                : row.change_percent < 0
                                  ? "text-[#087A32]"
                                  : "text-[#788496]"
                            }
                          `}
                        >

                          {
                            row.change_percent > 0
                              ? (
                                <ArrowUpRight
                                  size={12}
                                  className="mr-0.5 inline"
                                />
                              )
                              : row.change_percent < 0
                                ? (
                                  <ArrowDownRight
                                    size={12}
                                    className="mr-0.5 inline"
                                  />
                                )
                                : null
                          }

                          {
                            Math.abs(
                              row.change_percent || 0
                            )
                          }%

                        </td>


                        <td className="px-3 py-3">

                          <RiskBadge
                            level={
                              row.risk_level
                            }
                          />

                        </td>


                        <td className="px-3 py-3">

                          <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#405064]">

                            <span
                              className={`
                                h-2
                                w-2
                                rounded-full
                                ${
                                  row.status === "Watch"
                                    ? "bg-[#E11D48]"
                                    : row.status === "Monitor"
                                      ? "bg-[#F59E0B]"
                                      : "bg-[#159447]"
                                }
                              `}
                            />

                            {row.status}

                          </span>

                        </td>

                      </tr>

                    );

                  })}

              </tbody>

            </table>

          </div>


          {!reports.length && (

            <div className="py-8 text-center text-[11px] text-[#718096]">

              No disease reports are available
              for this location.

            </div>

          )}

        </Panel>


        {/* --------------------------------------------------- */}
        {/* RECENT ALERTS                                       */}
        {/* --------------------------------------------------- */}

        <Panel
          title="RECENT ALERTS"
          action="View All"
          onAction={onAlerts}
        >

          <div className="space-y-3">

            {alerts
              .slice(0, 3)
              .map(
                (
                  alert,
                  index
                ) => (

                  <AlertCard
                    key={`${alert.title}-${index}`}
                    alert={alert}
                    onOpen={onAlerts}
                  />

                )
              )}


            {!alerts.length && (

              <div className="py-8 text-center text-[11px] text-[#718096]">

                No recent alerts for this location.

              </div>

            )}

          </div>

        </Panel>


        {/* --------------------------------------------------- */}
        {/* WEEKLY COVERAGE                                     */}
        {/* --------------------------------------------------- */}

        <Panel
          title="WEEKLY COVERAGE"
          action="View All"
          onAction={onMonitoring}
        >

          <div className="flex items-center justify-center py-1">

            <div className="relative h-[128px] w-[128px]">

              <svg
                viewBox="0 0 120 120"
                className="h-full w-full -rotate-90"
              >

                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#E6EBE8"
                  strokeWidth="12"
                />

                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#159447"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={
                    circumference
                  }
                  strokeDashoffset={
                    offset
                  }
                />

              </svg>


              <div className="absolute inset-0 flex flex-col items-center justify-center">

                <div className="text-[25px] font-semibold">

                  {coverage}%

                </div>

                <div className="text-[10px] text-[#718096]">

                  Coverage

                </div>

              </div>

            </div>

          </div>


          <div className="mt-2 space-y-2 text-[10px]">

            <div className="flex items-center gap-2">

              <span className="h-2.5 w-2.5 rounded-full bg-[#159447]" />

              <b>
                {data.coverage_received ?? 0}
              </b>

              <span className="text-[#718096]">
                Reports Received
              </span>

            </div>


            <div className="flex items-center gap-2">

              <span className="h-2.5 w-2.5 rounded-full bg-[#F59E0B]" />

              <b>
                {data.coverage_pending ?? 0}
              </b>

              <span className="text-[#718096]">
                Pending Reports
              </span>

            </div>


            <div className="flex items-center gap-2">

              <span className="h-2.5 w-2.5 rounded-full bg-[#C9CFD0]" />

              <b>
                {data.coverage_no_report ?? 0}
              </b>

              <span className="text-[#718096]">
                No Report
              </span>

            </div>

          </div>


          <div className="mt-4 rounded-xl border border-[#DCEDE2] bg-[#F4FBF6] p-3 text-[10px] text-[#267248]">

            <CheckCircle2
              size={16}
              className="mb-1"
            />

            <b>
              {
                coverage >= 80
                  ? "Great job!"
                  : "Needs attention"
              }
            </b>

            <div className="mt-0.5">

              {
                coverage >= 80
                  ? "Your reporting coverage is above the target."
                  : "Follow up with agents who have not submitted this week."
              }

            </div>

            <div className="mt-2 font-semibold">

              Target: 80%

            </div>

          </div>

        </Panel>

      </div>


      {/* ===================================================== */}
      {/* SURVEILLANCE PULSE                                   */}
      {/* ===================================================== */}

      <Panel
        title="SURVEILLANCE PULSE"
        action="View All Activity"
        onAction={onAlerts}
      >

        <div className="relative min-h-[112px] overflow-hidden">

          <div className="relative z-10 grid gap-5 pr-[155px] md:grid-cols-2 xl:grid-cols-4">

            <div className="
              absolute
              left-2
              right-2
              top-4
              hidden
              border-t
              border-dashed
              border-[#C9D9CF]
              xl:block
            " />


            {pulse
              .slice(0, 4)
              .map(
                (
                  item,
                  index
                ) => (

                  <div
                    key={`${item.title}-${index}`}
                    className="
                      relative
                      z-10
                      flex
                      gap-3
                    "
                  >

                    <div className="
                      mt-1.5
                      flex
                      h-4
                      w-4
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      border-4
                      border-white
                      bg-[#159447]
                      shadow-[0_0_0_1px_#B8D9C2]
                    " />


                    <div>

                      <div className="
                        text-[10px]
                        font-bold
                        text-[#087A32]
                      ">

                        {formatTime(
                          item.time
                        )}

                      </div>


                      <div className="
                        mt-1
                        text-[11px]
                        font-semibold
                        text-[#25324A]
                      ">

                        {item.title}

                      </div>


                      <div className="
                        mt-1
                        text-[10px]
                        leading-4
                        text-[#718096]
                      ">

                        {item.detail}

                      </div>


                      <div className="
                        mt-1
                        text-[10px]
                        font-medium
                        text-[#52627D]
                      ">

                        {item.meta}

                      </div>

                    </div>

                  </div>

                )
              )}

          </div>


          <img
            src={pulseIllustration}
            alt=""
            className="
              pointer-events-none
              absolute
              bottom-0
              right-0
              h-[78px]
              w-auto
              object-contain
              opacity-90
            "
          />

        </div>

      </Panel>

    </div>

  );
}