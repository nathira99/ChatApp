// import React, { useEffect, useState, useContext } from "react";
// import { useSocket } from "../../context/SocketContext";
// import { AuthContext } from "../../context/AuthContext";
// import api from "../../services/api";
// import MessageList from "./MessageList";
// import MessageInput from "./MessageInput";

// export default function GroupChatWindow({ group }) {
//   const { socket, onlineUsers } = useSocket();
//   const { user } = useContext(AuthContext);
//   const [messages, setMessages] = useState([]);
//   const [typingUsers, setTypingUsers] = useState([]);

//   useEffect(() => {
//     if (!group) return;
//     fetchMessages();

//     socket.emit("user:online", user._id);
//     socket.emit("join:group", group._id);

//     socket.on("group:message:receive", (msg) => {
//       if (msg.group === group._id) setMessages((prev) => [...prev, msg]);
//     });

//     socket.on("group:typing:start", (typingUser) => {
//       if (typingUser._id !== user._id) {
//         setTypingUsers((prev) => [...new Set([...prev, typingUser.name])]);
//       }
//     });

//     socket.on("group:typing:stop", (typingUser) => {
//       setTypingUsers((prev) =>
//         prev.filter((name) => name !== typingUser.name)
//       );
//     });

//     return () => {
//       socket.emit("leave:group", group._id);
//       socket.off("group:message:receive");
//       socket.off("group:typing:start");
//       socket.off("group:typing:stop");
//     };
//   }, [group, socket]);

//   const fetchMessages = async () => {
//     try {
//       const res = await api.get(`/messages/group/${group._id}`);
//       setMessages(res.data);
//     } catch (err) {
//       console.error("Error fetching group messages:", err);
//     }
//   };

//   const handleSend = async (content) => {
//     if (!content.trim()) return;
//     try {
//       const res = await api.post(`/messages/group/${group._id}`, { content });
//       socket.emit("group:message:send", res.data);
//       setMessages((prev) => [...prev, res.data]);
//     } catch (err) {
//       console.error("Error sending message:", err);
//     }
//   };

//   const handleTyping = (isTyping) => {
//     if (isTyping)
//       socket.emit("group:typing", { groupId: group._id, user });
//     else socket.emit("group:stopTyping", { groupId: group._id, user });
//   };

//   const onlineCount = group.members.filter((m) =>
//     onlineUsers.includes(m._id)
//   ).length;

//   return (
//     <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
//       {/* Header */}
//       <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800">
//         <div className="flex items-center gap-3">
//           <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center font-semibold">
//             {group.name.charAt(0).toUpperCase()}
//           </div>
//           <div>
//             <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
//               {group.name}
//             </h2>
//             <p className="text-xs text-gray-500">
//               🟢 {onlineCount} online
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* Messages */}
//       <MessageList messages={messages} currentUserId={user._id} />

//       {/* Typing indicator */}
//       {typingUsers.length > 0 && (
//         <div className="px-4 text-sm italic text-gray-500 animate-pulse">
//           {typingUsers.join(", ")} {typingUsers.length > 1 ? "are" : "is"} typing...
//         </div>
//       )}

//       {/* Input */}
//       <MessageInput onSend={handleSend} onTyping={handleTyping} />
//     </div>
//   );
// }
