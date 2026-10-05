const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, 'book.json');

// book.json ফাইল থেকে ডাটা লোড করার ফাংশন
function loadBooks() {
    try {
        if (fs.existsSync(jsonPath)) {
            const data = fs.readFileSync(jsonPath, 'utf-8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error("book.json পড়তে সমস্যা:", e.message);
    }
    return [];
}

// সবচেয়ে ভালো ম্যাচিং বের করার লজিক
function findReply(text) {
    if (!text) return null;
    const books = loadBooks();
    const input = text.toLowerCase().trim();

    // /aibook বা /book কমান্ড দিয়ে সার্চ করলে প্রেফিক্স সরাবে
    const query = input.replace(/^\/(aibook|book)\s*/i, '').trim();
    if (!query) return null;

    for (let book of books) {
        if (book.keywords && Array.isArray(book.keywords)) {
            const isMatch = book.keywords.some(keyword => query.includes(keyword.toLowerCase()));
            if (isMatch) {
                return `📖 [${book.title}]\n\n💡 ${book.content}`;
            }
        }
    }
    return null;
}

module.exports = {
    // 🌟 আপনার index.js ফাইলটি এই onMessage ফাংশনটিকেই রান করায়!
    onMessage: function(api, event, body) {
        if (!body) return;

        // /updatecode বা অন্য ফাইল আপডেটের কমান্ড চলাকালীন স্কিপ করবে
        if (body.startsWith('/updatecode') || body.startsWith('/addfile') || body.startsWith('/deletefile')) {
            return;
        }

        const replyMessage = findReply(body);

        if (replyMessage) {
            api.sendMessage(replyMessage, event.threadID, event.messageID);
        } else if (body.startsWith('/aibook') || body.startsWith('/book')) {
            api.sendMessage("🤖 আপনার কাঙ্ক্ষিত বিষয়টি 'book.json' ফাইলে খুঁজে পাওয়া যায়নি।", event.threadID, event.messageID);
        }
    }
};