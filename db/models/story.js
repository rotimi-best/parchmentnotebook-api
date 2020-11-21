const mongoose = require('mongoose')
const Schema = mongoose.Schema
const timestamp = require('mongoose-timestamp')

const StorySchema = new Schema({
  url: String,
  views: Number,
  loves: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
});

StorySchema.plugin(timestamp);
module.exports = mongoose.model('Story', StorySchema);
