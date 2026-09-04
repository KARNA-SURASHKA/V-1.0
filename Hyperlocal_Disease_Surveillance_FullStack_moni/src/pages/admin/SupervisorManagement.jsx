import {
  cloneElement,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  Download,
  Edit3,
  Eye,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import { api } from "../../api";

import supervisorHero from "../../assets/ui/medical-hero-right.png";


// ============================================================
// CONSTANTS
// ============================================================

const EMPTY_FORM = {
  username: "",
  password: "",
  full_name: "",
  district_id: "",
};


// ============================================================
// HELPERS
// ============================================================

const safeNumber = (value, fallback = 0) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
};


const formatDateTime = (value) => {
  if (!value) {
    return "—";
  }

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


const formatShortTime = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const now = new Date();

  const sameDay =
    date.toDateString() === now.toDateString();

  if (sameDay) {
    return new Intl.DateTimeFormat("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
  }).format(date);
};


const getInitials = (name = "Supervisor") => {
  return (
    String(name)
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "SU"
  );
};


const statusClasses = (active) => {
  if (active) {
    return "bg-[#EAF7EE] text-[#087A32] border-[#CDEAD6]";
  }

  return "bg-[#F3F4F4] text-[#68737D] border-[#DDE2DE]";
};


const getDistrictName = (supervisor) => {
  return (
    supervisor?.district_name ||
    supervisor?.district?.name ||
    "Unassigned"
  );
};


const getTalukCount = (supervisor) => {
  return safeNumber(
    supervisor?.taluks_managed ??
      supervisor?.assigned_areas ??
      supervisor?.taluk_count ??
      0
  );
};


const getAgentCount = (supervisor) => {
  return safeNumber(
    supervisor?.supervising_agents ??
      supervisor?.reports_responsible ??
      supervisor?.agent_count ??
      0
  );
};


const getReportsThisWeek = (supervisor) => {
  return safeNumber(
    supervisor?.reports_this_week ??
      supervisor?.reports_reviewed_this_week ??
      supervisor?.weekly_reports ??
      0
  );
};


const getPendingActions = (supervisor) => {
  return safeNumber(
    supervisor?.pending_reviews ??
      supervisor?.pending_actions ??
      0
  );
};


// ============================================================
// MAIN COMPONENT
// ============================================================

