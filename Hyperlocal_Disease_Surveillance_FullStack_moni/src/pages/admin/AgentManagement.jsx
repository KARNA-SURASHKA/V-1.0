import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  Eye,
  FileText,
  Mail,
  MapPin,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  UserRound,
  UsersRound,
  X,
  XCircle,
} from "lucide-react";
import { api } from "../../api";

const GREEN = "#087A3A";
const NAVY = "#142238";
const MUTED = "#6E788A";
const BORDER = "#E5E8EC";

const getLocationId = (location, key) => {
  if (!location) return undefined;
  if (key === "state") return location.stateId ?? location.state?.id;
  if (key === "district") return location.districtId ?? location.district?.id;
  return location.talukId ?? location.taluk?.id;
};

const getLocationName = (location, key) => {
  if (!location) return "";
  if (key === "state") return location.stateName ?? location.state?.name ?? "";
  if (key === "district") return location.districtName ?? location.district?.name ?? "";
  return location.talukName ?? location.taluk?.name ?? "";
};

const initials = (name = "Agent") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

const formatDate = (value, withTime = false) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(d);
};

const avatarClass = (index) => {
  const classes = [
    "bg-[#E8F4EC] text-[#087A3A]",
    "bg-[#EAF1FA] text-[#32659A]",
    "bg-[#FFF1D9] text-[#B97817]",
    "bg-[#FCE7E7] text-[#C43A3A]",
  ];
  return classes[index % classes.length];
};

