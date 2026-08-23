import { useMemo, useState } from "react";

import {
  LayoutDashboard,
  ClipboardCheck,
  FileText,
  MapPinned,
  Users,
  BrainCircuit,
  BellRing,
  Settings,
  ScrollText,
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
    section: "SURVEILLANCE",
    items: [
      {
        key: "monitoring",
        label: "Weekly Monitoring",
        icon: ClipboardCheck,
      },
      {
        key: "reports",
        label: "Disease Reports",
        icon: FileText,
      },
      {
        key: "risk-map",
        label: "Risk Map",
        icon: MapPinned,
      },
    ],
  },

  {
    section: "MANAGEMENT",
    items: [
      {
        key: "agents",
        label: "Agents",
        icon: Users,
      },
    ],
  },

  {
    section: "PREDICTIONS",
    items: [
      {
        key: "predictions",
        label: "Prediction Management",
        icon: BrainCircuit,
      },
    ],
  },

  {
    section: "COMMUNICATION",
    items: [
      {
        key: "notifications",
        label: "Notifications",
        icon: BellRing,
      },
    ],
  },

  {
    section: "SYSTEM",
    items: [
      {
        key: "settings",
        label: "Settings",
        icon: Settings,
      },
      {
        key: "activity",
        label: "Activity Logs",
        icon: ScrollText,
      },
    ],
  },
];

export default function AdminPortal({ onExit }) {
  const [page, setPage] = useState("dashboard");

  const [location, setLocation] = useState({
    state: null,
    district: null,
    taluk: null,
  });

  /*
   * Convert the grouped NAV structure into one flat list
   * so we can easily find the currently active page.
   */
  const activePage = useMemo(() => {
    const allItems = NAV.flatMap((group) =>
      group.items || [group]
    );

    return (
      allItems.find((item) => item.key === page) ||
      allItems[0]
    );
  }, [page]);

  /*
   * Location selector updates this state.
   * Every Admin page receives the same location context.
   */
  const handleLocationChange = (nextLocation) => {
    setLocation(nextLocation);
  };

  /*
   * Props shared with all Admin pages.
   */
  const pageProps = {
    location,
    onNavigate: setPage,
  };

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return <AdminDashboard {...pageProps} />;

      case "agents":
        return <AgentManagement {...pageProps} />;

      case "monitoring":
        return <WeeklyMonitoring {...pageProps} />;

      case "reports":
        return <DiseaseReports {...pageProps} />;

      case "risk-map":
        return <RiskMap {...pageProps} />;

      case "predictions":
        return <PredictionManagement {...pageProps} />;

      case "notifications":
        return <NotificationsPanel {...pageProps} />;

      case "settings":
        return <SettingsPage {...pageProps} />;

      case "activity":
        return <ActivityLogs {...pageProps} />;

      default:
        return <AdminDashboard {...pageProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFAF6]">
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
    </div>
  );
}