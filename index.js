
const express = require('express');
const login = require('cyber-bot-fca');
const fs = require('fs');
const path = require('path');

// আমাদের বাকি ফাইলগুলো ইম্পোর্ট করা হলো
const { isGali } = require('./gali');
const { handleWarningAndKick } = require('./warning');
const { sendWelcomeMessage } = require('./welcome');

const app = express();
const PORT = process.env.PORT || 10000;

// Render-এ অনলাইন রাখার জন্য
app.get('/', (req, res) => {
  res.send('Cyber Messenger Bot is Active & Running!');
});

app.listen(PORT, () => {
  console.log(`💡 Web Server running on port ${PORT}`);
});

function startBot() {
  let appState;

  // Render এর Environment Variable থেকে পড়ে নেবে
  if (process.env.APPSTATE) {
    try {
      appState = JSON.parse(process.env.APPSTATE);
    } catch (e) {
      console.error('❌ APPSTATE Environment Variable পার্স করতে ব্যর্থ!');
      return;
    }
  } else {
    const appStatePath = path.join(__dirname, 'appstate.json');
    if (fs.existsSync(appStatePath)) {
      appState = JSON.parse(fs.readFileSync(appStatePath, 'utf8'));
    } else {
      console.error('❌ appstate.json বা APPSTATE পাওয়া যায়নি!');
      return;
    }
  }

  login({ appState }, (err, api) => {
    if (err) {
      console.error(`❌ লগইন ব্যর্থ হয়েছে, ৫ সেকেন্ড পর চেষ্টা করছি...`, err);
      setTimeout(startBot, 5000);
      return;
    }

    api.setOptions({ listenEvents: true, selfListen: false });
    console.log('🤖 বট সফলভাবে কানেক্ট হয়েছে!');

    api.listenMqtt((listenErr, event) => {
      if (listenErr) {
        console.error(`⚠️ MQTT Error: ${listenErr}`);
        setTimeout(startBot, 3000);
        return;
      }

      if (!event) return;

      // ১. নতুন মেম্বার ওয়েলকাম চেকিং
      if (event.type === 'event') {
        sendWelcomeMessage(api, event);
      }

      // ২. গালাগালি চেকিং ও ওয়ার্নিং/কিক
      if (event.type === 'message' || event.type === 'message_reply') {
        if (isGali(event.body)) {
          console.log(`⚠️ গালাগালি ধরা পড়েছে: ${event.senderID}`);
          handleWarningAndKick(api, event);
        }
      }
    });
  });
}

// ক্র্যাশ হ্যান্ডলিং
process.on('uncaughtException', (err) => {
  console.error('🔥 Uncaught Exception:', err);
  setTimeout(startBot, 3000);
});

process.on('unhandledRejection', (reason) => {
  console.error('🔥 Unhandled Rejection:', reason);
  setTimeout(startBot, 3000);
});

startBot();
