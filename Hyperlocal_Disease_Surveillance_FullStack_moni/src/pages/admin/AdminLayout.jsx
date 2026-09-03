import { useState } from "react";

import AdminSidebar from "../../components/admin/AdminSidebar";
import AdminHeader from "../../components/admin/AdminHeader";
import AdminLocationSelector from "../../components/admin/AdminLocationSelector";

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
  ] = useState(false);

  return (
    <div className="min-h-screen bg-[#FCFAF6] text-[#10243A]">

      <AdminSidebar
        nav={nav}
        activeKey={activeKey}
        onNavigate={onNavigate}
        onExit={onExit}
      />

      <main className="min-h-screen lg:ml-[244px]">

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

        <div className="px-[20px] py-[42px]">

          <div className="mx-auto w-full max-w-[1254px]">

            {children}

          </div>

        </div>

      </main>

    </div>
  );
}