import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const servers = pgTable("servers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  host: text("host").notNull(),
  port: integer("port").notNull(),
  version: text("version").notNull(),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const botConfig = pgTable("bot_config", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  password: text("password"),
  authType: text("auth_type").notNull().default("mojang"),
  autoReconnect: boolean("auto_reconnect").default(true),
  antiAfk: boolean("anti_afk").default(true),
  chatMessages: boolean("chat_messages").default(true),
  chatMessagesRepeat: boolean("chat_messages_repeat").default(true),
  chatMessagesDelay: integer("chat_messages_delay").default(60),
  autoAuth: boolean("auto_auth").default(false),
  autoAuthPassword: text("auto_auth_password"),
  position: jsonb("position").default({}),
  // Bot rotation failover settings
  enableBotRotation: boolean("enable_bot_rotation").default(false),
  offlineTimeout: integer("offline_timeout").default(10), // seconds
  rotationDelay: integer("rotation_delay").default(50), // 30-70 seconds average
  rotationDelayVariation: integer("rotation_delay_variation").default(20), // ±20 seconds
  botActiveTime: integer("bot_active_time").default(12.5), // 10-15 seconds average
  botActiveTimeVariation: integer("bot_active_time_variation").default(2.5), // ±2.5 seconds
  usernamePool: text("username_pool").array().default([]).notNull(),
  usernameRecentlyUsed: text("username_recently_used").array().default([]).notNull(),
  usernameHistory: jsonb("username_history").default({}), // Store last used timestamp for each username
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chatLogs = pgTable("chat_logs", {
  id: serial("id").primaryKey(),
  username: text("username").notNull(),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  serverId: integer("server_id").references(() => servers.id),
  messageType: text("message_type").default("chat"),
});

export const botStats = pgTable("bot_stats", {
  id: serial("id").primaryKey(),
  status: text("status").notNull(),
  currentServerId: integer("current_server_id").references(() => servers.id),
  uptime: integer("uptime").default(0),
  chatMessageCount: integer("chat_message_count").default(0),
  lastConnected: timestamp("last_connected"),
  lastDisconnected: timestamp("last_disconnected"),
  reconnectCount: integer("reconnect_count").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  event: text("event").notNull(),
  description: text("description"),
  timestamp: timestamp("timestamp").defaultNow(),
  serverId: integer("server_id").references(() => servers.id),
  metadata: jsonb("metadata").default({}),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertServerSchema = createInsertSchema(servers).pick({
  name: true,
  host: true,
  port: true,
  version: true,
});

export const insertBotConfigSchema = createInsertSchema(botConfig).omit({
  id: true,
  updatedAt: true,
});

export const insertChatLogSchema = createInsertSchema(chatLogs).omit({
  id: true,
  timestamp: true,
});

export const insertBotStatsSchema = createInsertSchema(botStats).omit({
  id: true,
  updatedAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  timestamp: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Server = typeof servers.$inferSelect;
export type InsertServer = z.infer<typeof insertServerSchema>;
export type BotConfig = typeof botConfig.$inferSelect;
export type InsertBotConfig = z.infer<typeof insertBotConfigSchema>;
export type ChatLog = typeof chatLogs.$inferSelect;
export type InsertChatLog = z.infer<typeof insertChatLogSchema>;
export type BotStats = typeof botStats.$inferSelect;
export type InsertBotStats = z.infer<typeof insertBotStatsSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
