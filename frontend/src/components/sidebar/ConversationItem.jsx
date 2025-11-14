import React from "react";
import { formatDistanceToNow } from "date-fns";

export default function ConversationItem({ convo, active, onClick }) {
  const me = JSON.parse(localStorage.getItem("user"))?._id;

  const displayName =
    convo.otherUser?.name || convo.name || "Unknown";

  const isYou = convo.lastMessageSender === me;
  const preview = convo.lastMessage
    ? isYou
      ? `You: ${convo.lastMessage}`
      : convo.lastMessage
    : convo.isGroup
    ? "Group"
    : "No messages yet";

  let timeLabel = "";
  if (convo.lastMessageTime) {
    try {
      timeLabel = formatDistanceToNow(new Date(convo.lastMessageTime), {
        addSuffix: true,
      });
    } catch {}
  }

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
        active ? "bg-gray-200 dark:bg-gray-700" : "hover:bg-gray-100 dark:hover:bg-gray-800"
      }`}
      onClick={onClick}
    >
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600">
        {convo.imageUrl ? (
          <img src={convo.imageUrl} alt={displayName} className="w-full h-full rounded-full" />
        ) : (
          displayName.charAt(0).toUpperCase()
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {displayName}
          </p>
          {timeLabel && (
            <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-2">
              {timeLabel}
            </span>
          )}
        </div>

        <p className="text-xs text-gray-600 dark:text-gray-400 truncate mt-1">
          {preview}
        </p>
      </div>
    </div>
  );
}