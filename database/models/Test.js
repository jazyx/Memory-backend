/**
 * database/models/Test.js
*/

const { Schema, model } = require('mongoose')

const required = true

const schema = Schema({
  title:     { type: String, required },
  message:   { type: String, required },
})

const Test = model("Test", schema)

module.exports = Test