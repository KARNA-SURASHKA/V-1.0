import {
  useMemo,
  useState,
} from "react";

import {
  Activity,
  BarChart3,
  Bell,
  FileText,
  Home,
  Map,
  ScrollText,
  Settings,
  ShieldCheck,
  UserCog,
} from "lucide-react";

import AdminLayout
  from "./AdminLayout";

import AdminDashboard
  from "./AdminDashboard";

import AgentManagement
  from "./AgentManagement";

import SupervisorManagement
  from "./SupervisorManagement";

import DiseaseReports
  from "./DiseaseReports";

import RiskMap
  from "./RiskMap";

import NotificationsPanel
  from "./NotificationsPanel";

import ActivityLogs
  from "./ActivityLogs";

import SettingsPage
  from "./Settings";

import RolesPermissions
  from "./RolesPermissions";

import WeeklyMonitoring
  from "./WeeklyMonitoring";


/* ============================================================
   REFERENCE SIDEBAR NAVIGATION
============================================================ */

const NAV = [

  {
    key: "dashboard",
    label: "Dashboard",
    icon: Home,
  },


  {
    key: "agents",
    label: "Agent Management",
    icon: UserCog,
  },


  {
    key: "supervisors",
    label:
      "Medical Supervisor Management",
    icon: ShieldCheck,
  },


  {
    key: "reports",
    label: "Report Management",
    icon: FileText,
  },


  {
    key: "risk-map",
    label: "Risk Map",
    icon: Map,
  },


  {
    key: "analytics",
    label: "Analytics",
    icon: BarChart3,
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

];


/* ============================================================
   ADMIN PORTAL
============================================================ */

export default function AdminPortal({
  onExit,
}) {

  const [
    page,
    setPage,
  ] =
    useState(
      "dashboard"
    );


  const [
    location,
    setLocation,
  ] =
    useState({

      state: null,

      district: null,

      taluk: null,

    });


  const activePage =
    useMemo(
      () => {

        return (
          NAV.find(
            (item) =>
              item.key ===
              page
          ) ||
          NAV[0]
        );

      },
      [page]
    );


  const pageProps = {

    location,

    onNavigate:
      setPage,

  };


  const renderPage =
    () => {

      switch (page) {


        /* ================================================
           DASHBOARD
        ================================================ */

        case "dashboard":

          return (
            <AdminDashboard
              {...pageProps}
            />
          );


        /* ================================================
           AGENTS
        ================================================ */

        case "agents":

          return (
            <AgentManagement
              {...pageProps}
            />
          );


        /* ================================================
           SUPERVISORS
        ================================================ */

        case "supervisors":

          return (
            <SupervisorManagement
              {...pageProps}
            />
          );


        /* ================================================
           REPORTS
        ================================================ */

        case "reports":

          return (
            <DiseaseReports
              {...pageProps}
            />
          );


        /* ================================================
           RISK MAP
        ================================================ */

        case "risk-map":

          return (
            <RiskMap
              {...pageProps}
            />
          );


        /* ================================================
           ANALYTICS
        ================================================ */

        case "analytics":

          return (
            <ComingSoon
              title="Analytics"
              description="View system-wide administrative analytics."
            />
          );


        /* ================================================
           NOTIFICATIONS
        ================================================ */

        case "notifications":

          return (
            <NotificationsPanel
              {...pageProps}
            />
          );


        /* ================================================
           ACTIVITY
        ================================================ */

        case "activity":

          return (
            <ActivityLogs
              {...pageProps}
            />
          );


        /* ================================================
           SETTINGS
        ================================================ */

        case "settings":

          return (
            <SettingsPage
              {...pageProps}
            />
          );


        /* ================================================
           FALLBACK
        ================================================ */

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
      onLocationChange={
        setLocation
      }
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

    <section className="admin-coming-soon">

      <h1>
        {title}
      </h1>

      <p>
        {description}
      </p>

    </section>

  );

}