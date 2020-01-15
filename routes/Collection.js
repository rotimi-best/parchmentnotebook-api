const express = require('express');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const router = express.Router();
const { getUser, updateUser } = require('../db/cruds/User');
const { getPrayer, updatePrayer, addPrayer } = require('../db/cruds/Prayer');
const { updateCollection, getCollection, addCollection } = require('../db/cruds/Collection');
const { date, len, reduceDay } = require('../modules');

const today = new Date(date()).getTime(); // new Date("2020-06-01").getTime()

// @route GET /collection/:userId
// @route Get All Collections of a particular user
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

  const collections = await getCollection({
    owner: user._id,
  }, {sort: { title: 1 }}, null, ['prayer', 'creator']);

  // Manually generate collection for answered and unanswered prayers
  const allPrayers = await getPrayer({owner: user._id });
  const answered = {
    _id: 1,
    title: 'Answered Prayers',
    edittableByUser: false,
    public: false,
    prayers: []
  };
  const unanswered = {
    _id: 2,
    title: 'Unanswered Prayers',
    edittableByUser: false,
    public: false,
    prayers: []
  };

  allPrayers.forEach(prayer => {
  if (prayer.answered) answered.prayers.push(prayer)
    else unanswered.prayers.push(prayer)
  })

  collections.push(answered, unanswered);

  res.json({ success: true, collections });
});

// @route POST /collection
// @route Add a Collection
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

  let [user] = await getUser({ userId });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (prayers && Array.isArray(prayers) && prayers.length) {
    prayers = prayers.map(prayer => ObjectId(prayer._id));
  }

  const collection = await addCollection({
    title,
    creator: user._id,
    owner: user._id,
    prayers
  });

  res.json({
    success: true,
    collection
  });
});

// @route PUT prayer/collectionId
// @route Update a Collection
// @access Private
router.put('/:collectionId', async (req, res) => {
  const { collectionId } = req.params;
  const fieldsToUpdate = req.body;

  if (!ObjectId.isValid(collectionId)) {
    return res.status(404).json({
      success: false,
      message: 'Invalid collection id'
    });
  }

  const _collectionId = ObjectId(collectionId)
  const [collection] = await getCollection({ _id: _collectionId });

  if (!collection) {
    return res.status(404).json({
      success: false,
      message: 'Prayer List not found'
    });
  }

  let prayers = fieldsToUpdate.prayers;
  if (len(prayers)) {
    prayers = prayers.map(list => ObjectId(list._id));
  }

  await updateCollection({ _id: _collectionId }, fieldsToUpdate);

  const [updatedCollection] = await getCollection({ _id: _collectionId },
    null,
    null,
    ['creator', 'owner', 'prayer']
  );

  res.json({
    success: true,
    prayer: updatedCollection
  });
});

module.exports = router;
