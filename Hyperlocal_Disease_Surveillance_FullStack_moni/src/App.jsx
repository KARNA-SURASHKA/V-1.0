import {
  useState,
} from "react";

import {
  AuthProvider,
} from "./context/AuthContext";

import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import PlatformCapabilities from "./components/PlatformCapabilities";
import Footer from "./components/Footer";

import Login from "./pages/Login";

import UserEntry from "./pages/user/UserEntry";
import UserPortal from "./pages/user/UserPortal";

import AgentPortal from "./pages/agent/AgentPortal";
import AdminPortal from "./pages/admin/AdminPortal";
import MedicalSupervisorPortal from "./pages/medical/MedicalSupervisorPortal";


function AppContent() {

  const [view, setView] =
    useState("landing");

  const [pendingRole, setPendingRole] =
    useState(null);

  const [userInfo, setUserInfo] =
    useState(null);


  // ==========================================================
  // ROLE NAVIGATION
  // ==========================================================

  const goToLogin = (role) => {

    if (role === "user") {
      setView("user-entry");
      return;
    }

    setPendingRole(role);
    setView("login");
  };


  // ==========================================================
  // USER ENTRY
  // ==========================================================

  const handleUserEntry = ({
    username,
    defaultLocation,
  }) => {

    const userData = {
      username,
      defaultLocation,
    };

    setUserInfo(userData);

    /*
     * Store the default location for the current
     * browser session.
     *
     * This is NOT a database user profile yet.
     * Phase 1 user portal is still public/read-only.
     */
    sessionStorage.setItem(
      "kt_user_default_location",
      JSON.stringify(
        defaultLocation
      )
    );

    setView("user");
  };


  // ==========================================================
  // LOGIN
  // ==========================================================

  const handleLoginSuccess = (
    session
  ) => {

    setView(session.role);
  };


  // ==========================================================
  // HOME
  // ==========================================================

  const goHome = () => {

    setView("landing");

    setPendingRole(null);

    setUserInfo(null);

    sessionStorage.removeItem(
      "kt_user_default_location"
    );
  };


  // ==========================================================
  // USER ENTRY
  // ==========================================================

  if (view === "user-entry") {

    return (
      <UserEntry
        onEnter={handleUserEntry}
        onBack={goHome}
      />
    );
  }


  // ==========================================================
  // LOGIN
  // ==========================================================

  if (view === "login") {

    return (
      <Login
        role={pendingRole}
        onSuccess={handleLoginSuccess}
        onBack={goHome}
      />
    );
  }


  // ==========================================================
  // USER PORTAL
  // ==========================================================

  if (
    view === "user" &&
    userInfo
  ) {

    return (
      <UserPortal
        username={
          userInfo.username
        }
        defaultLocation={
          userInfo.defaultLocation
        }
        onExit={goHome}
      />
    );
  }


  // ==========================================================
  // AGENT
  // ==========================================================

  if (view === "agent") {

    return (
      <AgentPortal
        onExit={goHome}
      />
    );
  }


  // ==========================================================
  // MEDICAL SUPERVISOR
  // ==========================================================

  if (view === "medical_supervisor") {

    return (
      <MedicalSupervisorPortal
        onExit={goHome}
      />
    );
  }


  // ==========================================================
  // ADMIN
  // ==========================================================

  if (view === "admin") {

    return (
      <AdminPortal
        onExit={goHome}
      />
    );
  }


  // ==========================================================
  // LANDING
  // ==========================================================

  return (
    <>
      <Navbar
        onSelectRole={goToLogin}
      />

      <Hero
        onSelectRole={goToLogin}
      />

      <PlatformCapabilities />

      <Footer />
    </>
  );
}


function App() {

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}


export default App;