require('dotenv').config();
require('../helpers/additionalInit');
const connectToDb = require('../db/connect');
const { addQuote, deleteQuote } = require('../db/cruds/Quote');
const quotes = require('../helpers/static/quotes');

// MONGODB CONNECTION
connectToDb();

(async() => {
  const formatted = quotes.map(quote => {
    return {
      title: quote,
      timesSent: 0,
      loves: [],
      latest: false,
      comments: []
    }
  });
  await deleteQuote({ _id: {$exists: true}})
  // console.log('formatted', formatted)
  await addQuote(formatted);
  process.exit(1);
})()