function StatCard({ icon: Icon, value, label, tone = "green", helper }) {
  const tones = {
    green: "bg-[#EAF6EE] text-[#087A3A]",
    amber: "bg-[#FFF0DC] text-[#C97916]",
    red: "bg-[#FDE8E6] text-[#D52D24]",
    blue: "bg-[#EAF1FA] text-[#32659A]",
  };

  return (
    <div className="rounded-[12px] border border-[#E6E9ED] bg-white px-[16px] py-[15px] shadow-[0_2px_7px_rgba(31,49,68,.035)]">
      <div className="flex items-center gap-[11px]">
        <div className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full ${tones[tone]}`}>
          <Icon size={21} strokeWidth={1.8} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[.01em] text-[#6F7888]">{label}</p>
          <p className="mt-[3px] text-[21px] font-semibold leading-none text-[#172337]">{value}</p>
          {helper && <p className="mt-[5px] text-[10px] text-[#778294]">{helper}</p>}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status, attention }) {
  if (attention) {
    return <span className="inline-flex items-center gap-[5px] rounded-[5px] bg-[#FFF0D9] px-[9px] py-[4px] text-[10px] font-semibold text-[#C97916]"><AlertTriangle size={11} />Attention</span>;
  }
  if (!status) return null;
  return status === "Active" ? (
    <span className="inline-flex items-center gap-[5px] rounded-[5px] bg-[#EAF6EE] px-[9px] py-[4px] text-[10px] font-semibold text-[#087A3A]"><CheckCircle2 size={11} />Active</span>
  ) : (
    <span className="inline-flex items-center gap-[5px] rounded-[5px] bg-[#FDE8E6] px-[9px] py-[4px] text-[10px] font-semibold text-[#D52D24]"><XCircle size={11} />Inactive</span>
  );
}

function PerformanceBar({ value = 0 }) {
  const safe = Math.max(0, Math.min(100, Number(value) || 0));
  const cls = safe < 40 ? "bg-[#E12C2C]" : safe < 70 ? "bg-[#F0A51A]" : "bg-[#087A3A]";
  return (
    <div className="mt-[4px] h-[4px] w-[76px] overflow-hidden rounded-full bg-[#EDF0F2]">
      <div className={`h-full rounded-full ${cls}`} style={{ width: `${safe}%` }} />
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-[#EEF0F2] py-[8px] last:border-b-0">
      <span className="text-[10px] text-[#687386]">{label}</span>
      <span className="text-right text-[10px] font-medium text-[#263247]">{children}</span>
    </div>
  );
}

function Modal({ title, children, onClose, wide = false }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#10243A]/35 p-4 backdrop-blur-[2px]" onMouseDown={onClose}>
      <div className={`${wide ? "max-w-[780px]" : "max-w-[560px]"} w-full max-h-[90vh] overflow-hidden rounded-[14px] border border-[#E2E6EA] bg-white shadow-[0_22px_70px_rgba(16,36,58,.18)]`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#E7EAED] px-[20px] py-[15px]">
          <h3 className="text-[15px] font-semibold text-[#172337]">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-[#667185] hover:bg-[#F3F5F6]"><X size={17} /></button>
        </div>
        <div className="max-h-[calc(90vh-58px)] overflow-y-auto p-[20px]">{children}</div>
      </div>
    </div>
  );
}

function AgentForm({ initial, onSubmit, onCancel, saving }) {
  const [form, setForm] = useState({
    full_name: initial?.full_name || "",
    username: initial?.username || "",
    password: "",
    taluk_id: initial?.taluk_id ? String(initial.taluk_id) : "",
  });
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [taluks, setTaluks] = useState([]);
  const [stateId, setStateId] = useState("");
  const [districtId, setDistrictId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { api.getStates().then(setStates).catch(() => {}); }, []);
  useEffect(() => {
    if (!initial?.taluk_id || !states.length) return;
    const load = async () => {
      for (const state of states) {
        try {
          const ds = await api.getDistricts(state.id);
          const found = [];
          for (const d of ds) {
            const ts = await api.getTaluks(d.id);
            if (ts.some((t) => String(t.id) === String(initial.taluk_id))) {
              found.push({ state, district: d, taluks: ts });
              break;
            }
          }
          if (found[0]) {
            setStateId(String(found[0].state.id));
            setDistricts(ds);
            setDistrictId(String(found[0].district.id));
            setTaluks(found[0].taluks);
            break;
          }
        } catch { /* keep form usable */ }
      }
    };
    load();
  }, [initial?.taluk_id, states.length]);

  const chooseState = async (value) => {
    setStateId(value); setDistrictId(""); setTaluks([]); setForm((f) => ({ ...f, taluk_id: "" }));
    if (value) setDistricts(await api.getDistricts(Number(value)).catch(() => [])); else setDistricts([]);
  };
  const chooseDistrict = async (value) => {
    setDistrictId(value); setForm((f) => ({ ...f, taluk_id: "" }));
    if (value) setTaluks(await api.getTaluks(Number(value)).catch(() => [])); else setTaluks([]);
  };
  const submit = async (e) => {
    e.preventDefault(); setError("");
    if (!form.full_name.trim() || !form.username.trim() || !form.taluk_id) return setError("Name, username and taluk are required.");
    if (!initial && form.password.trim().length < 6) return setError("Password must contain at least 6 characters.");
    try { await onSubmit({ ...form, taluk_id: Number(form.taluk_id), password: form.password || undefined }); } catch (err) { setError(err.message); }
  };

  return (
    <form onSubmit={submit} className="space-y-[14px]">
      {error && <div className="rounded-lg bg-[#FDECEC] px-3 py-2 text-[11px] text-[#C62828]">{error}</div>}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-[10px] font-medium text-[#687386]">Full name<input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="mt-1 w-full rounded-lg border border-[#DDE2E6] px-3 py-2 text-[12px] outline-none focus:border-[#087A3A]" /></label>
        <label className="text-[10px] font-medium text-[#687386]">Username / email<input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="mt-1 w-full rounded-lg border border-[#DDE2E6] px-3 py-2 text-[12px] outline-none focus:border-[#087A3A]" /></label>
      </div>
      <label className="block text-[10px] font-medium text-[#687386]">{initial ? "New password (optional)" : "Password"}<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-1 w-full rounded-lg border border-[#DDE2E6] px-3 py-2 text-[12px] outline-none focus:border-[#087A3A]" /></label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="text-[10px] font-medium text-[#687386]">State<select value={stateId} onChange={(e) => chooseState(e.target.value)} className="mt-1 w-full rounded-lg border border-[#DDE2E6] bg-white px-3 py-2 text-[11px] outline-none"><option value="">Select state</option>{states.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <label className="text-[10px] font-medium text-[#687386]">District<select value={districtId} onChange={(e) => chooseDistrict(e.target.value)} disabled={!stateId} className="mt-1 w-full rounded-lg border border-[#DDE2E6] bg-white px-3 py-2 text-[11px] outline-none"><option value="">Select district</option>{districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></label>
        <label className="text-[10px] font-medium text-[#687386]">Taluk<select value={form.taluk_id} onChange={(e) => setForm({ ...form, taluk_id: e.target.value })} disabled={!districtId} className="mt-1 w-full rounded-lg border border-[#DDE2E6] bg-white px-3 py-2 text-[11px] outline-none"><option value="">Select taluk</option>{taluks.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
      </div>
      <div className="flex justify-end gap-2 border-t border-[#EEF0F2] pt-4">
        <button type="button" onClick={onCancel} className="rounded-lg border border-[#DCE1E5] px-4 py-2 text-[11px] font-medium text-[#526073]">Cancel</button>
        <button disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-[#087A3A] px-4 py-2 text-[11px] font-semibold text-white disabled:opacity-60">{saving && <RefreshCw size={12} className="animate-spin" />}{initial ? "Save Changes" : "Create Agent"}</button>
      </div>
    </form>
  );
}

export default function AgentManagement({ location, onNavigate }) {
  const [agents, setAgents] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, reporting: 0, attention: 0 });
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [detail, setDetail] = useState(null);
  const [menuId, setMenuId] = useState(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All Status");
  const [reporting, setReporting] = useState("All");
  const [assignment, setAssignment] = useState("All");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [action, setAction] = useState(null);
  const [warningText, setWarningText] = useState("");
  const [showWarning, setShowWarning] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const pageSize = 7;

  const locationIds = {
    state_id: getLocationId(location, "state"),
    district_id: getLocationId(location, "district"),
    taluk_id: getLocationId(location, "taluk"),
  };

  const load = async () => {
    setLoading(true); setError("");
    try {
      const data = await api.listAgents({ ...locationIds, search: query, status, reporting_status: reporting, assignment });
      setAgents(Array.isArray(data) ? data : []);
      const s = await api.getAgentManagementStats(locationIds);
      setStats(s || {});
    } catch (err) { setError(err.message || "Unable to load agent monitoring data."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [locationIds.state_id, locationIds.district_id, locationIds.taluk_id, query, status, reporting, assignment]);
  useEffect(() => { setPage(1); }, [query, status, reporting, assignment]);

  const openDetails = async (agent) => {
    setMenuId(null); setSelectedAgent(agent); setDetail(null);
    try { setDetail(await api.getAgentDetails(agent.id)); }
    catch (err) { setError(err.message); }
  };

  const submitForm = async (payload) => {
    setSaving(true);
    try {
      if (editing) await api.updateAgent(editing.id, payload);
      else await api.createAgent(payload);
      setShowForm(false); setEditing(null); await load();
    } finally { setSaving(false); }
  };

  const confirmAction = async () => {
    if (!action) return;
    setSaving(true);
    try {
      if (action.type === "status") await api.updateAgentStatus(action.agent.id, action.value);
      if (action.type === "delete") await api.deleteAgent(action.agent.id);
      if (action.type === "warning") await api.issueAgentWarning(action.agent.id, warningText);
      setAction(null); setWarningText(""); setShowWarning(false); await load();
      if (selectedAgent?.id === action.agent.id) await openDetails(action.agent);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const toggleAll = () => setSelectedIds(selectedIds.length === agents.length ? [] : agents.map((a) => a.id));
  const toggleOne = (id) => setSelectedIds((ids) => ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);

  const exportRows = (rows) => {
    const csv = [
      ["Agent ID", "Agent", "Username", "Assigned Taluk", "Status", "This Week", "This Month", "Compliance", "Last Report"],
      ...rows.map((a) => [a.id, a.full_name, a.username, a.taluk_name, a.is_active ? "Active" : "Inactive", `${a.this_week_count}/${a.this_week_expected}`, `${a.this_month_count}/${a.this_month_expected}`, `${a.compliance}%`, formatDate(a.last_report_at, true)]),
    ].map((r) => r.map((v) => `"${String(v ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "agent-monitoring.csv"; a.click(); URL.revokeObjectURL(url);
  };

  const visibleAgents = useMemo(() => {
    const start = (page - 1) * pageSize;
    return agents.slice(start, start + pageSize);
  }, [agents, page]);
  const pageCount = Math.max(1, Math.ceil(agents.length / pageSize));
  const allVisibleSelected = visibleAgents.length > 0 && visibleAgents.every((a) => selectedIds.includes(a.id));

  const clearFilters = () => { setQuery(""); setStatus("All Status"); setReporting("All"); setAssignment("All"); };

  const bulkDeactivate = async () => {
    if (!selectedIds.length) return;
    setSaving(true);
    setError("");
    try {
      await Promise.all(selectedIds.map((id) => api.updateAgentStatus(id, false).catch(() => null)));
      setSelectedIds([]);
      await load();
    } catch (err) {
      setError(err.message || "Unable to deactivate selected agents.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative" onClick={() => menuId && setMenuId(null)}>
      <div className="mb-[16px] flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-.02em] text-[#142238]">Agent Management</h1>
          <p className="mt-[4px] text-[11px] text-[#768195]">Manage field agents, assignments, reporting activity and supervisor reviews.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="inline-flex items-center gap-2 rounded-[6px] bg-[#087A3A] px-[15px] py-[9px] text-[11px] font-semibold text-white shadow-sm hover:bg-[#076B32]"><Plus size={15} />Add Agent</button>
          <button onClick={() => exportRows(agents)} className="inline-flex items-center gap-2 rounded-[6px] border border-[#DCE1E5] bg-white px-[15px] py-[9px] text-[11px] font-medium text-[#526073] hover:bg-[#F8FAF9]"><Download size={14} />Export</button>
        </div>
      </div>

      {error && <div className="mb-3 flex items-start gap-2 rounded-[8px] border border-[#F2C9C6] bg-[#FFF3F2] px-3 py-2 text-[11px] text-[#B42318]"><AlertTriangle size={14} className="mt-[1px] shrink-0" />{error}<button className="ml-auto" onClick={() => setError("")}><X size={14} /></button></div>}

      <div className="mb-[16px] grid grid-cols-2 gap-[12px] xl:grid-cols-4">
        <StatCard icon={UsersRound} value={stats.total_agents ?? stats.total ?? 0} label="Total Agents" helper="All registered agents" />
        <StatCard icon={UserRound} value={stats.active_agents ?? stats.active ?? 0} label="Active Agents" helper="Currently operational" tone="blue" />
        <StatCard icon={Activity} value={stats.reporting_this_week ?? stats.reporting ?? 0} label="Reporting This Week" helper="Agents submitted reports" />
        <StatCard icon={ShieldAlert} value={stats.needs_attention ?? stats.attention ?? 0} label="Needs Attention" helper="Agents need review" tone="red" />
      </div>

      <div className="mb-[16px] rounded-[10px] border border-[#E4E8EB] bg-white px-[12px] py-[12px] shadow-[0_2px_7px_rgba(31,49,68,.025)]">
        <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(220px,1.6fr)_1fr_1fr_1fr_auto]">
          <div className="flex items-center gap-2 rounded-[6px] border border-[#DCE2E6] px-3 py-[8px]">
            <Search size={14} className="text-[#6D7788]" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search agent by name, ID or email..." className="w-full bg-transparent text-[11px] text-[#263247] outline-none placeholder:text-[#9AA2AE]" />
          </div>
          <FilterSelect label="Location" value={assignment} onChange={setAssignment} options={["All Locations", "Virajpet", "Madikeri", "Somwarpet", "Gonikoppal", "Kushalnagar"]} />
          <FilterSelect label="Status" value={status} onChange={setStatus} options={["All Status", "Active", "Inactive"]} />
          <FilterSelect label="Reporting Status" value={reporting} onChange={setReporting} options={["All", "On Time", "Needs Attention", "Missed"]} />
          <button onClick={clearFilters} className="px-2 text-left text-[10px] font-semibold text-[#087A3A] lg:text-center">Clear Filters</button>
        </div>
      </div>

      <div className="rounded-[10px] border border-[#E4E8EB] bg-white shadow-[0_2px_7px_rgba(31,49,68,.03)]">
        <div className="flex items-center justify-between border-b border-[#E7EAED] px-[12px] py-[8px]">
          <div className="flex items-center gap-2 text-[10px] font-semibold text-[#087A3A]"><input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} className="accent-[#087A3A]" />{selectedIds.length > 0 ? `${selectedIds.length} agents selected` : `${agents.length} agents`}</div>
          {selectedIds.length > 0 && <div className="flex items-center gap-2"><button onClick={() => exportRows(agents.filter((a) => selectedIds.includes(a.id)))} className="rounded-[5px] border border-[#DCE2E6] px-3 py-[6px] text-[10px] font-medium text-[#526073]">Export</button><button onClick={bulkDeactivate} disabled={saving} className="rounded-[5px] border border-[#F0B6B2] px-3 py-[6px] text-[10px] font-medium text-[#C62828] disabled:opacity-50">Deactivate</button></div>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead><tr className="border-b border-[#E7EAED] text-[9px] font-semibold text-[#5E687A]"><th className="w-[40px] px-[12px] py-[10px]"><input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} className="accent-[#087A3A]" /></th><th className="px-[8px] py-[10px]">Agent</th><th className="px-[8px] py-[10px]">Assigned Area</th><th className="px-[8px] py-[10px]">Status</th><th className="px-[8px] py-[10px]">This Week</th><th className="px-[8px] py-[10px]">Last Report</th><th className="px-[8px] py-[10px]">Performance</th><th className="px-[8px] py-[10px]">Supervisor Review</th><th className="w-[46px] px-[8px] py-[10px]">Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="9" className="py-16 text-center text-[11px] text-[#7B8595]"><RefreshCw size={17} className="mx-auto mb-2 animate-spin" />Loading agent monitoring...</td></tr> : visibleAgents.length === 0 ? <tr><td colSpan="9" className="py-16 text-center text-[11px] text-[#7B8595]">No agents match the selected filters.</td></tr> : visibleAgents.map((agent, index) => {
                const attention = agent.attention || agent.reporting_status === "Needs Attention" || agent.reporting_status === "Missed";
                return <tr key={agent.id} className="border-b border-[#EEF0F2] hover:bg-[#FBFCFC]">
                  <td className="px-[12px] py-[10px]"><input type="checkbox" checked={selectedIds.includes(agent.id)} onChange={() => toggleOne(agent.id)} className="accent-[#087A3A]" /></td>
                  <td className="px-[8px] py-[10px]"><button onClick={() => openDetails(agent)} className="flex items-center gap-2 text-left"><span className={`flex h-[31px] w-[31px] shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${avatarClass(index)}`}>{initials(agent.full_name)}</span><span><span className="block text-[10px] font-semibold text-[#243046] hover:text-[#087A3A]">{agent.full_name}</span><span className="mt-[2px] block text-[9px] text-[#8992A0]">AGT-{String(agent.id).padStart(4, "0")}</span></span></button></td>
                  <td className="px-[8px] py-[10px] text-[9px] text-[#566176]">{agent.taluk_name || "—"}</td>
                  <td className="px-[8px] py-[10px]"><StatusBadge status={agent.is_active ? "Active" : "Inactive"} attention={attention && agent.is_active} /></td>
                  <td className="px-[8px] py-[10px] text-[9px] font-semibold text-[#455166]">{agent.this_week_count}/{agent.this_week_expected}</td>
                  <td className="px-[8px] py-[10px] text-[9px] text-[#657084]">{agent.last_report_at ? formatDate(agent.last_report_at, true) : "No report"}</td>
                  <td className="px-[8px] py-[10px]"><span className="text-[9px] font-semibold text-[#243046]">{agent.compliance}%</span><PerformanceBar value={agent.compliance} /></td>
                  <td className="px-[8px] py-[10px] text-[9px] font-semibold">{agent.review_label === "—" ? <span className="text-[#8891A0]">—</span> : <span className={agent.review_label.includes("Pending") || agent.review_label.includes("Recommendation") ? "text-[#D45C18]" : "text-[#536074]"}>{agent.review_label}</span>}</td>
                  <td className="relative px-[8px] py-[10px]"><button onClick={(e) => { e.stopPropagation(); setMenuId(menuId === agent.id ? null : agent.id); }} className="rounded-md p-1 text-[#4F5A6D] hover:bg-[#EEF3F0]"><MoreHorizontal size={15} /></button>{menuId === agent.id && <div onClick={(e) => e.stopPropagation()} className="absolute right-3 top-[38px] z-30 w-[155px] rounded-lg border border-[#DFE4E8] bg-white p-1 shadow-[0_10px_30px_rgba(16,36,58,.14)]"><MenuItem icon={Eye} text="View details" onClick={() => openDetails(agent)} /><MenuItem icon={Pencil} text="Edit agent" onClick={() => { setEditing(agent); setShowForm(true); setMenuId(null); }} /><MenuItem icon={MapPin} text="Change assignment" onClick={() => { setEditing(agent); setShowForm(true); setMenuId(null); }} /><MenuItem icon={ShieldAlert} text="Issue warning" onClick={() => { setAction({ type: "warning", agent }); setShowWarning(true); setMenuId(null); }} /><MenuItem icon={agent.is_active ? XCircle : CheckCircle2} text={agent.is_active ? "Deactivate" : "Activate"} danger={agent.is_active} onClick={() => { setAction({ type: "status", agent, value: !agent.is_active }); setMenuId(null); }} /></div>}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-[#E7EAED] px-[12px] py-[9px] text-[9px] text-[#707B8D]"><span>Showing {agents.length ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, agents.length)} of {agents.length} agents</span><div className="flex items-center gap-1"><button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded border border-[#E1E5E8] p-[4px] disabled:opacity-40"><ChevronLeft size={12} /></button>{Array.from({ length: Math.min(3, pageCount) }, (_, i) => i + 1).map((p) => <button key={p} onClick={() => setPage(p)} className={`h-[22px] min-w-[22px] rounded border text-[9px] font-semibold ${page === p ? "border-[#087A3A] bg-[#087A3A] text-white" : "border-[#E1E5E8] bg-white text-[#586376]"}`}>{p}</button>)}<button disabled={page >= pageCount} onClick={() => setPage((p) => Math.min(pageCount, p + 1))} className="rounded border border-[#E1E5E8] p-[4px] disabled:opacity-40"><ChevronRight size={12} /></button></div></div>
      </div>

      {selectedAgent && <aside className="fixed inset-y-0 right-0 z-[70] w-full max-w-[360px] overflow-y-auto border-l border-[#E1E5E8] bg-white shadow-[-12px_0_40px_rgba(16,36,58,.10)]">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#E7EAED] bg-white px-[16px] py-[15px]"><div><p className="text-[14px] font-semibold text-[#172337]">Agent Details</p></div><button onClick={() => { setSelectedAgent(null); setDetail(null); }} className="rounded-md p-1 text-[#526073] hover:bg-[#F4F6F7]"><X size={17} /></button></div>
        {detail ? <div className="px-[16px] pb-8">
          <div className="flex items-center gap-3 border-b border-[#E7EAED] py-[15px]"><span className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[#FFF0D9] text-[18px] font-semibold text-[#C97916]">{initials(detail.full_name)}</span><div><h3 className="text-[13px] font-semibold text-[#172337]">{detail.full_name}</h3><p className="text-[9px] text-[#697487]">AGT-{String(detail.id).padStart(4, "0")}</p><div className="mt-1"><StatusBadge status={detail.is_active ? "Active" : "Inactive"} attention={detail.attention} /></div></div></div>
          <SectionTitle>Agent Information</SectionTitle><Field label="Email"><span className="inline-flex items-center gap-1"><Mail size={10} />{detail.email || detail.username || "Not provided"}</span></Field><Field label="Phone"><span className="inline-flex items-center gap-1"><Phone size={10} />{detail.phone || "Not provided"}</span></Field><Field label="Assigned Location">{detail.taluk_name || "—"}</Field><Field label="Coverage Areas">{detail.coverage_areas ?? 1} taluk</Field><Field label="Joined Date">{formatDate(detail.joined_date)}</Field>
          <SectionTitle>Reporting Performance</SectionTitle><Field label="This Week">{detail.this_week_count} / {detail.this_week_expected}</Field><Field label="This Month">{detail.this_month_count} / {detail.this_month_expected}</Field><Field label="Compliance"><span className="inline-flex items-center gap-2"><span>{detail.compliance}%</span><PerformanceBar value={detail.compliance} /></span></Field>
          <SectionTitle>Supervisor Reviews <span className="float-right text-[#D45C18]">{detail.pending_reviews || 0} Reviews</span></SectionTitle>
          {detail.latest_review ? <div className="rounded-[7px] border border-[#E1E5E8] p-[10px]"><p className="text-[9px] font-semibold text-[#243046]">Latest Review</p><div className="mt-2 space-y-2 text-[9px] text-[#596477]"><div className="flex justify-between"><span>Submitted by</span><b className="text-[#263247]">Medical Supervisor</b></div><div className="flex justify-between"><span>Date</span><b className="text-[#263247]">{formatDate(detail.latest_review.created_at)}</b></div><div><span>Concern</span><p className="mt-1 leading-[1.55] text-[#263247]">{detail.latest_review.description}</p></div><div><span>Recommendation</span><p className="mt-1 font-semibold text-[#D45C18]">{detail.latest_review.issue_type || "Review required"}</p></div><button onClick={() => setShowReview(true)} className="mt-1 w-full rounded-[5px] border border-[#78BE98] py-[7px] text-[10px] font-semibold text-[#087A3A]">View Full Review</button></div></div> : <div className="rounded-[7px] bg-[#F8FAF9] p-3 text-[9px] text-[#7B8595]">No supervisor review has been submitted for this agent.</div>}
          <button onClick={() => setShowReview(true)} className="mt-3 flex w-full items-center justify-center gap-2 text-[10px] font-semibold text-[#087A3A]">View reporting history <ChevronRight size={13} /></button>
          <SectionTitle>Administrative Actions</SectionTitle><div className="grid grid-cols-2 gap-2"><ActionButton text="View Reports" icon={FileText} onClick={async () => { setReports(await api.getAgentReports(detail.id).catch(() => [])); }} /><ActionButton text="Manage Assignment" icon={MapPin} onClick={() => { setEditing(detail); setShowForm(true); }} /><ActionButton text="Issue Warning" icon={ShieldAlert} amber onClick={() => { setAction({ type: "warning", agent: detail }); setShowWarning(true); }} /><ActionButton text={detail.is_active ? "Suspend Agent" : "Activate Agent"} icon={detail.is_active ? XCircle : CheckCircle2} danger={detail.is_active} onClick={() => setAction({ type: "status", agent: detail, value: !detail.is_active })} /></div><button onClick={() => setAction({ type: "status", agent: detail, value: false })} disabled={!detail.is_active} className="mt-2 w-full rounded-[6px] bg-[#E6292E] py-[9px] text-[10px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">Deactivate Agent</button>
          {reports.length > 0 && <div className="mt-4 rounded-lg border border-[#E5E8EB] p-3"><p className="mb-2 text-[10px] font-semibold text-[#243046]">Recent Reports</p>{reports.slice(0, 8).map((r) => <div key={r.id} className="flex justify-between border-b border-[#F0F1F3] py-2 text-[9px] last:border-0"><span>{r.disease}</span><span className="text-[#687386]">{r.cases} cases · {formatDate(r.created_at)}</span></div>)}</div>}
        </div> : <div className="flex min-h-[300px] items-center justify-center text-[10px] text-[#7B8595]"><RefreshCw size={15} className="mr-2 animate-spin" />Loading details...</div>}
      </aside>}

      {showForm && <Modal title={editing ? "Edit Agent" : "Add Agent"} onClose={() => { if (!saving) { setShowForm(false); setEditing(null); } }}><AgentForm initial={editing} onSubmit={submitForm} onCancel={() => { setShowForm(false); setEditing(null); }} saving={saving} /></Modal>}

      {action && action.type !== "warning" && <Modal title={action.value ? "Activate Agent?" : action.type === "delete" ? "Delete Agent?" : "Deactivate Agent?"} onClose={() => !saving && setAction(null)}><div className="space-y-3"><div className="flex items-start gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FDECEC] text-[#C62828]"><ShieldAlert size={18} /></div><div><p className="text-[12px] font-semibold text-[#263247]">{action.value ? `Activate ${action.agent.full_name}?` : `Deactivate ${action.agent.full_name}?`}</p><p className="mt-1 text-[10px] leading-5 text-[#6D7788]">The account status will be updated immediately. Existing surveillance records are preserved.</p></div></div><div className="flex justify-end gap-2 border-t border-[#EEF0F2] pt-3"><button onClick={() => setAction(null)} className="rounded-lg border border-[#DCE1E5] px-4 py-2 text-[10px]">Cancel</button><button onClick={confirmAction} disabled={saving} className={`rounded-lg px-4 py-2 text-[10px] font-semibold text-white ${action.value ? "bg-[#087A3A]" : "bg-[#E6292E]"}`}>{saving ? "Saving..." : action.value ? "Activate" : "Deactivate"}</button></div></div></Modal>}

      {showWarning && <Modal title="Issue Warning" onClose={() => !saving && setShowWarning(false)}><p className="mb-3 text-[10px] text-[#6D7788]">Send an administrative warning to <b className="text-[#263247]">{action?.agent?.full_name}</b> and record it in Activity Logs.</p><textarea value={warningText} onChange={(e) => setWarningText(e.target.value)} rows={5} placeholder="Enter the reason for the warning..." className="w-full resize-none rounded-lg border border-[#DCE2E6] p-3 text-[11px] outline-none focus:border-[#087A3A]" /><div className="mt-3 flex justify-end gap-2"><button onClick={() => setShowWarning(false)} className="rounded-lg border border-[#DCE1E5] px-4 py-2 text-[10px]">Cancel</button><button disabled={!warningText.trim() || saving} onClick={confirmAction} className="rounded-lg bg-[#C97916] px-4 py-2 text-[10px] font-semibold text-white disabled:opacity-50">{saving ? "Sending..." : "Issue Warning"}</button></div></Modal>}

      {showReview && detail && <Modal title="Supervisor Review & Reporting History" wide onClose={() => setShowReview(false)}><div className="grid gap-4 md:grid-cols-2"><div className="rounded-lg border border-[#E4E8EB] p-4"><p className="text-[10px] font-semibold text-[#243046]">Supervisor Review</p>{detail.latest_review ? <div className="mt-3 space-y-3 text-[10px]"><Field label="Issue">{detail.latest_review.issue_type}</Field><Field label="Severity">{detail.latest_review.severity}</Field><Field label="Status">{detail.latest_review.status}</Field><div><span className="text-[#687386]">Concern</span><p className="mt-1 leading-5 text-[#263247]">{detail.latest_review.description}</p></div><div><span className="text-[#687386]">Evidence</span><p className="mt-1 leading-5 text-[#263247]">{detail.latest_review.evidence || "No evidence attached."}</p></div></div> : <p className="mt-3 text-[10px] text-[#7B8595]">No review available.</p>}</div><div className="rounded-lg border border-[#E4E8EB] p-4"><p className="text-[10px] font-semibold text-[#243046]">Reporting History</p><div className="mt-3 max-h-[330px] overflow-y-auto">{(detail.reporting_history || []).map((row) => <div key={`${row.year}-${row.week_number}`} className="flex items-center justify-between border-b border-[#F0F1F3] py-2 text-[10px] last:border-0"><span>Week {row.week_number % 100}, {row.year}</span><span className={row.submitted ? "font-semibold text-[#087A3A]" : "font-semibold text-[#D52D24]"}>{row.submitted ? "Submitted" : "Missed"}</span></div>)}</div></div></div></Modal>}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }) {
  return <label className="text-[9px] text-[#707B8D]">{label}<div className="relative mt-1"><select value={value} onChange={(e) => onChange(e.target.value)} className="w-full appearance-none rounded-[6px] border border-[#DCE2E6] bg-white px-[10px] py-[8px] pr-7 text-[10px] font-medium text-[#3C475A] outline-none"><option value={options[0]}>{options[0]}</option>{options.slice(1).map((o) => <option key={o} value={o}>{o}</option>)}</select><ChevronDown size={12} className="pointer-events-none absolute right-2 top-[9px] text-[#6B7484]" /></div></label>;
}
function MenuItem({ icon: Icon, text, onClick, danger }) { return <button onClick={onClick} className={`flex w-full items-center gap-2 rounded-md px-2 py-[7px] text-left text-[10px] ${danger ? "text-[#C62828]" : "text-[#344056]"} hover:bg-[#F4F7F5]`}><Icon size={12} />{text}</button>; }
function SectionTitle({ children }) { return <div className="mt-[17px] mb-[5px] border-b border-[#E7EAED] pb-[6px] text-[10px] font-semibold uppercase tracking-[.01em] text-[#1E2B3E]">{children}</div>; }
function ActionButton({ text, icon: Icon, onClick, danger, amber }) { return <button onClick={onClick} className={`inline-flex items-center justify-center gap-1.5 rounded-[6px] border py-[8px] text-[9px] font-semibold ${danger ? "border-[#F08D86] text-[#D52D24]" : amber ? "border-[#EAB15C] text-[#C97916]" : "border-[#8AC8A9] text-[#087A3A]"} hover:bg-[#F8FAF9]`}><Icon size={11} />{text}</button>; }
