/**
 * 📖 AI BOOK ENGINE
 * File: commands/aibook.js
 * Read Data from: book.json
 */

const fs = require('fs');
const path = require('path');

class AiBookEngine {
    constructor() {
        this.jsonFilePath = path.join(__dirname, '../book.json');
        this.books = [];
        this.loadBookData();
    }

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

    findBestMatch(userMessage) {
        if (!userMessage) return null;

        const words = userMessage.toLowerCase().trim().split(/\s+/);
        let bestMatch = null;
        let highestScore = 0;

        for (let book of this.books) {
            let score = 0;

            for (let word of words) {
                if (book.keywords && book.keywords.some(k => k.toLowerCase().includes(word))) {
                    score += 5;
                }
                if (book.title && book.title.toLowerCase().includes(word)) {
                    score += 3;
                }
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

    generateReply(userQuery) {
        this.loadBookData();

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

    onStart: async function ({ api, event, args }) {
        const userQuery = args.join(" ");
        const replyMessage = aiBook.generateReply(userQuery);
        
        if (replyMessage) {
            return api.sendMessage(replyMessage, event.threadID, event.messageID);
        } else {
            return api.sendMessage("🤖 আমার `book.json` ফাইলে এই বিষয়ে কোনো তথ্য খুঁজে পাওয়া যায়নি।", event.threadID, event.messageID);
        }
    },

    onChat: async function ({ api, event }) {
        if (!event.body) return;
        
        const replyMessage = aiBook.generateReply(event.body);
        if (replyMessage) {
            return api.sendMessage(replyMessage, event.threadID, event.messageID);
        }
    },

    execute(event, api, args) {
        const userQuery = args && args.length > 0 ? args.join(" ") : event.body;
        const replyMessage = aiBook.generateReply(userQuery);
        if (replyMessage) {
            api.sendMessage(replyMessage, event.threadID, event.messageID);
        }
    }
};