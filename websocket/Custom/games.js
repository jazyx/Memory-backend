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
const { getColor } = require('../Utilities/colors.js')


treatMessageListener(
  "add",
  [
    { subject: "LOGIN",
      callback: logIn
    }
  ]
)


const liveGames = new Map()


function getGameObject () {
  let game_object = liveGames.get("memory")
  if (!game_object) {
    game_object = require('./Games/memory.json')
    liveGames.set("memory", game_object)
  }

  return game_object
}


async function logIn(incoming) {
  const {
    sender_id,
    user_name,
    uNiQiD
  } = incoming
  console.log("logIn:", incoming)

  let message =  {
    subject: "LOGGED_IN",
    recipient_id: sender_id,
    user_name
  }
  sendMessage(message)

  const game_object = getGameObject()
  const players = game_object.players
  const exists = players.find(player => (
    player.name.toLowerCase() === user_name.toLowerCase()
  ))

  if (!exists) {
    // Add the new player
    const number = players.length
    const color = getColor({number})
    players.push({
      name: user_name,
      score: 0,
      color
    })
}
  console.log("game_:", game_object)

  message =  {
    subject: "GAME_OBJECT",
    recipient_id: sender_id,
    game_object,
    uNiQiD
  }
  sendMessage(message)
}