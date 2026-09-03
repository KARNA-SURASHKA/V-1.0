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
import WeeklyMonitoring from "./WeeklyMonitoring";
import DiseaseReports from "./DiseaseReports";
import PredictionManagement from "./PredictionManagement";
import NotificationsPanel from "./NotificationsPanel";
import RiskMap from "./RiskMap";
import SettingsPage from "./Settings";
import ActivityLogs from "./ActivityLogs";

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

export default function AdminPortal({
  onExit,
}) {
  const [page, setPage] =
    useState("dashboard");

  const [location, setLocation] =
    useState({
      state: null,
      district: null,
      taluk: null,
    });

  const activePage = useMemo(() => {
    const items = NAV.flatMap(
      (group) =>
        group.items || [group]
    );

    return (
      items.find(
        (item) => item.key === page
      ) || items[0]
    );
  }, [page]);

  const pageProps = {
    location,
    onNavigate: setPage,
  };

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return (
          <AdminDashboard
            {...pageProps}
          />
        );

      case "agents":
        return (
          <AgentManagement
            {...pageProps}
          />
        );

      case "monitoring":
        return (
          <WeeklyMonitoring
            {...pageProps}
          />
        );

      case "reports":
        return (
          <DiseaseReports
            {...pageProps}
          />
        );

      case "risk-map":
        return (
          <RiskMap
            {...pageProps}
          />
        );

      case "notifications":
        return (
          <NotificationsPanel
            {...pageProps}
          />
        );

      case "activity":
        return (
          <ActivityLogs
            {...pageProps}
          />
        );

      case "settings":
        return (
          <SettingsPage
            {...pageProps}
          />
        );

      case "users":
        return (
          <ComingSoon
            title="User Management"
            description="Manage registered platform users, account status and access."
          />
        );

      case "supervisors":
        return (
          <ComingSoon
            title="Medical Supervisor Management"
            description="Manage medical supervisor accounts and district assignments."
          />
        );

      case "roles":
        return (
          <ComingSoon
            title="Roles & Permissions"
            description="Control platform roles and administrator access permissions."
          />
        );

      case "location":
        return (
          <ComingSoon
            title="Location Management"
            description="Manage states, districts and taluk configuration."
          />
        );

      case "health":
        return (
          <ComingSoon
            title="System Health"
            description="Monitor API services, database, authentication and synchronization."
          />
        );

      case "analytics":
        return (
          <ComingSoon
            title="Analytics"
            description="View system-wide administrative analytics."
          />
        );

      default:
        return (
          <AdminDashboard
            {...pageProps}
          />
        );
    }
  };

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