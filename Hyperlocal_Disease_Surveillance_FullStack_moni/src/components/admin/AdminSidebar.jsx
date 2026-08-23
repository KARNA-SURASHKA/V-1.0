import { useState } from "react";
import {
  Menu,
  ShieldCheck,
  LogOut,
  X,
} from "lucide-react";

export default function AdminSidebar({
  nav,
  activeKey,
  onNavigate,
  onExit,
}) {
  const [open, setOpen] = useState(false);

  const go = (key) => {
    onNavigate(key);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-xl bg-white border border-[#E8E2D8] shadow-sm flex items-center justify-center text-[#1F3144]"
        aria-label="Open admin navigation"
      >
        <Menu size={20} />
      </button>

      {open && (
        <button
          className="lg:hidden fixed inset-0 z-40 bg-black/20"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <aside
        className={`
          fixed z-50 inset-y-0 left-0 w-[248px]
          bg-[#F5F1E9]
          border-r border-[#E5DED2]
          flex flex-col
          transform transition-transform duration-200
          lg:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >

        <div className="h-[82px] px-5 border-b border-[#E5DED2] flex items-center justify-between">

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-[#0B7A33] text-white flex items-center justify-center">
              <ShieldCheck size={22} />
            </div>

            <div>
              <div className="font-bold tracking-tight text-[#1F3144]">
                DiseaseWatch
              </div>

              <div className="text-[10px] uppercase tracking-[0.18em] text-[#7A8598] mt-0.5">
                Admin Portal
              </div>
            </div>

          </div>

          <button
            className="lg:hidden text-[#7A8598]"
            onClick={() => setOpen(false)}
            aria-label="Close"
          >
            <X size={19} />
          </button>

        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">

          {nav.map((group, index) => {

            const items =
              group.items || [group];

            return (
              <div
                key={group.section || group.key}
                className={index ? "mt-6" : ""}
              >

                {group.section && (
                  <p className="px-3 mb-2 text-[10px] font-semibold tracking-[0.16em] text-[#9A9489]">
                    {group.section}
                  </p>
                )}

                <div className="space-y-1">

                  {items.map(
                    ({
                      key,
                      label,
                      icon: Icon,
                    }) => (

                      <button
                        key={key}
                        onClick={() => go(key)}
                        className={`
                          w-full flex items-center gap-3
                          px-3 py-2.5 rounded-xl
                          text-left text-[13.5px]
                          transition
                          ${
                            activeKey === key
                              ? "bg-white text-[#0B7A33] shadow-sm font-semibold"
                              : "text-[#526073] hover:bg-white/70 hover:text-[#1F3144]"
                          }
                        `}
                      >

                        <Icon size={17} />

                        <span>
                          {label}
                        </span>

                      </button>

                    )
                  )}

                </div>
              </div>
            );
          })}

        </nav>

        <div className="p-3 border-t border-[#E5DED2]">

          <button
            onClick={onExit}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] text-[#6F6870] hover:bg-white/70 hover:text-[#C62828]"
          >
            <LogOut size={17} />
            Logout
          </button>

        </div>

      </aside>
    </>
  );
}