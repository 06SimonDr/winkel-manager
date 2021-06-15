// We grab Schema and model from mongoose library.
const { Schema, model } = require("mongoose");

// We declare new schema.
const commandSchema = new Schema({
  serverId: { type: String },
  name: { type: String },
  description: { type: String },
  action: { type: String },
  value: { type: String },
  action1: { type: String },
  action2: { type: String },
  action3: { type: String },
  action4: { type: String },
  value1: { type: String },
  value2: { type: String },
  value3: { type: String },
  value4: { type: String },
});

// We export it as a mongoose model.
module.exports = model("custom-commands", commandSchema);