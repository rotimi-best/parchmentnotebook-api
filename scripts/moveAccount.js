require('dotenv').config();
require('../helpers/additionalInit');
const connectToDb = require('../db/connect');
const { updateCollection, getCollection, deleteCollection } = require('../db/cruds/Collection');
const { getUser, deleteUser } = require('../db/cruds/User');

// MONGODB CONNECTION
connectToDb();

(async () => {
  return;
  const collections = await getCollection({ _id: { $exists: true } });
  console.log('collections.length', collections.length)
  const list = {};
  for (const collection of collections) {
    const { _id, owner, title } = collection;
    // if (list[owner]) {
    //   list[owner].collections.push(title)
    // } else {
    //   const [user] = await getUser({ _id: owner })
    //   // console.log('user.googleAuthUser', user.googleAuthUser)
    //   list[owner] = {
    //     name: user.googleAuthUser ? user.googleAuthUser.name : owner,
    //     collections: [title]
    //   }
    // }
    await updateCollection({ _id }, {
      // people: [owner]
      // public: false
      description: '',
      comments: [],
      relatedCollections: [],
    });
  }

  console.log('list', list)

  process.exit(1);
})()

const deleteUserData = async() => {
  const userId = "111431764584724103313";
  console.log('userId', userId)
  const [user] = await getUser({ userId });
  await deleteUser({ userId });
  await deleteCollection({ owner: user._id });

  process.exit(1);
}