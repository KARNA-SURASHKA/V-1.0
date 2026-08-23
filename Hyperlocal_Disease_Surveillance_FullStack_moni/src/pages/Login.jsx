import { useState } from "react";
import {
  ArrowLeft,
  ShieldCheck,
  ClipboardList,
  Stethoscope,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const ROLE_META = {
  agent: {
    label: "Agent Portal",
    icon: ClipboardList,
    hint: "Submit your taluk's weekly disease report.",
  },

  medical_supervisor: {
    label: "Medical Supervisor Portal",
    icon: Stethoscope,
    hint: "Verify disease reports and review agent issues.",
  },

  admin: {
    label: "Company / Admin Portal",
    icon: ShieldCheck,
    hint: "Manage agents, reports, and predictions.",
  },
};

export default function Login({ role, onSuccess, onBack }) {
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const meta = ROLE_META[role];

  // Prevent the page from crashing if an invalid role is passed.
  if (!meta) {
    return (
      <div className="min-h-screen bg-[#FCFAF6] flex items-center justify-center px-6">
        <div className="w-full max-w-[440px]">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-[14px] text-[#445064] hover:text-[#0B6D2E] mb-6 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to home
          </button>

          <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm p-8">
            <h2 className="text-[24px] font-semibold text-[#1F3144]">
              Invalid Portal
            </h2>

            <p className="text-[14px] text-[#445064] mt-2">
              The selected portal is not configured correctly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const Icon = meta.icon;

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const session = await login(username, password, role);
      onSuccess(session);
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFAF6] flex items-center justify-center px-6">
      <div className="w-full max-w-[440px]">

        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[14px] text-[#445064] hover:text-[#0B6D2E] mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to home
        </button>

        <div className="bg-white rounded-2xl border border-[#E8E2D8] shadow-sm p-8">

          <div className="w-14 h-14 rounded-xl bg-[#0B7A33] flex items-center justify-center mb-5">
            <Icon size={28} className="text-white" />
          </div>

          <h2 className="text-[24px] font-semibold text-[#1F3144]">
            {meta.label}
          </h2>

          <p className="text-[14px] text-[#445064] mt-1 mb-6">
            {meta.hint}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-[13px] font-medium text-[#445064] mb-1">
                Username
              </label>

              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full rounded-lg border border-[#E8E2D8] px-4 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B7A33]/30"
                placeholder="e.g. medical_supervisor"
              />
            </div>

            <div>
              <label className="block text-[13px] font-medium text-[#445064] mb-1">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-[#E8E2D8] px-4 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0B7A33]/30"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-[13px] text-[#C62828] bg-[#FBEAEA] rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-[#07892F] to-[#049437] hover:from-[#067C2B] hover:to-[#038A31] text-white font-semibold py-3 transition-all disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>

          </form>

          <div className="mt-6 pt-5 border-t border-[#E8E2D8] text-[12.5px] text-[#7A8598] leading-relaxed">

            Demo credentials (after running the backend seed script):{" "}

            {role === "admin" && (
              <>
                <b>admin</b> / admin123
              </>
            )}

            {role === "agent" && (
              <>
                <b>agent_virajpet</b> / agent123 (or any seeded agent username)
              </>
            )}

            {role === "medical_supervisor" && (
              <>
                <b>medical_supervisor</b> / supervisor123
              </>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}