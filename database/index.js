/**
 * database/index.js
 *
 * Uses the mongoose module to connect to the MongoDB database
 * and imports all the models that mongoose will need.
 *
 * Exports an object with entries for mongoose and all the models.
 */


const { DB, dbName } = process.env
const bd = DB.replace(/:\/\/.+@/, "://<username>:<password>@")

const mongoose = require('mongoose')
const {
  Test,
  User,
  Room,
  Message
} = require("./models")

const seed = require('./seed.js')


mongoose
  .connect(DB, { dbName })
  .then(() => {
    console.log(`Connected to ${bd}`)
    seed(Test)

  })
  .catch( error => {
    console.log("DB connection ERROR:",
error)
    process.exit()
  })


const db = {
  mongoose,
  Test,
  User,
  Room,
  Message
}


module.exports = db
