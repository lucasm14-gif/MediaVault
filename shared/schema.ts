import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  clients: many(clients)
}));

// Clients table
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  description: text("description"),
  uniqueId: text("unique_id").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastAccessed: timestamp("last_accessed"),
});

export const clientsRelations = relations(clients, ({ many }) => ({
  photos: many(photos),
  videos: many(videos)
}));

// Photos table
export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  url: text("url").notNull(),
  filename: text("filename").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const photosRelations = relations(photos, ({ one }) => ({
  client: one(clients, {
    fields: [photos.clientId],
    references: [clients.id]
  })
}));

// Videos table (YouTube embeds)
export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  youtubeUrl: text("youtube_url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const videosRelations = relations(videos, ({ one }) => ({
  client: one(clients, {
    fields: [videos.clientId],
    references: [clients.id]
  })
}));

// Insert and Select schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  username: (schema) => schema.min(3, "Username must be at least 3 characters"),
  password: (schema) => schema.min(8, "Password must be at least 8 characters"),
});

export const insertClientSchema = createInsertSchema(clients, {
  name: (schema) => schema.min(2, "Name must be at least 2 characters"),
  email: (schema) => schema.email("Please enter a valid email"),
});

export const insertPhotoSchema = createInsertSchema(photos, {
  title: (schema) => schema.min(2, "Title must be at least 2 characters"),
});

export const insertVideoSchema = createInsertSchema(videos, {
  title: (schema) => schema.min(2, "Title must be at least 2 characters"),
  youtubeUrl: (schema) => schema.min(1, "YouTube URL is required"),
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;

export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;

// Dashboard stats type
export interface DashboardStats {
  clientCount: number;
  photoCount: number;
  videoCount: number;
  totalViews: number;
}
