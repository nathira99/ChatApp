import React, { useEffect, useState } from "react";
import api from "../services/api";
import Sidebar from "../components/sidebar/Sidebar";
import ChatWindow from "../components/chat/ChatWindow";
import Navbar from "../components/common/Navbar";
import CreateGroup from "../components/group/CreateGroup";

export default function HomePage() {
  const [selectedChat, setSelectedChat] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [activeChat, setActiveChat] = useState(null);
  
  useEffect(() => {
    const handler = () => setShowCreateGroup(true);
    document.addEventListener("open-group-modal", handler);
    return () => document.removeEventListener("open-group-modal", handler);
  })
  const handleSelectChat = (chat) => {
  if (!chat) return;

  setActiveChat(chat);
  setShowSidebar(false);

  // If it's a direct chat with "otherUser" structure
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

  // If it's a direct chat (from search or sidebar)
  if (!chat.isGroup) {
    setSelectedChat({
      _id: chat._id,
      name: chat.name,
      email: chat.email,
      isGroup: false,
    });
    return;
  }

  // If it's a group chat
  setSelectedChat({
    _id: chat._id,
    name: chat.name,
    description: chat.description,
    members: chat.members,
    admins: chat.admins,
    isGroup: true,
  });
};

  const handleCloseChat = () => {
    setActiveChat(null);
    setShowSidebar(true);
  }
  
  const handleMessageUpdate = (chatId, lastMessage, isSender) => {
    setConversations(prev => 
      prev.map(c => 
        c.otherUser._id === chatId 
        ? {
          ...c, 
          lastMessage: (isSender ? "You: " : "" ) + lastMessage,
        }
        : c
      )
    );
  } 
return (
  <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">

    <Navbar />

    <div className="flex flex-1 overflow-hidden">

      {/* SIDEBAR */}
      <div className={`w-72 h-full bg-white dark:bg-gray-800 border-r
        ${activeChat ? "hidden sm:block" : "block"}`}>
        <Sidebar 
          onSelectChat={handleSelectChat}
          conversation={conversations}
          setConversations={setConversations}
        />
      </div>

      {/* DESKTOP CHAT WINDOW */}
      <div className="flex-1 hidden sm:flex">
        {activeChat ? (
          <ChatWindow chat={activeChat} onClose={handleCloseChat} />
        ) : (
          <div className="flex flex-1 items-center justify-center text-gray-500">
            <div className="text-center">
              <h2 className="text-xl font-semibold">Welcome to ChatApp</h2>
              <p>Select a chat to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* MOBILE FULL SCREEN CHAT */}
      {activeChat && (
        <div className="flex-1 sm:hidden">
          <ChatWindow chat={activeChat} onClose={handleCloseChat} />
        </div>
      )}
    </div>
  </div>
);
}