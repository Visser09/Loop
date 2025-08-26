import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  X, 
  Send, 
  Sparkles, 
  Star,
  Loader2
} from "lucide-react";

interface AIDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AIResult {
  id: string;
  name: string;
  year: number;
  type: string;
  posterUrl: string;
  rating: number;
  reason: string;
  badges: string[];
}

export default function AIDrawer({ isOpen, onClose }: AIDrawerProps) {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AIResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const aiSearchMutation = useMutation({
    mutationFn: async (searchQuery: string) => {
      // Assuming apiRequest handles the POST request with headers and body
      // The original code used fetch directly, this change aligns with apiRequest usage
      const response = await apiRequest("POST", "/api/ai/search", { query: searchQuery });
      return response.json();
    },
    onSuccess: (data) => {
      setResults(data.results || []);
      setShowResults(true);
    },
    onError: (error) => {
      toast({
        title: "AI Search Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      aiSearchMutation.mutate(query.trim());
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    aiSearchMutation.mutate(suggestion);
  };

  const handleTitleClick = (titleId: string) => {
    onClose();
    window.location.href = `/title/${titleId}`;
  };

  const suggestions = [
    "Find me a thriller like Prisoners but less intense",
    "Show me comedies perfect for a date night", 
    "I want something like The Office but animated",
    "Recommend sci-fi movies with great visuals",
    "Find feel-good movies from the 90s"
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden bg-cine-dark border-cine-gray p-0">
          <DialogTitle className="sr-only">AI Search</DialogTitle>
          <DialogDescription className="sr-only">
            Search for movies and TV shows using AI-powered natural language queries
          </DialogDescription>
          <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-cine-gray/30">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 cine-gradient rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-cine-text">AI Discovery</h2>
                <p className="text-sm text-cine-muted">Ask me anything about movies & TV</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2 hover:bg-cine-gray/30 rounded-full"
            >
              <X className="w-5 h-5 text-cine-muted" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Search Input */}
            <div className="p-6">
              <form onSubmit={handleSubmit} className="relative">
                <Input
                  type="text"
                  placeholder="e.g., 'Find me a funny rom-com from the 90s'"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={aiSearchMutation.isPending}
                  className="w-full bg-cine-gray border-cine-gray/50 rounded-2xl px-4 py-4 pr-12 text-cine-text placeholder-cine-muted focus:outline-none focus:border-cine-blue transition-colors"
                />
                <Button
                  type="submit"
                  disabled={aiSearchMutation.isPending || !query.trim()}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-cine-blue hover:bg-cine-blue/80 text-white p-2 rounded-full transition-colors"
                >
                  {aiSearchMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
            </div>

            {/* Results or Suggestions */}
            {showResults ? (
              <div className="px-6 pb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-cine-text">Recommendations for you</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowResults(false)}
                    className="text-cine-muted hover:text-cine-text"
                  >
                    Back
                  </Button>
                </div>

                {results.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-cine-muted">No results found. Try rephrasing your query.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {results.map((result) => (
                      <div
                        key={result.id}
                        onClick={() => handleTitleClick(result.id)}
                        className="flex items-center space-x-3 p-3 bg-cine-gray/30 rounded-xl hover:bg-cine-gray/50 cursor-pointer transition-colors"
                      >
                        <img
                          src={result.posterUrl}
                          alt={result.name}
                          className="w-16 h-24 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-cine-text">{result.name}</h4>
                          <p className="text-sm text-cine-muted mb-2">{result.reason}</p>
                          <div className="flex items-center space-x-2 mb-2">
                            <Star className="w-3 h-3 text-cine-gold fill-current" />
                            <span className="text-xs text-cine-muted">{result.rating}</span>
                            <span className="text-xs text-cine-muted">•</span>
                            <span className="text-xs text-cine-muted">{result.year}</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {result.badges.slice(0, 2).map((badge) => (
                              <Badge 
                                key={badge}
                                className="bg-cine-blue/20 text-cine-blue border-cine-blue/30 text-xs"
                              >
                                {badge}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="px-6 pb-6">
                <h3 className="text-sm font-semibold text-cine-text mb-3">Try asking:</h3>
                <div className="space-y-2">
                  {suggestions.map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="ghost"
                      onClick={() => handleSuggestionClick(suggestion)}
                      disabled={aiSearchMutation.isPending}
                      className="w-full text-left justify-start bg-cine-gray/50 hover:bg-cine-gray/70 rounded-xl p-3 text-sm text-cine-text transition-colors"
                    >
                      "{suggestion}"
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}