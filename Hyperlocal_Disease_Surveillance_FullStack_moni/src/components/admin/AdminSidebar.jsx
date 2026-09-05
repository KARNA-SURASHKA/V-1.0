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

import {
  useState,
} from "react";


const iconMap = {

  dashboard:
    Home,

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
    ShieldCheck,

  "medical-supervisor-management":
    ShieldCheck,

  medicalSupervisorManagement:
    ShieldCheck,

  roles:
    ShieldCheck,

  permissions:
    ShieldCheck,

  "roles-permissions":
    ShieldCheck,

  reports:
    FileText,

  "report-management":
    FileText,

  monitoring:
    CalendarDays,

  "weekly-monitoring":
    CalendarDays,

  "risk-map":
    Map,

  risk:
    Map,

  analytics:
    Activity,

  location:
    MapPin,

  "location-management":
    MapPin,

  health:
    Gauge,

  "system-health":
    Gauge,

  notifications:
    Bell,

  activity:
    Clock3,

  "activity-logs":
    Clock3,

  settings:
    Settings,

};


function getIcon(
  key,
  IconFromNav
) {

  return (
    iconMap[key] ||
    IconFromNav ||
    Activity
  );

}


export default function AdminSidebar({
  nav = [],
  activeKey,
  onNavigate,
  onExit,
}) {

  const [
    open,
    setOpen,
  ] =
    useState(false);


  const go =
    (key) => {

      if (
        typeof onNavigate ===
        "function"
      ) {

        onNavigate(key);

      }

      setOpen(false);

    };


  return (

    <>

      {/* MOBILE MENU */}

      <button
        type="button"
        onClick={() =>
          setOpen(true)
        }
        aria-label="Open admin navigation"
        className="admin-mobile-menu"
      >

        <Menu
          size={21}
          strokeWidth={1.8}
        />

      </button>


      {/* MOBILE OVERLAY */}

      {open && (

        <button
          type="button"
          aria-label="Close admin navigation"
          onClick={() =>
            setOpen(false)
          }
          className="admin-sidebar-overlay"
        />

      )}


      {/* SIDEBAR */}

      <aside
        className={`
          admin-sidebar
          ${
            open
              ? "admin-sidebar-open"
              : ""
          }
        `}
      >


        {/* =================================================
            BRAND
        ================================================= */}

        <div className="admin-sidebar-brand">

          <div className="admin-brand-mark">

            <ShieldPlus
              size={36}
              strokeWidth={2.1}
            />

          </div>


          <div className="admin-brand-text">

            <strong>
              HYPERLOCAL
            </strong>

            <span>
              DISEASE SURVEILLANCE
            </span>

          </div>


          <button
            type="button"
            className="admin-sidebar-close"
            onClick={() =>
              setOpen(false)
            }
          >

            <X size={19} />

          </button>

        </div>


        {/* =================================================
            NAVIGATION
        ================================================= */}

        <nav className="admin-sidebar-nav">

          {nav.map(
            (group, groupIndex) => {

              const items =
                group.items ||
                [group];


              return (

                <div
                  key={
                    group.section ||
                    group.key ||
                    groupIndex
                  }
                  className={`
                    admin-nav-group
                    ${
                      groupIndex > 0
                        ? "admin-nav-group-spaced"
                        : ""
                    }
                  `}
                >

                  {group.section && (

                    <div className="admin-nav-section-title">

                      {group.section}

                    </div>

                  )}


                  <div className="admin-nav-items">

                    {items.map(
                      (item) => {

                        const Icon =
                          getIcon(
                            item.key,
                            item.icon
                          );


                        const isActive =
                          activeKey ===
                          item.key;


                        return (

                          <button
                            key={
                              item.key
                            }
                            type="button"
                            onClick={() =>
                              go(
                                item.key
                              )
                            }
                            className={`
                              admin-nav-item
                              ${
                                isActive
                                  ? "active"
                                  : ""
                              }
                            `}
                          >

                            <Icon
                              size={19}
                              strokeWidth={
                                isActive
                                  ? 2
                                  : 1.7
                              }
                            />


                            <span>
                              {
                                item.label
                              }
                            </span>


                            {item.key ===
                              "notifications" && (

                              <span className="admin-nav-badge">
                                7
                              </span>

                            )}

                          </button>

                        );

                      }
                    )}

                  </div>

                </div>

              );

            }
          )}

        </nav>


        {/* =================================================
            LOGOUT
        ================================================= */}

        <div className="admin-sidebar-footer">

          <button
            type="button"
            className="admin-logout"
            onClick={onExit}
          >

            <LogOut
              size={19}
              strokeWidth={1.7}
            />

            <span>
              Logout
            </span>

          </button>

        </div>

      </aside>

    </>

  );

}