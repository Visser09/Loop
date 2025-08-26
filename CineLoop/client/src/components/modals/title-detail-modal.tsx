import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  X, 
  Star, 
  Clock, 
  Calendar, 
  Bookmark, 
  Heart, 
  Share,
  Plus
} from "lucide-react";
import PostCard from "@/components/feed/post-card";

interface TitleDetailModalProps {
  titleId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function TitleDetailModal({ titleId, isOpen, onClose }: TitleDetailModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: title, isLoading } = useQuery({
    queryKey: ["/api/titles", titleId],
    enabled: isOpen && !!titleId,
  });

  const { data: posts = [] } = useQuery({
    queryKey: ["/api/titles", titleId, "posts"],
    enabled: isOpen && !!titleId,
  });

  const { data: relatedTitles = [] } = useQuery({
    queryKey: ["/api/titles", titleId, "related"],
    enabled: isOpen && !!titleId,
  });

  const { data: watchlist } = useQuery({
    queryKey: ["/api/users", user?.id, "watchlist"],
    enabled: isOpen && !!user?.id,
  });

  const { data: favorites } = useQuery({
    queryKey: ["/api/users", user?.id, "favorites"],
    enabled: isOpen && !!user?.id,
  });

  const addToWatchlistMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/watchlist/${titleId}`, {});
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
      await apiRequest("POST", `/api/favorites/${titleId}`, {});
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

  const handleCreatePost = () => {
    onClose();
    window.location.href = `/create?title=${titleId}`;
  };

  const handleRelatedClick = (relatedTitleId: string) => {
    // Replace current modal content with new title
    queryClient.invalidateQueries({ queryKey: ["/api/titles", relatedTitleId] });
  };

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden bg-cine-black border-cine-gray p-0">
          <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cine-gold"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!title) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden bg-cine-black border-cine-gray p-0">
          <DialogTitle className="sr-only">{title?.name || "Title Details"}</DialogTitle>
          <DialogDescription className="sr-only">
            Detailed information about {title?.name || "the selected title"}
          </DialogDescription>
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-cine-text mb-2">Title not found</h2>
              <p className="text-cine-muted">The title you're looking for doesn't exist.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const isInWatchlist = watchlist?.titleIds?.includes(titleId);
  const isInFavorites = favorites?.titleIds?.includes(titleId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-hidden bg-cine-black border-cine-gray p-0">
        <DialogTitle className="sr-only">{title?.name || "Title Details"}</DialogTitle>
        <DialogDescription className="sr-only">
          Detailed information about {title?.name || "the selected title"}
        </DialogDescription>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-cine-gray/30">
            <h2 className="text-lg font-semibold text-cine-text truncate">{title.name}</h2>
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
            {/* Hero Section */}
            <div className="relative">
              <div 
                className="h-48 bg-cover bg-center relative"
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
                    className="w-20 h-30 object-cover rounded-lg shadow-lg"
                  />

                  <div className="flex-1">
                    <h1 className="text-xl font-bold text-white mb-1">{title.name}</h1>
                    <div className="flex items-center space-x-3 text-sm text-gray-300 mb-2">
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
                    <div className="flex flex-wrap gap-1">
                      {title.genres?.slice(0, 3).map((genre: string) => (
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

            <Separator className="bg-cine-gray/30 my-4" />

            {/* Posts Section */}
            <div className="px-4 pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-cine-text">Community Posts</h3>
                <Button 
                  size="sm"
                  onClick={handleCreatePost}
                  className="cine-gradient text-black"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Post
                </Button>
              </div>

              {posts.length === 0 ? (
                <div className="text-center py-8">
                  <h4 className="font-semibold text-cine-text mb-2">No posts yet</h4>
                  <p className="text-cine-muted mb-4">Be the first to share your thoughts about {title.name}!</p>
                  <Button 
                    onClick={handleCreatePost}
                    className="cine-gradient text-black"
                  >
                    Create Post
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {posts.slice(0, 3).map((post: any) => (
                    <div key={post.id} className="scale-95 origin-left">
                      <PostCard post={post} />
                    </div>
                  ))}
                  {posts.length > 3 && (
                    <div className="text-center py-2">
                      <Button variant="ghost" className="text-cine-blue">
                        View all {posts.length} posts
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}