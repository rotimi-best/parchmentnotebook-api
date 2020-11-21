const StoryModel = require('../models/story')

module.exports = {
  addStory: data => require('./templates/add')(StoryModel, data),
  getStory: (params, sort, selectedFields, populateField) =>
    require('./templates/get')(StoryModel, params, sort, selectedFields, populateField),
  updateStory: (findField, setField) =>
    require('./templates/update')(StoryModel, findField, setField),
  deleteStory: findField =>
    require('./templates/delete')(StoryModel, findField),
}
