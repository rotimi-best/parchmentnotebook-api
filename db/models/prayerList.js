const mongoose = require('mongoose')
const Schema = mongoose.Schema
const timestamp = require('mongoose-timestamp')

const PrayerListSchema = new Schema({
  _id: Schema.Types.ObjectId,
  title: String,
  public: {
    type: Boolean,
    default: true
  },
  edittableByUser: {
    type: Boolean,
    default: true
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  owner: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  prayers: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Prayer'
    }
  ],
});

PrayerListSchema.plugin(timestamp);
module.exports = mongoose.model('PrayerList', PrayerListSchema);
