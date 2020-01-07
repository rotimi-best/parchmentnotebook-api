const express = require('express');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const router = express.Router();
const { getUser, updateUser } = require('../db/cruds/User');
const { getPrayer, updatePrayer, addPrayer } = require('../db/cruds/Prayer');
const { updatePrayerList, getPrayerList, addPrayerList } = require('../db/cruds/PrayerList');
const { date, len, reduceDay } = require('../modules');

const today = new Date(date()).getTime(); // new Date("2020-06-01").getTime()

// @route GET /prayerlist
// @route Get All Prayer Lists
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

  const prayerList = await getPrayerList({
    owner: user._id,
  }, null, null, ['prayer', 'creator']);

  // Manually generate prayerList for answered and unanswered prayers
  const allPrayers = await getPrayer({owner: user._id });
  const answered = {
    title: 'Answered Prayers',
    edittableByUser: false,
    public: false,
    prayers: []
  };
  const unanswered = {
    title: 'Unanswered Prayers',
    edittableByUser: false,
    public: false,
    prayers: []
  };

  allPrayers.forEach(prayer => {
    if (prayer.answered) answered.prayers.push(prayer)
    else unanswered.prayers.push(prayer)
  })

  prayerList.push(answered, unanswered);

  res.json({ success: true, prayerList });
});

// @route POST /prayerlist
// @route Add a Prayer List
// @access Private
router.post('/', async (req, res) => {
  let {
    title = null,
    userId,
    prayers // typeof array
  } = req.body;

  if (!title) {
    return res.status(403).json({
      success: false,
      message: 'Title must not be empty'
    });
  }

  const _userId = ObjectId(userId);
  let [user] = await getUser({ _id: _userId });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (prayers && Array.isArray(prayers) && prayers.length) {
    prayers = prayers.map(prayer => ObjectId(prayer._id));
  }

  const prayerList = await addPrayerList({
    title,
    creator: _userId,
    owner: _userId,
    prayers
  });

  res.json({
    success: true,
    prayerList
  });
});

// @route PUT prayer/prayerListId
// @route Update a Prayer List
// @access Private
router.put('/:prayerListId', async (req, res) => {
  const { prayerListId } = req.params;
  const fieldsToUpdate = req.body;

  if (!ObjectId.isValid(prayerListId)) {
    return res.status(404).json({
      success: false,
      message: 'Invalid prayer list id'
    });
  }

  const _prayerListId = ObjectId(prayerListId)
  const [prayerList] = await getPrayerList({ _id: _prayerListId });

  if (!prayerList) {
    return res.status(404).json({
      success: false,
      message: 'Prayer List not found'
    });
  }

  let prayers = fieldsToUpdate.prayers;
  if (len(prayers)) {
    prayers = prayers.map(list => ObjectId(list._id));
  }

  await updatePrayerList({ _id: _prayerListId }, fieldsToUpdate);

  const [updatedPrayerList] = await getPrayerList({ _id: _prayerListId },
    null,
    null,
    ['creator', 'owner', 'prayer']
  );

  res.json({
    success: true,
    prayer: updatedPrayerList
  });
});

module.exports = router;
