const CollectionModel = require('../models/collection')

module.exports = {
  addCollection: data => require('./templates/add')(CollectionModel, data),
  getCollection: (params, sort, selectedFields, populateField) =>
    require('./templates/get')(CollectionModel, params, sort, selectedFields, populateField),
  updateCollection: (findField, setField) =>
    require('./templates/update')(CollectionModel, findField, setField),
  deleteCollection: findField =>
    require('./templates/delete')(CollectionModel, findField),
}
