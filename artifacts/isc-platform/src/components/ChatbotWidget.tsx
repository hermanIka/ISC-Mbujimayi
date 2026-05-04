import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { MessageCircle, X, Send, Bot, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  useSendChatMessage,
  useGetChatHistory,
  getGetChatHistoryQueryKey,
} from "@workspace/api-client-react";
import type { ChatMessage } from "@workspace/api-client-react";
import { useAuth, useUser } from "@clerk/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQueryClient } from "@tanstack/react-query";

const GUEST_SESSION_KEY = "isc_chat_guest_session";
const GUEST_HISTORY_KEY = "isc_chat_guest_history";

interface GuestMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  usedAI?: boolean;
  pendingEscalation?: boolean;
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

interface DisplayMessage {
  id: string;
  role: string;
  content: string;
  usedAI?: boolean;
  pendingEscalation?: boolean;
}

export function ChatbotWidget() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [guestMessages, setGuestMessages] = useState<GuestMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [pendingEscalationMessage, setPendingEscalationMessage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isSignedIn) {
      setGuestMessages(loadGuestHistory());
    }
  }, [isSignedIn]);

  const sessionId = isSignedIn && clerkUser?.id
    ? `user-${clerkUser.id}`
    : getGuestSessionId();

  const { data: apiHistory, isLoading } = useGetChatHistory(
    { sessionId },
    {
      query: {
        enabled: isOpen && !!isSignedIn && !!clerkUser?.id,
        queryKey: getGetChatHistoryQueryKey({ sessionId }),
      },
    }
  );

  const sendMessage = useSendChatMessage();

  const displayMessages: DisplayMessage[] = isSignedIn
    ? (apiHistory ?? []).map((m: ChatMessage) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        usedAI: m.usedAI ?? false,
      }))
    : guestMessages;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayMessages.length, isTyping, pendingEscalationMessage]);

  const sendRaw = async (msgText: string, currentMessages: GuestMessage[]) => {
    const response = await sendMessage.mutateAsync({ data: { message: msgText, sessionId } });
    return response;
  };

  const appendGuestMessage = (msg: GuestMessage, base: GuestMessage[]) => {
    const next = [...base, msg];
    setGuestMessages(next);
    saveGuestHistory(next);
    return next;
  };

  const handleEscalateConfirm = async () => {
    if (!pendingEscalationMessage) return;
    setPendingEscalationMessage(null);
    const escalateText = `__escalate__:${pendingEscalationMessage}`;

    if (!isSignedIn) {
      setIsTyping(true);
      try {
        const response = await sendRaw(escalateText, guestMessages);
        const assistantMsg: GuestMessage = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response.reply,
          usedAI: response.usedAI ?? true,
        };
        appendGuestMessage(assistantMsg, guestMessages);
      } catch {
        const errMsg: GuestMessage = { id: (Date.now() + 1).toString(), role: "assistant", content: "Désolé, erreur lors de la connexion au conseiller IA." };
        appendGuestMessage(errMsg, guestMessages);
      } finally {
        setIsTyping(false);
      }
      return;
    }

    const previousHistory = queryClient.getQueryData<ChatMessage[]>(getGetChatHistoryQueryKey({ sessionId })) ?? [];
    setIsTyping(true);
    try {
      const response = await sendMessage.mutateAsync({ data: { message: escalateText, sessionId } });
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(), role: "assistant", content: response.reply,
        usedAI: response.usedAI ?? true, sessionId, createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<ChatMessage[]>(
        getGetChatHistoryQueryKey({ sessionId }),
        [...previousHistory, assistantMsg]
      );
    } catch {
      queryClient.setQueryData<ChatMessage[]>(getGetChatHistoryQueryKey({ sessionId }), previousHistory);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || sendMessage.isPending || isTyping) return;
    const currentMessage = message;
    setMessage("");
    setPendingEscalationMessage(null);

    if (!isSignedIn) {
      const userMsg: GuestMessage = { id: Date.now().toString(), role: "user", content: currentMessage };
      const afterUser = appendGuestMessage(userMsg, guestMessages);
      setIsTyping(true);
      try {
        const response = await sendRaw(currentMessage, afterUser);
        if (response.needsEscalationConfirm) {
          setPendingEscalationMessage(currentMessage);
          const escalatePrompt: GuestMessage = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: t("chatbot.escalate_prompt"),
            pendingEscalation: true,
          };
          appendGuestMessage(escalatePrompt, afterUser);
        } else {
          const assistantMsg: GuestMessage = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: response.reply,
            usedAI: response.usedAI ?? false,
          };
          appendGuestMessage(assistantMsg, afterUser);
        }
      } catch {
        const errorMsg: GuestMessage = { id: (Date.now() + 1).toString(), role: "assistant", content: "Désolé, je ne peux pas répondre pour le moment." };
        appendGuestMessage(errorMsg, afterUser);
      } finally {
        setIsTyping(false);
      }
      return;
    }

    const previousHistory = queryClient.getQueryData<ChatMessage[]>(getGetChatHistoryQueryKey({ sessionId })) ?? [];
    const optimisticUserMessage: ChatMessage = {
      id: Date.now().toString(), role: "user", content: currentMessage,
      usedAI: false, sessionId, createdAt: new Date().toISOString(),
    };
    queryClient.setQueryData<ChatMessage[]>(
      getGetChatHistoryQueryKey({ sessionId }),
      [...previousHistory, optimisticUserMessage]
    );

    setIsTyping(true);
    try {
      const response = await sendMessage.mutateAsync({ data: { message: currentMessage, sessionId } });
      if (response.needsEscalationConfirm) {
        setPendingEscalationMessage(currentMessage);
        queryClient.setQueryData<ChatMessage[]>(getGetChatHistoryQueryKey({ sessionId }), previousHistory);
      } else {
        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(), role: "assistant", content: response.reply,
          usedAI: response.usedAI ?? false, sessionId, createdAt: new Date().toISOString(),
        };
        queryClient.setQueryData<ChatMessage[]>(
          getGetChatHistoryQueryKey({ sessionId }),
          [...previousHistory, optimisticUserMessage, assistantMsg]
        );
      }
    } catch {
      queryClient.setQueryData<ChatMessage[]>(getGetChatHistoryQueryKey({ sessionId }), previousHistory);
    } finally {
      setIsTyping(false);
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
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{t("chatbot.title")}</CardTitle>
            </div>
            <Button
              variant="ghost" size="icon" className="h-8 w-8"
              onClick={() => setIsOpen(false)}
              data-testid="button-close-chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4" ref={scrollRef}>
              {isSignedIn && isLoading ? (
                <div className="text-center text-sm text-muted-foreground">{t("chatbot.loading")}</div>
              ) : displayMessages.length === 0 ? (
                <div className="text-center text-sm text-muted-foreground">{t("chatbot.greeting")}</div>
              ) : (
                displayMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-lg p-3 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                      {msg.content}
                      {msg.usedAI && (
                        <div className="mt-1">
                          <Badge variant="secondary" className="text-[10px] px-1 py-0">
                            <Sparkles className="h-2.5 w-2.5 mr-0.5" />{t("chatbot.escalated_label")}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {isTyping && (
                <div className="flex justify-start" data-testid="chatbot-typing-indicator">
                  <div className="bg-muted rounded-lg px-4 py-3 text-sm text-muted-foreground flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              {pendingEscalationMessage && !isTyping && (
                <div className="flex justify-start" data-testid="chatbot-escalation-prompt">
                  <div className="bg-muted rounded-lg p-3 text-sm text-foreground space-y-2 max-w-[90%]">
                    <p>{t("chatbot.escalate_prompt")}</p>
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm" variant="default" className="h-7 text-xs"
                        onClick={handleEscalateConfirm}
                        data-testid="button-escalate-confirm"
                      >
                        <Sparkles className="h-3 w-3 mr-1" />{t("chatbot.escalate_confirm")}
                      </Button>
                      <Button
                        size="sm" variant="outline" className="h-7 text-xs"
                        onClick={() => setPendingEscalationMessage(null)}
                        data-testid="button-escalate-cancel"
                      >
                        {t("chatbot.escalate_cancel")}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="p-4 border-t flex gap-2">
            <Input
              placeholder={t("chatbot.placeholder")}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              data-testid="input-chat-message"
            />
            <Button
              size="icon" onClick={handleSend}
              disabled={sendMessage.isPending || !message.trim() || isTyping}
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
