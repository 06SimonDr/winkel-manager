// We grab Schema and model from mongoose library.
const { Schema, model } = require("mongoose");

// We declare new schema.
const winkelEmbedSchema = new Schema({
  serverId: { type: String },
  channelId: { type: String },
  messageId: { type: String },
  image: { type: String },
  title: { type: String },
  footer: { type: String },
  description: { type: String },
});

// We export it as a mongoose model.
module.exports = model("winkel-embed-schema", winkelEmbedSchema);