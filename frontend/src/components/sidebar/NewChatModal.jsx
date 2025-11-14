// components/sidebar/NewChatModal.jsx
import React, { useEffect, useState } from "react";
import { searchUsers, createConversation } from "../../services/chatService";
import { useAuth } from "../../hooks/useAuth";

export default function NewChatModal({ onClose, onConversationCreated }) {
  const { user } = useAuth(); // ← your logged-in user
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔍 Live Search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const t = setTimeout(async () => {
      setLoading(true);
      try {
        let users = await searchUsers(query);

        // 🚫 Remove myself from results
        users = users.filter((u) => u._id !== user._id);

        setResults(users);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(t);
  }, [query, user]);

  // ▶ Start Chat
  const startChat = async (u) => {
    try {
      const convo = await createConversation(u._id);
      onConversationCreated(convo);
      onClose();
    } catch (err) {
      console.error("Create conversation failed", err);
      alert(err?.response?.data?.message || "Failed to start chat");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md p-4 rounded-lg shadow-lg">

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Start New Chat
          </h3>
          <button onClick={onClose} className="text-gray-500">✕</button>
        </div>

        {/* Search */}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or email…"
          className="w-full px-3 py-2 rounded-md border bg-gray-50 dark:bg-gray-700"
        />

        {/* Results */}
        <div className="mt-3 max-h-48 overflow-y-auto space-y-2">
          {loading && <p className="text-sm text-gray-500">Searching…</p>}

          {!loading && query.trim() && results.length === 0 && (
            <p className="text-sm text-gray-500">No users found</p>
          )}

          {results.map((u) => (
            <div
              key={u._id}
              className="flex items-center justify-between p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <div>
                <p className="text-sm font-medium">{u.name}</p>
                <p className="text-xs text-gray-500">{u.email}</p>
              </div>

              <button
                onClick={() => startChat(u)}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
              >
                Chat
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}