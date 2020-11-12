const {
  CLIENT_URL = 'https://prayerkeep.com',
  SERVER_URL = 'https://parchmentnotebook.herokuapp.com',
  ADMING_EMAIL = 'rotimiibitoyeemma@gmail.com',
  PUBLIC_VAPID_KEY,
  PRIVATE_VAPID_KEY
} = process.env;

module.exports = {
  clientUrl: CLIENT_URL,
  serverUrl: SERVER_URL,
  adminEmail: ADMING_EMAIL,
  publicVapidKey: PUBLIC_VAPID_KEY,
  privateVapidKey: PRIVATE_VAPID_KEY
}
