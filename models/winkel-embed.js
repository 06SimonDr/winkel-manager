// We grab Schema and model from mongoose library.
const { Schema, model } = require("mongoose");

// We declare new schema.
const winkelEmbedSchema = new Schema({
  serverId: { type: String },
  channelId: { type: String },
  messageId: { type: String },
  image: { type: String, default: null },
  title: { type: String, default: null },
  footer: { type: String, default: null },
  description: { type: String, default: null },
  color: { type: String, default: null },
});

// We export it as a mongoose model.
module.exports = model("winkel-embed-schema", winkelEmbedSchema);