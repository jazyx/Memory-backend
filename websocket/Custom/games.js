/**
 * backend/websocket/Custom/games.js
 */


const {
  treatMessageListener,
  sendMessage,
  updateGroups,
  setUserData,
  getUserData,
  getGroupSockets,
  getUserSocketsAndGroups,
  closeUserSockets
} = require('../messageHub.js')


treatMessageListener(
  "add",
  [
    { subject: "LOGIN",
      callback: logIn
    }
  ]
)


async function logIn(incoming) {
  const {
    sender_id,
    user_name,
    uNiQiD
  } = incoming
  console.log("logIn:", incoming)

  // TODO: Find or create game object, add user_name to players

  const message =  {
    subject: "LOGGED_IN",
    recipient_id: sender_id,
    user_name,
    uNiQiD
  }
  sendMessage(message)
}