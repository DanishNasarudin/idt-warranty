/**
 * Socket.IO Provider
 * Client-side context provider for Socket.IO connection management
 */

"use client";

import {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from "react";
import { io as ClientIO, Socket } from "socket.io-client";

type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
  isOutdated: boolean;
  isFocus: boolean;
  setIsFocus: Dispatch<SetStateAction<boolean>>;
};

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  isOutdated: false,
  isFocus: false,
  setIsFocus: () => {},
});

export const useSocket = () => {
  return useContext(SocketContext);
};

const hostname =
  process.env.NODE_ENV !== "production"
    ? "http://localhost:3000"
    : process.env.NEXT_PUBLIC_APP_URL || "";

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isOutdated, setIsOutdated] = useState(false);
  const [socketId, setSocketId] = useState("");
  const [isFocus, setIsFocus] = useState(false);

  useEffect(() => {
    // Prevent multiple socket instances
    let socketInstance: Socket | null = null;

    const initSocket = () => {
      // Check if we already have a socket instance
      if (socketInstance?.connected) {
        console.log("[Socket.IO Client] Already connected, skipping init");
        return;
      }

      socketInstance = ClientIO(hostname, {
        path: "/api/socket/io",
        addTrailingSlash: false,
        transports: ["polling"], // Use polling only like the working app
      });

      socketInstance.on("connect", () => {
        setIsConnected(true);
        setSocketId(socketInstance?.id || "");
        console.log("[Socket.IO Client] Connected:", socketInstance?.id);
      });

      socketInstance.on("disconnect", (reason) => {
        setIsConnected(false);
        console.log("[Socket.IO Client] Disconnected:", reason);
      });

      socketInstance.on("connect_error", (err: any) => {
        console.error("[Socket.IO Client] Connection error:", err.message);
        setIsConnected(false);
      });

      // Version checking
      const clientVersion = process.env.NEXT_PUBLIC_APP_VERSION;

      socketInstance.on("version-check", (data: any) => {
        socketInstance?.emit("client-version", { clientVersion });
      });

      socketInstance.on("refresh-client", () => {
        setIsOutdated(true);
      });

      setSocket(socketInstance);
    };

    initSocket();

    return () => {
      console.log("[Socket.IO Client] Cleaning up socket connection");
      if (socketInstance) {
        socketInstance.removeAllListeners();
        socketInstance.disconnect();
        socketInstance = null;
      }
    };
  }, []); // Empty dependency array - only run once

  // Handle active socket cleanup (for multi-tab scenarios)
  useEffect(() => {
    if (socket === null) return;

    if (typeof window !== "undefined") {
      const activeId = window.localStorage.getItem("activeSocket");

      if (!activeId && socketId !== "") {
        window.localStorage.setItem("activeSocket", socketId);
      } else if (activeId && activeId !== socketId) {
        // Clear previous socket's state
        socket.emit("clear-client", { activeSocket: activeId });
        window.localStorage.setItem("activeSocket", socketId);
      }
    }
  }, [socketId, socket]);

  return (
    <SocketContext.Provider
      value={{ socket, isConnected, isOutdated, isFocus, setIsFocus }}
    >
      {children}
    </SocketContext.Provider>
  );
};
