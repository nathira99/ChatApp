import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { LogOut, User, Settings } from "lucide-react";
import ProfilePage from "../../pages/ProfilePage";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const hideNavbarRoutes = [
    "/chat",
  ];

  const shouldHideNavbar = hideNavbarRoutes.some(
    (route) => 
    location.pathname.startsWith(route)
  );

  if (shouldHideNavbar) return null;

  const goToAdmin = () => {
    navigate("/admin");
    setOpen(false);
  };

  const goToUser = () => {
    navigate("/");
    setOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 shadow">
      <h1 className="text-lg font-semibold text-blue-600">ChatApp</h1>

      <div className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="font-medium text-gray-800 dark:text-gray-200 hover:text-blue-600 flex items-center gap-2"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center font-semibold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          {user.name}
        </button>

        {open && (
          <div className="absolute z-10 right-0 mt-2 bg-white dark:bg-gray-500 shadow-lg rounded-lg py-2 w-40 border border-gray-200 dark:border-gray-600">
            <button
              onClick={goToUser}
              className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
            >
              User View
            </button>

            {user.isAdmin && (
              <button
                onClick={goToAdmin}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
              >
                Admin Panel
              </button>
            )}

            <hr className="my-1 border-gray-300 dark:border-gray-600" />
            <button
            onClick={() => navigate("/profile")}
            className="flex px-3 py-2 items-center gap-2 hover:opacity-90 transition dark:text-gray-200 dark:hover:bg-gray-600"
          >
              <User size={18} /> Profile
            </button>
            <button
            onClick={() => navigate("/settings")}
            className="flex px-3 py-2 items-center gap-2 hover:opacity-90 transition dark:text-gray-200 dark:hover:bg-gray-600"
          >
            <Settings size={18} /> Settings
            </button>
            <button
              onClick={logout}
            className="flex px-3 py-2 items-center text-red-600 gap-2 hover:opacity-90 transition"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
