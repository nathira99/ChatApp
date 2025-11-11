import React, { useState } from "react";

const SettingsPage = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="p-6 max-w-xl mx-auto bg-white dark:bg-gray-900 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Settings
      </h2>

      <div className="space-y-4">
        {/* Theme */}
        <div className="flex items-center justify-between border-b pb-3">
          <p className="text-gray-700 dark:text-gray-300">Dark Mode</p>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={darkMode}
              onChange={() => setDarkMode(!darkMode)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer-checked:bg-blue-600 transition-all"></div>
            <span className="ml-2 text-sm text-gray-500">
              {darkMode ? "On" : "Off"}
            </span>
          </label>
        </div>

        {/* Notifications */}
        <div className="flex items-center justify-between border-b pb-3">
          <p className="text-gray-700 dark:text-gray-300">Notifications</p>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notifications}
              onChange={() => setNotifications(!notifications)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-300 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer-checked:bg-blue-600 transition-all"></div>
            <span className="ml-2 text-sm text-gray-500">
              {notifications ? "On" : "Off"}
            </span>
          </label>
        </div>

        {/* Logout */}
        <button className="w-full py-2 bg-gradient-to-r from-red-500 to-red-700 text-white rounded-lg hover:opacity-90 transition">
          De-Activate Account
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
