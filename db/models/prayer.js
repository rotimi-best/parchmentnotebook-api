const mongoose = require('mongoose')
const Schema = mongoose.Schema
const timestamp = require('mongoose-timestamp')

const PrayerSchema = new Schema({
  _id: Schema.Types.ObjectId,
  description: String,
  answered: {
    type: Boolean,
    default: false
  },
  start: {
    type: Number,
    default: Date.now()
  },
  end: {
    type: Number,
    default: Date.now()
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  lastDatePrayed: {
    type: Number,
    default: Date.now()
  },
});

PrayerSchema.plugin(timestamp);
module.exports = mongoose.model('Prayer', PrayerSchema);
