import { useState } from "react";
import {
  Menu,
  X,
  ShieldPlus,
  Home,
  UsersRound,
  UserRoundCog,
  ShieldCheck,
  FileText,
  CalendarDays,
  Map,
  Activity,
  MapPin,
  Gauge,
  Bell,
  Clock3,
  Settings,
  LogOut,
} from "lucide-react";

/*
  ADMIN SIDEBAR
  -------------------------------------------------------
  Designed to match the provided Hyperlocal Admin reference.

  Important:
  - Keeps the existing nav/onNavigate/onExit API.
  - Does not change your dashboard functionality.
  - Works with the existing AdminLayout.
  - Automatically uses the icons below based on the navigation key.
*/

const iconMap = {
  dashboard: Home,

  users:
    UsersRound,
  "user-management":
    UsersRound,
  userManagement:
    UsersRound,

  agents:
    UserRoundCog,
  "agent-management":
    UserRoundCog,
  agentManagement:
    UserRoundCog,

  supervisors:
    UserRoundCog,
  "medical-supervisor-management":
    UserRoundCog,
  medicalSupervisorManagement:
    UserRoundCog,

  roles:
    ShieldCheck,
  permissions:
    ShieldCheck,
  "roles-permissions":
    ShieldCheck,
  rolesPermissions:
    ShieldCheck,

  reports:
    FileText,
  "report-management":
    FileText,
  reportManagement:
    FileText,

  monitoring:
    CalendarDays,
  "weekly-monitoring":
    CalendarDays,
  weeklyMonitoring:
    CalendarDays,

  risk:
    Map,
  "risk-map":
    Map,
  riskMap:
    Map,

  analytics:
    Activity,

  location:
    MapPin,
  "location-management":
    MapPin,
  locationManagement:
    MapPin,

  health:
    Gauge,
  "system-health":
    Gauge,
  systemHealth:
    Gauge,

  notifications:
    Bell,

  activity:
    Clock3,
  "activity-logs":
    Clock3,
  activityLogs:
    Clock3,

  settings:
    Settings,
};

function getIcon(key, IconFromNav) {
  if (iconMap[key]) {
    return iconMap[key];
  }

  return IconFromNav || Activity;
}

