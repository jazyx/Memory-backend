/**
 * backend/controllers/getRecords.js
 */


const { Test } = require('../database')


module.exports = function getRecords(req, res) {
  console.log(`Records requested`)

  let message

  Test.find()
    .then(treatSuccess)
    .catch(treatError)
    .finally(proceed)

  function treatSuccess(records) {
    message = JSON.stringify(records, null, "  ")
  }

  function treatError(error) {
    res.status(500)
    message = `ERROR: getRecords()" failed
${error}`
  }

  function proceed () {
    res.send(message )
  }
}