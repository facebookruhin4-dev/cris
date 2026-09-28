const express = require('express');
const login = require('cyber-bot-fca');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 10000;

app.get('/', (req, res) => {
  res.send('Bot is Alive & Running!');
});

app.listen(port, () => {
  console.log(`💡 Web Server running on port ${port}`);
});

// ফাইল লোড করা
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
      console.error('❌ লগইন ব্যর্থ হয়েছে:', err);
      setTimeout(startBot, 5000);
      return;
    }

    console.log('🤖 বট সফলভাবে কানেক্ট হয়েছে এবং লিসেনিং শুরু করেছে!');

    api.listenMqtt((listenErr, event) => {
      if (listenErr) {
        console.error('🚨 MQTT Listen Error:', listenErr);
        return;
      }

      console.log(`📥 Event Received: Type = [${event.type}] | LogType = [${event.logMessageType || 'none'}]`);

      // ১. কেউ গ্রুপে জয়েন করলে (welcome.js)
      if (event.type === 'event' && event.logMessageType === 'log:subscribe') {
        if (welcomeModule && typeof welcomeModule.sendWelcomeMessage === 'function') {
          welcomeModule.sendWelcomeMessage(api, event);
        }
      }

      // ২. কেউ মেসেজ পাঠালে (gali.js ও warning.js)
      if (event.type === 'message' || event.type === 'message_reply') {
        const body = event.body ? event.body.trim() : '';
        if (!body) return;

        // গালাগালি চেক করা (gali.js এর isGali ফাংশন কল)
        if (galiModule && typeof galiModule.isGali === 'function') {
          const hasGali = galiModule.isGali(body);

          if (hasGali) {
            console.log(`⚠️ Bad word detected from User [${event.senderID}]: "${body}"`);
            
            // ওয়ার্নিং ও কিক হ্যান্ডলার কল (warning.js এর handleWarningAndKick)
            if (warningModule && typeof warningModule.handleWarningAndKick === 'function') {
              warningModule.handleWarningAndKick(api, event);
            }
            return; // গালাগালি থাকলে নিচের সাধারণ রেসপন্স করবে না
          }
        }

        // সাধারণ রেসপন্স / টেস্ট
        const text = body.toLowerCase();
        if (text === 'hi' || text === 'hello' || text === 'হাই' || text === 'হ্যালো') {
          api.sendMessage('হ্যালো ওস্তাদ! আমি অন আছি, কীভাবে সাহায্য করতে পারি?', event.threadID);
        } else if (text === 'ping' || text === 'পিং') {
          api.sendMessage('Pong! 🏓 বট সম্পূর্ণ সচল আছে।', event.threadID);
        } else if (text === 'bot' || text === 'বট') {
          api.sendMessage('জি ওস্তাদ, বলুন!', event.threadID);
        }
      }
    });
  });
}

startBot();
