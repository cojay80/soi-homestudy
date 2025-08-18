// models/UserData.js
// Server-side (Node) module. Do NOT put <script> HTML tags here.
//
// If you don't need a server-side model, you can delete this file
// and remove any `require('./models/UserData')` from server.js.

module.exports = {
  // Example structure (customize as needed)
  getDefault() {
    return { points: 0, rewards: {}, missStreak: 0 };
  },
};
