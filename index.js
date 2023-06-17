require('dotenv').config();
require('./helpers/additionalInit');
const { PORT = 9000 } = process.env;

const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');

const connectToDb = require('./db/connect')
const Collection = require('./routes/Collection');
const Prayer = require('./routes/Prayer');
const Feed = require('./routes/Feed');
const User = require('./routes/User');
//const NotificationAPI = require('./helpers/pushNotificiation');
const { updateUser } = require('./db/cruds/User');

// MONGODB CONNECTION
connectToDb()

const app = express();

// Set static path
app.use(express.static(path.join(__dirname, 'client')));

app.use(cors());
app.options('*', cors());

// Bodyparser Middleware
app.use(bodyParser.json());

app.get('/', (req, res) => {
  const date = new Date();

  res.send(`<h1>&copy; ${date.getFullYear()} :) </h1>`);
});

app.post('/subscription', async (req, res) => {
  const { subscription: stringedSubs, userId, sendPushImmediately } = req.body;
  const subscription = JSON.parse(stringedSubs);

  await updateUser({ userId }, {
    $push: { subscriptions: subscription }
  });

  // Send 201 - resource created
  res.status(201).json({});

  // if (sendPushImmediately) {
  //   NotificationAPI.sendPush(subscription, {
  //     title: 'Welcome to PrayerKeep',
  //     body: 'Start by adding a new prayer request',
  //   });
  // }
});

app.use('/user', User);

app.use('/prayer', Prayer);

app.use('/feed', Feed);

app.use('/collection', Collection);

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
