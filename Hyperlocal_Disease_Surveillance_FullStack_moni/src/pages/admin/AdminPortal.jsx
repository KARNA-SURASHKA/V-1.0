import { useMemo, useState } from "react";

import {
  Activity,
  BarChart3,
  Bell,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  Map,
  MapPinned,
  ScrollText,
  Settings,
  ShieldCheck,
  UserCog,
  UsersRound,
} from "lucide-react";

import AdminLayout from "./AdminLayout";
import AdminDashboard from "./AdminDashboard";

import AgentManagement from "./AgentManagement";

/*
 * IMPORTANT:
 * Your existing working file is SupervisorManagement.jsx.
 * DO NOT change this to MedicalSupervisorManagement.jsx.
 */
import SupervisorManagement from "./SupervisorManagement";

import WeeklyMonitoring from "./WeeklyMonitoring";
import DiseaseReports from "./DiseaseReports";
import NotificationsPanel from "./NotificationsPanel";
import RiskMap from "./RiskMap";
import SettingsPage from "./Settings";
import ActivityLogs from "./ActivityLogs";

/*
 * Roles & Permissions page
 */
import RolesPermissions from "./RolesPermissions";


/* ============================================================
   ADMIN NAVIGATION
   ============================================================ */

const NAV = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },

  {
    section: "PEOPLE & ACCESS",

    items: [
      {
        key: "users",
        label: "User Management",
        icon: UsersRound,
      },

      {
        key: "agents",
        label: "Agent Management",
        icon: UserCog,
      },

      {
        key: "supervisors",
        label: "Medical Supervisor Management",
        icon: UserCog,
      },

      {
        key: "roles",
        label: "Roles & Permissions",
        icon: ShieldCheck,
      },
    ],
  },

  {
    section: "SURVEILLANCE DATA",

    items: [
      {
        key: "reports",
        label: "Report Management",
        icon: FileText,
      },

      {
        key: "monitoring",
        label: "Weekly Monitoring",
        icon: ClipboardCheck,
      },

      {
        key: "risk-map",
        label: "Risk Map",
        icon: MapPinned,
      },

      {
        key: "analytics",
        label: "Analytics",
        icon: BarChart3,
      },
    ],
  },

  {
    section: "LOCATION",

    items: [
      {
        key: "location",
        label: "Location Management",
        icon: Map,
      },
    ],
  },

  {
    section: "SYSTEM",

    items: [
      {
        key: "health",
        label: "System Health",
        icon: Activity,
      },

      {
        key: "notifications",
        label: "Notifications",
        icon: Bell,
      },

      {
        key: "activity",
        label: "Activity Logs",
        icon: ScrollText,
      },

      {
        key: "settings",
        label: "Settings",
        icon: Settings,
      },
    ],
  },
];


/* ============================================================
   ADMIN PORTAL
   ============================================================ */

