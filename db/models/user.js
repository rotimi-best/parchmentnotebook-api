const mongoose = require('mongoose')
const Schema = mongoose.Schema
const timestamp = require('mongoose-timestamp')

const UserSchema = new Schema({
  userId: String,
  googleAuthUser: Object,
  lastDatePrayed: {
    type: Number,
    default: Date.now()
  },
  streak: {
    type: Number,
    default: 0
  },
  subscriptions: []
});

UserSchema.plugin(timestamp);
module.exports = mongoose.model('User', UserSchema);
