require('dotenv').config();
const CollectionModel = require('../db/models/collection');
const { DEFAULT_COLLECTION } = require('../helpers/constants');

require('../db/connect')();
/**
 * Make any changes you need to make to the database here
 */
async function up () {
  // Write migration here
  await CollectionModel.updateMany({
      title: DEFAULT_COLLECTION.ANSWERED_PRAYERS,
    },
    {
      $set: { status:  1 }
    }
  );

  await CollectionModel.updateMany({
      title: DEFAULT_COLLECTION.UNANSWERED_PRAYERS,
    },
    {
      $set: { status:  0 }
    }
  );

  return true;
}

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
async function down () {
  // Write migration here
  return Promise.resolve('ok');
}

module.exports = { up, down };
