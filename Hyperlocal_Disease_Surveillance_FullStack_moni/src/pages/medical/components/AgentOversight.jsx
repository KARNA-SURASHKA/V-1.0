import {
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  FileUp,
  MapPin,
  Paperclip,
  Send,
  ShieldAlert,
  Users,
  X,
} from "lucide-react";

import {
  Panel,
  StatusBadge,
  Toast,
} from "./MedicalUi";


// ============================================================
// DATE / REPORT HELPERS
// ============================================================

function isoWeekKeyFromDate(
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

  const utc =
    new Date(
      Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      )
    );

  const day =
    utc.getUTCDay() ||
    7;

  utc.setUTCDate(
    utc.getUTCDate() +
      4 -
      day
  );

  const yearStart =
    new Date(
      Date.UTC(
        utc.getUTCFullYear(),
        0,
        1
      )
    );

  const week =
    Math.ceil(
      (
        (
          (
            utc -
            yearStart
          ) /
          86400000
        ) +
        1
      ) /
      7
    );

  return (
    utc.getUTCFullYear() *
      100 +
    week
  );
}


function normalizeReportWeek(
  report
) {
  const raw =
    Number(
      report?.week_number
    );

  /*
   * Already YYYYWW.
   */

  if (
    Number.isFinite(raw) &&
    raw >= 1000
  ) {
    return raw;
  }

  /*
   * Older format:
   *
   * week_number = 35
   * year = 2026
   */

  if (
    Number.isFinite(raw) &&
    raw >= 1 &&
    raw <= 53
  ) {
    const year =
      Number(
        report?.year
      );

    if (
      Number.isFinite(year) &&
      year >= 2000
    ) {
      return (
        year *
          100 +
        raw
      );
    }
  }

  /*
   * Last fallback:
   * derive week from submission date.
   */

  return isoWeekKeyFromDate(
    report?.created_at
  );
}


function startOfISOWeek(
  value = new Date()
) {
  const date =
    new Date(value);

  date.setHours(
    0,
    0,
    0,
    0
  );

  const day =
    date.getDay() ||
    7;

  date.setDate(
    date.getDate() -
      day +
      1
  );

  return date;
}


function currentWeekKey() {
  return isoWeekKeyFromDate(
    new Date()
  );
}


function previousWeekKeys(
  count = 4
) {
  const currentStart =
    startOfISOWeek(
      new Date()
    );

  const result = [];

  for (
    let index = 1;
    index <= count;
    index += 1
  ) {
    const date =
      new Date(
        currentStart
      );

    date.setDate(
      date.getDate() -
        index * 7
    );

    const key =
      isoWeekKeyFromDate(
        date
      );

    if (key) {
      result.push(
        key
      );
    }
  }

  return result;
}


