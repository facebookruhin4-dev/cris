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
      console.error('❌ appstate.json বা APPSTATE পরিবেশক ভেরিয়েবল পাওয়া যায়নি!');
      return;
    }
  }

  // FCA Options
  const options = {
    listenEvents: true,
    selfListen: false, // বট নিজের মেসেজে নিজে উত্তর দেবে না
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

      // কনসোলে ইভেন্ট টাইপ প্রিন্ট
      console.log(`📥 Event Received: Type = [${event.type}]`);

      // শুধু মেসেজ ইভেন্ট হলে প্রসেস করবে
      if (event.type === 'message' || event.type === 'message_reply') {
        const body = event.body ? event.body.trim() : '';
        const senderID = event.senderID;
        const threadID = event.threadID;
        const isGroup = event.isGroup;

        console.log(`💬 Message From [${senderID}] in ${isGroup ? 'Group' : 'Inbox'} [${threadID}]: "${body}"`);

        if (!body) return;

        const command = body.toLowerCase();

        // -------------------------------------------------------------
        // প্রেফিস ছাড়া কমান্ড হুক (Prefix-less Commands)
        // -------------------------------------------------------------

        if (command === 'hi' || command === 'hello' || command === 'হাই' || command === 'হ্যালো') {
          api.sendMessage('হ্যালো ওস্তাদ! আমি অন আছি, কীভাবে সাহায্য করতে পারি?', threadID, (sendErr) => {
            if (sendErr) console.error('❌ রিপ্লাই পাঠাতে ব্যর্থ:', sendErr);
            else console.log('✅ সফলভাবে রিপ্লাই পাঠানো হয়েছে!');
          });
        } 
        else if (command === 'ping' || command === 'পিং') {
          api.sendMessage('Pong! 🏓 বট সচল আছে।', threadID, (sendErr) => {
            if (sendErr) console.error('❌ রিপ্লাই পাঠাতে ব্যর্থ:', sendErr);
            else console.log('✅ সফলভাবে রিপ্লাই পাঠানো হয়েছে!');
          });
        }
        else if (command === 'bot' || command === 'বট') {
          api.sendMessage('জি ওস্তাদ, বলুন!', threadID, (sendErr) => {
            if (sendErr) console.error('❌ রিপ্লাই পাঠাতে ব্যর্থ:', sendErr);
            else console.log('✅ সফলভাবে রিপ্লাই পাঠানো হয়েছে!');
          });
        }

      }
    });
  });
}

startBot();
