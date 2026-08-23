import { useEffect, useState } from "react";
import { AlertTriangle, Send, Clock3, CheckCircle2, XCircle } from "lucide-react";
import { api } from "../../api";

export default function EmergingDiseaseReport() {
  const [form, setForm] = useState({ reported_name: "", suspected_cases: 0, symptoms: "", description: "" });
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try { setReports(await api.getMyEmergingDiseases()); } catch (e) { setError(e.message); }
  };
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault(); setError(""); setMessage(""); setLoading(true);
    try {
      await api.submitEmergingDisease({ ...form, suspected_cases: Number(form.suspected_cases) });
      setForm({ reported_name: "", suspected_cases: 0, symptoms: "", description: "" });
      setMessage("Suspected disease submitted. It will remain hidden from public surveillance until medical verification.");
      load();
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };

  const statusIcon = (status) => status === "VERIFIED" ? <CheckCircle2 className="w-4 h-4" /> : status === "REJECTED" ? <XCircle className="w-4 h-4" /> : <Clock3 className="w-4 h-4" />;

  return (
    <div>
      <div className="mb-6">
        <p className="text-[13px] font-medium text-[#087A32]">Emerging Disease Surveillance</p>
        <h2 className="text-[28px] font-semibold text-[#102A43] mt-1">Report a suspected new disease</h2>
        <p className="text-[14px] text-[#52606D] mt-1 max-w-2xl">Use this only when the condition is not already in the official disease list. Your report is sent to the Medical Supervisor for verification.</p>
      </div>

      <div className="bg-[#FFF9EA] border border-[#F0D99A] rounded-2xl p-4 mb-6 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-[#C57A00] mt-0.5 shrink-0" />
        <p className="text-[13px] text-[#6B4E00]">Do not use this form for Dengue, Malaria, Typhoid, Influenza, Chikungunya, or another already approved disease. Use the normal weekly report for those diseases.</p>
      </div>

      <form onSubmit={submit} className="bg-white border border-[#E3E9E5] rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-[13px] font-medium text-[#334E68] mb-1">Suspected disease / condition name</label>
          <input required value={form.reported_name} onChange={e => setForm({...form, reported_name:e.target.value})} className="w-full rounded-xl border border-[#D9E2DC] px-4 py-3 outline-none focus:ring-2 focus:ring-[#087A32]/20" placeholder="e.g. Unknown Fever" />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-[#334E68] mb-1">Suspected cases</label>
          <input type="number" min="0" required value={form.suspected_cases} onChange={e => setForm({...form, suspected_cases:e.target.value})} className="w-full rounded-xl border border-[#D9E2DC] px-4 py-3 outline-none" />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-[#334E68] mb-1">Symptoms observed</label>
          <textarea rows="3" value={form.symptoms} onChange={e => setForm({...form, symptoms:e.target.value})} className="w-full rounded-xl border border-[#D9E2DC] px-4 py-3 outline-none" placeholder="Fever, rash, breathing difficulty..." />
        </div>
        <div>
          <label className="block text-[13px] font-medium text-[#334E68] mb-1">Field description</label>
          <textarea rows="4" value={form.description} onChange={e => setForm({...form, description:e.target.value})} className="w-full rounded-xl border border-[#D9E2DC] px-4 py-3 outline-none" placeholder="Describe what you observed in the taluk." />
        </div>
        {error && <div className="rounded-xl bg-[#FFF5F5] border border-[#F0CACA] p-3 text-[13px] text-[#C62828]">{error}</div>}
        {message && <div className="rounded-xl bg-[#F0FAF3] border border-[#B8DEC6] p-3 text-[13px] text-[#087A32]">{message}</div>}
        <button disabled={loading} className="rounded-xl bg-[#087A32] text-white px-5 py-3 text-[13px] font-semibold flex items-center gap-2 disabled:opacity-60"><Send className="w-4 h-4" />{loading ? "Submitting..." : "Submit for Medical Verification"}</button>
      </form>

      <div className="mt-8">
        <h3 className="text-[19px] font-semibold text-[#102A43] mb-3">My emerging disease reports</h3>
        <div className="space-y-3">
          {reports.map(r => (
            <div key={r.id} className="bg-white border border-[#E3E9E5] rounded-2xl p-4 flex items-center justify-between gap-4">
              <div><p className="font-semibold text-[#102A43]">{r.reported_name}</p><p className="text-[12px] text-[#7B8794] mt-1">{r.suspected_cases} suspected cases{r.mapped_disease_name ? ` • Mapped to ${r.mapped_disease_name}` : ""}</p></div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F5F7F6] px-3 py-1.5 text-[12px] font-semibold text-[#52606D]">{statusIcon(r.status)}{r.status}</span>
            </div>
          ))}
          {!reports.length && <div className="text-[13px] text-[#7B8794]">No emerging disease reports submitted yet.</div>}
        </div>
      </div>
    </div>
  );
}
