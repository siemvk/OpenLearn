"use client";

import { Send, Trash2 } from "lucide-react";
import { GroupChatContent } from "./page";
import { useWS } from "@/components/ws-provider";
import { toast } from "react-toastify";
import React, { useEffect } from "react";
import { formatRelativeTime } from "@/utils/formatRelativeTime";
import { usePathname } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Button1 from "@/components/button/Button1";
import Jdenticon from "@/components/Jdenticon";

export type ChatSendMessage = {
  event: "chat";
  group: string;
  message: string;
};

export default function Chat({
  chatContent,
  isAdmin
}: {
  chatContent: GroupChatContent[];
  isAdmin: boolean;
}) {
  const path = usePathname();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const websocket = useWS();
  const [inputValue, setInputValue] = React.useState("");
  const [messages, setMessages] =
    React.useState<GroupChatContent[]>(chatContent);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [messageToDelete, setMessageToDelete] =
    React.useState<GroupChatContent | null>(null);
  // Ref for the messages container div
  const messagesContainerRef = React.useRef<HTMLDivElement>(null);
  // Only scroll to bottom when a new message is added (not when deleted)
  const prevMessagesRef = React.useRef<GroupChatContent[]>(messages);
  useEffect(() => {
    const prev = prevMessagesRef.current;
    // Scroll if a message was added (length increased or last message changed)
    if (
      messages.length > prev.length ||
      (messages.length &&
        prev.length &&
        messages[messages.length - 1]?.time !== prev[prev.length - 1]?.time)
    ) {
      const container = messagesContainerRef.current;
      if (container && container.scrollHeight > container.clientHeight) {
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      }
    }
    prevMessagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    container!.scrollTo({ top: container!.scrollHeight });

    if (!websocket) return;

    const subscribeToPage = () => {
      websocket.send(
        JSON.stringify({
          event: "subscribe",
          page: path,
        })
      );
    };

    // Handle incoming messages
    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "chat-message") {
          setMessages((prev) => [...prev, data.message]);
        }
        if (data.type === "chat-message-deleted") {
          setMessages((prev) =>
            prev.filter(
              (m) =>
                !(
                  m.time === data.time &&
                  m.creator === data.creator &&
                  m.content === data.content
                )
            )
          );
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    // Always subscribe on mount or path change
    let openListenerAdded = false;
    if (websocket.readyState === WebSocket.OPEN) {
      subscribeToPage();
    } else {
      const handleOpen = () => {
        subscribeToPage();
      };
      websocket.addEventListener("open", handleOpen);
      openListenerAdded = true;
    }

    websocket.addEventListener("message", handleMessage);

    // Cleanup both listeners if added
    return () => {
      websocket.removeEventListener("message", handleMessage);
      if (openListenerAdded) {
        websocket.removeEventListener("open", subscribeToPage);
      }

      if (websocket.readyState === WebSocket.OPEN) {
        websocket.send(
          JSON.stringify({
            event: "unsubscribe",
            page: path,
          })
        );
      }
    };
  }, [websocket, path]);

  return (
    <div className="ml-0 md:ml-2 w-full flex flex-col items-center justify-center px-2 md:px-0">
      <div className="w-full md:w-130 flex flex-col">
        <div
          className="overflow-y-auto max-h-80 md:max-h-80 w-full"
          ref={messagesContainerRef}
        >
          {messages.length === 0 ? (
            <div className="text-neutral-400 text-center p-4 md:p-6 rounded-lg text-sm md:text-base">
              Er zijn nog geen berichten in deze groepschat.
            </div>
          ) : (
            messages.map((chatItem, i) => (
              <div
                key={i}
                className="mb-3 md:mb-4 p-2 md:p-3 bg-neutral-800 rounded-lg flex justify-between items-start md:items-center gap-2"
              >
                <div className="flex items-start md:items-center gap-2 md:gap-3 min-w-0 flex-1">
                  {chatItem.creatorImage ? (
                    <img
                      src={chatItem.creatorImage}
                      alt={chatItem.creator + "'s profielfoto"}
                      className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border border-neutral-700 shrink-0"
                    />
                  ) : (
                    <Jdenticon
                      value={chatItem.creator}
                      size={32}
                      className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs md:text-sm text-neutral-400 mb-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="truncate font-medium">{chatItem.creator}</span>
                      <span className="hidden sm:inline">-</span>
                      <span className="text-xs">{formatRelativeTime(new Date(chatItem.time))}</span>
                    </div>
                    <div className="text-sm md:text-base text-neutral-200 wrap-break-word">{chatItem.content}</div>
                  </div>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => {
                      setMessageToDelete(chatItem);
                      setDeleteDialogOpen(true);
                    }}
                    className="text-red-400 hover:text-red-300 p-1.5 md:p-2 rounded hover:bg-red-900/20 z-10 transition-all shrink-0"
                    title="Verwijderen"
                  >
                    <Trash2 size={16} className="md:w-[18px] md:h-[18px]" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <input
            type="text"
            className="p-2 bg-neutral-800 rounded-lg w-full text-sm md:text-base"
            placeholder="Typ een nieuw bericht..."
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <Send
            className={`text-neutral-200 transition-colors w-5 h-5 md:w-6 md:h-6 shrink-0 ${!inputValue.trim()
              ? "opacity-50 cursor-not-allowed"
              : "hover:text-neutral-400 cursor-pointer"
              }`}
            onClick={() => {
              if (!websocket || websocket.readyState !== WebSocket.OPEN) {
                toast.error(
                  "WebSocket verbinding is niet beschikbaar. Je kunt momenteel geen berichten versturen."
                );
                return;
              }
              const message = inputValue.trim();
              if (!message) {
                return; // Don't send empty messages
              }
              websocket.send(
                JSON.stringify({
                  event: "chat",
                  group: path.split("/")[3],
                  message: message,
                })
              );
              setInputValue("");
            }}
          />
        </div>
      </div>
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px] z-110">
          <DialogHeader>
            <DialogTitle>Bevestig verwijdering</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je dit bericht wilt verwijderen? Dit kan niet
              ongedaan gemaakt worden.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 mt-4">
            <Button1
              onClick={() => setDeleteDialogOpen(false)}
              text="Annuleren"
            />
            <Button1
              onClick={() => {
                if (websocket && messageToDelete) {
                  websocket.send(
                    JSON.stringify({
                      event: "delete-chat-message",
                      group: path.split("/")[3],
                      time: messageToDelete.time,
                      creator: messageToDelete.creator,
                      content: messageToDelete.content,
                    })
                  );
                }
                setDeleteDialogOpen(false);
              }}
              text="Verwijderen"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
