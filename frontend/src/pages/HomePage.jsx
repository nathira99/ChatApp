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

      <div className={`${activeChat ? "hidden sm-block": "block"} w-72`}>
        {/* Sidebar */}
        {showSidebar && 
        <Sidebar 
        onSelectChat = {handleSelectChat}
        conversation = {conversations}
        setConversations = {setConversations}
        onClose={() => setShowSidebar(false)}
        />
}
      </div>

        {/* Chat Window */}
         <div className="flex-1 bg-gray-50 dark:bg-gray-900 hidden sm:flex items-center justify-center">

        {activeChat ? (
          <ChatWindow chat={activeChat} onClose={handleCloseChat} />
        ) : (
          <div className="text-gray-500 text-center px-4">
            <h2 className="text-xl font-semibold mb-2">Welcome to ChatApp</h2>
            <p className="text-sm">Select a conversation to start chatting</p>
          </div>
        )}

      </div>

      {/* MOBILE CHAT WINDOW */}
      {activeChat && (
        <div className="flex-1 sm:hidden">
          <ChatWindow chat={activeChat} onClose={handleCloseChat} />
        </div>
      )}


      {showCreateGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
            <CreateGroup
              onClose={() => setShowCreateGroup(false)}
              onGroupCreated={(newGroup) => {
                setConversations((prev) => [...prev, newGroup]);
                setShowCreateGroup(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}