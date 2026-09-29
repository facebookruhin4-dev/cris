const axios = require('axios');

// আপনার নতুন GitHub Personal Access Token
const GITHUB_TOKEN = "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";
const GITHUB_REPO = "facebookruhin4-dev/cris"; 
const ADMIN_UID = "61591594474456"; // আপনার ফেসবুক UID

async function handleCodeUpdate(api, event, body) {
  const senderID = event.senderID;
  const threadID = event.threadID;
  const messageID = event.messageID;

  if (!body.startsWith('/addfile') && !body.startsWith('/updatecode')) return;

  // শুধুমাত্র অ্যাডমিন (আপনি) এই কমান্ড ব্যবহার করতে পারবেন
  if (senderID !== ADMIN_UID) {
    return api.sendMessage("❌ ওস্তাদ, শুধুমাত্র বটের অ্যাডমিন কোড আপডেট বা ফাইল তৈরি করতে পারবে!", threadID, messageID);
  }

  // ফরম্যাট চেক: /addfile filename.js <কোড>
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

    // ফাইলটি আগে থেকে গিটহাবে আছে কি না চেক করা
    try {
      const getFileRes = await axios.get(url, { headers });
      sha = getFileRes.data.sha;
    } catch (e) {
      // নতুন ফাইল তৈরি হলে SHA লাগবে না
    }

    const contentEncoded = Buffer.from(fileContent, 'utf-8').toString('base64');

    const payload = {
      message: `Bot Auto-Update: ${filePath}`,
      content: contentEncoded,
      branch: 'main'
    };

    if (sha) payload.sha = sha;

    // GitHub API দিয়ে সরাসরি সেভ করা
    await axios.put(url, payload, { headers });

    api.sendMessage(`✅ '${filePath}' ফাইলটি সফলভাবে GitHub-এ সেভ হয়েছে!\n🔄 Render এখন অটোমেটিক রিবিল্ড নিয়ে বট রিস্টার্ট করবে।`, threadID, messageID);

  } catch (err) {
    console.error('GitHub Sync Error:', err.response ? err.response.data : err.message);
    const errorMsg = err.response && err.response.data && err.response.data.message 
      ? err.response.data.message 
      : err.message;
      
    api.sendMessage(`❌ এরর: ${errorMsg}`, threadID, messageID);
  }
}

module.exports = { handleCodeUpdate };
