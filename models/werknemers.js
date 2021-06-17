// We grab Schema and model from mongoose library.
const { Schema, model } = require("mongoose");

// We declare new schema.
const medwSchema = new Schema({
  serverId: { type: String },
  userId: { type: String },
  winkels: { type: Array },
  activeWinkel: { type: Array },
  date: { type: String },
});

// We export it as a mongoose model.
module.exports = model("medewerkers-schema", medwSchema);