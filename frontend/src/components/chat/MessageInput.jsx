import React, { useState, useRef, useEffect } from "react";
import { Send, Paperclip, Smile, Mic, X } from "lucide-react";

export default function MessageInput({ onSend, onTyping, onFileSend }) {
  const [content, setContent] = useState("");
  const [file, setFile] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeout = useRef(null);
  const fileInputRef = useRef(null);

  // Handle typing indicator
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

  // Send message or file
  const handleSend = (e) => {
    e.preventDefault();
    if (!content.trim() && !file) return;

    // Stop typing indicator immediately
    clearTimeout(typingTimeout.current);
    setIsTyping(false);
    onTyping?.(false);

    // File first (so UI remains consistent)
    if (file && onFileSend) {
      onFileSend(file);
      setFile(null);
      fileInputRef.current.value = "";
    }

    // Then text message
    if (content.trim()) {
      onSend?.(content.trim());
      setContent("");
    }
  };

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (selected) setFile(selected);
  };

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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
          <button onClick={removeFile} className="text-red-500 hover:text-red-700 ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSend} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 p-2 rounded-lg">
        
        {/* File picker */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300"
        >
          <Paperclip className="w-5 h-5" />
        </button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
        />

        <button
          type="button"
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300"
        >
          <Smile className="w-5 h-5" />
        </button>

        {/* Message input */}
        <input
          type="text"
          value={content}
          onChange={handleChange}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
        />

        {/* Send button */}
        {content.trim() || file ? (
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 p-2 rounded-full text-white transition"
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
