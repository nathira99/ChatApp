import React, { useEffect, useRef } from "react";
import MessageItem from "./MessageItem";

export default function MessageList({ messages, currentUserId }) {
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((msg) => (
        <MessageItem
          key={msg._id}
          message={msg}
          isOwn={msg.sender._id === currentUserId}
        />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