function formatDate(
  value
) {
  if (!value) {
    return "No submission";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "No submission";
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


function formatTime(
  value
) {
  if (!value) {
    return "";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleTimeString(
    "en-IN",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}


function getInitials(
  name = "Agent"
) {
  const parts =
    String(name)
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  if (
    !parts.length
  ) {
    return "AG";
  }

  if (
    parts.length === 1
  ) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return (
    parts[0][0] +
    parts[
      parts.length - 1
    ][0]
  ).toUpperCase();
}


// ============================================================
// STATUS
// ============================================================

function getStatusMeta(
  row
) {
  /*
   * If the current cycle has been submitted,
   * the agent is compliant.
   */

  if (
    row.currentSubmitted
  ) {
    return {
      label: "Compliant",
      tone: "green",
      icon: CheckCircle2,
    };
  }

  /*
   * If the current reporting deadline has passed,
   * the agent requires follow-up.
   */

  if (
    row.currentOverdue
  ) {
    return {
      label:
        row.monthlySubmitted ===
        0
          ? "Unresponsive"
          : "Delayed",

      tone: "red",

      icon:
        AlertTriangle,
    };
  }

  /*
   * The agent may still be compliant historically
   * but has an incomplete four-week history.
   */

  if (
    row.monthlySubmitted <
    4
  ) {
    return {
      label: "Delayed",
      tone: "amber",
      icon: Clock3,
    };
  }

  return {
    label: "Pending",
    tone: "blue",
    icon: Clock3,
  };
}


// ============================================================
// COMPLAINT DRAWER
// ============================================================

function ComplaintDrawer({
  agent,
  onClose,
  onSubmit,
  saving,
}) {
  const fileInputRef =
    useRef(null);

  const [
    category,
    setCategory,
  ] = useState(
    "Missed Weekly Submissions / Negligence"
  );

  const [
    severity,
    setSeverity,
  ] = useState(
    "High"
  );

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    files,
    setFiles,
  ] = useState([]);

  const [
    dragging,
    setDragging,
  ] = useState(false);


  const addFiles =
    (incoming) => {
      const next =
        Array.from(
          incoming || []
        ).filter(Boolean);

      setFiles(
        (previous) => {
          const existing =
            new Set(
              previous.map(
                (file) =>
                  `${file.name}-${file.size}-${file.lastModified}`
              )
            );

          const merged =
            [
              ...previous,
            ];

          next.forEach(
            (file) => {
              const key =
                `${file.name}-${file.size}-${file.lastModified}`;

              if (
                !existing.has(
                  key
                )
              ) {
                existing.add(
                  key
                );

                merged.push(
                  file
                );
              }
            }
          );

          return merged;
        }
      );
    };


  const removeFile =
    (index) => {
      setFiles(
        (previous) =>
          previous.filter(
            (
              _,
              fileIndex
            ) =>
              fileIndex !==
              index
          )
      );
    };


  const submit =
    async (
      event
    ) => {
      event.preventDefault();

      const cleanDescription =
        description.trim();

      if (
        !cleanDescription
      ) {
        return;
      }

      await onSubmit({
        agent_id:
          agent?.id ??
          agent?.agent_id,

        issue_type:
          category,

        severity:
          severity,

        description:
          cleanDescription,

        evidence:
          files
            .map(
              (file) =>
                file.name
            )
            .join(", "),

        files,
      });
    };


  return (
    <div
      className="fixed inset-0 z-[90] flex justify-end bg-[#102A43]/25 backdrop-blur-[1px]"
      onMouseDown={
        (event) => {
          if (
            event.target ===
              event.currentTarget &&
            !saving
          ) {
            onClose();
          }
        }
      }
    >

      <aside className="flex h-full w-full max-w-[520px] flex-col border-l border-[#E1E7E3] bg-white shadow-[-12px_0_35px_rgba(16,42,67,.12)]">

        <form
          onSubmit={
            submit
          }
          className="flex min-h-0 flex-1 flex-col"
        >

          {/* =================================================
              DRAWER HEADER
              ================================================= */}

          <div className="flex items-start justify-between border-b border-[#E7ECE9] px-5 py-4">

            <div className="min-w-0 pr-4">

              <div className="flex items-center gap-2">

                <ShieldAlert
                  size={17}
                  className="text-[#087A32]"
                />

                <span className="text-[10px] font-bold uppercase tracking-[.11em] text-[#087A32]">
                  Agent Oversight
                </span>

              </div>

              <h2 className="mt-1 text-[19px] font-semibold tracking-[-.025em] text-[#101B38]">
                File Agent Complaint &amp; Submit Proof
              </h2>

            </div>


            <button
              type="button"
              onClick={
                onClose
              }
              disabled={
                saving
              }
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#697586] transition hover:bg-[#F4F7F5] hover:text-[#17233D] disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Close complaint drawer"
            >

              <X
                size={18}
              />

            </button>

          </div>


          {/* =================================================
              DRAWER BODY
              ================================================= */}

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">

            <div className="space-y-5">

              {/* =============================================
                  AGENT
                  ============================================= */}

              <div className="rounded-xl border border-[#F2D2D2] bg-[#FFF8F8] p-3.5">

                <div className="flex items-start justify-between gap-3">

                  <div>

                    <div className="text-[11px] font-semibold text-[#26364D]">
                      Field Agent
                    </div>

                    <div className="mt-2 flex items-center gap-3">

                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EAF1FF] text-[11px] font-bold text-[#356FD1]">

                        {
                          getInitials(
                            agent?.full_name ||
                              agent?.name
                          )
                        }

                      </div>

                      <div>

                        <div className="text-[13px] font-semibold text-[#17233D]">

                          {
                            agent?.full_name ||
                              agent?.name ||
                              "Unknown Agent"
                          }

                        </div>

                        <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-[#718096]">

                          <MapPin
                            size={11}
                          />

                          {
                            agent?.taluk_name ||
                              "Unknown Taluk"
                          }

                        </div>

                      </div>

                    </div>

                  </div>

                  <StatusBadge
                    tone="red"
                  >
                    Action Required
                  </StatusBadge>

                </div>

              </div>


              {/* =============================================
                  COMPLAINT CATEGORY
                  ============================================= */}

              <label className="block">

                <span className="text-[11px] font-semibold text-[#26364D]">
                  Complaint Category
                </span>

                <div className="relative mt-1.5">

                  <select
                    value={
                      category
                    }
                    onChange={
                      (
                        event
                      ) =>
                        setCategory(
                          event.target.value
                        )
                    }
                    className="h-11 w-full appearance-none rounded-xl border border-[#DCE4DF] bg-white px-3 pr-9 text-[11px] text-[#26364D] outline-none transition focus:border-[#087A32] focus:ring-2 focus:ring-[#087A32]/10"
                  >

                    <option>
                      Missed Weekly Submissions / Negligence
                    </option>

                    <option>
                      Repeated Late Submission
                    </option>

                    <option>
                      Data Quality Concern
                    </option>

                    <option>
                      Failure to Respond to Supervisor
                    </option>

                    <option>
                      Other
                    </option>

                  </select>

                  <ChevronDown
                    size={15}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#718096]"
                  />

                </div>

              </label>


              {/* =============================================
                  SEVERITY
                  ============================================= */}

              <label className="block">

                <span className="text-[11px] font-semibold text-[#26364D]">
                  Severity
                </span>

                <div className="relative mt-1.5">

                  <select
                    value={
                      severity
                    }
                    onChange={
                      (
                        event
                      ) =>
                        setSeverity(
                          event.target.value
                        )
                    }
                    className="h-11 w-full appearance-none rounded-xl border border-[#DCE4DF] bg-white px-3 pr-9 text-[11px] text-[#26364D] outline-none transition focus:border-[#087A32] focus:ring-2 focus:ring-[#087A32]/10"
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

                  </select>

                  <ChevronDown
                    size={15}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#718096]"
                  />

                </div>

              </label>


              {/* =============================================
                  DESCRIPTION
                  ============================================= */}

              <label className="block">

                <div className="flex items-center justify-between gap-3">

                  <span className="text-[11px] font-semibold text-[#26364D]">
                    Description
                  </span>

                  <span className="text-[9px] text-[#8792A2]">
                    Required
                  </span>

                </div>

                <textarea
                  required
                  value={
                    description
                  }
                  onChange={
                    (
                      event
                    ) =>
                      setDescription(
                        event.target.value
                      )
                  }
                  rows={5}
                  placeholder="Describe the issue and why System Admin action is required."
                  className="mt-1.5 w-full resize-none rounded-xl border border-[#DCE4DF] px-3 py-3 text-[11px] leading-5 text-[#26364D] outline-none transition placeholder:text-[#A0A8B3] focus:border-[#087A32] focus:ring-2 focus:ring-[#087A32]/10"
                />

              </label>


              {/* =============================================
                  PROOF
                  ============================================= */}

              <section>

                <div className="mb-2 flex items-center justify-between gap-3">

                  <div className="flex items-center gap-2">

                    <FileText
                      size={14}
                      className="text-[#52627D]"
                    />

                    <span className="text-[11px] font-semibold text-[#26364D]">
                      PROOF &amp; EVIDENCE SECTION
                    </span>

                  </div>

                  <span className="text-[9px] text-[#8792A2]">
                    Optional
                  </span>

                </div>


                <button
                  type="button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  onDragEnter={
                    (event) => {
                      event.preventDefault();
                      setDragging(
                        true
                      );
                    }
                  }
                  onDragOver={
                    (event) => {
                      event.preventDefault();
                      setDragging(
                        true
                      );
                    }
                  }
                  onDragLeave={
                    (event) => {
                      event.preventDefault();
                      setDragging(
                        false
                      );
                    }
                  }
                  onDrop={
                    (event) => {
                      event.preventDefault();

                      setDragging(
                        false
                      );

                      addFiles(
                        event
                          .dataTransfer
                          .files
                      );
                    }
                  }
                  className={`flex w-full flex-col items-center justify-center rounded-xl border border-dashed px-4 py-7 text-center transition ${
                    dragging
                      ? "border-[#087A32] bg-[#EFF9F2]"
                      : "border-[#CAD8CE] bg-[#FAFCFB] hover:border-[#087A32] hover:bg-[#F5FAF6]"
                  }`}
                >

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">

                    <FileUp
                      size={20}
                      className="text-[#087A32]"
                    />

                  </div>

                  <span className="mt-2.5 text-[11px] font-semibold text-[#26364D]">
                    Drag &amp; Drop files here or Browse
                  </span>

                  <span className="mt-1 text-[9px] text-[#718096]">
                    Screenshots, PDFs, audio records and system audit logs
                  </span>

                  <input
                    ref={
                      fileInputRef
                    }
                    type="file"
                    multiple
                    className="hidden"
                    onChange={
                      (
                        event
                      ) => {
                        addFiles(
                          event.target.files
                        );

                        event.target.value =
                          "";
                      }
                    }
                  />

                </button>


                {/* ===========================================
                    SELECTED FILES
                    =========================================== */}

                {files.length >
                  0 && (

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">

                    {files.map(
                      (
                        file,
                        index
                      ) => (

                        <div
                          key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                          className="flex min-w-0 items-center gap-2 rounded-xl border border-[#E1E8E4] bg-white px-3 py-2.5"
                        >

                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EFF7F1] text-[#087A32]">

                            <Paperclip
                              size={14}
                            />

                          </div>


                          <div className="min-w-0 flex-1">

                            <div className="truncate text-[10px] font-semibold text-[#26364D]">

                              {
                                file.name
                              }

                            </div>

                            <div className="mt-0.5 text-[9px] text-[#8792A2]">

                              {
                                Math.max(
                                  1,
                                  Math.round(
                                    file.size /
                                      1024
                                  )
                                )
                              }{" "}
                              KB

                            </div>

                          </div>


                          <button
                            type="button"
                            onClick={() =>
                              removeFile(
                                index
                              )
                            }
                            disabled={
                              saving
                            }
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[#8792A2] hover:bg-[#FFF1F1] hover:text-[#C62828]"
                            aria-label={`Remove ${file.name}`}
                          >

                            <X
                              size={13}
                            />

                          </button>

                        </div>

                      )
                    )}

                  </div>

                )}

              </section>

            </div>

          </div>


          {/* =================================================
              DRAWER FOOTER
              ================================================= */}

          <div className="border-t border-[#E7ECE9] bg-white px-5 py-4">

            <div className="flex gap-2.5">

              <button
                type="submit"
                disabled={
                  saving ||
                  !description.trim()
                }
                className="inline-flex min-h-[43px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#087A32] px-4 text-[11px] font-semibold text-white shadow-[0_5px_14px_rgba(8,122,50,.18)] transition hover:bg-[#066A2B] disabled:cursor-not-allowed disabled:opacity-50"
              >

                <ShieldAlert
                  size={14}
                />

                {
                  saving
                    ? "Submitting Complaint…"
                    : "Submit Complaint & Proof to Admin"
                }

              </button>


              <button
                type="button"
                onClick={
                  onClose
                }
                disabled={
                  saving
                }
                className="min-h-[43px] rounded-xl border border-[#D9E1DD] bg-white px-5 text-[11px] font-semibold text-[#39495F] hover:bg-[#F7FAF8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

            </div>

          </div>

        </form>

      </aside>

    </div>
  );
}


// ============================================================
// MAIN AGENT OVERSIGHT
// ============================================================

export default function AgentOversight({
  agents = [],
  issues = [],
  reports = [],
  onSubmitIssue,
}) {
  const [
    selectedAgent,
    setSelectedAgent,
  ] = useState(null);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    toast,
    setToast,
  ] = useState("");


  // ==========================================================
  // BUILD AGENT COMPLIANCE DATA
  // ==========================================================

  const rows =
    useMemo(
      () => {
        const currentWeek =
          currentWeekKey();

        /*
         * Four most recently completed
         * reporting weeks.
         */

        const historyWeeks =
          previousWeekKeys(
            4
          );


        /*
         * Map:
         *
         * agent + week
         *
         * -> latest report
         */

        const reportMap =
          new Map();


        (
          Array.isArray(
            reports
          )
            ? reports
            : []
        ).forEach(
          (
            report
          ) => {
            const agentId =
              Number(
                report?.agent_id
              );

            const week =
              normalizeReportWeek(
                report
              );

            if (
              !Number.isFinite(
                agentId
              ) ||
              !week
            ) {
              return;
            }

            const key =
              `${agentId}-${week}`;

            const previous =
              reportMap.get(
                key
              );

            if (
              !previous
            ) {
              reportMap.set(
                key,
                report
              );

              return;
            }

            const previousTime =
              new Date(
                previous?.created_at ||
                  0
              ).getTime();

            const nextTime =
              new Date(
                report?.created_at ||
                  0
              ).getTime();

            if (
              nextTime >
              previousTime
            ) {
              reportMap.set(
                key,
                report
              );
            }
          }
        );


        // ------------------------------------------------------
        // CURRENT REPORTING DEADLINE
        // ------------------------------------------------------

        const now =
          new Date();

        const currentStart =
          startOfISOWeek(
            now
          );

        /*
         * Wednesday 23:59:59
         */

        const dueAt =
          new Date(
            currentStart
          );

        dueAt.setDate(
          dueAt.getDate() +
            2
        );

        dueAt.setHours(
          23,
          59,
          59,
          999
        );


        // ------------------------------------------------------
        // BUILD ROWS
        // ------------------------------------------------------

        return (
          Array.isArray(
            agents
          )
            ? agents
            : []
        ).map(
          (
            agent
          ) => {
            const agentId =
              Number(
                agent?.agent_id ??
                  agent?.id
              );


            /*
             * Current week submission.
             */

            const currentReport =
              reportMap.get(
                `${agentId}-${currentWeek}`
              );

            const currentSubmitted =
              Boolean(
                currentReport
              );

            const currentOverdue =
              !currentSubmitted &&
              now >
                dueAt;


            /*
             * Four-week history.
             */

            const history =
              historyWeeks.map(
                (
                  week
                ) =>
                  Boolean(
                    reportMap.get(
                      `${agentId}-${week}`
                    )
                  )
              );


            const monthlySubmitted =
              history.filter(
                Boolean
              ).length;


            /*
             * Find latest actual report
             * for Last Submission.
             */

            const agentReports =
              (
                Array.isArray(
                  reports
                )
                  ? reports
                  : []
              )
                .filter(
                  (
                    report
                  ) =>
                    Number(
                      report?.agent_id
                    ) ===
                    agentId
                )
                .sort(
                  (
                    a,
                    b
                  ) => {
                    const aTime =
                      new Date(
                        a?.created_at ||
                          0
                      ).getTime();

                    const bTime =
                      new Date(
                        b?.created_at ||
                          0
                      ).getTime();

                    return (
                      bTime -
                      aTime
                    );
                  }
                );


            const lastReport =
              agentReports[0] ||
              null;


            /*
             * Determine status tag.
             */

            const status =
              getStatusMeta({
                currentSubmitted,
                currentOverdue,
                monthlySubmitted,
              });


            return {
              ...agent,

              id:
                agentId,

              agent_id:
                agentId,

              full_name:
                agent?.full_name ||
                agent?.name ||
                "Unknown Agent",

              taluk_name:
                agent?.taluk_name ||
                agent?.taluk ||
                "Unknown Taluk",

              currentSubmitted,

              currentOverdue,

              monthlySubmitted,

              history,

              currentReport,

              lastSubmission:
                lastReport?.created_at ||
                null,

              status,
            };
          }
        );
      },
      [
        agents,
        reports,
      ]
    );


  // ==========================================================
  // KPI VALUES
  // ==========================================================

  const totalAgents =
    rows.length;


  const compliantAgents =
    rows.filter(
      (
        row
      ) =>
        row.monthlySubmitted ===
        4
    ).length;


  const nonCompliantAgents =
    rows.filter(
      (
        row
      ) =>
        row.currentOverdue ||
        row.monthlySubmitted <
          4
    ).length;


  // ==========================================================
  // OPEN COMPLAINT
  // ==========================================================

  const openComplaint =
    (
      agent
    ) => {
      setSelectedAgent(
        agent
      );
    };


  const closeComplaint =
    () => {
      if (
        !saving
      ) {
        setSelectedAgent(
          null
        );
      }
    };


  // ==========================================================
  // SUBMIT COMPLAINT
  // ==========================================================

  const submitComplaint =
    async (
      payload
    ) => {
      try {
        setSaving(
          true
        );

        await onSubmitIssue(
          payload
        );

        setSelectedAgent(
          null
        );

        setToast(
          "Complaint and proof submitted to System Admin."
        );

      } catch (
        error
      ) {
        setToast(
          error?.message ||
            "Unable to submit the complaint."
        );

      } finally {
        setSaving(
          false
        );
      }
    };


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="space-y-5 pb-8">

      {/* ====================================================
          PAGE HEADER
          ==================================================== */}

      <div className="relative overflow-hidden rounded-2xl bg-white px-1 py-1">

        <div className="relative z-10 max-w-[720px] px-1 py-4">

          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.13em] text-[#087A32]">

            <ShieldAlert
              size={14}
            />

            Review &amp; Response

          </div>


          <h1 className="mt-1 text-[27px] font-semibold tracking-[-.035em] text-[#101B38]">

            Agent Oversight &amp; Weekly Compliance

          </h1>


          <p className="mt-1 text-[12px] leading-5 text-[#5C687A]">

            Monitor weekly agent reporting compliance and file complaints to System Admin.

          </p>

        </div>


        {/* Decorative background */}

        <div className="pointer-events-none absolute right-5 top-1/2 hidden -translate-y-1/2 items-end gap-2 opacity-70 lg:flex">

          <div className="h-16 w-28 rounded-t-[80px] bg-[#EFF7F1]" />

          <div className="h-24 w-36 rounded-t-[100px] bg-[#E7F3EA]" />

          <div className="h-12 w-20 rounded-t-[70px] bg-[#F4F8F5]" />

        </div>

      </div>


      {/* ====================================================
          KPI CARDS
          ==================================================== */}

      <div className="grid gap-4 xl:grid-cols-3">

        <KpiCard
          icon={
            <Users
              size={23}
            />
          }
          tone="green"
          label="Total Field Agents"
          value={
            totalAgents
          }
          note="Agents assigned to this district"
        />


        <KpiCard
          icon={
            <CheckCircle2
              size={23}
            />
          }
          tone="green"
          label="Compliant (4/4 Weeks)"
          value={
            compliantAgents
          }
          note="Submitted in all four completed cycles"
        />


        <KpiCard
          icon={
            <AlertTriangle
              size={23}
            />
          }
          tone="amber"
          label="Overdue / Non-Compliant"
          value={
            nonCompliantAgents
          }
          note="Requires supervisor attention"
        />

      </div>


      {/* ====================================================
          COMPLIANCE ROSTER
          ==================================================== */}

      <Panel
        title="Field Agent Weekly Compliance Roster"
        subtitle="Current district agents and their recent reporting history"
      >

        <div className="overflow-x-auto rounded-xl border border-[#E7ECE9]">

          <table className="w-full min-w-[980px] text-left">

            <thead className="bg-[#FAFBFA] text-[9px] font-bold uppercase tracking-[.08em] text-[#768295]">

              <tr>

                <th className="px-4 py-3.5">
                  Agent Name
                </th>

                <th className="px-4 py-3.5">
                  Assigned Region
                </th>

                <th className="px-4 py-3.5">
                  Last Submission
                </th>

                <th className="px-4 py-3.5">
                  Monthly History
                </th>

                <th className="px-4 py-3.5">
                  Status Tag
                </th>

                <th className="px-4 py-3.5 text-right">
                  Action
                </th>

              </tr>

            </thead>


            <tbody>

              {rows.map(
                (
                  agent
                ) => {
                  const StatusIcon =
                    agent
                      .status
                      .icon;

                  return (
                    <tr
                      key={
                        agent.id
                      }
                      className="border-t border-[#EEF1EF] transition hover:bg-[#FBFDFC]"
                    >

                      {/* AGENT */}

                      <td className="px-4 py-3.5">

                        <div className="flex items-center gap-3">

                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EAF1FF] text-[10px] font-bold text-[#356FD1]">

                            {
                              getInitials(
                                agent.full_name
                              )
                            }

                          </div>


                          <div className="min-w-0">

                            <div className="truncate text-[11px] font-semibold text-[#17233D]">

                              {
                                agent.full_name
                              }

                            </div>


                            <div className="mt-0.5 truncate text-[9px] text-[#8792A2]">

                              {
                                agent.username ||
                                `Agent ${agent.id}`
                              }

                            </div>

                          </div>

                        </div>

                      </td>


                      {/* TALUK */}

                      <td className="px-4 py-3.5">

                        <div className="flex items-center gap-1.5 text-[10px] text-[#3E4C61]">

                          <MapPin
                            size={12}
                            className="text-[#087A32]"
                          />

                          {
                            agent.taluk_name
                          }

                        </div>

                      </td>


                      {/* LAST SUBMISSION */}

                      <td className="px-4 py-3.5">

                        <div className="text-[10px] font-medium text-[#3E4C61]">

                          {
                            agent.lastSubmission
                              ? formatDate(
                                  agent.lastSubmission
                                )
                              : "No submission"
                          }

                        </div>


                        {agent.lastSubmission && (
                          <div className="mt-0.5 text-[9px] text-[#8792A2]">

                            {
                              formatTime(
                                agent.lastSubmission
                              )
                            }

                          </div>
                        )}

                      </td>


                      {/* MONTHLY HISTORY */}

                      <td className="px-4 py-3.5">

                        <div className="flex items-center gap-2">

                          <span className="text-[10px] font-semibold text-[#3E4C61]">

                            {
                              agent.monthlySubmitted
                            }
                            /4 Weeks

                          </span>


                          <div className="flex items-center gap-1">

                            {agent.history.map(
                              (
                                submitted,
                                index
                              ) => (

                                <span
                                  key={`${agent.id}-history-${index}`}
                                  className={`h-2.5 w-2.5 rounded-[3px] ${
                                    submitted
                                      ? "bg-[#087A32]"
                                      : "bg-[#F1B6B6]"
                                  }`}
                                  title={
                                    submitted
                                      ? "Report submitted"
                                      : "No report submitted"
                                  }
                                />

                              )
                            )}

                          </div>

                        </div>

                      </td>


                      {/* STATUS */}

                      <td className="px-4 py-3.5">

                        <span
                          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-semibold ${
                            agent.status.tone ===
                            "green"
                              ? "bg-[#E8F5EC] text-[#177341]"
                              : agent.status.tone ===
                                "amber"
                              ? "bg-[#FFF3DD] text-[#D88B0D]"
                              : agent.status.tone ===
                                "blue"
                              ? "bg-[#EAF1FF] text-[#356FD1]"
                              : "bg-[#FDEBEC] text-[#D23A3A]"
                          }`}
                        >

                          <StatusIcon
                            size={11}
                          />

                          {
                            agent
                              .status
                              .label
                          }

                        </span>

                      </td>


                      {/* ACTION */}

                      <td className="px-4 py-3.5 text-right">

                        <button
                          type="button"
                          onClick={() =>
                            openComplaint(
                              agent
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#087A32] px-3.5 py-2 text-[10px] font-semibold text-white shadow-[0_3px_9px_rgba(8,122,50,.15)] transition hover:bg-[#066A2B]"
                        >

                          Report

                          <Send
                            size={11}
                          />

                        </button>

                      </td>

                    </tr>
                  );
                }
              )}


              {!rows.length && (

                <tr>

                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-[11px] text-[#718096]"
                  >

                    No field agents are assigned to this Medical Supervisor's district.

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </Panel>


      {/* ====================================================
          PREVIOUSLY FILED COMPLAINTS
          ==================================================== */}

      <Panel
        title="Previously Filed Agent Complaints"
        subtitle="Complaints already submitted by this Medical Supervisor"
      >

        <div className="space-y-2.5">

          {issues.map(
            (
              issue
            ) => (

              <div
                key={
                  issue.id
                }
                className="flex flex-col gap-3 rounded-xl border border-[#E7ECE9] bg-white p-3.5 sm:flex-row sm:items-center sm:justify-between"
              >

                <div className="min-w-0">

                  <div className="flex flex-wrap items-center gap-2">

                    <span className="text-[11px] font-semibold text-[#17233D]">

                      {
                        issue.agent_name ||
                          "Unknown Agent"
                      }

                    </span>


                    <span className="text-[9px] text-[#A0A8B3]">
                      •
                    </span>


                    <span className="text-[10px] text-[#718096]">

                      {
                        issue.taluk_name ||
                          "Unknown Taluk"
                      }

                    </span>

                  </div>


                  <div className="mt-1 text-[10px] font-medium text-[#52627D]">

                    {
                      issue.issue_type ||
                        "Agent complaint"
                    }

                    {
                      issue.severity
                        ? ` · ${issue.severity}`
                        : ""
                    }

                  </div>


                  {issue.description && (

                    <div className="mt-1 line-clamp-2 text-[10px] leading-4 text-[#718096]">

                      {
                        issue.description
                      }

                    </div>

                  )}

                </div>


                <StatusBadge
                  tone={
                    issue.status ===
                    "PENDING_ADMIN_REVIEW"
                      ? "blue"
                      : issue.status ===
                        "REJECTED"
                      ? "red"
                      : "green"
                  }
                >

                  {
                    String(
                      issue.status ||
                        "Submitted"
                    )
                      .replaceAll(
                        "_",
                        " "
                      )
                      .toLowerCase()
                      .replace(
                        /\b\w/g,
                        (
                          letter
                        ) =>
                          letter.toUpperCase()
                      )
                  }

                </StatusBadge>

              </div>

            )
          )}


          {!issues.length && (

            <div className="rounded-xl border border-dashed border-[#DDE5E0] bg-[#FAFCFB] px-4 py-9 text-center text-[11px] text-[#718096]">

              No complaints have been filed yet.

            </div>

          )}

        </div>

      </Panel>


      {/* ====================================================
          COMPLAINT DRAWER
          ==================================================== */}

      {selectedAgent && (

        <ComplaintDrawer
          agent={
            selectedAgent
          }
          onClose={
            closeComplaint
          }
          onSubmit={
            submitComplaint
          }
          saving={
            saving
          }
        />

      )}


      {/* ====================================================
          TOAST
          ==================================================== */}

      <Toast
        message={
          toast
        }
        onClose={() =>
          setToast("")
        }
      />

    </div>
  );
}


// ============================================================
// KPI CARD
// ============================================================

function KpiCard({
  icon,
  tone,
  label,
  value,
  note,
}) {
  const styles = {
    green: {
      icon:
        "bg-[#E8F5EC] text-[#087A32]",
      value:
        "text-[#101B38]",
    },

    amber: {
      icon:
        "bg-[#FFF3DD] text-[#D88B0D]",
      value:
        "text-[#101B38]",
    },

    red: {
      icon:
        "bg-[#FDEBEC] text-[#D23A3A]",
      value:
        "text-[#101B38]",
    },
  };

  const selected =
    styles[tone] ||
    styles.green;


  return (
    <div className="flex min-h-[128px] items-center gap-4 rounded-2xl border border-[#E6EBE8] bg-white px-5 py-5 shadow-[0_3px_14px_rgba(25,50,40,.035)]">

      <div
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${selected.icon}`}
      >

        {
          icon
        }

      </div>


      <div className="min-w-0">

        <div className="text-[11px] font-semibold text-[#536174]">

          {
            label
          }

        </div>


        <div
          className={`mt-1 text-[29px] font-semibold tracking-[-.035em] ${selected.value}`}
        >

          {
            value
          }

        </div>


        <div className="mt-0.5 text-[9px] leading-4 text-[#8792A2]">

          {
            note
          }

        </div>

      </div>

    </div>
  );
}