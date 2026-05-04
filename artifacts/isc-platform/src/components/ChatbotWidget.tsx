import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  useSendChatMessage,
  useGetChatHistory,
  getGetChatHistoryQueryKey,
} from "@workspace/api-client-react";
import type { ChatMessage } from "@workspace/api-client-react";
import { useAuth } from "@clerk/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQueryClient } from "@tanstack/react-query";

const GUEST_SESSION_KEY = "isc_chat_guest_session";
const GUEST_HISTORY_KEY = "isc_chat_guest_history";

interface GuestMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function getGuestSessionId(): string {
  let id = sessionStorage.getItem(GUEST_SESSION_KEY);
  if (!id) {
    id = Math.random().toString(36).substring(2, 10);
    sessionStorage.setItem(GUEST_SESSION_KEY, id);
  }
  return id;
}

function loadGuestHistory(): GuestMessage[] {
  try {
    const raw = sessionStorage.getItem(GUEST_HISTORY_KEY);
    return raw ? (JSON.parse(raw) as GuestMessage[]) : [];
  } catch {
    return [];
  }
}

function saveGuestHistory(messages: GuestMessage[]): void {
  sessionStorage.setItem(GUEST_HISTORY_KEY, JSON.stringify(messages));
}

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [guestMessages, setGuestMessages] = useState<GuestMessage[]>([]);
  const sessionIdRef = useRef<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isSignedIn) {
      sessionIdRef.current = getGuestSessionId();
      setGuestMessages(loadGuestHistory());
    } else {
      sessionIdRef.current = Math.random().toString(36).substring(2, 10);
    }
  }, [isSignedIn]);

  const sessionId = sessionIdRef.current || "init";

  const { data: apiHistory, isLoading } = useGetChatHistory(
    { sessionId },
    {
      query: {
        enabled: isOpen && !!isSignedIn && !!sessionId && sessionId !== "init",
        queryKey: getGetChatHistoryQueryKey({ sessionId }),
      },
    }
  );

  const sendMessage = useSendChatMessage();

  const displayMessages: Array<{ id: string; role: string; content: string }> = isSignedIn
    ? (apiHistory ?? []).map((m: ChatMessage) => ({
        id: m.id,
        role: m.role,
        content: m.content,
      }))
    : guestMessages;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayMessages.length]);

  const handleSend = async () => {
    if (!message.trim() || sendMessage.isPending) return;

    const currentMessage = message;
    setMessage("");

    if (!isSignedIn) {
      const userMsg: GuestMessage = {
        id: Date.now().toString(),
        role: "user",
        content: currentMessage,
      };
      const updatedWithUser = [...guestMessages, userMsg];
      setGuestMessages(updatedWithUser);
      saveGuestHistory(updatedWithUser);

      try {
        const response = await sendMessage.mutateAsync({
          data: { message: currentMessage, sessionId: sessionIdRef.current },
        });
        const assistantMsg: GuestMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response.reply,
        };
        const updatedWithBoth = [...updatedWithUser, assistantMsg];
        setGuestMessages(updatedWithBoth);
        saveGuestHistory(updatedWithBoth);
      } catch {
        const errorMsg: GuestMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Désolé, je ne peux pas répondre pour le moment. Veuillez réessayer.",
        };
        const updatedWithError = [...updatedWithUser, errorMsg];
        setGuestMessages(updatedWithError);
        saveGuestHistory(updatedWithError);
      }
      return;
    }

    const previousHistory = queryClient.getQueryData<ChatMessage[]>(
      getGetChatHistoryQueryKey({ sessionId })
    );
    const optimisticUserMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: currentMessage,
      usedAI: false,
      sessionId,
      createdAt: new Date().toISOString(),
    };
    queryClient.setQueryData<ChatMessage[]>(
      getGetChatHistoryQueryKey({ sessionId }),
      [...(previousHistory ?? []), optimisticUserMessage]
    );

    try {
      await sendMessage.mutateAsync({ data: { message: currentMessage, sessionId } });
      queryClient.invalidateQueries({ queryKey: getGetChatHistoryQueryKey({ sessionId }) });
    } catch {
      queryClient.setQueryData<ChatMessage[]>(
        getGetChatHistoryQueryKey({ sessionId }),
        previousHistory ?? []
      );
    }
  };

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl z-50"
          size="icon"
          data-testid="button-open-chat"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-80 shadow-2xl z-50 flex flex-col h-[500px]">
          <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Assistant ISC</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsOpen(false)}
              data-testid="button-close-chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {isSignedIn && isLoading ? (
                <div className="text-center text-sm text-muted-foreground">Chargement...</div>
              ) : displayMessages.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground">
                  Bonjour ! Comment puis-je vous aider ?
                </div>
              ) : (
                displayMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 text-sm ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
          <div className="p-4 border-t flex gap-2">
            <Input
              placeholder="Votre question..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              data-testid="input-chat-message"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={sendMessage.isPending || !message.trim()}
              data-testid="button-send-chat"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}
