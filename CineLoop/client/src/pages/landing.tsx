
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Film, Sparkles, Users, Search } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cine-black via-cine-dark to-cine-black">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Logo */}
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="w-12 h-12 cine-gradient rounded-2xl flex items-center justify-center">
              <Film className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold cine-text-gradient">CineLoop</h1>
          </div>

          {/* Tagline */}
          <h2 className="text-5xl md:text-6xl font-bold text-cine-text mb-6 leading-tight">
            The Social Home for
            <br />
            <span className="cine-text-gradient">Movies & TV</span>
          </h2>

          <p className="text-xl text-cine-muted mb-12 max-w-2xl mx-auto leading-relaxed">
            Discover, share, and discuss your favorite movies and TV shows with an AI-powered 
            discovery feed that understands your taste.
          </p>

          {/* CTA Button */}
          <Button 
            onClick={handleLogin}
            className="cine-gradient hover:opacity-90 text-black font-semibold px-8 py-4 text-lg rounded-full transition-all duration-300 transform hover:scale-105"
          >
            Get Started
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-24">
          <Card className="bg-cine-dark/50 border-cine-gray/30 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 cine-gradient rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-cine-text mb-4">Social Discovery</h3>
              <p className="text-cine-muted">
                Share your movie moments, discover what friends are watching, and build your personal watchlists together.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-cine-dark/50 border-cine-gray/30 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 cine-gradient rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-cine-text mb-4">AI Recommendations</h3>
              <p className="text-cine-muted">
                Get personalized suggestions powered by AI that understands your mood, themes, and viewing preferences.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-cine-dark/50 border-cine-gray/30 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 cine-gradient rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-cine-text mb-4">Smart Search</h3>
              <p className="text-cine-muted">
                Find movies with natural language. Ask for "a funny rom-com from the 90s" and get exactly what you want.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Sample Feed Preview */}
        <div className="mt-24 text-center">
          <h3 className="text-2xl font-bold text-cine-text mb-8">See What's Trending</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600",
              "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600",
              "https://images.unsplash.com/photo-1595769816263-9b910be24d5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600",
              "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600",
            ].map((poster, index) => (
              <div key={index} className="relative group cursor-pointer">
                <img 
                  src={poster} 
                  alt={`Movie ${index + 1}`}
                  className="w-full h-48 object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-cine-gray/30 py-8 mt-24">
        <div className="container mx-auto px-4 text-center">
          <p className="text-cine-muted">
            Ready to discover your next favorite movie or show?
          </p>
          <Button 
            onClick={handleLogin}
            variant="ghost" 
            className="text-cine-gold hover:text-cine-gold/80 hover:bg-cine-gold/10 mt-4"
          >
            Join CineLoop
          </Button>
        </div>
      </footer>
    </div>
  );
}
