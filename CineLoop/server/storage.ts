import {
  users,
  titles,
  posts,
  interactions,
  follows,
  lists,
  recommendations,
  reports,
  type User,
  type UpsertUser,
  type Title,
  type InsertTitle,
  type Post,
  type InsertPost,
  type Interaction,
  type InsertInteraction,
  type Follow,
  type InsertFollow,
  type List,
  type InsertList,
  type Recommendation,
  type InsertRecommendation,
  type Report,
  type InsertReport,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, like, desc, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { tmdbService } from "./tmdb";

// Interface for storage operations
export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  
  // Title operations
  getTitle(id: string): Promise<Title | undefined>;
  getTitleByExternalId(externalId: string): Promise<Title | undefined>;
  createTitle(title: InsertTitle): Promise<Title>;
  searchTitles(query: string, limit?: number): Promise<Title[]>;
  getTrendingTitles(limit?: number): Promise<Title[]>;
  getRelatedTitles(titleId: string, limit?: number): Promise<Title[]>;
  
  // Post operations
  getPost(id: string): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  getFeedPosts(userId: string, limit?: number, offset?: number): Promise<Post[]>;
  getPostsByTitle(titleId: string, limit?: number): Promise<Post[]>;
  getPostsByUser(userId: string, limit?: number): Promise<Post[]>;
  updatePostCounts(postId: string, type: 'like' | 'comment' | 'repost' | 'save', increment: boolean): Promise<void>;
  
  // Interaction operations
  createInteraction(interaction: InsertInteraction): Promise<Interaction>;
  getUserInteraction(userId: string, postId: string, type: string): Promise<Interaction | undefined>;
  deleteInteraction(id: string): Promise<void>;
  getPostComments(postId: string, limit?: number): Promise<Interaction[]>;
  
  // Follow operations
  createFollow(follow: InsertFollow): Promise<Follow>;
  deleteFollow(followerId: string, followingId: string): Promise<void>;
  getUserFollows(userId: string): Promise<Follow[]>;
  getUserFollowers(userId: string): Promise<Follow[]>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  getSuggestedUsers(userId: string, limit?: number): Promise<User[]>;
  
  // List operations
  createList(list: InsertList): Promise<List>;
  getUserLists(userId: string): Promise<List[]>;
  getList(id: string): Promise<List | undefined>;
  updateList(id: string, updates: Partial<InsertList>): Promise<List>;
  deleteList(id: string): Promise<void>;
  addToList(listId: string, titleId: string): Promise<void>;
  removeFromList(listId: string, titleId: string): Promise<void>;
  getUserWatchlist(userId: string): Promise<List | undefined>;
  getUserFavorites(userId: string): Promise<List | undefined>;
  
  // Recommendation operations
  createRecommendation(recommendation: InsertRecommendation): Promise<Recommendation>;
  getUserRecommendations(userId: string, limit?: number): Promise<Recommendation[]>;
  markRecommendationShown(id: string): Promise<void>;
  
  // Report operations
  createReport(report: InsertReport): Promise<Report>;
  getReports(status?: string): Promise<Report[]>;
  updateReportStatus(id: string, status: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private titles: Map<string, Title>;
  private posts: Map<string, Post>;
  private interactions: Map<string, Interaction>;
  private follows: Map<string, Follow>;
  private lists: Map<string, List>;
  private recommendations: Map<string, Recommendation>;
  private reports: Map<string, Report>;

  constructor() {
    this.users = new Map();
    this.titles = new Map();
    this.posts = new Map();
    this.interactions = new Map();
    this.follows = new Map();
    this.lists = new Map();
    this.recommendations = new Map();
    this.reports = new Map();
    
    this.seedData();
  }

  // Seed with sample movie/TV data
  private seedData() {
    const sampleTitles = [
      {
        id: "dune-2021",
        externalId: "438631",
        name: "Dune",
        type: "movie" as const,
        year: 2021,
        genres: ["Sci-Fi", "Adventure", "Drama"],
        synopsis: "Paul Atreides, a brilliant and gifted young man born into a great destiny beyond his understanding, must travel to the most dangerous planet in the universe to ensure the future of his family and his people.",
        posterUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1200",
        backdropUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&h=900",
        runtime: 155,
        cast: ["Timothée Chalamet", "Rebecca Ferguson", "Oscar Isaac", "Josh Brolin"],
        crew: ["Denis Villeneuve"],
        rating: 4.2,
        createdAt: new Date(),
      },
      {
        id: "the-bear-2022",
        externalId: "136315",
        name: "The Bear",
        type: "tv" as const,
        year: 2022,
        genres: ["Comedy", "Drama"],
        synopsis: "A young chef from the fine dining world comes home to Chicago to run his family sandwich shop.",
        posterUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1200",
        backdropUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&h=900",
        runtime: 30,
        cast: ["Jeremy Allen White", "Ebon Moss-Bachrach", "Ayo Edebiri"],
        crew: ["Christopher Storer"],
        rating: 4.7,
        createdAt: new Date(),
      },
      {
        id: "blade-runner-2049",
        externalId: "335984",
        name: "Blade Runner 2049",
        type: "movie" as const,
        year: 2017,
        genres: ["Sci-Fi", "Thriller"],
        synopsis: "Young Blade Runner K's discovery of a long-buried secret leads him to track down former Blade Runner Rick Deckard.",
        posterUrl: "https://images.unsplash.com/photo-1595769816263-9b910be24d5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=1200",
        backdropUrl: "https://images.unsplash.com/photo-1595769816263-9b910be24d5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&h=900",
        runtime: 164,
        cast: ["Ryan Gosling", "Harrison Ford", "Ana de Armas"],
        crew: ["Denis Villeneuve"],
        rating: 4.4,
        createdAt: new Date(),
      }
    ];

    sampleTitles.forEach(title => this.titles.set(title.id, title));
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existing = Array.from(this.users.values()).find(u => u.id === userData.id);
    
    if (existing) {
      const updated = { ...existing, ...userData, updatedAt: new Date() };
      this.users.set(existing.id, updated);
      return updated;
    } else {
      const id = userData.id || randomUUID();
      const user: User = {
        ...userData,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.users.set(id, user);
      
      // Create system lists for new user
      await this.createList({
        ownerId: id,
        name: "Watchlist",
        description: "Movies and TV shows I want to watch",
        isPublic: false,
        isSystem: true,
        titleIds: [],
      });
      
      await this.createList({
        ownerId: id,
        name: "Favorites",
        description: "My favorite movies and TV shows",
        isPublic: false,
        isSystem: true,
        titleIds: [],
      });
      
      return user;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  // Title operations
  async getTitle(id: string): Promise<Title | undefined> {
    return this.titles.get(id);
  }

  async getTitleByExternalId(externalId: string): Promise<Title | undefined> {
    return Array.from(this.titles.values()).find(title => title.externalId === externalId);
  }

  async createTitle(titleData: InsertTitle): Promise<Title> {
    const id = titleData.id || randomUUID();
    const title: Title = {
      ...titleData,
      id,
      createdAt: new Date(),
    };
    this.titles.set(id, title);
    return title;
  }

  async searchTitles(query: string, limit = 20): Promise<Title[]> {
    const titles = Array.from(this.titles.values())
      .filter(title => 
        title.name.toLowerCase().includes(query.toLowerCase()) ||
        title.genres?.some(genre => genre.toLowerCase().includes(query.toLowerCase()))
      )
      .slice(0, limit);
    return titles;
  }

  async getTrendingTitles(limit = 10): Promise<Title[]> {
    return Array.from(this.titles.values())
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, limit);
  }

  async getRelatedTitles(titleId: string, limit = 5): Promise<Title[]> {
    const title = await this.getTitle(titleId);
    if (!title) return [];
    
    return Array.from(this.titles.values())
      .filter(t => t.id !== titleId && t.genres?.some(g => title.genres?.includes(g)))
      .slice(0, limit);
  }

  // Post operations
  async getPost(id: string): Promise<Post | undefined> {
    return this.posts.get(id);
  }

  async createPost(postData: InsertPost): Promise<Post> {
    const id = randomUUID();
    const post: Post = {
      ...postData,
      id,
      likesCount: 0,
      commentsCount: 0,
      repostsCount: 0,
      savesCount: 0,
      isReported: false,
      isHidden: false,
      createdAt: new Date(),
    };
    this.posts.set(id, post);
    return post;
  }

  async getFeedPosts(userId: string, limit = 20, offset = 0): Promise<Post[]> {
    // Get user's followed accounts
    const following = Array.from(this.follows.values())
      .filter(follow => follow.followerId === userId)
      .map(follow => follow.followingId);
    
    // Include user's own posts
    following.push(userId);
    
    return Array.from(this.posts.values())
      .filter(post => following.includes(post.authorId) && !post.isHidden)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }

  async getPostsByTitle(titleId: string, limit = 20): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter(post => post.titleId === titleId && !post.isHidden)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getPostsByUser(userId: string, limit = 20): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter(post => post.authorId === userId && !post.isHidden)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async updatePostCounts(postId: string, type: 'like' | 'comment' | 'repost' | 'save', increment: boolean): Promise<void> {
    const post = this.posts.get(postId);
    if (!post) return;

    const delta = increment ? 1 : -1;
    switch (type) {
      case 'like':
        post.likesCount = Math.max(0, post.likesCount + delta);
        break;
      case 'comment':
        post.commentsCount = Math.max(0, post.commentsCount + delta);
        break;
      case 'repost':
        post.repostsCount = Math.max(0, post.repostsCount + delta);
        break;
      case 'save':
        post.savesCount = Math.max(0, post.savesCount + delta);
        break;
    }
    
    this.posts.set(postId, post);
  }

  // Interaction operations
  async createInteraction(interactionData: InsertInteraction): Promise<Interaction> {
    const id = randomUUID();
    const interaction: Interaction = {
      ...interactionData,
      id,
      createdAt: new Date(),
    };
    this.interactions.set(id, interaction);
    
    // Update post counts
    await this.updatePostCounts(
      interactionData.postId, 
      interactionData.type as 'like' | 'comment' | 'repost' | 'save', 
      true
    );
    
    return interaction;
  }

  async getUserInteraction(userId: string, postId: string, type: string): Promise<Interaction | undefined> {
    return Array.from(this.interactions.values()).find(
      interaction => 
        interaction.userId === userId && 
        interaction.postId === postId && 
        interaction.type === type
    );
  }

  async deleteInteraction(id: string): Promise<void> {
    const interaction = this.interactions.get(id);
    if (interaction) {
      this.interactions.delete(id);
      // Update post counts
      await this.updatePostCounts(
        interaction.postId, 
        interaction.type as 'like' | 'comment' | 'repost' | 'save', 
        false
      );
    }
  }

  async getPostComments(postId: string, limit = 20): Promise<Interaction[]> {
    return Array.from(this.interactions.values())
      .filter(interaction => interaction.postId === postId && interaction.type === 'comment')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  // Follow operations
  async createFollow(followData: InsertFollow): Promise<Follow> {
    const id = randomUUID();
    const follow: Follow = {
      ...followData,
      id,
      createdAt: new Date(),
    };
    this.follows.set(id, follow);
    return follow;
  }

  async deleteFollow(followerId: string, followingId: string): Promise<void> {
    const follow = Array.from(this.follows.values()).find(
      f => f.followerId === followerId && f.followingId === followingId
    );
    if (follow) {
      this.follows.delete(follow.id);
    }
  }

  async getUserFollows(userId: string): Promise<Follow[]> {
    return Array.from(this.follows.values())
      .filter(follow => follow.followerId === userId);
  }

  async getUserFollowers(userId: string): Promise<Follow[]> {
    return Array.from(this.follows.values())
      .filter(follow => follow.followingId === userId);
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    return Array.from(this.follows.values()).some(
      follow => follow.followerId === followerId && follow.followingId === followingId
    );
  }

  async getSuggestedUsers(userId: string, limit = 10): Promise<User[]> {
    // Simple suggestion: users not followed yet
    const following = (await this.getUserFollows(userId)).map(f => f.followingId);
    following.push(userId); // exclude self
    
    return Array.from(this.users.values())
      .filter(user => !following.includes(user.id))
      .slice(0, limit);
  }

  // List operations
  async createList(listData: InsertList): Promise<List> {
    const id = randomUUID();
    const list: List = {
      ...listData,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.lists.set(id, list);
    return list;
  }

  async getUserLists(userId: string): Promise<List[]> {
    return Array.from(this.lists.values())
      .filter(list => list.ownerId === userId);
  }

  async getList(id: string): Promise<List | undefined> {
    return this.lists.get(id);
  }

  async updateList(id: string, updates: Partial<InsertList>): Promise<List> {
    const list = this.lists.get(id);
    if (!list) throw new Error('List not found');
    
    const updated = { ...list, ...updates, updatedAt: new Date() };
    this.lists.set(id, updated);
    return updated;
  }

  async deleteList(id: string): Promise<void> {
    this.lists.delete(id);
  }

  async addToList(listId: string, titleId: string): Promise<void> {
    const list = this.lists.get(listId);
    if (!list) return;
    
    const titleIds = [...(list.titleIds || [])];
    if (!titleIds.includes(titleId)) {
      titleIds.push(titleId);
      await this.updateList(listId, { titleIds });
    }
  }

  async removeFromList(listId: string, titleId: string): Promise<void> {
    const list = this.lists.get(listId);
    if (!list) return;
    
    const titleIds = (list.titleIds || []).filter(id => id !== titleId);
    await this.updateList(listId, { titleIds });
  }

  async getUserWatchlist(userId: string): Promise<List | undefined> {
    return Array.from(this.lists.values()).find(
      list => list.ownerId === userId && list.name === "Watchlist" && list.isSystem
    );
  }

  async getUserFavorites(userId: string): Promise<List | undefined> {
    return Array.from(this.lists.values()).find(
      list => list.ownerId === userId && list.name === "Favorites" && list.isSystem
    );
  }

  // Recommendation operations
  async createRecommendation(recData: InsertRecommendation): Promise<Recommendation> {
    const id = randomUUID();
    const recommendation: Recommendation = {
      ...recData,
      id,
      createdAt: new Date(),
    };
    this.recommendations.set(id, recommendation);
    return recommendation;
  }

  async getUserRecommendations(userId: string, limit = 10): Promise<Recommendation[]> {
    return Array.from(this.recommendations.values())
      .filter(rec => rec.userId === userId && !rec.isShown)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, limit);
  }

  async markRecommendationShown(id: string): Promise<void> {
    const rec = this.recommendations.get(id);
    if (rec) {
      rec.isShown = true;
      this.recommendations.set(id, rec);
    }
  }

  // Report operations
  async createReport(reportData: InsertReport): Promise<Report> {
    const id = randomUUID();
    const report: Report = {
      ...reportData,
      id,
      createdAt: new Date(),
    };
    this.reports.set(id, report);
    return report;
  }

  async getReports(status?: string): Promise<Report[]> {
    const reports = Array.from(this.reports.values());
    if (status) {
      return reports.filter(report => report.status === status);
    }
    return reports;
  }

  async updateReportStatus(id: string, status: string): Promise<void> {
    const report = this.reports.get(id);
    if (report) {
      report.status = status;
      this.reports.set(id, report);
    }
  }
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    if (!db) throw new Error('Database not available');
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    if (!db) throw new Error('Database not available');
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        email: userData.email ?? null,
        firstName: userData.firstName ?? null,
        lastName: userData.lastName ?? null,
        profileImageUrl: userData.profileImageUrl ?? null,
        username: userData.username ?? null,
        bio: userData.bio ?? null,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email ?? null,
          firstName: userData.firstName ?? null,
          lastName: userData.lastName ?? null,
          profileImageUrl: userData.profileImageUrl ?? null,
          username: userData.username ?? null,
          bio: userData.bio ?? null,
          updatedAt: new Date(),
        },
      })
      .returning();

    // Create system lists for new user if they don't exist
    const existingWatchlist = await this.getUserWatchlist(user.id);
    if (!existingWatchlist) {
      await this.createList({
        ownerId: user.id,
        name: "Watchlist",
        description: "Movies and TV shows I want to watch",
        isPublic: false,
        isSystem: true,
        titleIds: [],
      });
    }

    const existingFavorites = await this.getUserFavorites(user.id);
    if (!existingFavorites) {
      await this.createList({
        ownerId: user.id,
        name: "Favorites", 
        description: "My favorite movies and TV shows",
        isPublic: false,
        isSystem: true,
        titleIds: [],
      });
    }

    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, username));
    return user;
  }

  // Title operations
  async getTitle(id: string): Promise<Title | undefined> {
    const [title] = await db.select().from(titles).where(eq(titles.id, id));
    return title;
  }

  async getTitleByExternalId(externalId: string): Promise<Title | undefined> {
    const [title] = await db.select().from(titles).where(eq(titles.externalId, externalId));
    return title;
  }

  async createTitle(titleData: InsertTitle): Promise<Title> {
    const [title] = await db.insert(titles).values({
      ...titleData,
      id: titleData.id || randomUUID(),
      externalId: titleData.externalId ?? null,
      year: titleData.year ?? null,
      genres: titleData.genres ?? null,
      synopsis: titleData.synopsis ?? null,
      posterUrl: titleData.posterUrl ?? null,
      backdropUrl: titleData.backdropUrl ?? null,
      runtime: titleData.runtime ?? null,
      cast: titleData.cast ?? null,
      crew: titleData.crew ?? null,
      rating: titleData.rating ?? null,
    }).returning();
    return title;
  }

  async searchTitles(query: string, limit = 20): Promise<Title[]> {
    return await db.select().from(titles)
      .where(
        like(titles.name, `%${query}%`)
      )
      .limit(limit);
  }

  async getTrendingTitles(limit = 10): Promise<Title[]> {
    return await db.select().from(titles)
      .orderBy(desc(titles.rating))
      .limit(limit);
  }

  async getRelatedTitles(titleId: string, limit = 5): Promise<Title[]> {
    const title = await this.getTitle(titleId);
    if (!title || !title.genres?.length) return [];
    
    // Simplified search - just get other titles from the database
    return await db.select().from(titles)
      .where(sql`${titles.id} != ${titleId}`)
      .limit(limit);
  }

  // Post operations  
  async getPost(id: string): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post;
  }

  async createPost(postData: InsertPost): Promise<Post> {
    const [post] = await db.insert(posts).values({
      ...postData,
      id: randomUUID(),
      caption: postData.caption ?? null,
      mediaUrl: postData.mediaUrl ?? null,
      mediaType: postData.mediaType ?? null,
      userRating: postData.userRating ?? null,
      moodTags: postData.moodTags ?? null,
      likesCount: 0,
      commentsCount: 0,
      repostsCount: 0,
      savesCount: 0,
      isReported: false,
      isHidden: false,
    }).returning();
    return post;
  }

  async getFeedPosts(userId: string, limit = 20, offset = 0): Promise<Post[]> {
    return await db.select().from(posts)
      .where(eq(posts.isHidden, false))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async getPostsByTitle(titleId: string, limit = 20): Promise<Post[]> {
    return await db.select().from(posts)
      .where(and(eq(posts.titleId, titleId), eq(posts.isHidden, false)))
      .orderBy(desc(posts.createdAt))
      .limit(limit);
  }

  async getPostsByUser(userId: string, limit = 20): Promise<Post[]> {
    return await db.select().from(posts)
      .where(and(eq(posts.authorId, userId), eq(posts.isHidden, false)))
      .orderBy(desc(posts.createdAt))
      .limit(limit);
  }

  async updatePostCounts(postId: string, type: 'like' | 'comment' | 'repost' | 'save', increment: boolean): Promise<void> {
    const delta = increment ? 1 : -1;
    const field = type === 'like' ? 'likesCount' 
                : type === 'comment' ? 'commentsCount'
                : type === 'repost' ? 'repostsCount' 
                : 'savesCount';
    
    await db.update(posts)
      .set({ [field]: sql`${posts[field]} + ${delta}` })
      .where(eq(posts.id, postId));
  }

  // Interaction operations
  async createInteraction(interactionData: InsertInteraction): Promise<Interaction> {
    const [interaction] = await db.insert(interactions).values({
      ...interactionData,
      id: randomUUID(),
      content: interactionData.content ?? null,
    }).returning();
    
    await this.updatePostCounts(
      interactionData.postId, 
      interactionData.type as 'like' | 'comment' | 'repost' | 'save', 
      true
    );
    
    return interaction;
  }

  async getUserInteraction(userId: string, postId: string, type: string): Promise<Interaction | undefined> {
    const [interaction] = await db.select().from(interactions)
      .where(and(
        eq(interactions.userId, userId),
        eq(interactions.postId, postId),
        eq(interactions.type, type)
      ));
    return interaction;
  }

  async deleteInteraction(id: string): Promise<void> {
    const [interaction] = await db.select().from(interactions).where(eq(interactions.id, id));
    if (interaction) {
      await db.delete(interactions).where(eq(interactions.id, id));
      await this.updatePostCounts(
        interaction.postId, 
        interaction.type as 'like' | 'comment' | 'repost' | 'save', 
        false
      );
    }
  }

  async getPostComments(postId: string, limit = 20): Promise<Interaction[]> {
    return await db.select().from(interactions)
      .where(and(eq(interactions.postId, postId), eq(interactions.type, 'comment')))
      .orderBy(desc(interactions.createdAt))
      .limit(limit);
  }

  // Follow operations
  async createFollow(followData: InsertFollow): Promise<Follow> {
    const [follow] = await db.insert(follows).values({
      ...followData,
      id: randomUUID(),
    }).returning();
    return follow;
  }

  async deleteFollow(followerId: string, followingId: string): Promise<void> {
    await db.delete(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
  }

  async getUserFollows(userId: string): Promise<Follow[]> {
    return await db.select().from(follows).where(eq(follows.followerId, userId));
  }

  async getUserFollowers(userId: string): Promise<Follow[]> {
    return await db.select().from(follows).where(eq(follows.followingId, userId));
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const [follow] = await db.select().from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
    return !!follow;
  }

  async getSuggestedUsers(userId: string, limit = 10): Promise<User[]> {
    const following = await this.getUserFollows(userId);
    const followingIds = following.map(f => f.followingId);
    followingIds.push(userId); // exclude self
    
    return await db.select().from(users)
      .where(sql`${users.id} NOT IN (${followingIds.join(',')})`)
      .limit(limit);
  }

  // List operations
  async createList(listData: InsertList): Promise<List> {
    const [list] = await db.insert(lists).values({
      ...listData,
      id: randomUUID(),
      description: listData.description ?? null,
      isPublic: listData.isPublic ?? null,
      isSystem: listData.isSystem ?? null,
      titleIds: listData.titleIds ?? null,
    }).returning();
    return list;
  }

  async getUserLists(userId: string): Promise<List[]> {
    return await db.select().from(lists).where(eq(lists.ownerId, userId));
  }

  async getList(id: string): Promise<List | undefined> {
    const [list] = await db.select().from(lists).where(eq(lists.id, id));
    return list;
  }

  async updateList(id: string, updates: Partial<InsertList>): Promise<List> {
    const [list] = await db.update(lists)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(lists.id, id))
      .returning();
    return list;
  }

  async deleteList(id: string): Promise<void> {
    await db.delete(lists).where(eq(lists.id, id));
  }

  async addToList(listId: string, titleId: string): Promise<void> {
    const list = await this.getList(listId);
    if (!list) return;
    
    const titleIds = [...(list.titleIds || [])];
    if (!titleIds.includes(titleId)) {
      titleIds.push(titleId);
      await this.updateList(listId, { titleIds });
    }
  }

  async removeFromList(listId: string, titleId: string): Promise<void> {
    const list = await this.getList(listId);
    if (!list) return;
    
    const titleIds = (list.titleIds || []).filter(id => id !== titleId);
    await this.updateList(listId, { titleIds });
  }

  async getUserWatchlist(userId: string): Promise<List | undefined> {
    const [list] = await db.select().from(lists)
      .where(and(
        eq(lists.ownerId, userId),
        eq(lists.name, "Watchlist"),
        eq(lists.isSystem, true)
      ));
    return list;
  }

  async getUserFavorites(userId: string): Promise<List | undefined> {
    const [list] = await db.select().from(lists)
      .where(and(
        eq(lists.ownerId, userId),
        eq(lists.name, "Favorites"),
        eq(lists.isSystem, true)
      ));
    return list;
  }

  // Recommendation operations
  async createRecommendation(recData: InsertRecommendation): Promise<Recommendation> {
    const [recommendation] = await db.insert(recommendations).values({
      ...recData,
      id: randomUUID(),
      reason: recData.reason ?? null,
      badges: recData.badges ?? null,
      score: recData.score ?? null,
      isShown: recData.isShown ?? null,
    }).returning();
    return recommendation;
  }

  async getUserRecommendations(userId: string, limit = 10): Promise<Recommendation[]> {
    return await db.select().from(recommendations)
      .where(and(eq(recommendations.userId, userId), eq(recommendations.isShown, false)))
      .orderBy(desc(recommendations.score))
      .limit(limit);
  }

  async markRecommendationShown(id: string): Promise<void> {
    await db.update(recommendations)
      .set({ isShown: true })
      .where(eq(recommendations.id, id));
  }

  // Report operations
  async createReport(reportData: InsertReport): Promise<Report> {
    const [report] = await db.insert(reports).values({
      ...reportData,
      id: randomUUID(),
      userId: reportData.userId ?? null,
      postId: reportData.postId ?? null,
      description: reportData.description ?? null,
      status: reportData.status ?? null,
    }).returning();
    return report;
  }

  async getReports(status?: string): Promise<Report[]> {
    if (status) {
      return await db.select().from(reports).where(eq(reports.status, status));
    }
    return await db.select().from(reports);
  }

  async updateReportStatus(id: string, status: string): Promise<void> {
    await db.update(reports)
      .set({ status })
      .where(eq(reports.id, id));
  }
}

// Use MemStorage when DATABASE_URL is not available, DatabaseStorage when it is
export const storage = process.env.DATABASE_URL ? new DatabaseStorage() : new MemStorage();
