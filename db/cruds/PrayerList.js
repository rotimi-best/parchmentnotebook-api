const PrayerListModel = require('../models/prayerList')

module.exports = {
  addPrayerList: data => require('./templates/add')(PrayerListModel, data),
  getPrayerList: (params, sort, selectedFields) =>
    require('./templates/get')(PrayerListModel, params, sort, selectedFields),
  updatePrayerList: (findField, setField) =>
    require('./templates/update')(PrayerListModel, findField, setField),
  deletePrayerList: findField =>
    require('./templates/delete')(PrayerListModel, findField),
}
