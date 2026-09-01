import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  Download,
  Eye,
  FilePlus2,
  Loader2,
  MapPin,
  MoreVertical,
  Search,
  X,
  RotateCcw,
} from "lucide-react";

import { DISEASES } from "../../../api";
import { RiskBadge, StatusBadge } from "./MedicalUi";

// ============================================================
// DISEASE META
// ============================================================

const DISEASE_META = {
  Dengue: {
    icon: "✳",
    iconClass: "bg-[#FFF0F0] text-[#D83B3B]",
  },

  Malaria: {
    icon: "☀",
    iconClass: "bg-[#FFF5E8] text-[#D98A16]",
  },

  Typhoid: {
    icon: "◈",
    iconClass: "bg-[#EAF8EF] text-[#16814B]",
  },

  Influenza: {
    icon: "✺",
    iconClass: "bg-[#F1EBFF] text-[#8258C9]",
  },

  Chikungunya: {
    icon: "✣",
    iconClass: "bg-[#EAF1FF] text-[#315EA8]",
  },
};

// ============================================================
// DATE HELPERS
// ============================================================

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatTime(value) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function toInputDate(date) {
  const d = new Date(date);

  const year = d.getFullYear();

  const month = String(
    d.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    d.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function dateLabel(value) {
  if (!value) return "All dates";

  const date = new Date(
    `${value}T00:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return "All dates";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

// ============================================================
// STATUS / PRIORITY
// ============================================================

function normalizeStatus(value) {
  const status = String(
    value || "Pending Review"
  ).trim();

  return status || "Pending Review";
}

function priorityFor(report) {
  if (report?.priority) {
    return String(
      report.priority
    );
  }

  const severity = String(
    report?.severity || ""
  ).trim();

  if (severity) {
    return severity;
  }

  const cases = Number(
    report?.cases || 0
  );

  if (cases >= 25) {
    return "High";
  }

  if (cases >= 10) {
    return "Medium";
  }

  return "Low";
}

function statusTone(status) {
  if (status === "Approved") {
    return "green";
  }

  if (status === "Rejected") {
    return "red";
  }

  return "blue";
}

// ============================================================
// DISEASE ICON
// ============================================================

function DiseaseIcon({ disease }) {
  const meta =
    DISEASE_META[disease] || {
      icon: "•",
      iconClass:
        "bg-[#F0F2F2] text-[#66727D]",
    };

  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[15px] font-semibold ${meta.iconClass}`}
    >
      {meta.icon}
    </span>
  );
}

// ============================================================
// SELECT FIELD
// ============================================================

function SelectField({
  value,
  onChange,
  children,
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className="
          h-11
          w-full
          appearance-none
          rounded-xl
          border
          border-[#E1E7E3]
          bg-white
          px-3.5
          pr-9
          text-[11px]
          font-medium
          text-[#26334A]
          outline-none
          transition
          focus:border-[#087A32]
          focus:ring-2
          focus:ring-[#087A32]/10
        "
      >
        {children}
      </select>

      <ChevronDown
        size={15}
        className="
          pointer-events-none
          absolute
          right-3
          top-1/2
          -translate-y-1/2
          text-[#6E7B8D]
        "
      />
    </div>
  );
}

// ============================================================
// SUMMARY CARD
// ============================================================

function SummaryCard({ summary }) {
  const risk = summary.risk;

  const riskClass =
    risk === "High" ||
    risk === "Critical"
      ? "border-l-[#D92D2D]"
      : risk === "Moderate"
        ? "border-l-[#E89B16]"
        : "border-l-[#16804A]";

  const change = Number(
    summary.change || 0
  );

  const changePositive =
    change > 0;

  return (
    <div
      className={`
        min-w-0
        rounded-2xl
        border
        border-[#E4EAE7]
        border-l-[3px]
        bg-white
        px-5
        py-4
        shadow-[0_4px_16px_rgba(24,54,42,.035)]
        ${riskClass}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3
            className="
              truncate
              text-[16px]
              font-bold
              tracking-[-.02em]
              text-[#111827]
            "
          >
            {summary.taluk}
          </h3>

          <div
            className="
              mt-1
              flex
              items-center
              gap-1.5
              text-[10px]
              text-[#5D697B]
            "
          >
            <span className="text-[#4D2775]">
              ♟
            </span>

            <span>
              Agent: {summary.agent}
            </span>
          </div>
        </div>

        <StatusBadge
          tone={
            risk === "High" ||
            risk === "Critical"
              ? "red"
              : risk === "Moderate"
                ? "amber"
                : "green"
          }
        >
          {risk || "Low"} Risk
        </StatusBadge>
      </div>

      <div
        className="
          mt-4
          grid
          grid-cols-3
          items-end
          gap-3
        "
      >
        <div>
          <div
            className="
              text-[22px]
              font-semibold
              tracking-[-.04em]
              text-[#111827]
            "
          >
            {summary.cases}
          </div>

          <div
            className="
              text-[9px]
              uppercase
              tracking-[.04em]
              text-[#66727D]
            "
          >
            Cases
          </div>
        </div>

        <div>
          <div
            className={`
              text-[18px]
              font-semibold
              ${
                changePositive
                  ? "text-[#D83B3B]"
                  : "text-[#087A32]"
              }
            `}
          >
            {changePositive
              ? "↗"
              : "↘"}{" "}
            {Math.abs(change)}%
          </div>

          <div
            className="
              text-[9px]
              uppercase
              tracking-[.04em]
              text-[#66727D]
            "
          >
            Vs last week
          </div>
        </div>

        <div className="text-right">
          <div
            className="
              text-[22px]
              font-semibold
              tracking-[-.04em]
              text-[#111827]
            "
          >
            {summary.reports}
          </div>

          <div
            className="
              text-[9px]
              uppercase
              tracking-[.04em]
              text-[#66727D]
            "
          >
            Reports
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// REPORT DETAILS MODAL
// ============================================================

function ReportDetails({
  report,
  onClose,
}) {
  if (!report) {
    return null;
  }

  const priority =
    priorityFor(report);

  const status =
    normalizeStatus(report.status);

  return (
    <div
      className="
        fixed
        inset-0
        z-[90]
        flex
        items-center
        justify-center
        bg-[#102A43]/25
        p-4
        backdrop-blur-[1px]
      "
      onMouseDown={onClose}
    >
      <div
        className="
          max-h-[88vh]
          w-full
          max-w-[680px]
          overflow-y-auto
          rounded-2xl
          border
          border-[#E1E7E3]
          bg-white
          shadow-[0_25px_80px_rgba(16,42,67,.22)]
        "
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
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
                text-[10px]
                font-bold
                uppercase
                tracking-[.12em]
                text-[#087A32]
              "
            >
              Disease Report
            </div>

            <h2
              className="
                mt-1
                text-[21px]
                font-semibold
                tracking-[-.025em]
                text-[#101B38]
              "
            >
              {report.report_id ||
                `RPT-${String(
                  report.id
                ).padStart(4, "0")}`}
            </h2>
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
              text-[#66727D]
              hover:bg-[#F5F8F6]
            "
          >
            <X size={18} />
          </button>
        </div>

        <div
          className="
            grid
            gap-3
            px-6
            py-5
            sm:grid-cols-2
          "
        >
          {[
            [
              "Disease",
              report.disease,
            ],
            [
              "Taluk",
              report.taluk_name,
            ],
            [
              "Agent",
              report.agent_name,
            ],
            [
              "Cases",
              report.cases ?? 0,
            ],
            [
              "Submitted",
              `${formatDate(
                report.created_at
              )} · ${formatTime(
                report.created_at
              )}`,
            ],
            [
              "Week",
              report.week_number ??
                "—",
            ],
          ].map(
            ([label, value]) => (
              <div
                key={label}
                className="
                  rounded-xl
                  border
                  border-[#E7ECE9]
                  bg-[#F8FAF9]
                  p-3.5
                "
              >
                <div
                  className="
                    text-[9px]
                    font-bold
                    uppercase
                    tracking-[.09em]
                    text-[#8A94A3]
                  "
                >
                  {label}
                </div>

                <div
                  className="
                    mt-1
                    text-[12px]
                    font-semibold
                    text-[#26334A]
                  "
                >
                  {value || "—"}
                </div>
              </div>
            )
          )}
        </div>

        <div className="space-y-4 px-6 pb-6">
          <div
            className="
              flex
              items-center
              justify-between
              rounded-xl
              border
              border-[#E7ECE9]
              px-4
              py-3
            "
          >
            <span
              className="
                text-[11px]
                font-semibold
                text-[#52627D]
              "
            >
              Status
            </span>

            <div className="flex items-center gap-2">
              <StatusBadge
                tone={statusTone(status)}
              >
                {status}
              </StatusBadge>

              <RiskBadge
                level={
                  priority ===
                  "Medium"
                    ? "Moderate"
                    : priority
                }
              />
            </div>
          </div>

          <div>
            <div
              className="
                text-[11px]
                font-semibold
                text-[#26334A]
              "
            >
              Remarks
            </div>

            <p
              className="
                mt-2
                rounded-xl
                border
                border-[#E7ECE9]
                bg-white
                p-3.5
                text-[11px]
                leading-5
                text-[#66727D]
              "
            >
              {report.remarks ||
                "No remarks were submitted with this report."}
            </p>
          </div>

          <div>
            <div
              className="
                text-[11px]
                font-semibold
                text-[#26334A]
              "
            >
              Preventive measures
            </div>

            <p
              className="
                mt-2
                rounded-xl
                border
                border-[#E7ECE9]
                bg-white
                p-3.5
                text-[11px]
                leading-5
                text-[#66727D]
              "
            >
              {report.preventive_measures ||
                "No preventive measures were recorded."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// NEW REPORT MODAL
// ============================================================

function NewReportModal({
  agents,
  onClose,
  onCreate,
  saving,
}) {
  const [form, setForm] =
    useState({
      agent_id:
        agents?.[0]?.id
          ? String(
              agents[0].id
            )
          : "",

      disease:
        DISEASES?.[0] ||
        "Dengue",

      cases: "0",

      severity: "Low",

      remarks: "",

      preventive_measures: "",
    });

  useEffect(() => {
    if (
      !form.agent_id &&
      agents?.[0]?.id
    ) {
      setForm((current) => ({
        ...current,
        agent_id: String(
          agents[0].id
        ),
      }));
    }
  }, [
    agents,
    form.agent_id,
  ]);

  const update = (
    key,
    value
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  async function submit(
    event
  ) {
    event.preventDefault();

    if (
      !form.agent_id ||
      !form.disease
    ) {
      return;
    }

    await onCreate({
      ...form,
      agent_id: Number(
        form.agent_id
      ),
      cases: Math.max(
        0,
        Number(
          form.cases || 0
        )
      ),
    });
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-[90]
        flex
        items-center
        justify-center
        bg-[#102A43]/25
        p-4
        backdrop-blur-[1px]
      "
      onMouseDown={onClose}
    >
      <form
        onSubmit={submit}
        onMouseDown={(event) =>
          event.stopPropagation()
        }
        className="
          max-h-[90vh]
          w-full
          max-w-[640px]
          overflow-y-auto
          rounded-2xl
          bg-white
          shadow-[0_25px_80px_rgba(16,42,67,.22)]
        "
      >
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
                text-[10px]
                font-bold
                uppercase
                tracking-[.12em]
                text-[#087A32]
              "
            >
              Disease Reports
            </div>

            <h2
              className="
                mt-1
                text-[21px]
                font-semibold
                tracking-[-.025em]
                text-[#101B38]
              "
            >
              New Report
            </h2>

            <p
              className="
                mt-1
                text-[11px]
                text-[#718096]
              "
            >
              Record a district-scoped
              surveillance report.
            </p>
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
              text-[#66727D]
              hover:bg-[#F5F8F6]
            "
          >
            <X size={18} />
          </button>
        </div>

        <div
          className="
            grid
            gap-4
            px-6
            py-5
            sm:grid-cols-2
          "
        >
          <label className="sm:col-span-2">
            <span
              className="
                mb-1.5
                block
                text-[10px]
                font-semibold
                text-[#52627D]
              "
            >
              Field Agent
            </span>

            <SelectField
              value={form.agent_id}
              onChange={(event) =>
                update(
                  "agent_id",
                  event.target.value
                )
              }
            >
              {!agents?.length && (
                <option value="">
                  No agents available
                </option>
              )}

              {(agents || []).map(
                (agent) => (
                  <option
                    key={agent.id}
                    value={agent.id}
                  >
                    {agent.name ||
                      agent.full_name ||
                      "Agent"}{" "}
                    ·{" "}
                    {agent.taluk_name ||
                      "Assigned taluk"}
                  </option>
                )
              )}
            </SelectField>
          </label>

          <label>
            <span
              className="
                mb-1.5
                block
                text-[10px]
                font-semibold
                text-[#52627D]
              "
            >
              Disease
            </span>

            <SelectField
              value={form.disease}
              onChange={(event) =>
                update(
                  "disease",
                  event.target.value
                )
              }
            >
              {(DISEASES || []).map(
                (item) => (
                  <option
                    key={item}
                  >
                    {item}
                  </option>
                )
              )}
            </SelectField>
          </label>

          <label>
            <span
              className="
                mb-1.5
                block
                text-[10px]
                font-semibold
                text-[#52627D]
              "
            >
              Cases
            </span>

            <input
              type="number"
              min="0"
              value={form.cases}
              onChange={(event) =>
                update(
                  "cases",
                  event.target.value
                )
              }
              className="
                h-11
                w-full
                rounded-xl
                border
                border-[#E1E7E3]
                px-3.5
                text-[11px]
                outline-none
                focus:border-[#087A32]
                focus:ring-2
                focus:ring-[#087A32]/10
              "
            />
          </label>

          <label>
            <span
              className="
                mb-1.5
                block
                text-[10px]
                font-semibold
                text-[#52627D]
              "
            >
              Priority
            </span>

            <SelectField
              value={form.severity}
              onChange={(event) =>
                update(
                  "severity",
                  event.target.value
                )
              }
            >
              <option>
                Low
              </option>

              <option>
                Medium
              </option>

              <option>
                High
              </option>

              <option>
                Critical
              </option>
            </SelectField>
          </label>

          <div
            className="
              rounded-xl
              border
              border-[#E0EAE4]
              bg-[#F5FAF6]
              px-3.5
              py-3
              text-[10px]
              text-[#37704A]
            "
          >
            <div className="font-semibold">
              District scope enforced
            </div>

            <div className="mt-1">
              The selected agent must
              belong to your assigned
              district.
            </div>
          </div>

          <label className="sm:col-span-2">
            <span
              className="
                mb-1.5
                block
                text-[10px]
                font-semibold
                text-[#52627D]
              "
            >
              Remarks
            </span>

            <textarea
              value={form.remarks}
              onChange={(event) =>
                update(
                  "remarks",
                  event.target.value
                )
              }
              rows={3}
              placeholder="Add observations or notes…"
              className="
                w-full
                resize-none
                rounded-xl
                border
                border-[#E1E7E3]
                px-3.5
                py-3
                text-[11px]
                outline-none
                focus:border-[#087A32]
                focus:ring-2
                focus:ring-[#087A32]/10
              "
            />
          </label>

          <label className="sm:col-span-2">
            <span
              className="
                mb-1.5
                block
                text-[10px]
                font-semibold
                text-[#52627D]
              "
            >
              Preventive Measures
            </span>

            <textarea
              value={
                form.preventive_measures
              }
              onChange={(event) =>
                update(
                  "preventive_measures",
                  event.target.value
                )
              }
              rows={3}
              placeholder="Record preventive measures taken…"
              className="
                w-full
                resize-none
                rounded-xl
                border
                border-[#E1E7E3]
                px-3.5
                py-3
                text-[11px]
                outline-none
                focus:border-[#087A32]
                focus:ring-2
                focus:ring-[#087A32]/10
              "
            />
          </label>
        </div>

        <div
          className="
            flex
            justify-end
            gap-2
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
              rounded-xl
              border
              border-[#DDE5E0]
              bg-white
              px-4
              py-2.5
              text-[11px]
              font-semibold
              text-[#52627D]
              hover:bg-[#F7FAF8]
            "
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={
              saving ||
              !form.agent_id
            }
            className="
              inline-flex
              items-center
              gap-2
              rounded-xl
              bg-[#087A32]
              px-5
              py-2.5
              text-[11px]
              font-semibold
              text-white
              shadow-[0_5px_14px_rgba(8,122,50,.18)]
              hover:bg-[#066728]
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {saving && (
              <Loader2
                size={14}
                className="animate-spin"
              />
            )}

            Create Report
          </button>
        </div>
      </form>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export default function DiseaseReports({
  reports = [],
  overview = null,
  agents = [],
  onRefresh,
  onCreateReport,
}) {
  const [search, setSearch] =
    useState("");

  const [status, setStatus] =
    useState("All Status");

  const [disease, setDisease] =
    useState("All Diseases");

  const [taluk, setTaluk] =
    useState("All Taluks");

  // IMPORTANT:
  // Do NOT initialize this to:
  //
  //   current month -> yesterday
  //
  // because on September 1 that becomes:
  //
  //   Sep 1 -> Aug 31
  //
  // which hides every report.
  //
  // Start with ALL dates.

  const [startDate, setStartDate] =
    useState("");

  const [endDate, setEndDate] =
    useState("");

  const [dateOpen, setDateOpen] =
    useState(false);

  const [selected, setSelected] =
    useState(null);

  const [menuId, setMenuId] =
    useState(null);

  const [page, setPage] =
    useState(1);

  const [
    newReportOpen,
    setNewReportOpen,
  ] = useState(false);

  const [saving, setSaving] =
    useState(false);

  const perPage = 6;

  // ==========================================================
  // DISTRICT
  // ==========================================================

  const districtName =
    overview
      ?.supervisor_district
      ?.name ||
    overview?.district?.name ||
    "Kodagu";

  // ==========================================================
  // TALUKS
  // ==========================================================

  const locations =
    overview?.locations || [];

  const taluks = useMemo(() => {
    const fromOverview =
      locations
        .map(
          (item) =>
            item.taluk_name
        )
        .filter(Boolean);

    const fromReports =
      reports
        .map(
          (item) =>
            item.taluk_name
        )
        .filter(Boolean);

    return [
      ...new Set([
        ...fromOverview,
        ...fromReports,
      ]),
    ].sort();
  }, [
    locations,
    reports,
  ]);

  // ==========================================================
  // SUMMARY CARDS
  // ==========================================================

  const summaryCards = useMemo(() => {
    const currentWeek =
      Number(
        overview?.current_week ||
          0
      );

    const previousWeek =
      Number(
        overview?.previous_week ||
          0
      );

    return taluks
      .slice(0, 3)
      .map((talukName) => {
        const currentRows =
          reports.filter(
            (report) =>
              report.taluk_name ===
                talukName &&
              (
                !currentWeek ||
                Number(
                  report.week_number
                ) === currentWeek
              )
          );

        const previousRows =
          reports.filter(
            (report) =>
              report.taluk_name ===
                talukName &&
              (
                !previousWeek ||
                Number(
                  report.week_number
                ) === previousWeek
              )
          );

        const currentCases =
          currentRows.reduce(
            (sum, row) =>
              sum +
              Number(
                row.cases || 0
              ),
            0
          );

        const previousCases =
          previousRows.reduce(
            (sum, row) =>
              sum +
              Number(
                row.cases || 0
              ),
            0
          );

        const change =
          previousCases
            ? Math.round(
                (
                  (
                    currentCases -
                    previousCases
                  ) /
                  previousCases
                ) *
                  100
              )
            : currentCases
              ? 100
              : 0;

        const highestRisk =
          [
            ...currentRows,
          ]
            .map(
              (row) =>
                priorityFor(row)
            )
            .sort(
              (a, b) => {
                const rank = {
                  Low: 1,
                  Medium: 2,
                  Moderate: 2,
                  High: 3,
                  Critical: 4,
                };

                return (
                  (rank[b] || 0) -
                  (rank[a] || 0)
                );
              }
            )[0];

        const agent =
          currentRows[0]
            ?.agent_name ||
          reports.find(
            (row) =>
              row.taluk_name ===
              talukName
          )?.agent_name ||
          "—";

        return {
          taluk: talukName,
          agent,
          cases: currentCases,
          reports:
            currentRows.length,
          change,
          risk:
            highestRisk === "Medium"
              ? "Moderate"
              : highestRisk ||
                "Low",
        };
      });
  }, [
    overview,
    reports,
    taluks,
  ]);

  // ==========================================================
  // FILTER REPORTS
  // ==========================================================

  const filtered =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      let start = null;
      let end = null;

      if (startDate) {
        start = new Date(
          `${startDate}T00:00:00`
        );
      }

      if (endDate) {
        end = new Date(
          `${endDate}T23:59:59.999`
        );
      }

      // ------------------------------------------------------
      // Safety:
      // if user accidentally chooses an invalid range,
      // don't silently show an empty table.
      // ------------------------------------------------------

      const invalidRange =
        start &&
        end &&
        start > end;

      return reports.filter(
        (report) => {
          const text = [
            report.report_id,
            report.id,
            report.agent_name,
            report.disease,
            report.taluk_name,
            report.status,
            report.priority,
          ]
            .join(" ")
            .toLowerCase();

          const reportDate =
            report.created_at
              ? new Date(
                  report.created_at
                )
              : null;

          const validReportDate =
            reportDate &&
            !Number.isNaN(
              reportDate.getTime()
            );

          let dateOk = true;

          if (
            !invalidRange &&
            validReportDate
          ) {
            if (
              start &&
              reportDate < start
            ) {
              dateOk = false;
            }

            if (
              end &&
              reportDate > end
            ) {
              dateOk = false;
            }
          }

          const statusOk =
            status ===
              "All Status" ||
            normalizeStatus(
              report.status
            ).toLowerCase() ===
              status.toLowerCase();

          const diseaseOk =
            disease ===
              "All Diseases" ||
            report.disease ===
              disease;

          const talukOk =
            taluk ===
              "All Taluks" ||
            report.taluk_name ===
              taluk;

          return (
            (!query ||
              text.includes(query)) &&
            diseaseOk &&
            talukOk &&
            statusOk &&
            dateOk
          );
        }
      );
    }, [
      reports,
      search,
      status,
      disease,
      taluk,
      startDate,
      endDate,
    ]);

  // ==========================================================
  // RESET PAGINATION
  // ==========================================================

  useEffect(() => {
    setPage(1);
  }, [
    search,
    status,
    disease,
    taluk,
    startDate,
    endDate,
  ]);

  // ==========================================================
  // CLOSE ACTION MENU
  // ==========================================================

  useEffect(() => {
    const close = () => {
      setMenuId(null);
    };

    document.addEventListener(
      "mousedown",
      close
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        close
      );
    };
  }, []);

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const pageCount =
    Math.max(
      1,
      Math.ceil(
        filtered.length /
          perPage
      )
    );

  const safePage =
    Math.min(
      page,
      pageCount
    );

  const visible =
    filtered.slice(
      (safePage - 1) *
        perPage,
      safePage * perPage
    );

  const showingStart =
    filtered.length
      ? (safePage - 1) *
          perPage +
        1
      : 0;

  const showingEnd =
    Math.min(
      safePage * perPage,
      filtered.length
    );

  // ==========================================================
  // AGENT COUNT
  // ==========================================================

  const districtAgents =
    overview?.active_agents ??
    new Set(
      reports
        .map(
          (report) =>
            report.agent_id
        )
        .filter(Boolean)
    ).size;

  // ==========================================================
  // RESET FILTERS
  // ==========================================================

  function resetFilters() {
    setSearch("");
    setStatus(
      "All Status"
    );
    setDisease(
      "All Diseases"
    );
    setTaluk(
      "All Taluks"
    );
    setStartDate("");
    setEndDate("");
    setPage(1);
  }

  // ==========================================================
  // EXPORT
  // ==========================================================

  function exportCsv() {
    if (!filtered.length) {
      return;
    }

    const rows =
      filtered.map(
        (report) => [
          report.report_id ||
            `RPT-${String(
              report.id
            ).padStart(4, "0")}`,

          report.disease,

          report.taluk_name,

          report.agent_name,

          report.cases,

          normalizeStatus(
            report.status
          ),

          priorityFor(report),

          formatDate(
            report.created_at
          ),

          formatTime(
            report.created_at
          ),
        ]
      );

    const csv = [
      [
        "Report ID",
        "Disease",
        "Taluk",
        "Agent",
        "Cases",
        "Status",
        "Priority",
        "Submitted Date",
        "Submitted Time",
      ],

      ...rows,
    ]
      .map(
        (row) =>
          row
            .map(
              (value) =>
                `"${String(
                  value ?? ""
                ).replaceAll(
                  '"',
                  '""'
                )}"`
            )
            .join(",")
      )
      .join("\n");

    const blob =
      new Blob(
        [csv],
        {
          type:
            "text/csv;charset=utf-8",
        }
      );

    const url =
      URL.createObjectURL(
        blob
      );

    const anchor =
      document.createElement(
        "a"
      );

    anchor.href = url;

    anchor.download =
      `${districtName
        .toLowerCase()
        .replace(
          /\s+/g,
          "-"
        )}-disease-reports.csv`;

    document.body.appendChild(
      anchor
    );

    anchor.click();

    anchor.remove();

    URL.revokeObjectURL(
      url
    );
  }

  // ==========================================================
  // DATE PRESETS
  // ==========================================================

  function applyPreset(
    preset
  ) {
    const today =
      new Date();

    if (
      preset === "all"
    ) {
      setStartDate("");
      setEndDate("");
      setDateOpen(false);
      return;
    }

    let start =
      new Date(today);

    const end =
      new Date(today);

    if (
      preset === "7"
    ) {
      start.setDate(
        start.getDate() -
          6
      );
    }

    if (
      preset === "30"
    ) {
      start.setDate(
        start.getDate() -
          29
      );
    }

    if (
      preset === "month"
    ) {
      start =
        new Date(
          today.getFullYear(),
          today.getMonth(),
          1
        );
    }

    setStartDate(
      toInputDate(start)
    );

    setEndDate(
      toInputDate(end)
    );

    setDateOpen(false);
  }

  // ==========================================================
  // CREATE REPORT
  // ==========================================================

  async function createReport(
    payload
  ) {
    if (
      !onCreateReport
    ) {
      setNewReportOpen(
        false
      );

      return;
    }

    try {
      setSaving(true);

      await onCreateReport(
        payload
      );

      setNewReportOpen(
        false
      );

      // New report should be visible immediately.
      resetFilters();

    } finally {
      setSaving(false);
    }
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="space-y-5">

      {/* ======================================================
          DISTRICT SCOPE
      ====================================================== */}

      <div
        className="
          rounded-2xl
          bg-[#087A32]
          px-5
          py-4
          text-white
          shadow-[0_7px_20px_rgba(8,122,50,.14)]
        "
      >
        <div
          className="
            flex
            items-center
            justify-between
            gap-6
          "
        >
          <div
            className="
              flex
              min-w-0
              items-center
              gap-3
            "
          >
            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-white/10
              "
            >
              <ClipboardList
                size={21}
              />
            </div>

            <div className="min-w-0">
              <div
                className="
                  text-[14px]
                  font-semibold
                "
              >
                You are viewing:{" "}
                {districtName}{" "}
                District
              </div>

              <div
                className="
                  mt-1
                  text-[10px]
                  text-white/80
                "
              >
                Scoped to{" "}
                {taluks.length}{" "}
                taluks and{" "}
                {districtAgents}{" "}
                field agents reporting
                under your supervision
              </div>
            </div>
          </div>

          <div
            className="
              hidden
              shrink-0
              gap-9
              text-right
              sm:flex
            "
          >
            <div>
              <div className="text-[19px] font-semibold">
                {overview?.total_taluks ??
                  taluks.length}
              </div>

              <div className="text-[9px] uppercase tracking-[.06em] text-white/85">
                Taluks
              </div>
            </div>

            <div>
              <div className="text-[19px] font-semibold">
                {districtAgents}
              </div>

              <div className="text-[9px] uppercase tracking-[.06em] text-white/85">
                Agents
              </div>
            </div>

            <div>
              <div className="text-[19px] font-semibold">
                {overview?.total_reports ??
                  reports.length}
              </div>

              <div className="text-[9px] uppercase tracking-[.06em] text-white/85">
                Reports
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div
        className="
          flex
          items-end
          justify-between
          gap-4
        "
      >
        <div>
          <h1
            className="
              text-[26px]
              font-semibold
              tracking-[-.035em]
              text-[#101010]
            "
          >
            Disease Reports
          </h1>

          <p
            className="
              mt-1
              text-[12px]
              text-[#66727D]
            "
          >
            Case reports submitted by
            agents across{" "}
            {districtName}’s{" "}
            {taluks.length ||
              overview?.total_taluks ||
              0}{" "}
            taluks —{" "}
            {formatDate(
              new Date()
            )}
            .
          </p>
        </div>

        <div
          className="
            flex
            shrink-0
            items-center
            gap-2
          "
        >
          <button
            type="button"
            onClick={exportCsv}
            disabled={
              !filtered.length
            }
            className="
              inline-flex
              h-11
              items-center
              gap-2
              rounded-xl
              border
              border-[#DDE5E0]
              bg-white
              px-4
              text-[11px]
              font-semibold
              text-[#26334A]
              shadow-[0_2px_8px_rgba(25,50,40,.025)]
              hover:bg-[#F7FAF8]
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >
            <Download
              size={15}
            />

            Export
          </button>

          <button
            type="button"
            onClick={() =>
              setNewReportOpen(
                true
              )
            }
            className="
              inline-flex
              h-11
              items-center
              gap-2
              rounded-xl
              bg-[#087A32]
              px-4
              text-[11px]
              font-semibold
              text-white
              shadow-[0_5px_14px_rgba(8,122,50,.16)]
              hover:bg-[#066728]
            "
          >
            <FilePlus2
              size={15}
            />

            New Report
          </button>
        </div>
      </div>

      {/* ======================================================
          SUMMARY CARDS
      ====================================================== */}

      <div
        className="
          grid
          gap-4
          lg:grid-cols-3
        "
      >
        {summaryCards.length ? (
          summaryCards.map(
            (summary) => (
              <SummaryCard
                key={
                  summary.taluk
                }
                summary={
                  summary
                }
              />
            )
          )
        ) : (
          <div
            className="
              rounded-2xl
              border
              border-dashed
              border-[#DDE5E0]
              bg-white
              px-5
              py-7
              text-[11px]
              text-[#718096]
              lg:col-span-3
            "
          >
            No taluk-level report
            data is available yet.
          </div>
        )}
      </div>

      {/* ======================================================
          FILTER BAR
      ====================================================== */}

      <div
        className="
          relative
          rounded-2xl
          border
          border-[#E5EAE7]
          bg-white
          p-3
          shadow-[0_4px_15px_rgba(25,50,40,.025)]
        "
      >
        <div
          className="
            grid
            gap-2.5
            xl:grid-cols-[1.45fr_.72fr_.72fr_.72fr_1fr_auto]
          "
        >

          {/* SEARCH */}

          <label
            className="
              flex
              h-11
              items-center
              gap-2
              rounded-xl
              border
              border-[#E1E7E3]
              px-3.5
              focus-within:border-[#087A32]
            "
          >
            <Search
              size={16}
              className="shrink-0 text-[#758195]"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search reports, agents, diseases…"
              className="
                min-w-0
                flex-1
                bg-transparent
                text-[11px]
                outline-none
                placeholder:text-[#8A94A3]
              "
            />
          </label>

          {/* STATUS */}

          <SelectField
            value={status}
            onChange={(event) =>
              setStatus(
                event.target.value
              )
            }
          >
            <option>
              All Status
            </option>

            <option>
              Pending Review
            </option>

            <option>
              Approved
            </option>

            <option>
              Rejected
            </option>
          </SelectField>

          {/* DISEASE */}

          <SelectField
            value={disease}
            onChange={(event) =>
              setDisease(
                event.target.value
              )
            }
          >
            <option>
              All Diseases
            </option>

            {(DISEASES || []).map(
              (item) => (
                <option
                  key={item}
                >
                  {item}
                </option>
              )
            )}
          </SelectField>

          {/* TALUK */}

          <SelectField
            value={taluk}
            onChange={(event) =>
              setTaluk(
                event.target.value
              )
            }
          >
            <option>
              All Taluks
            </option>

            {taluks.map(
              (item) => (
                <option
                  key={item}
                >
                  {item}
                </option>
              )
            )}
          </SelectField>

          {/* DATE */}

          <div className="relative">
            <button
              type="button"
              onClick={() =>
                setDateOpen(
                  (value) =>
                    !value
                )
              }
              className="
                flex
                h-11
                w-full
                items-center
                justify-between
                gap-2
                rounded-xl
                border
                border-[#E1E7E3]
                bg-white
                px-3.5
                text-left
                text-[11px]
                font-medium
                text-[#26334A]
                hover:bg-[#FAFCFB]
              "
            >
              <span
                className="
                  flex
                  min-w-0
                  items-center
                  gap-2
                "
              >
                <CalendarDays
                  size={15}
                  className="shrink-0 text-[#66727D]"
                />

                <span className="truncate">
                  {startDate &&
                  endDate
                    ? `${dateLabel(
                        startDate
                      )} - ${dateLabel(
                        endDate
                      )}`
                    : "All dates"}
                </span>
              </span>

              <ChevronDown
                size={14}
                className={`
                  shrink-0
                  transition-transform
                  ${
                    dateOpen
                      ? "rotate-180"
                      : ""
                  }
                `}
              />
            </button>

            {dateOpen && (
              <div
                className="
                  absolute
                  right-0
                  top-[calc(100%+8px)]
                  z-50
                  w-[330px]
                  rounded-2xl
                  border
                  border-[#E0E7E3]
                  bg-white
                  p-4
                  shadow-[0_18px_45px_rgba(16,42,67,.14)]
                "
              >
                <div
                  className="
                    text-[11px]
                    font-semibold
                    text-[#26334A]
                  "
                >
                  Report date range
                </div>

                <div
                  className="
                    mt-3
                    grid
                    grid-cols-2
                    gap-2
                  "
                >
                  <label>
                    <span
                      className="
                        mb-1
                        block
                        text-[9px]
                        font-semibold
                        uppercase
                        tracking-[.06em]
                        text-[#8A94A3]
                      "
                    >
                      From
                    </span>

                    <input
                      type="date"
                      value={
                        startDate
                      }
                      max={
                        endDate ||
                        undefined
                      }
                      onChange={(
                        event
                      ) =>
                        setStartDate(
                          event.target
                            .value
                        )
                      }
                      className="
                        h-10
                        w-full
                        rounded-xl
                        border
                        border-[#E1E7E3]
                        px-2.5
                        text-[10px]
                        outline-none
                        focus:border-[#087A32]
                      "
                    />
                  </label>

                  <label>
                    <span
                      className="
                        mb-1
                        block
                        text-[9px]
                        font-semibold
                        uppercase
                        tracking-[.06em]
                        text-[#8A94A3]
                      "
                    >
                      To
                    </span>

                    <input
                      type="date"
                      value={
                        endDate
                      }
                      min={
                        startDate ||
                        undefined
                      }
                      onChange={(
                        event
                      ) =>
                        setEndDate(
                          event.target
                            .value
                        )
                      }
                      className="
                        h-10
                        w-full
                        rounded-xl
                        border
                        border-[#E1E7E3]
                        px-2.5
                        text-[10px]
                        outline-none
                        focus:border-[#087A32]
                      "
                    />
                  </label>
                </div>

                <div
                  className="
                    mt-3
                    grid
                    grid-cols-2
                    gap-2
                  "
                >
                  <button
                    type="button"
                    onClick={() =>
                      applyPreset(
                        "month"
                      )
                    }
                    className="
                      rounded-lg
                      border
                      border-[#E1E7E3]
                      px-2
                      py-2
                      text-[10px]
                      font-semibold
                      hover:bg-[#F7FAF8]
                    "
                  >
                    This month
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      applyPreset(
                        "7"
                      )
                    }
                    className="
                      rounded-lg
                      border
                      border-[#E1E7E3]
                      px-2
                      py-2
                      text-[10px]
                      font-semibold
                      hover:bg-[#F7FAF8]
                    "
                  >
                    Last 7 days
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      applyPreset(
                        "30"
                      )
                    }
                    className="
                      rounded-lg
                      border
                      border-[#E1E7E3]
                      px-2
                      py-2
                      text-[10px]
                      font-semibold
                      hover:bg-[#F7FAF8]
                    "
                  >
                    Last 30 days
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      applyPreset(
                        "all"
                      )
                    }
                    className="
                      rounded-lg
                      border
                      border-[#E1E7E3]
                      px-2
                      py-2
                      text-[10px]
                      font-semibold
                      hover:bg-[#F7FAF8]
                    "
                  >
                    All dates
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setDateOpen(
                      false
                    )
                  }
                  className="
                    mt-3
                    flex
                    w-full
                    items-center
                    justify-center
                    gap-1.5
                    rounded-xl
                    bg-[#087A32]
                    py-2.5
                    text-[10px]
                    font-semibold
                    text-white
                    hover:bg-[#066728]
                  "
                >
                  <Check
                    size={13}
                  />

                  Apply date filter
                </button>
              </div>
            )}
          </div>

          {/* RESET */}

          <button
            type="button"
            onClick={
              resetFilters
            }
            title="Reset filters"
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-xl
              border
              border-[#E1E7E3]
              bg-white
              text-[#52627D]
              hover:bg-[#F5F8F6]
            "
          >
            <RotateCcw
              size={15}
            />
          </button>
        </div>

        {/* ACTIVE FILTER SUMMARY */}

        {(search ||
          status !==
            "All Status" ||
          disease !==
            "All Diseases" ||
          taluk !==
            "All Taluks" ||
          startDate ||
          endDate) && (
          <div
            className="
              mt-2
              flex
              items-center
              justify-between
              gap-3
              border-t
              border-[#EEF2EF]
              pt-2
            "
          >
            <div
              className="
                text-[9px]
                text-[#788496]
              "
            >
              Showing{" "}
              <span className="font-semibold text-[#26334A]">
                {filtered.length}
              </span>{" "}
              matching reports
            </div>

            <button
              type="button"
              onClick={
                resetFilters
              }
              className="
                text-[9px]
                font-semibold
                text-[#087A32]
                hover:underline
              "
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* ======================================================
          REPORT LIST
      ====================================================== */}

      <section
        className="
          overflow-hidden
          rounded-2xl
          border
          border-[#E4EAE7]
          bg-white
          shadow-[0_4px_16px_rgba(24,54,42,.035)]
        "
      >
        <div
          className="
            flex
            items-center
            justify-between
            gap-3
            border-b
            border-[#EEF1EF]
            px-5
            py-4
          "
        >
          <div
            className="
              flex
              items-center
              gap-2.5
            "
          >
            <div
              className="
                flex
                h-7
                w-7
                items-center
                justify-center
                rounded-lg
                bg-[#F1E9FF]
                text-[#7251A9]
              "
            >
              <ClipboardList
                size={15}
              />
            </div>

            <h2
              className="
                text-[14px]
                font-semibold
                text-[#17233D]
              "
            >
              Report List
            </h2>
          </div>

          <div
            className="
              text-[10px]
              text-[#66727D]
            "
          >
            Showing{" "}
            {showingStart}–{
              showingEnd
            }{" "}
            of{" "}
            {filtered.length}{" "}
            reports
          </div>
        </div>

        <div className="overflow-x-auto">
          <table
            className="
              w-full
              min-w-[1120px]
              text-left
            "
          >
            <thead
              className="
                bg-[#FAFBFA]
                text-[#768295]
              "
            >
              <tr>
                {[
                  "REPORT ID",
                  "DISEASE",
                  "TALUK",
                  "AGENT",
                  "SUBMITTED",
                  "STATUS",
                  "PRIORITY",
                  "ACTIONS",
                ].map(
                  (heading) => (
                    <th
                      key={heading}
                      className="
                        border-b
                        border-[#E9EEEC]
                        px-5
                        py-3
                        text-[9px]
                        font-bold
                        tracking-[.05em]
                      "
                    >
                      {heading}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {visible.map(
                (report) => {
                  const statusValue =
                    normalizeStatus(
                      report.status
                    );

                  const priority =
                    priorityFor(
                      report
                    );

                  return (
                    <tr
                      key={
                        report.id
                      }
                      className="
                        border-b
                        border-[#EEF1EF]
                        transition
                        hover:bg-[#FBFDFB]
                      "
                    >
                      {/* REPORT ID */}

                      <td
                        className="
                          px-5
                          py-3.5
                          text-[11px]
                          font-semibold
                          text-[#25324A]
                        "
                      >
                        {report.report_id ||
                          `RPT-${String(
                            report.id
                          ).padStart(
                            4,
                            "0"
                          )}`}
                      </td>

                      {/* DISEASE */}

                      <td className="px-5 py-3.5">
                        <div
                          className="
                            flex
                            items-center
                            gap-2.5
                          "
                        >
                          <DiseaseIcon
                            disease={
                              report.disease
                            }
                          />

                          <span
                            className="
                              text-[11px]
                              font-semibold
                              text-[#26334A]
                            "
                          >
                            {
                              report.disease
                            }
                          </span>
                        </div>
                      </td>

                      {/* TALUK */}

                      <td className="px-5 py-3.5">
                        <span
                          className="
                            inline-flex
                            items-center
                            gap-1.5
                            rounded-md
                            bg-[#F2F5F3]
                            px-2
                            py-1
                            text-[10px]
                            font-medium
                            text-[#26334A]
                          "
                        >
                          <MapPin
                            size={11}
                            className="text-[#D21D6B]"
                          />

                          {report.taluk_name ||
                            "—"}
                        </span>
                      </td>

                      {/* AGENT */}

                      <td
                        className="
                          px-5
                          py-3.5
                          text-[11px]
                          font-medium
                          text-[#26334A]
                        "
                      >
                        {report.agent_name ||
                          "—"}
                      </td>

                      {/* SUBMITTED */}

                      <td className="px-5 py-3.5">
                        <div
                          className="
                            text-[10px]
                            font-medium
                            text-[#26334A]
                          "
                        >
                          {formatDate(
                            report.created_at
                          )}
                        </div>

                        <div
                          className="
                            mt-0.5
                            text-[9px]
                            text-[#7C8795]
                          "
                        >
                          {formatTime(
                            report.created_at
                          )}
                        </div>
                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-3.5">
                        <StatusBadge
                          tone={statusTone(
                            statusValue
                          )}
                        >
                          {
                            statusValue
                          }
                        </StatusBadge>
                      </td>

                      {/* PRIORITY */}

                      <td className="px-5 py-3.5">
                        <RiskBadge
                          level={
                            priority ===
                            "Medium"
                              ? "Moderate"
                              : priority
                          }
                        />
                      </td>

                      {/* ACTIONS */}

                      <td className="px-5 py-3.5">
                        <div className="relative flex gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setSelected(
                                report
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
                              text-[#087A32]
                              hover:bg-[#F5F8F6]
                            "
                            aria-label="View report"
                          >
                            <Eye
                              size={15}
                            />
                          </button>

                          <button
                            type="button"
                            onClick={(
                              event
                            ) => {
                              event.stopPropagation();

                              setMenuId(
                                (current) =>
                                  current ===
                                  report.id
                                    ? null
                                    : report.id
                              );
                            }}
                            className="
                              flex
                              h-8
                              w-8
                              items-center
                              justify-center
                              rounded-lg
                              border
                              border-[#DDE5E0]
                              text-[#087A32]
                              hover:bg-[#F5F8F6]
                            "
                            aria-label="More actions"
                          >
                            <MoreVertical
                              size={15}
                            />
                          </button>

                          {menuId ===
                            report.id && (
                            <div
                              className="
                                absolute
                                right-0
                                top-9
                                z-30
                                w-[160px]
                                overflow-hidden
                                rounded-xl
                                border
                                border-[#E0E7E3]
                                bg-white
                                p-1.5
                                shadow-[0_15px_35px_rgba(16,42,67,.14)]
                              "
                              onMouseDown={(
                                event
                              ) =>
                                event.stopPropagation()
                              }
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setSelected(
                                    report
                                  );
                                  setMenuId(
                                    null
                                  );
                                }}
                                className="
                                  flex
                                  w-full
                                  items-center
                                  gap-2
                                  rounded-lg
                                  px-2.5
                                  py-2
                                  text-left
                                  text-[10px]
                                  font-medium
                                  hover:bg-[#F5F8F6]
                                "
                              >
                                <Eye
                                  size={13}
                                />

                                View details
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const csv =
                                    [
                                      [
                                        "Report ID",
                                        report.report_id ||
                                          report.id,
                                      ],
                                      [
                                        "Disease",
                                        report.disease,
                                      ],
                                      [
                                        "Taluk",
                                        report.taluk_name,
                                      ],
                                      [
                                        "Agent",
                                        report.agent_name,
                                      ],
                                      [
                                        "Cases",
                                        report.cases,
                                      ],
                                      [
                                        "Status",
                                        statusValue,
                                      ],
                                      [
                                        "Priority",
                                        priority,
                                      ],
                                      [
                                        "Submitted",
                                        formatDate(
                                          report.created_at
                                        ),
                                      ],
                                    ]
                                      .map(
                                        ([
                                          key,
                                          value,
                                        ]) =>
                                          `"${key}","${String(
                                            value ??
                                              ""
                                          ).replaceAll(
                                            '"',
                                            '""'
                                          )}"`
                                      )
                                      .join(
                                        "\n"
                                      );

                                  const blob =
                                    new Blob(
                                      [csv],
                                      {
                                        type:
                                          "text/csv;charset=utf-8",
                                      }
                                    );

                                  const url =
                                    URL.createObjectURL(
                                      blob
                                    );

                                  const anchor =
                                    document.createElement(
                                      "a"
                                    );

                                  anchor.href =
                                    url;

                                  anchor.download =
                                    `${
                                      report.report_id ||
                                      `RPT-${report.id}`
                                    }.csv`;

                                  document.body.appendChild(
                                    anchor
                                  );

                                  anchor.click();

                                  anchor.remove();

                                  URL.revokeObjectURL(
                                    url
                                  );

                                  setMenuId(
                                    null
                                  );
                                }}
                                className="
                                  flex
                                  w-full
                                  items-center
                                  gap-2
                                  rounded-lg
                                  px-2.5
                                  py-2
                                  text-left
                                  text-[10px]
                                  font-medium
                                  hover:bg-[#F5F8F6]
                                "
                              >
                                <Download
                                  size={13}
                                />

                                Export report
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }
              )}
            </tbody>
          </table>

          {/* ==================================================
              EMPTY STATE
          ================================================== */}

          {!visible.length && (
            <div
              className="
                px-5
                py-14
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
                No reports found
              </div>

              <div
                className="
                  mt-1
                  text-[10px]
                  text-[#718096]
                "
              >
                {reports.length
                  ? "The current filters are hiding the available reports."
                  : "No disease reports were returned by the backend."}
              </div>

              {reports.length >
                0 && (
                <button
                  type="button"
                  onClick={
                    resetFilters
                  }
                  className="
                    mt-4
                    inline-flex
                    items-center
                    gap-2
                    rounded-lg
                    bg-[#087A32]
                    px-3.5
                    py-2
                    text-[10px]
                    font-semibold
                    text-white
                    hover:bg-[#066728]
                  "
                >
                  <RotateCcw
                    size={13}
                  />

                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* ==================================================
            PAGINATION
        ================================================== */}

        <div
          className="
            flex
            items-center
            justify-between
            gap-3
            px-5
            py-4
          "
        >
          <span
            className="
              text-[10px]
              text-[#66727D]
            "
          >
            Showing{" "}
            {showingStart} to{" "}
            {showingEnd} of{" "}
            {filtered.length}{" "}
            reports
          </span>

          <div
            className="
              flex
              items-center
              gap-1
            "
          >
            <button
              type="button"
              disabled={
                safePage <= 1
              }
              onClick={() =>
                setPage(1)
              }
              className="
                flex
                h-8
                w-8
                items-center
                justify-center
                rounded-lg
                border
                border-[#E0E6E3]
                text-[#66727D]
                hover:bg-[#F5F8F6]
                disabled:cursor-not-allowed
                disabled:opacity-30
              "
            >
              <ChevronsLeft
                size={14}
              />
            </button>

            <button
              type="button"
              disabled={
                safePage <= 1
              }
              onClick={() =>
                setPage(
                  (value) =>
                    Math.max(
                      1,
                      value - 1
                    )
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
                border-[#E0E6E3]
                text-[#66727D]
                hover:bg-[#F5F8F6]
                disabled:cursor-not-allowed
                disabled:opacity-30
              "
            >
              <ChevronLeft
                size={14}
              />
            </button>

            {Array.from(
              {
                length:
                  pageCount,
              },
              (
                _,
                index
              ) =>
                index + 1
            )
              .slice(
                Math.max(
                  0,
                  safePage - 2
                ),
                Math.min(
                  pageCount,
                  safePage + 1
                )
              )
              .map(
                (number) => (
                  <button
                    key={
                      number
                    }
                    type="button"
                    onClick={() =>
                      setPage(
                        number
                      )
                    }
                    className={`
                      flex
                      h-8
                      min-w-8
                      items-center
                      justify-center
                      rounded-lg
                      border
                      px-2
                      text-[10px]
                      font-semibold
                      ${
                        number ===
                        safePage
                          ? "border-[#087A32] bg-[#087A32] text-white"
                          : "border-[#E0E6E3] text-[#52627D] hover:bg-[#F5F8F6]"
                      }
                    `}
                  >
                    {
                      number
                    }
                  </button>
                )
              )}

            <button
              type="button"
              disabled={
                safePage >=
                pageCount
              }
              onClick={() =>
                setPage(
                  (value) =>
                    Math.min(
                      pageCount,
                      value + 1
                    )
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
                border-[#E0E6E3]
                text-[#66727D]
                hover:bg-[#F5F8F6]
                disabled:cursor-not-allowed
                disabled:opacity-30
              "
            >
              <ChevronRight
                size={14}
              />
            </button>

            <button
              type="button"
              disabled={
                safePage >=
                pageCount
              }
              onClick={() =>
                setPage(
                  pageCount
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
                border-[#E0E6E3]
                text-[#66727D]
                hover:bg-[#F5F8F6]
                disabled:cursor-not-allowed
                disabled:opacity-30
              "
            >
              <ChevronsRight
                size={14}
              />
            </button>
          </div>
        </div>
      </section>

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <div
        className="
          flex
          items-center
          justify-between
          overflow-hidden
          rounded-xl
          border
          border-[#DDEBE1]
          bg-[#F3FAF5]
          px-4
          py-3
          text-[11px]
          text-[#2D7047]
        "
      >
        <div>
          <div className="font-semibold">
            Ensure Timely Review
          </div>

          <div
            className="
              mt-0.5
              text-[10px]
              text-[#5D8068]
            "
          >
            Timely review of reports
            helps in early detection
            and quick response.
          </div>
        </div>

        <div
          className="
            hidden
            text-[26px]
            opacity-50
            sm:block
          "
        >
          ⌕
        </div>
      </div>

      {/* ======================================================
          MODALS
      ====================================================== */}

      {selected && (
        <ReportDetails
          report={selected}
          onClose={() =>
            setSelected(null)
          }
        />
      )}

      {newReportOpen && (
        <NewReportModal
          agents={agents}
          saving={saving}
          onClose={() =>
            !saving &&
            setNewReportOpen(
              false
            )
          }
          onCreate={
            createReport
          }
        />
      )}
    </div>
  );
}