
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/header";
import BottomNav from "@/components/layout/bottom-nav";
import PostCard from "@/components/feed/post-card";
import AIRecommendationCard from "@/components/feed/ai-recommendation-card";
import TrendingSection from "@/components/feed/trending-section";
import AIDrawer from "@/components/modals/ai-drawer";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [showAIDrawer, setShowAIDrawer] = useState(false);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const { data: feedPosts = [], isLoading: feedLoading } = useQuery({
    queryKey: ["/api/feed"],
    enabled: isAuthenticated,
  });

  const { data: recommendations = [] } = useQuery({
    queryKey: ["/api/recommendations"],
    enabled: isAuthenticated,
  });

  const { data: trendingTitles = [] } = useQuery({
    queryKey: ["/api/titles/trending"],
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cine-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cine-gold"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-cine-black">
      <Header onSearchClick={() => {}} onNotificationsClick={() => {}} />
      
      <main className="pb-20">
        {/* AI Discovery Banner */}
        <div className="mx-4 mt-4 mb-6">
          <div className="bg-gradient-to-r from-cine-blue/20 to-cine-gold/20 rounded-2xl p-4 border border-cine-blue/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-cine-text mb-1">AI Discovery</h3>
                <p className="text-sm text-cine-muted">Ask me anything about movies & TV</p>
              </div>
              <Button
                onClick={() => setShowAIDrawer(true)}
                className="bg-cine-blue hover:bg-cine-blue/80 px-4 py-2 rounded-full text-sm font-medium transition-colors"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Try it
              </Button>
            </div>
          </div>
        </div>

        {/* Feed Content */}
        <div className="space-y-6">
          {feedLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cine-gold"></div>
            </div>
          ) : feedPosts.length === 0 ? (
            <div className="text-center py-12 px-4">
              <h3 className="text-xl font-semibold text-cine-text mb-2">Welcome to CineLoop!</h3>
              <p className="text-cine-muted mb-6">
                Start following other users or create your first post to see content in your feed.
              </p>
              <Button
                onClick={() => window.location.href = "/create"}
                className="cine-gradient text-black font-semibold"
              >
                Create Your First Post
              </Button>
            </div>
          ) : (
            <>
              {feedPosts.map((post: any, index: number) => (
                <div key={post.id}>
                  <PostCard post={post} />
                  {/* Insert AI recommendation after every 3 posts */}
                  {(index + 1) % 3 === 0 && recommendations.length > 0 && (
                    <AIRecommendationCard 
                      recommendation={recommendations[Math.floor(index / 3) % recommendations.length]} 
                    />
                  )}
                </div>
              ))}
              
              {/* Trending Section */}
              {trendingTitles.length > 0 && (
                <TrendingSection titles={trendingTitles} />
              )}
            </>
          )}
        </div>
      </main>

      <BottomNav />
      
      {showAIDrawer && (
        <AIDrawer 
          isOpen={showAIDrawer} 
          onClose={() => setShowAIDrawer(false)} 
        />
      )}
    </div>
  );
}
