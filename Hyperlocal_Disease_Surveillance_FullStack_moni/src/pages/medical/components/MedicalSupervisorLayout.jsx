import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Bell,
  CalendarDays,
  ChevronDown,
  LayoutDashboard,
  FileText,
  ClipboardCheck,
  MapPinned,
  BarChart3,
  UserRoundCog,
  HeartPulse,
  Menu,
  LogOut,
  ShieldCheck,
  MapPin,
} from "lucide-react";

import { useAuth } from "../../../context/AuthContext";

import medicalDoctor from "../../../assets/ui/medical-doctor.png";
import supervisorLogo from "../../../assets/ui/medical-supervisor-logo.png";
import sidebarCard from "../../../assets/ui/medical-supervisor-sidebar-card.png";

// ============================================================
// MEDICAL SUPERVISOR NAVIGATION
// ============================================================

export const MEDICAL_NAV = [
  {
    key: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    section: "OVERVIEW",
  },

  {
    key: "reports",
    label: "Disease Reports",
    icon: FileText,
    section: "SURVEILLANCE",
  },

  {
    key: "monitoring",
    label: "Agent Monitoring",
    icon: ClipboardCheck,
  },

  {
    key: "risk-map",
    label: "Risk Map",
    icon: MapPinned,
  },

  {
    key: "analytics",
    label: "Surveillance Analytics",
    icon: BarChart3,
  },

  {
    key: "agents",
    label: "Agent Oversight",
    icon: UserRoundCog,
    section: "REVIEW & RESPONSE",
  },

  {
    key: "alerts",
    label: "Alerts",
    icon: Bell,
  },

  {
    key: "home-relief",
    label: "Home Relief",
    icon: HeartPulse,
    section: "MEDICAL CONTENT",
  },
];

// ============================================================
// LAYOUT
// ============================================================

