import { useEffect, useMemo, useState } from "react";

import {
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  BarChart3,
  MapPinned,
  Microscope,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  RefreshCw,
  HeartPulse,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

import PortalShell from "../../components/PortalShell";
import { api, DISEASES } from "../../api";

// ============================================================
// SIDEBAR TABS
// ============================================================

const TABS = [
  {
    key: "overview",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    key: "reports",
    label: "Disease Reports",
    icon: FileText,
  },
  {
    key: "monitoring",
    label: "Weekly Monitoring",
    icon: ClipboardCheck,
  },
  {
    key: "analytics",
    label: "Surveillance Analytics",
    icon: BarChart3,
  },
  {
    key: "risk-map",
    label: "Risk Map",
    icon: MapPinned,
  },
  {
    key: "emerging",
    label: "Emerging Disease Review",
    icon: Microscope,
  },
  {
    key: "agents",
    label: "Agent Oversight",
    icon: ShieldAlert,
  },
  {
    key: "home-relief",
    label: "Home Relief",
    icon: HeartPulse,
  },
];

// ============================================================
// EMPTY HOME RELIEF FORM
// ============================================================

const EMPTY_HOME_RELIEF_FORM = {
  name: "",
  disease: "",
  symptom: "",
  aliases: "",
  category: "supportive_care",

  description: "",
  instructions: "",
  expected_benefit: "",
  medical_rationale: "",

  possible_side_effects: "",
  general_safety_notes: "",
  red_flags: "",
  when_to_seek_care: "",

  safety_rules: [],
};

// ============================================================
// NORMALIZE SAFETY RULE
// ============================================================

const normalizeSafetyRule = (rule = {}) => ({
  id: rule.id ?? null,
  condition_type: rule.condition_type || "",
  condition_value: rule.condition_value || "",
  suitability: rule.suitability || "UNKNOWN",
  severity: rule.severity || "",
  reason: rule.reason || "",
  alternative_remedy_id:
    rule.alternative_remedy_id ?? null,
});

// ============================================================
// NORMALIZE HOME RELIEF FORM
// ============================================================

const normalizeHomeReliefForm = (item = {}) => ({
  name: item.name || "",
  disease: item.disease || "",
  symptom: item.symptom || "",
  aliases: item.aliases || "",
  category: item.category || "supportive_care",

  description: item.description || "",
  instructions: item.instructions || "",
  expected_benefit: item.expected_benefit || "",
  medical_rationale: item.medical_rationale || "",

  possible_side_effects:
    item.possible_side_effects || "",

  general_safety_notes:
    item.general_safety_notes || "",

  red_flags: item.red_flags || "",

  when_to_seek_care:
    item.when_to_seek_care || "",

  safety_rules: Array.isArray(item.safety_rules)
    ? item.safety_rules.map(normalizeSafetyRule)
    : [],
});

// ============================================================
// MEDICAL SUPERVISOR PORTAL
// ============================================================

export default function MedicalSupervisorPortal({
  onExit,
}) {
  const [tab, setTab] = useState("overview");

  const [error, setError] = useState("");

  const [refreshing, setRefreshing] =
    useState(false);

  const [overview, setOverview] =
    useState(null);

  const [reports, setReports] =
    useState([]);

  const [monitoring, setMonitoring] =
    useState([]);

  const [analytics, setAnalytics] =
    useState(null);

  const [predictions, setPredictions] =
    useState([]);

  const [emerging, setEmerging] =
    useState([]);

  const [diseases, setDiseases] =
    useState([]);

  const [agents, setAgents] =
    useState([]);

  const [issues, setIssues] =
    useState([]);

  const [homeReliefs, setHomeReliefs] =
    useState([]);

  // ==========================================================
  // HOME RELIEF FORM
  // ==========================================================

  const [homeReliefForm, setHomeReliefForm] =
    useState({
      ...EMPTY_HOME_RELIEF_FORM,
    });

  // ==========================================================
  // EDITING STATE
  // ==========================================================

  const [editingHomeRelief, setEditingHomeRelief] =
    useState(null);

  const [savingHomeRelief, setSavingHomeRelief] =
    useState(false);

  const [deletingHomeReliefId, setDeletingHomeReliefId] =
    useState(null);

  // ==========================================================
  // OTHER STATE
  // ==========================================================

  const [selectedEmerging, setSelectedEmerging] =
    useState(null);

  const [diseaseFilter, setDiseaseFilter] =
    useState("");

  const [reportDisease, setReportDisease] =
    useState("");

  const [reportWeek, setReportWeek] =
    useState("");

  // ==========================================================
  // LOAD ALL MEDICAL SUPERVISOR DATA
  // ==========================================================

  const loadAll = async () => {
    try {
      setError("");
      setRefreshing(true);

      const [
        overviewData,
        reportsData,
        monitoringData,
        analyticsData,
        predictionsData,
        emergingData,
        diseasesData,
        agentsData,
        issuesData,
      ] = await Promise.all([
        api.getMedicalOverview(),

        api.getMedicalReports({
          disease:
            reportDisease || undefined,

          week_number:
            reportWeek || undefined,
        }),

        api.getMedicalMonitoring(),

        api.getMedicalAnalytics(),

        api.getMedicalRiskMap(
          diseaseFilter || undefined
        ),

        api.getMedicalEmergingDiseases(),

        api.getMedicalDiseases(),

        api.getSupervisorAgents(),

        api.getSupervisorAgentIssues(),
      ]);

      setOverview(overviewData);

      setReports(
        Array.isArray(reportsData)
          ? reportsData
          : []
      );

      setMonitoring(
        Array.isArray(monitoringData)
          ? monitoringData
          : []
      );

      setAnalytics(analyticsData);

      setPredictions(
        Array.isArray(predictionsData)
          ? predictionsData
          : []
      );

      setEmerging(
        Array.isArray(emergingData)
          ? emergingData
          : []
      );

      setDiseases(
        Array.isArray(diseasesData)
          ? diseasesData
          : []
      );

      setAgents(
        Array.isArray(agentsData)
          ? agentsData
          : []
      );

      setIssues(
        Array.isArray(issuesData)
          ? issuesData
          : []
      );
    } catch (e) {
      setError(
        e?.message ||
          "Unable to load Medical Supervisor data."
      );
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAll();

    // Filters intentionally trigger data reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    reportDisease,
    reportWeek,
    diseaseFilter,
  ]);

  // ==========================================================
  // LOAD HOME RELIEF
  // ==========================================================

  const loadHomeReliefs = async () => {
    try {
      const data =
        await api.getMedicalHomeReliefs();

      setHomeReliefs(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (e) {
      setError(
        e?.message ||
          "Unable to load Home Relief entries."
      );
    }
  };

  // ==========================================================
  // RESET HOME RELIEF FORM
  // ==========================================================

  const resetHomeReliefForm = () => {
    setHomeReliefForm({
      ...EMPTY_HOME_RELIEF_FORM,
      safety_rules: [],
    });

    setEditingHomeRelief(null);
  };

  // ==========================================================
  // START EDITING HOME RELIEF
  // ==========================================================

  const startEditHomeRelief = (item) => {
    setError("");

    setEditingHomeRelief(item);

    setHomeReliefForm(
      normalizeHomeReliefForm(item)
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==========================================================
  // SUBMIT HOME RELIEF
  // ==========================================================

  const submitHomeRelief = async (
    event
  ) => {
    event.preventDefault();

    try {
      setError("");
      setSavingHomeRelief(true);

      const cleanedSafetyRules =
        homeReliefForm.safety_rules
          .filter(
            (rule) =>
              rule.condition_type?.trim() &&
              rule.condition_value?.trim()
          )
          .map((rule) => {
            const cleaned = {
              condition_type:
                rule.condition_type.trim(),

              condition_value:
                rule.condition_value.trim(),

              suitability:
                rule.suitability ||
                "UNKNOWN",

              severity:
                rule.severity?.trim() || "",

              reason:
                rule.reason?.trim() || "",

              alternative_remedy_id:
                rule.alternative_remedy_id ??
                null,
            };

            // Do not send null IDs when creating
            // a brand-new safety rule.
            if (!rule.id) {
              delete cleaned.id;
            }

            return cleaned;
          });

      const payload = {
        ...homeReliefForm,

        name:
          homeReliefForm.name.trim(),

        disease:
          homeReliefForm.disease.trim(),

        symptom:
          homeReliefForm.symptom.trim(),

        aliases:
          homeReliefForm.aliases.trim(),

        category:
          homeReliefForm.category ||
          "supportive_care",

        description:
          homeReliefForm.description.trim(),

        instructions:
          homeReliefForm.instructions.trim(),

        expected_benefit:
          homeReliefForm.expected_benefit.trim(),

        medical_rationale:
          homeReliefForm.medical_rationale.trim(),

        possible_side_effects:
          homeReliefForm.possible_side_effects.trim(),

        general_safety_notes:
          homeReliefForm.general_safety_notes.trim(),

        red_flags:
          homeReliefForm.red_flags.trim(),

        when_to_seek_care:
          homeReliefForm.when_to_seek_care.trim(),

        safety_rules:
          cleanedSafetyRules,
      };

      // ======================================================
      // UPDATE EXISTING REMEDY
      // ======================================================

      if (editingHomeRelief) {
        await api.updateHomeRelief(
          editingHomeRelief.id,
          payload
        );
      }

      // ======================================================
      // CREATE NEW REMEDY
      // ======================================================

      else {
        await api.createHomeRelief(
          payload
        );
      }

      resetHomeReliefForm();

      await loadHomeReliefs();
    } catch (e) {
      setError(
        e?.message ||
          (editingHomeRelief
            ? "Unable to update Home Relief entry."
            : "Unable to create Home Relief entry.")
      );
    } finally {
      setSavingHomeRelief(false);
    }
  };

  // ==========================================================
  // APPROVE HOME RELIEF
  // ==========================================================

  const approveHomeRelief = async (
    id
  ) => {
    if (
      !window.confirm(
        "Approve this Home Relief remedy for users?"
      )
    ) {
      return;
    }

    try {
      setError("");

      await api.approveHomeRelief(id);

      await loadHomeReliefs();
    } catch (e) {
      setError(
        e?.message ||
          "Unable to approve Home Relief entry."
      );
    }
  };

  // ==========================================================
  // REJECT HOME RELIEF
  // ==========================================================

  const rejectHomeRelief = async (
    id
  ) => {
    const reason =
      window.prompt(
        "Reason for rejection:"
      );

    if (!reason?.trim()) {
      return;
    }

    try {
      setError("");

      await api.rejectHomeRelief(
        id,
        reason.trim()
      );

      await loadHomeReliefs();
    } catch (e) {
      setError(
        e?.message ||
          "Unable to reject Home Relief entry."
      );
    }
  };

  // ==========================================================
  // DELETE HOME RELIEF
  // ==========================================================

  const deleteHomeRelief = async (
    item
  ) => {
    const confirmed =
      window.confirm(
        `Delete "${item.name}" permanently?\n\nThis action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      setDeletingHomeReliefId(
        item.id
      );

      await api.deleteHomeRelief(
        item.id
      );

      // If the deleted item was being edited,
      // clear the edit form.
      if (
        editingHomeRelief?.id ===
        item.id
      ) {
        resetHomeReliefForm();
      }

      await loadHomeReliefs();
    } catch (e) {
      setError(
        e?.message ||
          "Unable to delete Home Relief entry."
      );
    } finally {
      setDeletingHomeReliefId(null);
    }
  };

  // ==========================================================
  // LOAD HOME RELIEF WHEN TAB OPENS
  // ==========================================================

  useEffect(() => {
    if (tab === "home-relief") {
      loadHomeReliefs();
    }
  }, [tab]);

  // ==========================================================
  // EMERGING DISEASE REVIEW
  // ==========================================================

  const reviewEmerging = async (
    decision
  ) => {
    if (!selectedEmerging) {
      return;
    }

    try {
      setError("");

      const payload = {
        decision,

        review_notes:
          selectedEmerging.review_notes ||
          "",
      };

      if (
        decision ===
        "VERIFY_EXISTING"
      ) {
        if (
          !selectedEmerging.mapped_disease_id
        ) {
          setError(
            "Select an existing disease before verification."
          );

          return;
        }

        payload.mapped_disease_id =
          Number(
            selectedEmerging.mapped_disease_id
          );
      }

      if (
        decision === "VERIFY_NEW"
      ) {
        if (
          !selectedEmerging.new_disease_name?.trim()
        ) {
          setError(
            "Enter the new disease name."
          );

          return;
        }

        payload.new_disease_name =
          selectedEmerging.new_disease_name.trim();

        payload.new_disease_description =
          selectedEmerging
            .new_disease_description ||
          "";
      }

      await api.reviewEmergingDisease(
        selectedEmerging.id,
        payload
      );

      setSelectedEmerging(null);

      await loadAll();
    } catch (e) {
      setError(
        e?.message ||
          "Unable to review emerging disease."
      );
    }
  };

  // ==========================================================
  // AGENT ISSUE SUBMISSION
  // ==========================================================

  const submitIssue = async (
    event
  ) => {
    event.preventDefault();

    const formElement =
      event.currentTarget;

    try {
      setError("");

      const form =
        new FormData(formElement);

      const agentId =
        form.get("agent_id");

      const issueType =
        form.get("issue_type");

      const severity =
        form.get("severity");

      const description =
        form.get("description");

      const evidence =
        form.get("evidence");

      await api.submitAgentIssue({
        agent_id: Number(
          agentId
        ),

        issue_type: issueType,

        severity,

        description,

        evidence,
      });

      formElement.reset();

      await loadAll();
    } catch (e) {
      setError(
        e?.message ||
          "Unable to submit agent issue."
      );
    }
  };

  // ==========================================================
  // OVERVIEW TOTAL
  // ==========================================================

  const totalCases =
    useMemo(
      () =>
        overview?.reports_this_week ||
        0,
      [overview]
    );

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <PortalShell
      title="Karna Suraksha — Medical Supervisor"
      subtitle="Medical verification and surveillance oversight"
      portalLabel="Medical Supervisor"
      tabs={TABS}
      activeTab={tab}
      onTabChange={setTab}
      onExit={onExit}
    >
      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-[13px] font-medium text-[#087A32]">
            Medical surveillance control
          </p>

          <h2 className="text-[28px] font-semibold text-[#102A43] mt-1">
            {
              TABS.find(
                (item) =>
                  item.key === tab
              )?.label
            }
          </h2>

          <p className="text-[14px] text-[#52606D] mt-1">
            Review agent-submitted
            surveillance data while
            keeping administrative
            decisions with Admin.
          </p>
        </div>

        <button
          onClick={loadAll}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-[#D9E2DC] bg-white px-4 py-2.5 text-[12px] font-semibold text-[#315C88] hover:bg-[#F7FAF8] disabled:opacity-50"
        >
          <RefreshCw
            size={15}
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          />

          Refresh
        </button>
      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-[#F0CACA] bg-[#FFF5F5] p-3 text-[13px] text-[#C62828]">
          <span>{error}</span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
            className="shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ======================================================
          TABS
      ====================================================== */}

      {tab === "overview" && (
        <Overview
          overview={overview}
          totalCases={totalCases}
        />
      )}

      {tab === "reports" && (
        <Reports
          reports={reports}
          disease={reportDisease}
          setDisease={
            setReportDisease
          }
          week={reportWeek}
          setWeek={setReportWeek}
        />
      )}

      {tab === "monitoring" && (
        <Monitoring
          rows={monitoring}
          week={
            overview?.current_week
          }
        />
      )}

      {tab === "analytics" && (
        <Analytics
          data={analytics}
        />
      )}

      {tab === "risk-map" && (
        <RiskMap
          data={predictions}
          disease={diseaseFilter}
          setDisease={
            setDiseaseFilter
          }
        />
      )}

      {tab === "emerging" && (
        <EmergingReview
          reports={emerging}
          diseases={diseases}
          selected={
            selectedEmerging
          }
          setSelected={
            setSelectedEmerging
          }
          onReview={
            reviewEmerging
          }
        />
      )}

      {tab === "home-relief" && (
        <HomeReliefManagement
          entries={homeReliefs}
          form={homeReliefForm}
          setForm={
            setHomeReliefForm
          }
          editingItem={
            editingHomeRelief
          }
          saving={
            savingHomeRelief
          }
          deletingId={
            deletingHomeReliefId
          }
          onSubmit={
            submitHomeRelief
          }
          onEdit={
            startEditHomeRelief
          }
          onCancelEdit={
            resetHomeReliefForm
          }
          onApprove={
            approveHomeRelief
          }
          onReject={
            rejectHomeRelief
          }
          onDelete={
            deleteHomeRelief
          }
        />
      )}

      {tab === "agents" && (
        <AgentOversight
          agents={agents}
          issues={issues}
          onSubmit={
            submitIssue
          }
        />
      )}
    </PortalShell>
  );
}

// ============================================================
// OVERVIEW
// ============================================================

function Overview({
  overview,
  totalCases,
}) {
  if (!overview) {
    return <Loading />;
  }

  const cards = [
    [
      "Active Agents",
      overview.active_agents,
    ],

    [
      "Total Taluks",
      overview.total_taluks,
    ],

    [
      "Reports This Week",
      overview.reports_this_week,
    ],

    [
      "Pending Submissions",
      overview.pending_agent_submissions,
    ],

    [
      "Pending Disease Reviews",
      overview.pending_emerging_reviews,
    ],

    [
      "Tracked Diseases",
      overview.diseases_tracked,
    ],
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map(
          ([label, value]) => (
            <Stat
              key={label}
              label={label}
              value={value}
            />
          )
        )}
      </div>

      <div className="grid xl:grid-cols-2 gap-5">
        <Panel title="Current surveillance status">
          <div className="grid grid-cols-2 gap-4">
            <Metric
              label="Current reporting week"
              value={`Week ${
                overview.current_week
              }`}
            />

            <Metric
              label="Cases reported this week"
              value={totalCases}
            />

            <Metric
              label="Agents submitted"
              value={
                overview.submitted_agents_this_week
              }
            />

            <Metric
              label="Agent issues awaiting Admin"
              value={
                overview.pending_agent_issue_reports
              }
            />
          </div>
        </Panel>

        <Panel title="Medical authority responsibilities">
          <ul className="space-y-3 text-[13px] text-[#52606D]">
            <li>
              ✓ Monitor all weekly
              disease reports
              submitted by agents.
            </li>

            <li>
              ✓ Verify suspected
              emerging diseases
              before public display.
            </li>

            <li>
              ✓ Review disease
              trends, maps and
              predictions.
            </li>

            <li>
              ✓ Report agent
              misconduct to Admin
              for final action.
            </li>
          </ul>
        </Panel>
      </div>
    </div>
  );
}

// ============================================================
// DISEASE REPORTS
// ============================================================

function Reports({
  reports,
  disease,
  setDisease,
  week,
  setWeek,
}) {
  return (
    <Panel
      title="All agent-submitted disease reports"
      subtitle="Read-only surveillance records from every taluk agent."
    >
      <div className="flex flex-wrap gap-3 mb-5">
        <select
          value={disease}
          onChange={(e) =>
            setDisease(
              e.target.value
            )
          }
          className="rounded-xl border border-[#D9E2DC] bg-white px-3 py-2.5 text-[13px]"
        >
          <option value="">
            All Diseases
          </option>

          {DISEASES.map(
            (d) => (
              <option key={d}>
                {d}
              </option>
            )
          )}
        </select>

        <input
          value={week}
          onChange={(e) =>
            setWeek(
              e.target.value
            )
          }
          type="number"
          min="1"
          max="53"
          placeholder="Week number"
          className="w-[150px] rounded-xl border border-[#D9E2DC] px-3 py-2.5 text-[13px]"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#E3E9E5]">
        <table className="w-full text-left text-[12px]">
          <thead className="bg-[#F7FAF8] text-[#607080]">
            <tr>
              <th className="px-3 py-3">
                Week
              </th>

              <th className="px-3 py-3">
                District
              </th>

              <th className="px-3 py-3">
                Taluk
              </th>

              <th className="px-3 py-3">
                Agent
              </th>

              <th className="px-3 py-3">
                Disease
              </th>

              <th className="px-3 py-3">
                Cases
              </th>

              <th className="px-3 py-3">
                Severity
              </th>
            </tr>
          </thead>

          <tbody>
            {reports.map(
              (r) => (
                <tr
                  key={r.id}
                  className="border-t border-[#E8EDE9]"
                >
                  <td className="px-3 py-3">
                    W
                    {
                      r.week_number
                    }
                    /
                    {r.year}
                  </td>

                  <td className="px-3 py-3">
                    {
                      r.district_name
                    }
                  </td>

                  <td className="px-3 py-3 font-medium">
                    {
                      r.taluk_name
                    }
                  </td>

                  <td className="px-3 py-3">
                    {
                      r.agent_name
                    }
                  </td>

                  <td className="px-3 py-3 font-semibold">
                    {r.disease}
                  </td>

                  <td className="px-3 py-3">
                    {r.cases}
                  </td>

                  <td className="px-3 py-3">
                    {r.severity ||
                      "—"}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>

      {!reports.length && (
        <Empty text="No disease reports match the selected filters." />
      )}
    </Panel>
  );
}

// ============================================================
// WEEKLY MONITORING
// ============================================================

function Monitoring({
  rows,
  week,
}) {
  return (
    <Panel
      title={`Weekly Monitoring — Week ${
        week || "—"
      }`}
      subtitle="See which agents have submitted their weekly report."
    >
      <div className="overflow-x-auto rounded-xl border border-[#E3E9E5]">
        <table className="w-full text-left text-[12px]">
          <thead className="bg-[#F7FAF8] text-[#607080]">
            <tr>
              <th className="px-4 py-3">
                Agent
              </th>

              <th className="px-4 py-3">
                District
              </th>

              <th className="px-4 py-3">
                Taluk
              </th>

              <th className="px-4 py-3">
                Status
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map(
              (r) => (
                <tr
                  key={r.agent_id}
                  className="border-t border-[#E8EDE9]"
                >
                  <td className="px-4 py-3 font-medium">
                    {
                      r.agent_name
                    }
                  </td>

                  <td className="px-4 py-3">
                    {
                      r.district_name
                    }
                  </td>

                  <td className="px-4 py-3">
                    {
                      r.taluk_name
                    }
                  </td>

                  <td className="px-4 py-3">
                    {r.submitted ? (
                      <span className="inline-flex items-center gap-1.5 text-[#087A32] font-semibold">
                        <CheckCircle2
                          size={15}
                        />
                        Submitted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[#C62828] font-semibold">
                        <XCircle
                          size={15}
                        />
                        Pending
                      </span>
                    )}
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

// ============================================================
// ANALYTICS
// ============================================================

function Analytics({
  data,
}) {
  if (!data) {
    return <Loading />;
  }

  const max = Math.max(
    ...(data.weekly || []).map(
      (w) =>
        w.total_cases
    ),
    1
  );

  return (
    <div className="grid xl:grid-cols-2 gap-5">
      <Panel
        title="Weekly case trend"
        subtitle="Aggregated from agent-submitted disease reports."
      >
        <div className="space-y-4">
          {data.weekly?.map(
            (w) => (
              <div
                key={`${w.year}-${w.week_number}`}
              >
                <div className="flex justify-between text-[12px] mb-1">
                  <span>
                    {w.label}/
                    {w.year}
                  </span>

                  <b>
                    {
                      w.total_cases
                    }{" "}
                    cases
                  </b>
                </div>

                <div className="h-3 rounded-full bg-[#EAF1EC]">
                  <div
                    className="h-3 rounded-full bg-[#0B8F45]"
                    style={{
                      width: `${Math.max(
                        3,
                        (w.total_cases /
                          max) *
                          100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )
          )}
        </div>
      </Panel>

      <Panel title="Disease burden">
        <div className="space-y-3">
          {data.disease_totals?.map(
            (d, index) => (
              <div
                key={d.disease}
                className="flex items-center justify-between rounded-xl bg-[#F7FAF8] px-4 py-3"
              >
                <span className="text-[13px] font-medium">
                  {index + 1}.{" "}
                  {d.disease}
                </span>

                <b className="text-[14px] text-[#087A32]">
                  {d.cases}
                </b>
              </div>
            )
          )}
        </div>

        {!data.disease_totals
          ?.length && (
          <Empty text="No analytics data available." />
        )}
      </Panel>
    </div>
  );
}

// ============================================================
// RISK MAP
// ============================================================

function RiskMap({
  data,
  disease,
  setDisease,
}) {
  const grouped =
    useMemo(() => {
      const map =
        new Map();

      data.forEach(
        (p) => {
          if (
            !map.has(
              p.taluk_id
            )
          ) {
            map.set(
              p.taluk_id,
              {
                ...p,
                current_cases: 0,
                predicted_cases: 0,
              }
            );
          }

          const x =
            map.get(
              p.taluk_id
            );

          x.current_cases +=
            p.current_cases ||
            0;

          x.predicted_cases +=
            p.predicted_cases ||
            0;
        }
      );

      return [
        ...map.values(),
      ];
    }, [data]);

  return (
    <Panel
      title="Surveillance Risk Map Data"
      subtitle="Latest ML prediction data available to the Medical Supervisor."
    >
      <select
        value={disease}
        onChange={(e) =>
          setDisease(
            e.target.value
          )
        }
        className="mb-5 rounded-xl border border-[#D9E2DC] px-3 py-2.5 text-[13px]"
      >
        <option value="">
          All Diseases
        </option>

        {DISEASES.map(
          (d) => (
            <option key={d}>
              {d}
            </option>
          )
        )}
      </select>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {grouped.map(
          (p) => (
            <div
              key={p.taluk_id}
              className="rounded-2xl border border-[#E3E9E5] bg-white p-4"
            >
              <div className="flex justify-between gap-3">
                <div>
                  <h3 className="font-semibold">
                    {
                      p.taluk_name
                    }
                  </h3>

                  <p className="text-[11px] text-[#7A8598] mt-1">
                    {
                      p.district_name
                    }
                  </p>
                </div>

                <Risk
                  level={
                    p.risk_level
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <Metric
                  label="Current"
                  value={
                    p.current_cases
                  }
                />

                <Metric
                  label="Predicted"
                  value={
                    p.predicted_cases
                  }
                />
              </div>
            </div>
          )
        )}
      </div>

      {!grouped.length && (
        <Empty text="No prediction data available." />
      )}
    </Panel>
  );
}

// ============================================================
// EMERGING DISEASE REVIEW
// ============================================================

function EmergingReview({
  reports,
  diseases,
  selected,
  setSelected,
  onReview,
}) {
  return (
    <div className="space-y-5">
      <Panel
        title="Emerging Disease Review"
        subtitle="Only medically verified emerging reports become official surveillance records."
      >
        <div className="space-y-3">
          {reports.map(
            (r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-[#E3E9E5] p-4"
              >
                <div className="flex justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">
                      {
                        r.reported_name
                      }
                    </h3>

                    <p className="text-[11px] text-[#7A8598] mt-1">
                      {
                        r.taluk_name
                      }{" "}
                      ·{" "}
                      {
                        r.suspected_cases
                      }{" "}
                      suspected
                      cases ·{" "}
                      {r.status}
                    </p>

                    <p className="text-[13px] text-[#52606D] mt-2">
                      {r.symptoms ||
                        "No symptoms recorded."}
                    </p>
                  </div>

                  <button
                    disabled={
                      r.status !==
                      "PENDING"
                    }
                    onClick={() =>
                      setSelected({
                        ...r,
                      })
                    }
                    className="h-fit rounded-xl bg-[#087A32] text-white px-4 py-2 text-[12px] font-semibold disabled:opacity-40"
                  >
                    Review
                  </button>
                </div>
              </div>
            )
          )}

          {!reports.length && (
            <Empty text="No emerging disease reports." />
          )}
        </div>
      </Panel>

      {selected && (
        <Panel
          title={`Review: ${
            selected.reported_name
          }`}
        >
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-[12px] font-semibold">
                Map to existing disease
              </label>

              <select
                value={
                  selected.mapped_disease_id ||
                  ""
                }
                onChange={(e) =>
                  setSelected({
                    ...selected,

                    mapped_disease_id:
                      e.target.value,
                  })
                }
                className="w-full mt-1 rounded-xl border border-[#D9E2DC] px-3 py-2.5"
              >
                <option value="">
                  Select disease
                </option>

                {diseases.map(
                  (d) => (
                    <option
                      key={d.id}
                      value={d.id}
                    >
                      {d.name}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="text-[12px] font-semibold">
                New disease name
              </label>

              <input
                value={
                  selected.new_disease_name ||
                  ""
                }
                onChange={(e) =>
                  setSelected({
                    ...selected,

                    new_disease_name:
                      e.target.value,
                  })
                }
                className="w-full mt-1 rounded-xl border border-[#D9E2DC] px-3 py-2.5"
              />
            </div>
          </div>

          <textarea
            value={
              selected.review_notes ||
              ""
            }
            onChange={(e) =>
              setSelected({
                ...selected,

                review_notes:
                  e.target.value,
              })
            }
            rows="3"
            placeholder="Medical review notes"
            className="w-full mt-4 rounded-xl border border-[#D9E2DC] px-3 py-2.5"
          />

          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() =>
                onReview(
                  "VERIFY_EXISTING"
                )
              }
              className="rounded-xl bg-[#087A32] text-white px-4 py-2.5 text-[12px] font-semibold"
            >
              Verify Existing
            </button>

            <button
              onClick={() =>
                onReview(
                  "VERIFY_NEW"
                )
              }
              className="rounded-xl bg-[#315C88] text-white px-4 py-2.5 text-[12px] font-semibold"
            >
              Verify New Disease
            </button>

            <button
              onClick={() =>
                onReview("REJECT")
              }
              className="rounded-xl bg-[#FFF5F5] text-[#C62828] border border-[#F0CACA] px-4 py-2.5 text-[12px] font-semibold"
            >
              Reject
            </button>
          </div>
        </Panel>
      )}
    </div>
  );
}

// ============================================================
// AGENT OVERSIGHT
// ============================================================

function AgentOversight({
  agents,
  issues,
  onSubmit,
}) {
  return (
    <div className="grid xl:grid-cols-[1fr_1fr] gap-5">
      <Panel
        title="Report an Agent Issue"
        subtitle="The Medical Supervisor reports; Admin makes the final activation/deactivation decision."
      >
        <form
          onSubmit={onSubmit}
          className="space-y-4"
        >
          <select
            name="agent_id"
            required
            className="w-full rounded-xl border border-[#D9E2DC] px-3 py-2.5"
          >
            <option value="">
              Select agent
            </option>

            {agents.map(
              (a) => (
                <option
                  key={a.id}
                  value={a.id}
                >
                  {
                    a.full_name
                  }{" "}
                  —{" "}
                  {
                    a.taluk_name
                  }
                </option>
              )
            )}
          </select>

          <div className="grid md:grid-cols-2 gap-4">
            <input
              name="issue_type"
              required
              placeholder="Issue type"
              className="rounded-xl border border-[#D9E2DC] px-3 py-2.5"
            />

            <select
              name="severity"
              className="rounded-xl border border-[#D9E2DC] px-3 py-2.5"
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
          </div>

          <textarea
            name="description"
            required
            rows="4"
            placeholder="Describe the issue and why it needs Admin validation."
            className="w-full rounded-xl border border-[#D9E2DC] px-3 py-2.5"
          />

          <textarea
            name="evidence"
            rows="3"
            placeholder="Evidence / report IDs / supporting details"
            className="w-full rounded-xl border border-[#D9E2DC] px-3 py-2.5"
          />

          <button
            type="submit"
            className="rounded-xl bg-[#087A32] text-white px-5 py-3 text-[13px] font-semibold"
          >
            Submit to Admin
          </button>
        </form>
      </Panel>

      <Panel
        title="My Agent Reports"
        subtitle="Track reports already submitted to Admin."
      >
        <div className="space-y-3">
          {issues.map(
            (i) => (
              <div
                key={i.id}
                className="rounded-xl border border-[#E3E9E5] p-4"
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[13px]">
                      {
                        i.agent_name
                      }
                    </p>

                    <p className="text-[11px] text-[#7A8598] mt-1">
                      {
                        i.issue_type
                      }{" "}
                      ·{" "}
                      {
                        i.severity
                      }
                    </p>
                  </div>

                  <span className="text-[11px] font-semibold text-[#315C88]">
                    {i.status}
                  </span>
                </div>

                <p className="text-[12px] text-[#52606D] mt-2">
                  {
                    i.description
                  }
                </p>
              </div>
            )
          )}

          {!issues.length && (
            <Empty text="No agent issues submitted by you." />
          )}
        </div>
      </Panel>
    </div>
  );
}

// ============================================================
// HOME RELIEF MANAGEMENT
// ============================================================

function HomeReliefManagement({
  entries,
  form,
  setForm,
  editingItem,
  saving,
  deletingId,
  onSubmit,
  onEdit,
  onCancelEdit,
  onApprove,
  onReject,
  onDelete,
}) {
  // ==========================================================
  // FORM HELPERS
  // ==========================================================

  const update = (
    key,
    value
  ) => {
    setForm(
      (prev) => ({
        ...prev,
        [key]: value,
      })
    );
  };

  const addRule = () => {
    setForm(
      (prev) => ({
        ...prev,

        safety_rules: [
          ...prev.safety_rules,

          {
            id: null,
            condition_type: "",
            condition_value: "",
            suitability:
              "UNKNOWN",
            severity: "",
            reason: "",
            alternative_remedy_id:
              null,
          },
        ],
      })
    );
  };

  const updateRule = (
    index,
    key,
    value
  ) => {
    setForm(
      (prev) => ({
        ...prev,

        safety_rules:
          prev.safety_rules.map(
            (rule, i) =>
              i === index
                ? {
                    ...rule,
                    [key]: value,
                  }
                : rule
          ),
      })
    );
  };

  const removeRule = (
    index
  ) => {
    setForm(
      (prev) => ({
        ...prev,

        safety_rules:
          prev.safety_rules.filter(
            (_, i) =>
              i !== index
          ),
      })
    );
  };

  const field = (
    label,
    key,
    placeholder = ""
  ) => (
    <label className="block">
      <span className="text-[11px] font-semibold text-[#52606D]">
        {label}
      </span>

      <textarea
        value={form[key] || ""}
        onChange={(e) =>
          update(
            key,
            e.target.value
          )
        }
        placeholder={
          placeholder
        }
        className="mt-1 min-h-[72px] w-full rounded-xl border border-[#D9E2DC] bg-white px-3 py-2 text-[12px] outline-none focus:border-[#315C88]"
      />
    </label>
  );

  return (
    <div className="space-y-6">
      {/* ======================================================
          CREATE / EDIT FORM
      ====================================================== */}

      <Panel
        title={
          editingItem
            ? "Edit Home Relief Remedy"
            : "Add Home Relief / Supportive Care"
        }
        subtitle={
          editingItem
            ? `Editing "${editingItem.name}". Changes should be medically reviewed before the remedy is used by patients.`
            : "Entries remain pending until the Medical Supervisor explicitly approves them. Do not approve an entry until its safety profile and population restrictions have been reviewed."
        }
      >
        {/* EDIT MODE BANNER */}

        {editingItem && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#D8E6F2] bg-[#F3F8FC] p-3">
            <div>
              <p className="text-[12px] font-semibold text-[#315C88]">
                Editing existing remedy
              </p>

              <p className="mt-1 text-[11px] text-[#607080]">
                Remedy ID:{" "}
                {editingItem.id}
              </p>
            </div>

            <button
              type="button"
              onClick={
                onCancelEdit
              }
              className="inline-flex items-center gap-2 rounded-lg border border-[#D9E2DC] bg-white px-3 py-2 text-[11px] font-semibold text-[#52606D] hover:bg-[#F7FAF8]"
            >
              <X size={14} />
              Cancel Edit
            </button>
          </div>
        )}

        <form
          onSubmit={onSubmit}
          className="space-y-5"
        >
          {/* ==================================================
              BASIC INFORMATION
          ================================================== */}

          <div className="grid gap-4 md:grid-cols-3">
            <label className="block">
              <span className="text-[11px] font-semibold text-[#52606D]">
                Remedy name
              </span>

              <input
                required
                value={
                  form.name
                }
                onChange={(e) =>
                  update(
                    "name",
                    e.target.value
                  )
                }
                className="mt-1 w-full rounded-xl border border-[#D9E2DC] px-3 py-2 text-[12px]"
              />
            </label>

            <label className="block">
              <span className="text-[11px] font-semibold text-[#52606D]">
                Disease
              </span>

              <input
                value={
                  form.disease
                }
                onChange={(e) =>
                  update(
                    "disease",
                    e.target.value
                  )
                }
                className="mt-1 w-full rounded-xl border border-[#D9E2DC] px-3 py-2 text-[12px]"
              />
            </label>

            <label className="block">
              <span className="text-[11px] font-semibold text-[#52606D]">
                Symptom
              </span>

              <input
                value={
                  form.symptom
                }
                onChange={(e) =>
                  update(
                    "symptom",
                    e.target.value
                  )
                }
                className="mt-1 w-full rounded-xl border border-[#D9E2DC] px-3 py-2 text-[12px]"
              />
            </label>
          </div>

          {/* ==================================================
              ALIASES / CATEGORY
          ================================================== */}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-[11px] font-semibold text-[#52606D]">
                Aliases
              </span>

              <input
                value={
                  form.aliases
                }
                onChange={(e) =>
                  update(
                    "aliases",
                    e.target.value
                  )
                }
                placeholder="Comma-separated alternative names"
                className="mt-1 w-full rounded-xl border border-[#D9E2DC] px-3 py-2 text-[12px]"
              />
            </label>

            <label className="block">
              <span className="text-[11px] font-semibold text-[#52606D]">
                Category
              </span>

              <select
                value={
                  form.category
                }
                onChange={(e) =>
                  update(
                    "category",
                    e.target.value
                  )
                }
                className="mt-1 w-full rounded-xl border border-[#D9E2DC] bg-white px-3 py-2 text-[12px]"
              >
                <option value="supportive_care">
                  Supportive Care
                </option>

                <option value="home_remedy">
                  Home Remedy
                </option>

                <option value="hydration">
                  Hydration
                </option>

                <option value="dietary_support">
                  Dietary Support
                </option>

                <option value="symptom_relief">
                  Symptom Relief
                </option>
              </select>
            </label>
          </div>

          {/* ==================================================
              MEDICAL CONTENT
          ================================================== */}

          <div className="grid gap-4 md:grid-cols-2">
            {field(
              "Description",
              "description"
            )}

            {field(
              "General guidance / instructions",
              "instructions"
            )}

            {field(
              "Expected supportive benefit",
              "expected_benefit"
            )}

            {field(
              "Medical rationale",
              "medical_rationale"
            )}

            {field(
              "Possible side effects / safety profile",
              "possible_side_effects"
            )}

            {field(
              "General safety notes",
              "general_safety_notes"
            )}

            {field(
              "Red flags",
              "red_flags"
            )}

            {field(
              "When to seek professional care",
              "when_to_seek_care"
            )}
          </div>

          {/* ==================================================
              SAFETY RULES
          ================================================== */}

          <div className="rounded-2xl border border-[#E3E9E5] bg-[#F7FAF8] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-[13px] font-semibold text-[#102A43]">
                  Safety rules
                </h4>

                <p className="mt-1 text-[11px] text-[#7A8795]">
                  Add explicit
                  restrictions for
                  special
                  populations or
                  conditions.
                  UNKNOWN rules
                  cannot be
                  approved.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  addRule
                }
                className="rounded-xl bg-[#102A43] px-3 py-2 text-[11px] font-semibold text-white"
              >
                + Add rule
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {form.safety_rules.map(
                (rule, index) => (
                  <div
                    key={
                      rule.id ??
                      `new-${index}`
                    }
                    className="rounded-xl border border-[#D9E2DC] bg-white p-3"
                  >
                    <div className="grid gap-2 md:grid-cols-6">
                      <input
                        placeholder="Condition type e.g. diabetes"
                        value={
                          rule.condition_type
                        }
                        onChange={(e) =>
                          updateRule(
                            index,
                            "condition_type",
                            e.target.value
                          )
                        }
                        className="rounded-lg border px-2 py-2 text-[11px]"
                      />

                      <input
                        placeholder="Condition value"
                        value={
                          rule.condition_value
                        }
                        onChange={(e) =>
                          updateRule(
                            index,
                            "condition_value",
                            e.target.value
                          )
                        }
                        className="rounded-lg border px-2 py-2 text-[11px]"
                      />

                      <select
                        value={
                          rule.suitability
                        }
                        onChange={(e) =>
                          updateRule(
                            index,
                            "suitability",
                            e.target.value
                          )
                        }
                        className="rounded-lg border px-2 py-2 text-[11px]"
                      >
                        <option value="UNKNOWN">
                          UNKNOWN
                        </option>

                        <option value="SUITABLE">
                          SUITABLE
                        </option>

                        <option value="CAUTION">
                          CAUTION
                        </option>

                        <option value="NOT_RECOMMENDED">
                          NOT_RECOMMENDED
                        </option>

                        <option value="CONTRAINDICATED">
                          CONTRAINDICATED
                        </option>
                      </select>

                      <input
                        placeholder="Severity"
                        value={
                          rule.severity
                        }
                        onChange={(e) =>
                          updateRule(
                            index,
                            "severity",
                            e.target.value
                          )
                        }
                        className="rounded-lg border px-2 py-2 text-[11px]"
                      />

                      <input
                        placeholder="Reason"
                        value={
                          rule.reason
                        }
                        onChange={(e) =>
                          updateRule(
                            index,
                            "reason",
                            e.target.value
                          )
                        }
                        className="rounded-lg border px-2 py-2 text-[11px] md:col-span-2"
                      />
                    </div>

                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          removeRule(
                            index
                          )
                        }
                        className="text-[11px] font-semibold text-[#C62828] hover:underline"
                      >
                        Remove Rule
                      </button>
                    </div>
                  </div>
                )
              )}

              {!form.safety_rules
                .length && (
                <div className="rounded-xl border border-dashed border-[#D9E2DC] p-5 text-center text-[11px] text-[#7A8795]">
                  No safety rules
                  added yet.
                  Click
                  "+ Add rule"
                  to define
                  population-specific
                  restrictions.
                </div>
              )}
            </div>
          </div>

          {/* ==================================================
              FORM BUTTONS
          ================================================== */}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={
                saving
              }
              className="inline-flex items-center gap-2 rounded-xl bg-[#087A32] px-4 py-2.5 text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving && (
                <RefreshCw
                  size={14}
                  className="animate-spin"
                />
              )}

              {saving
                ? editingItem
                  ? "Saving Changes..."
                  : "Submitting..."
                : editingItem
                ? "Save Changes"
                : "Submit for Medical Review"}
            </button>

            {editingItem && (
              <button
                type="button"
                onClick={
                  onCancelEdit
                }
                disabled={
                  saving
                }
                className="rounded-xl border border-[#D9E2DC] bg-white px-4 py-2.5 text-[12px] font-semibold text-[#52606D] hover:bg-[#F7FAF8] disabled:opacity-50"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </Panel>

      {/* ======================================================
          KNOWLEDGE BASE
      ====================================================== */}

      <Panel
        title="Home Relief Knowledge Base"
        subtitle="Medical Supervisor can approve, edit, reject, or delete existing remedies."
      >
        <div className="space-y-3">
          {entries.map(
            (item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-[#E3E9E5] bg-white p-4"
              >
                {/* ==================================================
                    HEADER
                ================================================== */}

                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-[14px] font-semibold text-[#102A43]">
                        {item.name}
                      </h4>

                      <span
                        className={`rounded-full px-2 py-1 text-[9px] font-bold ${
                          item.status ===
                          "ACTIVE"
                            ? "bg-[#EAF6EE] text-[#087A32]"
                            : item.status ===
                              "REJECTED"
                            ? "bg-[#FFF0F0] text-[#C62828]"
                            : "bg-[#EEF3F8] text-[#315C88]"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <p className="mt-1 text-[11px] text-[#7A8795]">
                      {item.disease ||
                        "General"}{" "}
                      ·{" "}
                      {item.symptom ||
                        "Supportive care"}
                    </p>
                  </div>

                  {/* ==================================================
                      ACTIONS
                  ================================================== */}

                  <div className="flex flex-wrap gap-2">
                    {/* EDIT */}

                    <button
                      type="button"
                      onClick={() =>
                        onEdit(
                          item
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#D8E6F2] bg-[#F3F8FC] px-3 py-2 text-[10px] font-semibold text-[#315C88] hover:bg-[#EAF3FA]"
                    >
                      <Pencil
                        size={12}
                      />
                      Edit
                    </button>

                    {/* APPROVE */}

                    {item.status !==
                      "ACTIVE" &&
                      item.status !==
                        "REJECTED" && (
                        <button
                          type="button"
                          onClick={() =>
                            onApprove(
                              item.id
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#087A32] px-3 py-2 text-[10px] font-semibold text-white hover:bg-[#076B2C]"
                        >
                          <CheckCircle2
                            size={12}
                          />
                          Approve
                        </button>
                      )}

                    {/* REJECT */}

                    {item.status !==
                      "ACTIVE" &&
                      item.status !==
                        "REJECTED" && (
                        <button
                          type="button"
                          onClick={() =>
                            onReject(
                              item.id
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#FFF0F0] px-3 py-2 text-[10px] font-semibold text-[#C62828] hover:bg-[#FFE5E5]"
                        >
                          <XCircle
                            size={12}
                          />
                          Reject
                        </button>
                      )}

                    {/* DELETE */}

                    <button
                      type="button"
                      disabled={
                        deletingId ===
                        item.id
                      }
                      onClick={() =>
                        onDelete(
                          item
                        )
                      }
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#F0CACA] bg-white px-3 py-2 text-[10px] font-semibold text-[#C62828] hover:bg-[#FFF5F5] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingId ===
                      item.id ? (
                        <RefreshCw
                          size={12}
                          className="animate-spin"
                        />
                      ) : (
                        <Trash2
                          size={12}
                        />
                      )}

                      Delete
                    </button>
                  </div>
                </div>

                {/* ==================================================
                    DESCRIPTION
                ================================================== */}

                <p className="mt-3 text-[12px] leading-5 text-[#52606D]">
                  {item.description ||
                    "No description provided."}
                </p>

                {/* ==================================================
                    EXTRA INFORMATION
                ================================================== */}

                <div className="mt-3 grid gap-2 md:grid-cols-3">
                  <div className="rounded-lg bg-[#F7FAF8] px-3 py-2">
                    <p className="text-[9px] uppercase tracking-wide text-[#8A93A3]">
                      Category
                    </p>

                    <p className="mt-1 text-[11px] font-semibold text-[#52606D]">
                      {item.category ||
                        "Supportive Care"}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#F7FAF8] px-3 py-2">
                    <p className="text-[9px] uppercase tracking-wide text-[#8A93A3]">
                      Safety Rules
                    </p>

                    <p className="mt-1 text-[11px] font-semibold text-[#52606D]">
                      {item.safety_rules
                        ?.length ||
                        0}
                    </p>
                  </div>

                  <div className="rounded-lg bg-[#F7FAF8] px-3 py-2">
                    <p className="text-[9px] uppercase tracking-wide text-[#8A93A3]">
                      Remedy ID
                    </p>

                    <p className="mt-1 text-[11px] font-semibold text-[#52606D]">
                      #{item.id}
                    </p>
                  </div>
                </div>

                {/* ==================================================
                    SAFETY SUMMARY
                ================================================== */}

                {item.safety_rules
                  ?.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[10px] font-semibold text-[#52606D]">
                      Population-specific
                      safety rules
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.safety_rules.map(
                        (
                          rule,
                          index
                        ) => (
                          <span
                            key={
                              rule.id ??
                              index
                            }
                            className={`rounded-full px-2.5 py-1 text-[9px] font-semibold ${
                              rule.suitability ===
                              "NOT_RECOMMENDED"
                                ? "bg-[#FFF0F0] text-[#C62828]"
                                : rule.suitability ===
                                  "CONTRAINDICATED"
                                ? "bg-[#FFE4E4] text-[#B71C1C]"
                                : rule.suitability ===
                                  "CAUTION"
                                ? "bg-[#FFF7E8] text-[#B26A00]"
                                : rule.suitability ===
                                  "SUITABLE"
                                ? "bg-[#EAF6EE] text-[#087A32]"
                                : "bg-[#EEF3F8] text-[#52606D]"
                            }`}
                          >
                            {
                              rule.condition_type
                            }
                            :{" "}
                            {
                              rule.condition_value
                            }{" "}
                            —{" "}
                            {
                              rule.suitability
                            }
                          </span>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          )}

          {!entries.length && (
            <Empty text="No Home Relief entries yet." />
          )}
        </div>
      </Panel>
    </div>
  );
}

// ============================================================
// COMMON COMPONENTS
// ============================================================

function Panel({
  title,
  subtitle,
  children,
}) {
  return (
    <div className="bg-white border border-[#E3E9E5] rounded-2xl p-5 shadow-sm">
      <div className="mb-5">
        <h3 className="text-[17px] font-semibold text-[#102A43]">
          {title}
        </h3>

        {subtitle && (
          <p className="text-[12px] text-[#7A8795] mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {children}
    </div>
  );
}

// ============================================================
// STAT
// ============================================================

function Stat({
  label,
  value,
}) {
  return (
    <div className="bg-white border border-[#E3E9E5] rounded-2xl p-5">
      <p className="text-[11px] uppercase tracking-[0.08em] text-[#8A93A3]">
        {label}
      </p>

      <p className="text-[28px] font-bold text-[#087A32] mt-2">
        {value}
      </p>
    </div>
  );
}

// ============================================================
// METRIC
// ============================================================

function Metric({
  label,
  value,
}) {
  return (
    <div className="rounded-xl bg-[#F7FAF8] p-3">
      <p className="text-[10px] text-[#7A8795]">
        {label}
      </p>

      <p className="text-[17px] font-bold text-[#102A43] mt-1">
        {value}
      </p>
    </div>
  );
}

// ============================================================
// RISK
// ============================================================

function Risk({
  level,
}) {
  const cls =
    level ===
      "Critical" ||
    level === "High"
      ? "bg-[#FFF0F0] text-[#C62828]"
      : level ===
        "Moderate"
      ? "bg-[#FFF7E8] text-[#B26A00]"
      : "bg-[#EAF6EE] text-[#087A32]";

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${cls}`}
    >
      {level || "Low"}
    </span>
  );
}

// ============================================================
// EMPTY
// ============================================================

function Empty({
  text,
}) {
  return (
    <div className="text-center py-8 text-[13px] text-[#7A8795]">
      {text}
    </div>
  );
}

// ============================================================
// LOADING
// ============================================================

function Loading() {
  return (
    <div className="rounded-2xl bg-white border border-[#E3E9E5] p-8 text-[13px] text-[#7A8795]">
      Loading surveillance
      data…
    </div>
  );
}