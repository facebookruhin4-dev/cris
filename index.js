const express = require('express');
const login = require('cyber-bot-fca');
const fs = require('fs');
const path = require('path');
const https = require('https');

const app = express();
const port = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.send('Bot is Always Active & Alive!');
});

app.listen(port, () => {
  console.log(`💡 Web Server running on port ${port}`);
});

// Render Keep-Alive Auto-Ping
const RENDER_URL = process.env.RENDER_EXTERNAL_URL || 'https://cris-kezx.onrender.com';
setInterval(() => {
  https.get(RENDER_URL, (res) => {
    console.log(`🔄 Keep-Alive Status Code: ${res.statusCode}`);
  }).on('error', (err) => {
    console.error('❌ Keep-Alive Error:', err.message);
  });
}, 3 * 60 * 1000);

process.on('uncaughtException', (err) => {
  console.error('🚨 Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection:', promise);
});

// 📁 ডাইনামিকলি সব কমান্ড/মডিউল লোড করার ফাংশন
function loadModules() {
  const modules = [];
  const files = fs.readdirSync(__dirname);

  // মূল ও বিশেষ ফাইলগুলো বাদ দিয়ে বাকি সব .js ফাইল অটোমেটিক লোড হবে
  const ignoreFiles = ['index.js', 'package.json', 'package-lock.json', 'appstate.json', 'last_update_chat.json'];

  files.forEach(file => {
    if (file.endsWith('.js') && !ignoreFiles.includes(file)) {
      try {
        delete require.cache[require.resolve(`./${file}`)]; // ক্যাশ ক্লিয়ার করা
        const mod = require(`./${file}`);
        modules.push({ name: file, module: mod });
        console.log(`✅ অটো লোড হয়েছে: ${file}`);
      } catch (e) {
        console.error(`❌ লোড করতে সমস্যা: ${file}`, e.message);
      }
    }
  });
  return modules;
}

function startBot() {
  let appState;

  if (process.env.APPSTATE) {
    try { appState = JSON.parse(process.env.APPSTATE); } catch (e) { return; }
  } else {
    const appStatePath = path.join(__dirname, 'appstate.json');
    if (fs.existsSync(appStatePath)) {
      try { appState = JSON.parse(fs.readFileSync(appStatePath, 'utf8')); } catch (e) { return; }
    } else { return; }
  }

  const options = { listenEvents: true, selfListen: false, logLevel: 'silent' };

  login({ appState }, options, (err, api) => {
    if (err) {
      setTimeout(startBot, 5000);
      return;
    }

    console.log('🤖 বট সফলভাবে কানেক্ট হয়েছে!');

    // 🚀 অটো-হাজির মেসেজ (চালু হওয়ার পর ১ম গ্রুপে নোটিফিকেশন যাবে)
    api.getThreadList(10, null, ['INBOX'], (listErr, list) => {
      if (!listErr && list) {
        const group = list.find(thread => thread.isGroup === true);
        if (group) {
          api.sendMessage("এক্টিভেট ....🎉", group.threadID);
        }
      }
    });

    api.listenMqtt((listenErr, event) => {
      if (listenErr) {
        setTimeout(startBot, 5000);
        return;
      }

      // সব ফাইল ডাইনামিক লোড করা হচ্ছে
      const loadedModules = loadModules();

      const isSubscribe = event.type === 'event' || 
                          event.logMessageType === 'log:subscribe' || 
                          event.logMessageType === 'log:user-id';

      // Welcome Module অটো রান
      const welcomeMod = loadedModules.find(m => m.name === 'welcome.js');
      if (isSubscribe && welcomeMod && typeof welcomeMod.module.sendWelcomeMessage === 'function') {
        welcomeMod.module.sendWelcomeMessage(api, event);
      }

      if (event.type === 'message' || event.type === 'message_reply') {
        const body = event.body ? event.body.trim() : '';
        if (!body) return;

        // GitHub Auto Update Handler (/addfile & /updatecode)
        const githubMod = loadedModules.find(m => m.name === 'githubManager.js');
        if (githubMod && typeof githubMod.module.handleCodeUpdate === 'function') {
          githubMod.module.handleCodeUpdate(api, event, body);
        }

        // Bad words check (Gali & Warning)
        const galiMod = loadedModules.find(m => m.name === 'gali.js');
        const warningMod = loadedModules.find(m => m.name === 'warning.js');
        if (galiMod && typeof galiMod.module.isGali === 'function') {
          if (galiMod.module.isGali(body)) {
            if (warningMod && typeof warningMod.module.handleWarningAndKick === 'function') {
              warningMod.module.handleWarningAndKick(api, event);
            }
            return;
          }
        }

        // Photos Module
        const photosMod = loadedModules.find(m => m.name === 'photos.js');
        if (photosMod && typeof photosMod.module.sendPhoto === 'function') {
          photosMod.module.sendPhoto(api, event, body);
        }

        // 🌟 ডাইনামিক নতুন ফাইল রান করার অটো লজিক (Custom Modules)
        loadedModules.forEach(item => {
          if (typeof item.module.onMessage === 'function') {
            item.module.onMessage(api, event, body);
          }
        });

        // ডিফল্ট টেক্সট রিপ্লাই
        const text = body.toLowerCase();
        if (text === 'hi' || text === 'hello' || text === 'হাই' || text === 'হ্যালো') {
          api.sendMessage('আসসালামু আলাইকুম🥰 আমি AI আপনাদের গ্রুপ সুন্দর করতে আমি আছি ', event.threadID);
        } else if (text === 'ping' || text === 'পিং') {
          api.sendMessage('Pong! 🏓 বট সম্পূর্ণ সচল আছে।', event.threadID);
        } else if (text === 'bot' || text === 'বট') {
          api.sendMessage('আছি আমি, বলুন!', event.threadID);
        }
      }
    });
  });
}

startBot();