export default function SupervisorManagement({
  location,
}) {
  // ----------------------------------------------------------
  // DATA
  // ----------------------------------------------------------

  const [supervisors, setSupervisors] = useState([]);

  const [selected, setSelected] = useState(null);

  const [details, setDetails] = useState(null);

  const [districts, setDistricts] = useState([]);


  // ----------------------------------------------------------
  // FILTERS
  // ----------------------------------------------------------

  const [search, setSearch] = useState("");

  const [districtFilter, setDistrictFilter] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("");


  // ----------------------------------------------------------
  // UI
  // ----------------------------------------------------------

  const [menuId, setMenuId] = useState(null);

  const [selectedIds, setSelectedIds] =
    useState([]);

  const [showAdd, setShowAdd] =
    useState(false);

  const [showAssignments, setShowAssignments] =
    useState(false);

  const [editing, setEditing] =
    useState(null);

  const [form, setForm] =
    useState(EMPTY_FORM);


  // ----------------------------------------------------------
  // LOADING / ERRORS
  // ----------------------------------------------------------

  const [loading, setLoading] =
    useState(true);

  const [detailLoading, setDetailLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [notice, setNotice] =
    useState("");


  // ==========================================================
  // LOAD DISTRICTS
  // ==========================================================

  const loadDistricts = async () => {
    try {
      const statesResponse =
        await api.getStates();

      const states = Array.isArray(
        statesResponse
      )
        ? statesResponse
        : statesResponse?.data || [];

      const allDistricts = [];

      for (const state of states) {
        if (!state?.id) {
          continue;
        }

        try {
          const response =
            await api.getDistricts(
              state.id
            );

          const stateDistricts =
            Array.isArray(response)
              ? response
              : response?.data || [];

          allDistricts.push(
            ...stateDistricts
          );
        } catch {
          // Ignore an individual state
          // if its district endpoint fails.
        }
      }

      const unique = Array.from(
        new Map(
          allDistricts.map(
            (district) => [
              district.id,
              district,
            ]
          )
        ).values()
      );

      unique.sort((a, b) =>
        String(a?.name || "").localeCompare(
          String(b?.name || "")
        )
      );

      setDistricts(unique);
    } catch {
      setDistricts([]);
    }
  };


  // ==========================================================
  // LOAD SUPERVISORS
  // ==========================================================

  const loadSupervisors = async (
    keepSelected = true
  ) => {
    try {
      setLoading(true);

      setError("");

      /*
       * IMPORTANT:
       *
       * Do NOT send:
       *
       * district_id: ""
       *
       * because FastAPI interprets district_id
       * as an integer.
       *
       * The API helper below also performs this
       * validation, but we keep the frontend clean
       * as well.
       */

      const params = {};

      const numericDistrict =
        Number(districtFilter);

      if (
        districtFilter !== "" &&
        Number.isInteger(
          numericDistrict
        ) &&
        numericDistrict > 0
      ) {
        params.district_id =
          numericDistrict;
      }

      if (
        statusFilter &&
        statusFilter !== "All"
      ) {
        params.status =
          statusFilter;
      }

      const cleanSearch =
        search.trim();

      if (cleanSearch) {
        params.search =
          cleanSearch;
      }

      const response =
        await api.getMedicalSupervisors(
          params
        );

      const rows = Array.isArray(
        response
      )
        ? response
        : response?.data || [];

      setSupervisors(rows);

      setSelectedIds((current) =>
        current.filter((id) =>
          rows.some(
            (row) =>
              Number(row.id) ===
              Number(id)
          )
        )
      );

      if (keepSelected) {
        setSelected((current) => {
          if (!current) {
            return rows[0] || null;
          }

          const next =
            rows.find(
              (row) =>
                Number(row.id) ===
                Number(current.id)
            );

          return (
            next ||
            rows[0] ||
            null
          );
        });
      } else {
        setSelected(
          rows[0] || null
        );
      }
    } catch (err) {
      console.error(
        "Supervisor list error:",
        err
      );

      setError(
        err?.message ||
          "Unable to load medical supervisors."
      );

      setSupervisors([]);

      setSelected(null);

      setDetails(null);
    } finally {
      setLoading(false);
    }
  };


  // ==========================================================
  // LOAD DETAILS
  // ==========================================================

  const loadDetails = async (
    supervisor
  ) => {
    if (!supervisor?.id) {
      setDetails(null);
      return;
    }

    try {
      setDetailLoading(true);

      const response =
        await api.getMedicalSupervisorDetails(
          supervisor.id
        );

      setDetails(
        response?.data ||
          response ||
          null
      );
    } catch (err) {
      console.error(
        "Supervisor detail error:",
        err
      );

      setDetails(null);

      /*
       * Do not destroy the whole page if the
       * optional details endpoint is unavailable.
       */
    } finally {
      setDetailLoading(false);
    }
  };


  // ==========================================================
  // INITIAL LOAD
  // ==========================================================

  useEffect(() => {
    loadDistricts();
  }, []);


  // ==========================================================
  // SUPERVISOR FILTER LOAD
  // ==========================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      loadSupervisors(false);
    }, 250);

    return () => {
      clearTimeout(timer);
    };
  }, [
    search,
    districtFilter,
    statusFilter,
  ]);


  // ==========================================================
  // SELECTED SUPERVISOR
  // ==========================================================

  useEffect(() => {
    if (selected?.id) {
      loadDetails(selected);
    } else {
      setDetails(null);
    }
  }, [selected?.id]);


  // ==========================================================
  // AUTO HIDE NOTICE
  // ==========================================================

  useEffect(() => {
    if (!notice) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setNotice("");
    }, 3500);

    return () => {
      clearTimeout(timer);
    };
  }, [notice]);


  // ==========================================================
  // STATISTICS
  // ==========================================================

  const stats = useMemo(() => {
    const total =
      supervisors.length;

    const active =
      supervisors.filter(
        (item) =>
          Boolean(item?.is_active)
      ).length;

    const districtsCovered =
      new Set(
        supervisors
          .map(
            (item) =>
              item?.district_id
          )
          .filter(Boolean)
      ).size;

    const pending =
      supervisors.reduce(
        (sum, item) =>
          sum +
          getPendingActions(item),
        0
      );

    return {
      total,
      active,
      districtsCovered,
      pending,
    };
  }, [supervisors]);


  // ==========================================================
  // FILTER ACTIONS
  // ==========================================================

  const clearFilters = () => {
    setSearch("");

    setDistrictFilter("");

    setStatusFilter("");
  };


  // ==========================================================
  // SELECT ALL
  // ==========================================================

  const allSelected =
    supervisors.length > 0 &&
    supervisors.every(
      (supervisor) =>
        selectedIds.includes(
          supervisor.id
        )
    );


  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(
      supervisors.map(
        (supervisor) =>
          supervisor.id
      )
    );
  };


  const toggleSelected = (id) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter(
            (item) => item !== id
          )
        : [...current, id]
    );
  };


  // ==========================================================
  // ADD SUPERVISOR
  // ==========================================================

  const openAdd = () => {
    setEditing(null);

    setForm({
      ...EMPTY_FORM,
    });

    setError("");

    setMenuId(null);

    setShowAdd(true);
  };


  // ==========================================================
  // EDIT SUPERVISOR
  // ==========================================================

  const openEdit = (
    supervisor
  ) => {
    setEditing(supervisor);

    setForm({
      username:
        supervisor?.username || "",

      password: "",

      full_name:
        supervisor?.full_name || "",

      district_id:
        supervisor?.district_id
          ? String(
              supervisor.district_id
            )
          : "",
    });

    setError("");

    setMenuId(null);

    setShowAdd(true);
  };


  // ==========================================================
  // SAVE SUPERVISOR
  // ==========================================================

  const submitForm = async (
    event
  ) => {
    event.preventDefault();

    setError("");

    const fullName =
      form.full_name.trim();

    const username =
      form.username.trim();

    const districtId =
      Number(form.district_id);

    if (!fullName) {
      setError(
        "Full name is required."
      );
      return;
    }

    if (!username) {
      setError(
        "Username or email is required."
      );
      return;
    }

    if (
      !Number.isInteger(
        districtId
      ) ||
      districtId <= 0
    ) {
      setError(
        "Please select a valid district."
      );
      return;
    }

    if (
      !editing &&
      form.password.length < 6
    ) {
      setError(
        "Password must contain at least 6 characters."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        username,

        full_name: fullName,

        district_id: districtId,
      };

      if (!editing) {
        payload.password =
          form.password;
      } else if (
        form.password.trim()
      ) {
        payload.password =
          form.password.trim();
      }

      if (editing) {
        await api.updateMedicalSupervisor(
          editing.id,
          payload
        );

        setNotice(
          "Medical supervisor updated successfully."
        );
      } else {
        await api.createMedicalSupervisor(
          payload
        );

        setNotice(
          "Medical supervisor added successfully."
        );
      }

      setShowAdd(false);

      setForm({
        ...EMPTY_FORM,
      });

      await loadSupervisors();
    } catch (err) {
      console.error(
        "Save supervisor error:",
        err
      );

      setError(
        err?.message ||
          "Unable to save the medical supervisor."
      );
    } finally {
      setSaving(false);
    }
  };


  // ==========================================================
  // STATUS
  // ==========================================================

  const changeStatus = async (
    supervisor,
    active
  ) => {
    if (!supervisor?.id) {
      return;
    }

    try {
      setMenuId(null);

      setError("");

      await api.updateMedicalSupervisorStatus(
        supervisor.id,
        active
      );

      setNotice(
        `Supervisor ${
          active
            ? "activated"
            : "deactivated"
        } successfully.`
      );

      await loadSupervisors();
    } catch (err) {
      console.error(
        "Status error:",
        err
      );

      setError(
        err?.message ||
          "Unable to update supervisor status."
      );
    }
  };


  // ==========================================================
  // DELETE
  // ==========================================================

  const deleteSupervisor = async (
    supervisor
  ) => {
    if (!supervisor?.id) {
      return;
    }

    const confirmed =
      window.confirm(
        `Delete ${supervisor.full_name || "this supervisor"}?\n\nHistorical supervisors should normally be deactivated instead.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setMenuId(null);

      setError("");

      await api.deleteMedicalSupervisor(
        supervisor.id
      );

      setNotice(
        "Medical supervisor deleted successfully."
      );

      await loadSupervisors(false);
    } catch (err) {
      console.error(
        "Delete supervisor error:",
        err
      );

      setError(
        err?.message ||
          "Unable to delete the supervisor."
      );
    }
  };


  // ==========================================================
  // CSV EXPORT
  // ==========================================================

  const exportCsv = () => {
    const rows =
      supervisors.map(
        (supervisor) => [
          supervisor.full_name ||
            "",

          supervisor.username ||
            "",

          getDistrictName(
            supervisor
          ),

          getTalukCount(
            supervisor
          ),

          getAgentCount(
            supervisor
          ),

          getReportsThisWeek(
            supervisor
          ),

          supervisor.is_active
            ? "Active"
            : "Inactive",

          formatDateTime(
            supervisor.last_active
          ),
        ]
      );

    const header = [
      "Supervisor",
      "Username",
      "Assigned District",
      "Taluks Managed",
      "Supervising Agents",
      "Reports This Week",
      "Status",
      "Last Active",
    ];

    const csv = [
      header,
      ...rows,
    ]
      .map((row) =>
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
      "medical-supervisors.csv";

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

    setNotice(
      "Supervisor directory exported."
    );
  };


  // ==========================================================
  // DETAIL DATA
  // ==========================================================

  const selectedDetails =
    details || selected;

  const selectedDistrict =
    getDistrictName(
      selectedDetails
    );

  const selectedTaluks =
    details?.taluks ||
    details?.assigned_taluks ||
    selectedDetails?.taluks ||
    [];

  const agentsResponsible =
    getAgentCount(
      selectedDetails
    );

  const assignedAreas =
    getTalukCount(
      selectedDetails
    );

  const reportsThisWeek =
    getReportsThisWeek(
      selectedDetails
    );

  const compliance =
    safeNumber(
      details?.compliance ??
        selectedDetails?.compliance ??
        100
    );


  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <section className="relative w-full text-[#10243A]">

      {/* =====================================================
          HERO
      ====================================================== */}

      <div className="relative overflow-hidden rounded-[12px] border border-[#E4E9E6] bg-white min-h-[150px]">

        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-[#EEF8F1]" />

        <div className="relative z-10 px-[22px] py-[21px]">

          <div className="max-w-[540px]">

            <h1 className="text-[26px] leading-[1.15] font-semibold tracking-[-0.035em] text-[#0B1730]">
              Medical Supervisor Management
            </h1>

            <p className="mt-[8px] text-[12px] leading-[1.65] text-[#52606D]">
              Medical supervisors are responsible for all taluks within their assigned district and oversee reporting, agents, and data quality.
            </p>

          </div>

        </div>

        <img
          src={supervisorHero}
          alt="Medical supervisor"
          className="absolute right-[175px] bottom-0 h-[145px] w-auto object-contain pointer-events-none select-none"
        />

        <div className="absolute right-[18px] top-[18px] w-[205px] rounded-[12px] border border-[#DCE9E0] bg-white/95 px-[15px] py-[14px] shadow-[0_4px_16px_rgba(31,49,68,.05)]">

          <div className="flex items-start gap-[10px]">

            <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[#EAF7EE] text-[#087A32]">
              <ShieldCheck
                size={19}
                strokeWidth={1.8}
              />
            </div>

            <div>

              <p className="text-[11px] font-semibold text-[#172B43]">
                One Supervisor
              </p>

              <p className="mt-[1px] text-[11px] font-semibold text-[#172B43]">
                One District
              </p>

            </div>

          </div>

          <p className="mt-[10px] text-[9px] leading-[1.5] text-[#52606D]">
            Each medical supervisor is responsible for all taluks within their assigned district.
          </p>

        </div>

      </div>


      {/* =====================================================
          NOTICES
      ====================================================== */}

      {(error || notice) && (
        <div className="mt-[9px]">

          {error && (
            <div className="flex items-start gap-[8px] rounded-[7px] border border-[#F4CACA] bg-[#FFF5F5] px-[12px] py-[8px] text-[10px] text-[#C62828]">
              <AlertTriangle
                size={14}
                className="mt-[1px] shrink-0"
              />
              <span>
                {error}
              </span>
            </div>
          )}

          {!error && notice && (
            <div className="flex items-center gap-[8px] rounded-[7px] border border-[#CDEAD6] bg-[#F3FBF5] px-[12px] py-[8px] text-[10px] text-[#087A32]">
              <CheckCircle2
                size={14}
              />
              <span>
                {notice}
              </span>
            </div>
          )}

        </div>
      )}


      {/* =====================================================
          STAT CARDS
      ====================================================== */}

      <div className="mt-[10px] grid grid-cols-4 gap-[10px]">

        <StatCard
          icon={UsersRound}
          label="TOTAL SUPERVISORS"
          value={stats.total}
          note="All registered supervisors"
        />

        <StatCard
          icon={UserCheck}
          label="ACTIVE SUPERVISORS"
          value={stats.active}
          note="Currently operational"
        />

        <StatCard
          icon={MapPin}
          label="DISTRICTS COVERED"
          value={stats.districtsCovered}
          note="Across assigned supervisors"
        />

        <StatCard
          icon={AlertTriangle}
          label="PENDING ACTIONS"
          value={stats.pending}
          note="Require your attention"
          amber
        />

      </div>


      {/* =====================================================
          MAIN DIRECTORY + DETAILS
      ====================================================== */}

      <div className="mt-[10px] grid grid-cols-[minmax(0,1fr)_335px] gap-[10px]">

        {/* ===================================================
            DIRECTORY
        ==================================================== */}

        <div className="min-w-0 rounded-[11px] border border-[#E3E8E5] bg-white overflow-hidden">

          {/* HEADER */}

          <div className="px-[14px] pt-[12px] pb-[9px] border-b border-[#E7ECE9]">

            <div className="flex items-center justify-between gap-3">

              <div>

                <h2 className="text-[10px] font-bold tracking-[0.02em] text-[#172B43]">
                  SUPERVISORS
                </h2>

                <p className="mt-[3px] text-[9px] text-[#7B8794]">
                  District supervisors and their current oversight activity.
                </p>

              </div>

              <div className="flex items-center gap-[7px]">

                <button
                  type="button"
                  onClick={openAdd}
                  className="inline-flex h-[31px] items-center gap-[6px] rounded-[6px] bg-[#07843D] px-[12px] text-[10px] font-semibold text-white hover:bg-[#066F35]"
                >
                  <Plus size={13} />
                  Add Supervisor
                </button>

                <button
                  type="button"
                  onClick={exportCsv}
                  className="inline-flex h-[31px] items-center gap-[6px] rounded-[6px] border border-[#D8E1DC] bg-white px-[11px] text-[10px] font-medium text-[#34495A] hover:bg-[#F7FAF8]"
                >
                  <Download size={13} />
                  Export
                </button>

              </div>

            </div>


            {/* FILTERS */}

            <div className="mt-[10px] flex items-center gap-[7px]">

              <div className="relative flex-1">

                <Search
                  size={14}
                  className="absolute left-[10px] top-1/2 -translate-y-1/2 text-[#68737D]"
                />

                <input
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value
                    )
                  }
                  placeholder="Search supervisors..."
                  className="h-[36px] w-full rounded-[6px] border border-[#DCE4DF] bg-white pl-[31px] pr-[10px] text-[10px] text-[#172B43] outline-none placeholder:text-[#8B959D] focus:border-[#6CB98A]"
                />

              </div>


              <div className="relative w-[138px]">

                <select
                  value={districtFilter}
                  onChange={(event) =>
                    setDistrictFilter(
                      event.target.value
                    )
                  }
                  className="h-[36px] w-full appearance-none rounded-[6px] border border-[#DCE4DF] bg-white px-[10px] pr-[27px] text-[10px] text-[#172B43] outline-none focus:border-[#6CB98A]"
                >
                  <option value="">
                    All Districts
                  </option>

                  {districts.map(
                    (district) => (
                      <option
                        key={district.id}
                        value={district.id}
                      >
                        {district.name}
                      </option>
                    )
                  )}

                </select>

                <ChevronDown
                  size={13}
                  className="pointer-events-none absolute right-[9px] top-1/2 -translate-y-1/2 text-[#52606D]"
                />

              </div>


              <div className="relative w-[112px]">

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value
                    )
                  }
                  className="h-[36px] w-full appearance-none rounded-[6px] border border-[#DCE4DF] bg-white px-[10px] pr-[27px] text-[10px] text-[#172B43] outline-none focus:border-[#6CB98A]"
                >
                  <option value="">
                    All Status
                  </option>

                  <option value="Active">
                    Active
                  </option>

                  <option value="Inactive">
                    Inactive
                  </option>

                </select>

                <ChevronDown
                  size={13}
                  className="pointer-events-none absolute right-[9px] top-1/2 -translate-y-1/2 text-[#52606D]"
                />

              </div>


              {(search ||
                districtFilter ||
                statusFilter) && (
                <button
                  type="button"
                  onClick={
                    clearFilters
                  }
                  className="h-[36px] whitespace-nowrap px-[4px] text-[10px] font-medium text-[#087A32] hover:underline"
                >
                  Clear Filters
                </button>
              )}

            </div>

          </div>


          {/* TABLE */}

          <div className="overflow-x-auto">

            <table className="w-full min-w-[790px] border-collapse">

              <thead>

                <tr className="border-b border-[#E7ECE9] bg-[#FCFDFC]">

                  <th className="w-[38px] px-[9px] py-[8px] text-left">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      className="accent-[#07843D]"
                    />
                  </th>

                  <th className="px-[7px] py-[8px] text-left text-[8px] font-bold text-[#52606D]">
                    SUPERVISOR
                  </th>

                  <th className="px-[7px] py-[8px] text-left text-[8px] font-bold text-[#52606D]">
                    ASSIGNED DISTRICT
                  </th>

                  <th className="px-[7px] py-[8px] text-left text-[8px] font-bold text-[#52606D]">
                    TALUKS MANAGED
                  </th>

                  <th className="px-[7px] py-[8px] text-left text-[8px] font-bold text-[#52606D]">
                    SUPERVISING AGENTS
                  </th>

                  <th className="px-[7px] py-[8px] text-left text-[8px] font-bold text-[#52606D]">
                    REPORTS THIS WEEK
                  </th>

                  <th className="px-[7px] py-[8px] text-left text-[8px] font-bold text-[#52606D]">
                    STATUS
                  </th>

                  <th className="px-[7px] py-[8px] text-left text-[8px] font-bold text-[#52606D]">
                    LAST ACTIVE
                  </th>

                  <th className="w-[42px]" />

                </tr>

              </thead>


              <tbody>

                {loading ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="h-[250px] text-center"
                    >
                      <div className="flex flex-col items-center justify-center">

                        <div className="h-[28px] w-[28px] animate-spin rounded-full border-[2px] border-[#DCEBE1] border-t-[#07843D]" />

                        <p className="mt-[10px] text-[10px] text-[#68737D]">
                          Loading medical supervisors...
                        </p>

                      </div>
                    </td>
                  </tr>
                ) : supervisors.length === 0 ? (
                  <tr>
                    <td
                      colSpan="9"
                      className="h-[250px] text-center"
                    >
                      <div className="flex flex-col items-center justify-center">

                        <div className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-[#F0F6F2] text-[#AABBB1]">
                          <UsersRound
                            size={24}
                          />
                        </div>

                        <p className="mt-[11px] text-[11px] font-medium text-[#52606D]">
                          No medical supervisors found.
                        </p>

                        <p className="mt-[4px] text-[9px] text-[#8A959D]">
                          Try changing the filters or add a new supervisor.
                        </p>

                      </div>
                    </td>
                  </tr>
                ) : (
                  supervisors.map(
                    (supervisor) => {
                      const active =
                        Boolean(
                          supervisor.is_active
                        );

                      const isSelected =
                        Number(
                          selected?.id
                        ) ===
                        Number(
                          supervisor.id
                        );

                      return (
                        <tr
                          key={
                            supervisor.id
                          }
                          onClick={() =>
                            setSelected(
                              supervisor
                            )
                          }
                          className={`group cursor-pointer border-b border-[#EDF0EE] transition ${
                            isSelected
                              ? "bg-[#F5FBF7]"
                              : "bg-white hover:bg-[#FAFCFA]"
                          }`}
                        >

                          <td
                            className="px-[9px] py-[9px]"
                            onClick={(event) =>
                              event.stopPropagation()
                            }
                          >
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(
                                supervisor.id
                              )}
                              onChange={() =>
                                toggleSelected(
                                  supervisor.id
                                )
                              }
                              className="accent-[#07843D]"
                            />
                          </td>


                          <td className="px-[7px] py-[9px]">

                            <div className="flex items-center gap-[8px]">

                              <div className="flex h-[31px] w-[31px] shrink-0 items-center justify-center rounded-full bg-[#E8F5EC] text-[10px] font-semibold text-[#087A32]">
                                {getInitials(
                                  supervisor.full_name
                                )}
                              </div>

                              <div className="min-w-0">

                                <p className="truncate text-[10px] font-semibold text-[#172B43]">
                                  {supervisor.full_name ||
                                    "Medical Supervisor"}
                                </p>

                                <p className="mt-[2px] truncate text-[8px] text-[#7B8794]">
                                  {supervisor.username ||
                                    "—"}
                                </p>

                              </div>

                            </div>

                          </td>


                          <td className="px-[7px] py-[9px]">

                            <p className="text-[9px] font-semibold text-[#172B43]">
                              {getDistrictName(
                                supervisor
                              )}
                            </p>

                            <p className="mt-[2px] text-[8px] text-[#7B8794]">
                              District
                            </p>

                          </td>


                          <td className="px-[7px] py-[9px]">

                            <p className="text-[9px] font-semibold text-[#172B43]">
                              {getTalukCount(
                                supervisor
                              )}
                            </p>

                            <p className="mt-[2px] text-[8px] text-[#7B8794]">
                              Taluks
                            </p>

                          </td>


                          <td className="px-[7px] py-[9px]">

                            <p className="text-[9px] font-semibold text-[#172B43]">
                              {getAgentCount(
                                supervisor
                              )}
                            </p>

                            <p className="mt-[2px] text-[8px] text-[#7B8794]">
                              Agents
                            </p>

                          </td>


                          <td className="px-[7px] py-[9px]">

                            <p className="text-[9px] font-semibold text-[#172B43]">
                              {getReportsThisWeek(
                                supervisor
                              )}
                            </p>

                            <p className="mt-[2px] text-[8px] text-[#7B8794]">
                              Reports
                            </p>

                          </td>


                          <td className="px-[7px] py-[9px]">

                            <span
                              className={`inline-flex items-center rounded-[5px] border px-[7px] py-[3px] text-[8px] font-semibold ${statusClasses(
                                active
                              )}`}
                            >
                              {active
                                ? "Active"
                                : "Inactive"}
                            </span>

                          </td>


                          <td className="px-[7px] py-[9px]">

                            <p className="text-[9px] text-[#34495A]">
                              {formatShortTime(
                                supervisor.last_active
                              )}
                            </p>

                          </td>


                          <td
                            className="relative px-[5px] py-[9px]"
                            onClick={(event) =>
                              event.stopPropagation()
                            }
                          >

                            <button
                              type="button"
                              onClick={() =>
                                setMenuId(
                                  menuId ===
                                    supervisor.id
                                    ? null
                                    : supervisor.id
                                )
                              }
                              className="flex h-[28px] w-[28px] items-center justify-center rounded-[5px] text-[#52606D] hover:bg-[#EFF5F1]"
                            >
                              <MoreHorizontal
                                size={15}
                              />
                            </button>

                            {menuId ===
                              supervisor.id && (
                              <ActionMenu
                                supervisor={
                                  supervisor
                                }
                                onEdit={
                                  openEdit
                                }
                                onView={() => {
                                  setSelected(
                                    supervisor
                                  );
                                  setMenuId(
                                    null
                                  );
                                }}
                                onStatus={
                                  changeStatus
                                }
                                onDelete={
                                  deleteSupervisor
                                }
                              />
                            )}

                          </td>

                        </tr>
                      );
                    }
                  )
                )}

              </tbody>

            </table>

          </div>


          {/* FOOTER */}

          <div className="flex items-center justify-between border-t border-[#E7ECE9] px-[14px] py-[10px]">

            <span className="text-[9px] text-[#68737D]">
              Showing 1 to{" "}
              {supervisors.length}{" "}
              of{" "}
              {supervisors.length}{" "}
              supervisors
            </span>

            <div className="flex items-center gap-[4px]">

              <button
                type="button"
                disabled
                className="flex h-[25px] w-[25px] items-center justify-center rounded-[5px] border border-[#E3E8E5] text-[#BCC6C0] disabled:cursor-not-allowed"
              >
                <ChevronLeft
                  size={13}
                />
              </button>

              <span className="flex h-[25px] w-[25px] items-center justify-center rounded-[5px] bg-[#07843D] text-[9px] font-semibold text-white">
                1
              </span>

              <button
                type="button"
                disabled
                className="flex h-[25px] w-[25px] items-center justify-center rounded-[5px] border border-[#E3E8E5] text-[#BCC6C0] disabled:cursor-not-allowed"
              >
                <ChevronRight
                  size={13}
                />
              </button>

            </div>

          </div>

        </div>


        {/* ===================================================
            DETAILS
        ==================================================== */}

        <aside className="rounded-[11px] border border-[#E3E8E5] bg-white overflow-hidden">

          <div className="flex items-center justify-between border-b border-[#E7ECE9] px-[14px] py-[11px]">

            <div>

              <h2 className="text-[10px] font-bold text-[#172B43]">
                SUPERVISOR DETAILS
              </h2>

              <p className="mt-[3px] text-[8px] text-[#7B8794]">
                Current profile and district oversight.
              </p>

            </div>

            {selected && (
              <button
                type="button"
                onClick={() =>
                  openEdit(
                    selected
                  )
                }
                className="text-[9px] font-semibold text-[#087A32] hover:underline"
              >
                View Full Profile →
              </button>
            )}

          </div>


          {!selected ? (
            <div className="flex min-h-[500px] flex-col items-center justify-center px-[20px] text-center">

              <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#EEF7F1] text-[#8FA99A]">
                <UserRound
                  size={26}
                />
              </div>

              <p className="mt-[12px] text-[10px] font-medium text-[#52606D]">
                Select a supervisor
              </p>

              <p className="mt-[5px] max-w-[200px] text-[8px] leading-[1.5] text-[#8A959D]">
                Click a supervisor from the directory to view their district, taluks, agents and activity.
              </p>

            </div>
          ) : (
            <div className="px-[14px]">

              {/* PROFILE */}

              <div className="flex items-center justify-between py-[13px] border-b border-[#E7ECE9]">

                <div className="flex items-center gap-[9px]">

                  <div className="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-[#E8F5EC] text-[12px] font-semibold text-[#087A32]">
                    {getInitials(
                      selected.full_name
                    )}
                  </div>

                  <div>

                    <p className="text-[12px] font-semibold text-[#172B43]">
                      {selected.full_name}
                    </p>

                    <p className="mt-[2px] text-[9px] text-[#52606D]">
                      Medical Supervisor
                    </p>

                  </div>

                </div>

                <span
                  className={`rounded-[5px] border px-[7px] py-[4px] text-[8px] font-semibold ${statusClasses(
                    selected.is_active
                  )}`}
                >
                  {selected.is_active
                    ? "Active"
                    : "Inactive"}
                </span>

              </div>


              {/* BASIC DETAILS */}

              <DetailSection title="CONTACT & ASSIGNMENT">

                <DetailRow
                  icon={Mail}
                  label="Email"
                  value={
                    details?.email ||
                    selected.username ||
                    "—"
                  }
                />

                <DetailRow
                  icon={Phone}
                  label="Phone"
                  value={
                    details?.phone ||
                    selected.phone ||
                    "—"
                  }
                />

                <DetailRow
                  icon={MapPin}
                  label="Assigned District"
                  value={
                    selectedDistrict
                  }
                />

                <DetailRow
                  icon={MapPin}
                  label="Taluks Managed"
                  value={
                    details?.taluks_managed_text ||
                    selected?.taluks_managed_text ||
                    `${assignedAreas} Taluks`
                  }
                />

              </DetailSection>


              {/* PERFORMANCE */}

              <DetailSection
                title="SUPERVISION ACTIVITY"
              >

                <div className="grid grid-cols-3 divide-x divide-[#E5EAE7] rounded-[7px] border border-[#E5EAE7] bg-[#FCFDFC]">

                  <MiniMetric
                    icon={MapPin}
                    value={
                      assignedAreas
                    }
                    label="Taluks"
                  />

                  <MiniMetric
                    icon={UsersRound}
                    value={
                      agentsResponsible
                    }
                    label="Agents"
                  />

                  <MiniMetric
                    icon={ClipboardList}
                    value={
                      reportsThisWeek
                    }
                    label="Reports"
                  />

                </div>


                <div className="mt-[10px] rounded-[7px] border border-[#E5EAE7] bg-white p-[10px]">

                  <div className="flex items-center justify-between">

                    <span className="text-[9px] text-[#52606D]">
                      Weekly compliance
                    </span>

                    <span className="text-[10px] font-semibold text-[#087A32]">
                      {compliance}%
                    </span>

                  </div>

                  <div className="mt-[6px] h-[6px] overflow-hidden rounded-full bg-[#E9EFEB]">

                    <div
                      className="h-full rounded-full bg-[#07843D]"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            0,
                            compliance
                          )
                        )}%`,
                      }}
                    />

                  </div>

                </div>

              </DetailSection>


              {/* TALUKS */}

              <DetailSection
                title="DISTRICT COVERAGE"
                right={
                  <button
                    type="button"
                    onClick={() =>
                      setShowAssignments(
                        true
                      )
                    }
                    className="text-[9px] font-semibold text-[#087A32]"
                  >
                    View All →
                  </button>
                }
              >

                {Array.isArray(
                  selectedTaluks
                ) &&
                selectedTaluks.length >
                  0 ? (
                  <div className="space-y-[6px]">

                    {selectedTaluks
                      .slice(0, 4)
                      .map(
                        (taluk, index) => (
                          <div
                            key={
                              taluk?.id ??
                              index
                            }
                            className="flex items-center justify-between rounded-[6px] bg-[#F6FAF7] px-[9px] py-[7px]"
                          >
                            <span className="text-[9px] font-medium text-[#34495A]">
                              {taluk?.name ||
                                taluk?.taluk_name ||
                                `Taluk ${
                                  index + 1
                                }`}
                            </span>

                            <CheckCircle2
                              size={12}
                              className="text-[#07843D]"
                            />
                          </div>
                        )
                      )}

                  </div>
                ) : (
                  <div className="rounded-[7px] bg-[#F6FAF7] px-[10px] py-[9px] text-[9px] text-[#52606D]">
                    {assignedAreas > 0
                      ? `${assignedAreas} taluks are assigned within ${selectedDistrict}.`
                      : `All taluks within ${selectedDistrict} are supervised.`}
                  </div>
                )}

              </DetailSection>


              {/* RECENT ACTIVITY */}

              <DetailSection
                title="RECENT ACTIVITY"
              >

                {detailLoading ? (
                  <div className="py-[15px] text-center text-[9px] text-[#7B8794]">
                    Loading activity...
                  </div>
                ) : details?.recent_activity?.length ? (
                  <div className="space-y-[8px]">

                    {details.recent_activity
                      .slice(0, 4)
                      .map(
                        (
                          item,
                          index
                        ) => (
                          <div
                            key={
                              item?.id ??
                              index
                            }
                            className="flex items-start gap-[7px]"
                          >

                            <div className="mt-[1px] flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full bg-[#EEF8F1] text-[#087A32]">
                              <Activity
                                size={11}
                              />
                            </div>

                            <div className="min-w-0 flex-1">

                              <p className="truncate text-[9px] text-[#34495A]">
                                {item?.description ||
                                  item?.action ||
                                  "Supervisor activity"}
                              </p>

                              <p className="mt-[2px] text-[8px] text-[#8A959D]">
                                {formatShortTime(
                                  item?.created_at
                                )}
                              </p>

                            </div>

                          </div>
                        )
                      )}

                  </div>
                ) : (
                  <p className="py-[6px] text-[9px] text-[#8A959D]">
                    No recent activity recorded.
                  </p>
                )}

              </DetailSection>


              {/* ACTIONS */}

              <div className="space-y-[7px] py-[13px]">

                <button
                  type="button"
                  onClick={() =>
                    openEdit(
                      selected
                    )
                  }
                  className="w-full h-[32px] rounded-[6px] border border-[#9DD3B0] text-[9px] font-semibold text-[#087A32] hover:bg-[#F4FBF6]"
                >
                  Edit Supervisor
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setShowAssignments(
                      true
                    )
                  }
                  className="w-full h-[32px] rounded-[6px] border border-[#9DD3B0] text-[9px] font-semibold text-[#087A32] hover:bg-[#F4FBF6]"
                >
                  View Assignments
                </button>

                <button
                  type="button"
                  onClick={() =>
                    changeStatus(
                      selected,
                      !selected.is_active
                    )
                  }
                  className="w-full h-[32px] rounded-[6px] border border-[#F0BABA] text-[9px] font-semibold text-[#C62828] hover:bg-[#FFF7F7]"
                >
                  {selected.is_active
                    ? "Deactivate Supervisor"
                    : "Activate Supervisor"}
                </button>

              </div>

            </div>
          )}

        </aside>

      </div>


      {/* =====================================================
          ADD / EDIT MODAL
      ====================================================== */}

      {showAdd && (
        <SupervisorModal
          form={form}
          setForm={setForm}
          districts={districts}
          editing={editing}
          saving={saving}
          error={error}
          onClose={() => {
            if (!saving) {
              setShowAdd(false);
              setError("");
            }
          }}
          onSubmit={submitForm}
        />
      )}


      {/* =====================================================
          ASSIGNMENT MODAL
      ====================================================== */}

      {showAssignments &&
        selected && (
          <AssignmentModal
            supervisor={
              details ||
              selected
            }
            onClose={() =>
              setShowAssignments(
                false
              )
            }
          />
        )}

    </section>
  );
}


// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  icon: Icon,
  label,
  value,
  note,
  amber = false,
}) {
  return (
    <div className="rounded-[10px] border border-[#E5EAE7] bg-white px-[14px] py-[13px] shadow-[0_2px_6px_rgba(31,49,68,.025)]">

      <div className="flex items-center gap-[10px]">

        <div
          className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full ${
            amber
              ? "bg-[#FFF5E8] text-[#E98708]"
              : "bg-[#EAF7EE] text-[#087A32]"
          }`}
        >
          <Icon
            size={21}
            strokeWidth={1.8}
          />
        </div>

        <div>

          <p className="text-[8px] font-semibold text-[#52606D]">
            {label}
          </p>

          <p className="mt-[3px] text-[20px] leading-none font-semibold text-[#172B43]">
            {value}
          </p>

        </div>

      </div>

      <p className="mt-[9px] text-[8px] text-[#7B8794]">
        {note}
      </p>

    </div>
  );
}


// ============================================================
// DETAIL SECTION
// ============================================================

function DetailSection({
  title,
  right,
  children,
}) {
  return (
    <section className="border-b border-[#E7ECE9] py-[12px]">

      <div className="mb-[9px] flex items-center justify-between">

        <h3 className="text-[9px] font-bold text-[#172B43]">
          {title}
        </h3>

        {right}

      </div>

      {children}

    </section>
  );
}


// ============================================================
// DETAIL ROW
// ============================================================

function DetailRow({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="flex items-start gap-[8px] py-[4px]">

      {Icon && (
        <Icon
          size={12}
          className="mt-[1px] shrink-0 text-[#087A32]"
        />
      )}

      <span className="w-[90px] shrink-0 text-[8px] text-[#68737D]">
        {label}
      </span>

      <span className="min-w-0 flex-1 break-words text-right text-[8px] font-medium text-[#172B43]">
        {value}
      </span>

    </div>
  );
}


// ============================================================
// MINI METRIC
// ============================================================

function MiniMetric({
  icon: Icon,
  value,
  label,
}) {
  return (
    <div className="px-[5px] py-[9px] text-center">

      <Icon
        size={13}
        className="mx-auto text-[#087A32]"
      />

      <p className="mt-[4px] text-[12px] font-semibold text-[#172B43]">
        {value}
      </p>

      <p className="mt-[2px] text-[7px] leading-[1.2] text-[#52606D]">
        {label}
      </p>

    </div>
  );
}


// ============================================================
// ACTION MENU
// ============================================================

function ActionMenu({
  supervisor,
  onEdit,
  onView,
  onStatus,
  onDelete,
}) {
  return (
    <div className="absolute right-[32px] top-[31px] z-[40] w-[155px] rounded-[8px] border border-[#DCE4DF] bg-white p-[5px] shadow-[0_10px_30px_rgba(31,49,68,.14)]">

      <MenuButton
        icon={Eye}
        label="View details"
        onClick={onView}
      />

      <MenuButton
        icon={Edit3}
        label="Edit supervisor"
        onClick={() =>
          onEdit(supervisor)
        }
      />

      <MenuButton
        icon={UserCheck}
        label={
          supervisor.is_active
            ? "Deactivate"
            : "Activate"
        }
        onClick={() =>
          onStatus(
            supervisor,
            !supervisor.is_active
          )
        }
      />

      <MenuButton
        icon={X}
        label="Delete"
        danger
        onClick={() =>
          onDelete(
            supervisor
          )
        }
      />

    </div>
  );
}


// ============================================================
// MENU BUTTON
// ============================================================

function MenuButton({
  icon: Icon,
  label,
  onClick,
  danger = false,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-[8px] rounded-[5px] px-[8px] py-[7px] text-left text-[9px] ${
        danger
          ? "text-[#C62828] hover:bg-[#FFF5F5]"
          : "text-[#34495A] hover:bg-[#F4F8F5]"
      }`}
    >
      <Icon size={13} />
      {label}
    </button>
  );
}


