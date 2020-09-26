require('dotenv').config();
require('./helpers/additionalInit');
const { PORT = 9000 } = process.env;

const express = require('express');
const cors = require('cors');
const path = require('path');
const webPush = require('web-push');
const bodyParser = require('body-parser');

const connectToDb = require('./db/connect')
const Collection = require('./routes/Collection');
const Prayer = require('./routes/Prayer');
const Feed = require('./routes/Feed');
const User = require('./routes/User');

let subscription
const publicVapidKey = process.env.PUBLIC_VAPID_KEY;
const privateVapidKey =  process.env.PRIVATE_VAPID_KEY;

webPush.setVapidDetails('mailto:rotimiibitoyeemma@gmail.com', publicVapidKey, privateVapidKey);

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

app.post('/subscription', (req, res) => {
  const subscription = req.body;

  // Send 201 - resource created
  res.status(201).json({});

  // Create payload
  const payload = JSON.stringify({ title: "Push Test" });

  // Pass object into sendNotification
  webPush
    .sendNotification(subscription, payload)
    .then(res => console.log('res', res))
    .catch(err => console.error(err));
});

app.post('/push', (req, res) => {
  const payload = JSON.stringify({
    title: 'Dont forget to pray today :)'
  });

  webPush.sendNotification(subscription, 'Dont forget to pray today :)')
    .then(result => console.log('result', result))
    .catch(err => console.error('Error subscribing', err))

  res.status(200).json({});
})

app.use('/user', User);

app.use('/prayer', Prayer);

app.use('/feed', Feed);

app.use('/collection', Collection);

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
