import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/layout/header";
import BottomNav from "@/components/layout/bottom-nav";
import PostCard from "@/components/feed/post-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Star, 
  Clock, 
  Calendar, 
  Bookmark, 
  Heart, 
  Plus,
  Share
} from "lucide-react";

export default function TitlePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: title, isLoading } = useQuery({
    queryKey: ["/api/titles", id],
    enabled: !!id,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ["/api/titles", id, "posts"],
    enabled: !!id,
  });

  const { data: relatedTitles = [] } = useQuery({
    queryKey: ["/api/titles", id, "related"],
    enabled: !!id,
  });

  const { data: watchlist } = useQuery({
    queryKey: ["/api/users", user?.id, "watchlist"],
    enabled: !!user?.id,
  });

  const { data: favorites } = useQuery({
    queryKey: ["/api/users", user?.id, "favorites"],
    enabled: !!user?.id,
  });

  const addToWatchlistMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/watchlist/${id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Added to Watchlist",
        description: `${title?.name} has been added to your watchlist.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "watchlist"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addToFavoritesMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/favorites/${id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Added to Favorites",
        description: `${title?.name} has been added to your favorites.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "favorites"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cine-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cine-gold"></div>
      </div>
    );
  }

  if (!title) {
    return (
      <div className="min-h-screen bg-cine-black flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-cine-text mb-2">Title not found</h2>
          <p className="text-cine-muted">The title you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const isInWatchlist = watchlist?.titleIds?.includes(id);
  const isInFavorites = favorites?.titleIds?.includes(id);

  return (
    <div className="min-h-screen bg-cine-black">
      <Header 
        onSearchClick={() => {}} 
        onNotificationsClick={() => {}}
        showBack
      />
      
      <main className="pb-20">
        {/* Hero Section */}
        <div className="relative">
          <div 
            className="h-64 bg-cover bg-center relative"
            style={{ 
              backgroundImage: `url(${title.backdropUrl || title.posterUrl})`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-cine-black via-black/60 to-transparent" />
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-end space-x-4">
              <img
                src={title.posterUrl}
                alt={title.name}
                className="w-24 h-36 object-cover rounded-lg shadow-lg"
              />
              
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-white mb-1">{title.name}</h1>
                <div className="flex items-center space-x-3 text-sm text-gray-300 mb-3">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{title.year}</span>
                  </div>
                  {title.runtime && (
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{title.runtime}m</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-cine-gold fill-current" />
                    <span>{title.rating}</span>
                  </div>
                </div>
                
                {/* Genres */}
                <div className="flex flex-wrap gap-2">
                  {title.genres?.map((genre: string) => (
                    <Badge key={genre} variant="secondary" className="text-xs">
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4 py-4">
          <div className="flex space-x-3">
            <Button
              onClick={() => addToWatchlistMutation.mutate()}
              disabled={isInWatchlist || addToWatchlistMutation.isPending}
              className="flex-1 bg-cine-blue hover:bg-cine-blue/80 text-white"
            >
              <Bookmark className="w-4 h-4 mr-2" />
              {isInWatchlist ? "In Watchlist" : "Add to Watchlist"}
            </Button>
            
            <Button
              onClick={() => addToFavoritesMutation.mutate()}
              disabled={isInFavorites || addToFavoritesMutation.isPending}
              variant="outline"
              className="border-cine-gold text-cine-gold hover:bg-cine-gold hover:text-black"
            >
              <Heart className={`w-4 h-4 ${isInFavorites ? "fill-current" : ""}`} />
            </Button>
            
            <Button variant="outline" className="border-cine-gray text-cine-text hover:bg-cine-gray/30">
              <Share className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Synopsis */}
        {title.synopsis && (
          <div className="px-4 py-2">
            <h3 className="font-semibold text-cine-text mb-2">Synopsis</h3>
            <p className="text-sm text-cine-text leading-relaxed">{title.synopsis}</p>
          </div>
        )}

        {/* Cast & Crew */}
        {(title.cast?.length > 0 || title.crew?.length > 0) && (
          <div className="px-4 py-4">
            {title.cast?.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-cine-text mb-2">Cast</h3>
                <div className="flex flex-wrap gap-2">
                  {title.cast.slice(0, 6).map((actor: string) => (
                    <Badge key={actor} variant="outline" className="text-xs">
                      {actor}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {title.crew?.length > 0 && (
              <div>
                <h3 className="font-semibold text-cine-text mb-2">Crew</h3>
                <div className="flex flex-wrap gap-2">
                  {title.crew.slice(0, 4).map((person: string) => (
                    <Badge key={person} variant="outline" className="text-xs">
                      {person}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <Separator className="bg-cine-gray/30" />

        {/* Posts Section */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-cine-text">Community Posts</h3>
            <Button 
              size="sm"
              onClick={() => window.location.href = `/create?title=${id}`}
              className="cine-gradient text-black"
            >
              <Plus className="w-4 h-4 mr-2" />
              Post
            </Button>
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-12">
              <h4 className="font-semibold text-cine-text mb-2">No posts yet</h4>
              <p className="text-cine-muted mb-4">Be the first to share your thoughts about {title.name}!</p>
              <Button 
                onClick={() => window.location.href = `/create?title=${id}`}
                className="cine-gradient text-black"
              >
                Create Post
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post: any) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>

        {/* Related Titles */}
        {relatedTitles.length > 0 && (
          <>
            <Separator className="bg-cine-gray/30" />
            <div className="px-4 py-4">
              <h3 className="font-semibold text-cine-text mb-4">Related Titles</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatedTitles.map((relatedTitle: any) => (
                  <div
                    key={relatedTitle.id}
                    className="group cursor-pointer"
                    onClick={() => window.location.href = `/title/${relatedTitle.id}`}
                  >
                    <div className="relative">
                      <img
                        src={relatedTitle.posterUrl}
                        alt={relatedTitle.name}
                        className="w-full h-48 object-cover rounded-xl group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="absolute bottom-2 left-2 right-2">
                          <h4 className="text-sm font-semibold text-white truncate">{relatedTitle.name}</h4>
                          <div className="flex items-center space-x-1 mt-1">
                            <Star className="w-3 h-3 text-cine-gold fill-current" />
                            <span className="text-xs text-white">{relatedTitle.rating}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
