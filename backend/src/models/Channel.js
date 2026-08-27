const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
  channel_id: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true, index: true },
  logo: { type: String },
  country: { type: String, index: true },
  category: { type: String, index: true },
  stream_url: { type: String, required: true },
  score: { type: Number, required: true },
  online: { type: Boolean, required: true },
  languages: [{ type: String }],
  is_nsfw: { type: Boolean, default: false },
  lastChecked: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('Channel', channelSchema);