// ============================================================
// SUPERVISOR MODAL
// ============================================================

function SupervisorModal({
  form,
  setForm,
  districts,
  editing,
  saving,
  error,
  onClose,
  onSubmit,
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#10243A]/30 p-5 backdrop-blur-[1px]">

      <div className="w-full max-w-[490px] overflow-hidden rounded-[12px] border border-[#E1E8E3] bg-white shadow-[0_20px_60px_rgba(16,36,58,.2)]">

        <div className="flex items-center justify-between border-b border-[#E7ECE9] px-[20px] py-[15px]">

          <div>

            <h2 className="text-[15px] font-semibold text-[#172B43]">
              {editing
                ? "Edit Medical Supervisor"
                : "Add Medical Supervisor"}
            </h2>

            <p className="mt-[3px] text-[9px] text-[#7B8794]">
              {editing
                ? "Update account and district assignment."
                : "Create a supervisor account and assign a district."}
            </p>

          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex h-[28px] w-[28px] items-center justify-center rounded-[5px] text-[#52606D] hover:bg-[#F3F6F4]"
          >
            <X size={16} />
          </button>

        </div>


        <form
          onSubmit={onSubmit}
          className="space-y-[12px] p-[20px]"
        >

          {error && (
            <div className="rounded-[6px] border border-[#F1C5C5] bg-[#FFF6F6] px-[10px] py-[8px] text-[9px] text-[#C62828]">
              {error}
            </div>
          )}


          <Field label="Full Name">

            <input
              required
              value={
                form.full_name
              }
              onChange={(event) =>
                setForm({
                  ...form,
                  full_name:
                    event.target
                      .value,
                })
              }
              placeholder="Dr. Ramesh K."
            />

          </Field>


          <Field label="Username / Email">

            <input
              required
              value={
                form.username
              }
              onChange={(event) =>
                setForm({
                  ...form,
                  username:
                    event.target
                      .value,
                })
              }
              placeholder="medical_supervisor"
            />

          </Field>


          <Field
            label={
              editing
                ? "New Password (optional)"
                : "Password"
            }
          >

            <input
              required={!editing}
              minLength={6}
              type="password"
              value={
                form.password
              }
              onChange={(event) =>
                setForm({
                  ...form,
                  password:
                    event.target
                      .value,
                })
              }
              placeholder={
                editing
                  ? "Leave blank to keep current password"
                  : "Minimum 6 characters"
              }
            />

          </Field>


          <Field label="District">

            <select
              required
              value={
                form.district_id
              }
              onChange={(event) =>
                setForm({
                  ...form,
                  district_id:
                    event.target
                      .value,
                })
              }
            >

              <option value="">
                Select district
              </option>

              {districts.map(
                (district) => (
                  <option
                    key={
                      district.id
                    }
                    value={
                      district.id
                    }
                  >
                    {
                      district.name
                    }
                  </option>
                )
              )}

            </select>

          </Field>


          <div className="flex justify-end gap-[8px] pt-[5px]">

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-[6px] border border-[#D8E0DB] px-[15px] py-[8px] text-[10px] font-semibold text-[#34495A] hover:bg-[#F7FAF8]"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="rounded-[6px] bg-[#07843D] px-[15px] py-[8px] text-[10px] font-semibold text-white hover:bg-[#066F35] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : editing
                ? "Save Changes"
                : "Add Supervisor"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}


// ============================================================
// FIELD
// ============================================================

function Field({
  label,
  children,
}) {
  const className =
    "w-full h-[37px] rounded-[6px] border border-[#DCE4DF] bg-white px-[10px] text-[10px] text-[#172B43] outline-none focus:border-[#6CB98A]";

  return (
    <label className="block">

      <span className="mb-[5px] block text-[9px] font-semibold text-[#52606D]">
        {label}
      </span>

      {cloneElement(
        children,
        {
          className: `${className} ${
            children.props
              .className || ""
          }`,
        }
      )}

    </label>
  );
}


// ============================================================
// ASSIGNMENT MODAL
// ============================================================

function AssignmentModal({
  supervisor,
  onClose,
}) {
  const taluks =
    supervisor?.taluks ||
    supervisor?.assigned_taluks ||
    [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#10243A]/30 p-5 backdrop-blur-[1px]">

      <div className="w-full max-w-[450px] overflow-hidden rounded-[12px] border border-[#E1E8E3] bg-white shadow-[0_20px_60px_rgba(16,36,58,.2)]">

        <div className="flex items-center justify-between border-b border-[#E7ECE9] px-[20px] py-[15px]">

          <div>

            <h2 className="text-[15px] font-semibold text-[#172B43]">
              Supervisor Assignments
            </h2>

            <p className="mt-[3px] text-[9px] text-[#7B8794]">
              District and taluk coverage.
            </p>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-[28px] w-[28px] items-center justify-center rounded-[5px] text-[#52606D] hover:bg-[#F3F6F4]"
          >
            <X size={16} />
          </button>

        </div>


        <div className="p-[20px]">

          <div className="rounded-[9px] border border-[#DCEBE1] bg-[#F4FAF5] p-[13px]">

            <p className="text-[12px] font-semibold text-[#172B43]">
              {supervisor?.full_name ||
                "Medical Supervisor"}
            </p>

            <p className="mt-[5px] text-[9px] text-[#52606D]">
              District:{" "}
              {getDistrictName(
                supervisor
              )}
            </p>

            <p className="mt-[4px] text-[9px] text-[#52606D]">
              Taluks managed:{" "}
              {getTalukCount(
                supervisor
              )}
            </p>

            <p className="mt-[4px] text-[9px] text-[#52606D]">
              Supervising agents:{" "}
              {getAgentCount(
                supervisor
              )}
            </p>

          </div>


          {Array.isArray(taluks) &&
            taluks.length > 0 && (
              <div className="mt-[12px] space-y-[6px]">

                {taluks.map(
                  (taluk, index) => (
                    <div
                      key={
                        taluk?.id ??
                        index
                      }
                      className="flex items-center justify-between rounded-[6px] border border-[#E4EAE6] px-[10px] py-[8px]"
                    >

                      <div className="flex items-center gap-[7px]">

                        <MapPin
                          size={12}
                          className="text-[#087A32]"
                        />

                        <span className="text-[9px] font-medium text-[#34495A]">
                          {taluk?.name ||
                            taluk?.taluk_name ||
                            `Taluk ${
                              index + 1
                            }`}
                        </span>

                      </div>

                      <CheckCircle2
                        size={12}
                        className="text-[#07843D]"
                      />

                    </div>
                  )
                )}

              </div>
            )}

        </div>


        <div className="border-t border-[#E7ECE9] px-[20px] py-[13px] text-right">

          <button
            type="button"
            onClick={onClose}
            className="rounded-[6px] bg-[#07843D] px-[16px] py-[8px] text-[10px] font-semibold text-white hover:bg-[#066F35]"
          >
            Close
          </button>

        </div>

      </div>

    </div>
  );
}