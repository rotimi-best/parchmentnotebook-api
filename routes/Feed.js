const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();
const { getUser, updateUser } = require('../db/cruds/User');
const { getPrayer } = require('../db/cruds/Prayer');
const { date, len, reduceDay } = require('../modules');

// @route GET feed/userId
// @route Get home feed data
// @access Private
router.get('/:userId', async (req, res) => {
  const { userId = '' } = req.params;

  const [user] = await getUser({ userId });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const { _id, lastDatePrayed } = user;
  const yesterday = new Date(`${reduceDay(1)} 00:00:00`).getTime(); // new Date("2020-05-01").getTime()
  const today = new Date(`${date()} 00:00:00`).getTime(); // new Date("2020-06-01").getTime()

  if (lastDatePrayed !== yesterday && lastDatePrayed !== today) {
    user.streak = 0
    await updateUser({ _id },  {
      streak: user.streak
    });
  }

  const prayersToday = await getPrayer({
    owner: _id,
    $and: [
      {
        start: {
          $lte: today
        }
      },
      {
        end: {
          $gte: today
        }
      },
      {
        lastDatePrayed: { $ne: today }
      }
    ]
  });

  // const prayersTodayWithCollection =  [];

  // for (const prayer of prayersToday) {
  //   prayer._doc.collection = await getCollection({ prayers: prayer._id });

  //   prayersTodayWithCollection.push(prayer)
  // }

  const prayersPrayedToday = await getPrayer({
    owner: _id,
    lastDatePrayed: today
  });

  return res.json({
    success: true,
    // user,
    streak: user.streak,
    prayersToday,
    prayersPrayedToday: len(prayersPrayedToday)
  });
});

module.exports = router;
