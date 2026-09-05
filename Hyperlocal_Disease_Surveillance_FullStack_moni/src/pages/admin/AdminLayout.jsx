import {
  useState,
} from "react";

import AdminSidebar
  from "../../components/admin/AdminSidebar";

import AdminHeader
  from "../../components/admin/AdminHeader";

import AdminLocationSelector
  from "../../components/admin/AdminLocationSelector";


export default function AdminLayout({
  nav,
  activeKey,
  activePage,
  onNavigate,
  onExit,
  location,
  onLocationChange,
  children,
}) {

  const [
    locationOpen,
    setLocationOpen,
  ] =
    useState(false);


  return (

    <div className="admin-shell">


      <AdminSidebar
        nav={nav}
        activeKey={activeKey}
        onNavigate={onNavigate}
        onExit={onExit}
      />


      <main className="admin-main">


        <AdminHeader
          activePage={activePage}
          location={location}
          onOpenLocation={() =>
            setLocationOpen(true)
          }
        />


        <AdminLocationSelector
          value={location}
          onChange={onLocationChange}
          open={locationOpen}
          onClose={() =>
            setLocationOpen(false)
          }
        />


        <div className="admin-content">

          <div className="admin-content-inner">

            {children}

          </div>

        </div>

      </main>

    </div>

  );

}