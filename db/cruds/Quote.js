const QuoteModel = require('../models/quote')

module.exports = {
  addQuote: data => require('./templates/add')(QuoteModel, data),
  getQuote: (params, sort, selectedFields, populateField) =>
    require('./templates/get')(QuoteModel, params, sort, selectedFields, populateField),
  updateQuote: (findField, setField) =>
    require('./templates/update')(QuoteModel, findField, setField),
  deleteQuote: findField =>
    require('./templates/delete')(QuoteModel, findField),
}
