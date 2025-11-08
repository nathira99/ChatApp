import React from "react";
import Navbar from "../common/Navbar";
import Sidebar from "../sidebar/Sidebar";

/**
 * Layout component wraps all pages (chat, profile, settings)
 * with a Navbar on top and Sidebar on the left.
 */
const Layout = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
        <Sidebar />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Navbar */}
        <Navbar />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
