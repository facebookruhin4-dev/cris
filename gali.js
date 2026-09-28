const config = require('./config.json');

// মেসেজে গালাগালি বা খারাপ শব্দ আছে কিনা তা চেক করার ফাংশন
function isGali(text) {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return config.badWords.some(word => lowerText.includes(word));
}

module.exports = { isGali };

