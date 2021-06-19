const { Schema, model } = require("mongoose");

const timeSchema = new Schema({
  serverId: { type: String },
  userId: { type: String },
  name: { type: String },
  startDate: { type: String },
  endDate: { type: String },
  duration: { type: String },
  day: { type: String }
});

module.exports = model("time-schema", timeSchema);