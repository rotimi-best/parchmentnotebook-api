const express = require('express');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const { addUser, getUser, updateUser } = require('../db/cruds/User');

const router = express.Router();

// @route POST user/auth
// @route Authenticate user
// @access Private
router.post('/user/auth', async (req, res) => {
  const {
    email,
    name,
    pictureUrl,
    userId,
  } = req.body;

  let [user] = await getUser({ userId });

  if (user) {
    // Update
    await updateUser({ userId }, {
      email,
      name,
      pictureUrl,
      userId,
    })
  } else {
    // Add
    user = await addUser({
      email,
      name,
      pictureUrl,
      userId,
    });
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
