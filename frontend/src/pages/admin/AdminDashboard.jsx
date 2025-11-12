// src/pages/admin/AdminDashboard.jsx
import { Outlet } from "react-router-dom";
import AdminSidebar from "../../components/AdminSidebar";
import Navbar from "../../components/common/Navbar";
export default function AdminDashboard() {
  return (
    <>
      <Navbar className="fixed top-0 left-0 right-0" />
      <div className="flex max-sm:flex-col items-center justify-center">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </main>
      </div>
      </>
  );
}
