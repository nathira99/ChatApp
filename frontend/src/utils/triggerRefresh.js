export const triggerRefresh = (socket) => {
  if (!socket) return;
  socket.emit("users:refresh");
  socket.emit("groups:refresh");
};
