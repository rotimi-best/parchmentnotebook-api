const express = require('express');

const router = express.Router();
const { getUser, updateUser } = require('../db/cruds/User');
const { getQuote, updateQuote } = require('../db/cruds/Quote');
const { getPrayer } = require('../db/cruds/Prayer');
const { date, len, reduceDay } = require('../modules');
const removeDuplicatesOfStringInArr = require('../helpers/removeDuplicatesOfStringInArr');
const { bible } = require("../helpers/getBible");

const fieldsToGetFromUserModel = [['comments.author', 'googleAuthUser.name googleAuthUser.picture']];
const passage = {
  bible: 'Genesis',
  chapter: '3',
  verses: ['1','4', '10']
}

console.log(bible[passage.bible][passage.chapter][passage.verses[0]]);
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

  const prayersToday = await getPrayer({
    owner: _id,
    $or: [
      {
        $and: [
          {
            start: {
              $lte: today
            }
          },
          {
            end: {
              $gte: today
            }
          },
          {
            lastDatePrayed: { $ne: today }
          }
        ]
      },
      {
        lastDatePrayed: { $ne: today },
        start: {
          $lte: today
        },
        repeat: 'daily'
      }
    ]
  });

  // const prayersTodayWithCollection =  [];

  // for (const prayer of prayersToday) {
  //   prayer._doc.collection = await getCollection({ prayers: prayer._id });

  //   prayersTodayWithCollection.push(prayer)
  // }

  // const prayersPrayedToday = await getPrayer({
  //   owner: _id,
  //   lastDatePrayed: today
  // });

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
  console.log('quote', quote)

  return res.json({
    success: true,
    // user,
    // streak: user.streak,
    prayersToday,
    quote,
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

module.exports = router;
