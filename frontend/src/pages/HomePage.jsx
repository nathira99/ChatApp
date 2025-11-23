import React, { useEffect, useState } from "react";
import Sidebar from "../components/sidebar/Sidebar";
import ChatWindow from "../components/chat/ChatWindow";
import Navbar from "../components/common/Navbar";
import CreateGroup from "../components/group/CreateGroup";

export default function HomePage() {
  const [activeChat, setActiveChat] = useState(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [showSidebar, setShowSidebar] = useState(true); // mobile control

  useEffect(() => {
    const handler = () => setShowCreateGroup(true);
    document.addEventListener("open-group-modal", handler);
    return () => document.removeEventListener("open-group-modal", handler);
  }, []);

  // ------------------------ SELECT CHAT ------------------------
  const handleSelectChat = (chat) => {
    if (!chat) return;

    // DIRECT CHAT with otherUser object
    if (!chat.isGroup && chat.otherUser) {
      setActiveChat({
        _id: chat.otherUser._id,
        name: chat.otherUser.name,
        email: chat.otherUser.email,
        isGroup: false,
      });
      setShowSidebar(false);
      return;
    }

    // DIRECT CHAT simple
    if (!chat.isGroup) {
      setActiveChat({
        _id: chat._id,
        name: chat.name,
        email: chat.email,
        isGroup: false,
      });
      setShowSidebar(false);
      return;
    }

    // GROUP CHAT
    setActiveChat({
      _id: chat._id,
      name: chat.name,
      description: chat.description,
      members: chat.members || [],
      admins: chat.admins || [],
      isGroup: true,
    });

    setShowSidebar(false);
  };

  // ------------------------ CLOSE CHAT ------------------------
  const handleCloseChat = () => {
    setActiveChat(null);
    setShowSidebar(true);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      
      {/* NAVBAR */}
      <div className={activeChat ? "hidden sm:block" : "block"}>
        <Navbar />
      </div>

      <div className="flex-1 flex overflow-hidden">

        {/* SIDEBAR */}
        <div
          className={`
            w-72 bg-white dark:bg-gray-800 border-r border-gray-300 h-full z-40
            fixed top-0 left-0
            sm:static sm:block sm:pt-16
            max-sm:w-full
            transition-transform duration-200
            ${activeChat ? "hidden sm:block" : "block"}
          `}
        >
          <Sidebar
            onSelectChat={handleSelectChat}
            conversations={conversations}
            setConversations={setConversations}
            onClose={() => setShowSidebar(false)}
          />
        </div>

        {/* BACKDROP — mobile, when sidebar open (optional) */}
        {!activeChat && (
          <div className="sm:hidden inset-0 bg-black/40 z-30 pointer-events-auto" />
        )}

        {/* SINGLE CHATWINDOW — WORKS FOR ALL SCREEN SIZES */}
        <div className="flex-1 overflow-hidden">
          {activeChat ? (
            <ChatWindow chat={activeChat} onClose={handleCloseChat} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">Welcome to ChatApp</h2>
                <p>Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ------------------ CREATE GROUP MODAL ------------------ */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <CreateGroup
              onClose={() => setShowCreateGroup(false)}
              onGroupCreated={(g) => {
                const newGroup = {
                  _id: g._id,
                  name: g.name,
                  description: g.description,
                  members: g.members || [],
                  admins: g.admins || [],
                  isGroup: true,
                };
                setConversations((prev) => [...prev, newGroup]);
                setActiveChat(newGroup);
                setShowSidebar(false);
                setShowCreateGroup(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
