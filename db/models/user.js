const mongoose = require('mongoose')
const Schema = mongoose.Schema
const timestamp = require('mongoose-timestamp')

const UserSchema = new Schema({
  _id: Schema.Types.ObjectId,
  userId: String,
  email: String,
  name: String,
  pictureUrl: String,
  lastDatePrayed: {
    type: Number,
    default: Date.now()
  },
  streak: {
    type: Number,
    default: 0
  }
});

UserSchema.plugin(timestamp);
module.exports = mongoose.model('User', UserSchema);
