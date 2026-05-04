import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { MessageCircle, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

const FAQ: Array<{ keywords: string[]; answer: string }> = [
  {
    keywords: ["frais", "minerval", "scolarite", "scolarité", "coût", "cout", "paiement", "tarif"],
    answer: "Les frais de scolarité (minerval) à l'ISC Mbujimayi varient selon la filière et le niveau. Vous pouvez les régler via Orange Money, Airtel Money ou M-Pesa sur la plateforme. Contactez le service financier pour les montants exacts.",
  },
  {
    keywords: ["inscription", "inscrire", "dossier", "candidature", "admission"],
    answer: "Pour vous inscrire à l'ISC Mbujimayi, créez un compte sur la plateforme, puis soumettez votre dossier depuis la section 'Mes Inscriptions'. Vous aurez besoin de vos documents (carte d'identité, diplôme, photo).",
  },
  {
    keywords: ["filiere", "filière", "programme", "spécialité", "specialite", "section"],
    answer: "L'ISC Mbujimayi propose 5 filières : Comptabilité, Marketing, Informatique de Gestion, GRH (Gestion des Ressources Humaines), et Fiscalité. Chaque filière dure 3 ans et mène à un Diplôme d'État.",
  },
  {
    keywords: ["certificat", "diplôme", "diplome", "attestation"],
    answer: "Les certificats de réussite sont délivrés automatiquement après validation d'un cours. Vous pouvez les télécharger et les vérifier depuis votre tableau de bord.",
  },
  {
    keywords: ["cours", "programme", "matière", "matiere", "enseignement"],
    answer: "Nos cours sont disponibles en ligne dans le catalogue. Une fois inscrit à un cours, vous accédez aux modules, chapitres, vidéos et évaluations depuis votre espace étudiant.",
  },
  {
    keywords: ["contact", "adresse", "telephone", "téléphone", "email", "localisation"],
    answer: "ISC Mbujimayi : Avenue Bakwa Dianga, Mbujimayi, Kasaï-Oriental, RDC. Tél : +243 99 000 0000. Email : info@isc-mbujimayi.ac.cd. Horaires : Lun-Ven 7h30-17h00.",
  },
  {
    keywords: ["horaire", "calendrier", "emploi du temps", "cours en ligne"],
    answer: "La plateforme e-learning est accessible 24h/24. Le secrétariat est ouvert du lundi au vendredi de 7h30 à 17h00, le samedi de 8h00 à 12h00.",
  },
];

function getFaqAnswer(input: string): string | null {
  const normalized = input.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const faq of FAQ) {
    if (faq.keywords.some((kw) => normalized.includes(kw))) {
      return faq.answer;
    }
  }
  return null;
}

export function ChatbotWidget() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [guestMessages, setGuestMessages] = useState<GuestMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
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

  const displayMessages: Array<{ id: string; role: string; content: string }> = isSignedIn
    ? (apiHistory ?? []).map((m: ChatMessage) => ({ id: m.id, role: m.role, content: m.content }))
    : guestMessages;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayMessages.length, isTyping]);

  const handleSend = async () => {
    if (!message.trim() || sendMessage.isPending || isTyping) return;

    const currentMessage = message;
    setMessage("");

    const faqAnswer = getFaqAnswer(currentMessage);

    if (!isSignedIn) {
      const userMsg: GuestMessage = { id: Date.now().toString(), role: "user", content: currentMessage };
      const updatedWithUser = [...guestMessages, userMsg];
      setGuestMessages(updatedWithUser);
      saveGuestHistory(updatedWithUser);

      if (faqAnswer) {
        setIsTyping(true);
        await new Promise((r) => setTimeout(r, 600));
        setIsTyping(false);
        const assistantMsg: GuestMessage = { id: (Date.now() + 1).toString(), role: "assistant", content: faqAnswer };
        const updatedWithBoth = [...updatedWithUser, assistantMsg];
        setGuestMessages(updatedWithBoth);
        saveGuestHistory(updatedWithBoth);
        return;
      }

      setIsTyping(true);
      try {
        const response = await sendMessage.mutateAsync({ data: { message: currentMessage, sessionId } });
        const assistantMsg: GuestMessage = { id: (Date.now() + 1).toString(), role: "assistant", content: response.reply };
        const updatedWithBoth = [...updatedWithUser, assistantMsg];
        setGuestMessages(updatedWithBoth);
        saveGuestHistory(updatedWithBoth);
      } catch {
        const errorMsg: GuestMessage = { id: (Date.now() + 1).toString(), role: "assistant", content: "Désolé, je ne peux pas répondre pour le moment. Veuillez réessayer." };
        const updatedWithError = [...updatedWithUser, errorMsg];
        setGuestMessages(updatedWithError);
        saveGuestHistory(updatedWithError);
      } finally {
        setIsTyping(false);
      }
      return;
    }

    const previousHistory = queryClient.getQueryData<ChatMessage[]>(getGetChatHistoryQueryKey({ sessionId }));
    const optimisticUserMessage: ChatMessage = {
      id: Date.now().toString(), role: "user", content: currentMessage,
      usedAI: false, sessionId, createdAt: new Date().toISOString(),
    };
    queryClient.setQueryData<ChatMessage[]>(
      getGetChatHistoryQueryKey({ sessionId }),
      [...(previousHistory ?? []), optimisticUserMessage]
    );

    if (faqAnswer) {
      setIsTyping(true);
      await new Promise((r) => setTimeout(r, 600));
      setIsTyping(false);
      const faqMsg: ChatMessage = {
        id: (Date.now() + 1).toString(), role: "assistant", content: faqAnswer,
        usedAI: false, sessionId, createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData<ChatMessage[]>(
        getGetChatHistoryQueryKey({ sessionId }),
        [...(previousHistory ?? []), optimisticUserMessage, faqMsg]
      );
      return;
    }

    setIsTyping(true);
    try {
      await sendMessage.mutateAsync({ data: { message: currentMessage, sessionId } });
      queryClient.invalidateQueries({ queryKey: getGetChatHistoryQueryKey({ sessionId }) });
    } catch {
      queryClient.setQueryData<ChatMessage[]>(getGetChatHistoryQueryKey({ sessionId }), previousHistory ?? []);
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
            <CardTitle className="text-lg">{t("chatbot.title")}</CardTitle>
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
