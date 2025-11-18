// src/components/AdminSidebar.jsx
import { GanttChartSquareIcon, LucideDatabaseBackup, User2 } from "lucide-react";
import { NavLink } from "react-router-dom";

export default function AdminSidebar() {
  const linkClasses = ({ isActive }) =>
    `flex items-center space-x-3 text-semibold text-lg max-sm:inline-flex px-2 py-2 rounded-lg  ${
      isActive ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
    }`;

  return (
    <aside className="w-56 h-svh dark:bg-gray-900 dark:text-gray-200 bg-white border-r border-gray-200 p-4 space-y-2 max-sm:border-b max-sm:w-full max-sm:h-auto max-sm:flex max-xs:gap-2 max-sm:gap-2 max-sm:items-center max-sm:justify-center">
      <h2 className="font-bold  text-lg mb-3 max-sm:flex-1 max-sm:items-center">Admin Dashboard</h2>
      <NavLink to="/admin/users" className={linkClasses}>
        <User2 size={18} /><span>Users</span>
      </NavLink>
      <NavLink to="/admin/groups" className={linkClasses}>
        <GanttChartSquareIcon size={18} /><span>Groups</span>
      </NavLink>
      <NavLink to="/admin/reports" className={linkClasses}>
        <LucideDatabaseBackup size={18} /><span>Reports</span>
      </NavLink>
    </aside>
  );
}
