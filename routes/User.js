const express = require('express');

const { addUser, getUser, updateUser } = require('../db/cruds/User');
const { addCollection } = require('../db/cruds/Collection');
const { DEFAULT_COLLECTION } = require('../helpers/constants');

const router = express.Router();

// @route POST user/auth
// @route Authenticate user
// @access Private
router.post('/auth', async (req, res) => {
  const { userId, googleAuthUser = {} } = req.body;

  let [user] = await getUser({ userId });

  if (user) {
    // Update
    await updateUser({ userId }, {
      userId,
      googleAuthUser
    });
  } else {
    // Add
    user = await addUser({
      userId,
      googleAuthUser
    });

    const defaultCollTemplate = {
      title: DEFAULT_COLLECTION.UNANSWERED_PRAYERS,
      edittableByUser: true,
      status: 0,
      public: false,
      color: "#ffeb3b",
      prayers: [],
      people: [user._id],
      description: 'This collection contains all my <strong>unanswered prayers</strong>',
      creator: user._id,
      owner: user._id,
    }

    // Default collection for each user
    const others = [
      {
        ...defaultCollTemplate,
        title: DEFAULT_COLLECTION.ANSWERED_PRAYERS,
        edittableByUser: false,
        status: 1,
        color: "#4caf50",
        description: 'This collection contains all my <strong>answered prayers</strong>',
      },
      {
        ...defaultCollTemplate,
        edittableByUser: false,
      },
      {
        ...defaultCollTemplate,
        title: DEFAULT_COLLECTION.FAMILY,
        color: "#ff5722",
        description: 'This collection contains all prayers about my <strong>family</strong>',
      },
      {
        ...defaultCollTemplate,
        title: DEFAULT_COLLECTION.FINANCE,
        color: "#673ab7",
        description: 'This collection contains all prayers about my <strong>finance</strong>',
      },
      {
        ...defaultCollTemplate,
        title: DEFAULT_COLLECTION.CHURCH,
        color: "#2196f3",
        description: 'This collection contains all prayers about my <strong>church</strong>',
      },
      {
        ...defaultCollTemplate,
        title: DEFAULT_COLLECTION.SPIRITUAL_LIFE,
        color: "#e91e63",
        description: 'This collection contains all prayers about my <strong>spiritual life</strong>',
      },
    ]

    await addCollection(others)
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
