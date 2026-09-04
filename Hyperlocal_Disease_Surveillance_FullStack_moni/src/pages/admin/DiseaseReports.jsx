import { useEffect, useMemo, useState } from "react";

import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  FileText,
  Loader2,
  MapPin,
  MoreHorizontal,
  RefreshCw,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";

import { api } from "../../api";

/* ============================================================
   CONSTANTS
   ============================================================ */

const GREEN = "#087A32";
const DARK = "#10243A";
const MUTED = "#667085";

const PAGE_SIZE = 8;

const DISEASES = [
  "All Diseases",
  "Dengue",
  "Malaria",
  "Typhoid",
  "Influenza",
  "Chikungunya",
];

const SEVERITIES = [
  "All Severity",
  "Low",
  "Moderate",
  "High",
  "Critical",
];

/* ============================================================
   HELPERS
   ============================================================ */

const getSeverity = (value) => {
  if (!value) return "Moderate";

  const text = String(value).trim().toLowerCase();

  if (text === "critical") return "Critical";
  if (text === "high") return "High";
  if (text === "low") return "Low";

  return "Moderate";
};

const severityClasses = (severity) => {
  switch (getSeverity(severity)) {
    case "Critical":
      return "bg-[#FDE8E7] text-[#C62828]";

    case "High":
      return "bg-[#FFF0E7] text-[#D85B16]";

    case "Low":
      return "bg-[#EAF6EE] text-[#087A32]";

    default:
      return "bg-[#FFF5E5] text-[#B7791F]";
  }
};

const initials = (name = "") => {
  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return "AG";

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
};

