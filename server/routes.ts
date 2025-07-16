import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { botManager } from "./services/bot-manager";
import { botConfigManager } from "./services/bot-config";
import { 
  insertServerSchema, 
  insertBotConfigSchema,
  insertChatLogSchema,
  insertActivityLogSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // Initialize WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');
    botManager.addWebSocketClient(ws);

    ws.on('message', async (message: string) => {
      try {
        const data = JSON.parse(message);
        console.log('Received WebSocket message:', data);

        // Handle WebSocket messages for real-time bot control
        switch (data.type) {
          case 'get_status':
            const status = botManager.getStatus();
            const stats = await storage.getBotStats();
            ws.send(JSON.stringify({
              type: 'bot_status',
              ...status,
              stats,
            }));
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Bot control endpoints
  app.post('/api/bot/start', async (req, res) => {
    try {
      await botManager.startBot();
      res.json({ success: true, message: 'Bot started successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/bot/stop', async (req, res) => {
    try {
      await botManager.stopBot();
      res.json({ success: true, message: 'Bot stopped successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/bot/restart', async (req, res) => {
    try {
      await botManager.restartBot();
      res.json({ success: true, message: 'Bot restarted successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Bot rotation endpoints
  app.post('/api/bot/rotation/enable', async (req, res) => {
    try {
      const { usernames } = req.body;
      if (!usernames || !Array.isArray(usernames) || usernames.length === 0) {
        return res.status(400).json({ error: 'Username array is required' });
      }
      await botManager.enableBotRotation(usernames);
      res.json({ success: true, message: 'Bot rotation enabled successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/bot/rotation/disable', async (req, res) => {
    try {
      await botManager.disableBotRotation();
      res.json({ success: true, message: 'Bot rotation disabled successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/bot/rotation/settings', async (req, res) => {
    try {
      const settings = req.body;
      await botManager.updateRotationSettings(settings);
      res.json({ success: true, message: 'Rotation settings updated successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/bot/rotation/status', async (req, res) => {
    try {
      const status = botManager.getBotRotationStatus();
      res.json(status);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/bot/status', async (req, res) => {
    try {
      const status = botManager.getStatus();
      const stats = await storage.getBotStats();
      res.json({ ...status, stats });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Server management endpoints
  app.get('/api/servers', async (req, res) => {
    try {
      const servers = await storage.getServers();
      res.json(servers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/servers', async (req, res) => {
    try {
      const validatedData = insertServerSchema.parse(req.body);
      const server = await storage.createServer(validatedData);
      res.json(server);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.put('/api/servers/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const server = await storage.updateServer(id, req.body);
      if (!server) {
        return res.status(404).json({ error: 'Server not found' });
      }
      res.json(server);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete('/api/servers/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteServer(id);
      if (!success) {
        return res.status(404).json({ error: 'Server not found' });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/servers/:id/activate', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await botManager.switchServer(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Bot configuration endpoints
  app.get('/api/bot/config', async (req, res) => {
    try {
      const config = await storage.getBotConfig();
      res.json(config);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/bot/config', async (req, res) => {
    try {
      const validatedData = insertBotConfigSchema.parse(req.body);
      const config = await storage.updateBotConfig(validatedData);
      
      // Also save to legacy format
      botConfigManager.saveLegacyConfig(config);
      
      res.json(config);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Chat logs endpoints
  app.get('/api/chat-logs', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const serverId = req.query.serverId ? parseInt(req.query.serverId as string) : undefined;
      const logs = await storage.getChatLogs(limit, serverId);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/chat-logs', async (req, res) => {
    try {
      const serverId = req.query.serverId ? parseInt(req.query.serverId as string) : undefined;
      await storage.clearChatLogs(serverId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Activity logs endpoints
  app.get('/api/activity-logs', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const logs = await storage.getActivityLogs(limit);
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Statistics endpoints
  app.get('/api/stats', async (req, res) => {
    try {
      const stats = await storage.getBotStats();
      const servers = await storage.getServers();
      const activeServer = servers.find(s => s.isActive);
      const chatLogs = await storage.getChatLogs(100);
      const activityLogs = await storage.getActivityLogs(100);

      res.json({
        botStats: stats,
        activeServer,
        totalServers: servers.length,
        recentChatMessages: chatLogs.length,
        recentActivities: activityLogs.length,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Load legacy configuration on startup
  setTimeout(async () => {
    try {
      const legacyConfig = botConfigManager.loadLegacyConfig();
      if (Object.keys(legacyConfig).length > 0) {
        await storage.updateBotConfig(legacyConfig);
        console.log('Legacy configuration loaded');
      }
    } catch (error) {
      console.error('Failed to load legacy configuration:', error);
    }
  }, 1000);

  return httpServer;
}
