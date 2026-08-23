import { Bell, ChevronDown } from "lucide-react";

export default function AdminHeader({ activePage }) {
  return (
    <header className="h-[82px] bg-[#FCFAF6] border-b border-[#E8E2D8] flex items-center justify-between px-4 sm:px-6 lg:px-8 pl-16 lg:pl-8">
      <div>
        <h1 className="text-[22px] sm:text-[24px] font-semibold tracking-tight text-[#1F3144]">
          {activePage?.label || "Dashboard"}
        </h1>

        <p className="text-[12.5px] text-[#7A8598] mt-0.5">
          {activePage?.key === "dashboard"
            ? "Real-time surveillance summary"
            : "Disease surveillance administration"}
        </p>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <button className="relative w-10 h-10 rounded-xl border border-[#E8E2D8] bg-white flex items-center justify-center text-[#526073]">
          <Bell size={18} />

          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#C62828]" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-right">
          <div>
            <p className="text-[13px] font-semibold text-[#1F3144]">
              Administrator
            </p>

            <p className="text-[11px] text-[#7A8598]">
              Company Admin
            </p>
          </div>

          <ChevronDown
            size={16}
            className="text-[#7A8598]"
          />
        </div>
      </div>
    </header>
  );
}