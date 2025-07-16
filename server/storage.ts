import { 
  users, servers, botConfig, chatLogs, botStats, activityLogs,
  type User, type InsertUser, type Server, type InsertServer,
  type BotConfig, type InsertBotConfig, type ChatLog, type InsertChatLog,
  type BotStats, type InsertBotStats, type ActivityLog, type InsertActivityLog
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Server methods
  getServers(): Promise<Server[]>;
  getServer(id: number): Promise<Server | undefined>;
  createServer(server: InsertServer): Promise<Server>;
  updateServer(id: number, updates: Partial<Server>): Promise<Server | undefined>;
  deleteServer(id: number): Promise<boolean>;
  getActiveServer(): Promise<Server | undefined>;
  setActiveServer(id: number): Promise<void>;

  // Bot config methods
  getBotConfig(): Promise<BotConfig | undefined>;
  updateBotConfig(config: Partial<InsertBotConfig>): Promise<BotConfig>;

  // Chat logs methods
  getChatLogs(limit?: number, serverId?: number): Promise<ChatLog[]>;
  addChatLog(log: InsertChatLog): Promise<ChatLog>;
  clearChatLogs(serverId?: number): Promise<void>;

  // Bot stats methods
  getBotStats(): Promise<BotStats | undefined>;
  updateBotStats(stats: Partial<InsertBotStats>): Promise<BotStats>;

  // Activity logs methods
  getActivityLogs(limit?: number): Promise<ActivityLog[]>;
  addActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private servers: Map<number, Server> = new Map();
  private botConfigData: BotConfig | undefined;
  private chatLogsData: Map<number, ChatLog> = new Map();
  private botStatsData: BotStats | undefined;
  private activityLogsData: Map<number, ActivityLog> = new Map();
  private currentId = 1;

  constructor() {
    // Initialize with default bot config
    this.botConfigData = {
      id: 1,
      username: "ZEROO",
      password: "",
      authType: "mojang",
      autoReconnect: true,
      antiAfk: true,
      chatMessages: true,
      chatMessagesRepeat: true,
      chatMessagesDelay: 60,
      autoAuth: false,
      autoAuthPassword: "",
      position: { enabled: false, x: 0, y: 0, z: 0 },
      updatedAt: new Date(),
    };

    // Initialize with default server
    this.servers.set(1, {
      id: 1,
      name: "zeroxxzx.aternos.me",
      host: "zeroxxzx.aternos.me",
      port: 58349,
      version: "1.12.1",
      isActive: true,
      createdAt: new Date(),
    });

    // Initialize bot stats
    this.botStatsData = {
      id: 1,
      status: "offline",
      currentServerId: 1,
      uptime: 0,
      chatMessageCount: 0,
      lastConnected: null,
      lastDisconnected: null,
      reconnectCount: 0,
      updatedAt: new Date(),
    };

    this.currentId = 2;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getServers(): Promise<Server[]> {
    return Array.from(this.servers.values());
  }

  async getServer(id: number): Promise<Server | undefined> {
    return this.servers.get(id);
  }

  async createServer(insertServer: InsertServer): Promise<Server> {
    const id = this.currentId++;
    const server: Server = { 
      ...insertServer, 
      id, 
      isActive: false,
      createdAt: new Date() 
    };
    this.servers.set(id, server);
    return server;
  }

  async updateServer(id: number, updates: Partial<Server>): Promise<Server | undefined> {
    const server = this.servers.get(id);
    if (!server) return undefined;
    
    const updatedServer = { ...server, ...updates };
    this.servers.set(id, updatedServer);
    return updatedServer;
  }

  async deleteServer(id: number): Promise<boolean> {
    return this.servers.delete(id);
  }

  async getActiveServer(): Promise<Server | undefined> {
    return Array.from(this.servers.values()).find(server => server.isActive);
  }

  async setActiveServer(id: number): Promise<void> {
    // Deactivate all servers
    for (const [serverId, server] of this.servers) {
      this.servers.set(serverId, { ...server, isActive: false });
    }
    
    // Activate the selected server
    const server = this.servers.get(id);
    if (server) {
      this.servers.set(id, { ...server, isActive: true });
    }
  }

  async getBotConfig(): Promise<BotConfig | undefined> {
    return this.botConfigData;
  }

  async updateBotConfig(config: Partial<InsertBotConfig>): Promise<BotConfig> {
    this.botConfigData = {
      ...this.botConfigData!,
      ...config,
      updatedAt: new Date(),
    };
    return this.botConfigData;
  }

  async getChatLogs(limit = 50, serverId?: number): Promise<ChatLog[]> {
    let logs = Array.from(this.chatLogsData.values());
    
    if (serverId) {
      logs = logs.filter(log => log.serverId === serverId);
    }
    
    return logs
      .sort((a, b) => b.timestamp!.getTime() - a.timestamp!.getTime())
      .slice(0, limit);
  }

  async addChatLog(log: InsertChatLog): Promise<ChatLog> {
    const id = this.currentId++;
    const chatLog: ChatLog = {
      ...log,
      id,
      timestamp: new Date(),
    };
    this.chatLogsData.set(id, chatLog);
    return chatLog;
  }

  async clearChatLogs(serverId?: number): Promise<void> {
    if (serverId) {
      for (const [id, log] of this.chatLogsData) {
        if (log.serverId === serverId) {
          this.chatLogsData.delete(id);
        }
      }
    } else {
      this.chatLogsData.clear();
    }
  }

  async getBotStats(): Promise<BotStats | undefined> {
    return this.botStatsData;
  }

  async updateBotStats(stats: Partial<InsertBotStats>): Promise<BotStats> {
    this.botStatsData = {
      ...this.botStatsData!,
      ...stats,
      updatedAt: new Date(),
    };
    return this.botStatsData;
  }

  async getActivityLogs(limit = 50): Promise<ActivityLog[]> {
    return Array.from(this.activityLogsData.values())
      .sort((a, b) => b.timestamp!.getTime() - a.timestamp!.getTime())
      .slice(0, limit);
  }

  async addActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const id = this.currentId++;
    const activityLog: ActivityLog = {
      ...log,
      id,
      timestamp: new Date(),
    };
    this.activityLogsData.set(id, activityLog);
    return activityLog;
  }
}

export const storage = new MemStorage();
