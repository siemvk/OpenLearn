"use client";
import { useEffect, useState, createContext, useContext } from "react";

const WSContext = createContext<WebSocket | null>(null);

export function WSProvider({ children }: { children: React.ReactNode }) {
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const baseUrl = `${window.location.protocol === 'https:' ? "wss://" : "ws://"}${window.location.host}`;
      const wsUrl = baseUrl + "/api/v1/ws";
      let attempts = 0;

      const createConnection = () => {
        const socket = new WebSocket(wsUrl);

        socket.addEventListener("open", () => {
          attempts = 0;
        });

        socket.addEventListener("error", (err) => {
          console.error("WebSocket error:", err);

          const reconnect = () => {
            if (attempts < 3) {
              attempts++;
              // Reconnecting... Attempt ${attempts}
              setTimeout(() => {
                const newSocket = createConnection();
                setWs(newSocket);
              }, 1000 * attempts); // Exponential backoff
            } else {
              console.error("Max reconnection attempts reached");
            }
          };
          reconnect();
        });

        socket.addEventListener("close", (event) => {
          // WebSocket connection closed
          // Only attempt to reconnect if it wasn't a clean close
          if (event.code !== 1000 && attempts < 3) {
            attempts++;
            // Connection closed, reconnecting... Attempt ${attempts}
            setTimeout(() => {
              const newSocket = createConnection();
              setWs(newSocket);
            }, 1000 * attempts);
          }
        });

        return socket;
      };

      const socket = createConnection();
      setWs(socket);

      return () => {
        socket.close(1000, "Component unmounting");
      };
    }
  }, []);

  return <WSContext.Provider value={ws}>{children}</WSContext.Provider>;
}

export function useWS() {
  return useContext(WSContext);
}