export default function AdminSidebar({
  nav = [],
  activeKey,
  onNavigate,
  onExit,
}) {
  const [open, setOpen] = useState(false);

  const go = (key) => {
    if (typeof onNavigate === "function") {
      onNavigate(key);
    }

    setOpen(false);
  };

  return (
    <>
      {/* =====================================================
          MOBILE MENU BUTTON
      ====================================================== */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open admin navigation"
        className="
          lg:hidden
          fixed
          top-4
          left-4
          z-[60]
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-lg
          border
          border-[#E3E7E4]
          bg-white
          text-[#172B43]
          shadow-sm
        "
      >
        <Menu size={20} strokeWidth={1.8} />
      </button>

      {/* =====================================================
          MOBILE OVERLAY
      ====================================================== */}
      {open && (
        <button
          type="button"
          aria-label="Close admin navigation"
          onClick={() => setOpen(false)}
          className="
            lg:hidden
            fixed
            inset-0
            z-[50]
            bg-black/20
          "
        />
      )}

      {/* =====================================================
          SIDEBAR
      ====================================================== */}
      <aside
        className={`
          fixed
          inset-y-0
          left-0
          z-[55]

          w-[244px]

          bg-white

          border-r
          border-[#E3E7E4]

          flex
          flex-col

          transform
          transition-transform
          duration-200
          ease-out

          lg:translate-x-0

          ${
            open
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >
        {/* ===================================================
            BRAND / LOGO
        ==================================================== */}
        <div
          className="
            h-[88px]
            min-h-[88px]

            px-[19px]

            flex
            items-center

            border-b
            border-[#E7EBE8]
          "
        >
          <div className="flex items-center gap-[10px]">
            {/* Shield logo */}
            <div
              className="
                relative
                flex
                h-[34px]
                w-[34px]
                shrink-0
                items-center
                justify-center
                text-[#168447]
              "
            >
              <ShieldPlus
                size={34}
                strokeWidth={2.2}
              />
            </div>

            {/* Brand text */}
            <div className="min-w-0">
              <div
                className="
                  whitespace-nowrap
                  text-[16px]
                  leading-[17px]
                  font-extrabold
                  tracking-[-0.35px]
                  text-[#172B43]
                "
              >
                HYPERLOCAL
              </div>

              <div
                className="
                  mt-[2px]
                  whitespace-nowrap
                  text-[8px]
                  leading-[10px]
                  font-medium
                  tracking-[0.05em]
                  text-[#263B51]
                "
              >
                DISEASE SURVEILLANCE
              </div>
            </div>
          </div>

          {/* Mobile close */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
            className="
              ml-auto
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-md
              text-[#7A8796]
              hover:bg-[#F5F7F6]
              lg:hidden
            "
          >
            <X size={18} strokeWidth={1.8} />
          </button>
        </div>

        {/* ===================================================
            NAVIGATION
        ==================================================== */}
        <nav
          className="
            flex-1
            overflow-y-auto
            overflow-x-hidden

            px-[10px]
            pt-[14px]
            pb-[12px]

            scrollbar-thin
          "
        >
          {nav.map((group, groupIndex) => {
            const items = group.items || [group];

            return (
              <div
                key={
                  group.section ||
                  group.key ||
                  `admin-group-${groupIndex}`
                }
                className={
                  groupIndex === 0
                    ? ""
                    : "mt-[17px]"
                }
              >
                {/* -------------------------------------------
                    SECTION TITLE
                -------------------------------------------- */}
                {group.section && (
                  <div
                    className="
                      px-[10px]
                      mb-[7px]

                      text-[9px]
                      leading-[12px]
                      font-bold
                      uppercase
                      tracking-[0.035em]

                      text-[#168447]
                    "
                  >
                    {group.section}
                  </div>
                )}

                {/* -------------------------------------------
                    NAV ITEMS
                -------------------------------------------- */}
                <div className="space-y-[2px]">
                  {items.map((item) => {
                    const {
                      key,
                      label,
                      icon: IconFromNav,
                    } = item;

                    const Icon = getIcon(
                      key,
                      IconFromNav
                    );

                    const isActive =
                      activeKey === key;

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => go(key)}
                        aria-current={
                          isActive
                            ? "page"
                            : undefined
                        }
                        className={`
                          group

                          w-full
                          h-[34px]

                          flex
                          items-center
                          gap-[10px]

                          rounded-[8px]

                          px-[10px]

                          text-left

                          transition-all
                          duration-150

                          ${
                            isActive
                              ? `
                                bg-[#EAF6EE]
                                text-[#087A36]
                                font-semibold
                              `
                              : `
                                bg-transparent
                                text-[#172B43]
                                font-medium
                                hover:bg-[#F5F8F6]
                                hover:text-[#087A36]
                              `
                          }
                        `}
                      >
                        <Icon
                          size={17}
                          strokeWidth={
                            isActive
                              ? 2
                              : 1.75
                          }
                          className={`
                            shrink-0

                            ${
                              isActive
                                ? "text-[#168447]"
                                : "text-[#24384E] group-hover:text-[#168447]"
                            }
                          `}
                        />

                        <span
                          className="
                            min-w-0
                            truncate
                            text-[11.5px]
                            leading-[15px]
                          "
                        >
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* ===================================================
            LOGOUT AREA
        ==================================================== */}
        <div
          className="
            shrink-0

            px-[10px]
            pb-[11px]
            pt-[9px]

            border-t
            border-[#E7EBE8]
          "
        >
          <button
            type="button"
            onClick={onExit}
            className="
              group

              w-full
              h-[36px]

              flex
              items-center
              gap-[10px]

              px-[10px]

              rounded-[7px]

              border
              border-[#DDE3DE]

              bg-white

              text-left

              text-[11.5px]
              font-medium
              text-[#172B43]

              transition-all
              duration-150

              hover:border-[#C9D5CD]
              hover:bg-[#F8FAF8]
              hover:text-[#087A36]
            "
          >
            <LogOut
              size={17}
              strokeWidth={1.8}
              className="
                shrink-0
                text-[#24384E]
                group-hover:text-[#087A36]
              "
            />

            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}