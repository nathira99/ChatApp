import React, { useEffect, useRef, useState } from "react";
import { formatTime } from "../../utils/formatDate";

export default function MessageList({ messages, currentUserId }) {
  const bottomRef = useRef(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const renderFile = (msg) => {
    if (!msg.fileUrl) return null;

    const backend = import.meta.env.VITE_SOCKET_URL;

    const fileUrl = msg.fileUrl.startsWith("http")
      ? msg.fileUrl
      : `${backend}${msg.fileUrl}`;

    const isImage = msg.fileType?.startsWith("image/");
    const isVideo = msg.fileType?.startsWith("video/");
    const isAudio =
      msg.fileType?.startsWith("audio/") ||
      /\.(mp3|wav|m4a|ogg|opus)$/i.test(msg.fileUrl);
    const isDoc = !isImage && !isVideo && !isAudio;

    const getFileSize = (size) => {
      if (!size) return "";
      const kb = size / 1024;
      return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(1)} MB`;
    };

    return (
      <div className="mt-2">
        {/* 🖼️ Image */}
        {isImage && (
          <img
            src={fileUrl}
            alt="shared"
            onClick={() => setPreview(fileUrl)}
            className="max-w-[220px] max-h-[180px] object-cover cursor-pointer rounded-lg border border-gray-200 hover:opacity-90 transition"
          />
        )}

        {/* 🎬 Video */}
        {isVideo && (
          <div
            className="relative cursor-pointer rounded-lg border border-gray-200 overflow-hidden hover:opacity-90 transition"
            onClick={() => setPreview(fileUrl)}
          >
            <video
              src={fileUrl}
              className="w-[220px] h-[160px] object-cover pointer-events-none"
              muted
              playsInline
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
              <span className="text-white text-3xl">▶</span>
            </div>
          </div>
        )}

        {/* 🎧 Audio */}
        {isAudio && (
          <div
            className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg border border-gray-300 dark:border-gray-600 max-w-[220px] cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            onClick={() => setPreview(fileUrl)}
          >
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 flex items-center justify-center bg-purple-600 text-white rounded-full">
                🎧
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm text-gray-800 dark:text-gray-200 truncate max-w-[130px]">
                  {msg.fileName || "Audio File"}
                </p>
                {msg.fileSize ? (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {(msg.fileSize / 1024 / 1024).toFixed(1)} MB
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-0.5">Unknown size</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 📄 Document */}
        {isDoc && (
          <div
            onClick={() => window.open(fileUrl, "_blank")}
            className="flex items-center gap-3 bg-gray-100 dark:bg-gray-700 p-3 rounded-lg border border-gray-300 dark:border-gray-600 max-w-[220px] cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white font-semibold rounded-md">
              {msg.fileType?.split("/")[1]?.toUpperCase().slice(0, 3) || "DOC"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm text-gray-800 dark:text-gray-200 truncate max-w-[130px]">
                {msg.fileName || "Document"}
              </p>
              {msg.fileSize && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {getFileSize(msg.fileSize)}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const grouped = messages.reduce((acc, msg) => {
    const date = new Date(msg.createdAt).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {});

  return (
    <>
      <div className="flex-1 overflow-y-auto px-2 pb-2 bg-gray-50 dark:bg-gray-900">
        {Object.entries(grouped).map(([date, msgs]) => (
          <div key={date}>
            <div className="text-center my-3">
              <span className="text-xs text-gray-500 bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full">
                {date}
              </span>
            </div>

            {msgs.map((msg) => {
              const isOwn = msg.sender?._id === currentUserId;
              return (
                <div
                  key={msg._id || msg.tempId}
                  className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-2xl shadow-sm ${
                      isOwn
                        ? "bg-blue-600 text-white rounded-br-none"
                        : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none"
                    }`}
                  >
                    {msg.group && !isOwn && msg.sender?.name && (
                      <p className="text-xs text-gray-300 mb-1">{msg.sender.name}</p>
                    )}
                    {msg.content && <p className="break-words">{msg.content}</p>}
                    {renderFile(msg)}
                    <p
                      className={`text-[10px] mt-1 text-right ${
                        isOwn ? "text-gray-200" : "text-gray-400"
                      }`}
                    >
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* 🔍 Preview Modal */}
      {preview && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setPreview(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            {/\.(mp4|mov|avi|mkv)$/i.test(preview) ? (
              <video src={preview} controls className="rounded-lg max-h-[90vh]" />
            ) : /\.(mp3|wav|m4a|ogg|opus)$/i.test(preview) ? (
              <div className="bg-gray-900 p-6 rounded-lg flex flex-col items-center justify-center max-w-md">
                <audio
                  src={preview}
                  controls
                  className="w-full"
                  preload="metadata"
                  onLoadedData={(e) =>
                    e.target.play().catch(() => console.warn("Autoplay blocked"))
                  }
                />
                <p className="text-white text-sm mt-2">Playing audio file...</p>
              </div>
            ) : (
              <img
                src={preview}
                alt="preview"
                className="rounded-lg max-h-[90vh] object-contain"
              />
            )}
            <button
              onClick={() => setPreview(null)}
              className="absolute top-2 right-2 text-white bg-black bg-opacity-50 hover:bg-opacity-80 p-2 rounded-full"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
