require('dotenv').config();
require('../helpers/additionalInit');
const connectToDb = require('../db/connect');
const { getQuote, updateQuote } = require('../db/cruds/Quote');
const { getUser, updateUser } = require('../db/cruds/User');
const NotificationAPI = require('../helpers/pushNotificiation');
const { clientUrl } = require('../config');

// MONGODB CONNECTION
connectToDb();

const sleep = () => new Promise(res => setTimeout(res, 1000));

const sendQuote = async () => {
  // Get next quote to send
  const [minimumQuote] = await getQuote({}, { sort: { timesSent: 1, updatedAt: 1 }});

  // Get all users with subscription
  const users = await getUser({
    subscriptions: { $gt: [] }
  });

  // iterate over them to send push
  for (const user of users) {
    let hadAPushError = false;
    const _subscriptions = [];
    // Send to each of their devices
    for (const subscription of user.subscriptions) {
      _subscriptions.push(subscription);

      // Error handler
      const notificationErrorCallback = () => {
        hadAPushError = true;
        _subscriptions.pop();
      }

      NotificationAPI.sendPush(subscription, {
        title: 'Prayer Quote.',
        body: minimumQuote.title,
        url:`${clientUrl}/?quoteId=${minimumQuote._id}`,
      }, notificationErrorCallback);

      await sleep();
    }

    // if error found remove such subscription
    if (hadAPushError) {
      await updateUser({ _id: user._id }, {
        subscriptions: _subscriptions
      });

      hadAPushError = false;
    }

    await sleep();
  }
  await updateQuote({ latest: true }, {
    latest: false
  });
  await updateQuote({ _id: minimumQuote._id }, {
    timesSent: minimumQuote.timesSent + 1,
    latest: true
  });
}

sendQuote().then(() => {
  process.exit();
});

/**
Cronjob

0 7 * * * cd /home/best/Projects/personal/parchmentnotebook-api && node scripts/sendQuotes.js

0 18 * * * cd /home/best/Projects/personal/parchmentnotebook-api && node scripts/sendQuotes.js

30 23 * * * cd /home/best/Projects/personal/parchmentnotebook-api && node scripts/sendQuotes.js

 */