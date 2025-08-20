import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Sparkles, Film, Tv, Star, Clock } from "lucide-react";
import { Link } from "wouter";

interface Message {
  role: "user" | "assistant";
  content: string;
  recommendations?: any[];
  timestamp: Date;
}

interface ConversationalSearchProps {
  onClose?: () => void;
}

export default function ConversationalSearch({ onClose }: ConversationalSearchProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your movie discovery assistant. Tell me what you're in the mood for and I'll help you find the perfect movies or shows! Try something like 'I want a thriller that will keep me on the edge of my seat' or 'Looking for a funny movie for a date night'.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [sessionId] = useState(`session_${Date.now()}`);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const conversationHistory = messages
        .filter(m => m.role === "user" || m.role === "assistant")
        .map(m => ({ role: m.role, content: m.content }));

      return await apiRequest("/api/ai/chat", {
        method: "POST",
        body: JSON.stringify({
          message,
          sessionId,
          conversationHistory
        })
      });
    },
    onSuccess: (response) => {
      const assistantMessage: Message = {
        role: "assistant",
        content: response.message,
        recommendations: response.recommendations || [],
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    },
    onError: (error) => {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I'm having trouble right now. Please try again in a moment!",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate(input.trim());
    setInput("");
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-[80vh] bg-cine-black border border-cine-gray rounded-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-cine-gray">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-cine-gold" />
          <h2 className="font-semibold text-cine-text">AI Movie Discovery</h2>
        </div>
        {onClose && (
          <Button variant="ghost" onClick={onClose} className="text-cine-muted hover:text-cine-text">
            ✕
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 overflow-y-auto max-h-[60vh]">
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] ${message.role === "user" ? "bg-cine-blue text-white" : "bg-cine-gray text-cine-text"} rounded-lg p-3`}>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                
                {/* AI Recommendations */}
                {message.recommendations && message.recommendations.length > 0 && (
                  <div className="mt-4 space-y-3">
                    <p className="text-xs text-cine-muted font-medium">Movie Recommendations:</p>
                    {message.recommendations.map((rec, recIndex) => (
                      <Card key={recIndex} className="bg-cine-black/50 border-cine-gray/30">
                        <CardContent className="p-3">
                          <div className="flex items-start space-x-3">
                            {rec.posterUrl ? (
                              <img
                                src={rec.posterUrl}
                                alt={rec.name}
                                className="w-12 h-16 rounded object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-16 bg-cine-gray rounded flex items-center justify-center flex-shrink-0">
                                {rec.type === "tv" ? <Tv className="w-4 h-4 text-cine-muted" /> : <Film className="w-4 h-4 text-cine-muted" />}
                              </div>
                            )}
                            
                            <div className="flex-1 min-w-0">
                              <Link 
                                href={rec.id ? `/title/${rec.id}` : "#"}
                                className="block hover:text-cine-blue transition-colors"
                              >
                                <h4 className="font-medium text-sm text-cine-text truncate">
                                  {rec.name}
                                </h4>
                              </Link>
                              
                              <div className="flex items-center space-x-2 mt-1">
                                {rec.year && (
                                  <span className="text-xs text-cine-muted">{rec.year}</span>
                                )}
                                {rec.rating && (
                                  <div className="flex items-center space-x-1">
                                    <Star className="w-3 h-3 text-cine-gold fill-current" />
                                    <span className="text-xs text-cine-muted">{rec.rating}</span>
                                  </div>
                                )}
                                {rec.runtime && (
                                  <div className="flex items-center space-x-1">
                                    <Clock className="w-3 h-3 text-cine-muted" />
                                    <span className="text-xs text-cine-muted">{rec.runtime}m</span>
                                  </div>
                                )}
                              </div>

                              {rec.reason && (
                                <p className="text-xs text-cine-muted mt-1 italic">"{rec.reason}"</p>
                              )}

                              {rec.genres && rec.genres.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {rec.genres.slice(0, 3).map((genre: string, genreIndex: number) => (
                                    <Badge key={genreIndex} variant="secondary" className="text-xs bg-cine-blue/20 text-cine-blue">
                                      {genre}
                                    </Badge>
                                  ))}
                                </div>
                              )}

                              {rec.badges && rec.badges.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {rec.badges.map((badge: string, badgeIndex: number) => (
                                    <Badge key={badgeIndex} variant="outline" className="text-xs border-cine-gold/30 text-cine-gold">
                                      {badge}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                
                <p className="text-xs text-cine-muted/60 mt-2">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          
          {/* Loading indicator */}
          {chatMutation.isPending && (
            <div className="flex justify-start">
              <div className="bg-cine-gray rounded-lg p-3 max-w-[80%]">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-cine-blue rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-cine-blue rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                  <div className="w-2 h-2 bg-cine-blue rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  <span className="text-xs text-cine-muted ml-2">Finding recommendations...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-cine-gray">
        <div className="flex space-x-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about movies... 'I want something funny but touching'"
            className="flex-1 bg-cine-gray border-cine-gray/50 text-cine-text placeholder-cine-muted focus:border-cine-blue"
            disabled={chatMutation.isPending}
          />
          <Button 
            type="submit" 
            disabled={!input.trim() || chatMutation.isPending}
            className="bg-cine-blue hover:bg-cine-blue/90 text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Suggestions */}
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            "Something funny but touching",
            "Thriller like Zodiac", 
            "Feel-good romantic comedy",
            "Mind-bending sci-fi"
          ].map((suggestion, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              onClick={() => setInput(suggestion)}
              className="text-xs text-cine-muted hover:text-cine-blue hover:bg-cine-blue/10"
              disabled={chatMutation.isPending}
            >
              "{suggestion}"
            </Button>
          ))}
        </div>
      </form>
    </div>
  );
}