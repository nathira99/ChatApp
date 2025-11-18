import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { addGroupMember, removeGroupMember, getGroupDetails } from "../../services/groupService";
import api from "../../services/api";

export default function GroupInfo() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [customReason, setCustomReason] = useState("");
  const [selectedReason, setSelectedReason] = useState("");
  const [reporting, setReporting] = useState(false);
  const [msg, setMsg] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/groups/${id}`);
        setGroup(res.data);
      } catch (err) {
        console.error("Error loading group:", err);
        setMsg({ type: "error", text: "Unable to load group." });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // ✅ Handle search input
  const handleSearch = async (value) => {
    setSearchValue(value);
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await api.get(`/users/search?query=${value}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSearchResults(res.data || []);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setSearchLoading(false);
    }
  };

  // ✅ Add member
  const handleAddMember = async (userId) => {
    try {
      const res = await addGroupMember(group._id, userId);
      alert(res.message || "Member added successfully");
      setSearchResults([]);
      setSearchValue("");
      const updated = await api.get(`/groups/${group._id}`);
      setGroup(updated.data);
    } catch (err) {
      console.error("Add member failed:", err);
      alert("Failed to add member.");
    }
  };

  // ✅ Remove member
  const handleRemoveMember = async (userId) => {
    if (!window.confirm("Remove this member from group?")) return;
    try {
      const res = await removeGroupMember(group._id, userId);
      alert(res.message || "Member removed.");
      const updated = await api.get(`/groups/${group._id}`);
      setGroup(updated.data);
    } catch (err) {
      console.error("Remove member failed:", err);
      setMsg({ type: "error", text: "Failed to remove member." });
    }
  };

  // ✅ Exit group
const handleExitGroup = async () => {
  if (!window.confirm("Exit this group?")) return;
  try {
    await api.post(`/groups/${group._id}/exit`);
    // ✅ Immediately remove this group from sidebar (local update)
    const existingGroups = JSON.parse(localStorage.getItem("groups") || "[]");
    const updatedGroups = existingGroups.filter((g) => g._id !== group._id);
    localStorage.setItem("groups", JSON.stringify(updatedGroups));

    // ✅ Optionally re-fetch from server for accuracy
    // await getGroups();

    navigate("/"); // move back to main view
  } catch (err) {
    console.error("Error exiting group:", err);
    setMsg({ type: "error", text: "Failed to exit group." });
  }
};

  // ✅ Report group
  const handleReport = async () => {
    if (!selectedReason && !customReason.trim()) {
      alert("Please select or enter a reason.");
      return;
    }
    setReporting(true);
    try {
      const reason = selectedReason || customReason;
      await api.post("/reports", { groupId: group._id, reason });
      alert("Report submitted successfully.");
      setShowReportModal(false);
      setSelectedReason("");
      setCustomReason("");
    } catch (err) {
      console.error("Error submitting report:", err);
      alert("Failed to submit report.");
    } finally {
      setReporting(false);
    }
  };

  const isAdmin = group?.admins?.some((a) => a._id === user?._id);
  const isCreator = group?.creator?._id === user?._id;

  if (loading)
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading group...</p>
      </div>
    );

  if (!group)
    return (
      <div className="p-6">
        <p className="text-red-500">Group not found.</p>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto p-6 dark:bg-slate-700">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-blue-600 hover:underline"
      >
        ← Back
      </button>

      <div className="bg-white dark:bg-gray-800 dark:text-gray-200 rounded-xl shadow p-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center text-2xl font-semibold">
            {group.name?.charAt(0)?.toUpperCase() || "G"}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              {group.name}
            </h2>
            <p className="text-sm text-gray-500">
              {group.description || "No description"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Created by: {group.creator?.name || "Unknown"}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => {
                if (window.confirm("Delete group permanently?"))
                  api.delete(`/groups/${group._id}`).then(() => navigate("/"));
              }}
              className="px-3 py-2 bg-red-600 text-white rounded-lg"
            >
              Delete Group
            </button>
          )}
        </div>

        {/* Members */}
        <div className="mt-6">
          <h3 className="font-medium text-gray-700 dark:text-gray-300">
            Members
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {group.members?.map((m) => (
              <div
                key={m._id}
                className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-full"
              >
                <div className="w-8 h-8 rounded-full bg-blue-400 text-white flex items-center justify-center text-sm font-semibold">
                  {m.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="text-sm">{m.name}</div>
                {isAdmin && m._id !== user._id && (
                  <button
                    onClick={() => handleRemoveMember(m._id)}
                    className="ml-2 text-red-600 text-xs"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add members (admins only) */}
        {isAdmin && (
          <div className="p-4 mt-6 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
              Add Members
            </h2>

            <input
              type="text"
              placeholder="Search user by name..."
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-3 py-2 mb-3 border rounded-lg text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"
            />

            {searchLoading && (
              <p className="text-sm text-gray-500">Searching...</p>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <div
                    key={user._id}
                    className="flex justify-between items-center p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                  >
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-200">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-100">{user.email}</p>
                    </div>
                    <button
                      onClick={() => handleAddMember(user._id)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Exit or Report */}
        {!isAdmin && (
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleExitGroup}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
            >
              Exit Group
            </button>
            {!isCreator && (
              <button
                onClick={() => setShowReportModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Report Group
              </button>
            )}
          </div>
        )}
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">
              Report Group
            </h3>
            <p className="text-sm text-gray-500 mb-3">
              Select a reason for reporting this group:
            </p>

            <div className="space-y-2 mb-3">
              {[
                "Spam or fake activity",
                "Hate speech or harassment",
                "Sharing inappropriate content",
                "Privacy violation",
              ].map((reason) => (
                <label
                  key={reason}
                  className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                  />
                  {reason}
                </label>
              ))}
            </div>

            <textarea
              placeholder="Add other reason (optional)"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              rows={3}
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-3 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                disabled={reporting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg"
              >
                {reporting ? "Submitting..." : "Submit Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}