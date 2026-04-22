const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');

// ─── Konfiguration ────────────────────────────────────────────────────────────
const CONFIG = {
  host: process.env.HOST || 'RobGie2010-sLMB.aternos.me',
  port: parseInt(process.env.PORT) || 27982,
  username: process.env.USERNAME || 'PlayerAI',
  version: process.env.VERSION || '1.20.1',

  // Bewegungseinstellungen
  wanderRadius: 15,        // Wie weit der Bot maximal läuft (Blöcke)
  wanderInterval: 8000,    // Pause zwischen Bewegungen (ms)
  wanderChance: 0.8,       // Wahrscheinlichkeit zu laufen (0-1)

  // Reconnect-Einstellungen
  reconnectDelay: 5000,    // Wartezeit vor Reconnect (ms)
  maxReconnectDelay: 60000,

  // Chat-Antworten (optional)
  respondToChat: true,
  chatResponses: [
    'Bin am Erkunden! 🚶',
    'Alles okay hier!',
    'Server läuft prima 👍',
  ],
};

// ─── Bot-Logik ────────────────────────────────────────────────────────────────
let bot;
let wanderTimer = null;
let reconnectDelay = CONFIG.reconnectDelay;
let isConnected = false;

function createBot() {
  console.log(`\n[BOT] Verbinde mit ${CONFIG.host}:${CONFIG.port} als "${CONFIG.username}"...`);

  bot = mineflayer.createBot({
    host: CONFIG.host,
    port: CONFIG.port,
    username: CONFIG.username,
    version: CONFIG.version,
    keepAlive: true,
    checkTimeoutInterval: 30000,
  });

  bot.loadPlugin(pathfinder);

  // ── Events ──────────────────────────────────────────────────────────────────

  bot.once('spawn', () => {
    isConnected = true;
    reconnectDelay = CONFIG.reconnectDelay;
    console.log(`[BOT] ✅ Erfolgreich gespawnt! Position: ${fmtPos(bot.entity.position)}`);
    console.log(`[BOT] 🎮 Bot ist jetzt aktiv und beginnt zu wandern...`);

    const defaultMove = new Movements(bot);
    defaultMove.allowSprinting = false;
    defaultMove.canDig = false;
    bot.pathfinder.setMovements(defaultMove);

    startWandering();
  });

  bot.on('chat', (username, message) => {
    if (username === bot.username) return;
    console.log(`[CHAT] <${username}> ${message}`);

    if (CONFIG.respondToChat && Math.random() < 0.3) {
      const reply = CONFIG.chatResponses[Math.floor(Math.random() * CONFIG.chatResponses.length)];
      setTimeout(() => bot.chat(reply), 1000 + Math.random() * 2000);
    }
  });

  bot.on('kicked', (reason) => {
    isConnected = false;
    console.log(`[BOT] ⚠️  Vom Server gekickt: ${reason}`);
    stopWandering();
    scheduleReconnect();
  });

  bot.on('error', (err) => {
    console.error(`[BOT] ❌ Fehler: ${err.message}`);
    if (err.code === 'ECONNREFUSED') {
      console.log('[BOT] Server ist offline oder noch nicht gestartet.');
    }
  });

  bot.on('end', (reason) => {
    if (!isConnected) return;
    isConnected = false;
    console.log(`[BOT] 🔌 Verbindung getrennt: ${reason}`);
    stopWandering();
    scheduleReconnect();
  });

  bot.on('health', () => {
    if (bot.health < 5) {
      console.log(`[BOT] ❤️  Kritische HP: ${bot.health.toFixed(1)} — esse etwas...`);
      eatFood();
    }
  });

  bot.on('death', () => {
    console.log('[BOT] 💀 Bot ist gestorben! Respawne...');
    bot.once('spawn', () => {
      console.log('[BOT] ✅ Respawnt!');
      startWandering();
    });
  });
}

// ─── Wandern ─────────────────────────────────────────────────────────────────

function startWandering() {
  stopWandering();
  console.log('[BOT] 🚶 Starte Wander-Routine...');
  wanderTimer = setInterval(doWander, CONFIG.wanderInterval);
  doWander(); // direkt loslaufen
}

function stopWandering() {
  if (wanderTimer) {
    clearInterval(wanderTimer);
    wanderTimer = null;
  }
}

async function doWander() {
  if (!bot || !isConnected) return;
  if (Math.random() > CONFIG.wanderChance) {
    console.log('[BOT] 💤 Mache kurze Pause...');
    return;
  }

  const pos = bot.entity.position;
  const r = CONFIG.wanderRadius;

  // Zufällige Position in einem Radius
  const targetX = Math.floor(pos.x + (Math.random() * r * 2 - r));
  const targetZ = Math.floor(pos.z + (Math.random() * r * 2 - r));
  const targetY = Math.floor(pos.y);

  console.log(`[BOT] 🗺️  Laufe zu: X=${targetX} Y=${targetY} Z=${targetZ}`);

  try {
    await bot.pathfinder.goto(new goals.GoalXZ(targetX, targetZ));
    console.log(`[BOT] ✔️  Ziel erreicht! Aktuelle Pos: ${fmtPos(bot.entity.position)}`);

    // Manchmal umschauen
    if (Math.random() < 0.4) {
      await bot.look(Math.random() * Math.PI * 2, (Math.random() - 0.5) * 0.5);
    }

    // Manchmal springen
    if (Math.random() < 0.2) {
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 300);
    }

  } catch (err) {
    console.log(`[BOT] ⚡ Konnte Ziel nicht erreichen, wähle neues Ziel...`);
  }
}

// ─── Essen ────────────────────────────────────────────────────────────────────

async function eatFood() {
  const food = bot.inventory.items().find(item =>
    item.name.includes('bread') ||
    item.name.includes('apple') ||
    item.name.includes('cooked') ||
    item.name.includes('steak') ||
    item.name.includes('carrot')
  );

  if (food) {
    try {
      await bot.equip(food, 'hand');
      await bot.consume();
      console.log(`[BOT] 🍖 ${food.name} gegessen!`);
    } catch (e) {
      console.log('[BOT] Konnte nicht essen.');
    }
  }
}

// ─── Reconnect ────────────────────────────────────────────────────────────────

function scheduleReconnect() {
  console.log(`[BOT] 🔄 Reconnect in ${reconnectDelay / 1000}s...`);
  setTimeout(() => {
    createBot();
    reconnectDelay = Math.min(reconnectDelay * 1.5, CONFIG.maxReconnectDelay);
  }, reconnectDelay);
}

// ─── Hilfsfunktionen ──────────────────────────────────────────────────────────

function fmtPos(pos) {
  return `X=${pos.x.toFixed(1)} Y=${pos.y.toFixed(1)} Z=${pos.z.toFixed(1)}`;
}

// ─── Start ────────────────────────────────────────────────────────────────────

console.log('╔══════════════════════════════════════╗');
console.log('║      Aternos Keep-Alive Bot          ║');
console.log('╚══════════════════════════════════════╝');
console.log(`[INFO] Host:     ${CONFIG.host}`);
console.log(`[INFO] Port:     ${CONFIG.port}`);
console.log(`[INFO] Username: ${CONFIG.username}`);
console.log(`[INFO] Version:  ${CONFIG.version}`);
console.log('');

createBot();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[BOT] 👋 Bot wird beendet...');
  stopWandering();
  if (bot) bot.quit('Bot beendet');
  process.exit(0);
});
