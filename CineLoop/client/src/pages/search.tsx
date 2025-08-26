import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import BottomNav from "@/components/layout/bottom-nav";
import ConversationalSearch from "@/components/ai/conversational-search";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Filter, Star, Sparkles } from "lucide-react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [showAIChat, setShowAIChat] = useState(false);
  const [filters, setFilters] = useState({
    type: "all", // all, movie, tv
    year: "",
    genre: "",
  });

  const { data: searchResults = [], isLoading } = useQuery({
    queryKey: ["/api/search", query, filters],
    enabled: query.length > 0,
  });

  const { data: trendingTitles = [] } = useQuery({
    queryKey: ["/api/titles/trending"],
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by the query above
  };

  return (
    <div className="min-h-screen bg-cine-black">
      <Header
        onSearchClick={() => {}}
        onNotificationsClick={() => {}}
        showSearch={false}
      />

      <main className="pb-20">
        {/* Search Section */}
        <div className="p-4 space-y-4">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cine-muted w-5 h-5" />
            <Input
              type="text"
              placeholder="Search movies, TV shows, or people..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 bg-cine-gray border-cine-gray/50 text-cine-text placeholder-cine-muted focus:border-cine-blue"
            />
          </form>

          {/* AI Search Prompt */}
          <div className="bg-gradient-to-r from-cine-blue/10 to-cine-gold/10 rounded-xl p-4 border border-cine-blue/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-cine-text mb-1 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-cine-gold" />
                  <span>Chat with AI</span>
                </h3>
                <p className="text-sm text-cine-muted">Ask like a friend: "I want something funny but touching"</p>
              </div>
              <Button
                onClick={() => setShowAIChat(true)}
                variant="outline"
                className="border-cine-blue text-cine-blue hover:bg-cine-blue hover:text-white"
              >
                Chat
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            <Button
              variant={filters.type === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilters({...filters, type: "all"})}
              className="whitespace-nowrap"
            >
              All
            </Button>
            <Button
              variant={filters.type === "movie" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilters({...filters, type: "movie"})}
              className="whitespace-nowrap"
            >
              Movies
            </Button>
            <Button
              variant={filters.type === "tv" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilters({...filters, type: "tv"})}
              className="whitespace-nowrap"
            >
              TV Shows
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="whitespace-nowrap"
            >
              <Filter className="w-4 h-4 mr-2" />
              More Filters
            </Button>
          </div>
        </div>

        {/* Search Results */}
        {query ? (
          <div className="px-4">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cine-gold"></div>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold text-cine-text mb-2">No results found</h3>
                <p className="text-cine-muted">Try adjusting your search terms or use AI search for better results.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-cine-text">Search Results</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {searchResults.map((title: any) => (
                    <div key={title.id} className="group cursor-pointer">
                      <div className="relative">
                        <img
                          src={title.posterUrl}
                          alt={title.name}
                          className="w-full h-64 object-cover rounded-xl group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="absolute bottom-2 left-2 right-2">
                            <h4 className="text-sm font-semibold text-white truncate">{title.name}</h4>
                            <div className="flex items-center space-x-1 mt-1">
                              <Star className="w-3 h-3 text-cine-gold fill-current" />
                              <span className="text-xs text-white">{title.rating}</span>
                              <span className="text-xs text-gray-300 ml-1">({title.year})</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="flex flex-wrap gap-1">
                          {title.genres?.slice(0, 2).map((genre: string) => (
                            <Badge key={genre} variant="secondary" className="text-xs">
                              {genre}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Trending & Suggestions */
          <div className="px-4 space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-cine-text mb-4">Trending Now</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {trendingTitles.map((title: any) => (
                  <div key={title.id} className="group cursor-pointer">
                    <div className="relative">
                      <img
                        src={title.posterUrl}
                        alt={title.name}
                        className="w-full h-64 object-cover rounded-xl group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-2 left-2 right-2">
                          <h4 className="text-sm font-semibold text-white truncate">{title.name}</h4>
                          <div className="flex items-center space-x-1 mt-1">
                            <Star className="w-3 h-3 text-cine-gold fill-current" />
                            <span className="text-xs text-white">{title.rating}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-cine-text mb-4">Popular Genres</h2>
              <div className="grid grid-cols-2 gap-3">
                {["Action", "Comedy", "Drama", "Horror", "Sci-Fi", "Romance", "Thriller", "Animation"].map((genre) => (
                  <Button
                    key={genre}
                    variant="ghost"
                    className="justify-start bg-cine-gray/30 hover:bg-cine-gray/50 text-cine-text"
                    onClick={() => setQuery(genre)}
                  >
                    {genre}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <BottomNav />

      {/* AI Chat Dialog */}
      <Dialog open={showAIChat} onOpenChange={setShowAIChat}>
        <DialogContent className="max-w-4xl w-[95vw] h-[90vh] p-0 bg-transparent border-none">
          <DialogHeader className="sr-only">
            <DialogTitle>AI Movie Discovery</DialogTitle>
          </DialogHeader>
          <ConversationalSearch onClose={() => setShowAIChat(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}