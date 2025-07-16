import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { BotConfig } from '@shared/schema';

export class BotConfigManager {
  private configPath: string;

  constructor() {
    this.configPath = join(process.cwd(), 'attached_assets', 'settings_1752503807303.json');
  }

  loadLegacyConfig(): Partial<BotConfig> {
    if (!existsSync(this.configPath)) {
      return {};
    }

    try {
      const configData = JSON.parse(readFileSync(this.configPath, 'utf-8'));
      
      return {
        username: configData['bot-account']?.username || 'ZEROO',
        password: configData['bot-account']?.password || '',
        authType: configData['bot-account']?.type || 'mojang',
        autoReconnect: configData.utils?.['auto-reconnect'] || true,
        antiAfk: configData.utils?.['anti-afk']?.enabled || true,
        chatMessages: configData.utils?.['chat-messages']?.enabled || true,
        chatMessagesRepeat: configData.utils?.['chat-messages']?.repeat || true,
        chatMessagesDelay: configData.utils?.['chat-messages']?.['repeat-delay'] || 60,
        autoAuth: configData.utils?.['auto-auth']?.enabled || false,
        autoAuthPassword: configData.utils?.['auto-auth']?.password || '',
        position: configData.position || { enabled: false, x: 0, y: 0, z: 0 },
      };
    } catch (error) {
      console.error('Failed to load legacy config:', error);
      return {};
    }
  }

  saveLegacyConfig(config: BotConfig): void {
    try {
      const legacyFormat = {
        'bot-account': {
          username: config.username,
          password: config.password,
          type: config.authType,
        },
        server: {
          ip: 'zeroxxzx.aternos.me',
          port: 58349,
          version: '1.12.1',
        },
        position: config.position,
        utils: {
          'auto-auth': {
            enabled: config.autoAuth,
            password: config.autoAuthPassword,
          },
          'anti-afk': {
            enabled: config.antiAfk,
            sneak: true,
          },
          'chat-messages': {
            enabled: config.chatMessages,
            repeat: config.chatMessagesRepeat,
            'repeat-delay': config.chatMessagesDelay,
            messages: [
              "I'm a regular player",
              "Subscribe To Slobos!",
              "I Like to Play Minecraft!"
            ],
          },
          'chat-log': true,
          'auto-reconnect': config.autoReconnect,
          'auto-recconect-delay': 5000,
        },
      };

      writeFileSync(this.configPath, JSON.stringify(legacyFormat, null, 2));
    } catch (error) {
      console.error('Failed to save legacy config:', error);
    }
  }
}

export const botConfigManager = new BotConfigManager();
