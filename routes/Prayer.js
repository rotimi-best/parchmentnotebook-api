const express = require('express');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const router = express.Router();
const { getUser, updateUser } = require('../db/cruds/User');
const { getPrayer, updatePrayer, addPrayer } = require('../db/cruds/Prayer');
const { getCollection } = require('../db/cruds/Collection');
const { date, reduceDay } = require('../modules');

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

  let prayers = await getPrayer({owner: user._id});
  prayers = prayers.map(async prayer => {
    prayer.collection = await getCollection({ prayers: prayer._id })

    return prayer;
  });

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
  });

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

  if (!ObjectId.isValid(prayerId)) {
    return res.status(404).json({
      success: false,
      message: 'Invalid prayer id'
    });
  }

  const _prayerId = ObjectId(prayerId);
  const fieldsToUpdate = req.body;
  const { lastDatePrayed = null } = fieldsToUpdate;

  const [prayer] = await getPrayer({ _id: _prayerId }, null, null, ['owner']);

  if (!prayer) {
    return res.status(404).json({
      success: false,
      message: 'Prayer not found'
    });
  }

  // TODO: Add to JS interview questions. The diff between 1 and 2
  const { owner: user } = prayer; //1. const { id: userId } = user

  await updatePrayer({ _id: _prayerId }, fieldsToUpdate); //2. updateUser({ id: userId })

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

  const [updatedPrayer] = await getPrayer({  _id: _prayerId },
    null,
    null,
    ['creator', 'owner']);

  updatedPrayer.collection = await getCollection({ prayers: _prayerId });

  res.json({
    success: true,
    prayer: updatedPrayer
  });
});

module.exports = router;
