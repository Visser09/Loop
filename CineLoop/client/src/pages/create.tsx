
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertPostSchema } from "@shared/schema";
import { z } from "zod";
import Header from "@/components/layout/header";
import BottomNav from "@/components/layout/bottom-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Upload, X, Star, Film } from "lucide-react";
import MovieClips from "@/components/create/movie-clips";

const createPostSchema = insertPostSchema.extend({
  moodTags: z.array(z.string()).default([]),
});

type CreatePostForm = z.infer<typeof createPostSchema>;

export default function Create() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showTitleSearch, setShowTitleSearch] = useState(false);
  const [titleQuery, setTitleQuery] = useState("");
  const [selectedTitle, setSelectedTitle] = useState<any>(null);
  const [selectedClip, setSelectedClip] = useState<any>(null);
  const [moodTags, setMoodTags] = useState<string[]>([]);
  const [currentMoodTag, setCurrentMoodTag] = useState("");

  const form = useForm<CreatePostForm>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      titleId: "",
      caption: "",
      userRating: undefined,
      moodTags: [],
    },
  });

  const { data: titleSearchResults = [] } = useQuery({
    queryKey: ["/api/search", titleQuery],
    queryFn: async () => {
      if (!titleQuery) return [];
      const response = await fetch(`/api/search?q=${encodeURIComponent(titleQuery)}`);
      return response.json();
    },
    enabled: titleQuery.length > 2,
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: CreatePostForm) => {
      const response = await apiRequest("POST", "/api/posts", {
        ...data,
        moodTags,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your post has been created!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
      window.history.back();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSelectTitle = (title: any) => {
    setSelectedTitle(title);
    form.setValue("titleId", title.id);
    setShowTitleSearch(false);
  };

  const addMoodTag = () => {
    if (currentMoodTag.trim() && !moodTags.includes(currentMoodTag.trim())) {
      setMoodTags([...moodTags, currentMoodTag.trim()]);
      setCurrentMoodTag("");
    }
  };

  const removeMoodTag = (tag: string) => {
    setMoodTags(moodTags.filter(t => t !== tag));
  };

  const onSubmit = (data: CreatePostForm) => {
    if (!selectedTitle) {
      toast({
        title: "Error",
        description: "Please select a title first",
        variant: "destructive",
      });
      return;
    }
    createPostMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-cine-black">
      <Header 
        onSearchClick={() => {}} 
        onNotificationsClick={() => {}}
        title="Create Post"
      />
      
      <main className="pb-20 px-4 pt-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Title Selection */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-cine-text">Select Title</label>
              
              {selectedTitle ? (
                <div className="flex items-center space-x-3 bg-cine-gray/30 rounded-xl p-3">
                  <img
                    src={selectedTitle.posterUrl}
                    alt={selectedTitle.name}
                    className="w-16 h-24 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-cine-text">{selectedTitle.name}</h3>
                    <p className="text-sm text-cine-muted">{selectedTitle.year} • {selectedTitle.type}</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <Star className="w-3 h-3 text-cine-gold fill-current" />
                      <span className="text-xs text-cine-muted">{selectedTitle.rating}</span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedTitle(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start bg-cine-gray/30 border-cine-gray/50 text-cine-text hover:bg-cine-gray/50"
                  onClick={() => setShowTitleSearch(true)}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search for a movie or TV show
                </Button>
              )}
            </div>

            {/* Media Options */}
            <div className="space-y-6">
              {/* Upload Custom Media */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-cine-text">Upload Your Own Media</label>
                <div className="border-2 border-dashed border-cine-gray/50 rounded-xl p-6 text-center">
                  <Upload className="w-6 h-6 text-cine-muted mx-auto mb-2" />
                  <p className="text-sm text-cine-muted mb-1">Upload an image or video clip</p>
                  <p className="text-xs text-cine-muted">Max 15 seconds for videos, 5MB for images</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-cine-blue"
                  >
                    Choose File
                  </Button>
                </div>
              </div>

              {/* Movie Clips */}
              <div className="border border-cine-gray/30 rounded-xl p-4">
                <MovieClips 
                  onClipSelect={setSelectedClip}
                  selectedClip={selectedClip}
                />
              </div>
            </div>

            {/* Caption */}
            <FormField
              control={form.control}
              name="caption"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-cine-text">Caption</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share your thoughts about this title..."
                      className="bg-cine-gray border-cine-gray/50 text-cine-text placeholder-cine-muted focus:border-cine-blue resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Rating */}
            <FormField
              control={form.control}
              name="userRating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-cine-text">Your Rating (Optional)</FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => field.onChange(star)}
                          className="text-2xl focus:outline-none"
                        >
                          <Star
                            className={`w-6 h-6 ${
                              field.value && field.value >= star
                                ? "text-cine-gold fill-current"
                                : "text-cine-muted"
                            }`}
                          />
                        </button>
                      ))}
                      {field.value && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => field.onChange(undefined)}
                          className="text-cine-muted"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Mood Tags */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-cine-text">Mood Tags</label>
              <div className="flex space-x-2">
                <Input
                  placeholder="Add a mood tag (e.g., Epic, Funny, Emotional)"
                  value={currentMoodTag}
                  onChange={(e) => setCurrentMoodTag(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addMoodTag())}
                  className="flex-1 bg-cine-gray border-cine-gray/50 text-cine-text placeholder-cine-muted focus:border-cine-blue"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addMoodTag}
                  disabled={!currentMoodTag.trim()}
                >
                  Add
                </Button>
              </div>
              
              {moodTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {moodTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="bg-cine-blue/20 text-cine-blue border-cine-blue/30"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeMoodTag(tag)}
                        className="ml-2 text-cine-blue hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={createPostMutation.isPending || !selectedTitle}
              className="w-full cine-gradient text-black font-semibold py-6 text-lg"
            >
              {createPostMutation.isPending ? "Publishing..." : "Publish Post"}
            </Button>
          </form>
        </Form>

        {/* Title Search Modal */}
        <Dialog open={showTitleSearch} onOpenChange={setShowTitleSearch}>
          <DialogContent className="bg-cine-dark border-cine-gray">
            <DialogHeader>
              <DialogTitle className="text-cine-text">Search for a Title</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-cine-muted w-5 h-5" />
                <Input
                  placeholder="Search movies and TV shows..."
                  value={titleQuery}
                  onChange={(e) => setTitleQuery(e.target.value)}
                  className="pl-10 bg-cine-gray border-cine-gray/50 text-cine-text placeholder-cine-muted focus:border-cine-blue"
                />
              </div>

              <div className="max-h-96 overflow-y-auto space-y-2">
                {titleSearchResults.length === 0 && titleQuery ? (
                  <p className="text-center text-cine-muted py-4">No results found</p>
                ) : (
                  titleSearchResults.map((title: any) => (
                    <div
                      key={title.id}
                      onClick={() => handleSelectTitle(title)}
                      className="flex items-center space-x-3 p-3 rounded-lg hover:bg-cine-gray/30 cursor-pointer transition-colors"
                    >
                      <img
                        src={title.posterUrl}
                        alt={title.name}
                        className="w-12 h-18 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-cine-text">{title.name}</h3>
                        <p className="text-sm text-cine-muted">{title.year} • {title.type}</p>
                        <div className="flex items-center space-x-1 mt-1">
                          <Star className="w-3 h-3 text-cine-gold fill-current" />
                          <span className="text-xs text-cine-muted">{title.rating}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>

      <BottomNav />
    </div>
  );
}
