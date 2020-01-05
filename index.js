require('dotenv').config();
const { PORT = 9000 } = process.env;

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const connectToDb = require('./db/connect')
const PrayerList = require('./routes/PrayerList');
const Prayer = require('./routes/Prayer');
const User = require('./routes/User');

// MONGODB CONNECTION
connectToDb()

const app = express();

app.use(cors());
app.options('*', cors());

// Bodyparser Middleware
app.use(bodyParser.json());

app.get('/', (req, res) => {
  const date = new Date();

  res.send(`<h1>&copy; ${date.getFullYear()} :) </h1>`);
});

app.use('/user', User);

app.use('/prayer', Prayer);

app.use('/prayerlist', PrayerList);

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});
