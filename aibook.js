/**
 * 📖 AI BOOK ENGINE
 * File: aibook.js
 * Read Data from: book.json
 */

const fs = require('fs');
const path = require('path');

class AiBookEngine {
    constructor() {
        this.jsonFilePath = path.join(__dirname, 'book.json');
        this.books = [];
        this.loadBookData();
    }

    // ১. book.json থেকে ডাটা লোড করা
    loadBookData() {
        try {
            if (fs.existsSync(this.jsonFilePath)) {
                const rawData = fs.readFileSync(this.jsonFilePath, 'utf-8');
                this.books = JSON.parse(rawData);
            } else {
                this.books = [];
            }
        } catch (error) {
            console.error("❌ book.json error:", error.message);
        }
    }

    // ২. সার্চ ও ইন্টেলিজেন্ট ম্যাচিং লজিক
    findBestMatch(userMessage) {
        if (!userMessage) return null;

        const words = userMessage.toLowerCase().trim().split(/\s+/);
        let bestMatch = null;
        let highestScore = 0;

        for (let book of this.books) {
            let score = 0;

            for (let word of words) {
                // কিওয়ার্ড ম্যাচ
                if (book.keywords && book.keywords.some(k => k.toLowerCase().includes(word))) {
                    score += 5;
                }
                // টাইটেল ম্যাচ
                if (book.title && book.title.toLowerCase().includes(word)) {
                    score += 3;
                }
                // কন্টেন্ট ম্যাচ
                if (book.content && book.content.toLowerCase().includes(word)) {
                    score += 1;
                }
            }

            if (score > highestScore) {
                highestScore = score;
                bestMatch = book;
            }
        }

        return { bestMatch, score: highestScore };
    }

    // ৩. কথা জুড়িয়ে উত্তর তৈরি করার ফাংশন
    generateReply(userQuery) {
        this.loadBookData(); // ডাটা তাজা রাখার জন্য রিলোড

        if (!userQuery || userQuery.trim() === "") {
            return "বইয়ের তথ্য জানতে কোনো বিষয় লিখে অনুসন্ধান করুন! (যেমন: পাইথন কি?)";
        }

        const result = this.findBestMatch(userQuery);

        if (result.bestMatch && result.score > 0) {
            const book = result.bestMatch;
            return `📖 **[বিষয়/বই: ${book.title}]**\n\n💡 **উত্তর:** ${book.content}`;
        }

        return null;
    }
}

const aiBook = new AiBookEngine();

// সর্বজনীন GoatBot / Mirai / Custom Bot সাপোর্ট স্ট্রাকচার
module.exports = {
    config: {
        name: "aibook",
        aliases: ["book", "বই"],
        version: "1.0.0",
        role: 0,
        author: "Ruhin",
        description: "book.json থেকে তথ্য খুঁজে AI লজিকে উত্তর দেবে",
        usePrefix: false
    },

    // প্রেফিক্স কমান্ড এক্সেকিউশন (যেমন: /aibook পাইথন)
    onStart: async function ({ api, event, args }) {
        const userQuery = args.join(" ");
        const replyMessage = aiBook.generateReply(userQuery);
        
        if (replyMessage) {
            return api.sendMessage(replyMessage, event.threadID, event.messageID);
        } else {
            return api.sendMessage("🤖 আমার `book.json` ফাইলে এই বিষয়ে কোনো তথ্য খুঁজে পাওয়া যায়নি।", event.threadID, event.messageID);
        }
    },

    // কমান্ড ছাড়া সাধারণ চ্যাট এক্সেকিউশন (যেমন শুধু "পাইথন" বললে)
    onChat: async function ({ api, event }) {
        if (!event.body) return;
        
        const replyMessage = aiBook.generateReply(event.body);
        
        // যদি ডাটাবেজে শক্তিশালী ম্যাচ পায় তবেই রিপ্লাই দেবে
        if (replyMessage) {
            return api.sendMessage(replyMessage, event.threadID, event.messageID);
        }
    },

    // নরমাল এক্সেকিউট সাপোর্ট
    execute(event, api, args) {
        const userQuery = args ? args.join(" ") : event.body;
        const replyMessage = aiBook.generateReply(userQuery);
        if (replyMessage) {
            api.sendMessage(replyMessage, event.threadID, event.messageID);
        }
    }
};
