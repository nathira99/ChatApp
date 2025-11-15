// import React, { useEffect, useState } from "react";
// import { Plus, Users, Info } from "lucide-react";
// import { useNavigate } from "react-router-dom";
// import { useSocket } from "../../context/SocketContext";
// import api from "../../services/api";
// import CreateGroup from "../../components/groups/CreateGroup";

// export default function GroupPage() {
//   const navigate = useNavigate();
//   const socket = useSocket();
//   const [groups, setGroups] = useState([]);
//   const [selectedGroup, setSelectedGroup] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [content, setContent] = useState("");
//   const [showCreateGroup, setShowCreateGroup] = useState(false);
//   const [loading, setLoading] = useState(false);

//   // 🧠 Load groups on mount
//   useEffect(() => {
//     loadGroups();
//   }, []);

//   // 🔁 Socket listener for new messages
//   useEffect(() => {
//     if (!socket) return;

//     socket.on("group:message:receive", (msg) => {
//       if (msg.group === selectedGroup?._id) {
//         setMessages((prev) => [...prev, msg]);
//       }
//     });

//     return () => socket.off("group:message:receive");
//   }, [socket, selectedGroup]);

//   // 🟢 Fetch groups
//   const loadGroups = async () => {
//     try {
//       const res = await api.get("/groups");
//       setGroups(res.data);
//     } catch (err) {
//       console.error("Error loading groups:", err);
//     }
//   };

//   // 🟣 Select group
//   const handleSelectGroup = async (group) => {
//     setSelectedGroup(group);
//     setLoading(true);
//     try {
//       socket.emit("join:group", group._id);
//       const res = await api.get(`/groups/${group._id}/messages`);
//       setMessages(res.data);
//     } catch (err) {
//       console.error("Error fetching messages:", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // 💬 Send message
//   const handleSendMessage = async (e) => {
//     e.preventDefault();
//     if (!content.trim()) return;
//     try {
//       const res = await api.post(`/groups/${selectedGroup._id}/messages`, {
//         content,
//       });
//       socket.emit("group:message:send", res.data);
//       setMessages((prev) => [...prev, res.data]);
//       setContent("");
//     } catch (err) {
//       console.error("Send failed:", err);
//     }
//   };

//   // 🧭 Go to group info
//   const openGroupInfo = (groupId) => navigate(`/groups/${groupId}/info`);

//   return (
//     <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100">
//       {/* Sidebar */}
//       <aside className="w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 flex flex-col">
//         <div className="flex items-center justify-between mb-4">
//           <h2 className="text-lg font-semibold">Groups</h2>
//           <button
//             onClick={() => setShowCreateGroup(true)}
//             className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90"
//           >
//             <Plus size={18} />
//           </button>
//         </div>

//         <div className="overflow-y-auto flex-1 space-y-2">
//   {groups.map((group) => (
//     <div
//       key={group._id}
//       onClick={() => handleSelectGroup(group)}
//       className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${
//         selectedGroup?._id === group._id
//           ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
//           : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
//       }`}
//     >
//       {/* Group Avatar */}
//       {group.imageUrl ? (
//         <img
//           src={group.imageUrl}
//           alt={group.name}
//           className="w-10 h-10 rounded-full object-cover border border-white/30"
//         />
//       ) : (
//         <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600">
//           {group.name?.charAt(0)?.toUpperCase() || "G"}
//         </div>
//       )}

//       {/* Group Info */}
//       <div className="flex-1 min-w-0">
//         <p
//           className={`font-medium truncate ${
//             selectedGroup?._id === group._id
//               ? "text-white"
//               : "text-gray-800 dark:text-gray-200"
//           }`}
//         >
//           {group.name}
//         </p>
//         <p
//           className={`text-xs truncate ${
//             selectedGroup?._id === group._id
//               ? "text-gray-200"
//               : "text-gray-500 dark:text-gray-400"
//           }`}
//         >
//           {group.description || "No description"}
//         </p>
//       </div>
//     </div>
//   ))}
// </div>
//       </aside>

//       {/* Main Chat Area */}
//       <main className="flex-1 flex flex-col">
//         {selectedGroup ? (
//           <>
//             <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
//               <div>
//                 <h2 className="text-xl font-bold">{selectedGroup.name}</h2>
//                 <p className="text-sm text-gray-500 dark:text-gray-400">
//                   {selectedGroup.description || "No description"}
//                 </p>
//               </div>
//               <button
//                 onClick={() => openGroupInfo(selectedGroup._id)}
//                 className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition"
//               >
//                 <Info size={20} />
//               </button>
//             </div>

//             <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
//               {loading ? (
//                 <p className="text-center text-gray-500">Loading messages...</p>
//               ) : messages.length > 0 ? (
//                 messages.map((msg) => (
//                   <div
//                     key={msg._id}
//                     className="mb-2 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
//                   >
//                     <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
//                       {msg.sender?.name || "Unknown"}
//                     </p>
//                     <p className="text-gray-700 dark:text-gray-200">
//                       {msg.content}
//                     </p>
//                   </div>
//                 ))
//               ) : (
//                 <p className="text-center text-gray-500 mt-10">
//                   No messages yet.
//                 </p>
//               )}
//             </div>

//             <form
//               onSubmit={handleSendMessage}
//               className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 flex gap-3"
//             >
//               <input
//                 type="text"
//                 value={content}
//                 onChange={(e) => setContent(e.target.value)}
//                 placeholder="Type a message..."
//                 className="flex-1 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
//               />
//               <button
//                 type="submit"
//                 className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition"
//               >
//                 Send
//               </button>
//             </form>
//           </>
//         ) : (
//           <div className="flex-1 flex items-center justify-center text-gray-500">
//             Select a group to start chatting
//           </div>
//         )}
//       </main>

//       {/* Create Group Modal */}
//       {showCreateGroup && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//           <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-md">
//             <CreateGroup
//               onClose={() => setShowCreateGroup(false)}
//               onGroupCreated={(newGroup) => {
//                 setGroups((prev) => [...prev, newGroup]);
//                 setShowCreateGroup(false);
//               }}
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }