import { AlertTriangle, BellRing, CircleAlert } from "lucide-react";

function alertIcon(type) {
  const value = String(type || "").toLowerCase();
  if (value.includes("high") || value.includes("critical")) {
    return <CircleAlert size={19} className="text-[#F04444]" />;
  }
  return <AlertTriangle size={19} className="text-[#F59E0B]" />;
}

export default function RecentAlerts({ alerts = [], onViewAll }) {
  const visible = alerts.slice(0, 3);

  return (
    <section className="h-full rounded-[14px] border border-[#ECE8E1] bg-white p-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-between border-b border-[#EEEAE4] pb-4">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.02em] text-[#1B1D1F]">
          RECENT ALERTS
        </h2>
        <button type="button" onClick={onViewAll} className="text-[12px] font-medium text-[#F04444] hover:underline">
          View All
        </button>
      </div>

      <div className="divide-y divide-[#F0ECE7]">
        {visible.length ? (
          visible.map((alert, index) => (
            <div key={alert.id || index} className="flex items-center gap-3 py-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF3EA]">
                {alertIcon(alert.type || alert.notification_type)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium leading-5 text-[#17191C]">
                  {alert.title || "Health alert"}
                </p>
                <p className="truncate text-[11px] leading-5 text-[#33383D]">
                  {alert.message || "New surveillance information is available."}
                </p>
              </div>
              <div className="shrink-0 text-right text-[10px] leading-5 text-[#3D4247]">
                <div>{formatTime(alert.created_at)}</div>
                <div>{formatDate(alert.created_at)}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex min-h-[165px] flex-col items-center justify-center text-center text-[#7A7F84]">
            <BellRing size={22} className="mb-2" />
            <p className="text-[12px]">No recent alerts for this location.</p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onViewAll}
        className="mt-2 w-full rounded-[7px] border border-[#F04444] py-2 text-[12px] font-medium text-[#F04444] transition hover:bg-[#FFF7F7]"
      >
        View All Alerts
      </button>
    </section>
  );
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}
