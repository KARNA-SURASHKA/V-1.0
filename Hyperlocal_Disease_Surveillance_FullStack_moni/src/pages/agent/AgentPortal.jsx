import { useEffect, useState } from "react";
import {
  MapPin,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Plus,
  ArrowRight,
} from "lucide-react";

import PortalShell from "../../components/PortalShell";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api";

import ReportForm from "./ReportForm";
import EmergingDiseaseReport from "./EmergingDiseaseReport";

const TABS = [
  {
    key: "report",
    label: "Weekly Report",
  },
  {
    key: "history",
    label: "Submission History",
  },
  {
    key: "emerging",
    label: "Emerging Disease",
  },
];

function formatDate(dateValue) {
  if (!dateValue) return null;

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTime(dateValue) {
  if (!dateValue) return null;

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AgentPortal({ onExit }) {
  const { session } = useAuth();

  const [tab, setTab] = useState("report");

  /*
   * Controls whether the report editor is visible.
   */
  const [showReportEditor, setShowReportEditor] = useState(false);

  /*
   * IMPORTANT:
   *
   * "edit" = load the previously submitted report.
   * "add"  = start with a completely empty disease entry.
   */
  const [reportMode, setReportMode] = useState(null);

  /*
   * This key forces ReportForm to completely remount whenever
   * the agent switches between Edit and Add Another Disease.
   */
  const [reportFormKey, setReportFormKey] = useState(0);

  const [status, setStatus] = useState(null);
  const [reports, setReports] = useState([]);

  const [loadingStatus, setLoadingStatus] = useState(true);
  const [statusError, setStatusError] = useState("");

  useEffect(() => {
    let mounted = true;

    const loadAgentData = async () => {
      try {
        setLoadingStatus(true);
        setStatusError("");

        const [statusData, historyData] = await Promise.all([
          api.getAgentStatus(),
          api.getAgentHistory(),
        ]);

        if (mounted) {
          setStatus(statusData);
          setReports(historyData || []);
        }
      } catch (err) {
        if (mounted) {
          setStatusError(
            err.message || "Unable to load agent status."
          );
        }
      } finally {
        if (mounted) {
          setLoadingStatus(false);
        }
      }
    };

    loadAgentData();

    return () => {
      mounted = false;
    };
  }, []);

  if (!session) {
    return null;
  }

  const talukName =
    status?.taluk_name ||
    session.taluk_name ||
    "Assigned Taluk";

  const alreadySubmitted =
    status?.already_submitted ?? false;

  /*
   * Find the most recent submitted record.
   */
  const latestSubmission =
    reports.length > 0
      ? reports.reduce((latest, report) => {
          if (!latest) return report;

          const latestDate = new Date(latest.created_at);
          const currentDate = new Date(report.created_at);

          return currentDate > latestDate
            ? report
            : latest;
        }, null)
      : null;

  const lastSubmissionDate = latestSubmission
    ? formatDate(latestSubmission.created_at)
    : null;

  const lastSubmissionTime = latestSubmission
    ? formatTime(latestSubmission.created_at)
    : null;

  /*
   * ============================================================
   * TAB CHANGE
   * ============================================================
   */

  const handleTabChange = (nextTab) => {
    setTab(nextTab);

    /*
     * Whenever the agent leaves the report tab,
     * close the report editor.
     */
    if (nextTab !== "report") {
      setShowReportEditor(false);
      setReportMode(null);
    }
  };

  /*
   * ============================================================
   * EDIT WEEKLY REPORT
   * ============================================================
   *
   * This is the ONLY action that loads previously submitted
   * disease information.
   */

  const openEditReport = () => {
    setTab("report");

    setReportMode("edit");

    /*
     * Force ReportForm to remount.
     */
    setReportFormKey((previous) => previous + 1);

    setShowReportEditor(true);
  };

  /*
   * ============================================================
   * ADD ANOTHER DISEASE
   * ============================================================
   *
   * IMPORTANT:
   * This does NOT load the previous report.
   *
   * ReportForm receives mode="add" and therefore starts with
   * a completely empty disease entry.
   */

  const openAddDisease = () => {
    setTab("report");

    setReportMode("add");

    /*
     * Force a completely fresh ReportForm instance.
     */
    setReportFormKey((previous) => previous + 1);

    setShowReportEditor(true);
  };

  /*
   * ============================================================
   * CLOSE REPORT EDITOR
   * ============================================================
   */

  const closeReportEditor = () => {
    setShowReportEditor(false);
    setReportMode(null);
  };

  return (
    <PortalShell
      title="Karna Suraksha — Agent Portal"
      subtitle={`Assigned Taluk: ${talukName}`}
      tabs={TABS}
      activeTab={tab}
      onTabChange={handleTabChange}
      onExit={onExit}
    >
      {/* ========================================================
          WELCOME SECTION
      ======================================================== */}

      {tab === "report" && !showReportEditor && (
        <>
          <section className="mb-7">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <p className="text-[13px] font-medium text-[#087A32] mb-1">
                  Agent Dashboard
                </p>

                <h2 className="text-[28px] md:text-[32px] font-semibold text-[#102A43] tracking-tight">
                  Welcome back, {session.full_name}!
                </h2>

                <p className="text-[14px] text-[#52606D] mt-1">
                  Here's your weekly disease surveillance overview.
                </p>
              </div>

              <div className="bg-white border border-[#E3E9E5] rounded-2xl px-5 py-4 shadow-sm min-w-[280px]">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#EAF6EE] flex items-center justify-center">
                    <CalendarDays className="w-5 h-5 text-[#087A32]" />
                  </div>

                  <div>
                    <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[#7B8794]">
                      Current Surveillance Cycle
                    </p>

                    <p className="text-[16px] font-semibold text-[#087A32] mt-1">
                      Weekly Reporting
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ======================================================
              ERROR
          ====================================================== */}

          {statusError && (
            <div className="mb-6 rounded-xl border border-[#F0CACA] bg-[#FFF5F5] px-4 py-3">
              <p className="text-[13px] text-[#C62828]">
                {statusError}
              </p>
            </div>
          )}

          {/* ======================================================
              OVERVIEW CARDS
          ====================================================== */}

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-7">

            {/* ASSIGNED TALUK */}

            <div className="bg-white rounded-2xl border border-[#E3E9E5] p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#EAF6EE] flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6 text-[#087A32]" />
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[#52606D]">
                    Assigned Taluk
                  </p>

                  <h3 className="text-[21px] font-semibold text-[#087A32] mt-2">
                    {loadingStatus
                      ? "Loading..."
                      : talukName}
                  </h3>

                  <p className="text-[13px] text-[#52606D] mt-1">
                    Your designated surveillance area
                  </p>
                </div>
              </div>
            </div>

            {/* LAST SUBMISSION */}

            <div className="bg-white rounded-2xl border border-[#E3E9E5] p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-[#EEF4FB] flex items-center justify-center shrink-0">
                  <CalendarDays className="w-6 h-6 text-[#145DA0]" />
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[#52606D]">
                    Last Submission
                  </p>

                  {loadingStatus ? (
                    <h3 className="text-[20px] font-semibold text-[#102A43] mt-2">
                      Loading...
                    </h3>
                  ) : lastSubmissionDate ? (
                    <>
                      <h3 className="text-[20px] font-semibold text-[#102A43] mt-2">
                        {lastSubmissionDate}
                      </h3>

                      <p className="text-[13px] text-[#52606D] mt-1">
                        Submitted at {lastSubmissionTime}
                      </p>
                    </>
                  ) : (
                    <>
                      <h3 className="text-[20px] font-semibold text-[#102A43] mt-2">
                        No submission yet
                      </h3>

                      <p className="text-[13px] text-[#52606D] mt-1">
                        Your first report is pending
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* REPORT STATUS */}

            <div className="bg-white rounded-2xl border border-[#E3E9E5] p-5 shadow-sm">
              <div className="flex items-start gap-4">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                    alreadySubmitted
                      ? "bg-[#EAF6EE]"
                      : "bg-[#FFF5DD]"
                  }`}
                >
                  {alreadySubmitted ? (
                    <CheckCircle2 className="w-6 h-6 text-[#087A32]" />
                  ) : (
                    <Clock3 className="w-6 h-6 text-[#C57A00]" />
                  )}
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-[0.08em] font-semibold text-[#52606D]">
                    Report Status
                  </p>

                  {loadingStatus ? (
                    <h3 className="text-[21px] font-semibold text-[#102A43] mt-2">
                      Loading...
                    </h3>
                  ) : (
                    <h3
                      className={`text-[21px] font-semibold mt-2 ${
                        alreadySubmitted
                          ? "text-[#087A32]"
                          : "text-[#C57A00]"
                      }`}
                    >
                      {alreadySubmitted
                        ? "Submitted"
                        : "Pending"}
                    </h3>
                  )}

                  <p className="text-[13px] text-[#52606D] mt-1">
                    {alreadySubmitted
                      ? "This week's report has been received"
                      : "Weekly report requires submission"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ======================================================
              SUBMITTED / PENDING BANNER
          ====================================================== */}

          <section className="mb-4">
            <div className="rounded-2xl border border-[#B8DEC6] bg-[#F0FAF3] p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#D9F1E1] flex items-center justify-center shrink-0">
                    {alreadySubmitted ? (
                      <CheckCircle2 className="w-6 h-6 text-[#087A32]" />
                    ) : (
                      <Clock3 className="w-6 h-6 text-[#C57A00]" />
                    )}
                  </div>

                  <div>
                    <p className="text-[11px] uppercase tracking-[0.1em] font-semibold text-[#087A32]">
                      Weekly Disease Report
                    </p>

                    <h3 className="text-[21px] font-semibold text-[#087A32] mt-1">
                      {alreadySubmitted
                        ? "This week's report has been submitted"
                        : "This week's report is pending"}
                    </h3>

                    <p className="text-[13px] text-[#334E68] mt-2 max-w-2xl">
                      {alreadySubmitted
                        ? "Your current reporting cycle is complete. You can edit the submitted information if required, or add a new disease."
                        : "Submit the verified disease information for your assigned taluk."}
                    </p>

                    {alreadySubmitted && (
                      <p className="text-[12px] text-[#087A32] font-semibold mt-2">
                        Reporting cycle: Week{" "}
                        {status?.current_week}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={
                    alreadySubmitted
                      ? openEditReport
                      : openAddDisease
                  }
                  className="shrink-0 rounded-xl bg-[#087A32] px-6 py-3 text-[13px] font-semibold text-white hover:bg-[#076B2C] transition flex items-center justify-center gap-2"
                >
                  {alreadySubmitted ? (
                    <>
                      <FileText className="w-4 h-4" />
                      Edit Weekly Report
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Submit Weekly Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* ======================================================
              ADD ANOTHER DISEASE
          ====================================================== */}

          {alreadySubmitted && (
            <section className="mb-8">
              <button
                type="button"
                onClick={openAddDisease}
                className="w-full group rounded-2xl border border-dashed border-[#55A978] bg-white hover:bg-[#F7FCF9] transition p-5 text-left"
              >
                <div className="flex items-center gap-4">

                  <div className="w-12 h-12 rounded-full bg-[#EAF6EE] flex items-center justify-center shrink-0">
                    <Plus className="w-6 h-6 text-[#087A32]" />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-[19px] font-semibold text-[#087A32]">
                      Add Another Disease
                    </h3>

                    <p className="text-[13px] text-[#52606D] mt-1">
                      Add a new disease to the current reporting cycle.
                    </p>
                  </div>

                  <ArrowRight className="w-5 h-5 text-[#087A32] group-hover:translate-x-1 transition" />
                </div>
              </button>
            </section>
          )}
        </>
      )}

      {/* ========================================================
          REPORT EDITOR
      ======================================================== */}

      {tab === "report" && showReportEditor && (
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#EAF6EE] flex items-center justify-center">
                {reportMode === "add" ? (
                  <Plus className="w-5 h-5 text-[#087A32]" />
                ) : (
                  <FileText className="w-5 h-5 text-[#087A32]" />
                )}
              </div>

              <div>
                <h3 className="text-[20px] font-semibold text-[#102A43]">
                  {reportMode === "add"
                    ? "Add Another Disease"
                    : "Edit Weekly Disease Report"}
                </h3>

                <p className="text-[13px] text-[#7B8794] mt-1">
                  {reportMode === "add"
                    ? "Enter the details for the new disease."
                    : "Update your previously submitted disease information."}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeReportEditor}
              className="rounded-xl border border-[#D9E2DC] bg-white px-5 py-2.5 text-[13px] font-medium text-[#334E68] hover:bg-[#F7F9F8] transition"
            >
              Cancel
            </button>
          </div>

          {/*
           * KEY POINT:
           *
           * reportMode="edit"
           *     -> ReportForm loads previous data.
           *
           * reportMode="add"
           *     -> ReportForm starts empty.
           *
           * key={reportFormKey}
           *     -> completely resets the form when switching mode.
           */}

          <ReportForm
            key={reportFormKey}
            mode={reportMode}
          />
        </section>
      )}

      {tab === "emerging" && (
        <EmergingDiseaseReport />
      )}

      {/* ========================================================
          HISTORY TAB
      ======================================================== */}

      {tab === "history" && (
        <section>
          {/*
           * Keep your existing History component/page here.
           * Submission History is intentionally NOT displayed
           * on the Weekly Report dashboard.
           */}

          {/*
           * IMPORTANT:
           * Import History at the top if your existing project
           * requires it.
           */}

          <HistorySection />
        </section>
      )}
    </PortalShell>
  );
}

/*
 * Small lazy-safe wrapper so the dashboard itself does not
 * contain a Submission History preview.
 *
 * Replace this import with the normal History import if your
 * project already has it.
 */

import History from "./History";

function HistorySection() {
  return (
    <>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-[#EEF4FB] flex items-center justify-center">
          <Clock3 className="w-5 h-5 text-[#315C88]" />
        </div>

        <div>
          <h3 className="text-[20px] font-semibold text-[#102A43]">
            Submission History
          </h3>

          <p className="text-[13px] text-[#7B8794]">
            Previously submitted disease reports
          </p>
        </div>
      </div>

      <History />
    </>
  );
}