const formatDate = (value) => {
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
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getWeekLabel = (weekNumber) => {
  if (!weekNumber) return "—";

  const numeric = Number(weekNumber);

  if (Number.isNaN(numeric)) {
    return String(weekNumber);
  }

  return `Week ${numeric % 100}`;
};

/* ============================================================
   STAT CARD
   ============================================================ */

function StatCard({
  icon: Icon,
  label,
  value,
  helper,
  tone = "green",
}) {
  const tones = {
    green: "bg-[#EAF6EE] text-[#087A32]",
    blue: "bg-[#EDF4FF] text-[#2563EB]",
    amber: "bg-[#FFF3E1] text-[#D97706]",
    red: "bg-[#FDEAEA] text-[#D92D20]",
  };

  return (
    <div className="min-h-[94px] rounded-[11px] border border-[#E4E9E6] bg-white px-[15px] py-[14px] shadow-[0_2px_8px_rgba(31,49,68,.035)]">
      <div className="flex items-start gap-[11px]">
        <div
          className={`flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full ${
            tones[tone] || tones.green
          }`}
        >
          <Icon size={19} strokeWidth={1.8} />
        </div>

        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-[0.02em] text-[#667085]">
            {label}
          </p>

          <p className="mt-[3px] text-[22px] font-semibold leading-none text-[#10243A]">
            {value}
          </p>

          {helper && (
            <p className="mt-[6px] text-[9px] text-[#7B8794]">
              {helper}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SEVERITY BADGE
   ============================================================ */

function SeverityBadge({ severity }) {
  const value = getSeverity(severity);

  return (
    <span
      className={`inline-flex items-center gap-[5px] rounded-[6px] px-[8px] py-[4px] text-[9px] font-semibold ${severityClasses(
        value
      )}`}
    >
      <span className="h-[5px] w-[5px] rounded-full bg-current" />

      {value}
    </span>
  );
}

/* ============================================================
   EMPTY STATE
   ============================================================ */

function EmptyState({
  loading,
  hasFilters,
  onClear,
}) {
  if (loading) {
    return (
      <div className="flex min-h-[330px] flex-col items-center justify-center">
        <Loader2
          size={25}
          className="animate-spin text-[#087A32]"
        />

        <p className="mt-[12px] text-[11px] font-medium text-[#667085]">
          Loading disease reports...
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[330px] flex-col items-center justify-center px-[20px]">
      <div className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-[#EDF7F0] text-[#087A32]">
        <FileText size={27} strokeWidth={1.5} />
      </div>

      <p className="mt-[13px] text-[12px] font-semibold text-[#344054]">
        No disease reports found
      </p>

      <p className="mt-[5px] max-w-[350px] text-center text-[10px] leading-[1.6] text-[#7B8794]">
        {hasFilters
          ? "Try changing the selected filters or clear the filters to view all submitted reports."
          : "Disease reports submitted by field agents will appear here."}
      </p>

      {hasFilters && (
        <button
          type="button"
          onClick={onClear}
          className="mt-[13px] rounded-[6px] border border-[#CFE1D5] bg-white px-[13px] py-[7px] text-[10px] font-semibold text-[#087A32] hover:bg-[#F5FAF7]"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}

/* ============================================================
   REPORT DETAILS MODAL
   ============================================================ */

function ReportDetailsModal({
  report,
  onClose,
}) {
  if (!report) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#10243A]/30 px-[20px] py-[30px] backdrop-blur-[2px]">
      <div className="w-full max-w-[520px] overflow-hidden rounded-[12px] border border-[#DDE5E0] bg-white shadow-[0_25px_70px_rgba(16,36,58,.22)]">

        <div className="flex items-center justify-between border-b border-[#E7ECE9] px-[20px] py-[15px]">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[.04em] text-[#087A32]">
              Disease Report
            </p>

            <h2 className="mt-[2px] text-[16px] font-semibold text-[#10243A]">
              Report #{report.id}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-full text-[#667085] hover:bg-[#F2F5F3]"
          >
            <X size={17} />
          </button>
        </div>

        <div className="p-[20px]">

          <div className="grid grid-cols-2 gap-[10px]">

            <DetailItem
              label="Disease"
              value={report.disease || "—"}
            />

            <DetailItem
              label="Severity"
              value={
                <SeverityBadge
                  severity={report.severity}
                />
              }
            />

            <DetailItem
              label="Confirmed Cases"
              value={report.cases ?? 0}
            />

            <DetailItem
              label="Reporting Week"
              value={getWeekLabel(report.week_number)}
            />

            <DetailItem
              label="Taluk"
              value={report.taluk_name || "—"}
            />

            <DetailItem
              label="Submitted By"
              value={report.agent_name || "—"}
            />

            <DetailItem
              label="Submitted On"
              value={formatDateTime(report.created_at)}
            />

            <DetailItem
              label="Report ID"
              value={`#${report.id}`}
            />

          </div>

          <div className="mt-[15px] rounded-[9px] border border-[#DCEBE1] bg-[#F5FAF7] p-[13px]">
            <div className="flex items-start gap-[9px]">

              <div className="mt-[1px] text-[#087A32]">
                <ShieldAlert size={16} />
              </div>

              <div>
                <p className="text-[10px] font-semibold text-[#173A28]">
                  Surveillance Information
                </p>

                <p className="mt-[4px] text-[9px] leading-[1.65] text-[#52606D]">
                  This report is part of the community disease
                  surveillance dataset. It represents submitted
                  surveillance information and should be used for
                  monitoring and public-health response rather than
                  individual diagnosis.
                </p>
              </div>

            </div>
          </div>

        </div>

        <div className="flex justify-end border-t border-[#E7ECE9] px-[20px] py-[13px]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[6px] bg-[#087A32] px-[16px] py-[8px] text-[10px] font-semibold text-white hover:bg-[#066A2B]"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}

/* ============================================================
   DETAIL ITEM
   ============================================================ */

function DetailItem({
  label,
  value,
}) {
  return (
    <div className="rounded-[8px] border border-[#E6EBE8] bg-[#FBFCFB] px-[12px] py-[10px]">
      <p className="text-[8px] font-semibold uppercase tracking-[.03em] text-[#8A94A3]">
        {label}
      </p>

      <div className="mt-[5px] text-[10px] font-semibold text-[#344054]">
        {value}
      </div>
    </div>
  );
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */

export default function DiseaseReports({
  location,
}) {
  const [reports, setReports] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [disease, setDisease] = useState("All Diseases");
  const [severity, setSeverity] = useState("All Severity");
  const [week, setWeek] = useState("All Weeks");

  const [page, setPage] = useState(1);

  const [selectedReport, setSelectedReport] =
    useState(null);

  const [refreshing, setRefreshing] =
    useState(false);

  /* ==========================================================
     LOAD REPORTS
     ========================================================== */

  const loadReports = async () => {
    setError("");

    try {
      setLoading(true);

      const params = {};

      const talukId =
        location?.taluk?.id ??
        location?.taluk_id ??
        null;

      if (
        talukId !== null &&
        talukId !== undefined &&
        talukId !== ""
      ) {
        const numericTalukId = Number(talukId);

        if (Number.isInteger(numericTalukId)) {
          params.taluk_id = numericTalukId;
        }
      }

      if (
        disease &&
        disease !== "All Diseases"
      ) {
        params.disease = disease;
      }

      const data =
        await api.getAllReports(params);

      const rows = Array.isArray(data)
        ? data
        : Array.isArray(data?.reports)
        ? data.reports
        : [];

      setReports(rows);
    } catch (err) {
      console.error(
        "Failed to load disease reports:",
        err
      );

      setReports([]);

      setError(
        err?.message ||
          "Unable to load disease reports."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* ==========================================================
     INITIAL / LOCATION / DISEASE LOAD
     ========================================================== */

  useEffect(() => {
    loadReports();
  }, [
    location?.taluk?.id,
    location?.taluk_id,
    disease,
  ]);

  /* ==========================================================
     LOCAL FILTERING
     ========================================================== */

  const filteredReports = useMemo(() => {
    const searchText =
      search.trim().toLowerCase();

    return reports.filter((report) => {

      const matchesSearch =
        !searchText ||
        String(report.id || "")
          .toLowerCase()
          .includes(searchText) ||
        String(report.disease || "")
          .toLowerCase()
          .includes(searchText) ||
        String(report.taluk_name || "")
          .toLowerCase()
          .includes(searchText) ||
        String(report.agent_name || "")
          .toLowerCase()
          .includes(searchText);

      const matchesSeverity =
        severity === "All Severity" ||
        getSeverity(report.severity) === severity;

      const matchesWeek =
        week === "All Weeks" ||
        String(report.week_number) ===
          String(week);

      return (
        matchesSearch &&
        matchesSeverity &&
        matchesWeek
      );
    });
  }, [
    reports,
    search,
    severity,
    week,
  ]);

  /* ==========================================================
     STATISTICS
     ========================================================== */

  const stats = useMemo(() => {

    const totalReports =
      reports.length;

    const totalCases =
      reports.reduce(
        (sum, report) =>
          sum + Number(report.cases || 0),
        0
      );

    const criticalReports =
      reports.filter(
        (report) =>
          getSeverity(report.severity) ===
          "Critical"
      ).length;

    const highReports =
      reports.filter(
        (report) =>
          getSeverity(report.severity) ===
          "High"
      ).length;

    const taluks = new Set(
      reports
        .map(
          (report) =>
            report.taluk_name
        )
        .filter(Boolean)
    );

    const diseases = new Set(
      reports
        .map(
          (report) =>
            report.disease
        )
        .filter(Boolean)
    );

    return {
      totalReports,
      totalCases,
      criticalReports,
      highReports,
      taluksCovered: taluks.size,
      diseasesTracked: diseases.size,
    };

  }, [reports]);

  /* ==========================================================
     WEEK OPTIONS
     ========================================================== */

  const weekOptions = useMemo(() => {

    const values = [
      ...new Set(
        reports
          .map(
            (report) =>
              report.week_number
          )
          .filter(
            (value) =>
              value !== null &&
              value !== undefined
          )
      ),
    ];

    values.sort(
      (a, b) =>
        Number(b) - Number(a)
    );

    return values;

  }, [reports]);

  /* ==========================================================
     PAGINATION
     ========================================================== */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredReports.length /
        PAGE_SIZE
    )
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedReports =
    filteredReports.slice(
      (page - 1) * PAGE_SIZE,
      page * PAGE_SIZE
    );

  /* ==========================================================
     RESET PAGE
     ========================================================== */

  useEffect(() => {
    setPage(1);
  }, [
    search,
    severity,
    week,
    disease,
  ]);

  /* ==========================================================
     CLEAR FILTERS
     ========================================================== */

  const clearFilters = () => {
    setSearch("");
    setDisease("All Diseases");
    setSeverity("All Severity");
    setWeek("All Weeks");
    setPage(1);
  };

  const hasFilters =
    Boolean(search.trim()) ||
    disease !== "All Diseases" ||
    severity !== "All Severity" ||
    week !== "All Weeks";

  /* ==========================================================
     REFRESH
     ========================================================== */

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReports();
  };

  /* ==========================================================
     EXPORT CSV
     ========================================================== */

  const exportCsv = () => {
    const rows = filteredReports;

    if (!rows.length) {
      return;
    }

    const headers = [
      "Report ID",
      "Disease",
      "Taluk",
      "Agent",
      "Cases",
      "Severity",
      "Week",
      "Created At",
    ];

    const escapeCsv = (value) => {
      const text =
        value === null ||
        value === undefined
          ? ""
          : String(value);

      return `"${text.replace(
        /"/g,
        '""'
      )}"`;
    };

    const csvRows = [
      headers
        .map(escapeCsv)
        .join(","),
    ];

    rows.forEach((report) => {

      csvRows.push(
        [
          report.id,
          report.disease,
          report.taluk_name,
          report.agent_name,
          report.cases ?? 0,
          getSeverity(
            report.severity
          ),
          report.week_number,
          report.created_at
            ? formatDateTime(
                report.created_at
              )
            : "",
        ]
          .map(escapeCsv)
          .join(",")
      );

    });

    const blob = new Blob(
      [csvRows.join("\n")],
      {
        type:
          "text/csv;charset=utf-8;",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      `disease-reports-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <div className="relative w-full">

      {/* ======================================================
          HERO
          ====================================================== */}

      <section className="relative overflow-hidden rounded-[12px] border border-[#E7ECE9] bg-white">

        <div className="relative min-h-[185px] px-[22px] py-[22px]">

          <div className="relative z-10 max-w-[600px]">

            <p className="text-[9px] font-semibold uppercase tracking-[.08em] text-[#087A32]">
              SURVEILLANCE DATA
            </p>

            <h1 className="mt-[5px] text-[24px] font-semibold tracking-[-.025em] text-[#0F172A]">
              Report Management
            </h1>

            <p className="mt-[6px] max-w-[550px] text-[11px] leading-[1.7] text-[#52606D]">
              Review disease reports submitted by field
              agents, monitor case activity and maintain
              high-quality community surveillance data.
            </p>

            <div className="mt-[17px] flex items-center gap-[8px]">

              <div className="flex items-center gap-[6px] rounded-[6px] border border-[#DCE8E0] bg-[#F5FAF7] px-[9px] py-[6px] text-[9px] font-medium text-[#087A32]">
                <ClipboardList size={12} />
                {stats.totalReports} reports
              </div>

              <div className="flex items-center gap-[6px] rounded-[6px] border border-[#E4E8EC] bg-white px-[9px] py-[6px] text-[9px] font-medium text-[#667085]">
                <MapPin size={12} />
                {stats.taluksCovered} taluks
              </div>

              <div className="flex items-center gap-[6px] rounded-[6px] border border-[#E4E8EC] bg-white px-[9px] py-[6px] text-[9px] font-medium text-[#667085]">
                <BarChart3 size={12} />
                {stats.diseasesTracked} diseases
              </div>

            </div>

          </div>

          {/* Decorative illustration */}

          <div className="pointer-events-none absolute right-[25px] top-0 hidden h-full w-[390px] lg:block">

            <div className="absolute right-[35px] top-[28px] h-[125px] w-[250px] rounded-full bg-[#EEF8F1] blur-[1px]" />

            <div className="absolute right-[70px] top-[42px] flex h-[105px] w-[170px] items-center justify-center rounded-[12px] border border-[#D8E9DE] bg-white/80 shadow-[0_8px_25px_rgba(31,49,68,.06)]">

              <div className="grid w-[125px] grid-cols-4 items-end gap-[7px]">

                <div className="h-[28px] rounded-t-[3px] bg-[#CDE8D5]" />

                <div className="h-[45px] rounded-t-[3px] bg-[#9FD0AD]" />

                <div className="h-[62px] rounded-t-[3px] bg-[#55AA70]" />

                <div className="h-[78px] rounded-t-[3px] bg-[#087A32]" />

              </div>

            </div>

            <div className="absolute right-[235px] top-[67px] flex h-[47px] w-[47px] items-center justify-center rounded-full bg-[#E7F5EB] text-[#087A32]">
              <FileText size={24} />
            </div>

          </div>

        </div>

      </section>

      {/* ======================================================
          STATISTICS
          ====================================================== */}

      <section className="mt-[10px] grid grid-cols-2 gap-[10px] xl:grid-cols-4">

        <StatCard
          icon={FileText}
          label="Total Reports"
          value={stats.totalReports}
          helper="Submitted surveillance reports"
          tone="green"
        />

        <StatCard
          icon={BarChart3}
          label="Total Cases"
          value={stats.totalCases}
          helper="Reported disease cases"
          tone="blue"
        />

        <StatCard
          icon={AlertTriangle}
          label="High / Critical"
          value={
            stats.highReports +
            stats.criticalReports
          }
          helper="Reports requiring attention"
          tone="amber"
        />

        <StatCard
          icon={MapPin}
          label="Taluks Covered"
          value={stats.taluksCovered}
          helper="Reporting locations"
          tone="green"
        />

      </section>

      {/* ======================================================
          MAIN CONTENT
          ====================================================== */}

      <section className="mt-[10px] overflow-hidden rounded-[12px] border border-[#E2E8E4] bg-white shadow-[0_2px_8px_rgba(31,49,68,.035)]">

        {/* HEADER */}

        <div className="border-b border-[#E7ECE9] px-[15px] py-[13px]">

          <div className="flex flex-wrap items-center justify-between gap-[10px]">

            <div>

              <h2 className="text-[12px] font-semibold uppercase tracking-[.02em] text-[#1E2B3E]">
                Disease Reports
              </h2>

              <p className="mt-[3px] text-[9px] text-[#7B8794]">
                Submitted reports across monitored taluks
              </p>

            </div>

            <div className="flex items-center gap-[7px]">

              <button
                type="button"
                onClick={handleRefresh}
                disabled={
                  loading ||
                  refreshing
                }
                className="flex h-[32px] items-center gap-[6px] rounded-[6px] border border-[#DCE3DE] bg-white px-[10px] text-[9px] font-semibold text-[#344054] hover:bg-[#F7F9F8] disabled:cursor-not-allowed disabled:opacity-50"
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

              <button
                type="button"
                onClick={exportCsv}
                disabled={
                  filteredReports.length === 0
                }
                className="flex h-[32px] items-center gap-[6px] rounded-[6px] bg-[#087A32] px-[11px] text-[9px] font-semibold text-white hover:bg-[#066A2B] disabled:cursor-not-allowed disabled:opacity-50"
              >

                <Download size={13} />

                Export

              </button>

            </div>

          </div>

          {/* FILTERS */}

          <div className="mt-[12px] grid grid-cols-1 gap-[7px] md:grid-cols-[minmax(200px,1.6fr)_repeat(3,minmax(130px,1fr))_auto]">

            {/* Search */}

            <div className="relative">

              <Search
                size={13}
                className="absolute left-[10px] top-1/2 -translate-y-1/2 text-[#8A94A3]"
              />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Search reports, disease, taluk or agent..."
                className="h-[34px] w-full rounded-[6px] border border-[#DCE3DE] bg-white pl-[30px] pr-[10px] text-[9px] text-[#344054] outline-none placeholder:text-[#9AA3AF] focus:border-[#8AC8A0] focus:ring-1 focus:ring-[#E4F1E8]"
              />

            </div>

            {/* Disease */}

            <SelectFilter
              value={disease}
              onChange={setDisease}
              options={DISEASES}
            />

            {/* Severity */}

            <SelectFilter
              value={severity}
              onChange={setSeverity}
              options={SEVERITIES}
            />

            {/* Week */}

            <SelectFilter
              value={week}
              onChange={setWeek}
              options={[
                "All Weeks",
                ...weekOptions.map(String),
              ]}
            />

            {/* Clear */}

            <button
              type="button"
              onClick={clearFilters}
              disabled={!hasFilters}
              className="h-[34px] rounded-[6px] border border-transparent px-[9px] text-[9px] font-semibold text-[#087A32] hover:bg-[#F2F8F4] disabled:cursor-default disabled:text-[#B2BAB5]"
            >
              Clear Filters
            </button>

          </div>

        </div>

        {/* ERROR */}

        {error && (
          <div className="mx-[12px] mt-[10px] flex items-start gap-[8px] rounded-[7px] border border-[#F1C8C5] bg-[#FFF7F6] px-[10px] py-[9px]">

            <AlertTriangle
              size={14}
              className="mt-[1px] shrink-0 text-[#D52D24]"
            />

            <div className="min-w-0">

              <p className="text-[9px] font-semibold text-[#B42318]">
                Unable to load reports
              </p>

              <p className="mt-[2px] text-[9px] leading-[1.5] text-[#C43A3A]">
                {error}
              </p>

            </div>

            <button
              type="button"
              onClick={handleRefresh}
              className="ml-auto shrink-0 text-[9px] font-semibold text-[#B42318] underline"
            >
              Retry
            </button>

          </div>
        )}

        {/* TABLE */}

        <div className="overflow-x-auto">

          <table className="min-w-[920px] w-full border-collapse">

            <thead>

              <tr className="border-b border-[#E7ECE9] bg-[#FBFCFB]">

                <th className="px-[13px] py-[10px] text-left text-[8px] font-semibold uppercase tracking-[.02em] text-[#667085]">
                  Report
                </th>

                <th className="px-[10px] py-[10px] text-left text-[8px] font-semibold uppercase tracking-[.02em] text-[#667085]">
                  Disease
                </th>

                <th className="px-[10px] py-[10px] text-left text-[8px] font-semibold uppercase tracking-[.02em] text-[#667085]">
                  Taluk
                </th>

                <th className="px-[10px] py-[10px] text-left text-[8px] font-semibold uppercase tracking-[.02em] text-[#667085]">
                  Agent
                </th>

                <th className="px-[10px] py-[10px] text-center text-[8px] font-semibold uppercase tracking-[.02em] text-[#667085]">
                  Cases
                </th>

                <th className="px-[10px] py-[10px] text-left text-[8px] font-semibold uppercase tracking-[.02em] text-[#667085]">
                  Severity
                </th>

                <th className="px-[10px] py-[10px] text-left text-[8px] font-semibold uppercase tracking-[.02em] text-[#667085]">
                  Week
                </th>

                <th className="px-[10px] py-[10px] text-left text-[8px] font-semibold uppercase tracking-[.02em] text-[#667085]">
                  Submitted
                </th>

                <th className="w-[40px] px-[7px] py-[10px] text-center text-[8px] font-semibold uppercase tracking-[.02em] text-[#667085]">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {loading ||
              paginatedReports.length === 0 ? (
                <tr>

                  <td
                    colSpan="9"
                    className="p-0"
                  >

                    <EmptyState
                      loading={loading}
                      hasFilters={hasFilters}
                      onClear={clearFilters}
                    />

                  </td>

                </tr>
              ) : (
                paginatedReports.map(
                  (report, index) => (

                    <tr
                      key={
                        report.id ??
                        `${report.agent_name}-${report.week_number}-${index}`
                      }
                      onClick={() =>
                        setSelectedReport(
                          report
                        )
                      }
                      className="cursor-pointer border-b border-[#EEF1EF] transition-colors last:border-b-0 hover:bg-[#FAFCFB]"
                    >

                      {/* REPORT */}

                      <td className="px-[13px] py-[11px]">

                        <div className="flex items-center gap-[8px]">

                          <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[7px] bg-[#EDF7F0] text-[#087A32]">
                            <FileText size={14} />
                          </div>

                          <div>

                            <p className="text-[9px] font-semibold text-[#263447]">
                              Report #{report.id}
                            </p>

                            <p className="mt-[2px] text-[8px] text-[#8A94A3]">
                              Surveillance submission
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* DISEASE */}

                      <td className="px-[10px] py-[11px]">

                        <div className="flex items-center gap-[6px]">

                          <span className="h-[6px] w-[6px] rounded-full bg-[#087A32]" />

                          <span className="text-[9px] font-semibold text-[#344054]">
                            {report.disease ||
                              "—"}
                          </span>

                        </div>

                      </td>

                      {/* TALUK */}

                      <td className="px-[10px] py-[11px]">

                        <div className="flex items-center gap-[5px]">

                          <MapPin
                            size={11}
                            className="text-[#087A32]"
                          />

                          <span className="text-[9px] text-[#475467]">
                            {report.taluk_name ||
                              "—"}
                          </span>

                        </div>

                      </td>

                      {/* AGENT */}

                      <td className="px-[10px] py-[11px]">

                        <div className="flex items-center gap-[7px]">

                          <div className="flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-full bg-[#EAF1FA] text-[8px] font-semibold text-[#32659A]">
                            {initials(
                              report.agent_name
                            )}
                          </div>

                          <span className="max-w-[115px] truncate text-[9px] font-medium text-[#344054]">
                            {report.agent_name ||
                              "Unknown Agent"}
                          </span>

                        </div>

                      </td>

                      {/* CASES */}

                      <td className="px-[10px] py-[11px] text-center">

                        <span className="text-[11px] font-semibold text-[#172337]">
                          {Number(
                            report.cases || 0
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </span>

                      </td>

                      {/* SEVERITY */}

                      <td className="px-[10px] py-[11px]">

                        <SeverityBadge
                          severity={
                            report.severity
                          }
                        />

                      </td>

                      {/* WEEK */}

                      <td className="px-[10px] py-[11px]">

                        <div className="flex items-center gap-[5px]">

                          <CalendarDays
                            size={11}
                            className="text-[#7B8794]"
                          />

                          <span className="text-[9px] text-[#475467]">
                            {getWeekLabel(
                              report.week_number
                            )}
                          </span>

                        </div>

                      </td>

                      {/* SUBMITTED */}

                      <td className="px-[10px] py-[11px]">

                        <div>

                          <p className="text-[9px] text-[#344054]">
                            {formatDate(
                              report.created_at
                            )}
                          </p>

                          <p className="mt-[2px] text-[8px] text-[#98A2B3]">
                            {formatDateTime(
                              report.created_at
                            )
                              .split(", ")
                              .slice(-1)[0] ||
                              ""}
                          </p>

                        </div>

                      </td>

                      {/* ACTION */}

                      <td className="px-[7px] py-[11px] text-center">

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();

                            setSelectedReport(
                              report
                            );
                          }}
                          className="inline-flex h-[27px] w-[27px] items-center justify-center rounded-[6px] text-[#667085] hover:bg-[#EEF5F0] hover:text-[#087A32]"
                          title="View report"
                        >
                          <MoreHorizontal
                            size={15}
                          />
                        </button>

                      </td>

                    </tr>

                  )
                )
              )}

            </tbody>

          </table>

        </div>

        {/* PAGINATION */}

        <div className="flex flex-wrap items-center justify-between gap-[10px] border-t border-[#E7ECE9] px-[13px] py-[10px]">

          <p className="text-[8px] text-[#667085]">

            {filteredReports.length === 0
              ? "Showing 0 reports"
              : `Showing ${
                  (page - 1) *
                    PAGE_SIZE +
                  1
                }–${Math.min(
                  page * PAGE_SIZE,
                  filteredReports.length
                )} of ${
                  filteredReports.length
                } reports`}

          </p>

          <div className="flex items-center gap-[4px]">

            <button
              type="button"
              disabled={page <= 1}
              onClick={() =>
                setPage((value) =>
                  Math.max(
                    1,
                    value - 1
                  )
                )
              }
              className="flex h-[27px] w-[27px] items-center justify-center rounded-[5px] border border-[#DCE3DE] text-[#667085] hover:bg-[#F6F8F7] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={13} />
            </button>

            {Array.from(
              {
                length: Math.min(
                  totalPages,
                  5
                ),
              },
              (_, index) => {

                let pageNumber;

                if (totalPages <= 5) {
                  pageNumber =
                    index + 1;
                } else if (page <= 3) {
                  pageNumber =
                    index + 1;
                } else if (
                  page >=
                  totalPages - 2
                ) {
                  pageNumber =
                    totalPages -
                    4 +
                    index;
                } else {
                  pageNumber =
                    page -
                    2 +
                    index;
                }

                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() =>
                      setPage(
                        pageNumber
                      )
                    }
                    className={`flex h-[27px] min-w-[27px] items-center justify-center rounded-[5px] border px-[6px] text-[9px] font-semibold ${
                      page === pageNumber
                        ? "border-[#087A32] bg-[#087A32] text-white"
                        : "border-[#DCE3DE] bg-white text-[#667085] hover:bg-[#F6F8F7]"
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              }
            )}

            <button
              type="button"
              disabled={
                page >= totalPages
              }
              onClick={() =>
                setPage((value) =>
                  Math.min(
                    totalPages,
                    value + 1
                  )
                )
              }
              className="flex h-[27px] w-[27px] items-center justify-center rounded-[5px] border border-[#DCE3DE] text-[#667085] hover:bg-[#F6F8F7] disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronRight size={13} />
            </button>

          </div>

        </div>

      </section>

      {/* ======================================================
          BOTTOM INFORMATION
          ====================================================== */}

      <section className="mt-[10px] grid grid-cols-1 gap-[10px] lg:grid-cols-2">

        <div className="rounded-[10px] border border-[#E2E8E4] bg-white px-[14px] py-[12px]">

          <div className="flex items-start gap-[9px]">

            <div className="flex h-[31px] w-[31px] shrink-0 items-center justify-center rounded-full bg-[#EAF6EE] text-[#087A32]">
              <CheckCircle2 size={16} />
            </div>

            <div>

              <p className="text-[9px] font-semibold text-[#087A32]">
                Surveillance reports are synchronized
              </p>

              <p className="mt-[3px] text-[8px] leading-[1.5] text-[#667085]">
                Reports submitted by agents are automatically
                available to administrators for monitoring,
                analysis and disease-risk assessment.
              </p>

            </div>

          </div>

        </div>

        <div className="rounded-[10px] border border-[#E2E8E4] bg-white px-[14px] py-[12px]">

          <div className="flex items-start gap-[9px]">

            <div className="flex h-[31px] w-[31px] shrink-0 items-center justify-center rounded-full bg-[#FFF3E1] text-[#D97706]">
              <ShieldAlert size={16} />
            </div>

            <div>

              <p className="text-[9px] font-semibold text-[#B45309]">
                High and critical reports require attention
              </p>

              <p className="mt-[3px] text-[8px] leading-[1.5] text-[#667085]">
                Use the report details view to inspect the
                affected taluk, reporting agent, case count
                and surveillance severity.
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* ======================================================
          DETAILS MODAL
          ====================================================== */}

      <ReportDetailsModal
        report={selectedReport}
        onClose={() =>
          setSelectedReport(null)
        }
      />

    </div>
  );
}

/* ============================================================
   SELECT FILTER
   ============================================================ */

function SelectFilter({
  value,
  onChange,
  options,
}) {
  return (
    <div className="relative">

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-[34px] w-full appearance-none rounded-[6px] border border-[#DCE3DE] bg-white px-[10px] pr-[27px] text-[9px] font-medium text-[#344054] outline-none focus:border-[#8AC8A0] focus:ring-1 focus:ring-[#E4F1E8]"
      >

        {options.map((option) => (
          <option
            key={option}
            value={option}
          >
            {option}
          </option>
        ))}

      </select>

      <ChevronDown
        size={12}
        className="pointer-events-none absolute right-[9px] top-1/2 -translate-y-1/2 text-[#667085]"
      />

    </div>
  );
}