const mongoose = require('mongoose')
const { MONGO_URI } = require('../helpers/dbConfig')

module.exports = async () => {
    try {
        mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
    } catch (error) {
        console.error(
            `${__filename}\n${__line}\nDATABASE CONNECTION ERROR\n${error.stack.toString()}`
        )
    }

    mongoose.Promise = global.Promise
    const db = mongoose.connection

    db.on('error', error => {
        console.error(error.stack.toString())
        console.error(`${__filename} ${__line} DATABASE CONNECTION ERROR`)
    })

    db.once('open', () => {
        console.log('DATABASE HAS SUCCESSFULLY BEING OPENED')
    })

    return db
}
