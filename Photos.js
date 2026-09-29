
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

async function sendPhoto(api, event, body) {
  const lowerBody = body.trim();

  // কমান্ড চেক করা (যেমন: /photo cat, /pic nature, /ফটো car)
  if (lowerBody.startsWith('/photo') || lowerBody.startsWith('/pic') || lowerBody.startsWith('/ফটো')) {
    const threadID = event.threadID;
    const messageID = event.messageID;

    // প্রম্পট আলাদা করা
    const prompt = body.replace(/^\/(photo|pic|ফটো)\s*/i, '').trim();

    if (!prompt) {
      return api.sendMessage("⚠️ ওস্তাদ, ক্যাপশন বা প্রম্পট দিন! \nযেমন: /photo a cute cat running in a park", threadID, messageID);
    }

    api.sendMessage(`🎨 AI দিয়ে আপনার ছবি তৈরি হচ্ছে: "${prompt}"...\nঅনুগ্রহ করে কিছু সময় অপেক্ষা করুন!`, threadID, messageID);

    // টেম্পোরারি ফাইল পাথ (unique timestamp সহ)
    const cacheDir = path.join(__dirname, 'cache');
    const cachePath = path.join(cacheDir, `${Date.now()}_ai_photo.jpg`);

    try {
      // ক্যাশ ফোল্ডার নিশ্চিত করা
      await fs.ensureDir(cacheDir);

      const cleanPrompt = encodeURIComponent(prompt);
      const imageUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 999999)}`;

      // সেইম ওয়ার্কিং বাফার লজিক (যা টেলিগ্রামে কাজ করেছে)
      const response = await axios({
        method: 'get',
        url: imageUrl,
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        timeout: 35000
      });

      // ফাইল হিসেবে সেভ করা
      await fs.writeFile(cachePath, Buffer.from(response.data));

      // ফেসবুক মেসেঞ্জারে ফটো সেন্ড
      const msg = {
        body: `✨ আপনার AI জেনারেটেড ফটো!\n📝 ক্যাপশন: ${prompt}`,
        attachment: fs.createReadStream(cachePath)
      };

      api.sendMessage(msg, threadID, () => {
        // সেন্ড হয়ে গেলে টেম্প ফাইলটি সাথে সাথে ডিলিট করে ক্লিন করা
        if (fs.existsSync(cachePath)) {
          fs.unlinkSync(cachePath);
        }
      }, messageID);

    } catch (error) {
      console.error('❌ AI Image Error Details:', error.message);
      
      if (fs.existsSync(cachePath)) {
        fs.unlinkSync(cachePath);
      }
      
      api.sendMessage("❌ ছবি জেনারেট করতে সমস্যা হয়েছে! আবার চেষ্টা করুন।", threadID, messageID);
    }
  }
}

module.exports = { sendPhoto };
