import React, { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Smile, Mic, X } from "lucide-react";

export default function MessageInput({ onSend, onTyping, onFileSend }) {
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const typingTimeout = useRef(null);
  const fileInputRef = useRef(null);

  // ✅ Handle typing indicator
  const handleChange = (e) => {
    const value = e.target.value;
    setContent(value);

    if (!isTyping) {
      setIsTyping(true);
      onTyping?.(true);
    }

    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      setIsTyping(false);
      onTyping?.(false);
    }, 1500);
  };

  // ✅ Handle send text message
  const handleSend = (e) => {
    e.preventDefault();
    if (!content.trim() && !file) return;

    if (file && onFileSend) {
      onFileSend(file);
      setFile(null);
      fileInputRef.current.value = "";
    }

    if (content.trim()) {
      onSend?.(content.trim());
      setContent("");
    }

    onTyping?.(false);
    setIsTyping(false);
  };

  // ✅ Handle file selection
  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (selected) setFile(selected);
  };

  // ✅ Remove file
  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ✅ Cleanup typing timeout
  useEffect(() => {
    return () => clearTimeout(typingTimeout.current);
  }, []);

  return (
    <div className="w-full border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
      {/* File Preview */}
      {file && (
        <div className="mb-2 flex items-center justify-between bg-blue-50 dark:bg-gray-700 p-2 rounded-lg">
          <span className="text-sm text-gray-700 dark:text-gray-200 truncate">
            📎 {file.name}
          </span>
          <button
            onClick={removeFile}
            className="text-red-500 hover:text-red-700 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input Row */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 p-2 rounded-lg"
      >
        {/* File Upload */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300"
          disabled={uploading}
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,video/*,.pdf,.doc,.docx"
        />

        {/* Emoji Button (Optional placeholder) */}
        <button
          type="button"
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300"
        >
          <Smile className="w-5 h-5" />
        </button>

        {/* Text Input */}
        <input
          type="text"
          value={content}
          onChange={handleChange}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
        />

        {/* Send Button / Mic */}
        {content.trim() || file ? (
          <button
            type="submit"
            disabled={uploading}
            className="bg-blue-600 hover:bg-blue-700 p-2 rounded-full text-white transition disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300"
          >
            <Mic className="w-5 h-5" />
          </button>
        )}
      </form>
    </div>
  );
}
