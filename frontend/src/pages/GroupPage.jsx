// import React, { useEffect, useState } from "react";
// import { Plus } from "lucide-react";
// import api from "../services/api";
// import { useSocket } from "../context/SocketContext";
// import CreateGroup from "../components/groups/CreateGroup";

// export default function GroupPage() {
//   const socket = useSocket();
//   const [groups, setGroups] = useState([]);
//   const [selectedGroup, setSelectedGroup] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [content, setContent] = useState("");
//   const [showCreateGroup, setShowCreateGroup] = useState(false);

//   useEffect(() => {
//     fetchGroups();
//   }, []);

//   useEffect(() => {
//     if (!socket) return;

//     socket.on("group:message:receive", (msg) => {
//       if (msg.group === selectedGroup?._id) {
//         setMessages((prev) => [...prev, msg]);
//       }
//     });

//     return () => socket.off("group:message:receive");
//   }, [socket, selectedGroup]);

//   const fetchGroups = async () => {
//     try {
//       const res = await api.get("/groups");
//       setGroups(res.data);
//     } catch (err) {
//       console.error("Error fetching groups:", err);
//     }
//   };

//   const handleSelectGroup = async (group) => {
//     setSelectedGroup(group);
//     socket.emit("join:group", group._id);

//     try {
//       const res = await api.get(`/messages/group/${group._id}`);
//       setMessages(res.data);
//     } catch (err) {
//       console.error("Error loading group messages:", err);
//     }
//   };

//   const handleSendMessage = async (e) => {
//     e.preventDefault();
//     if (!content.trim()) return;

//     const token = localStorage.getItem("token");
//     const msg = {
//       content,
//       group: selectedGroup._id,
//     };

//     try {
//       await api.post("/messages/group", msg, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       socket.emit("group:message:send", msg);
//       setMessages((prev) => [...prev, msg]);
//       setContent("");
//     } catch (err) {
//       console.error("Error sending message:", err);
//     }
//   };

//   return (
//     <div className="flex h-full bg-gray-50 dark:bg-gray-900">
//       {/* Sidebar */}
//       <aside className="w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4 flex flex-col">
//         <div className="flex items-center justify-between mb-4">
//           <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
//             Groups
//           </h2>
//           <button
//             onClick={() => setShowCreateGroup(true)}
//             className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//           >
//             <Plus size={18} />
//           </button>
//         </div>

//         <div className="overflow-y-auto flex-1 space-y-2">
//           {groups.map((group) => (
//             <div
//               key={group._id}
//               className={`p-3 rounded-lg cursor-pointer transition ${
//                 selectedGroup?._id === group._id
//                   ? "bg-blue-600 text-white"
//                   : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
//               }`}
//               onClick={() => handleSelectGroup(group)}
//             >
//               <p className="font-medium">{group.name}</p>
//               <p className="text-sm opacity-75">{group.description}</p>
//             </div>
//           ))}
//         </div>
//       </aside>

//       {/* Chat Area */}
//       <main className="flex-1 flex flex-col">
//         {selectedGroup ? (
//           <>
//             <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
//               <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
//                 {selectedGroup.name}
//               </h2>
//               <p className="text-sm text-gray-500 dark:text-gray-400">
//                 {selectedGroup.description}
//               </p>
//             </div>

//             <div className="flex-1 p-4 overflow-y-auto space-y-2 bg-gray-50 dark:bg-gray-900">
//               {messages.map((msg, i) => (
//                 <div
//                   key={i}
//                   className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
//                 >
//                   <p className="text-gray-800 dark:text-gray-200">{msg.content}</p>
//                 </div>
//               ))}
//             </div>

//             <form
//               onSubmit={handleSendMessage}
//               className="p-4 border-t border-gray-200 dark:border-gray-700 flex gap-3 bg-white dark:bg-gray-800"
//             >
//               <input
//                 type="text"
//                 value={content}
//                 onChange={(e) => setContent(e.target.value)}
//                 placeholder="Type a message..."
//                 className="flex-1 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
//               />
//               <button
//                 type="submit"
//                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
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
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
//             <CreateGroup
//               onClose={() => setShowCreateGroup(false)}
//               onGroupCreated={(g) => {
//                 setGroups((prev) => [...prev, g]);
//                 setShowCreateGroup(false);
//               }}
//             />
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
