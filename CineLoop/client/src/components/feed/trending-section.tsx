import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";

interface TrendingSectionProps {
  titles: Array<{
    id: string;
    name: string;
    year: number;
    type: string;
    posterUrl: string;
    rating: number;
    genres?: string[];
  }>;
}

export default function TrendingSection({ titles }: TrendingSectionProps) {
  if (titles.length === 0) return null;

  const handleTitleClick = (titleId: string) => {
    window.location.href = `/title/${titleId}`;
  };

  return (
    <div className="mx-4 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-cine-text">Trending Now</h3>
        <Button 
          variant="ghost"
          className="text-sm text-cine-blue hover:text-cine-blue/80 transition-colors p-0"
          onClick={() => window.location.href = "/search"}
        >
          See All
        </Button>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        {titles.slice(0, 6).map((title) => (
          <div 
            key={title.id}
            className="relative group cursor-pointer"
            onClick={() => handleTitleClick(title.id)}
          >
            <img 
              src={title.posterUrl}
              alt={title.name}
              className="w-full h-40 object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Title Info */}
            <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <h4 className="text-xs font-semibold text-white truncate mb-1">
                {title.name}
              </h4>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                  <Star className="w-3 h-3 text-cine-gold fill-current" />
                  <span className="text-xs text-white">{title.rating}</span>
                </div>
                <span className="text-xs text-gray-300">{title.year}</span>
              </div>
            </div>
            
            {/* Type badge */}
            <div className="absolute top-2 left-2">
              <Badge 
                variant="secondary" 
                className="bg-black/60 text-white border-none text-xs"
              >
                {title.type}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
