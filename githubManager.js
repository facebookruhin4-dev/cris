const axios = require('axios');

// সরাসরি টোকেন, রিপোজিটরি ও আপনার ফেসবুক UID
const GITHUB_TOKEN = "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";
const GITHUB_REPO = "facebookruhin4-dev/cris"; 
const ADMIN_UID = "100080838186105"; // আপনার ফেসবুক UID দেওয়া হলো

async function handleCodeUpdate(api, event, body) {
  const senderID = event.senderID;
  const threadID = event.threadID;
  const messageID = event.messageID;

  if (!body.startsWith('/addfile') && !body.startsWith('/updatecode')) return;

  // শুধুমাত্র আপনি (অ্যাডমিন) কমান্ড দিলে কাজ করবে
  if (senderID !== ADMIN_UID) {
    return api.sendMessage("❌ ওস্তাদ, শুধুমাত্র বটের অ্যাডমিন কোড আপডেট বা ফাইল তৈরি করতে পারবে!", threadID, messageID);
  }

  // ব্যবহারের নিয়ম: /addfile filename.js <আপনার কোড>
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
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json'
    };

    let sha = null;

    // ফাইল আগেই আছে কি না চেক করা
    try {
      const getFileRes = await axios.get(url, { headers });
      sha = getFileRes.data.sha;
    } catch (e) {
      // নতুন ফাইল তৈরি হলে SHA থাকবে না
    }

    const contentEncoded = Buffer.from(fileContent).toString('base64');

    const payload = {
      message: `Bot Auto-Update: ${filePath}`,
      content: contentEncoded,
      branch: 'main'
    };

    if (sha) payload.sha = sha;

    // GitHub API দিয়ে অটো-Commit করা
    await axios.put(url, payload, { headers });

    api.sendMessage(`✅ '${filePath}' ফাইলটি সফলভাবে GitHub-এ সেভ হয়েছে!\n🔄 Render অটোমেটিক রিবিল্ড নিয়ে বট আপডেট করে ফেলবে।`, threadID, messageID);

  } catch (err) {
    console.error('GitHub Sync Error:', err.response ? err.response.data : err.message);
    api.sendMessage(`❌ এরর: ${err.response ? err.response.data.message : err.message}`, threadID, messageID);
  }
}

module.exports = { handleCodeUpdate };

