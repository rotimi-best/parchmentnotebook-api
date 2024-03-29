const express = require('express');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const router = express.Router();
const { getUser, updateUser } = require('../db/cruds/User');
const { getQuote, updateQuote } = require('../db/cruds/Quote');
const { getPrayer } = require('../db/cruds/Prayer');
const { getStory, updateStory, addStory } = require('../db/cruds/Story');
const { date, len, reduceDay } = require('../modules');
const removeDuplicatesOfStringInArr = require('../helpers/removeDuplicatesOfStringInArr');
const getVerses = require('../helpers/getVerses');

const fieldsToGetFromUserModel = [
  ['owner', 'googleAuthUser.name googleAuthUser.picture'],
  ['comments.author', 'googleAuthUser.name googleAuthUser.picture']
];

const getPassages = passages => passages.map(passage => {
  return {
    label: passage,
    verses: getVerses(passage)
  }
})

const getStories = async () => {
  const stories = await getStory({
    createdAt: { $gte: new Date(new Date().getTime() - (1 * 24 * 60 * 60 * 1000)) }
  },{ sort: { createdAt: -1 } }, null, [['creator', 'googleAuthUser.name googleAuthUser.picture']]);

  return stories;
}

// @route GET feed/userId
// @route Get home feed data
// @access Private
router.get('/:userId', async (req, res) => {
  const { userId = '' } = req.params;
  const { quoteId = '' } = req.query;

  let quote = {};

  const [user] = await getUser({ userId });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const { _id } = user;
  // const yesterday = reduceDay(1, null, true);
  const today = date({ toUTC: true });

  // if (lastDatePrayed !== yesterday && lastDatePrayed !== today) {
  //   user.streak = 0
  //   await updateUser({ _id },  { $set: {
  //       streak: user.streak
  //     }
  //   });
  // }

  // const prayersToday = await getPrayer({
  //   owner: _id,
  //   $or: [
  //     {
  //       $and: [
  //         {
  //           start: {
  //             $lte: today
  //           }
  //         },
  //         {
  //           end: {
  //             $gte: today
  //           }
  //         },
  //         {
  //           lastDatePrayed: { $ne: today }
  //         }
  //       ]
  //     },
  //     {
  //       lastDatePrayed: { $ne: today },
  //       start: {
  //         $lte: today
  //       },
  //       repeat: 'daily'
  //     }
  //   ]
  // });

  // const prayersTodayWithCollection =  [];

  // for (const prayer of prayersToday) {
  //   prayer._doc.collection = await getCollection({ prayers: prayer._id });

  //   prayersTodayWithCollection.push(prayer)
  // }

  // const prayersPrayedToday = await getPrayer({
  //   owner: _id,
  //   lastDatePrayed: today
  // });

  const publicPrayers = await getPrayer({
    public: true,
    answered: false
  },
  { sort: { createdAt: -1 } }, null, [fieldsToGetFromUserModel[0]]);
  for (const prayer of publicPrayers) {
    prayer._doc.interceeding = prayer.intercessors.includes(user._id);
    prayer._doc.formattedPassages = getPassages(prayer._doc.passages)
  }

  if (quoteId) {
    const [minimumQuote] = await getQuote({ _id: quoteId },
      null,
      null,
      fieldsToGetFromUserModel
    );
    quote = minimumQuote;
  } else {
    const lastUpdated = await getQuote({latest: true},
      null,
      null,
      fieldsToGetFromUserModel
    );
    quote = lastUpdated[0];
  }

  quote._doc.isLovedByMe = Array.isArray(quote.loves)
    ? quote.loves.includes(_id)
    : false;
  quote._doc.loves = quote.loves.length;

  return res.json({
    success: true,
    // user,
    // streak: user.streak,
    prayersToday: [],
    publicPrayers,
    quote,
    stories: await getStories(),
    // prayersPrayedToday: len(prayersPrayedToday)
  });
});

// @route PUT feed/userId?quoteId=39583598345934
// @route Update quote
// @access Private
router.put('/:userId/:quoteId', async (req, res) => {
  console.log(`router.put('/:userId/:quoteId')`);
  const { userId = '', quoteId = '' } = req.params;
  const { comment = '', loved } = req.body;

  const [user] = await getUser({ userId });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const [quote] = await getQuote({ _id: quoteId });
  if (!quote) {
    return res.status(404).json({
      success: false,
      message: 'Quote not found'
    });
  }

  const updateParams = {};

  if ('comment' in req.body) {
    const newComment = {
      comment,
      author: user._id
    };
    updateParams['$push'] = { comments: newComment };
  }

  if ('loved' in req.body) {
    updateParams['loves'] = loved
      ? [...quote.loves, user._id]
      : quote.loves.filter(userId => `${userId}` !== `${user._id}`);

    updateParams['loves'] = removeDuplicatesOfStringInArr(updateParams['loves'])
  }

  await updateQuote({ _id: quoteId }, updateParams);

  const [updatedQuote] = await getQuote({ _id: quoteId },
    null,
    null,
    fieldsToGetFromUserModel
  );

  updatedQuote._doc.isLovedByMe = Array.isArray(updatedQuote.loves)
    ? updatedQuote.loves.includes(user._id)
    : false;
  updatedQuote._doc.loves = updatedQuote.loves.length;

  return res.json({
    success: true,
    quote: updatedQuote
  });
});

// @route GET feed/story/userId
// @route Get home story data
// @access Private
router.get('/story/view/:storyId', async (req, res) => {
  const { storyId = '' } = req.params;

  if (!ObjectId.isValid(storyId)) {
    return res.status(404).json({
      success: false,
      message: 'Invalid story id'
    });
  }
  const [story] = await getStory({ _id: storyId })

  if (!story) {
    return res.status(404).json({
      success: false,
      message: 'Story not found'
    });
  }

  res.redirect(story.url)

  updateStory({ _id: storyId }, {
    $inc : {'views' : 1}
  });
});
// @route GET feed/story/view
// @route Get home story data
// @access Private
router.post('/story/:userId', async (req, res) => {
  const { userId = '' } = req.params;
  const { url = '' } = req.body;

  const [user] = await getUser({ userId });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (!url) {
    return res.status(404).json({
      success: false,
      message: 'Invalid url'
    });
  }

  await addStory({
    url,
    views: 0,
    loves: [],
    creator: user._id
  });

  return res.json({ success: true, stories: await getStories() });
});


module.exports = router;
