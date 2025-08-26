import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertPostSchema, insertInteractionSchema, insertListSchema } from "@shared/schema";
import { tmdbService } from "./tmdb";
import { openaiService } from "./openai";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  const hasDb = !!process.env.DATABASE_URL;
  const hasTmdb = !!process.env.TMDB_API_KEY;

  // Log startup status
  console.log(`🚀 CineLoop starting with: DB=${hasDb ? 'Connected' : 'Memory'}, TMDB=${hasTmdb ? 'Available' : 'Disabled'}, AI=${!!process.env.OPENAI_API_KEY ? 'Available' : 'Disabled'}`);

  // ---- HEALTH CHECK (no auth) -----------------------------------
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      env: process.env.NODE_ENV || "development",
      hasOpenAI: !!process.env.OPENAI_API_KEY,
      openaiKeyLength: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0,
      hasDb,
      hasTmdb,
      tmdbKeyLength: process.env.TMDB_API_KEY ? process.env.TMDB_API_KEY.length : 0,
    });
  });

  // ---- FRIENDLY HINT FOR /api/login -----------------------------
  app.get("/api/login", (_req, res) => {
    res.status(405).json({ error: "Use GET /api/auth/user after auth. Login is handled upstream." });
  });

  // API routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;

      // NO DB? Return a synthetic user so the app loads
      if (!hasDb) {
        return res.json({
          id: userId,
          username: req.user.claims.username || "dev",
          displayName: "Dev User",
          bio: "Local dev user (no DB)",
          email: null,
          firstName: null,
          lastName: null,
          profileImageUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        // Auto-create user if not exists
        const newUser = await storage.upsertUser({
          id: userId,
          username: req.user.claims.username || "dev",
          displayName: req.user.claims.username || "Dev User",
        });
        return res.json(newUser);
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      // Fallback to synthetic user in case of any error
      res.json({
        id: req.user.claims.sub,
        username: req.user.claims.username || "dev",
        displayName: "Dev User",
        bio: "Fallback user",
        email: null,
        firstName: null,
        lastName: null,
        profileImageUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  });

  // Feed routes
  app.get('/api/feed', isAuthenticated, async (req: any, res) => {
    try {
      if (!hasDb) {
        // Return empty feed when no database
        return res.json([]);
      }

      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const posts = await storage.getFeedPosts(userId, limit, offset);

      // Enrich posts with user and title data
      const enrichedPosts = await Promise.all(posts.map(async (post) => {
        const author = await storage.getUser(post.authorId);
        const title = await storage.getTitle(post.titleId);
        const userLike = await storage.getUserInteraction(userId, post.id, 'like');
        const userSave = await storage.getUserInteraction(userId, post.id, 'save');

        return {
          ...post,
          author,
          title,
          isLiked: !!userLike,
          isSaved: !!userSave,
        };
      }));

      res.json(enrichedPosts);
    } catch (error) {
      console.error("Error fetching feed:", error);
      res.status(500).json({ message: "Failed to fetch feed" });
    }
  });

  // Posts routes
  app.post('/api/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postData = insertPostSchema.parse({ ...req.body, authorId: userId });

      const post = await storage.createPost(postData);
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid post data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create post" });
      }
    }
  });

  app.post('/api/posts/:postId/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { postId } = req.params;

      const existingLike = await storage.getUserInteraction(userId, postId, 'like');
      if (existingLike) {
        res.status(400).json({ message: "Already liked" });
        return;
      }

      await storage.createInteraction({
        userId,
        postId,
        type: 'like',
      });

      res.status(201).json({ message: "Post liked" });
    } catch (error) {
      console.error("Error liking post:", error);
      res.status(500).json({ message: "Failed to like post" });
    }
  });

  app.delete('/api/posts/:postId/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { postId } = req.params;

      const existingLike = await storage.getUserInteraction(userId, postId, 'like');
      if (!existingLike) {
        res.status(400).json({ message: "Not liked" });
        return;
      }

      await storage.deleteInteraction(existingLike.id);
      res.json({ message: "Like removed" });
    } catch (error) {
      console.error("Error unliking post:", error);
      res.status(500).json({ message: "Failed to unlike post" });
    }
  });

  app.post('/api/posts/:postId/save', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { postId } = req.params;

      const existingSave = await storage.getUserInteraction(userId, postId, 'save');
      if (existingSave) {
        res.status(400).json({ message: "Already saved" });
        return;
      }

      await storage.createInteraction({
        userId,
        postId,
        type: 'save',
      });

      res.status(201).json({ message: "Post saved" });
    } catch (error) {
      console.error("Error saving post:", error);
      res.status(500).json({ message: "Failed to save post" });
    }
  });

  app.delete('/api/posts/:postId/save', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { postId } = req.params;

      const existingSave = await storage.getUserInteraction(userId, postId, 'save');
      if (!existingSave) {
        res.status(400).json({ message: "Not saved" });
        return;
      }

      await storage.deleteInteraction(existingSave.id);
      res.json({ message: "Save removed" });
    } catch (error) {
      console.error("Error unsaving post:", error);
      res.status(500).json({ message: "Failed to unsave post" });
    }
  });

  // Titles routes
  app.get('/api/titles/trending', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;

      console.log(`Fetching trending titles with limit: ${limit}`);

      // First try to get from database, otherwise fetch from TMDB
      let titles = hasDb ? await storage.getTrendingTitles(limit) : [];
      console.log(`Found ${titles.length} titles in database`);

      if (titles.length === 0) {
        console.log("No titles in database, fetching from TMDB...");
        // No titles in database, fetch from TMDB and store them
        try {
          const tmdbTitles = await tmdbService.getTrending();
          console.log(`Fetched ${tmdbTitles.length} titles from TMDB`);

          // Store titles in database
          for (const tmdbTitle of tmdbTitles.slice(0, limit)) {
            try {
              console.log(`Storing title: ${tmdbTitle.name}`);
              await storage.createTitle(tmdbTitle);
            } catch (error) {
              console.error(`Error storing title ${tmdbTitle.name}:`, error);
              // Title might already exist, continue
            }
          }

          titles = tmdbTitles.slice(0, limit) as any[];
        } catch (tmdbError) {
          console.error("Error fetching from TMDB:", tmdbError);
          // Return whatever we have in database
          titles = await storage.getTrendingTitles(limit);
        }
      }

      console.log(`Returning ${titles.length} titles`);
      res.json(titles);
    } catch (error) {
      console.error("Error fetching trending titles:", error);
      res.status(500).json({ message: "Failed to fetch trending titles" });
    }
  });

  app.get('/api/titles/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const title = await storage.getTitle(id);

      if (!title) {
        res.status(404).json({ message: "Title not found" });
        return;
      }

      res.json(title);
    } catch (error) {
      console.error("Error fetching title:", error);
      res.status(500).json({ message: "Failed to fetch title" });
    }
  });

  app.get('/api/titles/:id/posts', async (req, res) => {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;

      const posts = await storage.getPostsByTitle(id, limit);

      // Enrich posts with user data
      const enrichedPosts = await Promise.all(posts.map(async (post) => {
        const author = await storage.getUser(post.authorId);
        const title = await storage.getTitle(post.titleId);
        return { ...post, author, title };
      }));

      res.json(enrichedPosts);
    } catch (error) {
      console.error("Error fetching title posts:", error);
      res.status(500).json({ message: "Failed to fetch title posts" });
    }
  });

  app.get('/api/titles/:id/related', async (req, res) => {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 5;

      const relatedTitles = await storage.getRelatedTitles(id, limit);
      res.json(relatedTitles);
    } catch (error) {
      console.error("Error fetching related titles:", error);
      res.status(500).json({ message: "Failed to fetch related titles" });
    }
  });

  // Search routes - Use TMDB directly as per product requirements
  app.get('/api/search', async (req, res) => {
    try {
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!query) {
        res.status(400).json({ message: "Search query required" });
        return;
      }

      if (!process.env.TMDB_API_KEY) {
        // Fallback: local DB search only
        try {
          const q = String(req.query.q || "");
          const limit = parseInt(String(req.query.limit || 20));
          const local = await storage.searchTitles(q, limit);
          return res.json(local);
        } catch {
          return res.json([]); // don't crash
        }
      }

      // Use TMDB multi-search directly as specified in requirements
      try {
        const tmdbResults = await tmdbService.searchTitles(query);

        // Store new titles in database for future reference
        for (const tmdbTitle of tmdbResults.slice(0, limit)) {
          try {
            const existing = await storage.getTitleByExternalId(tmdbTitle.externalId!);
            if (!existing) {
              await storage.createTitle(tmdbTitle);
            }
          } catch (error) {
            // Continue if error storing - don't break search
          }
        }

        res.json(tmdbResults.slice(0, limit));
      } catch (tmdbError) {
        console.error("Error searching TMDB:", tmdbError);
        // Fallback to local search only if TMDB fails
        try {
          const localResults = await storage.searchTitles(query, limit);
          res.json(localResults);
        } catch (localError) {
          console.error("Error with local search fallback:", localError);
          res.json([]); // Return empty array instead of error
        }
      }
    } catch (error) {
      console.error("Error in search endpoint:", error);
      res.status(500).json({ message: "Failed to search titles" });
    }
  });

  // OpenAI conversational movie discovery
  app.post('/api/ai/chat', isAuthenticated, async (req: any, res) => {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ message: "AI disabled in dev (missing OPENAI_API_KEY)" });
    }

    try {
      const { message, sessionId, conversationHistory = [] } = req.body;
      const userId = req.user.claims.sub;

      if (!message) {
        res.status(400).json({ message: "Message required" });
        return;
      }

      console.log(`AI Chat - User: ${userId}, Session: ${sessionId}, Message: ${message}`);

      // Get AI recommendations using OpenAI
      const aiResponse = await openaiService.getMovieRecommendations(message, conversationHistory);

      console.log(`AI Response: ${aiResponse.recommendations.length} recommendations`);

      // Try to match AI recommendations with our database titles, fallback to TMDB
      const enrichedRecommendations = await Promise.all(
        aiResponse.recommendations.map(async (rec) => {
          // Try database first if available
          if (hasDb) {
            try {
              const dbResults = await storage.searchTitles(rec.title, 1);
              if (dbResults.length > 0) {
                return {
                  ...dbResults[0],
                  reason: rec.reason,
                  badges: [rec.genre || rec.type].filter(Boolean),
                  aiRecommendation: true
                };
              }
            } catch (dbError) {
              console.error("Database search failed, trying TMDB:", dbError);
            }
          }

          // Try TMDB if database failed or not available
          if (process.env.TMDB_API_KEY) {
            try {
              const tmdbResults = await tmdbService.searchTitles(rec.title);
              if (tmdbResults.length > 0) {
                const tmdbTitle = tmdbResults[0];
                
                // Try to store in database if available
                if (hasDb) {
                  try {
                    await storage.createTitle(tmdbTitle);
                  } catch (error) {
                    // Continue if storage fails
                  }
                }

                return {
                  ...tmdbTitle,
                  reason: rec.reason,
                  badges: [rec.genre || rec.type].filter(Boolean),
                  aiRecommendation: true
                };
              }
            } catch (tmdbError) {
              console.error("Error fetching from TMDB:", tmdbError);
            }
          }

          // If not found anywhere, return AI recommendation as-is
          return {
            name: rec.title,
            year: rec.year,
            type: rec.type,
            genres: rec.genre ? [rec.genre] : [],
            reason: rec.reason,
            badges: [rec.genre || rec.type].filter(Boolean),
            aiRecommendation: true,
            notFound: true
          };
        })
      );

      res.json({
        message: aiResponse.message,
        recommendations: enrichedRecommendations,
        conversationContinues: aiResponse.conversationContinues,
        sessionId: sessionId || `session_${Date.now()}`
      });

    } catch (error) {
      console.error("Error with AI chat:", error);
      res.status(500).json({ message: "AI chat failed" });
    }
  });

  // OpenAI search with context
  app.post('/api/ai/search', isAuthenticated, async (req: any, res) => {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ message: "AI disabled in dev (missing OPENAI_API_KEY)" });
    }

    try {
      const { query, context } = req.body;

      if (!query) {
        res.status(400).json({ message: "Query required" });
        return;
      }

      console.log(`AI Search - Query: ${query}, Context: ${context || 'none'}`);

      // Get AI search results
      const aiRecommendations = await openaiService.searchMoviesWithContext(query, context);

      // Enrich with database/TMDB data
      const enrichedResults = await Promise.all(
        aiRecommendations.map(async (rec) => {
          // Try database first if available
          if (hasDb) {
            try {
              const dbResults = await storage.searchTitles(rec.title, 1);
              if (dbResults.length > 0) {
                return {
                  ...dbResults[0],
                  reason: rec.reason,
                  badges: [rec.genre || rec.type].filter(Boolean),
                  aiSearch: true
                };
              }
            } catch (dbError) {
              console.error("Database search failed, trying TMDB:", dbError);
            }
          }

          // Try TMDB if database failed or not available
          if (process.env.TMDB_API_KEY) {
            try {
              const tmdbResults = await tmdbService.searchTitles(rec.title);
              if (tmdbResults.length > 0) {
                const tmdbTitle = tmdbResults[0];
                
                // Try to store in database if available
                if (hasDb) {
                  try {
                    await storage.createTitle(tmdbTitle);
                  } catch (error) {
                    // Continue if storage fails
                  }
                }

                return {
                  ...tmdbTitle,
                  reason: rec.reason,
                  badges: [rec.genre || rec.type].filter(Boolean),
                  aiSearch: true
                };
              }
            } catch (tmdbError) {
              console.error("Error fetching from TMDB:", tmdbError);
            }
          }

          return {
            name: rec.title,
            year: rec.year,
            type: rec.type,
            genres: rec.genre ? [rec.genre] : [],
            reason: rec.reason,
            badges: [rec.genre || rec.type].filter(Boolean),
            aiSearch: true,
            notFound: true
          };
        })
      );

      res.json({ results: enrichedResults });
    } catch (error) {
      console.error("Error with AI search:", error);
      res.status(500).json({ message: "AI search failed" });
    }
  });

  // Recommendations routes
  app.get('/api/recommendations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = parseInt(req.query.limit as string) || 10;

      const recommendations = await storage.getUserRecommendations(userId, limit);

      // Enrich with title data
      const enrichedRecs = await Promise.all(recommendations.map(async (rec) => {
        const title = await storage.getTitle(rec.titleId);
        return { ...rec, title };
      }));

      res.json(enrichedRecs);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  app.post('/api/recommendations/:id/shown', isAuthenticated, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.markRecommendationShown(id);
      res.json({ message: "Marked as shown" });
    } catch (error) {
      console.error("Error marking recommendation as shown:", error);
      res.status(500).json({ message: "Failed to mark as shown" });
    }
  });

  // User list routes
  app.get('/api/users/:userId/watchlist', isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const watchlist = await storage.getUserWatchlist(userId);
      res.json(watchlist);
    } catch (error) {
      console.error("Error fetching watchlist:", error);
      res.status(500).json({ message: "Failed to fetch watchlist" });
    }
  });

  app.get('/api/users/:userId/favorites', isAuthenticated, async (req, res) => {
    try {
      const { userId } = req.params;
      const favorites = await storage.getUserFavorites(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.post('/api/watchlist/:titleId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { titleId } = req.params;

      const watchlist = await storage.getUserWatchlist(userId);
      if (!watchlist) {
        res.status(404).json({ message: "Watchlist not found" });
        return;
      }

      await storage.addToList(watchlist.id, titleId);
      res.json({ message: "Added to watchlist" });
    } catch (error) {
      console.error("Error adding to watchlist:", error);
      res.status(500).json({ message: "Failed to add to watchlist" });
    }
  });

  app.post('/api/favorites/:titleId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { titleId } = req.params;

      const favorites = await storage.getUserFavorites(userId);
      if (!favorites) {
        res.status(404).json({ message: "Favorites not found" });
        return;
      }

      await storage.addToList(favorites.id, titleId);
      res.json({ message: "Added to favorites" });
    } catch (error) {
      console.error("Error adding to favorites:", error);
      res.status(500).json({ message: "Failed to add to favorites" });
    }
  });

  // User profile routes
  app.get('/api/users/profile/:username?', isAuthenticated, async (req: any, res) => {
    try {
      const { username } = req.params;
      const currentUserId = req.user.claims.sub;

      let user;
      if (username) {
        user = await storage.getUserByUsername(username);
      } else {
        user = await storage.getUser(currentUserId);
      }

      if (!user) {
        res.status(404).json({ message: "User not found" });
        return;
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  app.get('/api/users/:userId/posts', async (req, res) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;

      const posts = await storage.getPostsByUser(userId, limit);

      // Enrich posts with user and title data
      const enrichedPosts = await Promise.all(posts.map(async (post) => {
        const author = await storage.getUser(post.authorId);
        const title = await storage.getTitle(post.titleId);
        return { ...post, author, title };
      }));

      res.json(enrichedPosts);
    } catch (error) {
      console.error("Error fetching user posts:", error);
      res.status(500).json({ message: "Failed to fetch user posts" });
    }
  });

  app.get('/api/users/:userId/lists', async (req, res) => {
    try {
      const { userId } = req.params;
      const lists = await storage.getUserLists(userId);
      res.json(lists);
    } catch (error) {
      console.error("Error fetching user lists:", error);
      res.status(500).json({ message: "Failed to fetch user lists" });
    }
  });

  app.get('/api/users/:userId/follow-stats', async (req, res) => {
    try {
      const { userId } = req.params;
      const followers = await storage.getUserFollowers(userId);
      const following = await storage.getUserFollows(userId);

      res.json({
        followersCount: followers.length,
        followingCount: following.length,
      });
    } catch (error) {
      console.error("Error fetching follow stats:", error);
      res.status(500).json({ message: "Failed to fetch follow stats" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}