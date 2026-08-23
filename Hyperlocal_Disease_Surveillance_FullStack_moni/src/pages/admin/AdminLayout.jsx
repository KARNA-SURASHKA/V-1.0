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
  return (
    <div className="min-h-screen bg-[#FCFAF6] text-[#1F3144] flex">

      <AdminSidebar
        nav={nav}
        activeKey={activeKey}
        onNavigate={onNavigate}
        onExit={onExit}
      />

      <main className="min-w-0 flex-1 lg:ml-[248px]">

        <AdminHeader
          activePage={activePage}
          onExit={onExit}
        />

        <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1500px] mx-auto">

          <AdminLocationSelector
            value={location}
            onChange={onLocationChange}
          />

          <div className="mt-6">
            {children}
          </div>

        </div>

      </main>

    </div>
  );
}