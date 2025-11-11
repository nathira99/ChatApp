import React, { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "../components/sidebar/Sidebar";
import ChatWindow from "../components/chat/ChatWindow";
import Navbar from "../components/common/Navbar";
import CreateGroup from "../components/group/CreateGroup";
import { User,Group } from "lucide-react";

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
                {groups.length > 0 ? (
                  groups.map((group) => (
                    <div
                      key={group._id}
                      onClick={() =>
                        handleSelectChat({ ...group, isGroup: true })
                      }
                      className="p-3 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                      <p className="font-semibold text-gray-800 dark:text-gray-200">
                        {group.name}
                      </p>
                      <p className="text-sm text-gray-500">{group.description}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 mt-6">No groups found</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 flex flex-col">
          {selectedChat ? (
            <ChatWindow chat={selectedChat} onClose={() => setSelectedChat(null)} />
          ) : (
            <div className="flex flex-1 items-center justify-center text-gray-500 text-lg">
              Select a {activeTab === "users" ? "user" : "group"} to start chatting 💬
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
