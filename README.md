# 🤖 Aternos Keep-Alive Bot

Ein Mineflayer-Bot der deinen Aternos-Server am Leben hält, indem er random durch die Welt läuft.

## ✅ Voraussetzungen

- [Node.js](https://nodejs.org/) (Version 16 oder neuer)

## 🚀 Setup

### 1. Abhängigkeiten installieren
```bash
npm install
```

### 2. Konfiguration anpassen

Öffne `bot.js` und ändere diese Zeilen oben in der Datei:

```js
host: 'DEIN-SERVER.aternos.me',   // ← Deine Aternos-Adresse
username: 'KeepAliveBot',          // ← Bot-Name
version: '1.20.1',                 // ← Deine Server-Version
```

### 3. Bot starten
```bash
node bot.js
```

---

## ⚙️ Einstellungen (in bot.js)

| Option | Standard | Beschreibung |
|---|---|---|
| `wanderRadius` | `15` | Wie weit der Bot maximal läuft |
| `wanderInterval` | `8000` | Millisekunden zwischen Bewegungen |
| `wanderChance` | `0.8` | Wahrscheinlichkeit zu laufen (0–1) |
| `reconnectDelay` | `5000` | Wartezeit vor Reconnect (ms) |

---

## 📋 Hinweise

- **Aternos Offline-Mode**: Der Bot funktioniert auf Cracked/Offline-Servern.  
  Auf Premium-Servern brauchst du einen echten Minecraft-Account + `mineflayer` mit Auth-Token.

- **Version**: Stelle sicher, dass `version` mit deiner Server-Version übereinstimmt!

- **Aternos stoppt Server nach Inaktivität** – der Bot verhindert das, solange er verbunden ist.

- **Nicht AFK-Kick**: Falls dein Server einen AFK-Kick hat, kann der Bot sich durch die Bewegungen davor schützen.

---

## 🔄 Dauerhaft laufen lassen (optional)

Mit `pm2` bleibt der Bot auch nach Serverneustarts aktiv:

```bash
npm install -g pm2
pm2 start bot.js --name "aternos-bot"
pm2 save
pm2 startup
```
