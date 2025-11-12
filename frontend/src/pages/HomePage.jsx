import React, { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "../components/sidebar/Sidebar";
import ChatWindow from "../components/chat/ChatWindow";
import Navbar from "../components/common/Navbar";
import CreateGroup from "../components/group/CreateGroup";
import { User, Group } from "lucide-react";

export default function HomePage() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [activeTab, setActiveTab] = useState("users");
  const [groups, setGroups] = useState([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await api.get("/groups", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGroups(res.data);
    } catch (err) {
      console.error("Error fetching groups:", err);
    }
  };

  const handleGroupCreated = (newGroup) => {
    setGroups((prev) => [...prev, newGroup]);
    setShowCreateGroup(false);
  };

  // ✅ Handles both user and group clicks
  const handleSelectChat = (chat) => {
    // Normalize chat structure
    if (chat.isGroup) {
      setSelectedChat({
        _id: chat._id,
        name: chat.name,
        description: chat.description,
        isGroup: true,
      });
    } else {
      setSelectedChat({
        _id: chat._id,
        name: chat.name,
        email: chat.email,
        isGroup: false,
      });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Section */}
        <div className="w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              className={`flex items-center justify-center space-x-2 flex-1 py-2 text-center font-medium ${
                activeTab === "users"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("users")}
            >
              <User size={18} /> <span> Users </span>
            </button>
            <button
              className={`flex items-center justify-center space-x-2 flex-1 py-2 text-center font-medium ${
                activeTab === "groups"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              onClick={() => setActiveTab("groups")}
            >
              <Group size={18} /> <span>Groups</span>
            </button>
          </div>

          {/* User / Group List */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "users" ? (
              <Sidebar onSelectChat={handleSelectChat} />
            ) : (
              <div className="p-3 space-y-3">
                {/* Create Group Button */}
                <button
                  onClick={() => setShowCreateGroup(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition"
                >
                  + Create New Group
                </button>

                {/* Group List */}
                {/* Group List */}
                {groups.length > 0 ? (
                  groups.map((group) => {
                    const unread = group.unreadCount || 0;
                    const isAdmin = group.admins?.some(
                      (a) =>
                        a._id === JSON.parse(localStorage.getItem("user"))?._id
                    );

                    return (
                      <div
                        key={group._id}
                        onClick={() =>
                          handleSelectChat({ ...group, isGroup: true })
                        }
                        className="flex items-center justify-between gap-2 p-3 rounded-lg cursor-pointer transition-all hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <div className="flex items-center gap-3">
                          {group.imageUrl ? (
                            <img
                              src={group.imageUrl}
                              alt={group.name}
                              className="w-10 h-10 rounded-full object-cover border border-gray-300 dark:border-gray-600"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 shadow-sm">
                              {group.name[0]?.toUpperCase() || "G"}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                              {group.name}
                            </p>
                            <div className="flex items-center gap-2">
                              {isAdmin && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 font-semibold">
                                  Admin
                                </span>
                              )}
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate w-40">
                                {group.description || "No description"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Unread badge */}
                        {unread > 0 && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                            {unread > 99 ? "99+" : unread}
                          </span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-gray-500 mt-6">
                    No groups found
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <ChatWindow
              chat={selectedChat}
              onClose={() => setSelectedChat(null)}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center text-gray-500 text-lg">
              Select a {activeTab === "users" ? "user" : "group"} to start
              chatting 💬
            </div>
          )}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg w-full max-w-md">
            <CreateGroup
              onClose={() => setShowCreateGroup(false)}
              onGroupCreated={handleGroupCreated}
            />
          </div>
        </div>
      )}
    </div>
  );
}
