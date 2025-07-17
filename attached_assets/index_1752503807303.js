const mineflayer = require('mineflayer');
const Movements = require('mineflayer-pathfinder').Movements;
const pathfinder = require('mineflayer-pathfinder').pathfinder;
const { GoalBlock } = require('mineflayer-pathfinder').goals;

const config = require('./settings.json');
const express = require('express');

const app = express();

app.get('/', (req, res) => {
  res.send('Bot has arrived');
});

app.listen(8000, () => {
  console.log('Server started');
});

const express = require('express');
const app = express();
const port = process.env.PORT || 8000;

// Main route
app.get('/', (req, res) => {
  res.send('Bot has arrived');
});

// ✅ Health check route for Render or UptimeRobot
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// Start server
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

// Utility to generate a human-like username (5-16 chars, letters and sometimes numbers)
function generateHumanUsername() {
  const names = [
    'Alex', 'Steve', 'Mina', 'Luna', 'Noah', 'Emma', 'Liam', 'Ava', 'Eli', 'Milo',
    'Zoe', 'Leo', 'Maya', 'Nina', 'Owen', 'Ivy', 'Eden', 'Ezra', 'Nova', 'Kai',
    'Jade', 'Finn', 'Sage', 'Rex', 'Skye', 'Jax', 'Mira', 'Nico', 'Rory', 'Tess'
  ];
  let base = names[Math.floor(Math.random() * names.length)];
  // 50% chance to add numbers or underscore
  if (Math.random() < 0.5) {
    if (Math.random() < 0.5) {
      base += Math.floor(Math.random() * 100); // add 0-99
    } else {
      base += '_' + Math.floor(Math.random() * 100);
    }
  }
  // Ensure length between 5 and 16
  if (base.length < 5) {
    base += Math.random().toString(36).substring(2, 5 - base.length + 2);
  }
  if (base.length > 16) {
    base = base.substring(0, 16);
  }
  return base;
}

// Utility to get random int in range [min, max], but never above 70
function randomInt(min, max) {
  const upper = Math.min(max, 70);
  return Math.floor(Math.random() * (upper - min + 1)) + min;
}

// Utility to shuffle an array (Fisher-Yates)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Utility to get random float in range [min, max]
function randomFloat(min, max) {
  return Math.random() * (max - min) + min;
}

let botInstance = null;
let sessionTimeout = null;
let breakTimeout = null;

// Track all timers for cleanup
let chatTimer = null;
let moveTimer = null;
let afkTimer = null;

function clearAllBotTimers() {
  if (chatTimer) clearTimeout(chatTimer);
  if (moveTimer) clearTimeout(moveTimer);
  if (afkTimer) clearTimeout(afkTimer);
  chatTimer = null;
  moveTimer = null;
  afkTimer = null;
}

function startBotCycle(customOnlineTime) {
  config['bot-account']['username'] = generateHumanUsername();
  console.log(`[INFO] Generated username: ${config['bot-account']['username']}`);

  botInstance = createBot();

  // Online for 10-12 minutes if customOnlineTime is set (after ban), else 10-30 minutes
  const onlineTime = customOnlineTime || (randomInt(10, 30) * 60 * 1000);
  sessionTimeout = setTimeout(() => {
    if (botInstance) {
      console.log(`[INFO] Shutting down bot after ${(onlineTime / 60000).toFixed(1)} minutes online.`);
      botInstance.quit();
      botInstance = null;
    }
    // Offline for 10-70 seconds
    const offlineTime = randomInt(10, 70) * 1000;
    breakTimeout = setTimeout(() => {
      startBotCycle();
    }, offlineTime);
    console.log(`[INFO] Bot will restart after ${(offlineTime / 1000).toFixed(1)} seconds offline.`);
  }, onlineTime);
}

