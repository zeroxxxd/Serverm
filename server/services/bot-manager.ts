import { createBot } from 'mineflayer';
import { pathfinder, Movements } from 'mineflayer-pathfinder';
import { storage } from '../storage';
import type { Server, BotConfig, ChatLog, BotStats } from '@shared/schema';
import { WebSocket } from 'ws';

export class BotManager {
  private bot: any = null;
  private isRunning = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private chatTimer: NodeJS.Timeout | null = null;
  private antiAfkTimer: NodeJS.Timeout | null = null;
  private startTime: Date | null = null;
  private websocketClients: Set<WebSocket> = new Set();
  
  // Bot rotation failover system
  private offlineDetectionTimer: NodeJS.Timeout | null = null;
  private rotationDelayTimer: NodeJS.Timeout | null = null;
  private botActiveTimer: NodeJS.Timeout | null = null;
  private currentBotUsername: string | null = null;
  private lastHeartbeat: Date | null = null;
  private rotationInProgress = false;
  private usernamePool: string[] = [];
  private usernameRecentlyUsed: string[] = [];
  private usernameHistory: { [key: string]: number } = {}; // username -> last used timestamp
  
  private chatMessages = [
    "I'm a regular player",
    "Subscribe To Slobos!",
    "I Like to Play Minecraft!"
  ];

  constructor() {
    this.initializeEventHandlers();
    this.loadBotRotationConfig();
  }

  addWebSocketClient(client: WebSocket) {
    this.websocketClients.add(client);
    client.on('close', () => {
      this.websocketClients.delete(client);
    });
  }

  private broadcastToClients(data: any) {
    const message = JSON.stringify(data);
    this.websocketClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  private async initializeEventHandlers() {
    // This method sets up event handlers for the bot
  }

  async startBot(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Bot is already running');
    }

    const config = await storage.getBotConfig();
    const server = await storage.getActiveServer();

    if (!config || !server) {
      throw new Error('Bot configuration or server not found');
    }

    try {
      this.bot = createBot({
        host: server.host,
        port: server.port,
        username: config.username,
        password: config.password || undefined,
        version: server.version,
        auth: config.authType === 'microsoft' ? 'microsoft' : 'mojang',
      });

      this.bot.loadPlugin(pathfinder);
      this.setupBotEvents(config, server);
      this.isRunning = true;
      this.startTime = new Date();

      await storage.updateBotStats({
        status: 'connecting',
        currentServerId: server.id,
        lastConnected: new Date(),
      });

      this.broadcastToClients({
        type: 'bot_status',
        status: 'connecting',
        server: server.name,
      });

      await storage.addActivityLog({
        event: 'bot_start',
        description: `Bot started and connecting to ${server.name}`,
        serverId: server.id,
      });

    } catch (error) {
      this.isRunning = false;
      throw error;
    }
  }

  async stopBot(): Promise<void> {
    if (!this.isRunning) {
      throw new Error('Bot is not running');
    }

    this.isRunning = false;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.chatTimer) {
      clearTimeout(this.chatTimer);
      this.chatTimer = null;
    }

    if (this.antiAfkTimer) {
      clearTimeout(this.antiAfkTimer);
      this.antiAfkTimer = null;
    }

    if (this.bot) {
      this.bot.quit();
      this.bot = null;
    }

    await storage.updateBotStats({
      status: 'offline',
      lastDisconnected: new Date(),
    });

    this.broadcastToClients({
      type: 'bot_status',
      status: 'offline',
    });

