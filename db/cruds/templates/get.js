module.exports = (
    mongooseModel,
    params,
    sort = null,
    selectedFields = null,
    populateField = null
) => {
    return new Promise((resolve, reject) => {
      const findResult = mongooseModel.find(params, selectedFields, sort)

      if (populateField && Array.isArray(populateField) && populateField.length) {
        populateField.forEach(aField => {
          const popParam = Array.isArray(aField) ? aField : [aField];
          findResult.populate(...popParam)
        })
      }

      findResult.exec((err, texts) => {
        if (err) reject(`Error while finding text ${err}`)

        resolve(texts)
      });
    })
}
