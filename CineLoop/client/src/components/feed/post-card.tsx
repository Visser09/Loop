import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  MessageCircle, 
  Repeat2, 
  Bookmark, 
  MoreHorizontal,
  Star 
} from "lucide-react";

interface PostCardProps {
  post: {
    id: string;
    author: {
      id: string;
      username: string;
      profileImageUrl?: string;
      firstName?: string;
    };
    title: {
      id: string;
      name: string;
      year: number;
      type: string;
      genres: string[];
      posterUrl: string;
      rating: number;
    };
    caption?: string;
    mediaUrl?: string;
    mediaType?: string;
    userRating?: number;
    moodTags?: string[];
    likesCount: number;
    commentsCount: number;
    repostsCount: number;
    savesCount: number;
    createdAt: string;
    isLiked?: boolean;
    isSaved?: boolean;
  };
}

export default function PostCard({ post }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLiked, setIsLiked] = useState(post.isLiked || false);
  const [isSaved, setIsSaved] = useState(post.isSaved || false);
  const [likesCount, setLikesCount] = useState(post.likesCount);

  const toggleLikeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest(isLiked ? "DELETE" : "POST", `/api/posts/${post.id}/like`, {});
    },
    onSuccess: () => {
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive",
      });
    },
  });

  const toggleSaveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest(isSaved ? "DELETE" : "POST", `/api/posts/${post.id}/save`, {});
    },
    onSuccess: () => {
      setIsSaved(!isSaved);
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to save post",
        variant: "destructive",
      });
    },
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const handleTitleClick = () => {
    window.location.href = `/title/${post.title.id}`;
  };

  const handleProfileClick = () => {
    window.location.href = `/profile/${post.author.username}`;
  };

  return (
    <article className="cine-card mx-4 animate-fade-in">
      {/* Post Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <div className="flex items-center space-x-3">
          <img 
            src={post.author.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"}
            alt={post.author.firstName || post.author.username}
            className="w-10 h-10 rounded-full border-2 border-cine-gold/30 object-cover cursor-pointer"
            onClick={handleProfileClick}
          />
          <div>
            <h4 
              className="font-semibold text-sm text-cine-text cursor-pointer hover:text-cine-gold transition-colors"
              onClick={handleProfileClick}
            >
              @{post.author.username}
            </h4>
            <p className="text-xs text-cine-muted">{formatTimeAgo(post.createdAt)}</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          className="p-2 hover:bg-cine-gray/30 rounded-full transition-colors"
        >
          <MoreHorizontal className="w-5 h-5 text-cine-muted" />
        </Button>
      </div>

      {/* Movie/TV Info and Media */}
      <div className="relative cursor-pointer" onClick={handleTitleClick}>
        {post.mediaUrl ? (
          <img 
            src={post.mediaUrl}
            alt={`Post about ${post.title.name}`}
            className="w-full h-96 object-cover"
          />
        ) : (
          <img 
            src={post.title.posterUrl}
            alt={post.title.name}
            className="w-full h-96 object-cover"
          />
        )}
        
        {/* Title info overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-1">{post.title.name}</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <span>{post.title.year}</span>
                <span>•</span>
                <span className="capitalize">{post.title.type}</span>
                <span>•</span>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-cine-gold fill-current" />
                  <span>{post.title.rating}</span>
                </div>
              </div>
            </div>
            
            {/* Mood tags */}
            <div className="flex flex-wrap gap-1">
              {post.moodTags?.slice(0, 2).map((tag) => (
                <Badge 
                  key={tag}
                  className="bg-cine-blue/30 text-cine-blue border-cine-blue/30 text-xs"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* User Rating */}
      {post.userRating && (
        <div className="px-4 pt-3">
          <div className="flex items-center space-x-1">
            <span className="text-sm text-cine-muted">Rated:</span>
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-4 h-4 ${
                  star <= post.userRating! 
                    ? "text-cine-gold fill-current" 
                    : "text-cine-muted"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Post Caption */}
      {post.caption && (
        <div className="px-4 pt-3">
          <p className="text-sm leading-relaxed text-cine-text">{post.caption}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center space-x-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleLikeMutation.mutate()}
            disabled={toggleLikeMutation.isPending}
            className={`flex items-center space-x-2 transition-colors p-0 ${
              isLiked ? "text-red-400" : "text-cine-muted hover:text-red-400"
            }`}
          >
            <Heart className={`w-6 h-6 ${isLiked ? "fill-current" : ""}`} />
            <span className="text-sm">{likesCount}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center space-x-2 text-cine-muted hover:text-cine-blue transition-colors p-0"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-sm">{post.commentsCount}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="text-cine-muted hover:text-cine-gold transition-colors p-0"
          >
            <Repeat2 className="w-6 h-6" />
          </Button>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => toggleSaveMutation.mutate()}
          disabled={toggleSaveMutation.isPending}
          className={`transition-colors p-0 ${
            isSaved ? "text-cine-gold" : "text-cine-muted hover:text-cine-gold"
          }`}
        >
          <Bookmark className={`w-6 h-6 ${isSaved ? "fill-current" : ""}`} />
        </Button>
      </div>
    </article>
  );
}
