const axios = require('axios');

// Render Environment Variable থেকে টোকেন নেওয়া হবে
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; 
const GITHUB_REPO = "facebookruhin4-dev/cris"; 
const ADMIN_UID = "61591594474456"; // আপনার ফেসবুক UID

async function handleCodeUpdate(api, event, body) {
  const senderID = event.senderID;
  const threadID = event.threadID;
  const messageID = event.messageID;

  if (!body.startsWith('/addfile') && !body.startsWith('/updatecode')) return;

  // শুধুমাত্র অ্যাডমিন কমান্ড চালাতে পারবে
  if (senderID !== ADMIN_UID) {
    return api.sendMessage("❌ ওস্তাদ, শুধুমাত্র বটের অ্যাডমিন কোড আপডেট করতে পারবে!", threadID, messageID);
  }

  if (!GITHUB_TOKEN) {
    return api.sendMessage("❌ Render-এ GITHUB_TOKEN সেট করা নেই!", threadID, messageID);
  }

  const input = body.replace(/^\/(addfile|updatecode)\s*/i, '').trim();
  const spaceIndex = input.indexOf(' ');

  if (spaceIndex === -1) {
    return api.sendMessage("⚠️ সঠিক ফরম্যাট লিখুন:\n/addfile test.js console.log('hello');", threadID, messageID);
  }

  const filePath = input.substring(0, spaceIndex).trim();
  const fileContent = input.substring(spaceIndex + 1).trim();

  api.sendMessage(`🚀 GitHub-এ '${filePath}' আপডেট করা হচ্ছে... অপেক্ষা করুন!`, threadID, messageID);

  try {
    const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`;
    
    const headers = {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'FB-Bot-App'
    };

    let sha = null;

    try {
      const getFileRes = await axios.get(url, { headers });
      sha = getFileRes.data.sha;
    } catch (e) {
      // নতুন ফাইল হলে SHA থাকবে না
    }

    const contentEncoded = Buffer.from(fileContent, 'utf-8').toString('base64');

    const payload = {
      message: `Bot Auto-Update: ${filePath}`,
      content: contentEncoded,
      branch: 'main'
    };

    if (sha) payload.sha = sha;

    await axios.put(url, payload, { headers });

    api.sendMessage(`✅ '${filePath}' ফাইলটি সফলভাবে GitHub-এ সেভ হয়েছে!\n🔄 Render এখন অটোমেটিক রিবিল্ড নিয়ে বট আপডেট করে ফেলবে।`, threadID, messageID);

  } catch (err) {
    console.error('GitHub Sync Error:', err.response ? err.response.data : err.message);
    const errorMsg = err.response && err.response.data && err.response.data.message 
      ? err.response.data.message 
      : err.message;
      
    api.sendMessage(`❌ এরর: ${errorMsg}`, threadID, messageID);
  }
}

module.exports = { handleCodeUpdate };
