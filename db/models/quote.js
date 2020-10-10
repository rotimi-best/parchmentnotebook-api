const mongoose = require('mongoose')
const Schema = mongoose.Schema
const timestamp = require('mongoose-timestamp')

const QuoteSchema = new Schema({
  title: String,
  timesSent: Number,
  loves: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  latest: Boolean,
  comments: [
    {
      comment: String,
      author: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  ]
});

QuoteSchema.plugin(timestamp);
module.exports = mongoose.model('Quote', QuoteSchema);
