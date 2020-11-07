require('dotenv').config();
require('../helpers/additionalInit');
const connectToDb = require('../db/connect');
const { updateCollection, getCollection } = require('../db/cruds/Collection');
const { getUser,  } = require('../db/cruds/User');

// MONGODB CONNECTION
connectToDb();

(async() => {

  const collections = await getCollection({ _id: { $exists: true } });
  console.log('collections.length', collections.length)
  const list = {};
  // for (const collection of collections) {
    // const { _id, owner, title, edittableByUser } = collection;
    // if (list[owner]) {
    //   list[owner].collections.push({
    //     title,
    //     edittableByUser
    //   })
    // } else {
    //   const [user] = await getUser({ _id: owner })
    //   // console.log('user.googleAuthUser', user.googleAuthUser)
    //   list[owner] = {
    //     name: user.googleAuthUser ? user.googleAuthUser.name : owner,
    //     collections: [{
    //       title,
    //       edittableByUser
    //     }]
    //   }
    // }
    // await updateCollection({ _id }, {
    //   // people: [owner]
    //   // public: false
    //   description: '',
    //   comments: [],
    //   relatedCollections: [],
    // });
  // }
  await updateCollection({ title: 'Unanswered Prayers' }, {
    edittableByUser: false
  });
  // console.log('list', JSON.stringify(list))

  process.exit(1);
})()