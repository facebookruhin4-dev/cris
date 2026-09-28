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

// -------------------------------------------------------------
// আপনার লোকাল ফাইলসমূহ লোড করা হচ্ছে
// -------------------------------------------------------------
let galiHandler, warningHandler, welcomeHandler;

try {
  if (fs.existsSync(path.join(__dirname, 'gali.js'))) {
    galiHandler = require('./gali');
    console.log('✅ gali.js ফাইল সফলভাবে লোড হয়েছে');
  }
  if (fs.existsSync(path.join(__dirname, 'warning.js'))) {
    warningHandler = require('./warning');
    console.log('✅ warning.js ফাইল সফলভাবে লোড হয়েছে');
  }
  if (fs.existsSync(path.join(__dirname, 'welcome.js'))) {
    welcomeHandler = require('./welcome');
    console.log('✅ welcome.js ফাইল সফলভাবে লোড হয়েছে');
  }
} catch (e) {
  console.error('❌ ফাইল লোড করতে সমস্যা হয়েছে:', e);
}

function startBot() {
  let appState;

  if (process.env.APPSTATE) {
    try {
      appState = JSON.parse(process.env.APPSTATE);
    } catch (e) {
      console.error('❌ Render Environment Variable-এর APPSTATE JSON সঠিক নয়!');
      return;
    }
  } else {
    const appStatePath = path.join(__dirname, 'appstate.json');
    if (fs.existsSync(appStatePath)) {
      try {
        appState = JSON.parse(fs.readFileSync(appStatePath, 'utf8'));
      } catch (e) {
        console.error('❌ appstate.json ফাইলের JSON স্ট্রাকচার ভুল!');
        return;
      }
    } else {
      console.error('❌ appstate.json বা APPSTATE ভেরিয়েবল পাওয়া যায়নি!');
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
      console.error('❌ লগইন ব্যর্থ হয়েছে! কারণ:', err);
      setTimeout(startBot, 5000);
      return;
    }

    console.log('🤖 বট সফলভাবে কানেক্ট হয়েছে এবং লিসেনিং শুরু করেছে!');

    api.listenMqtt((listenErr, event) => {
      if (listenErr) {
        console.error('🚨 MQTT Listen Error:', listenErr);
        return;
      }

      console.log(`📥 Event Received: Type = [${event.type}]`);

      // ১. ওয়েলকাম / নতুন মেম্বার জয়েন ইভেন্ট (welcome.js)
      if (event.type === 'event' || event.logMessageType === 'log:subscribe') {
        if (welcomeHandler) {
          if (typeof welcomeHandler === 'function') {
            welcomeHandler({ api, event });
          } else if (welcomeHandler.run) {
            welcomeHandler.run({ api, event });
          }
        }
      }

      // ২. মেসেজ ইভেন্ট (gali.js, warning.js এবং অন্যান্য)
      if (event.type === 'message' || event.type === 'message_reply') {
        const body = event.body ? event.body.trim() : '';
        const senderID = event.senderID;
        const threadID = event.threadID;

        if (!body) return;

        console.log(`💬 Message From [${senderID}] in Thread [${threadID}]: "${body}"`);

        // gali.js হ্যান্ডলার রান
        if (galiHandler) {
          if (typeof galiHandler === 'function') {
            galiHandler({ api, event, body });
          } else if (galiHandler.run) {
            galiHandler.run({ api, event, body });
          }
        }

        // warning.js হ্যান্ডলার রান
        if (warningHandler) {
          if (typeof warningHandler === 'function') {
            warningHandler({ api, event, body });
          } else if (warningHandler.run) {
            warningHandler.run({ api, event, body });
          }
        }

        // সাধারণ রেসপন্স (ইনবিল্ট)
        const text = body.toLowerCase();
        if (text === 'hi' || text === 'hello' || text === 'হাই' || text === 'হ্যালো') {
          api.sendMessage('হ্যালো ওস্তাদ! আমি অন আছি, কীভাবে সাহায্য করতে পারি?', threadID);
        } else if (text === 'ping' || text === 'পিং') {
          api.sendMessage('Pong! 🏓 বট সম্পূর্ণ সচল আছে।', threadID);
        } else if (text === 'bot' || text === 'বট') {
          api.sendMessage('জি ওস্তাদ, বলুন!', threadID);
        }
      }
    });
  });
}

startBot();
