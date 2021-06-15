// We grab Schema and model from mongoose library.
const { Schema, model } = require("mongoose");

// We declare new schema.
const checkSchema = new Schema({
  serverId: { type: String },
  userId: { type: String },
  ip: { type: String }
});

// We export it as a mongoose model.
module.exports = model("ip-check", checkSchema);