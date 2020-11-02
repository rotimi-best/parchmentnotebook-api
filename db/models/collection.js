const mongoose = require('mongoose')
const Schema = mongoose.Schema
const timestamp = require('mongoose-timestamp')

const CollectionSchema = new Schema({
  title: String,
  color: String,
  public: {
    type: Boolean,
    default: false
  },
  edittableByUser: {
    type: Boolean,
    default: true
  },
  status: {
    type: Number,
    default: 0
  },
  people: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
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

CollectionSchema.plugin(timestamp);
module.exports = mongoose.model('Collection', CollectionSchema);
