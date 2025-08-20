import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  username: varchar("username").unique(),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Titles (movies and TV shows)
export const titles = pgTable("titles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  externalId: varchar("external_id").unique(), // TMDB ID or similar
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // 'movie' or 'tv'
  year: integer("year"),
  genres: varchar("genres").array(),
  synopsis: text("synopsis"),
  posterUrl: varchar("poster_url"),
  backdropUrl: varchar("backdrop_url"),
  runtime: integer("runtime"), // in minutes
  cast: varchar("cast").array(),
  crew: varchar("crew").array(),
  rating: real("rating"), // average community rating
  createdAt: timestamp("created_at").defaultNow(),
});

// User posts about titles
export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").references(() => users.id).notNull(),
  titleId: varchar("title_id").references(() => titles.id).notNull(),
  caption: text("caption"),
  mediaUrl: varchar("media_url"), // uploaded image or video
  mediaType: varchar("media_type"), // 'image' or 'video'
  userRating: real("user_rating"), // optional 1-5 rating
  moodTags: varchar("mood_tags").array(),
  likesCount: integer("likes_count").default(0),
  commentsCount: integer("comments_count").default(0),
  repostsCount: integer("reposts_count").default(0),
  savesCount: integer("saves_count").default(0),
  isReported: boolean("is_reported").default(false),
  isHidden: boolean("is_hidden").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Post interactions (likes, comments, saves)
export const interactions = pgTable("interactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  postId: varchar("post_id").references(() => posts.id).notNull(),
  type: varchar("type").notNull(), // 'like', 'comment', 'repost', 'save'
  content: text("content"), // for comments
  createdAt: timestamp("created_at").defaultNow(),
});

// User follows
export const follows = pgTable("follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id").references(() => users.id).notNull(),
  followingId: varchar("following_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User lists (watchlist, favorites, custom lists)
export const lists = pgTable("lists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: varchar("owner_id").references(() => users.id).notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(false),
  isSystem: boolean("is_system").default(false), // for watchlist/favorites
  titleIds: varchar("title_ids").array().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI recommendations
export const recommendations = pgTable("recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  titleId: varchar("title_id").references(() => titles.id).notNull(),
  reason: text("reason"), // "Because you liked..."
  badges: varchar("badges").array(), // mood/theme tags
  score: real("score"), // recommendation confidence
  isShown: boolean("is_shown").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Content reports
export const reports = pgTable("reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reporterId: varchar("reporter_id").references(() => users.id).notNull(),
  postId: varchar("post_id").references(() => posts.id),
  userId: varchar("user_id").references(() => users.id), // if reporting a user
  reason: varchar("reason").notNull(),
  description: text("description"),
  status: varchar("status").default("pending"), // pending, reviewed, resolved
  createdAt: timestamp("created_at").defaultNow(),
});

// AI conversation history for movie discovery
export const conversations = pgTable("conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  sessionId: varchar("session_id").notNull(), // to group related messages
  messages: jsonb("messages").notNull(), // array of {role, content, timestamp}
  lastRecommendations: jsonb("last_recommendations"), // cached AI recommendations
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Type exports
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertTitle = typeof titles.$inferInsert;
export type Title = typeof titles.$inferSelect;

export type InsertPost = typeof posts.$inferInsert;
export type Post = typeof posts.$inferSelect;

export type InsertInteraction = typeof interactions.$inferInsert;
export type Interaction = typeof interactions.$inferSelect;

export type InsertFollow = typeof follows.$inferInsert;
export type Follow = typeof follows.$inferSelect;

export type InsertList = typeof lists.$inferInsert;
export type List = typeof lists.$inferSelect;

export type InsertRecommendation = typeof recommendations.$inferInsert;
export type Recommendation = typeof recommendations.$inferSelect;

export type InsertReport = typeof reports.$inferInsert;
export type Report = typeof reports.$inferSelect;

export type InsertConversation = typeof conversations.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;

// Insert schemas for validation
export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  createdAt: true,
  likesCount: true,
  commentsCount: true,
  repostsCount: true,
  savesCount: true,
  isReported: true,
  isHidden: true,
});

export const insertInteractionSchema = createInsertSchema(interactions).omit({
  id: true,
  createdAt: true,
});

export const insertListSchema = createInsertSchema(lists).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTitleSchema = createInsertSchema(titles).omit({
  id: true,
  createdAt: true,
});
