// ============================================================
// WeeklyMonitoring.jsx
// Medical Supervisor Portal
// ============================================================

import {
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  Mail,
  RefreshCw,
  Search,
  Users,
  X,
  AlertCircle,
  ChevronDown,
} from "lucide-react";


// ============================================================
// HELPERS
// ============================================================

function safeNumber(value, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}


function normalizeStatus(row) {

  if (
    row?.submitted === true ||
    row?.status === "Submitted" ||
    row?.status === "SUBMITTED"
  ) {
    return "Submitted";
  }


  if (
    row?.status === "Pending" ||
    row?.status === "PENDING"
  ) {
    return "Pending";
  }


  if (
    row?.status === "Missed" ||
    row?.status === "MISSED"
  ) {
    return "Missed";
  }


  if (
    row?.status === "Late" ||
    row?.status === "LATE"
  ) {
    return "Late";
  }


  if (
    row?.submitted === false
  ) {
    return "Missed";
  }


  return "Pending";
}


function statusTone(status) {

  switch (status) {

    case "Submitted":
      return {
        bg: "#EAF7EF",
        text: "#087A32",
        border: "#CBE8D5",
      };

    case "Late":
      return {
        bg: "#FFF6E6",
        text: "#A76500",
        border: "#F2D8A6",
      };

    case "Missed":
      return {
        bg: "#FFF1F1",
        text: "#C62828",
        border: "#F0CCCC",
      };

    default:
      return {
        bg: "#F3F6F5",
        text: "#65736D",
        border: "#DCE4E1",
      };
  }
}


function formatDate(value) {

  if (!value) {
    return "—";
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(value);
  }


  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}


function formatDateTime(value) {

  if (!value) {
    return "—";
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return String(value);
  }


  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}


function getAgentName(row) {

  return (
    row?.agent_name ||
    row?.name ||
    row?.full_name ||
    row?.agent?.name ||
    "Unknown Agent"
  );
}


function getTalukName(row) {

  return (
    row?.taluk_name ||
    row?.taluk ||
    row?.taluk?.name ||
    "Unknown Taluk"
  );
}


function getLastSubmission(row) {

  return (
    row?.last_submission ||
    row?.last_submitted_at ||
    row?.last_submission_at ||
    row?.submitted_at ||
    row?.created_at ||
    null
  );
}


function getWeekNumber(row) {

  return (
    row?.week_number ??
    row?.week ??
    row?.current_week ??
    "—"
  );
}


function getMissedStreak(row) {

  return safeNumber(
    row?.missed_streak ??
    row?.missed_weeks ??
    row?.consecutive_missed ??
    row?.missed_count ??
    0
  );
}


function getAgentId(row) {

  return (
    row?.agent_id ??
    row?.id ??
    row?.agent?.id ??
    null
  );
}


// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({
  status,
}) {

  const tone =
    statusTone(status);


  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-bold"
      style={{
        backgroundColor:
          tone.bg,

        color:
          tone.text,

        borderColor:
          tone.border,
      }}
    >

      {status === "Submitted" ? (
        <CheckCircle2
          size={11}
        />
      ) : status === "Missed" ? (
        <AlertCircle
          size={11}
        />
      ) : (
        <Clock3
          size={11}
        />
      )}

      {status}

    </span>
  );
}


// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  icon,
  label,
  value,
  helper,
}) {

  return (
    <div
      className="
        rounded-2xl
        border
        border-[#E3E9E6]
        bg-white
        px-5
        py-4
        shadow-[0_2px_12px_rgba(16,42,67,.035)]
      "
    >

      <div className="flex items-start justify-between">

        <div>

          <div
            className="
              text-[9px]
              font-bold
              uppercase
              tracking-[.12em]
              text-[#8A9691]
            "
          >
            {label}
          </div>

          <div
            className="
              mt-2
              text-[25px]
              font-semibold
              tracking-[-.04em]
              text-[#102A43]
            "
          >
            {value}
          </div>

          {helper && (
            <div
              className="
                mt-1
                text-[9px]
                text-[#78847F]
              "
            >
              {helper}
            </div>
          )}

        </div>

        <div
          className="
            flex
            h-9
            w-9
            items-center
            justify-center
            rounded-xl
            bg-[#EEF7F1]
            text-[#087A32]
          "
        >
          {icon}
        </div>

      </div>

    </div>
  );
}


// ============================================================
// DETAIL MODAL
// ============================================================

function MonitoringDetails({
  row,
  onClose,
}) {

  if (!row) {
    return null;
  }


  const status =
    normalizeStatus(row);


  const agentName =
    getAgentName(row);


  const talukName =
    getTalukName(row);


  const lastSubmission =
    getLastSubmission(row);


  const missedStreak =
    getMissedStreak(row);


  const weekNumber =
    getWeekNumber(row);


  return (
    <div
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-center
        justify-center
        bg-[#102A43]/30
        p-4
        backdrop-blur-[2px]
      "
      onMouseDown={onClose}
    >

      <div
        className="
          max-h-[88vh]
          w-full
          max-w-[650px]
          overflow-y-auto
          rounded-2xl
          border
          border-[#E0E7E3]
          bg-white
          shadow-[0_25px_80px_rgba(16,42,67,.22)]
        "
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >

        {/* HEADER */}

        <div
          className="
            flex
            items-start
            justify-between
            border-b
            border-[#E8EDEB]
            px-6
            py-5
          "
        >

          <div>

            <div
              className="
                text-[9px]
                font-bold
                uppercase
                tracking-[.13em]
                text-[#087A32]
              "
            >
              Weekly Monitoring
            </div>

            <h2
              className="
                mt-1
                text-[21px]
                font-semibold
                tracking-[-.025em]
                text-[#102A43]
              "
            >
              {agentName}
            </h2>

            <div
              className="
                mt-1
                text-[10px]
                text-[#78847F]
              "
            >
              {talukName}
            </div>

          </div>


          <button
            type="button"
            onClick={onClose}
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-xl
              text-[#68756F]
              hover:bg-[#F4F7F5]
            "
            aria-label="Close"
          >
            <X size={18} />
          </button>

        </div>


        {/* STATUS */}

        <div
          className="
            flex
            items-center
            justify-between
            border-b
            border-[#EDF1EF]
            px-6
            py-4
          "
        >

          <div
            className="
              text-[9px]
              font-bold
              uppercase
              tracking-[.09em]
              text-[#8A9691]
            "
          >
            Current status
          </div>

          <StatusBadge
            status={status}
          />

        </div>


        {/* DETAILS */}

        <div
          className="
            grid
            gap-3
            px-6
            py-5
            sm:grid-cols-2
          "
        >

          <div
            className="
              rounded-xl
              border
              border-[#E7ECE9]
              bg-[#F8FAF9]
              p-4
            "
          >

            <div
              className="
                text-[9px]
                font-bold
                uppercase
                tracking-[.09em]
                text-[#8A9691]
              "
            >
              Taluk
            </div>

            <div
              className="
                mt-1
                text-[12px]
                font-semibold
                text-[#26334A]
              "
            >
              {talukName}
            </div>

          </div>


          <div
            className="
              rounded-xl
              border
              border-[#E7ECE9]
              bg-[#F8FAF9]
              p-4
            "
          >

            <div
              className="
                text-[9px]
                font-bold
                uppercase
                tracking-[.09em]
                text-[#8A9691]
              "
            >
              Week
            </div>

            <div
              className="
                mt-1
                text-[12px]
                font-semibold
                text-[#26334A]
              "
            >
              Week {weekNumber}
            </div>

          </div>


          <div
            className="
              rounded-xl
              border
              border-[#E7ECE9]
              bg-[#F8FAF9]
              p-4
            "
          >

            <div
              className="
                text-[9px]
                font-bold
                uppercase
                tracking-[.09em]
                text-[#8A9691]
              "
            >
              Last submission
            </div>

            <div
              className="
                mt-1
                text-[12px]
                font-semibold
                text-[#26334A]
              "
            >
              {formatDateTime(
                lastSubmission
              )}
            </div>

          </div>


          <div
            className="
              rounded-xl
              border
              border-[#E7ECE9]
              bg-[#F8FAF9]
              p-4
            "
          >

            <div
              className="
                text-[9px]
                font-bold
                uppercase
                tracking-[.09em]
                text-[#8A9691]
              "
            >
              Missed streak
            </div>

            <div
              className="
                mt-1
                text-[12px]
                font-semibold
                text-[#26334A]
              "
            >
              {missedStreak} week
              {missedStreak === 1
                ? ""
                : "s"}
            </div>

          </div>

        </div>


        {/* FOOTER */}

        <div
          className="
            flex
            justify-end
            border-t
            border-[#E8EDEB]
            px-6
            py-4
          "
        >

          <button
            type="button"
            onClick={onClose}
            className="
              rounded-lg
              border
              border-[#DDE5E0]
              bg-white
              px-4
              py-2
              text-[10px]
              font-semibold
              text-[#52627D]
              hover:bg-[#F6F9F7]
            "
          >
            Close
          </button>

        </div>

      </div>

    </div>
  );
}


// ============================================================
// MAIN COMPONENT
// ============================================================

export default function WeeklyMonitoring({
  rows = [],
  onRemind,
  onRefresh,
}) {

  const [
    search,
    setSearch,
  ] = useState("");


  const [
    statusFilter,
    setStatusFilter,
  ] = useState("All Status");


  const [
    weekFilter,
    setWeekFilter,
  ] = useState("All Weeks");


  const [
    selectedRow,
    setSelectedRow,
  ] = useState(null);


  const [
    remindingId,
    setRemindingId,
  ] = useState(null);


  const [
    refreshLoading,
    setRefreshLoading,
  ] = useState(false);


  // ==========================================================
  // NORMALIZED DATA
  // ==========================================================

  const normalizedRows =
    useMemo(() => {

      if (!Array.isArray(rows)) {
        return [];
      }


      return rows.map(
        (row, index) => {

          const status =
            normalizeStatus(row);


          return {
            ...row,

            __index: index,

            __agentName:
              getAgentName(row),

            __talukName:
              getTalukName(row),

            __status:
              status,

            __week:
              getWeekNumber(row),

            __lastSubmission:
              getLastSubmission(row),

            __missedStreak:
              getMissedStreak(row),

            __agentId:
              getAgentId(row),
          };
        }
      );

    }, [rows]);


  // ==========================================================
  // WEEK OPTIONS
  // ==========================================================

  const weekOptions =
    useMemo(() => {

      const weeks =
        normalizedRows
          .map(
            (row) =>
              row.__week
          )
          .filter(
            (value) =>
              value !== undefined &&
              value !== null &&
              value !== ""
          );


      return [
        ...new Set(
          weeks.map(
            (week) =>
              String(week)
          )
        ),
      ].sort(
        (a, b) =>
          Number(b) - Number(a)
      );

    }, [normalizedRows]);


  // ==========================================================
  // FILTERED DATA
  // ==========================================================

  const filteredRows =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();


      return normalizedRows.filter(
        (row) => {

          const matchesSearch =
            !query ||
            row.__agentName
              .toLowerCase()
              .includes(query) ||
            row.__talukName
              .toLowerCase()
              .includes(query);


          const matchesStatus =
            statusFilter ===
              "All Status" ||
            row.__status ===
              statusFilter;


          const matchesWeek =
            weekFilter ===
              "All Weeks" ||
            String(
              row.__week
            ) ===
              String(
                weekFilter
              );


          return (
            matchesSearch &&
            matchesStatus &&
            matchesWeek
          );
        }
      );

    }, [
      normalizedRows,
      search,
      statusFilter,
      weekFilter,
    ]);


  // ==========================================================
  // SUMMARY
  // ==========================================================

  const summary =
    useMemo(() => {

      const total =
        normalizedRows.length;


      const submitted =
        normalizedRows.filter(
          (row) =>
            row.__status ===
            "Submitted"
        ).length;


      const missed =
        normalizedRows.filter(
          (row) =>
            row.__status ===
            "Missed"
        ).length;


      const late =
        normalizedRows.filter(
          (row) =>
            row.__status ===
            "Late"
        ).length;


      const pending =
        normalizedRows.filter(
          (row) =>
            row.__status ===
            "Pending"
        ).length;


      const compliance =
        total
          ? Math.round(
              (submitted /
                total) *
                100
            )
          : 0;


      return {
        total,
        submitted,
        missed,
        late,
        pending,
        compliance,
      };

    }, [normalizedRows]);


  // ==========================================================
  // REMIND AGENT
  // ==========================================================

  const handleRemind =
    async (row) => {

      const agentId =
        row.__agentId;


      if (
        agentId ===
        null ||
        agentId ===
        undefined
      ) {
        console.error(
          "Cannot remind agent: missing agent id.",
          row
        );

        return;
      }


      if (
        typeof onRemind !==
        "function"
      ) {
        return;
      }


      try {

        setRemindingId(
          agentId
        );


        await onRemind({
          ...row,

          id:
            agentId,

          agent_id:
            agentId,
        });

      } catch (error) {

        console.error(
          "Failed to send reminder:",
          error
        );

      } finally {

        setRemindingId(
          null
        );
      }
    };


  // ==========================================================
  // REFRESH
  // ==========================================================

  const handleRefresh =
    async () => {

      if (
        typeof onRefresh !==
        "function"
      ) {
        return;
      }


      try {

        setRefreshLoading(
          true
        );

        await onRefresh();

      } catch (error) {

        console.error(
          "Failed to refresh weekly monitoring:",
          error
        );

      } finally {

        setRefreshLoading(
          false
        );
      }
    };


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="space-y-5">

      {/* ==================================================== */}
      {/* PAGE HEADER                                          */}
      {/* ==================================================== */}

      <div
        className="
          flex
          flex-col
          gap-4
          lg:flex-row
          lg:items-end
          lg:justify-between
        "
      >

        <div>

          <div
            className="
              text-[9px]
              font-bold
              uppercase
              tracking-[.14em]
              text-[#087A32]
            "
          >
            Surveillance reporting
          </div>

          <h1
            className="
              mt-1
              text-[25px]
              font-semibold
              tracking-[-.035em]
              text-[#102A43]
            "
          >
            Weekly Monitoring
          </h1>

          <p
            className="
              mt-1
              max-w-[650px]
              text-[10px]
              leading-5
              text-[#718096]
            "
          >
            Monitor weekly reporting compliance
            across agents in your assigned district.
            Follow up with agents who have missed
            their weekly submission.
          </p>

        </div>


        <button
          type="button"
          onClick={handleRefresh}
          disabled={
            refreshLoading
          }
          className="
            inline-flex
            h-9
            items-center
            justify-center
            gap-2
            rounded-lg
            border
            border-[#DDE5E0]
            bg-white
            px-3.5
            text-[10px]
            font-semibold
            text-[#52627D]
            shadow-[0_1px_3px_rgba(16,42,67,.04)]
            transition
            hover:bg-[#F7FAF8]
            disabled:cursor-not-allowed
            disabled:opacity-60
          "
        >

          <RefreshCw
            size={13}
            className={
              refreshLoading
                ? "animate-spin"
                : ""
            }
          />

          Refresh

        </button>

      </div>


      {/* ==================================================== */}
      {/* SUMMARY CARDS                                        */}
      {/* ==================================================== */}

      <div
        className="
          grid
          gap-3
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >

        <StatCard
          icon={
            <Users size={17} />
          }
          label="Agents monitored"
          value={
            summary.total
          }
          helper="Agents assigned to your district"
        />


        <StatCard
          icon={
            <CheckCircle2 size={17} />
          }
          label="Submitted"
          value={
            summary.submitted
          }
          helper={
            `${summary.compliance}% reporting compliance`
          }
        />


        <StatCard
          icon={
            <AlertCircle size={17} />
          }
          label="Missed"
          value={
            summary.missed
          }
          helper="Requires follow-up"
        />


        <StatCard
          icon={
            <Clock3 size={17} />
          }
          label="Pending / late"
          value={
            summary.pending +
            summary.late
          }
          helper="Monitor before escalation"
        />

      </div>


      {/* ==================================================== */}
      {/* FILTER BAR                                           */}
      {/* ==================================================== */}

      <div
        className="
          rounded-2xl
          border
          border-[#E3E9E6]
          bg-white
          p-4
          shadow-[0_2px_12px_rgba(16,42,67,.035)]
        "
      >

        <div
          className="
            flex
            flex-col
            gap-3
            lg:flex-row
            lg:items-center
          "
        >

          {/* SEARCH */}

          <div
            className="
              relative
              min-w-0
              flex-1
            "
          >

            <Search
              size={14}
              className="
                pointer-events-none
                absolute
                left-3
                top-1/2
                -translate-y-1/2
                text-[#8A9691]
              "
            />

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search agent or taluk..."
              className="
                h-10
                w-full
                rounded-xl
                border
                border-[#DDE5E0]
                bg-[#FBFCFB]
                pl-9
                pr-3
                text-[10px]
                text-[#26334A]
                outline-none
                placeholder:text-[#9AA49F]
                focus:border-[#AFCDBA]
                focus:ring-2
                focus:ring-[#087A32]/10
              "
            />

          </div>


          {/* STATUS */}

          <div
            className="
              relative
              w-full
              lg:w-[155px]
            "
          >

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="
                h-10
                w-full
                appearance-none
                rounded-xl
                border
                border-[#DDE5E0]
                bg-[#FBFCFB]
                px-3
                pr-8
                text-[10px]
                font-medium
                text-[#52627D]
                outline-none
                focus:border-[#AFCDBA]
                focus:ring-2
                focus:ring-[#087A32]/10
              "
            >

              <option>
                All Status
              </option>

              <option>
                Submitted
              </option>

              <option>
                Pending
              </option>

              <option>
                Missed
              </option>

              <option>
                Late
              </option>

            </select>

            <ChevronDown
              size={13}
              className="
                pointer-events-none
                absolute
                right-3
                top-1/2
                -translate-y-1/2
                text-[#8A9691]
              "
            />

          </div>


          {/* WEEK */}

          <div
            className="
              relative
              w-full
              lg:w-[145px]
            "
          >

            <select
              value={weekFilter}
              onChange={(event) =>
                setWeekFilter(
                  event.target.value
                )
              }
              className="
                h-10
                w-full
                appearance-none
                rounded-xl
                border
                border-[#DDE5E0]
                bg-[#FBFCFB]
                px-3
                pr-8
                text-[10px]
                font-medium
                text-[#52627D]
                outline-none
                focus:border-[#AFCDBA]
                focus:ring-2
                focus:ring-[#087A32]/10
              "
            >

              <option>
                All Weeks
              </option>

              {weekOptions.map(
                (week) => (
                  <option
                    key={week}
                    value={week}
                  >
                    Week {week}
                  </option>
                )
              )}

            </select>

            <ChevronDown
              size={13}
              className="
                pointer-events-none
                absolute
                right-3
                top-1/2
                -translate-y-1/2
                text-[#8A9691]
              "
            />

          </div>

        </div>


        {/* RESULT COUNT */}

        <div
          className="
            mt-3
            flex
            items-center
            justify-between
            border-t
            border-[#EDF1EF]
            pt-3
          "
        >

          <div
            className="
              flex
              items-center
              gap-2
              text-[9px]
              text-[#7A8580]
            "
          >

            <CalendarDays
              size={12}
            />

            Showing{" "}
            <span
              className="
                font-bold
                text-[#52627D]
              "
            >
              {filteredRows.length}
            </span>

            of{" "}
            <span
              className="
                font-bold
                text-[#52627D]
              "
            >
              {normalizedRows.length}
            </span>

            agents

          </div>


          {(search ||
            statusFilter !==
              "All Status" ||
            weekFilter !==
              "All Weeks") && (

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter(
                  "All Status"
                );
                setWeekFilter(
                  "All Weeks"
                );
              }}
              className="
                text-[9px]
                font-semibold
                text-[#087A32]
                hover:underline
              "
            >
              Clear filters
            </button>

          )}

        </div>

      </div>


      {/* ==================================================== */}
      {/* TABLE                                                 */}
      {/* ==================================================== */}

      <div
        className="
          overflow-hidden
          rounded-2xl
          border
          border-[#E3E9E6]
          bg-white
          shadow-[0_2px_12px_rgba(16,42,67,.035)]
        "
      >

        {/* TABLE HEADER */}

        <div
          className="
            flex
            flex-col
            gap-1
            border-b
            border-[#E7ECE9]
            px-5
            py-4
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >

          <div>

            <div
              className="
                text-[12px]
                font-semibold
                text-[#26334A]
              "
            >
              Weekly Reporting Status
            </div>

            <div
              className="
                mt-0.5
                text-[9px]
                text-[#89938F]
              "
            >
              Review submissions and follow up
              with missed reports.
            </div>

          </div>


          <div
            className="
              inline-flex
              items-center
              gap-1.5
              rounded-full
              bg-[#F1F7F3]
              px-2.5
              py-1.5
              text-[9px]
              font-semibold
              text-[#087A32]
            "
          >

            <CalendarDays
              size={11}
            />

            Current reporting cycle

          </div>

        </div>


        {/* TABLE */}

        <div className="overflow-x-auto">

          <table
            className="
              w-full
              min-w-[900px]
              border-collapse
            "
          >

            <thead>

              <tr
                className="
                  border-b
                  border-[#EDF1EF]
                  bg-[#FAFCFB]
                "
              >

                <th
                  className="
                    px-5
                    py-3
                    text-left
                    text-[8px]
                    font-bold
                    uppercase
                    tracking-[.1em]
                    text-[#8A9691]
                  "
                >
                  Agent
                </th>


                <th
                  className="
                    px-4
                    py-3
                    text-left
                    text-[8px]
                    font-bold
                    uppercase
                    tracking-[.1em]
                    text-[#8A9691]
                  "
                >
                  Taluk
                </th>


                <th
                  className="
                    px-4
                    py-3
                    text-left
                    text-[8px]
                    font-bold
                    uppercase
                    tracking-[.1em]
                    text-[#8A9691]
                  "
                >
                  Week
                </th>


                <th
                  className="
                    px-4
                    py-3
                    text-left
                    text-[8px]
                    font-bold
                    uppercase
                    tracking-[.1em]
                    text-[#8A9691]
                  "
                >
                  Last submission
                </th>


                <th
                  className="
                    px-4
                    py-3
                    text-left
                    text-[8px]
                    font-bold
                    uppercase
                    tracking-[.1em]
                    text-[#8A9691]
                  "
                >
                  Missed streak
                </th>


                <th
                  className="
                    px-4
                    py-3
                    text-left
                    text-[8px]
                    font-bold
                    uppercase
                    tracking-[.1em]
                    text-[#8A9691]
                  "
                >
                  Status
                </th>


                <th
                  className="
                    px-5
                    py-3
                    text-right
                    text-[8px]
                    font-bold
                    uppercase
                    tracking-[.1em]
                    text-[#8A9691]
                  "
                >
                  Action
                </th>

              </tr>

            </thead>


            <tbody>

              {filteredRows.map(
                (row) => {

                  const agentId =
                    row.__agentId;


                  const isReminding =
                    remindingId ===
                    agentId;


                  return (
                    <tr
                      key={
                        row.id ??
                        row.agent_id ??
                        row.__index
                      }
                      className="
                        border-b
                        border-[#EDF1EF]
                        last:border-b-0
                        hover:bg-[#FBFCFB]
                      "
                    >

                      {/* AGENT */}

                      <td
                        className="
                          px-5
                          py-4
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
                              h-8
                              w-8
                              shrink-0
                              items-center
                              justify-center
                              rounded-xl
                              bg-[#EEF7F1]
                              text-[10px]
                              font-bold
                              text-[#087A32]
                            "
                          >
                            {row.__agentName
                              .slice(
                                0,
                                1
                              )
                              .toUpperCase()}
                          </div>


                          <div>

                            <div
                              className="
                                text-[10px]
                                font-semibold
                                text-[#26334A]
                              "
                            >
                              {row.__agentName}
                            </div>

                            {row.username && (
                              <div
                                className="
                                  mt-0.5
                                  text-[8px]
                                  text-[#8A9691]
                                "
                              >
                                @{row.username}
                              </div>
                            )}

                          </div>

                        </div>

                      </td>


                      {/* TALUK */}

                      <td
                        className="
                          px-4
                          py-4
                          text-[10px]
                          font-medium
                          text-[#52627D]
                        "
                      >
                        {row.__talukName}
                      </td>


                      {/* WEEK */}

                      <td
                        className="
                          px-4
                          py-4
                        "
                      >

                        <span
                          className="
                            inline-flex
                            items-center
                            rounded-lg
                            bg-[#F4F7F5]
                            px-2
                            py-1
                            text-[9px]
                            font-semibold
                            text-[#52627D]
                          "
                        >
                          W{row.__week}
                        </span>

                      </td>


                      {/* LAST SUBMISSION */}

                      <td
                        className="
                          px-4
                          py-4
                        "
                      >

                        <div
                          className="
                            text-[9px]
                            font-medium
                            text-[#52627D]
                          "
                        >
                          {row.__lastSubmission
                            ? formatDate(
                                row.__lastSubmission
                              )
                            : "Not submitted"}
                        </div>

                        {row.__lastSubmission && (
                          <div
                            className="
                              mt-0.5
                              text-[8px]
                              text-[#9AA49F]
                            "
                          >
                            {formatDateTime(
                              row.__lastSubmission
                            )
                              .split(
                                ", "
                              )
                              .slice(-1)
                              .join(
                                ", "
                              )}
                          </div>
                        )}

                      </td>


                      {/* MISSED STREAK */}

                      <td
                        className="
                          px-4
                          py-4
                        "
                      >

                        <span
                          className={
                            row.__missedStreak >
                            0
                              ? `
                                inline-flex
                                min-w-[35px]
                                justify-center
                                rounded-lg
                                bg-[#FFF1F1]
                                px-2
                                py-1
                                text-[9px]
                                font-bold
                                text-[#C62828]
                              `
                              : `
                                inline-flex
                                min-w-[35px]
                                justify-center
                                rounded-lg
                                bg-[#EEF7F1]
                                px-2
                                py-1
                                text-[9px]
                                font-bold
                                text-[#087A32]
                              `
                          }
                        >
                          {row.__missedStreak}
                        </span>

                      </td>


                      {/* STATUS */}

                      <td
                        className="
                          px-4
                          py-4
                        "
                      >

                        <StatusBadge
                          status={
                            row.__status
                          }
                        />

                      </td>


                      {/* ACTION */}

                      <td
                        className="
                          px-5
                          py-4
                        "
                      >

                        <div
                          className="
                            flex
                            items-center
                            justify-end
                            gap-1.5
                          "
                        >

                          {/* VIEW */}

                          <button
                            type="button"
                            onClick={() =>
                              setSelectedRow(
                                row
                              )
                            }
                            className="
                              flex
                              h-8
                              w-8
                              items-center
                              justify-center
                              rounded-lg
                              border
                              border-[#DDE5E0]
                              bg-white
                              text-[#087A32]
                              hover:bg-[#F2F8F4]
                            "
                            title="View details"
                          >

                            <Eye
                              size={14}
                            />

                          </button>


                          {/* REMIND */}

                          {row.__status !==
                            "Submitted" && (

                            <button
                              type="button"
                              disabled={
                                isReminding ||
                                agentId ===
                                  null
                              }
                              onClick={() =>
                                handleRemind(
                                  row
                                )
                              }
                              className="
                                inline-flex
                                h-8
                                items-center
                                justify-center
                                gap-1.5
                                rounded-lg
                                border
                                border-[#BFDCC8]
                                bg-[#F2F9F4]
                                px-2.5
                                text-[9px]
                                font-semibold
                                text-[#087A32]
                                hover:bg-[#EAF6EE]
                                disabled:cursor-not-allowed
                                disabled:opacity-50
                              "
                              title="Send weekly report reminder"
                            >

                              <Mail
                                size={12}
                                className={
                                  isReminding
                                    ? "animate-pulse"
                                    : ""
                                }
                              />

                              {isReminding
                                ? "Sending..."
                                : "Remind"}

                            </button>

                          )}

                        </div>

                      </td>

                    </tr>
                  );
                }
              )}

            </tbody>

          </table>


          {/* EMPTY STATE */}

          {!filteredRows.length && (

            <div
              className="
                px-5
                py-16
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
                  rounded-full
                  bg-[#F1F7F3]
                  text-[#087A32]
                "
              >
                <Search
                  size={19}
                />
              </div>


              <div
                className="
                  mt-3
                  text-[12px]
                  font-semibold
                  text-[#26334A]
                "
              >
                No monitoring records found
              </div>


              <div
                className="
                  mx-auto
                  mt-1
                  max-w-[360px]
                  text-[9px]
                  leading-5
                  text-[#7B8581]
                "
              >
                {normalizedRows.length
                  ? "Try changing your search or filter values."
                  : "No weekly monitoring data has been returned for agents in your district yet."}
              </div>


              {(search ||
                statusFilter !==
                  "All Status" ||
                weekFilter !==
                  "All Weeks") && (

                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setStatusFilter(
                      "All Status"
                    );
                    setWeekFilter(
                      "All Weeks"
                    );
                  }}
                  className="
                    mt-4
                    rounded-lg
                    bg-[#087A32]
                    px-3.5
                    py-2
                    text-[9px]
                    font-semibold
                    text-white
                    hover:bg-[#076B2C]
                  "
                >
                  Clear filters
                </button>

              )}

            </div>

          )}

        </div>


        {/* ================================================== */}
        {/* TABLE FOOTER                                      */}
        {/* ================================================== */}

        {filteredRows.length > 0 && (

          <div
            className="
              flex
              flex-col
              gap-2
              border-t
              border-[#EDF1EF]
              px-5
              py-3
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >

            <div
              className="
                text-[9px]
                text-[#89938F]
              "
            >
              Showing{" "}
              <span
                className="
                  font-semibold
                  text-[#52627D]
                "
              >
                {filteredRows.length}
              </span>{" "}
              monitoring records
            </div>


            <div
              className="
                flex
                items-center
                gap-3
                text-[8px]
                text-[#89938F]
              "
            >

              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#087A32]" />
                Submitted
              </span>

              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#C62828]" />
                Missed
              </span>

              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#A76500]" />
                Late
              </span>

            </div>

          </div>

        )}

      </div>


      {/* ==================================================== */}
      {/* DETAILS MODAL                                        */}
      {/* ==================================================== */}

      {selectedRow && (

        <MonitoringDetails
          row={selectedRow}
          onClose={() =>
            setSelectedRow(null)
          }
        />

      )}

    </div>
  );
}