import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Plus, Send, Trash2, Sparkles, MessageSquare, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
}

export default function AIChatPage() {
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations = [], refetch: refetchConversations } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });

  const { data: selectedConversation } = useQuery<Conversation & { messages: Message[] }>({
    queryKey: ["/api/conversations", selectedConversationId],
    enabled: !!selectedConversationId,
  });

  const messages: Message[] = selectedConversation?.messages || [];

  const createConversationMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/conversations", {
        title: new Date().toLocaleString('pl-PL'),
      });
      return res.json();
    },
    onSuccess: (data) => {
      setSelectedConversationId(data.id);
      refetchConversations();
      setNewMessage("");
      setStreamingText("");
      setIsMobileSheetOpen(false);
    },
  });

  const deleteConversationMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/conversations/${id}`);
    },
    onSuccess: () => {
      setSelectedConversationId(null);
      refetchConversations();
    },
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversationId || isLoading) return;

    setIsLoading(true);
    setStreamingText("");
    const userMessage = newMessage;
    setNewMessage("");

    try {
      const response = await fetch("/api/ai/recipe-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMessage,
          conversationHistory: messages.map((m: Message) => ({
            role: m.role,
            content: m.content
          }))
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");
      
      await fetch(`/api/conversations/${selectedConversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userMessage }),
      }).catch(() => {});

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const json = JSON.parse(line.slice(6));
              if (json.content) {
                fullText += json.content;
                setStreamingText(fullText);
              }
              if (json.done) {
                setStreamingText("");
              }
            } catch {
              // ignore
            }
          }
        }
      }

      queryClient.refetchQueries({
        queryKey: ["/api/conversations", selectedConversationId],
      });
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  useEffect(() => {
    if (!selectedConversationId && conversations.length > 0) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);

  const selectedTitle = conversations.find(c => c.id === selectedConversationId)?.title;

  const ConversationList = ({ onSelect }: { onSelect?: () => void }) => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <Button
          onClick={() => { createConversationMutation.mutate(); onSelect?.(); }}
          className="w-full"
          size="sm"
          disabled={createConversationMutation.isPending}
          data-testid="button-new-chat"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nowa rozmowa
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {conversations.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Brak rozmów</p>
          )}
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={cn(
                "p-3 rounded-lg cursor-pointer transition-colors text-sm flex items-center justify-between group",
                selectedConversationId === conv.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent text-accent-foreground hover:bg-accent/80"
              )}
              onClick={() => { setSelectedConversationId(conv.id); onSelect?.(); }}
              data-testid={`conv-${conv.id}`}
            >
              <span className="truncate flex-1 mr-2">{conv.title}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversationMutation.mutate(conv.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 flex-shrink-0"
                data-testid={`button-delete-${conv.id}`}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="flex min-h-screen md:h-screen flex-col md:flex-row md:overflow-hidden">
        <div className="hidden md:block">
          <Sidebar />
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <Header title="Asystent AI" subtitle="Rozmawiaj z AI o przepisach, składnikach i kuchni" />

          <div className="flex flex-1 overflow-hidden gap-0 md:gap-4 md:p-4 pb-16 md:pb-0">
            {/* Desktop sidebar */}
            <div className="hidden md:flex flex-col w-64 bg-card border border-border rounded-lg overflow-hidden">
              <ConversationList />
            </div>

            {/* Chat area */}
            <div className="flex-1 flex flex-col bg-card md:border md:border-border md:rounded-lg overflow-hidden">
              {/* Mobile top bar for conversations */}
              <div className="md:hidden flex items-center gap-2 p-3 border-b border-border bg-background/95">
                <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1 justify-between" data-testid="button-mobile-conversations">
                      <span className="flex items-center gap-2 min-w-0">
                        <MessageSquare className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate text-left">
                          {selectedTitle || "Wybierz rozmowę"}
                        </span>
                      </span>
                      <ChevronDown className="w-4 h-4 flex-shrink-0 ml-1" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[70vh] flex flex-col p-0">
                    <SheetHeader className="px-4 pt-4 pb-2">
                      <SheetTitle>Rozmowy</SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-hidden">
                      <ConversationList onSelect={() => setIsMobileSheetOpen(false)} />
                    </div>
                  </SheetContent>
                </Sheet>
                <Button
                  size="sm"
                  onClick={() => createConversationMutation.mutate()}
                  disabled={createConversationMutation.isPending}
                  data-testid="button-new-chat-mobile"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {selectedConversationId ? (
                <>
                  <ScrollArea className="flex-1">
                    <div className="p-4 space-y-4">
                      {messages.map((msg: Message) => (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex",
                            msg.role === "user" ? "justify-end" : "justify-start"
                          )}
                          data-testid={`message-${msg.id}`}
                        >
                          <div
                            className={cn(
                              "max-w-[85%] md:max-w-md px-4 py-2 rounded-lg text-sm",
                              msg.role === "user"
                                ? "bg-primary text-primary-foreground rounded-br-none"
                                : "bg-muted text-foreground rounded-bl-none"
                            )}
                          >
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          </div>
                        </div>
                      ))}

                      {streamingText && (
                        <div className="flex justify-start" data-testid="streaming-message">
                          <div className="max-w-[85%] md:max-w-md px-4 py-2 rounded-lg bg-muted text-foreground rounded-bl-none">
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{streamingText}</p>
                            <span className="inline-block w-2 h-4 bg-muted-foreground animate-pulse ml-1 align-middle"></span>
                          </div>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  <div className="p-3 md:p-4 border-t border-border">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Zapytaj o przepis, składnik..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={isLoading}
                        data-testid="input-message"
                        className="flex-1 text-base"
                        style={{ fontSize: '16px' }}
                      />
                      <Button
                        type="submit"
                        disabled={isLoading || !newMessage.trim()}
                        data-testid="button-send"
                        size="icon"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                  <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-2 font-medium">Brak wybranej rozmowy</p>
                  <p className="text-sm text-muted-foreground mb-6">Rozpocznij nową rozmowę lub wybierz istniejącą</p>
                  <Button onClick={() => createConversationMutation.mutate()} data-testid="button-create-first-chat">
                    <Plus className="w-4 h-4 mr-2" />
                    Nowa rozmowa
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
