import { useEffect, useState } from "react";
import { Megaphone, Siren, Stethoscope } from "lucide-react";
import { api } from "../../api";

const TYPE_ICON = {
  "Health Camp": Stethoscope,
  "Awareness Campaign": Megaphone,
  "Emergency Alert": Siren,
};

const TYPE_COLOR = {
  "Health Camp": "#3FA9F5",
  "Awareness Campaign": "#0B7A33",
  "Emergency Alert": "#C62828",
};

export default function NotificationsTab({ talukId }) {
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .getNotificationsForTaluk(talukId)
      .then(setNotes)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [talukId]);

  if (loading) return <p className="text-[14px] text-[#7A8598]">Loading notifications...</p>;
  if (error) return <p className="text-[14px] text-[#C62828]">{error}</p>;

  return (
    <div className="space-y-4 max-w-[640px]">
      <h2 className="text-[20px] font-semibold text-[#1F3144]">Notifications &amp; Alerts</h2>
      {notes.length === 0 && (
        <p className="text-[14px] text-[#7A8598]">No notifications published yet.</p>
      )}
      {notes.map((n) => {
        const Icon = TYPE_ICON[n.type] || Megaphone;
        const color = TYPE_COLOR[n.type] || "#0B7A33";
        return (
          <div key={n.id} className="bg-white rounded-xl border border-[#E8E2D8] p-5 flex gap-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: color }}
            >
              <Icon size={20} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-[#1F3144]">{n.title}</h4>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F6F3ED] text-[#7A8598]">
                  {n.taluk_name}
                </span>
              </div>
              <p className="text-[14px] text-[#445064] mt-1">{n.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
