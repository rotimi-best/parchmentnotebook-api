const mongoose = require('mongoose')
const Schema = mongoose.Schema
const timestamp = require('mongoose-timestamp')

const UserSchema = new Schema({
  facebookCred: Object,
  lastTimePrayed: String,
  streak: Number
});

UserSchema.plugin(timestamp)
module.exports = mongoose.model('User', UserSchema)
