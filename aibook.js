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
                console.log("✅ book.json থেকে ডাটা সফলভাবে লোড হয়েছে!");
            } else {
                console.log("⚠️ book.json ফাইলটি পাওয়া যায়নি! একটি নতুন খালি ফাইল তৈরি করুন।");
            }
        } catch (error) {
            console.error("❌ book.json রিড করতে সমস্যা হয়েছে:", error.message);
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
                // কিওয়ার্ড ম্যাচ করলে বেশি পয়েন্ট (স্কোর)
                if (book.keywords && book.keywords.some(k => k.toLowerCase().includes(word))) {
                    score += 5;
                }
                // টাইটেলে ম্যাচ করলে পয়েন্ট
                if (book.title && book.title.toLowerCase().includes(word)) {
                    score += 3;
                }
                // মূল লেখার ভেতরে ম্যাচ করলে পয়েন্ট
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
        if (!userQuery || userQuery.trim() === "") {
            return "বইয়ের তথ্য জানতে কোনো বিষয় লিখে অনুসন্ধান করুন! (যেমন: পাইথন কি?)";
        }

        // ফাইল আবার রিড করে নেওয়া (যাতে নতুন তথ্য যোগ করলে বট সাথে সাথে পায়)
        this.loadBookData();

        const result = this.findBestMatch(userQuery);

        if (result.bestMatch && result.score > 0) {
            const book = result.bestMatch;
            return `📖 **[বিষয়/বই: ${book.title}]**\n\n💡 **উত্তর:** ${book.content}`;
        }

        return "🤖 আমার `book.json` ফাইলে এই বিষয়ে কোনো তথ্য খুঁজে পাওয়া যায়নি। নতুন তথ্য যোগ করলে আমি তা শিখে নিতে পারব!";
    }
}

// ইনস্ট্যান্স তৈরি
const aiBook = new AiBookEngine();

// বট হ্যান্ডলারের জন্য এক্সপোর্ট
module.exports = {
    name: "aibook",
    description: "book.json থেকে তথ্য খুঁজে AI লজিকে উত্তর দেবে",
    execute(event, api, args) {
        const userQuery = args.join(" ");
        
        // AI লজিক দিয়ে উত্তর জেনারেট করা
        const replyMessage = aiBook.generateReply(userQuery);

        // বটের মেসেজ রিপ্লাই
        api.sendMessage(replyMessage, event.threadID, event.messageID);
    }
};
