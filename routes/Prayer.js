const express = require('express');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const router = express.Router();
const { getUser, updateUser } = require('../db/cruds/User');
const { getPrayer, updatePrayer, addPrayer } = require('../db/cruds/Prayer');
const { updatePrayerList } = require('../db/cruds/PrayerList');
const { date, len, reduceDay } = require('../modules');

const today = new Date(date()).getTime(); // new Date("2020-06-01").getTime()

// @route GET /prayer
// @route Get All Prayer Request
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

  const prayers = await getPrayer({
    owner: user._id,
  }, null, null, ['prayerList']);

  res.json({ success: true, prayers });
});

// @route POST /prayer
// @route Add a prayer
// @access Private
router.post('/', async (req, res) => {
  const {
    description = '',
    answered = false,
    start = today,
    end = today,
    userId,
    prayerList
  } = req.body;

  const _userId = ObjectId(userId);
  let [user] = await getUser({ _id: _userId });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const prayer = await addPrayer({
    description,
    answered,
    start,
    end,
    lastDatePrayed: today,
    creator: _userId,
    owner: _userId,
    prayerList
  });

  if (prayerList && Array.isArray(prayerList) && len(prayerList)) {
    prayerList.forEach(async list => {
      await updatePrayerList({ _id: ObjectId(list._id) }, {
        $push: { prayers: prayer._id }
      })
    })
  }

  res.json({
    success: true,
    prayer
  });
});

// @route PUT prayer/prayerId
// @route Update a prayer
// @access Private
router.put('/:prayerId', async (req, res) => {
  const { prayerId } = req.params;
  const fieldsToUpdate = req.body;
  const { lastDatePrayed = null } = fieldsToUpdate;

  const [prayer] = await getPrayer({ _id: ObjectId(prayerId) }, null, null, ['owner']);

  if (!prayer) {
    return res.status(404).json({
      success: false,
      message: 'Prayer not found'
    });
  }

  // TODO: Add to JS interview questions. The diff between 1 and 2
  const { owner: user, _id: prayerId } = prayer; //1. const { id: userId } = user

  let prayerList = fieldsToUpdate.prayerList;
  if (len(prayerList)) {
    prayerList = prayerList.map(list => ObjectId(list._id));
  }

  await updatePrayer({ _id: prayerId }, fieldsToUpdate); //2. updateUser({ id: userId })

  // Note: if lastDatePrayed === todaysDate ? "User prayed today" : "Didn't pray today";
  if (lastDatePrayed && lastDatePrayed === today) {
    const yesterday = new Date(reduceDay(1)).getTime(); // new Date("2020-05-01").getTime()

    if (user.lastDatePrayed === yesterday && user.lastDatePrayed !== today) {
      await updateUser({ _id: user._id },  {
        lastDatePrayed: today,
        $inc: {
          streak: 1
        }
      });
    } else if (user.lastDatePrayed !== yesterday && user.lastDatePrayed !== today) {
      await updateUser({ _id: user._id },  {
        streak: 0
      });
    }
  }

  const [updatedPrayer] = await getPrayer({
    _id: prayerId},
    null,
    null,
    ['creator', 'owner', 'prayerList']
  );

  res.json({
    success: true,
    prayer: updatedPrayer
  });
});

module.exports = router;
