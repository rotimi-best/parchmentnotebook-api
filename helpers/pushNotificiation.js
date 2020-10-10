const webPush = require('web-push');
const {
  clientUrl,
  adminEmail,
  publicVapidKey,
  privateVapidKey
} = require('../config');

webPush.setVapidDetails(`mailto:${adminEmail}`, publicVapidKey, privateVapidKey);

/**
 * Send push notitification to device
 * @param {object} subscription Device subscription data
 * @param {object} data Notification options: title*, body*, url
 */
const sendPush = async (subscription, data, onError) => {
  // Create payload - title, body are required
  const payload = JSON.stringify({
    icon: `${clientUrl}/images/icons/icon-128x128.png`,
    url: `${clientUrl}/prayers`,
    ...(data || {})
  });

  try {
    await webPush.sendNotification(subscription, payload);
  } catch (error) {
    console.error('Error while sending push', error)
    if (onError && typeof(onError) === "function") {
      onError(error)
    }
  }

  return null;
}

module.exports = {
  sendPush
}