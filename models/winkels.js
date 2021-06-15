// We grab Schema and model from mongoose library.
const { Schema, model } = require("mongoose");

// We declare new schema.
const winkelSchema = new Schema({
  serverId: { type: String },
  name: { type: String },
  description: { type: String },
  stad: { type: String },
  location: { type: String },
});

// We export it as a mongoose model.
module.exports = model("winkels-schema", winkelSchema);