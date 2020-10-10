require('dotenv').config();
require('../helpers/additionalInit');
const connectToDb = require('../db/connect');
const { updatePrayer, getPrayer } = require('../db/cruds/Prayer');

// MONGODB CONNECTION
connectToDb();

(async() => {

  await updatePrayer({ _id: { $exists: true }}, {
    comments: [],
    intercessors: [],
  });

  const prayer = await getPrayer({}, {
    limit: 1
  });

  process.exit(1);
})()