export default function AdminPortal({ onExit }) {
  /*
   * Current selected admin section
   */
  const [page, setPage] = useState("dashboard");


  /*
   * Current location selection
   */
  const [location, setLocation] = useState({
    state: null,
    district: null,
    taluk: null,
  });


  /*
   * Find currently active navigation item.
   */
  const activePage = useMemo(() => {
    const allItems = NAV.flatMap((group) => {
      if (group.items) {
        return group.items;
      }

      return [group];
    });

    return (
      allItems.find((item) => item.key === page) ||
      allItems[0]
    );
  }, [page]);


  /*
   * Props shared with pages.
   */
  const pageProps = {
    location,
    onNavigate: setPage,
  };


  /* ============================================================
     PAGE ROUTER
     ============================================================ */

  const renderPage = () => {
    switch (page) {

      /* --------------------------------------------------------
         DASHBOARD
         -------------------------------------------------------- */

      case "dashboard":
        return (
          <AdminDashboard
            {...pageProps}
          />
        );


      /* --------------------------------------------------------
         USER MANAGEMENT
         -------------------------------------------------------- */

      case "users":
        return (
          <ComingSoon
            title="User Management"
            description="Manage registered platform users, account status and access."
          />
        );


      /* --------------------------------------------------------
         AGENT MANAGEMENT
         -------------------------------------------------------- */

      case "agents":
        return (
          <AgentManagement
            {...pageProps}
          />
        );


      /* --------------------------------------------------------
         MEDICAL SUPERVISOR MANAGEMENT
         --------------------------------------------------------

         IMPORTANT:

         This MUST remain SupervisorManagement.

         Your project already contains:

         src/pages/admin/SupervisorManagement.jsx

         and that component contains the complete supervisor
         functionality.

         Do NOT change this to MedicalSupervisorManagement.
         -------------------------------------------------------- */

      case "supervisors":
        return (
          <SupervisorManagement
            {...pageProps}
          />
        );


      /* --------------------------------------------------------
         ROLES & PERMISSIONS
         -------------------------------------------------------- */

      case "roles":
        return (
          <RolesPermissions
            {...pageProps}
          />
        );


      /* --------------------------------------------------------
         REPORT MANAGEMENT
         -------------------------------------------------------- */

      case "reports":
        return (
          <DiseaseReports
            {...pageProps}
          />
        );


      /* --------------------------------------------------------
         WEEKLY MONITORING
         -------------------------------------------------------- */

      case "monitoring":
        return (
          <WeeklyMonitoring
            {...pageProps}
          />
        );


      /* --------------------------------------------------------
         RISK MAP
         -------------------------------------------------------- */

      case "risk-map":
        return (
          <RiskMap
            {...pageProps}
          />
        );


      /* --------------------------------------------------------
         ANALYTICS
         -------------------------------------------------------- */

      case "analytics":
        return (
          <ComingSoon
            title="Analytics"
            description="View system-wide administrative analytics."
          />
        );


      /* --------------------------------------------------------
         LOCATION MANAGEMENT
         -------------------------------------------------------- */

      case "location":
        return (
          <ComingSoon
            title="Location Management"
            description="Manage states, districts and taluk configuration."
          />
        );


      /* --------------------------------------------------------
         SYSTEM HEALTH
         -------------------------------------------------------- */

      case "health":
        return (
          <ComingSoon
            title="System Health"
            description="Monitor API services, database, authentication and synchronization."
          />
        );


      /* --------------------------------------------------------
         NOTIFICATIONS
         -------------------------------------------------------- */

      case "notifications":
        return (
          <NotificationsPanel
            {...pageProps}
          />
        );


      /* --------------------------------------------------------
         ACTIVITY LOGS
         -------------------------------------------------------- */

      case "activity":
        return (
          <ActivityLogs
            {...pageProps}
          />
        );


      /* --------------------------------------------------------
         SETTINGS
         -------------------------------------------------------- */

      case "settings":
        return (
          <SettingsPage
            {...pageProps}
          />
        );


      /* --------------------------------------------------------
         FALLBACK
         -------------------------------------------------------- */

      default:
        return (
          <AdminDashboard
            {...pageProps}
          />
        );
    }
  };


  /* ============================================================
     LAYOUT
     ============================================================ */

  return (
    <AdminLayout
      nav={NAV}
      activeKey={page}
      activePage={activePage}
      onNavigate={setPage}
      onExit={onExit}
      location={location}
      onLocationChange={setLocation}
    >
      {renderPage()}
    </AdminLayout>
  );
}


/* ============================================================
   COMING SOON
   ============================================================ */

function ComingSoon({
  title,
  description,
}) {
  return (
    <section className="rounded-[12px] border border-[#E1E8E3] bg-white p-[24px] shadow-[0_2px_7px_rgba(31,49,68,.035)]">

      <h1 className="text-[20px] font-semibold text-[#10243A]">
        {title}
      </h1>

      <p className="mt-[7px] text-[12px] text-[#718096]">
        {description}
      </p>

    </section>
  );
}