const { updateUser } = require('../db/cruds/User');
const NotificationAPI = require('./pushNotificiation');
const { clientUrl } = require('../config');

const sleep = () => new Promise(res => setTimeout(res, 1000));

// const NOTIFICATION_TYPES = {
//   COMMENT: 'COMMENT',
//   INTERCESSION: 'INTERCESSION'
// }

// const NOTIFICATION_TEMPLATES = {
//   COMMENT: {
//     TO_AUTHOR: '%(name)s commented on your prayer request',
//   }
// }

// const params = {
//   userToSendNotification: {},
//   notificationType: ''
// }

module.exports = async (user, { collectionId, prayerId }, notificationType) => {
  console.log('notificationType', notificationType)
  const senderName = notificationType.senderName ? notificationType.senderName : 'Someone';
  console.log('senderName', senderName)
  const title = notificationType.title
    ? notificationType.title
    : notificationType.isComment
      ? `${senderName} commented on your prayer`
      : `New intercessor`;
  const body = notificationType.body
    ? notificationType.body
    : notificationType.isComment
      ? `${senderName} commented on your prayer request`
      : `${senderName} just started praying for you.`;
  const url = prayerId
    ? `${clientUrl}/prayer/${prayerId}`
    : collectionId
        ? `${clientUrl}/collection/${collectionId}`
        : clientUrl;

  let hadAPushError = false;
  const _subscriptions = [];
  // Send to each of their devices
  for (const subscription of user.subscriptions) {
    _subscriptions.push(subscription);
    console.log('sending notitification')
    // Error handler
    const notificationErrorCallback = () => {
      hadAPushError = true;
      console.log('notitification failed')
      _subscriptions.pop();
    }

    NotificationAPI.sendPush(subscription, {
      title,
      body,
      url,
    }, notificationErrorCallback);

    await sleep();
  }
  console.log('initial subscriptions', user.subscriptions.length)
  console.log('final subscriptions', _subscriptions.length)

  // if error found remove such subscription
  if (hadAPushError) {
    await updateUser({ _id: user._id }, {
      subscriptions: _subscriptions
    });
  }
}