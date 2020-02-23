const express = require('express');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const router = express.Router();
const { getUser, updateUser } = require('../db/cruds/User');
const { getPrayer, updatePrayer, addPrayer, deletePrayer } = require('../db/cruds/Prayer');
const { getCollection, updateCollection } = require('../db/cruds/Collection');
const { date, reduceDay } = require('../modules');
const { DEFAULT_COLLECTION } = require('../helpers/constants');

// @route GET /prayer/userId
// @route Get All Prayer Request
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

  const prayers = await getPrayer({
    owner: user._id
  }, { sort: { createdAt: -1 } }, null, ['owner', 'creator']);
  const prayersWithCollection = [];

  for (const prayer of prayers) {
    prayer._doc.collections = await getCollection({ prayers: prayer._id });

    prayersWithCollection.push(prayer)
  }

  res.json({ success: true, prayers: prayersWithCollection });
});

// @route POST /prayer
// @route Add a prayer
// @access Private
router.post('/', async (req, res) => {
  const today = date({ toUTC: true });
  const {
    description = '',
    repeat,
    note,
    answered = false,
    collections,
    start = today,
    end = today,
    userId,
  } = req.body;

  const [user] = await getUser({ userId });

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
    repeat,
    note,
    creator: user._id,
    owner: user._id,
  });

  collections.forEach(async ({ title }) => {
    await updateCollection({ title, owner: user._id }, {
      $push: { prayers: prayer._id }
    });
  });

  const defaultCollectionTitle = answered
    ? DEFAULT_COLLECTION.ANSWERED_PRAYERS
    : DEFAULT_COLLECTION.UNANSWERED_PRAYERS;

  await updateCollection({ title: defaultCollectionTitle, owner: user._id }, {
    $push: { prayers: prayer._id }
  });

  prayer._doc.collections = await getCollection({ prayers: prayer._id });;

  res.json({
    success: true,
    prayer
  });
});

// @route PUT prayer/prayerId
// @route Update a prayer
// @access Private
router.put('/:prayerId', async (req, res) => {
  const today = date({ toUTC: true });
  const { prayerId } = req.params;

  if (!ObjectId.isValid(prayerId)) {
    return res.status(404).json({
      success: false,
      message: 'Invalid prayer id'
    });
  }

  const _prayerId = ObjectId(prayerId);
  const fieldsToUpdate = req.body;
  const { lastDatePrayed = null, answered } = fieldsToUpdate;
  const collections = fieldsToUpdate.collections
    ? fieldsToUpdate.collections.map(c => c.title || '')
    : null;
  const [prayer] = await getPrayer({ _id: _prayerId }, null, null, ['owner']);

  if (!prayer) {
    return res.status(404).json({
      success: false,
      message: 'Prayer not found'
    });
  }

  // TODO: Add to JS interview questions. The diff between 1 and 2
  const { owner: user } = prayer; //1. const { id: userId } = user

  await updatePrayer({ _id: _prayerId }, { $set: fieldsToUpdate }); //2. updateUser({ id: userId })

  // Note: if lastDatePrayed === todaysDate ? "User prayed today" : "Didn't pray today";
  if (lastDatePrayed && lastDatePrayed === today) {
    const yesterday = reduceDay(1, null, true);
    if (user.lastDatePrayed === yesterday && user.lastDatePrayed !== today) {
      await updateUser({ _id: user._id },  {
        lastDatePrayed: today,
        $inc: {
          streak: 1
        }
      });
    } else if (user.lastDatePrayed !== yesterday && user.lastDatePrayed !== today) {
      await updateUser({ _id: user._id },  { $set: {
          streak: 0
        }
      });
    }
  }

  const findPrayersByPrayerId = { prayers: _prayerId };

  // Update Collection
  // 1. Default
  if (typeof answered === "boolean") {
    const params = bol => bol
      ? { $push: findPrayersByPrayerId }
      : { $pull: findPrayersByPrayerId }
    const [wasAnswered] = await getCollection({ title: DEFAULT_COLLECTION.ANSWERED_PRAYERS, owner: user._id, ...findPrayersByPrayerId });

    if (wasAnswered && !answered) {
      await updateCollection({ title: DEFAULT_COLLECTION.ANSWERED_PRAYERS, owner: user._id }, params(answered));
      await updateCollection({ title: DEFAULT_COLLECTION.UNANSWERED_PRAYERS, owner: user._id }, params(!answered));
    } else if (!wasAnswered && answered) {
      await updateCollection({ title: DEFAULT_COLLECTION.ANSWERED_PRAYERS, owner: user._id }, params(answered));
      await updateCollection({ title: DEFAULT_COLLECTION.UNANSWERED_PRAYERS, owner: user._id }, params(!answered));
    }
  }

  if (collections) {
    //2. Every other
    const userCurrentCollections = await getCollection({
      owner: user._id,
      edittableByUser: true,
      ...findPrayersByPrayerId
    });

    // Remove from DB what was removed on the client.
    for (const userCurrentCollection of userCurrentCollections) {
      const { _id, title } = userCurrentCollection;

      if (!collections.includes(title)) {
        await updateCollection({ _id }, {
          $pull: findPrayersByPrayerId
        });
      } else {
        collections.splice(collections.indexOf(title), 1);
      }
    }
    // Add the new ones
    for (const colTitle of collections) {
      await updateCollection({ title: colTitle, owner: user._id }, {
        $push: findPrayersByPrayerId
      });
    }
  }

  const [updatedPrayer] = await getPrayer({  _id: _prayerId },
    null,
    null,
    ['creator', 'owner']);

  updatedPrayer._doc.collections = await getCollection(findPrayersByPrayerId);

  res.json({
    success: true,
    prayer: updatedPrayer
  });
});

// @route DELETE prayer/prayerId
// @route Delete a prayer
// @access Private
router.delete('/:prayerId', async (req, res) => {
  const { prayerId } = req.params;

  if (!ObjectId.isValid(prayerId)) {
    return res.status(404).json({
      success: false,
      message: 'Invalid prayer id'
    });
  }

  const _prayerId = ObjectId(prayerId);
  const [prayer] = await getPrayer({ _id: _prayerId });

  if (!prayer) {
    return res.status(404).json({
      success: false,
      message: 'Prayer not found'
    });
  }

  const findPrayersByPrayerId = { prayers: _prayerId };
  try {
    await deletePrayer({ _id: _prayerId });

    await updateCollection(findPrayersByPrayerId, {
      $pull: findPrayersByPrayerId
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }

  res.json({ success: true });
});

module.exports = router;
