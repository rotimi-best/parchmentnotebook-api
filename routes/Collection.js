const express = require('express');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const router = express.Router();
const { getUser } = require('../db/cruds/User');
const { updateCollection, getCollection, addCollection } = require('../db/cruds/Collection');
const { len } = require('../modules');
const getVerses = require('../helpers/getVerses');
const sendPrayerPush = require('../helpers/sendPrayerPush');

const fieldsToGetFromUserModel = [
  ['owner', 'googleAuthUser.name googleAuthUser.picture userId createdAt'],
  ['people', 'googleAuthUser.name googleAuthUser.picture userId'],
];

const getPassages = passages => passages.map(passage => {
  return {
    label: passage,
    verses: getVerses(passage)
  }
})

// @route GET /collection/:userId
// @route Get All Collections of a particular user
// @access Private
router.get('/', async (req, res) => {
  const { userId } = req.query;

  const [user] = await getUser({ userId });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const collections = await getCollection({
      owner: user._id,
    },
    { sort: { title: 1 } }
  );
  const sharedWithMe = await getCollection({
    people: user._id,
    owner: { $ne: user._id }
  },
    { sort: { title: 1 } }
  );

  // collections.forEach(collection => {
  //   collection.prayers.map(prayer => {
  //     prayer._doc.formattedPassages = getPassages(prayer._doc.passages);
  //   })
  // });

  res.json({ success: true, collections, sharedWithMe });
});

// @route GET /collection/:collectionId
// @route Get A Collection of a particular user
// @access Private
router.get('/:collectionId', async (req, res) => {
  const { collectionId = '' } = req.params;
  const { userId } = req.query;

  if (!ObjectId.isValid(collectionId)) {
    return res.status(404).json({
      success: false,
      message: 'Invalid collection id'
    });
  }

  const [user] = await getUser({ userId });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const [collection] = await getCollection({
    _id: ObjectId(collectionId),
    // owner: user._id,// Allow not the owner see the collection
  }, { sort: { createdAt: -1 } }, null, ['prayers', ...fieldsToGetFromUserModel]);
  collection._doc.edittableByUser = `${collection.owner._id}` === `${user._id}`;

  for (const prayer of collection.prayers) {
    prayer._doc.formattedPassages = getPassages(prayer._doc.passages);
  }
  res.json({ success: true, collection });
});

// @route POST /collection
// @route Add a Collection
// @access Private
router.post('/', async (req, res) => {
  let {
    title = null,
    color = '',
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
    color,
    creator: user._id,
    owner: user._id,
    people: [user._id],
    prayers
  });

  for (const prayer of collection.prayers) {
    prayer._doc.collections = await getCollection({ prayers: prayer._id });
    prayer._doc.formattedPassages = getPassages(prayer._doc.passages);
  }

  res.json({
    success: true,
    collection
  });
});

// @route PUT collection/collectionId
// @route Update a Collection
// @access Private
router.put('/:collectionId', async (req, res) => {
  const { collectionId } = req.params;
  const fieldsToUpdate = req.body;
  const [user] = await getUser({ userId: fieldsToUpdate.userId });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

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
      message: 'Collection not found'
    });
  }

  let prayers = fieldsToUpdate.prayers || '';
  if (len(prayers)) {
    prayers = prayers.map(list => ObjectId(list._id));
  }

  if (fieldsToUpdate.join && fieldsToUpdate.userId) {
    // send push to owner
    getUser({ _id: ObjectId(collection.owner), subscriptions: { $gt: [] } })
    .then((userToSendPush) => {
      if (userToSendPush.length) {
        sendPrayerPush(userToSendPush[0], { collectionId }, {
          title: `${user.googleAuthUser.name} joined your collection`,
          body: `'${collection.title}' collection was joined by someone`
        });
      }
    });

    fieldsToUpdate.people = collection.people.concat(user._id);
  }

  await updateCollection({ _id: _collectionId }, { $set: fieldsToUpdate });

  const [updatedCollection] = await getCollection({ _id: _collectionId },
    null,
    null,
    ['prayers', ...fieldsToGetFromUserModel]
  );

  for (const prayer of updatedCollection.prayers) {
    prayer._doc.formattedPassages = getPassages(prayer._doc.passages);
  }
  updatedCollection._doc.edittableByUser = `${updatedCollection.owner._id}` === `${user._id}`;

  res.json({
    success: true,
    collection: updatedCollection
  });
});

module.exports = router;
