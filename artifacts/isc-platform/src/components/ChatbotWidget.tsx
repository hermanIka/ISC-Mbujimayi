import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSendChatMessage, useGetChatHistory, getGetChatHistoryQueryKey } from "@workspace/api-client-react";
import { useUser } from "@clerk/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQueryClient } from "@tanstack/react-query";

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  const scrollRef = useRef<HTMLDivElement>(null);
  const { isSignedIn } = useUser();
  const queryClient = useQueryClient();

  const { data: history, isLoading } = useGetChatHistory(
    { sessionId },
    { query: { enabled: isOpen && isSignedIn, queryKey: getGetChatHistoryQueryKey({ sessionId }) } }
  );

  const sendMessage = useSendChatMessage();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  if (!isSignedIn) return null;

  const handleSend = async () => {
    if (!message.trim() || sendMessage.isPending) return;

    const currentMessage = message;
    setMessage("");

    // Optimistic update
    const previousHistory = queryClient.getQueryData(getGetChatHistoryQueryKey({ sessionId })) as any[];
    const optimisticUserMessage = { id: Date.now().toString(), role: "user", content: currentMessage };
    queryClient.setQueryData(getGetChatHistoryQueryKey({ sessionId }), [...(previousHistory || []), optimisticUserMessage]);

    try {
      await sendMessage.mutateAsync({ data: { message: currentMessage, sessionId } });
      queryClient.invalidateQueries({ queryKey: getGetChatHistoryQueryKey({ sessionId }) });
    } catch (e) {
      // Revert on error
      queryClient.setQueryData(getGetChatHistoryQueryKey({ sessionId }), previousHistory);
    }
  };

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-80 shadow-2xl z-50 flex flex-col h-[500px]">
          <CardHeader className="p-4 border-b flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Assistant ISC</CardTitle>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {isLoading ? (
                <div className="text-center text-sm text-muted-foreground">Chargement...</div>
              ) : (history ?? []).length === 0 ? (
                <div className="text-center text-sm text-muted-foreground">Bonjour ! Comment puis-je vous aider ?</div>
              ) : (
                (history ?? []).map((msg: any) => (
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
            />
            <Button size="icon" onClick={handleSend} disabled={sendMessage.isPending || !message.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}
