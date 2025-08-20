import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Star } from "lucide-react";

interface AIRecommendationCardProps {
  recommendation: {
    id: string;
    title: {
      id: string;
      name: string;
      year: number;
      type: string;
      posterUrl: string;
      rating: number;
    };
    reason: string;
    badges: string[];
    score: number;
  };
}

export default function AIRecommendationCard({ recommendation }: AIRecommendationCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addToWatchlistMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/watchlist/${recommendation.title.id}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Added to Watchlist",
        description: `${recommendation.title.name} has been added to your watchlist.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const markAsShownMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/recommendations/${recommendation.id}/shown`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
    },
  });

  const handleViewDetails = () => {
    markAsShownMutation.mutate();
    window.location.href = `/title/${recommendation.title.id}`;
  };

  const handleAddToWatchlist = () => {
    markAsShownMutation.mutate();
    addToWatchlistMutation.mutate();
  };

  return (
    <div className="mx-4 bg-gradient-to-br from-cine-blue/10 to-cine-gold/10 rounded-2xl p-4 border border-cine-blue/20 animate-fade-in">
      <div className="flex items-start space-x-3">
        <div className="w-8 h-8 cine-gradient rounded-full flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        
        <div className="flex-1">
          <h4 className="font-semibold text-sm text-cine-text mb-1">
            {recommendation.reason}
          </h4>
          <p className="text-xs text-cine-muted mb-3">
            We found something you might enjoy
          </p>
          
          <div className="flex items-center space-x-3">
            <img 
              src={recommendation.title.posterUrl}
              alt={recommendation.title.name}
              className="w-16 h-24 object-cover rounded-lg cursor-pointer"
              onClick={handleViewDetails}
            />
            
            <div className="flex-1">
              <h5 
                className="font-semibold text-sm text-cine-text cursor-pointer hover:text-cine-gold transition-colors"
                onClick={handleViewDetails}
              >
                {recommendation.title.name}
              </h5>
              <p className="text-xs text-cine-muted mb-1">
                {recommendation.title.year} • {recommendation.title.type}
              </p>
              <div className="flex items-center space-x-1 mb-2">
                <Star className="w-3 h-3 text-cine-gold fill-current" />
                <span className="text-xs text-cine-muted">{recommendation.title.rating}</span>
              </div>
              
              {recommendation.badges.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {recommendation.badges.slice(0, 2).map((badge) => (
                    <Badge 
                      key={badge}
                      className="bg-cine-gold/20 text-cine-gold border-cine-gold/30 text-xs"
                    >
                      {badge}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex space-x-2 mt-3">
            <Button 
              onClick={handleViewDetails}
              className="bg-cine-blue hover:bg-cine-blue/80 text-white text-xs px-3 py-1.5 rounded-full transition-colors"
            >
              View Details
            </Button>
            <Button 
              onClick={handleAddToWatchlist}
              disabled={addToWatchlistMutation.isPending}
              variant="outline"
              className="border-cine-gold text-cine-gold hover:bg-cine-gold hover:text-black text-xs px-3 py-1.5 rounded-full transition-colors"
            >
              {addToWatchlistMutation.isPending ? "Adding..." : "Add to Watchlist"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
