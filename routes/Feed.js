const express = require('express');
const mongoose = require('mongoose');

const { ObjectId } = mongoose.Types;
const router = express.Router();
const { getUser, updateUser } = require('../db/cruds/User');
const { getPrayer } = require('../db/cruds/Prayer');
const { date, len, reduceDay } = require('../modules');

// @route GET feed
// @route Get home feed data
// @access Private
router.get('/', async (req, res) => {
  const { userId = '' } = req.body;

  const [user] = await getUser({ _id: ObjectId(userId) });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const { _id: userId, lastDatePrayed } = user;
  const yesterday = new Date(reduceDay(1)).getTime(); // new Date("2020-05-01").getTime()
  const today = new Date(date()).getTime(); // new Date("2020-06-01").getTime()

  if (lastDatePrayed !== yesterday && lastDatePrayed !== today) {
    user.streak = 0
    await updateUser({ _id: userId },  {
      streak: user.streak
    });
  }

  const todaysDate = new Date(date())
  const prayersForToday = await getPrayer({
    owner: userId,
    $and: [
      {
        start: {
          $lte: todaysDate
        }
      },
      {
        end: {
          $gte: todaysDate
        }
      }
    ]
  }, null, null, ['prayerList']);

  const prayersPrayedToday = await getPrayer({
    owner: userId,
    lastDatePrayed: todaysDate.getTime()
  });

  return res.json({
    success: true,
    streak: user.streak,
    prayersForToday,
    prayersPrayedToday: len(prayersPrayedToday)
  });
});

module.exports = router;
