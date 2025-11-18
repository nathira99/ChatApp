// src/pages/admin/AdminDashboard.jsx
import { Outlet } from "react-router-dom";
import AdminSidebar from "../../components/AdminSidebar";
import Navbar from "../../components/common/Navbar";
export default function AdminDashboard() {
  return (
    <>
      <Navbar className="fixed top-0 left-0 right-0" />
      <div className="dark:bg-gray-900 dark:text-gray-200 flex fixed top-16 left-0 right-0 h-svh max-sm:flex-col sm:fixed sm:top-16 sm:left-0 sm:right-0 items-center justify-center">
      <AdminSidebar />
      <main className="flex-1 p-6 overflow-y-scroll">
        <Outlet />
      </main>
      </div>
      </>
  );
}
