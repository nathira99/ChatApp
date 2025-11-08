import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export const useSocket = () => {
  const socket = useRef(null);

  useEffect(() => {
    socket.current = io("http://localhost:5000", {
      withCredentials: true,
      transports: ["websocket"],
    });

    socket.current.on("connect", () => {
      console.log("🟢 Connected to Socket:", socket.current.id);
    });

    socket.current.on("disconnect", () => {
      console.log("🔴 Disconnected from Socket");
    });

    return () => {
      socket.current.disconnect();
    };
  }, []);

  return socket.current;
};