export default function MedicalSupervisorLayout({
  activeTab,
  onTabChange,
  onExit,
  alertCount,
  districtName,
  children,
}) {
  const {
    session,
  } = useAuth();

  const [
    profileOpen,
    setProfileOpen,
  ] = useState(false);

  const [
    mobileOpen,
    setMobileOpen,
  ] = useState(false);

  const profileRef =
    useRef(null);

  // ==========================================================
  // CLOSE PROFILE WHEN CLICKING OUTSIDE
  // ==========================================================

  useEffect(() => {
    const close = (
      event
    ) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(
          event.target
        )
      ) {
        setProfileOpen(
          false
        );
      }
    };

    document.addEventListener(
      "mousedown",
      close
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        close
      );
  }, []);

  // ==========================================================
  // SESSION
  // ==========================================================

  const fullName =
    session?.full_name ||
    "Dr. Monish";

  const username =
    session?.username ||
    "medical_supervisor";

  const role =
    "District Supervisor";

  const dateText =
    new Intl.DateTimeFormat(
      "en-IN",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    ).format(
      new Date()
    );

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const selectTab = (
    key
  ) => {
    onTabChange(key);

    setMobileOpen(
      false
    );
  };

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="medical-shell min-h-screen bg-[#FBFCFB] text-[#101B38]">
      {/* ====================================================
          HEADER
      ==================================================== */}

      <header className="fixed inset-x-0 top-0 z-50 h-[74px] border-b border-[#E7EBE8] bg-white">
        <div className="flex h-full items-center">
          {/* LOGO */}
          <div className="flex h-full w-[252px] shrink-0 items-center gap-3 border-r border-[#E7EBE8] px-5">
            <img
              src={
                supervisorLogo
              }
              alt="Medical Supervisor"
              className="h-[47px] w-[43px] object-contain"
            />

            <div>
              <div className="text-[16px] font-bold tracking-[-0.02em] text-[#17233D]">
                MEDICAL
                SUPERVISOR
              </div>

              <div className="mt-0.5 text-[11px] text-[#52627D]">
                Surveillance
                System
              </div>
            </div>
          </div>

          {/* HEADER CONTENT */}
          <div className="flex min-w-0 flex-1 items-center justify-between px-5 lg:px-7">
            {/* MENU */}
            <button
              type="button"
              onClick={() =>
                setMobileOpen(
                  (value) =>
                    !value
                )
              }
              className="flex h-10 w-10 items-center justify-center rounded-xl text-[#17233D] hover:bg-[#F4F7F5]"
              aria-label="Toggle navigation"
            >
              <Menu
                size={22}
              />
            </button>

            <div className="flex items-center gap-3">
              {/* DISTRICT */}
              <div className="hidden h-10 items-center gap-2 rounded-xl border border-[#E2E7E4] bg-white px-3.5 text-[12px] font-semibold text-[#17233D] md:flex">
                <MapPin
                  size={16}
                  className="text-[#087A32]"
                />

                <span>
                  {
                    districtName ||
                    "Kodagu District"
                  }
                </span>

                <ChevronDown
                  size={14}
                />
              </div>

              {/* DATE */}
              <div className="hidden h-10 items-center gap-2 rounded-xl border border-[#E2E7E4] bg-white px-3.5 text-[12px] font-semibold text-[#17233D] md:flex">
                <CalendarDays
                  size={16}
                />

                <span>
                  {
                    dateText
                  }
                </span>

                <ChevronDown
                  size={14}
                />
              </div>

              {/* ALERTS */}
              <button
                type="button"
                onClick={() =>
                  selectTab(
                    "alerts"
                  )
                }
                className="relative flex h-10 w-10 items-center justify-center rounded-xl hover:bg-[#F4F7F5]"
                aria-label="Alerts"
              >
                <Bell
                  size={20}
                />

                {alertCount >
                  0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#E11D48] px-1 text-[9px] font-bold text-white">
                    {
                      alertCount
                    }
                  </span>
                )}
              </button>

              {/* PROFILE */}
              <div
                ref={
                  profileRef
                }
                className="relative"
              >
                <button
                  type="button"
                  onClick={() =>
                    setProfileOpen(
                      (value) =>
                        !value
                    )
                  }
                  className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-[#F4F7F5]"
                >
                  <img
                    src={
                      medicalDoctor
                    }
                    alt="District Supervisor"
                    className="h-9 w-9 rounded-full bg-[#EAF6EE] object-cover"
                  />

                  <div className="hidden text-left sm:block">
                    <div className="text-[12px] font-semibold leading-tight text-[#17233D]">
                      {
                        fullName
                      }
                    </div>

                    <div className="mt-0.5 text-[10px] text-[#718096]">
                      {role}
                    </div>
                  </div>

                  <ChevronDown
                    size={15}
                    className={
                      profileOpen
                        ? "rotate-180"
                        : ""
                    }
                  />
                </button>

                {/* PROFILE DROPDOWN */}
                {profileOpen && (
                  <div className="absolute right-0 top-12 w-[260px] overflow-hidden rounded-2xl border border-[#E2E8E4] bg-white shadow-[0_18px_45px_rgba(16,42,67,.14)]">
                    <div className="border-b border-[#E7ECE9] bg-[#F6FBF7] p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            medicalDoctor
                          }
                          alt="District Supervisor"
                          className="h-11 w-11 rounded-full bg-[#EAF6EE] object-cover"
                        />

                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-semibold">
                            {
                              fullName
                            }
                          </div>

                          <div className="mt-0.5 text-[10px] text-[#718096]">
                            {
                              role
                            }
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3">
                      {/* ROLE */}
                      <div className="flex items-center gap-3 rounded-xl p-2.5">
                        <ShieldCheck
                          size={17}
                          className="text-[#087A32]"
                        />

                        <div>
                          <div className="text-[9px] font-bold uppercase tracking-[.08em] text-[#8A93A3]">
                            Role
                          </div>

                          <div className="text-[12px] font-medium">
                            {
                              role
                            }
                          </div>
                        </div>
                      </div>

                      {/* DISTRICT */}
                      <div className="flex items-center gap-3 rounded-xl p-2.5">
                        <MapPin
                          size={17}
                          className="text-[#315C88]"
                        />

                        <div>
                          <div className="text-[9px] font-bold uppercase tracking-[.08em] text-[#8A93A3]">
                            Assigned District
                          </div>

                          <div className="text-[12px] font-medium">
                            {
                              districtName ||
                              "Kodagu"
                            }
                          </div>
                        </div>
                      </div>

                      {/* USERNAME */}
                      <div className="flex items-center gap-3 rounded-xl p-2.5">
                        <UserRoundCog
                          size={17}
                          className="text-[#315C88]"
                        />

                        <div>
                          <div className="text-[9px] font-bold uppercase tracking-[.08em] text-[#8A93A3]">
                            Username
                          </div>

                          <div className="text-[12px] font-medium">
                            {
                              username
                            }
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* LOGOUT */}
                    <div className="border-t border-[#E7ECE9] p-3">
                      <button
                        type="button"
                        onClick={
                          onExit
                        }
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-[#C62828] hover:bg-[#FFF4F4]"
                      >
                        <LogOut
                          size={16}
                        />

                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ====================================================
          SIDEBAR
      ==================================================== */}

      <aside
        className={`fixed bottom-0 left-0 top-[74px] z-40 w-[252px] border-r border-[#E5EAE7] bg-white transition-transform duration-200 ${
          mobileOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex h-full flex-col px-3 py-5">
          <nav className="flex-1 overflow-y-auto">
            {MEDICAL_NAV.map(
              (item) => {
                const Icon =
                  item.icon;

                return (
                  <div
                    key={
                      item.key
                    }
                  >
                    {item.section && (
                      <div className="px-3 pb-2 pt-4 text-[10px] font-bold uppercase tracking-[.12em] text-[#788496]">
                        {
                          item.section
                        }
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        selectTab(
                          item.key
                        )
                      }
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                        activeTab ===
                        item.key
                          ? "bg-[#E7F4EA] text-[#087A32]"
                          : "text-[#17233D] hover:bg-[#F5F8F6]"
                      }`}
                    >
                      <Icon
                        size={18}
                        strokeWidth={
                          1.9
                        }
                      />

                      <span className="text-[13px] font-semibold">
                        {
                          item.label
                        }
                      </span>
                    </button>
                  </div>
                );
              }
            )}
          </nav>

          {/* SIDEBAR CARD */}
          <div className="pt-3">
            <img
              src={
                sidebarCard
              }
              alt="Better surveillance. Stronger communities. Healthier tomorrow."
              className="w-full rounded-[12px]"
            />
          </div>
        </div>
      </aside>

      {/* MOBILE OVERLAY */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() =>
            setMobileOpen(
              false
            )
          }
          className="fixed inset-0 z-30 bg-black/10 lg:hidden"
        />
      )}

      {/* ====================================================
          MAIN
      ==================================================== */}

      <main className="min-h-screen pt-[74px] lg:pl-[252px]">
        <div className="px-5 py-6 md:px-7 lg:px-8">
          {
            children
          }
        </div>
      </main>
    </div>
  );
}