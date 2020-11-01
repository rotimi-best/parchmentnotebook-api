const express = require('express');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const router = express.Router();
const { getUser } = require('../db/cruds/User');
const { getPrayer, updatePrayer, addPrayer, deletePrayer } = require('../db/cruds/Prayer');
const { getCollection, updateCollection } = require('../db/cruds/Collection');
const { date } = require('../modules');
const sendPrayerPush = require('../helpers/sendPrayerPush');
const getVerses = require('../helpers/getVerses');
const removeDuplicatesOfStringInArr = require('../helpers/removeDuplicatesOfStringInArr');
const { DEFAULT_COLLECTION } = require('../helpers/constants');

const fieldsToGetFromUserModel = [
  ['owner', 'googleAuthUser.name googleAuthUser.picture'],
  ['comments.author', 'googleAuthUser.name googleAuthUser.picture'],
];

const getPassages = passages => passages.map(passage => {
  return {
    label: passage,
    verses: getVerses(passage)
  }
})

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
  }, { sort: { createdAt: -1 } }, null, [fieldsToGetFromUserModel[0]]);
  const prayersWithCollection = [];

  for (const prayer of prayers) {
    prayer._doc.collections = await getCollection({ prayers: prayer._id });
    prayer._doc.comments = prayer._doc.comments.length;
    prayer._doc.interceeding = prayer.intercessors.includes(user._id);
    prayer._doc.intercessors = prayer._doc.intercessors.length;
    prayer._doc.isOwner = `${user._id}` == `${prayer.creator}`;
    prayer._doc.formattedPassages = getPassages(prayer._doc.passages);

    prayersWithCollection.push(prayer)
  }

  const interceedingPrayers = await getPrayer({
    intercessors: `${user._id}`
  }, { sort: { createdAt: -1 } }, null, [fieldsToGetFromUserModel[0]]);
  const formattedInterceedingPrayer = [];
  for (const prayer of interceedingPrayers) {
    prayer._doc.collections = [];
    prayer._doc.comments = prayer._doc.comments.length;
    prayer._doc.interceeding = true;
    prayer._doc.intercessors = prayer._doc.intercessors.length;
    prayer._doc.isOwner = false;
    prayer._doc.formattedPassages = getPassages(prayer._doc.passages);

    formattedInterceedingPrayer.push(prayer)
  }

  res.json({
    success: true,
    prayers: prayersWithCollection,
    interceedingPrayers: formattedInterceedingPrayer
  });
});

// @route GET /prayer/userId/prayerId
// @route Get A Prayer Request
// @access Private
router.get('/:userId/:prayerId', async (req, res) => {
  const { userId = '', prayerId = ''} = req.params;

  if (!ObjectId.isValid(prayerId)) {
    return res.status(404).json({
      success: false,
      message: 'Invalid prayer id'
    });
  }

  const [user] = await getUser({ userId });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const [prayer] = await getPrayer({
    _id: prayerId,
  }, null, null, fieldsToGetFromUserModel);

  prayer._doc.collections = await getCollection({ prayers: prayer._id });
  prayer._doc.isOwner = `${user._id}` == `${prayer.creator}`;
  prayer._doc.interceeding = prayer.intercessors.includes(user._id);
  prayer._doc.formattedPassages = getPassages(prayer._doc.passages)

  res.json({
    success: true,
    prayer
  });
});

