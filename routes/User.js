const express = require('express');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const { addUser, getUser, updateUser } = require('../db/cruds/User');
const { addCollection } = require('../db/cruds/Collection');
const { DEFAULT_COLLECTION } = require('../helpers/constants');

const router = express.Router();

// @route POST user/auth
// @route Authenticate user
// @access Private
router.post('/auth', async (req, res) => {
  const { userId } = req.body;

  let [user] = await getUser({ userId });

  if (user) {
    // Update
    await updateUser({ userId }, {
      userId,
    });
  } else {
    // Add
    user = await addUser({
      userId,
    });

    // Default collection for each user
    const answered = {
      title: DEFAULT_COLLECTION.ANSWERED_PRAYERS,
      edittableByUser: false,
      public: false,
      prayers: [],
      color: "#4caf50",
      creator: user._id,
      owner: user._id,
    };

    const unanswered = {
      title: DEFAULT_COLLECTION.UNANSWERED_PRAYERS,
      edittableByUser: false,
      public: false,
      color: "#ffeb3b",
      prayers: [],
      creator: user._id,
      owner: user._id,
    };

    await addCollection([answered, unanswered])
  }

  res.json({ success: true, user });
});

// @route GET user/userId
// @route Get A particular user
// @access Private
router.get('/:userId', async (req, res) => {
  const {
    userId,
  } = req.params;
  const [user] = await getUser({ userId });

  if (!user) {
    return res.json({ success: false });
  }

  res.json({ success: true, user });
});

module.exports = router;
