const axios = require('axios');

const GITHUB_REPO = process.env.GITHUB_REPO || 'facebookruhin4-dev/cris';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const PING_INTERVAL = 12 * 60 * 1000; // প্রতি ১২ মিনিটে সেলফ-কমিট মারবে

let intervalStarted = false;

async function triggerSelfCommit() {
    if (!GITHUB_TOKEN) return;

    try {
        const filePath = 'ping.json';
        const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`;
        
        let sha = '';
        try {
            const res = await axios.get(url, {
                headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
            });
            sha = res.data.sha;
        } catch (e) {
            // ফাইল না থাকলে নতুন তৈরি হবে
        }

        const updatedContent = JSON.stringify({
            last_ping: new Date().toISOString(),
            status: "active_and_alive"
        }, null, 2);

        const base64Content = Buffer.from(updatedContent).toString('base64');

        await axios.put(url, {
            message: "🔄 Keep-Alive Auto Commit to Prevent Render Sleep",
            content: base64Content,
            sha: sha || undefined
        }, {
            headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
        });

        console.log("🚀 [KeepAlive] Auto-commit executed successfully on GitHub!");
    } catch (err) {
        console.error("❌ [KeepAlive] Error:", err.message);
    }
}

function startKeepAliveLoop() {
    if (intervalStarted) return;
    intervalStarted = true;

    // বট চালু হওয়ার ২ মিনিটের মাথায় প্রথম ফায়ার করবে, এরপর প্রতি ১২ মিনিট পর পর
    setTimeout(() => {
        triggerSelfCommit();
        setInterval(triggerSelfCommit, PING_INTERVAL);
    }, 2 * 60 * 1000);
}

startKeepAliveLoop();

module.exports = {
    onMessage: function(api, event, body) {
        startKeepAliveLoop();

        if (body === '/pingstatus' || body === 'পিং স্ট্যাটাস') {
            api.sendMessage("🟢 Auto Keep-Alive System সচল রয়েছে! প্রতি ১২ মিনিটে গিটহাবে সেলফ-কমিট পুশ করা হচ্ছে।", event.threadID, event.messageID);
        }
    }
};