    await storage.addActivityLog({
      event: 'bot_stop',
      description: 'Bot stopped by user',
    });
  }

  async restartBot(): Promise<void> {
    if (this.isRunning) {
      await this.stopBot();
      // Wait a moment before restarting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    await this.startBot();
  }

  private setupBotEvents(config: BotConfig, server: Server) {
    this.bot.once('spawn', async () => {
      await storage.updateBotStats({
        status: 'online',
        currentServerId: server.id,
        lastConnected: new Date(),
      });

      this.broadcastToClients({
        type: 'bot_status',
        status: 'online',
        server: server.name,
      });

      await storage.addActivityLog({
        event: 'bot_connected',
        description: `Successfully connected to ${server.name}`,
        serverId: server.id,
      });

      // Set up anti-AFK if enabled
      if (config.antiAfk) {
        this.startAntiAfk();
      }

      // Set up chat messages if enabled
      if (config.chatMessages) {
        this.startChatMessages(config.chatMessagesDelay);
      }

      // Handle auto-auth if enabled
      if (config.autoAuth && config.autoAuthPassword) {
        this.bot.chat(`/login ${config.autoAuthPassword}`);
      }
    });

    this.bot.on('chat', async (username: string, message: string) => {
      if (username === this.bot.username) return;

      const chatLog = await storage.addChatLog({
        username,
        message,
        serverId: server.id,
        messageType: 'chat',
      });

      this.broadcastToClients({
        type: 'chat_message',
        username,
        message,
        timestamp: chatLog.timestamp,
        serverId: server.id,
      });

      // Update chat message count
      const stats = await storage.getBotStats();
      if (stats) {
        await storage.updateBotStats({
          chatMessageCount: stats.chatMessageCount + 1,
        });
      }
    });

    this.bot.on('error', async (err: Error) => {
      console.error('Bot error:', err);
      
      await storage.addActivityLog({
        event: 'bot_error',
        description: `Bot error: ${err.message}`,
        serverId: server.id,
        metadata: { error: err.message },
      });

      this.broadcastToClients({
        type: 'bot_error',
        error: err.message,
      });
    });

    this.bot.on('end', async () => {
      await storage.updateBotStats({
        status: 'offline',
        lastDisconnected: new Date(),
      });

      this.broadcastToClients({
        type: 'bot_status',
        status: 'offline',
      });

      await storage.addActivityLog({
        event: 'bot_disconnected',
        description: 'Bot disconnected from server',
        serverId: server.id,
      });

      // Auto-reconnect if enabled
      if (config.autoReconnect && this.isRunning) {
        this.scheduleReconnect();
      }
    });

    this.bot.on('kicked', async (reason: string) => {
      await storage.addActivityLog({
        event: 'bot_kicked',
        description: `Bot was kicked: ${reason}`,
        serverId: server.id,
        metadata: { reason },
      });

      this.broadcastToClients({
        type: 'bot_kicked',
        reason,
      });
    });
  }

  private startAntiAfk() {
    this.antiAfkTimer = setInterval(() => {
      if (this.bot && this.bot.entity) {
        // Random anti-AFK actions
        const actions = [
          () => this.bot.setControlState('sneak', true),
          () => this.bot.setControlState('sneak', false),
          () => this.bot.look(Math.random() * Math.PI * 2, Math.random() * 0.5 - 0.25),
          () => {
            // Random small movement
            if (this.bot.pathfinder) {
              const x = this.bot.entity.position.x + (Math.random() - 0.5) * 2;
              const z = this.bot.entity.position.z + (Math.random() - 0.5) * 2;
              const y = this.bot.entity.position.y;
              try {
                this.bot.pathfinder.setGoal(new pathfinder.goals.GoalBlock(x, y, z));
              } catch (error) {
                console.log('Pathfinder error:', error);
              }
            }
          },
        ];

        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        randomAction();
      }
    }, 30000 + Math.random() * 60000); // Random interval between 30-90 seconds
  }

  private startChatMessages(delay: number) {
    this.chatTimer = setInterval(() => {
      if (this.bot && this.chatMessages.length > 0) {
        const randomMessage = this.chatMessages[Math.floor(Math.random() * this.chatMessages.length)];
        this.bot.chat(randomMessage);
      }
    }, delay * 1000);
  }

  private scheduleReconnect() {
    this.reconnectTimer = setTimeout(async () => {
      if (this.isRunning) {
        try {
          const stats = await storage.getBotStats();
          if (stats) {
            await storage.updateBotStats({
              reconnectCount: stats.reconnectCount + 1,
            });
          }

          await this.startBot();
        } catch (error) {
          console.error('Reconnection failed:', error);
          // Try again in 10 seconds
          this.scheduleReconnect();
        }
      }
    }, 5000);
  }

  getStatus(): { isRunning: boolean; uptime: number | null } {
    return {
      isRunning: this.isRunning,
      uptime: this.startTime ? Date.now() - this.startTime.getTime() : null,
    };
  }

  async switchServer(serverId: number): Promise<void> {
    const server = await storage.getServer(serverId);
    if (!server) {
      throw new Error('Server not found');
    }

    await storage.setActiveServer(serverId);
    
    if (this.isRunning) {
      await this.restartBot();
    }
  }

  // Bot rotation failover system methods
  private async loadBotRotationConfig(): Promise<void> {
    try {
      const config = await storage.getBotConfig();
      if (config) {
        this.usernamePool = config.usernamePool || [];
        this.usernameRecentlyUsed = config.usernameRecentlyUsed || [];
        this.usernameHistory = (config.usernameHistory as any) || {};
        
        // Start offline detection if rotation is enabled
        if (config.enableBotRotation) {
          await this.startOfflineDetection();
        }
      }
    } catch (error) {
      console.error('Failed to load bot rotation config:', error);
    }
  }

  private async updateBotRotationConfig(): Promise<void> {
    try {
      await storage.updateBotConfig({
        usernamePool: this.usernamePool,
        usernameRecentlyUsed: this.usernameRecentlyUsed,
        usernameHistory: this.usernameHistory as any
      });
    } catch (error) {
      console.error('Failed to update bot rotation config:', error);
    }
  }

  private getRandomDelay(base: number, variation: number): number {
    return base + (Math.random() * variation * 2 - variation);
  }

  private getNextAvailableUsername(): string | null {
    if (this.usernamePool.length === 0) return null;

    // Remove usernames that have been used recently (within last 5 minutes)
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    
    const availableUsernames = this.usernamePool.filter(username => {
      const lastUsed = this.usernameHistory[username];
      return !lastUsed || lastUsed < fiveMinutesAgo;
    });

    if (availableUsernames.length === 0) {
      // If no usernames available, use least recently used
      const sortedUsernames = this.usernamePool.sort((a, b) => {
        const aLastUsed = this.usernameHistory[a] || 0;
        const bLastUsed = this.usernameHistory[b] || 0;
        return aLastUsed - bLastUsed;
      });
      return sortedUsernames[0] || null;
    }

    // Return random available username
    return availableUsernames[Math.floor(Math.random() * availableUsernames.length)];
  }

  private async startOfflineDetection(): Promise<void> {
    const config = await storage.getBotConfig();
    if (!config?.enableBotRotation) return;

    const offlineTimeout = (config.offlineTimeout || 10) * 1000;
    
    this.offlineDetectionTimer = setInterval(async () => {
      if (this.rotationInProgress) return;

      const now = Date.now();
      const lastHeartbeatTime = this.lastHeartbeat?.getTime() || 0;
      const timeSinceLastHeartbeat = now - lastHeartbeatTime;

      // If bot has been offline for more than timeout, start rotation
      if ((!this.isRunning || timeSinceLastHeartbeat > offlineTimeout) && !this.rotationInProgress) {
        console.log(`Bot offline detected (${timeSinceLastHeartbeat}ms), starting rotation...`);
        await this.startBotRotation();
      }
    }, 1000);
  }

  private async startBotRotation(): Promise<void> {
    if (this.rotationInProgress) return;
    
    this.rotationInProgress = true;
    const config = await storage.getBotConfig();
    
    if (!config?.enableBotRotation) {
      this.rotationInProgress = false;
      return;
    }

    // Stop current bot if running
    if (this.isRunning) {
      await this.stopBot();
    }

    // Log rotation start
    await storage.addActivityLog({
      event: 'bot_rotation_started',
      description: `Bot rotation started due to offline detection`,
      metadata: {
        previousUsername: this.currentBotUsername,
        timestamp: new Date().toISOString()
      }
    });

    // Wait random delay before bringing new bot online
    const rotationDelay = this.getRandomDelay(
      config.rotationDelay || 50,
      config.rotationDelayVariation || 20
    ) * 1000;

    console.log(`Waiting ${rotationDelay}ms before starting next bot...`);
    
    this.rotationDelayTimer = setTimeout(async () => {
      await this.activateNextBot();
    }, rotationDelay);
  }

  private async activateNextBot(): Promise<void> {
    const config = await storage.getBotConfig();
    if (!config?.enableBotRotation) {
      this.rotationInProgress = false;
      return;
    }

    const nextUsername = this.getNextAvailableUsername();
    if (!nextUsername) {
      console.log('No available usernames for rotation');
      this.rotationInProgress = false;
      return;
    }

    // Update current bot username
    this.currentBotUsername = nextUsername;
    this.usernameHistory[nextUsername] = Date.now();

    // Update bot config with new username
    await storage.updateBotConfig({
      username: nextUsername
    });

    // Start bot with new username
    await this.startBot();

    // Log successful rotation
    await storage.addActivityLog({
      event: 'bot_rotation_complete',
      description: `Bot rotation completed with username: ${nextUsername}`,
      metadata: {
        newUsername: nextUsername,
        timestamp: new Date().toISOString()
      }
    });

    console.log(`Bot rotation completed with username: ${nextUsername}`);

    // Schedule bot to stay active for limited time
    const activeTime = this.getRandomDelay(
      config.botActiveTime || 12.5,
      config.botActiveTimeVariation || 2.5
    ) * 1000;

    this.botActiveTimer = setTimeout(async () => {
      console.log(`Bot active time expired, stopping bot...`);
      await this.stopBot();
      this.rotationInProgress = false;
      
      // Update recently used list
      this.usernameRecentlyUsed.push(nextUsername);
      if (this.usernameRecentlyUsed.length > 5) {
        this.usernameRecentlyUsed.shift();
      }
      
      await this.updateBotRotationConfig();
    }, activeTime);
  }

  private updateHeartbeat(): void {
    this.lastHeartbeat = new Date();
  }

  private clearRotationTimers(): void {
    if (this.offlineDetectionTimer) {
      clearInterval(this.offlineDetectionTimer);
      this.offlineDetectionTimer = null;
    }
    if (this.rotationDelayTimer) {
      clearTimeout(this.rotationDelayTimer);
      this.rotationDelayTimer = null;
    }
    if (this.botActiveTimer) {
      clearTimeout(this.botActiveTimer);
      this.botActiveTimer = null;
    }
  }

  // Public methods to manage bot rotation
  async enableBotRotation(usernames: string[]): Promise<void> {
    this.usernamePool = usernames;
    this.usernameRecentlyUsed = [];
    this.usernameHistory = {};
    
    await storage.updateBotConfig({
      enableBotRotation: true,
      usernamePool: usernames,
      usernameRecentlyUsed: [],
      usernameHistory: {}
    });

    await this.startOfflineDetection();
  }

  async disableBotRotation(): Promise<void> {
    await storage.updateBotConfig({
      enableBotRotation: false
    });

    this.clearRotationTimers();
    this.rotationInProgress = false;
  }

  async updateRotationSettings(settings: {
    offlineTimeout?: number;
    rotationDelay?: number;
    rotationDelayVariation?: number;
    botActiveTime?: number;
    botActiveTimeVariation?: number;
  }): Promise<void> {
    await storage.updateBotConfig(settings);
  }

  getBotRotationStatus(): {
    enabled: boolean;
    rotationInProgress: boolean;
    currentUsername: string | null;
    usernamePool: string[];
    usernameRecentlyUsed: string[];
    lastHeartbeat: Date | null;
  } {
    return {
      enabled: this.usernamePool.length > 0,
      rotationInProgress: this.rotationInProgress,
      currentUsername: this.currentBotUsername,
      usernamePool: this.usernamePool,
      usernameRecentlyUsed: this.usernameRecentlyUsed,
      lastHeartbeat: this.lastHeartbeat
    };
  }
}

export const botManager = new BotManager();
