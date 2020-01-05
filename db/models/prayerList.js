const mongoose = require('mongoose')
const Schema = mongoose.Schema
const timestamp = require('mongoose-timestamp')

const PrayerListSchema = new Schema({
  title: String,
  creator: {
    id: Schema.Types.ObjectId,
    name: String,
  },
  owner: {
    id: Schema.Types.ObjectId,
    name: String,
  },
  prayers: [
    {
      id: Schema.Types.ObjectId,
      description: String,
    }
  ],
  public: Boolean,
});

PrayerListSchema.plugin(timestamp)
module.exports = mongoose.model('PrayerList', PrayerListSchema)
