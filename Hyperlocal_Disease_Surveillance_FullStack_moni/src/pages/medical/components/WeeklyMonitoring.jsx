import {
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  Mail,
  MapPin,
  RefreshCw,
  Users,
} from "lucide-react";

import {
  Panel,
  StatusBadge,
  Toast,
} from "./MedicalUi";


// ============================================================
// DATE HELPERS
// ============================================================

function getDateObject(
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

  return date;
}


function getISOWeekDates(
  weekNumber
) {
  if (
    weekNumber ===
      undefined ||
    weekNumber === null
  ) {
    return null;
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
    return null;
  }

  const year =
    Math.floor(
      numericWeek / 100
    );

  const week =
    numericWeek % 100;

  if (
    year < 2000 ||
    week < 1 ||
    week > 53
  ) {
    return null;
  }

  const januaryFourth =
    new Date(
      Date.UTC(
        year,
        0,
        4
      )
    );

  const januaryFourthDay =
    januaryFourth.getUTCDay() ||
    7;

  const monday =
    new Date(
      januaryFourth
    );

  monday.setUTCDate(
    januaryFourth.getUTCDate() -
      januaryFourthDay +
      1 +
      (week - 1) * 7
  );

  const sunday =
    new Date(
      monday
    );

  sunday.setUTCDate(
    monday.getUTCDate() +
      6
  );

  return {
    start:
      monday,
    end:
      sunday,
  };
}


function formatDayMonth(
  value
) {
  const date =
    getDateObject(
      value
    );

  if (!date) {
    return "";
  }

  return date.toLocaleDateString(
    "en-GB",
    {
      day: "numeric",
      month: "long",
    }
  );
}


