import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/layout/header";
import BottomNav from "@/components/layout/bottom-nav";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, UserPlus, Settings, Star, Bookmark, List, Play, Calendar, Users } from "lucide-react";

export default function Profile() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();
  const isOwnProfile = !username;
  
  // Use current user data if viewing own profile
  const profileUser = currentUser;

  const { data: userPosts = [] } = useQuery({
    queryKey: ["/api/users", profileUser?.id, "posts"],
    enabled: !!profileUser?.id,
  });

  // Mock data for Instagram-style profile
  const mockWatchlist = [
    { id: "1", name: "The Dark Knight", posterUrl: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg", year: 2008 },
    { id: "2", name: "Inception", posterUrl: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg", year: 2010 },
    { id: "3", name: "Pulp Fiction", posterUrl: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg", year: 1994 },
    { id: "4", name: "The Matrix", posterUrl: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg", year: 1999 }
  ];

  const mockTop5 = [
    { id: "1", name: "The Godfather", posterUrl: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg", year: 1972, rating: 5 },
    { id: "2", name: "Goodfellas", posterUrl: "https://image.tmdb.org/t/p/w500/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg", year: 1990, rating: 5 },
    { id: "3", name: "The Shawshank Redemption", posterUrl: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg", year: 1994, rating: 5 },
    { id: "4", name: "Casablanca", posterUrl: "https://image.tmdb.org/t/p/w500/5K7cOHoay2mZusSLezBOY0Qxh8a.jpg", year: 1942, rating: 5 },
    { id: "5", name: "Citizen Kane", posterUrl: "https://image.tmdb.org/t/p/w500/sav0jxhqiH0bPr2vZFU0Kjt2nZt.jpg", year: 1941, rating: 5 }
  ];

  const mockPosts = [
    { id: "1", mediaUrl: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg", title: "The Dark Knight" },
    { id: "2", mediaUrl: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg", title: "Inception" },
    { id: "3", mediaUrl: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg", title: "The Godfather" },
    { id: "4", mediaUrl: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg", title: "Pulp Fiction" },
    { id: "5", mediaUrl: "https://image.tmdb.org/t/p/w500/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg", title: "Goodfellas" },
    { id: "6", mediaUrl: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg", title: "Shawshank" }
  ];

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-cine-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cine-gold"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cine-black">
      <Header 
        onSearchClick={() => {}} 
        onNotificationsClick={() => {}}
        title={isOwnProfile ? "Profile" : `@${profileUser.email?.split('@')[0]}`}
      />
      
      <main className="pb-20">
        {/* Profile Header - Instagram Style */}
        <div className="px-4 py-6">
          <div className="flex items-center space-x-4 mb-4">
            <img
              src={profileUser.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"}
              alt={profileUser.firstName || "User"}
              className="w-20 h-20 rounded-full object-cover border-2 border-cine-gold/30"
            />
            
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-cine-text">{mockPosts.length}</div>
                  <div className="text-xs text-cine-muted">posts</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-cine-text">2.4k</div>
                  <div className="text-xs text-cine-muted">followers</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-cine-text">326</div>
                  <div className="text-xs text-cine-muted">following</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="font-semibold text-cine-text">
              {profileUser.firstName && profileUser.lastName 
                ? `${profileUser.firstName} ${profileUser.lastName}`
                : profileUser.email?.split('@')[0] || 'Movie Enthusiast'
              }
            </h2>
            <p className="text-sm text-cine-muted">🎬 Film lover | 🍿 Always watching | ⭐ Rating everything</p>
            
            {isOwnProfile && (
              <Button variant="outline" className="w-full mt-3 border-cine-gray text-cine-text hover:bg-cine-gray/30">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {/* Instagram-style Tabs */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid grid-cols-3 w-full bg-transparent border-b border-cine-gray/30">
            <TabsTrigger 
              value="posts" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-cine-gold data-[state=active]:bg-transparent rounded-none pb-3"
            >
              <div className="flex items-center space-x-1">
                <div className="w-4 h-4 border border-cine-muted"></div>
                <span className="text-xs">POSTS</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="watchlist"
              className="data-[state=active]:border-b-2 data-[state=active]:border-cine-gold data-[state=active]:bg-transparent rounded-none pb-3"
            >
              <div className="flex items-center space-x-1">
                <Bookmark className="w-4 h-4" />
                <span className="text-xs">WATCHLIST</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="top5"
              className="data-[state=active]:border-b-2 data-[state=active]:border-cine-gold data-[state=active]:bg-transparent rounded-none pb-3"
            >
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4" />
                <span className="text-xs">TOP 5</span>
              </div>
            </TabsTrigger>
          </TabsList>

          {/* Posts Grid */}
          <TabsContent value="posts" className="mt-0">
            <div className="grid grid-cols-3 gap-1 p-1">
              {mockPosts.map((post) => (
                <div key={post.id} className="aspect-square relative group cursor-pointer">
                  <img
                    src={post.mediaUrl}
                    alt={post.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Add new post placeholder */}
              <div className="aspect-square border-2 border-dashed border-cine-gray/50 flex items-center justify-center cursor-pointer hover:border-cine-gold/50 transition-colors">
                <div className="text-center">
                  <div className="w-8 h-8 border border-cine-muted rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-cine-muted text-lg">+</span>
                  </div>
                  <span className="text-xs text-cine-muted">New Post</span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Watchlist */}
          <TabsContent value="watchlist" className="mt-0 p-4">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-cine-text mb-4">My Watchlist ({mockWatchlist.length})</h3>
              <div className="grid grid-cols-2 gap-3">
                {mockWatchlist.map((movie) => (
                  <Card key={movie.id} className="bg-cine-gray/30 border-cine-gray/50 hover:border-cine-gold/50 transition-colors cursor-pointer">
                    <CardContent className="p-3">
                      <div className="flex space-x-3">
                        <img
                          src={movie.posterUrl}
                          alt={movie.name}
                          className="w-12 h-16 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-cine-text truncate">{movie.name}</h4>
                          <p className="text-xs text-cine-muted flex items-center mt-1">
                            <Calendar className="w-3 h-3 mr-1" />
                            {movie.year}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Top 5 All Time */}
          <TabsContent value="top5" className="mt-0 p-4">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-cine-text mb-4">Top 5 All Time</h3>
              <div className="space-y-3">
                {mockTop5.map((movie, index) => (
                  <Card key={movie.id} className="bg-cine-gray/30 border-cine-gray/50">
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-cine-gold text-cine-black rounded-full flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        <img
                          src={movie.posterUrl}
                          alt={movie.name}
                          className="w-12 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-cine-text">{movie.name}</h4>
                          <p className="text-xs text-cine-muted">{movie.year}</p>
                          <div className="flex items-center mt-1">
                            {[...Array(movie.rating)].map((_, i) => (
                              <Star key={i} className="w-3 h-3 text-cine-gold fill-current" />
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <BottomNav />
    </div>
  );
}
