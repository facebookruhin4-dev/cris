function sendWelcomeMessage(api, event) {
  if (event.logMessageType === 'log:subscribe') {
    const addedParticipants = event.logMessageData.addedParticipants;
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

