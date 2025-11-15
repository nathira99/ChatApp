import React from "react";
import { formatDistanceToNow, isToday } from "date-fns";

function formatMessageTime(timestamp) {
  if (!timestamp) return "";

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 60) {
    return formatDistanceToNow(date, { addSuffix: true });
  }

  if (isToday(date)) {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  }

  return `${date.getDate().toString().padStart(2, "0")}/${
    (date.getMonth() + 1).toString().padStart(2, "0")
  }/${date.getFullYear()}`;
}

export default function ConversationItem({ convo, active, onClick }) {
  const me = JSON.parse(localStorage.getItem("user"))?._id;
  const isAdmin = convo.isGroup && convo.admins.includes(me);

  const displayName = convo.isGroup
    ? convo.name
    : convo.otherUser?.name || "Unknown";

  const isYou = String(convo.lastMessageSender) === String(me);

  let previewText = "No messages yet";

  if (convo.lastMessage) {
    if (convo.isGroup) {
      previewText = isYou
        ? `You: ${convo.lastMessage}`
        : `${convo.lastMessageSenderName || "Other"}:${convo.lastMessage}`;
    } else {
      previewText = isYou
        ? `You: ${convo.lastMessage}`
        : convo.lastMessage;
    }
  }

  const timeLabel = convo.lastMessageTime
    ? formatMessageTime(convo.lastMessageTime)
    : "";

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
        active
          ? "bg-gray-200 dark:bg-gray-700"
          : "hover:bg-gray-100 dark:hover:bg-gray-800"
      }`}
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center font-semibold">
        {displayName?.charAt(0)?.toUpperCase() || "?"}
      </div>

      {/* Name + last msg */}
      <div className="flex-1 min-w-0 items-center">
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
          {displayName}

          {isAdmin && (
            <span className="text-[10px] bg-blue-500 text-white px-1 ml-1 rounded">
              Admin
            </span>
          )}
        </p>

        <p className="text-xs text-gray-500 dark:text-gray-300 truncate mt-1">
          {previewText}
        </p>
      </div>

      {/* Time */}
      {timeLabel && (
        <p className="text-[10px] text-gray-400 whitespace-nowrap">
          {timeLabel}
        </p>
      )}
    </div>
  );
}