function formatDate(
  value
) {
  const date =
    getDateObject(
      value
    );

  if (!date) {
    return "";
  }

  return date.toLocaleDateString(
    "en-GB",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}


function formatDateTime(
  value
) {
  const date =
    getDateObject(
      value
    );

  if (!date) {
    return "—";
  }

  return date.toLocaleString(
    "en-GB",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}


// ============================================================
// WEEK LABEL
// ============================================================

function getWeekLabel(
  weekNumber,
  fallbackStart,
  fallbackEnd
) {
  const start =
    getDateObject(
      fallbackStart
    );

  const end =
    getDateObject(
      fallbackEnd
    );

  if (
    start &&
    end
  ) {
    return `Week of ${formatDayMonth(
      start
    )} – ${formatDayMonth(
      end
    )}`;
  }

  const calculated =
    getISOWeekDates(
      weekNumber
    );

  if (!calculated) {
    return "Week of reporting period";
  }

  return `Week of ${formatDayMonth(
    calculated.start
  )} – ${formatDayMonth(
    calculated.end
  )}`;
}


// ============================================================
// COMPONENT
// ============================================================

export default function WeeklyMonitoring({
  rows = [],
  availableWeeks = [],
  selectedWeek = null,
  onWeekChange,
  onRemind,
  onRefresh,
  loading = false,
}) {
  const [
    toast,
    setToast,
  ] = useState("");

  const [
    weekOpen,
    setWeekOpen,
  ] = useState(false);


  // ==========================================================
  // ACTIVE AGENTS
  // ==========================================================

  const active =
    useMemo(
      () =>
        rows.filter(
          (row) =>
            row?.is_active !==
            false
        ),
      [rows]
    );


  // ==========================================================
  // STATUS COUNTS
  // ==========================================================

  const onTime =
    active.filter(
      (row) =>
        row?.submitted ===
          true &&
        String(
          row?.status ||
            ""
        ).toLowerCase() !==
          "late"
    );

  const late =
    active.filter(
      (row) =>
        String(
          row?.status ||
            ""
        ).toLowerCase() ===
        "late"
    );

  const missed =
    active.filter(
      (row) =>
        !row?.submitted
    );

  const submitted =
    onTime.concat(
      late
    );


  const compliance =
    active.length > 0
      ? Math.round(
          (onTime.length /
            active.length) *
            100
        )
      : 0;


  const repeated =
    active.filter(
      (row) =>
        Number(
          row?.missed_streak ||
            0
        ) >= 2
    );


  // ==========================================================
  // SELECTED WEEK INFORMATION
  // ==========================================================

  const selectedWeekObject =
    availableWeeks.find(
      (item) =>
        Number(
          item?.value
        ) ===
        Number(
          selectedWeek
        )
    );


  const firstRow =
    rows[0] || {};


  const selectedWeekLabel =
    getWeekLabel(
      selectedWeek,
      firstRow?.week_start,
      firstRow?.week_end
    );


  const selectedStart =
    getDateObject(
      firstRow?.week_start
    ) ||
    getISOWeekDates(
      selectedWeek
    )?.start;


  const selectedEnd =
    getDateObject(
      firstRow?.week_end
    ) ||
    getISOWeekDates(
      selectedWeek
    )?.end;


  // ==========================================================
  // REMIND
  // ==========================================================

  const remind =
    async (
      agent
    ) => {
      try {
        await onRemind?.(
          agent
        );

        setToast(
          `Reminder sent to ${
            agent?.agent_name ||
            "agent"
          }.`
        );

      } catch (error) {
        setToast(
          error?.message ||
            "Unable to send reminder."
        );
      }
    };


  const remindAll =
    async () => {
      if (
        !missed.length
      ) {
        return;
      }

      try {
        for (
          const agent of missed
        ) {
          await onRemind?.(
            agent
          );
        }

        setToast(
          `Reminder sent to ${missed.length} pending agent${
            missed.length === 1
              ? ""
              : "s"
          }.`
        );

      } catch (error) {
        setToast(
          error?.message ||
            "Unable to send all reminders."
        );
      }
    };


  // ==========================================================
  // EXPORT
  // ==========================================================

  const exportComplianceLog =
    () => {
      const headers = [
        "Agent",
        "Taluk",
        "Reporting Week",
        "Status",
        "Submitted",
        "Submission Time",
        "Missed Streak",
      ];

      const data =
        active.map(
          (agent) => [
            agent?.agent_name ||
              "",
            agent?.taluk_name ||
              "",
            selectedWeekLabel,
            agent?.status ||
              (
                agent?.submitted
                  ? "On Time"
                  : "Missed"
              ),
            agent?.submitted
              ? "Yes"
              : "No",
            agent?.current_report_date
              ? formatDateTime(
                  agent.current_report_date
                )
              : "",
            agent?.missed_streak ||
              0,
          ]
        );


      const csvRows =
        [
          headers,
          ...data,
        ].map(
          (row) =>
            row
              .map(
                (value) =>
                  `"${String(
                    value ??
                      ""
                  ).replace(
                    /"/g,
                    '""'
                  )}"`
              )
              .join(",")
        );


      const blob =
        new Blob(
          [
            csvRows.join(
              "\n"
            ),
          ],
          {
            type:
              "text/csv;charset=utf-8;",
          }
        );


      const url =
        URL.createObjectURL(
          blob
        );


      const link =
        document.createElement(
          "a"
        );

      link.href = url;

      link.download =
        "agent-compliance-log.csv";

      document.body.appendChild(
        link
      );

      link.click();

      document.body.removeChild(
        link
      );

      URL.revokeObjectURL(
        url
      );


      setToast(
        "Compliance log exported."
      );
    };


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="space-y-5">

      {/* ======================================================
          PAGE HEADER
          ====================================================== */}

      <div className="flex flex-wrap items-end justify-between gap-4">

        <div>

          <h1 className="text-[27px] font-semibold tracking-[-0.035em] text-[#102A56]">
            Agent Monitoring
          </h1>

          <p className="mt-1 text-[12px] text-[#66727D]">
            Agent reporting compliance
            across Kodagu — monitored
            weekly.
          </p>

        </div>


        <div className="flex flex-wrap items-center gap-2">

          {/* ==================================================
              WEEK SELECTOR
              ================================================== */}

          <div className="relative">

            <button
              type="button"
              disabled={
                loading
              }
              onClick={() =>
                setWeekOpen(
                  (value) =>
                    !value
                )
              }
              className="inline-flex min-w-[270px] items-center justify-between gap-3 rounded-xl border border-[#DDE5E0] bg-white px-4 py-2.5 text-[11px] font-semibold text-[#19345F] shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition hover:bg-[#FAFCFB] disabled:cursor-not-allowed disabled:opacity-60"
            >

              <span className="flex items-center gap-2">

                <CalendarDays
                  size={15}
                />

                <span>
                  {selectedWeekLabel}
                </span>

              </span>


              <ChevronDown
                size={14}
                className={
                  weekOpen
                    ? "rotate-180 transition-transform"
                    : "transition-transform"
                }
              />

            </button>


            {weekOpen && (
              <div className="absolute right-0 z-40 mt-2 max-h-[360px] w-[290px] overflow-y-auto rounded-xl border border-[#E1E8E4] bg-white p-2 shadow-[0_15px_40px_rgba(15,40,30,0.14)]">

                <div className="px-3 py-2">

                  <div className="text-[9px] font-bold uppercase tracking-[0.13em] text-[#8A96A4]">
                    Reporting periods
                  </div>

                  <div className="mt-1 text-[9px] leading-4 text-[#8A96A4]">
                    Weeks with submitted
                    surveillance data.
                  </div>

                </div>


                {availableWeeks.length >
                0 ? (

                  <div className="space-y-1">

                    {availableWeeks.map(
                      (week) => {

                        const isSelected =
                          Number(
                            week.value
                          ) ===
                          Number(
                            selectedWeek
                          );


                        const label =
                          getWeekLabel(
                            week.value
                          );


                        return (
                          <button
                            key={
                              week.value
                            }
                            type="button"
                            onClick={() => {
                              setWeekOpen(
                                false
                              );

                              if (
                                Number(
                                  week.value
                                ) !==
                                Number(
                                  selectedWeek
                                )
                              ) {
                                onWeekChange?.(
                                  week.value
                                );
                              }
                            }}
                            className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition ${
                              isSelected
                                ? "bg-[#F1F9F4] text-[#087A32]"
                                : "text-[#52627D] hover:bg-[#F7FAF8]"
                            }`}
                          >

                            <span className="text-[10px] font-semibold">
                              {label}
                            </span>


                            {isSelected && (
                              <CheckCircle2
                                size={
                                  14
                                }
                              />
                            )}

                          </button>
                        );
                      }
                    )}

                  </div>

                ) : (

                  <div className="rounded-lg bg-[#FAFCFB] px-3 py-4 text-[10px] text-[#7A8598]">
                    No submitted reporting
                    weeks are available.
                  </div>

                )}

              </div>
            )}

          </div>


          {/* ==================================================
              REMIND ALL
              ================================================== */}

          <button
            type="button"
            onClick={
              remindAll
            }
            disabled={
              !missed.length ||
              loading
            }
            className="inline-flex items-center gap-2 rounded-xl border border-[#DDE5E0] bg-white px-4 py-2.5 text-[11px] font-semibold text-[#52627D] transition hover:bg-[#F8FAF9] disabled:cursor-not-allowed disabled:opacity-40"
          >

            <Mail
              size={14}
            />

            Remind All Pending

          </button>


          {/* ==================================================
              EXPORT
              ================================================== */}

          <button
            type="button"
            onClick={
              exportComplianceLog
            }
            disabled={
              !active.length
            }
            className="inline-flex items-center gap-2 rounded-xl bg-[#087A32] px-4 py-2.5 text-[11px] font-semibold text-white shadow-[0_5px_14px_rgba(8,122,50,0.16)] transition hover:bg-[#076C2C] disabled:cursor-not-allowed disabled:opacity-50"
          >

            <Download
              size={14}
            />

            Export Compliance Log

          </button>

        </div>

      </div>


      {/* ======================================================
          DISTRICT INFORMATION
          ====================================================== */}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#DCEBE1] bg-[#F4FAF6] px-4 py-2.5">

        <div className="flex items-center gap-2 text-[10px] font-semibold text-[#087A32]">

          <MapPin
            size={14}
          />

          <span>
            Kodagu District
            {selectedStart &&
            selectedEnd
              ? ` · ${formatDate(
                  selectedStart
                )} – ${formatDate(
                  selectedEnd
                )}`
              : ""}
          </span>

        </div>


        <span className="text-[9px] text-[#63756B]">
          Reporting deadline:
          Wednesday 11:59 PM
        </span>

      </div>


      {/* ======================================================
          LOADING SELECTED WEEK
          ====================================================== */}

      {loading && (
        <div className="rounded-xl border border-[#E0E7E3] bg-white px-4 py-3 text-[10px] text-[#718096]">
          Loading reporting data…
        </div>
      )}


      {/* ======================================================
          SUMMARY CARDS
          ====================================================== */}

      <div className="grid gap-4 md:grid-cols-4">

        {/* ====================================================
            COMPLIANCE
            ==================================================== */}

        <Panel
          title="This Week’s Compliance"
        >

          <div className="flex items-center gap-4">

            <div className="relative h-[96px] w-[96px] shrink-0">

              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    `conic-gradient(#E11D2E ${100 - compliance}%, #E8ECEA 0)`,
                }}
              />

              <div className="absolute inset-[10px] flex flex-col items-center justify-center rounded-full bg-white">

                <div className="text-[21px] font-semibold text-[#102A56]">
                  {compliance}%
                </div>

                <div className="text-[8px] text-[#738092]">
                  On-Time
                </div>

              </div>

            </div>


            <div className="space-y-2 text-[10px]">

              <div className="flex items-center gap-2">

                <span className="h-2.5 w-2.5 rounded-full bg-[#159447]" />

                <b className="text-[#159447]">
                  {
                    onTime.length
                  }
                </b>

                <span className="text-[#6E7885]">
                  On-time
                </span>

              </div>


              <div className="flex items-center gap-2">

                <span className="h-2.5 w-2.5 rounded-full bg-[#E79B19]" />

                <b className="text-[#E79B19]">
                  {
                    late.length
                  }
                </b>

                <span className="text-[#6E7885]">
                  Late
                </span>

              </div>


              <div className="flex items-center gap-2">

                <span className="h-2.5 w-2.5 rounded-full bg-[#E11D2E]" />

                <b className="text-[#E11D2E]">
                  {
                    missed.length
                  }
                </b>

                <span className="text-[#6E7885]">
                  Missed
                </span>

              </div>

            </div>

          </div>

        </Panel>


        {/* ====================================================
            TOTAL AGENTS
            ==================================================== */}

        <Panel
          title="Total Agents Under Supervision"
        >

          <div className="flex items-center gap-3">

            <div className="rounded-full bg-[#E8F6EC] p-3 text-[#087A32]">
              <Users
                size={24}
              />
            </div>

            <div>

              <div className="text-[29px] font-semibold text-[#102A56]">
                {
                  active.length
                }
              </div>

              <div className="mt-0.5 text-[9px] text-[#738092]">
                Agents assigned to
                this district
              </div>

            </div>

          </div>

        </Panel>


        {/* ====================================================
            MISSED OR LATE
            ==================================================== */}

        <Panel
          title="Agents Missed or Late This Week"
        >

          <div className="flex items-center gap-3">

            <div className="rounded-full bg-[#FFF0F0] p-3 text-[#E11D2E]">
              <Clock3
                size={24}
              />
            </div>

            <div>

              <div className="text-[29px] font-semibold text-[#102A56]">
                {
                  missed.length +
                  late.length
                }
              </div>

              <div className="mt-0.5 text-[9px] text-[#738092]">
                Requires supervisor
                follow-up
              </div>

            </div>

          </div>

        </Panel>


        {/* ====================================================
            REPEATED MISSED
            ==================================================== */}

        <Panel
          title="Agents With Repeated Missed Weeks"
        >

          <div className="flex items-center gap-3">

            <div className="rounded-full bg-[#FFF5E6] p-3 text-[#E79B19]">
              <RefreshCw
                size={24}
              />
            </div>

            <div>

              <div className="text-[29px] font-semibold text-[#102A56]">
                {
                  repeated.length
                }
              </div>

              <div className="mt-0.5 text-[9px] text-[#738092]">
                Two or more consecutive
                missed weeks
              </div>

            </div>

          </div>

        </Panel>

      </div>


      {/* ======================================================
          NEEDS FOLLOW-UP
          ====================================================== */}

      <Panel
        title="Needs Follow-Up"
        subtitle="Late and missed reporting activity requiring supervisor attention."
      >

        {missed.length >
          0 ||
        late.length >
          0 ? (

          <div className="space-y-3">

            {[
              ...late,
              ...missed,
            ]
              .slice(
                0,
                6
              )
              .map(
                (
                  agent
                ) => {

                  const isLate =
                    String(
                      agent?.status ||
                        ""
                    ).toLowerCase() ===
                    "late";


                  return (
                    <div
                      key={
                        agent.agent_id
                      }
                      className={`flex items-center justify-between gap-4 rounded-xl border px-4 py-3 ${
                        isLate
                          ? "border-[#F2E2C5] bg-[#FFFCF6]"
                          : "border-[#F0D9DB] bg-[#FFF9F9]"
                      }`}
                    >

                      <div className="flex min-w-0 items-center gap-3">

                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                            isLate
                              ? "bg-[#FFF2D9] text-[#D88B0D]"
                              : "bg-[#FFF0F0] text-[#E11D2E]"
                          }`}
                        >

                          {isLate ? (
                            <Clock3
                              size={16}
                            />
                          ) : (
                            <AlertTriangle
                              size={16}
                            />
                          )}

                        </div>


                        <div className="min-w-0">

                          <div className="truncate text-[11px] font-semibold text-[#20314E]">
                            {
                              agent.agent_name
                            }
                          </div>


                          <div className="mt-1 flex items-center gap-1.5 text-[9px] text-[#778393]">

                            <MapPin
                              size={10}
                            />

                            {
                              agent.taluk_name
                            }

                            <span className="text-[#C2C8CD]">
                              •
                            </span>

                            {isLate
                              ? "Submitted late"
                              : "No report received"}

                          </div>

                        </div>

                      </div>


                      <div className="flex shrink-0 items-center gap-3">

                        <StatusBadge
                          tone={
                            isLate
                              ? "amber"
                              : "red"
                          }
                        >
                          {isLate
                            ? "Late"
                            : "Missed"}
                        </StatusBadge>


                        <button
                          type="button"
                          onClick={() =>
                            remind(
                              agent
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#DDE5E0] bg-white px-3 py-2 text-[10px] font-semibold text-[#52627D] transition hover:bg-[#F7FAF8]"
                        >

                          <Mail
                            size={12}
                          />

                          Send Reminder

                        </button>

                      </div>

                    </div>
                  );
                }
              )}

          </div>

        ) : (

          <div className="flex items-center gap-3 rounded-xl border border-[#DCEBE1] bg-[#F4FAF6] p-4">

            <div className="rounded-full bg-[#E8F6EC] p-2 text-[#087A32]">

              <CheckCircle2
                size={17}
              />

            </div>


            <div>

              <div className="text-[11px] font-semibold text-[#267248]">
                All monitored agents are compliant for this reporting cycle.
              </div>

              <div className="mt-0.5 text-[9px] text-[#708078]">
                No late or missed reporting activity
                requires supervisor attention.
              </div>

            </div>

          </div>

        )}

      </Panel>


      {/* ======================================================
          AGENT STATUS
          ====================================================== */}

      <Panel
        title="Agent Status — This Week"
        subtitle={`${active.length} agents · ${
          new Set(
            active.map(
              (agent) =>
                agent.taluk_id
            )
          ).size
        } taluks`}
      >

        <div className="overflow-x-auto rounded-xl border border-[#E7ECE9]">

          <table className="w-full min-w-[1050px] text-left text-[11px]">

            <thead className="bg-[#FAFBFA] text-[#768295]">

              <tr>

                <th className="px-4 py-3 text-[9px] font-bold">
                  AGENT
                </th>

                <th className="px-4 py-3 text-[9px] font-bold">
                  TALUK
                </th>

                <th className="px-4 py-3 text-[9px] font-bold">
                  DISEASE REPORTED
                </th>

                <th className="px-4 py-3 text-[9px] font-bold">
                  SUBMITTED
                </th>

                <th className="px-4 py-3 text-[9px] font-bold">
                  STATUS
                </th>

                <th className="px-4 py-3 text-[9px] font-bold">
                  STREAK
                </th>

                <th className="px-4 py-3 text-[9px] font-bold">
                  LAST 8 WEEKS
                </th>

                <th className="px-4 py-3 text-right text-[9px] font-bold">
                  ACTION
                </th>

              </tr>

            </thead>


            <tbody>

              {active.map(
                (
                  agent
                ) => {

                  const history =
                    Array.isArray(
                      agent?.last_8_weeks
                    )
                      ? agent.last_8_weeks
                      : [];


                  return (
                    <tr
                      key={
                        agent.agent_id
                      }
                      className="border-t border-[#EEF1EF] transition hover:bg-[#FCFDFC]"
                    >

                      {/* AGENT */}

                      <td className="px-4 py-3">

                        <div className="flex items-center gap-2">

                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EEF5FF] text-[9px] font-bold text-[#3865A6]">

                            {(
                              agent.agent_name ||
                              "A"
                            )
                              .split(
                                " "
                              )
                              .map(
                                (
                                  part
                                ) =>
                                  part[0]
                              )
                              .slice(
                                0,
                                2
                              )
                              .join(
                                ""
                              )
                              .toUpperCase()}

                          </div>


                          <div className="min-w-0">

                            <div className="truncate font-semibold text-[#20314E]">
                              {
                                agent.agent_name
                              }
                            </div>

                            {agent.username && (
                              <div className="mt-0.5 text-[8px] text-[#8A94A2]">
                                {
                                  agent.username
                                }
                              </div>
                            )}

                          </div>

                        </div>

                      </td>


                      {/* TALUK */}

                      <td className="px-4 py-3">

                        <div className="inline-flex items-center gap-1.5 rounded-lg border border-[#E1E8E4] bg-white px-2.5 py-1.5 text-[9px] font-medium text-[#52627D]">

                          <MapPin
                            size={10}
                            className="text-[#E11D48]"
                          />

                          {
                            agent.taluk_name
                          }

                        </div>

                      </td>


                      {/* DISEASE */}

                      <td className="px-4 py-3">

                        {agent.current_disease ? (

                          <div>

                            <div className="font-medium text-[#34425A]">
                              {
                                agent.current_disease
                              }
                            </div>

                            <div className="mt-0.5 text-[8px] text-[#8993A0]">
                              {
                                agent.current_cases ??
                                0
                              }{" "}
                              cases
                            </div>

                          </div>

                        ) : (

                          <span className="text-[9px] text-[#8A94A2]">
                            No report
                          </span>

                        )}

                      </td>


                      {/* SUBMITTED */}

                      <td className="px-4 py-3">

                        {agent.submitted ? (

                          <span className="font-medium text-[#52627D]">

                            {agent.current_report_date
                              ? formatDateTime(
                                  agent.current_report_date
                                )
                              : "Submitted"}

                          </span>

                        ) : (

                          <span className="text-[#8993A0]">
                            —
                          </span>

                        )}

                      </td>


                      {/* STATUS */}

                      <td className="px-4 py-3">

                        {agent.submitted ? (

                          <StatusBadge
                            tone={
                              agent.status ===
                              "Late"
                                ? "amber"
                                : "green"
                            }
                          >
                            {agent.status ===
                            "Late"
                              ? "Late"
                              : "On Time"}
                          </StatusBadge>

                        ) : (

                          <StatusBadge
                            tone={
                              agent.status ===
                              "Pending"
                                ? "blue"
                                : "red"
                            }
                          >
                            {agent.status ===
                            "Pending"
                              ? "Pending"
                              : "Missed"}
                          </StatusBadge>

                        )}

                      </td>


                      {/* STREAK */}

                      <td className="px-4 py-3">

                        {Number(
                          agent.missed_streak ||
                            0
                        ) > 0 ? (

                          <div className="inline-flex items-center gap-1 text-[9px] font-medium text-[#E11D2E]">

                            <AlertTriangle
                              size={11}
                            />

                            {
                              agent.missed_streak
                            }{" "}
                            missed

                          </div>

                        ) : (

                          <span className="text-[9px] font-medium text-[#3D7A55]">
                            ✓ Consistent
                          </span>

                        )}

                      </td>


                      {/* LAST 8 WEEKS */}

                      <td className="px-4 py-3">

                        <div className="flex items-center gap-1">

                          {history.length >
                          0 ? (

                            history.map(
                              (
                                item,
                                index
                              ) => {

                                const submittedHistory =
                                  typeof item ===
                                  "boolean"
                                    ? item
                                    : item?.submitted;

                                const status =
                                  typeof item ===
                                  "object"
                                    ? item?.status
                                    : null;

                                const isOnTime =
                                  submittedHistory ===
                                    true &&
                                  String(
                                    status ||
                                      ""
                                  ).toLowerCase() !==
                                    "late";

                                const isLate =
                                  String(
                                    status ||
                                      ""
                                  ).toLowerCase() ===
                                  "late";


                                return (
                                  <span
                                    key={
                                      index
                                    }
                                    className={`h-4 w-4 rounded-[3px] ${
                                      isOnTime
                                        ? "bg-[#159447]"
                                        : isLate
                                        ? "bg-[#E79B19]"
                                        : "bg-[#E11D2E]"
                                    }`}
                                    title={
                                      isOnTime
                                        ? "Submitted on time"
                                        : isLate
                                        ? "Submitted late"
                                        : "Missed"
                                    }
                                  />
                                );
                              }
                            )

                          ) : (

                            <span className="text-[9px] text-[#8A94A2]">
                              No history
                            </span>

                          )}

                        </div>

                      </td>


                      {/* ACTION */}

                      <td className="px-4 py-3 text-right">

                        {agent.submitted ? (

                          <span className="text-[9px] font-medium text-[#7A8598]">
                            No action needed
                          </span>

                        ) : (

                          <button
                            type="button"
                            onClick={() =>
                              remind(
                                agent
                              )
                            }
                            className="rounded-lg bg-[#087A32] px-3 py-2 text-[9px] font-semibold text-white transition hover:bg-[#076C2C]"
                          >
                            Send Reminder
                          </button>

                        )}

                      </td>

                    </tr>
                  );
                }
              )}


              {active.length ===
                0 && (

                <tr>

                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center"
                  >

                    <Users
                      size={25}
                      className="mx-auto mb-2 text-[#A1AAA6]"
                    />

                    <div className="text-[11px] font-semibold text-[#52627D]">
                      No active agents found
                    </div>

                    <div className="mt-1 text-[9px] text-[#8A94A2]">
                      There are currently no
                      active agents assigned to
                      this district.
                    </div>

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </Panel>


      {/* ======================================================
          TOAST
          ====================================================== */}

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