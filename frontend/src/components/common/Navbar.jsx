import React, { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";

export default function Navbar() {
  const { logout, user } = useContext(AuthContext);

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center px-6 py-3 shadow-sm">
      <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        ChatApp
      </h1>
      <div className="flex items-center gap-4">
        <span className="text-gray-700 dark:text-gray-200">{user?.name}</span>
        <button
          onClick={logout}
          className="px-3 py-1.5 text-sm bg-gradient-to-r from-red-500 to-red-700 text-white rounded-lg hover:opacity-90 transition"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
