import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
});

export const loginUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const blockedSites = pgTable("blocked_sites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  domain: text("domain").notNull(),
});

export const insertBlockedSiteSchema = createInsertSchema(blockedSites).pick({
  userId: true,
  domain: true,
});

export const timerSettings = pgTable("timer_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  workDuration: integer("work_duration").notNull().default(25),
  breakDuration: integer("break_duration").notNull().default(5),
  longBreakDuration: integer("long_break_duration").notNull().default(15),
  sessionsBeforeLongBreak: integer("sessions_before_long_break").notNull().default(4),
  soundEnabled: boolean("sound_enabled").notNull().default(true),
  notificationsEnabled: boolean("notifications_enabled").notNull().default(true),
});

export const insertTimerSettingsSchema = createInsertSchema(timerSettings).pick({
  userId: true,
  workDuration: true,
  breakDuration: true,
  longBreakDuration: true,
  sessionsBeforeLongBreak: true,
  soundEnabled: true,
  notificationsEnabled: true,
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time"),
  duration: integer("duration"),
  type: text("type").notNull(), // "work", "break", "long-break"
  completed: boolean("completed").notNull().default(false),
  aborted: boolean("aborted").notNull().default(false),
  abortReason: text("abort_reason"),
  sitesBlocked: integer("sites_blocked").notNull().default(0),
});

export const insertSessionSchema = createInsertSchema(sessions).pick({
  userId: true,
  startTime: true,
  type: true,
});

export const updateSessionSchema = createInsertSchema(sessions).pick({
  endTime: true,
  duration: true,
  completed: true,
  aborted: true,
  abortReason: true,
  sitesBlocked: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;

export type BlockedSite = typeof blockedSites.$inferSelect;
export type InsertBlockedSite = z.infer<typeof insertBlockedSiteSchema>;

export type TimerSettings = typeof timerSettings.$inferSelect;
export type InsertTimerSettings = z.infer<typeof insertTimerSettingsSchema>;

export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type UpdateSession = z.infer<typeof updateSessionSchema>;
