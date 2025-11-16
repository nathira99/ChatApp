import React, { useEffect, useState } from "react";
import Sidebar from "../components/sidebar/Sidebar";
import ChatWindow from "../components/chat/ChatWindow";
import Navbar from "../components/common/Navbar";
import CreateGroup from "../components/group/CreateGroup";

export default function HomePage() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  useEffect(() => {
    const handler = () => setShowCreateGroup(true);
    document.addEventListener("open-group-modal", handler);
    return () => document.removeEventListener("open-group-modal", handler);
  }, []);

  const handleSelectChat = (chat) => {
    if (!chat) return;

    // If conversation from sidebar contains otherUser, keep other user id
    if (!chat.isGroup && chat.otherUser) {
      setSelectedChat({
        _id: chat.otherUser._id,
        name: chat.otherUser.name,
        email: chat.otherUser.email,
        conversationId: chat._id,
        isGroup: false,
      });
      return;
    }

    // If direct chat shaped differently (search result) - other id might be top level
    if (!chat.isGroup) {
      setSelectedChat({
        _id: chat._id,
        name: chat.name,
        email: chat.email,
        conversationId: chat.conversationId || chat._id,
        isGroup: false,
      });
      return;
    }

    // Group chat
    setSelectedChat({
      _id: chat._id,
      name: chat.name,
      description: chat.description,
      members: chat.members || [],
      admins: chat.admins || [],
      isGroup: true,
    });
  };

  const handleCloseChat = () => setSelectedChat(null);

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* NAVBAR: hide on small screens when a chat is selected */}
      <div className={selectedChat ? "hidden sm:block" : "block"}>
        <Navbar />
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* SIDEBAR
            - On desktop: always visible (sm:block)
            - On mobile: visible full screen when no chat selected
            - When a chat is selected, hide sidebar on mobile
         */}
        <div
          className={`w-72 bg-white dark:bg-gray-800 border-r border-gray-300 h-full z-40
            fixed top-0 left-0 sm:static sm:translate-x-0
            max-sm:w-full
            transition-transform duration-200
            ${selectedChat ? "hidden sm:block" : "block"}
          `}
        >
          <Sidebar onSelectChat={handleSelectChat} />
        </div>

        {/* Mobile overlay when sidebar is open (prevent interaction behind) */}
        {!selectedChat && (
          <div className="sm:hidden inset-0 bg-black/40 z-30 pointer-events-auto" />
        )}

        {/* DESKTOP MAIN AREA */}
        <div className="flex-1 hidden sm:flex items-center justify-center">
          {selectedChat ? (
            <ChatWindow chat={selectedChat} onClose={handleCloseChat} />
          ) : (
            <div className="text-center text-gray-500 w-full">
              <h2 className="text-xl font-semibold mb-2">Welcome to ChatApp</h2>
              <p>Select a conversation to start chatting</p>
            </div>
          )}
        </div>

        {/* MOBILE FULLSCREEN CHAT
            - only render on small screens when a chat is selected
            - this will be fullscreen (Navbar & Sidebar hidden by wrappers above)
        */}
        {selectedChat && (
          <div className="flex-1 sm:hidden">
            <ChatWindow chat={selectedChat} onClose={handleCloseChat} />
          </div>
        )}
      </div>

      {/* CREATE GROUP MODAL */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
            <CreateGroup onClose={() => setShowCreateGroup(false)} />
          </div>
        </div>
      )}
    </div>
  );
}