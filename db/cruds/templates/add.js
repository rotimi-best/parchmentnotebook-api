module.exports = (mongooseModel, data) => {
    return new Promise(async (resolve, reject) => {
        if (Array.isArray(data) && data.length) {
            for (const objectData of data) {
                try {
                    await new mongooseModel(objectData).save();
                } catch (error) {
                    reject(`Error inserting into ${model}: ${err}`)
                }
            }
            resolve()
        } else {
            mongooseModel.create(data, (err, res) => {
                if (err) reject(`Error inserting into ${model}: ${err}`)

                resolve(res)
            })
        }
    })
}
