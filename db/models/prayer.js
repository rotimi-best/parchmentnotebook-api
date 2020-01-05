const mongoose = require('mongoose')
const Schema = mongoose.Schema
const timestamp = require('mongoose-timestamp')

const PrayerSchema = new Schema({
  description: String,
  answered: Boolean,
  start: String,
  end: String,
  creator: {
    id: Schema.Types.ObjectId,
    name: String,
  },
  owner: {
    id: Schema.Types.ObjectId,
    name: String,
  },
});

PrayerSchema.plugin(timestamp)
module.exports = mongoose.model('Prayer', PrayerSchema)
