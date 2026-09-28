const config = require('./config.json');

// ইউজারদের ওয়ার্নিং সংখ্যা মনে রাখার অবজেক্ট
const userWarnings = {};

function handleWarningAndKick(api, event) {
  const senderID = event.senderID;
  const threadID = event.threadID;
  const messageID = event.messageID;

  // ওয়ার্নিং ১ বাড়ানো
  userWarnings[senderID] = (userWarnings[senderID] || 0) + 1;
  const currentWarning = userWarnings[senderID];

  // ৩ নম্বর বা নির্ধারিত ওয়ার্নিং হলে কিক মারবে
  if (currentWarning >= config.maxWarnings) {
    api.sendMessage(
      `⛔ আপনাকে বারবার সতর্ক করা সত্ত্বেও অশালীন ভাষা ব্যবহার করায় গ্রুপ থেকে কিক দেওয়া হলো!`,
      threadID,
      (err) => {
        if (err) console.error('❌ কিক মেসেজ সেন্ড এরর:', err);
        api.removeUserFromGroup(senderID, threadID, (kickErr) => {
          if (kickErr) {
            console.error('❌ কিক দিতে সমস্যা হয়েছে:', kickErr);
            api.sendMessage('⚠️ বটকে গ্রুপের Admin বানিয়ে দিন, তা না হলে কিক দেওয়া সম্ভব নয়!', threadID);
          } else {
            console.log(`✅ ${senderID} কে কিক দেওয়া হয়েছে।`);
            delete userWarnings[senderID]; // ওয়ার্নিং রিসেট
          }
        });
      },
      messageID
    );
  } else {
    // ১ ও ২ নম্বর ওয়ার্নিং এ সেফ টেক্সট মেসেজ পাঠাবে
    const warningText = `⚠️ সতর্কবার্তা!\nগ্রুপে গালাগালি করা সম্পূর্ণ নিষেধ।\n\nআপনার মোট ওয়ার্নিং: ${currentWarning}/${config.maxWarnings}\n(${config.maxWarnings} বার হলে আপনাকে গ্রুপ থেকে কিক দেওয়া হবে!)`;

    api.sendMessage(warningText, threadID, (err) => {
      if (err) console.error('❌ ওয়ার্নিং মেসেজ পাঠাতে সমস্যা:', err);
    }, messageID);

    // সেফ রিঅ্যাকশন হ্যান্ডলার
    if (typeof api.setMessageReaction === 'function') {
      try {
        api.setMessageReaction("😡", messageID, (err) => {}, true);
      } catch (e) {
        console.error('Reaction error:', e);
      }
    }
  }
}

module.exports = { handleWarningAndKick };
