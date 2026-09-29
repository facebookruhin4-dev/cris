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

// -------------------------------------------------------------
// Render Anti-Sleep Auto-Ping (বটকে সবসময় ২৪/৭ সচল রাখার জন্য)
// -------------------------------------------------------------
const RENDER_URL = process.env.RENDER_EXTERNAL_URL || 'https://cris-kezx.onrender.com';

setInterval(() => {
  https.get(RENDER_URL, (res) => {
    console.log(`🔄 Keep-Alive Trigger Sent! Status Code: ${res.statusCode}`);
  }).on('error', (err) => {
    console.error('❌ Keep-Alive Trigger Error:', err.message);
  });
}, 3 * 60 * 1000); // প্রতি ৩ মিনিটে পিং পাঠাবে

// -------------------------------------------------------------
// Uncaught Exception Handling (বট যেন ক্র্যাশ করে বন্ধ না হয়)
// -------------------------------------------------------------
process.on('uncaughtException', (err) => {
  console.error('🚨 Caught Exception (Bot Preventing Crash):', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
});

// মডিউল লোডিং
let galiModule, warningModule, welcomeModule;

try {
  galiModule = require('./gali');
  console.log('✅ Loaded gali.js');
} catch (e) {
  console.error('❌ gali.js load error:', e.message);
}

try {
  warningModule = require('./warning');
  console.log('✅ Loaded warning.js');
} catch (e) {
  console.error('❌ warning.js load error:', e.message);
}

try {
  welcomeModule = require('./welcome');
  console.log('✅ Loaded welcome.js');
} catch (e) {
  console.error('❌ welcome.js load error:', e.message);
}

function startBot() {
  let appState;

  if (process.env.APPSTATE) {
    try {
      appState = JSON.parse(process.env.APPSTATE);
    } catch (e) {
      console.error('❌ APPSTATE JSON ভুল!');
      return;
    }
  } else {
    const appStatePath = path.join(__dirname, 'appstate.json');
    if (fs.existsSync(appStatePath)) {
      try {
        appState = JSON.parse(fs.readFileSync(appStatePath, 'utf8'));
      } catch (e) {
        console.error('❌ appstate.json এর JSON ভুল!');
        return;
      }
    } else {
      console.error('❌ appstate.json বা APPSTATE ভেরিয়াবল পাওয়া যায়নি!');
      return;
    }
  }

  const options = {
    listenEvents: true,
    selfListen: false,
    logLevel: 'silent'
  };

  login({ appState }, options, (err, api) => {
    if (err) {
      console.error('❌ লগইন ব্যর্থ হয়েছে! ৫ সেকেন্ড পর অটো-রিস্টার্ট হচ্ছে...:', err);
      setTimeout(startBot, 5000);
      return;
    }

    console.log('🤖 বট সফলভাবে কানেক্ট হয়েছে এবং লিসেনিং শুরু করেছে!');

    api.listenMqtt((listenErr, event) => {
      if (listenErr) {
        console.error('🚨 MQTT Listen Error! অটো-রিকানেক্ট চেষ্টা করা হচ্ছে...:', listenErr);
        setTimeout(startBot, 5000);
        return;
      }

      console.log(`📥 Event Received: Type = [${event.type}] | LogType = [${event.logMessageType || 'none'}]`);

      // ১. ওয়েলকাম ইভেন্ট হ্যান্ডলার (সব ধরণের সাবস্ক্রাইব ও জয়েন ইভেন্ট কভার করবে)
      const isSubscribe = event.type === 'event' || 
                          event.logMessageType === 'log:subscribe' || 
                          event.logMessageType === 'log:user-id';

      if (isSubscribe) {
        if (welcomeModule && typeof welcomeModule.sendWelcomeMessage === 'function') {
          try {
            welcomeModule.sendWelcomeMessage(api, event);
            console.log('🎉 Welcome Message Triggered Successfully!');
          } catch (welErr) {
            console.error('❌ Error in welcome.js execution:', welErr);
          }
        }
      }

      // ২. মেসেজ প্রসেসিং (gali.js ও warning.js)
      if (event.type === 'message' || event.type === 'message_reply') {
        const body = event.body ? event.body.trim() : '';
        if (!body) return;

        // গালাগালি ডিটেকশন
        if (galiModule && typeof galiModule.isGali === 'function') {
          const hasGali = galiModule.isGali(body);

          if (hasGali) {
            console.log(`⚠️ Bad word detected from User [${event.senderID}]: "${body}"`);
            
            if (warningModule && typeof warningModule.handleWarningAndKick === 'function') {
              try {
                warningModule.handleWarningAndKick(api, event);
              } catch (warnErr) {
                console.error('❌ Error in warning.js execution:', warnErr);
              }
            }
            return;
          }
        }

        // সাধারণ উত্তর
        const text = body.toLowerCase();
        if (text === 'hi' || text === 'hello' || text === 'হাই' || text === 'হ্যালো') {
          api.sendMessage('আসসালামু আলাইকুম🥰 আমি AI আপনাদের গ্রুপ সুন্দর করতে আমি আছি ', event.threadID);
        } else if (text === 'ping' || text === 'পিং') {
          api.sendMessage('Pong! 🏓 বট সম্পূর্ণ সচল আছে।', event.threadID);
        } else if (text === 'bot' || text === 'বট') {
          api.sendMessage(' আছি আমি , বলুন!', event.threadID);
        }
      }
    });
  });
}

startBot();
