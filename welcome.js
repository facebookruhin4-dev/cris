function sendWelcomeMessage(api, event) {
  // সাবস্ক্রাইব বা মেম্বার যোগ হওয়ার লজিক
  const logType = event.logMessageType;
  if (logType === 'log:subscribe' || event.type === 'event') {
    const addedParticipants = event.logMessageData ? event.logMessageData.addedParticipants : [];
    if (!addedParticipants || addedParticipants.length === 0) return;

    const botID = api.getCurrentUserID();

    for (let participant of addedParticipants) {
      const userID = participant.userFbId;
      const userName = participant.fullName || "নতুন মেম্বার";

      // বট নিজে জয়েন হলে
      if (userID === botID) {
        api.sendMessage('🤖 আমাকে গ্রুপে যুক্ত করার জন্য ধন্যবাদ! আমি গ্রুপের সিকিউরিটি বজায় রাখব।', event.threadID);
      } else {
        // নতুন মেম্বার জয়েন করলে
        const welcomeText = `🎉 স্বাগতম @${userName} আমাদের গ্রুপে!\n\nনিয়ম মেনে চ্যাট করুন। ৩ বার গালাগালি করলে স্বয়ংক্রিয়ভাবে কিক দেওয়া হবে।`;
        
        api.sendMessage(
          {
            body: welcomeText,
            mentions: [{ tag: `@${userName}`, id: userID }]
          },
          event.threadID
        );
      }
    }
  }
}

module.exports = { sendWelcomeMessage };
