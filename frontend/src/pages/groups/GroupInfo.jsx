import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { groupService } from "../../services/groupService";
import { useAuth } from "../../hooks/useAuth";
import { Trash2, LogOut, UserMinus } from "lucide-react";

export default function GroupInfo() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGroup();
  }, []);

  const loadGroup = async () => {
    try {
      const data = await groupService.getGroupDetails(id);
      setGroup(data);
    } catch (err) {
      console.error("Error loading group:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (memberId) => {
    if (!window.confirm("Remove this member?")) return;
    await groupService.removeMember(id, memberId);
    loadGroup();
  };

  const handleExit = async () => {
    if (!window.confirm("Exit this group?")) return;
    await groupService.exitGroup(id);
    navigate("/");
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this group?")) return;
    await groupService.deleteGroup(id);
    navigate("/");
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Loading group...
      </div>
    );

  if (!group) return <div className="text-center mt-10">Group not found</div>;

  const isCreator = group.creator?._id === user._id;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
          {group.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{group.name}</h1>
          <p className="text-gray-500">{group.description || "No description"}</p>
          <p className="text-sm text-gray-400 mt-1">
            Created by: {group.creator?.name || "Unknown"}
          </p>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-4">
        <h2 className="text-lg font-semibold mb-2">Members</h2>
        <ul className="space-y-2">
          {group.members.map((m) => (
            <li
              key={m._id}
              className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-700 rounded-lg"
            >
              <span>{m.name}</span>
              {(isCreator || group.admins.some((a) => a._id === user._id)) &&
                m._id !== user._id && (
                  <button
                    onClick={() => handleRemove(m._id)}
                    className="text-red-600 hover:text-red-800 flex items-center gap-1 text-sm"
                  >
                    <UserMinus size={14} /> Remove
                  </button>
                )}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        {isCreator ? (
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2"
          >
            <Trash2 size={16} /> Delete Group
          </button>
        ) : (
          <button
            onClick={handleExit}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg flex items-center gap-2"
          >
            <LogOut size={16} /> Exit Group
          </button>
        )}
      </div>
    </div>
  );
}