function createBot() {
   const bot = mineflayer.createBot({
      username: config['bot-account']['username'],
      password: config['bot-account']['password'],
      auth: config['bot-account']['type'],
      host: config.server.ip,
      port: config.server.port,
      version: config.server.version,
   });

   bot.loadPlugin(pathfinder);
   const mcData = require('minecraft-data')(bot.version);
   const defaultMove = new Movements(bot, mcData);
   bot.settings.colorsEnabled = false;

   let pendingPromise = Promise.resolve();

   function sendRegister(password) {
      return new Promise((resolve, reject) => {
         bot.chat(`/register ${password} ${password}`);
         console.log(`[Auth] Sent /register command.`);

         bot.once('chat', (username, message) => {
            console.log(`[ChatLog] <${username}> ${message}`); // Log all chat messages

            // Check for various possible responses
            if (message.includes('successfully registered')) {
               console.log('[INFO] Registration confirmed.');
               resolve();
            } else if (message.includes('already registered')) {
               console.log('[INFO] Bot was already registered.');
               resolve(); // Resolve if already registered
            } else if (message.includes('Invalid command')) {
               reject(`Registration failed: Invalid command. Message: "${message}"`);
            } else {
               reject(`Registration failed: unexpected message "${message}".`);
            }
         });
      });
   }

   function sendLogin(password) {
      return new Promise((resolve, reject) => {
         bot.chat(`/login ${password}`);
         console.log(`[Auth] Sent /login command.`);

         bot.once('chat', (username, message) => {
            console.log(`[ChatLog] <${username}> ${message}`); // Log all chat messages

            if (message.includes('successfully logged in')) {
               console.log('[INFO] Login successful.');
               resolve();
            } else if (message.includes('Invalid password')) {
               reject(`Login failed: Invalid password. Message: "${message}"`);
            } else if (message.includes('not registered')) {
               reject(`Login failed: Not registered. Message: "${message}"`);
            } else {
               reject(`Login failed: unexpected message "${message}".`);
            }
         });
      });
   }

   bot.once('spawn', () => {
      console.log('\x1b[33m[AfkBot] Bot joined the server', '\x1b[0m');

      if (config.utils['auto-auth'].enabled) {
         console.log('[INFO] Started auto-auth module');

         const password = config.utils['auto-auth'].password;

         pendingPromise = pendingPromise
            .then(() => sendRegister(password))
            .then(() => sendLogin(password))
            .catch(error => console.error('[ERROR]', error));
      }

      // --- Human-like Chat ---
      if (config.utils['chat-messages'].enabled) {
         console.log('[INFO] Started chat-messages module (humanized)');
         let messages = shuffleArray([...config.utils['chat-messages']['messages']]);
         let msgIndex = 0;
         function sendNextMessage() {
           // 40% chance to skip sending a message
           if (Math.random() < 0.4) {
             chatTimer = setTimeout(sendNextMessage, randomInt(30, 180) * 1000);
             return;
           }
           // Add typo/emote/natural delay
           let msg = messages[msgIndex];
           if (Math.random() < 0.2) msg += [' :)', '...', ' :D', ' xD'][Math.floor(Math.random()*4)];
           if (Math.random() < 0.1) msg = msg.replace(/a|e|i|o|u/g, c => Math.random()<0.5 ? c : '');
           bot.chat(msg);
           msgIndex++;
           if (msgIndex >= messages.length) {
             messages = shuffleArray([...config.utils['chat-messages']['messages']]);
             msgIndex = 0;
           }
           chatTimer = setTimeout(sendNextMessage, randomInt(30, 180) * 1000);
         }
         chatTimer = setTimeout(sendNextMessage, randomInt(10, 60) * 1000);
      }

      // --- Human-like Movement ---
      if (config.position.enabled) {
         const base = { x: config.position.x, y: config.position.y, z: config.position.z };
         function randomMoveLoop() {
           if (Math.random() < 0.3) {
             moveTimer = setTimeout(randomMoveLoop, randomInt(10, 60) * 1000);
             return;
           }
           const dx = randomInt(-10, 10);
           const dz = randomInt(-10, 10);
           const target = { x: base.x + dx, y: base.y, z: base.z + dz };
           bot.pathfinder.setMovements(defaultMove);
           bot.pathfinder.setGoal(new GoalBlock(target.x, target.y, target.z));
           // Sometimes sprint or jump while moving
           if (Math.random() < 0.3) bot.setControlState('sprint', true);
           if (Math.random() < 0.2) bot.setControlState('jump', true);
           // Look around while moving
           if (Math.random() < 0.5) {
             const yaw = randomFloat(-Math.PI, Math.PI);
             const pitch = randomFloat(-Math.PI/4, Math.PI/4);
             bot.look(yaw, pitch, true);
           }
           // After arriving or timeout, move again
           const moveTime = randomInt(10, 40) * 1000;
           moveTimer = setTimeout(() => {
             bot.setControlState('sprint', false);
             bot.setControlState('jump', false);
             randomMoveLoop();
           }, moveTime);
         }
         moveTimer = setTimeout(randomMoveLoop, randomInt(10, 60) * 1000);
      }

      // --- Human-like Anti-AFK ---
      if (config.utils['anti-afk'].enabled) {
         function antiAfkLoop() {
           if (Math.random() < 0.5) {
             afkTimer = setTimeout(antiAfkLoop, randomInt(30, 120) * 1000);
             return;
           }
           // Combine actions
           const actions = ['jump', 'sneak', 'look', 'combo'];
           const action = actions[Math.floor(Math.random() * actions.length)];
           if (action === 'jump') {
             bot.setControlState('jump', true);
             setTimeout(() => bot.setControlState('jump', false), randomInt(1, 3) * 1000);
           } else if (action === 'sneak') {
             bot.setControlState('sneak', true);
             setTimeout(() => bot.setControlState('sneak', false), randomInt(2, 5) * 1000);
           } else if (action === 'look') {
             const yaw = randomFloat(-Math.PI, Math.PI);
             const pitch = randomFloat(-Math.PI/4, Math.PI/4);
             bot.look(yaw, pitch, true);
           } else if (action === 'combo') {
             bot.setControlState('jump', true);
             bot.setControlState('sneak', true);
             setTimeout(() => {
               bot.setControlState('jump', false);
               bot.setControlState('sneak', false);
             }, randomInt(2, 5) * 1000);
             const yaw = randomFloat(-Math.PI, Math.PI);
             const pitch = randomFloat(-Math.PI/4, Math.PI/4);
             bot.look(yaw, pitch, true);
           }
           afkTimer = setTimeout(antiAfkLoop, randomInt(30, 120) * 1000);
         }
         afkTimer = setTimeout(antiAfkLoop, randomInt(10, 60) * 1000);
      }

      // --- Simple Command System ---
      bot.on('whisper', (username, message) => {
        if (username === bot.username) return;
        if (/come here/i.test(message)) {
          bot.chat('Coming!');
          // Move to the player if possible
          const player = bot.players[username];
          if (player && player.entity) {
            bot.pathfinder.setGoal(new GoalBlock(
              Math.floor(player.entity.position.x),
              Math.floor(player.entity.position.y),
              Math.floor(player.entity.position.z)
            ));
          }
        } else if (/say hi|hello/i.test(message)) {
          bot.chat('Hi ' + username + '!');
        }
      });
   });

   bot.on('goal_reached', () => {
      console.log(
         `\x1b[32m[AfkBot] Bot arrived at the target location. ${bot.entity.position}\x1b[0m`
      );
   });

   bot.on('death', () => {
      console.log(
         `\x1b[33m[AfkBot] Bot has died and was respawned at ${bot.entity.position}`,
         '\x1b[0m'
      );
   });

   bot.on('kicked', (reason) => {
      console.log(
         '\x1b[33m',
         `[AfkBot] Bot was kicked from the server. Reason: \n${reason}`,
         '\x1b[0m'
      );
      clearAllBotTimers();
      // Immediately start a new session with a new username and short online time
      if (sessionTimeout) clearTimeout(sessionTimeout);
      if (breakTimeout) clearTimeout(breakTimeout);
      botInstance = null;
      // Wait a short random time (2-5s) before reconnecting
      setTimeout(() => {
        startBotCycle(randomInt(10, 12) * 60 * 1000);
      }, randomInt(2, 5) * 1000);
   });

   bot.on('end', () => {
      clearAllBotTimers();
      // If not already handled by 'kicked', treat as disconnect/ban
      if (sessionTimeout) clearTimeout(sessionTimeout);
      if (breakTimeout) clearTimeout(breakTimeout);
      botInstance = null;
      setTimeout(() => {
        startBotCycle(randomInt(10, 12) * 60 * 1000);
      }, randomInt(2, 5) * 1000);
   });

   bot.on('error', (err) =>
      console.log(`\x1b[31m[ERROR] ${err.message}`, '\x1b[0m')
   );

   return bot;
}

// Start the on/off cycle instead of just createBot()
startBotCycle();
