import React from "react";
import { useParams } from "react-router-dom";
// import Layout from "../components/layout/Layout"; // if you use a layout wrapper
import ChatWindow from "../components/chat/ChatWindow";

export default function ChatPage() {
  const { userId } = useParams(); // matches /chat/:userId
   const chatData = {
    _id: userId,
    name: "Chat User", // optional placeholder
    isGroup: false,
  };return (<>
      <ChatWindow chat={chatData} />
    </>
  );
}
