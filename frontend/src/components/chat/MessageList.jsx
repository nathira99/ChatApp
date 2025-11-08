import React, { useEffect, useRef } from "react";
import MessageItem from "./MessageItem";
import { formatDate, formatTime } from "../../utils/formatDate";

export default function MessageList({ messages, currentUserId }) {
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const grouped = messages.reduce((acc, msg) => {
    const dateLabel = formatDate(msg.createdAt || msg.timestamp);
    if (!acc[dateLabel]) acc[dateLabel] = [];
    acc[dateLabel].push(msg);
    return acc;
  }, {});

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
      {Object.entries(grouped).map(([dateLabel, msgs]) => (
        <div key={dateLabel}>
          <div className="text-center my-3 text-gray-500 text-sm font-medium">
            {dateLabel}
          </div>

          {msgs.map((msg) => {
            const isOwn = msg.sender?._id === currentUserId;
            return (
              <div
                key={msg._id || msg.tempId}
                className={`flex ${
                  isOwn ? "justify-end" : "justify-start"
                } mb-2`}
              >
                <div
                  className={`max-w-xs md:max-w-md px-3 py-2 rounded-xl shadow-sm ${
                    isOwn
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  }`}
                >
                  <p className="break-words">{msg.content}</p>
                  <span
                    className={`text-[10px] ${
                      isOwn ? "text-blue-100" : "text-gray-500"
                    } text-right`}
                  >
                    {formatTime(msg.createdAt || msg.timestamp)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
