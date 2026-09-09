/**
 * database/seed.js
 */


const { readFile } = require('fs/promises')
const { join } = require('path')

const SEED = join(__dirname, 'images.json')


async function seed(Test) {
  const count = await Test.estimatedDocumentCount()

  if (count) {
    return console.log(`There are ${count} tests in the database`)
  }

  const text = await readFile(SEED, 'utf-8')
  const tests = JSON.parse(text)

  const promises = []

  tests.forEach( testData => {
    const title = testData
    // {
    //   title,
    //   message
    // }

    promises.push(new Promise(addTest))

    function addTest(resolve, reject) {
      new Test(testData)
        .save()
        .then(treatSuccess)
        .catch(treatError)

      function treatSuccess(test) {
        const { title, message } = test
        resolve({ title: `${message ? "✅" : "❌"} ${title}` })
      }

      function treatError(error) {
        reject({ title, saved: false, error })
    }}
  })

  Promise
    .allSettled(promises)
    .then(proceed)

  function proceed (result) {
    const saved = result
      .filter( test => (
        test.status === "fulfilled"
      ))
      .map( test => test.value.title )

    const failed = result
      .filter( test => (
        test.status === "rejected"
      ))
      .map(test => {
        const title = test.reason.title
        const reason = test.reason.error.message

        return { title, reason }
      })

    const message = {}
    if (saved.length) {
      message.saved = saved
    } else {
      message.saved = 0
    }

    if (failed.length) {
      message.failed = failed
    } else {
      message.failed = 0
    }

    console.log("message:", JSON.stringify(message, null, "  ")); 
  }
}


module.exports = seed
