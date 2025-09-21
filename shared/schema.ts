import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const notes = pgTable("notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertNoteSchema = createInsertSchema(notes).pick({
  title: true,
  content: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Note = typeof notes.$inferSelect;

export const aiRequestSchema = z.object({
  query: z.string().min(1),
  apiKeys: z.object({
    openai: z.string().optional(),
    gemini: z.string().optional(),
    grok: z.string().optional(),
    deepseek: z.string().optional(),
  }),
});

export const explainTextSchema = z.object({
  text: z.string().min(1),
  apiKeys: z.object({
    openai: z.string().optional(),
    gemini: z.string().optional(),
    grok: z.string().optional(),
    deepseek: z.string().optional(),
  }),
});

export type AIRequest = z.infer<typeof aiRequestSchema>;
export type ExplainTextRequest = z.infer<typeof explainTextSchema>;