// @route POST /prayer
// @route Add a prayer
// @access Private
router.post('/', async (req, res) => {
  const today = date({ toUTC: true });
  const {
    description = '',
    answered = false,
    collections,
    passages,
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
    passages,
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

  prayer._doc.collections = await getCollection({ prayers: prayer._id });
  prayer._doc.owner = user
  prayer._doc.isOwner = true;
  prayer._doc.interceeding = false;
  prayer._doc.formattedPassages = getPassages(prayer._doc.passages)

  res.json({
    success: true,
    prayer
  });
});

// @route PUT prayer/prayerId
// @route Update a prayer
// @access Private
router.put('/:userId/:prayerId', async (req, res) => {
  // const today = date({ toUTC: true });
  const { prayerId, userId } = req.params;

  const [user] = await getUser({ userId });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

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
  const updateParams = {
    $set: fieldsToUpdate
  };
  const isNotOwner = `${user._id}` != `${prayer.owner._id}`;

  if ('comment' in req.body) {
    const newComment = {
      comment: req.body.comment,
      author: user._id
    };
    updateParams['$push'] = { comments: newComment };

    if (isNotOwner) {
      // send push to owner
      getUser({ _id: ObjectId(prayer.owner._id), subscriptions: { $gt: [] } })
      .then((userToSendPush) => {
        if (userToSendPush.length) {
          sendPrayerPush(userToSendPush[0], {prayerId}, { isComment: true });
        }
      })
    } else {
      // Get users watching prayer remove duplicates
      const usersWatchingPrayer = removeDuplicatesOfStringInArr([
        ...prayer.intercessors,
        ...(prayer.comments
            .filter(comment => comment.author != `${user._id}`)
            .map(comment => `${comment.author}`)
          )
      ]);

      getUser({ _id: { $in: usersWatchingPrayer }, subscriptions: { $gt: [] } })
      .then((userToSendPush) => {
        if (userToSendPush.length) {
          sendPrayerPush(userToSendPush[0], {prayerId}, { isComment: true });
        }
      })
    }
  }

  if ('interceeding' in req.body) {
    updateParams['intercessors'] = req.body.interceeding
      ? [...prayer.intercessors, user._id]
      : prayer.intercessors.filter(userId => userId != `${user._id}`);

    if (req.body.interceeding && isNotOwner) {
      // send push to owner
      getUser({ _id: ObjectId(prayer.owner._id), subscriptions: { $gt: [] } })
      .then((userToSendPush) => {
        if (userToSendPush.length) {
          sendPrayerPush(userToSendPush[0], {prayerId}, { isIntercession: true });
        }
      })
    }
  }

  // TODO: Add to JS interview questions. The diff between 1 and 2
  // const { owner: user } = prayer; //1. const { id: userId } = user

  await updatePrayer({ _id: _prayerId }, updateParams); //2. updateUser({ id: userId })

  // Note: if lastDatePrayed === todaysDate ? "User prayed today" : "Didn't pray today";
  // if (lastDatePrayed && lastDatePrayed === today) {
  //   const yesterday = reduceDay(1, null, true);
  //   if (user.lastDatePrayed === yesterday && user.lastDatePrayed !== today) {
  //     await updateUser({ _id: user._id },  {
  //       lastDatePrayed: today,
  //       $inc: {
  //         streak: 1
  //       }
  //     });
  //   } else if (user.lastDatePrayed !== yesterday && user.lastDatePrayed !== today) {
  //     await updateUser({ _id: user._id },  { $set: {
  //         streak: 0
  //       }
  //     });
  //   }
  // }

  const findPrayersByPrayerId = { prayers: _prayerId };

  // Update Collection
  // 1. Default
  if (typeof answered === "boolean") {
    const params = bol => bol
      ? { $push: findPrayersByPrayerId }
      : { $pull: findPrayersByPrayerId }
    const [wasAnswered] = await getCollection({ title: DEFAULT_COLLECTION.ANSWERED_PRAYERS, owner: prayer.owner._id, ...findPrayersByPrayerId });

    if (wasAnswered && !answered) {
      await updateCollection({ title: DEFAULT_COLLECTION.ANSWERED_PRAYERS, owner: prayer.owner._id }, params(answered));
      await updateCollection({ title: DEFAULT_COLLECTION.UNANSWERED_PRAYERS, owner: prayer.owner._id }, params(!answered));
    } else if (!wasAnswered && answered) {
      await updateCollection({ title: DEFAULT_COLLECTION.ANSWERED_PRAYERS, owner: prayer.owner._id }, params(answered));
      await updateCollection({ title: DEFAULT_COLLECTION.UNANSWERED_PRAYERS, owner: prayer.owner._id }, params(!answered));
    }
  }

  if (collections) {
    //2. Every other
    const userCurrentCollections = await getCollection({
      owner: prayer.owner._id,
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
      await updateCollection({ title: colTitle, owner: prayer.owner._id }, {
        $push: findPrayersByPrayerId
      });
    }
  }

  const [updatedPrayer] = await getPrayer(
    {  _id: _prayerId },
    null,
    null,
    ['creator', 'owner', ...fieldsToGetFromUserModel]
  );

  updatedPrayer._doc.collections = await getCollection(findPrayersByPrayerId);
  updatedPrayer._doc.isOwner = !isNotOwner;
  updatedPrayer._doc.formattedPassages = getPassages(updatedPrayer._doc.passages)

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
