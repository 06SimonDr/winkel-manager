// We grab Schema and model from mongoose library.
const { Schema, model } = require("mongoose");

// We declare new schema.
const tokenSchema = new Schema({
  serverId: { type: String },
  token: { type: String }
});

// We export it as a mongoose model.
module.exports = model("bot-tokens", tokenSchema);