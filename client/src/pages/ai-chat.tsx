import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Send, Trash2, Sparkles } from "lucide-react";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all conversations
  const { data: conversations = [], refetch: refetchConversations } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });

  // Fetch messages for selected conversation
  const { data: selectedConversation } = useQuery<Conversation & { messages: Message[] }>({
    queryKey: ["/api/conversations", selectedConversationId],
    enabled: !!selectedConversationId,
  });

  const messages: Message[] = selectedConversation?.messages || [];

  // Create new conversation
  const createConversationMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/conversations", {
        title: new Date().toLocaleString(),
      });
      return res.json();
    },
    onSuccess: (data) => {
      setSelectedConversationId(data.id);
      refetchConversations();
      setNewMessage("");
      setStreamingText("");
    },
  });

  // Delete conversation
  const deleteConversationMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/conversations/${id}`);
    },
    onSuccess: () => {
      setSelectedConversationId(null);
      refetchConversations();
    },
  });

  // Send message with streaming
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversationId || isLoading) return;

    setIsLoading(true);
    setStreamingText("");
    const userMessage = newMessage;
    setNewMessage("");

    try {
      // Use recipe-aware AI chat endpoint
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
      
      // Also save to conversation storage
      await fetch(`/api/conversations/${selectedConversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userMessage }),
      }).catch(() => {});  // Silent fail for storage

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
              // Ignore parse errors
            }
          }
        }
      }

      // Refetch to get updated messages
      queryClient.refetchQueries({
        queryKey: ["/api/conversations", selectedConversationId],
      });
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  // Initialize with first conversation if none selected
  useEffect(() => {
    if (!selectedConversationId && conversations.length > 0) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-hidden flex flex-col">
        <Header title="AI Assistant" subtitle="Chat with AI to organize recipes and find ingredients" />

        <div className="flex flex-1 overflow-hidden gap-4 p-4">
          {/* Conversations sidebar */}
          <div className="hidden md:flex flex-col w-64 bg-card border border-border rounded-lg">
            <div className="p-4 border-b border-border">
              <Button
                onClick={() => createConversationMutation.mutate()}
                className="w-full"
                size="sm"
                data-testid="button-new-chat"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={cn(
                      "p-3 rounded-lg cursor-pointer transition-colors text-sm flex items-center justify-between group",
                      selectedConversationId === conv.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-accent text-accent-foreground hover:bg-accent/80"
                    )}
                    onClick={() => setSelectedConversationId(conv.id)}
                    data-testid={`conv-${conv.id}`}
                  >
                    <span className="truncate flex-1">{conv.title}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversationMutation.mutate(conv.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                      data-testid={`button-delete-${conv.id}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Chat area */}
          <div className="flex-1 flex flex-col bg-card border border-border rounded-lg overflow-hidden">
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
                            "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
                            msg.role === "user"
                              ? "bg-primary text-primary-foreground rounded-br-none"
                              : "bg-muted text-muted-foreground rounded-bl-none"
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))}

                    {streamingText && (
                      <div className="flex justify-start" data-testid="streaming-message">
                        <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-muted text-muted-foreground rounded-bl-none">
                          <p className="text-sm whitespace-pre-wrap">{streamingText}</p>
                          <span className="inline-block w-2 h-4 bg-muted-foreground animate-pulse ml-1"></span>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div className="p-4 border-t border-border">
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Ask about ingredients, recipes, organization..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={isLoading}
                      data-testid="input-message"
                      className="flex-1"
                    />
                    <Button
                      type="submit"
                      disabled={isLoading || !newMessage.trim()}
                      data-testid="button-send"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <Sparkles className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No conversation selected</p>
                <Button onClick={() => createConversationMutation.mutate()} data-testid="button-create-first-chat">
                  <Plus className="w-4 h-4 mr-2" />
                  Start New Chat
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
