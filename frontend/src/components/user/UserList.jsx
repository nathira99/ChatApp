import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { User } from "lucide-react"; // optional user icon
import SearchBar from "../common/SearchBar";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const navigate = useNavigate();

  // ✅ Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/users");
        setUsers(res.data);
        setFilteredUsers(res.data);
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchUsers();
  }, []);

  // ✅ Search filter
  const handleSearch = (query) => {
    if (!query) return setFilteredUsers(users);
    const lower = query.toLowerCase();
    setFilteredUsers(
      users.filter(
        (u) =>
          u.name.toLowerCase().includes(lower) ||
          u.email.toLowerCase().includes(lower)
      )
    );
  };

  // ✅ Navigate to selected user chat
  const handleSelectUser = (userId) => {
    navigate(`/chat/${userId}`);
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        Users
      </h2>

      <SearchBar onSearch={handleSearch} placeholder="Search users..." />

      <div className="mt-3 space-y-2 overflow-y-auto max-h-[70vh]">
        {filteredUsers.map((user) => (
          <div
            key={user._id}
            onClick={() => handleSelectUser(user._id)}
            className="flex items-center gap-3 p-3 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition"
          >
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
            </div>
          </div>
        ))}

        {filteredUsers.length === 0 && (
          <p className="text-center text-gray-500 mt-4">No users found</p>
        )}
      </div>
    </div>
  );
};

export default UserList;
