const UserModel = require('../models/user')

module.exports = {
    addUser: data => require('./templates/add')(UserModel, data),
    getUser: (params, sort, selectedFields, populateField) =>
        require('./templates/get')(UserModel, params, sort, selectedFields, populateField),
    updateUser: (findField, setField) =>
        require('./templates/update')(UserModel, findField, setField),
    deleteUser: findField =>
        require('./templates/delete')(UserModel, findField),
}
