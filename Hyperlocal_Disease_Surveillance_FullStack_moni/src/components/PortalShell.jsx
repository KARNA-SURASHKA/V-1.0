import { useEffect, useRef, useState } from "react";
import {
  ShieldCheck,
  ClipboardList,
  History,
  User,
  MapPin,
  LogOut,
  ChevronDown,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

export default function PortalShell({
  title,
  subtitle,
  tabs = [],
  activeTab,
  onTabChange,
  onExit,
  children,
  portalLabel,
}) {
  const { session } = useAuth();

  const [profileOpen, setProfileOpen] = useState(false);

  const profileRef = useRef(null);

  /*
   * Close profile dropdown when clicking outside.
   */
  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  /*
   * Agent information
   */
  const fullName =
    session?.full_name ||
    session?.username ||
    "Agent";

  const username =
    session?.username ||
    "Agent";

  const role =
    session?.role ||
    "Agent";

  const talukName =
    session?.taluk_name ||
    "Assigned Taluk";

  /*
   * Generate initials.
   */
  const initials =
    fullName
      ?.split(" ")
      .filter(Boolean)
      .map((name) => name[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AG";

  /*
   * Handle logout.
   */
  const handleLogout = () => {
    setProfileOpen(false);

    if (onExit) {
      onExit();
    }
  };

  /*
   * Identify sidebar icon.
   */
  const getTabIcon = (tab) => {
    if (tab.icon) return tab.icon;
    if (tab.key === "history") return History;
    return ClipboardList;
  };

  return (
    <div className="min-h-screen bg-[#F7FAF8] text-[#102A43]">

      {/* =========================================================
          TOP HEADER
      ========================================================= */}

      <header className="fixed top-0 left-0 right-0 z-50 h-[70px] bg-white border-b border-[#E3E9E5]">

        <div className="h-full flex items-center justify-between">

          {/* =====================================================
              BRAND
          ===================================================== */}

          <div className="w-[239px] h-full flex items-center px-5 border-r border-[#E3E9E5] bg-white">

            <div className="flex items-center gap-3">

              <div className="w-9 h-9 rounded-xl bg-[#EAF6EE] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-[#087A32]" />
              </div>

              <div>
                <h1 className="text-[17px] leading-none font-bold text-[#087A32]">
                  Karna Suraksha
                </h1>

                <p className="text-[10px] text-[#607080] mt-1">
                  Disease Surveillance System
                </p>
              </div>

            </div>

          </div>

          {/* =====================================================
              HEADER RIGHT / PROFILE
          ===================================================== */}

          <div className="flex items-center gap-4 px-6">

            <div
              ref={profileRef}
              className="relative"
            >

              {/* =================================================
                  PROFILE BUTTON
              ================================================= */}

              <button
                type="button"
                onClick={() => setProfileOpen((previous) => !previous)}
                className="flex items-center gap-3 rounded-xl px-2.5 py-2 hover:bg-[#F5F8F6] transition"
              >

                {/* Avatar */}

                <div className="w-9 h-9 rounded-full bg-[#EAF6EE] border border-[#D7EDE0] flex items-center justify-center">

                  <span className="text-[11px] font-bold text-[#087A32]">
                    {initials}
                  </span>

                </div>

                {/* Name */}

                <div className="hidden sm:block text-left">

                  <p className="text-[13px] font-semibold text-[#102A43] leading-tight">
                    {fullName}
                  </p>

                  <p className="text-[10px] text-[#718096] mt-0.5">
                    Agent
                  </p>

                </div>

                <ChevronDown
                  className={`w-4 h-4 text-[#34495E] transition-transform ${
                    profileOpen ? "rotate-180" : ""
                  }`}
                />

              </button>


              {/* =================================================
                  PROFILE DROPDOWN
              ================================================= */}

              {profileOpen && (
                <div className="absolute right-0 top-[58px] w-[290px] bg-white rounded-2xl border border-[#E1E7E3] shadow-[0_12px_35px_rgba(16,42,67,0.14)] overflow-hidden">

                  {/* =================================================
                      PROFILE HEADER
                  ================================================= */}

                  <div className="px-5 py-4 bg-[#F7FBF8] border-b border-[#E7ECE9]">

                    <div className="flex items-center gap-3">

                      <div className="w-11 h-11 rounded-full bg-[#EAF6EE] border border-[#D7EDE0] flex items-center justify-center">

                        <span className="text-[13px] font-bold text-[#087A32]">
                          {initials}
                        </span>

                      </div>

                      <div className="min-w-0">

                        <p className="text-[14px] font-semibold text-[#102A43] truncate">
                          {fullName}
                        </p>

                        <p className="text-[11px] text-[#718096] mt-0.5">
                          {portalLabel || "Disease Surveillance Agent"}
                        </p>

                      </div>

                    </div>

                  </div>


                  {/* =================================================
                      PROFILE DETAILS
                  ================================================= */}

                  <div className="px-5 py-3">

                    {/* Username */}

                    <div className="flex items-center gap-3 py-2.5">

                      <div className="w-8 h-8 rounded-lg bg-[#F2F6FA] flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-[#315C88]" />
                      </div>

                      <div className="min-w-0">

                        <p className="text-[10px] uppercase tracking-[0.08em] font-semibold text-[#8A93A3]">
                          Username
                        </p>

                        <p className="text-[12px] font-medium text-[#253B53] truncate mt-0.5">
                          {username}
                        </p>

                      </div>

                    </div>


                    {/* Role */}

                    <div className="flex items-center gap-3 py-2.5">

                      <div className="w-8 h-8 rounded-lg bg-[#EAF6EE] flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4 text-[#087A32]" />
                      </div>

                      <div>

                        <p className="text-[10px] uppercase tracking-[0.08em] font-semibold text-[#8A93A3]">
                          Role
                        </p>

                        <p className="text-[12px] font-medium text-[#253B53] capitalize mt-0.5">
                          {role}
                        </p>

                      </div>

                    </div>


                    {/* Assigned Taluk */}

                    <div className="flex items-center gap-3 py-2.5">

                      <div className="w-8 h-8 rounded-lg bg-[#EEF4FB] flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-[#315C88]" />
                      </div>

                      <div className="min-w-0">

                        <p className="text-[10px] uppercase tracking-[0.08em] font-semibold text-[#8A93A3]">
                          Assigned Taluk
                        </p>

                        <p className="text-[12px] font-medium text-[#253B53] truncate mt-0.5">
                          {talukName}
                        </p>

                      </div>

                    </div>

                  </div>


                  {/* =================================================
                      LOGOUT
                  ================================================= */}

                  <div className="border-t border-[#E7ECE9] p-3">

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[12px] font-semibold text-[#C62828] hover:bg-[#FFF5F5] transition"
                    >

                      <div className="w-8 h-8 rounded-lg bg-[#FFF0F0] flex items-center justify-center">
                        <LogOut className="w-4 h-4 text-[#C62828]" />
                      </div>

                      <span>
                        Logout
                      </span>

                    </button>

                  </div>

                </div>
              )}

            </div>

          </div>

        </div>

      </header>


      {/* =========================================================
          SIDEBAR
      ========================================================= */}

      <aside className="fixed left-0 top-[70px] bottom-0 w-[239px] bg-[#006B2D] text-white z-40">

        <div className="h-full flex flex-col">

          {/* =====================================================
              SIDEBAR CONTENT
          ===================================================== */}

          <div className="px-4 pt-7">

            <p className="px-3 text-[11px] uppercase tracking-[0.08em] font-bold text-white/85 mb-4">
              {portalLabel || "Agent Portal"}
            </p>


            {/* ===================================================
                NAVIGATION
            =================================================== */}

            <div className="space-y-1.5">

              {tabs.map((tab) => {

                const Icon = getTabIcon(tab);

                const isActive =
                  activeTab === tab.key;

                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => onTabChange?.(tab.key)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition ${
                      isActive
                        ? "bg-[#0B8F45] text-white shadow-sm"
                        : "text-white/90 hover:bg-white/10"
                    }`}
                  >

                    <Icon className="w-[17px] h-[17px] shrink-0" />

                    <span className="text-[13px] font-semibold">
                      {tab.label}
                    </span>

                  </button>
                );
              })}

            </div>

          </div>


          {/* =====================================================
              SIDEBAR BOTTOM
          ===================================================== */}

          <div className="mt-auto">

            {/* Decorative illustration */}

            <div className="relative h-[220px] overflow-hidden opacity-25">

              <div className="absolute left-[34px] bottom-[45px] w-[92px] h-[72px] rounded-t-[48px] bg-white/30" />

              <div className="absolute left-[20px] bottom-[20px] w-[125px] h-[48px] rounded-t-[55px] bg-white/30" />

              <div className="absolute left-[67px] bottom-[88px] w-[30px] h-[30px] border-[7px] border-white/40 rounded-md" />

              <div className="absolute left-[78px] bottom-[91px] w-[8px] h-[24px] bg-white/40 rounded" />

              <div className="absolute left-[70px] bottom-[99px] w-[24px] h-[8px] bg-white/40 rounded" />

            </div>


            {/* Quote */}

            <div className="px-5 pb-5">

              <div className="border-b border-white/20 pb-5">

                <p className="text-[13px] leading-[1.8] italic text-white/90">
                  “Early reporting,
                  <br />
                  stronger protection.
                  <br />
                  Together for a
                  <br />
                  healthier community.”
                </p>

              </div>

            </div>


            {/* Copyright */}

            <div className="px-5 pb-5">

              <p className="text-[10px] text-white/90">
                © 2026 Karna Suraksha
              </p>

              <p className="text-[10px] text-white/90 mt-1">
                All rights reserved.
              </p>

            </div>

          </div>

        </div>

      </aside>


      {/* =========================================================
          MAIN CONTENT
      ========================================================= */}

      <main className="pt-[70px] pl-[239px] min-h-screen">

        <div className="px-8 md:px-10 lg:px-12 py-8">

          {children}

        </div>

      </main>

    </div>
  );
}