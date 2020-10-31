const { updateUser } = require('../db/cruds/User');
const NotificationAPI = require('./pushNotificiation');
const { clientUrl } = require('../config');

const sleep = () => new Promise(res => setTimeout(res, 1000));

module.exports = async (user, prayerId, notificationType) => {
  const title = notificationType.isComment
    ? `New comment`
    : `New intercessor`;
  const body = notificationType.isComment
    ? `Someone commented on your prayer request`
    : `Someone just started praying for you, say thank you`;

  let hadAPushError = false;
  const _subscriptions = [];
  // Send to each of their devices
  for (const subscription of user.subscriptions) {
    _subscriptions.push(subscription);

    // Error handler
    const notificationErrorCallback = () => {
      hadAPushError = true;
      _subscriptions.pop();
    }

    NotificationAPI.sendPush(subscription, {
      title,
      body,
      url:`${clientUrl}/prayer/${prayerId}`,
    }, notificationErrorCallback);

    await sleep();
  }

  // if error found remove such subscription
  // if (hadAPushError) {
  //   await updateUser({ _id: user._id }, {
  //     subscriptions: _subscriptions
  //   });
  // }
}