const PrayerModel = require('../models/prayer')

module.exports = {
  addPrayer: data => require('./templates/add')(PrayerModel, data),
  getPrayer: (params, sort, selectedFields) =>
    require('./templates/get')(PrayerModel, params, sort, selectedFields),
  updatePrayer: (findField, setField) =>
    require('./templates/update')(PrayerModel, findField, setField),
  deletePrayer: findField =>
    require('./templates/delete')(PrayerModel, findField),
}
