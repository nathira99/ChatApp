import React from "react";

export default function MessageItem({ message, isOwn }) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl text-sm ${
          isOwn
            ? "bg-blue-600 text-white rounded-br-none"
            : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-none"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
