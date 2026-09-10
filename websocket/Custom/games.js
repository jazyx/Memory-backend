/**
 * backend/websocket/Custom/games.js
 */


const {
  // newUser,
  // disconnect,
  // treatIncoming,
  // available for use by custom scripts
  // allUsers,
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
const {
  getSomeFrom,
  shuffle
} = require('../Utilities/arrays.js')

treatMessageListener(
  "add",
  [
    { subject: "LOGIN",
      callback: logIn
    },
    { subject: "NEW_GAME",
      callback: newGame
    },
    { subject: "FLIP_CARD",
      callback: flipCard
    },
    { subject: "REMOVE_PLAYER",
      callback: removePlayer
    },
    { subject: "ACTIVATE_PLAYER",
      callback: activatePlayer
    },
    { subject: "ALLOW_PEEKING",
      callback: allowPeeking
    }
  ]
)


const liveGames = new Map()
const IMAGE_COUNT = 12


function createGameObject(path) {
  const json = require(path)

  const some = getSomeFrom(
    json.all,
    IMAGE_COUNT,
    6,
    true
  )

  const game_object = { ...json }
  delete game_object.all // no longer needed

  const shuffled = shuffle([...some, ...some])
  game_object.cards = shuffled.map(image => (
    { image, turned: 0, found: "" }
  ))
  game_object.to_find = IMAGE_COUNT

  return game_object
}


function getGameObject () {
  let game_object = liveGames.get("memory")
  if (!game_object) {
    game_object = createGameObject('./Games/memory.json')
    liveGames.set("memory", game_object)
  }

  return game_object
}


async function logIn(incoming) {
  const {
    sender_id,
    user_name,
    teacher
  } = incoming

  setUserData(sender_id, { user_name })

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
    const player = {
      name: user_name,
      score: 0,
      color
    }

    if (teacher) {
      player.peek = true
    }

    players.push(player)
  }

  message =  {
    subject: "GAME_OBJECT",
    game_object
  }

  return broadcast(message)
}


async function newGame() {
  let game_object = liveGames.get("memory")
  const players = game_object.players
  players.forEach(player => player.score = 0)

  game_object = createGameObject('./Games/memory.json')
  game_object.players = players
  liveGames.set("memory", game_object)

  message =  {
    subject: "GAME_OBJECT",
    game_object
  }
  return broadcast(message)
}


function flipCard({ flipped, player }) {
  const game_object = liveGames.get("memory")
  const cards = game_object.cards

  let isPair
  const turn_over = game_object.turn_over = flipped.length === 2
  if (!turn_over) {
    // Ensure previously turned cards are placed face down
    game_object.cards = cards.map(card => {
      card.turned = false
      return card
    })

  } else {
    // Check for a pair (+ increased score, game over) or mismatch
    isPair = cards[flipped[0]].image === cards[flipped[1]].image
    game_object.to_find -= isPair

    if (isPair) {
      const playerData = game_object.players.find(data => (
        data.name === player
      ))
      playerData.score += 1

    } else {
      // Next player's turn
      game_object.player = (game_object.player + 1)
                          % game_object.players.length
    }
  }

  game_object.cards = cards.map((card, index) => {
    if (flipped.indexOf(index) > -1) {
      card.turned = true
      if (isPair) {
        card.found = player
      }
    }

    return card
  })

  console.log("\ngame_object.player:", game_object.player)

  const message = {
    subject: "GAME_OBJECT",
    game_object
  }

  return broadcast(message)
}


function removePlayer({ name }) {
  const game_object = liveGames.get("memory")
  const { players, player } = game_object
  const index = players.findIndex(data => data.name === name)
  if (index < 0) { return }

  if (player === index) {
    // Make next player active before removing this one
    game_object.player = (player + 1) % players.length
  }

  players.splice(index, 1)

  const message = {
    subject: "GAME_OBJECT",
    game_object
  }

  return broadcast(message)
}


function activatePlayer({ name }) {
  const game_object = liveGames.get("memory")
  const players = game_object.players
  const index = players.findIndex(data => data.name === name)
  if (index < 0) { return }

  game_object.player = index

  const message = {
    subject: "GAME_OBJECT",
    game_object
  }

  return broadcast(message)
}


function allowPeeking({ name, peek }) {
  const game_object = liveGames.get("memory")
  const players = game_object.players
  const playerData = players.find(data => data.name === name)
  if (!playerData) { return }

  playerData.peek = peek

  const message = {
    subject: "GAME_OBJECT",
    game_object
  }

  return broadcast(message)
}


async function broadcast(message) {
  const query = { socket: "#all" }
  const { sockets: recipients } = getUserSocketsAndGroups(query)
  message.recipients = recipients
  sendMessage(message)

  return true
}