import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Play, Film, Tv, Star, Clock, Plus } from "lucide-react";

interface MovieClipsProps {
  onClipSelect: (clip: any) => void;
  selectedClip?: any;
}

// Sample movie clips data - in production this would come from a clips API
const SAMPLE_CLIPS = [
  {
    id: "1",
    title: "The Dark Knight - Joker's Introduction",
    movieTitle: "The Dark Knight",
    year: 2008,
    duration: 45,
    thumbnail: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    videoUrl: "https://www.youtube.com/embed/0OYBEquZ_j0", // Sample trailer
    type: "scene",
    tags: ["Action", "Iconic", "Villain"]
  },
  {
    id: "2", 
    title: "Inception - Dream Within a Dream",
    movieTitle: "Inception",
    year: 2010,
    duration: 60,
    thumbnail: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
    videoUrl: "https://www.youtube.com/embed/YoHD9XEInc0",
    type: "scene",
    tags: ["Sci-Fi", "Mind-bending", "Classic"]
  },
  {
    id: "3",
    title: "Pulp Fiction - Ezekiel Speech",
    movieTitle: "Pulp Fiction", 
    year: 1994,
    duration: 30,
    thumbnail: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
    videoUrl: "https://www.youtube.com/embed/x2WK_eWihdU",
    type: "scene",
    tags: ["Drama", "Iconic", "Tarantino"]
  },
  {
    id: "4",
    title: "Avengers Assemble Scene",
    movieTitle: "The Avengers",
    year: 2012,
    duration: 90,
    thumbnail: "https://image.tmdb.org/t/p/w500/RYMX2wcKCBAr24UyPD7xwmjaTn.jpg",
    videoUrl: "https://www.youtube.com/embed/eOrNdBpGMv8",
    type: "action",
    tags: ["Action", "Heroes", "Epic"]
  },
  {
    id: "5",
    title: "Shrek - I'm a Believer",
    movieTitle: "Shrek",
    year: 2001,
    duration: 75,
    thumbnail: "https://image.tmdb.org/t/p/w500/iB64vpL3dIObOtMZgX3RqdVdQDc.jpg",
    videoUrl: "https://www.youtube.com/embed/0mYBSayCsH0",
    type: "musical",
    tags: ["Comedy", "Family", "Musical"]
  }
];

export default function MovieClips({ onClipSelect, selectedClip }: MovieClipsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showPreview, setShowPreview] = useState(false);
  const [previewClip, setPreviewClip] = useState<any>(null);

  // Filter clips based on search and category
  const filteredClips = SAMPLE_CLIPS.filter(clip => {
    const matchesSearch = searchQuery === "" || 
      clip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clip.movieTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      clip.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === "all" || clip.type === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { value: "all", label: "All Clips" },
    { value: "scene", label: "Iconic Scenes" },
    { value: "action", label: "Action" },
    { value: "musical", label: "Musical" },
    { value: "comedy", label: "Comedy" }
  ];

  const handlePreview = (clip: any) => {
    setPreviewClip(clip);
    setShowPreview(true);
  };

  const handleSelectClip = (clip: any) => {
    onClipSelect(clip);
    setShowPreview(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-4">
        <Film className="w-5 h-5 text-cine-gold" />
        <h3 className="font-semibold text-cine-text">Movie Clips & Scenes</h3>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cine-muted w-4 h-4" />
        <Input
          placeholder="Search clips, movies, or scenes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-cine-gray border-cine-gray/50 text-cine-text placeholder-cine-muted focus:border-cine-gold"
        />
      </div>

      {/* Categories */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <Button
            key={category.value}
            variant={selectedCategory === category.value ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(category.value)}
            className={selectedCategory === category.value 
              ? "bg-cine-gold text-cine-black hover:bg-cine-gold/90"
              : "border-cine-gray text-cine-muted hover:bg-cine-gray/30"
            }
          >
            {category.label}
          </Button>
        ))}
      </div>

      {/* Selected Clip Display */}
      {selectedClip && (
        <Card className="bg-cine-blue/10 border-cine-blue/30">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img
                  src={selectedClip.thumbnail}
                  alt={selectedClip.title}
                  className="w-16 h-20 object-cover rounded"
                />
                <div className="absolute inset-0 bg-black/20 rounded flex items-center justify-center">
                  <Play className="w-4 h-4 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-cine-text text-sm">{selectedClip.title}</h4>
                <p className="text-xs text-cine-muted">{selectedClip.movieTitle} ({selectedClip.year})</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Clock className="w-3 h-3 text-cine-muted" />
                  <span className="text-xs text-cine-muted">{selectedClip.duration}s</span>
                  <Badge variant="secondary" className="text-xs bg-cine-blue/20 text-cine-blue">
                    Selected
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onClipSelect(null)}
                className="text-cine-muted hover:text-cine-text"
              >
                Remove
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clips Grid */}
      <ScrollArea className="h-64">
        <div className="grid grid-cols-1 gap-3">
          {filteredClips.map((clip) => (
            <Card key={clip.id} className="bg-cine-gray/30 border-cine-gray/50 hover:border-cine-gold/50 transition-colors">
              <CardContent className="p-3">
                <div className="flex items-center space-x-3">
                  <div className="relative cursor-pointer" onClick={() => handlePreview(clip)}>
                    <img
                      src={clip.thumbnail}
                      alt={clip.title}
                      className="w-12 h-16 object-cover rounded flex-shrink-0"
                    />
                    <div className="absolute inset-0 bg-black/20 rounded flex items-center justify-center hover:bg-black/40 transition-colors">
                      <Play className="w-3 h-3 text-white" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-cine-text text-sm truncate">{clip.title}</h4>
                    <p className="text-xs text-cine-muted">{clip.movieTitle} ({clip.year})</p>
                    
                    <div className="flex items-center space-x-2 mt-1">
                      <Clock className="w-3 h-3 text-cine-muted" />
                      <span className="text-xs text-cine-muted">{clip.duration}s</span>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {clip.tags.slice(0, 2).map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs bg-cine-gray text-cine-muted">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleSelectClip(clip)}
                    className="bg-cine-gold text-cine-black hover:bg-cine-gold/90"
                    disabled={selectedClip?.id === clip.id}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* Clip Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-cine-text">{previewClip?.title}</DialogTitle>
          </DialogHeader>
          
          {previewClip && (
            <div className="space-y-4">
              <div className="aspect-video">
                <iframe
                  src={previewClip.videoUrl}
                  title={previewClip.title}
                  className="w-full h-full rounded"
                  allowFullScreen
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-cine-muted">{previewClip.movieTitle} ({previewClip.year})</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Clock className="w-4 h-4 text-cine-muted" />
                    <span className="text-sm text-cine-muted">{previewClip.duration} seconds</span>
                  </div>
                </div>
                
                <Button
                  onClick={() => handleSelectClip(previewClip)}
                  className="bg-cine-gold text-cine-black hover:bg-cine-gold/90"
                >
                  Use This Clip
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {previewClip.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="bg-cine-blue/20 text-cine-blue">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}