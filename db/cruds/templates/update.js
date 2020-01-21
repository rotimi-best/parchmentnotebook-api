module.exports = (mongooseModel, findField, setField) => {
    return new Promise((resolve, reject) => {
      const updateReq = setField.$push || setField.$pull ? setField : { $set: setField };

        mongooseModel.updateMany(findField, updateReq, (err, res) => {
            if (err) reject(`Error updating a Text field ${err}`)

            resolve(res)
        })
    })
}
