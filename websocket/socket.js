/**
 * websocket.js
 *
 * Creates a WebSocket Server and handles basic events...
 *
 *  + connection
 *  + message
 *  + close
 *  + pong
 *
 * ... and sends a ping message to each client every 30 seconds, to
 * trigger a pong message from the client.
 *
 * Incoming messages from users are handled by a separate script.
 * Custom scripts can register listeners for incoming messages.
 */


const { Server, OPEN } = require('ws')
// 0 for CONNECTING
// 1 for OPEN
// 2 for CLOSING
// 3 for CLOSED

const {
  newUser,
  disconnect,
  treatIncoming,
  setUserData,
  getUserData
} = require('./messageHub')

const PING_DELAY = 5000 // 25000

// allUsers = [{ socket, socket_id, ...}, ... ]

const websocket = (server) => {
  const WebSocketServer = new Server({ server })


  // Treat each client connection in its own scope
  WebSocketServer.on('connection', newConnection)


  function newConnection(socket) {
    // socket.isAlive is not a built-in property
    socket.isAlive = true

    // Add an entry to MessageHub's allUsers array
    newUser(socket) // in MessageHub

    // Remember when connection started
    setUserData(socket, { start: + new Date() })


    // Checking that the connection is still open.
    socket.on('pong', heartbeat)


    socket.on('message', raw => {
      if (socket.readyState !== OPEN) {
        return
      }

      let data
      try {
        data = JSON.parse(raw.toString())

      } catch(error) {
        return console.warn(`WS message could not be converted to an object
        ERROR: ${error}
        message: ${raw.toString()}`)
      }

      try {
        treatIncoming(data) // in MessageHub

      } catch(error) {
        console.warn(`WS treatIncoming() failed
        ERROR: ${error}
        data: ${data}`)
      }
    })


    socket.on('close', (code, reason) => {
      console.log("WebSocket closed", {
        code,
        reason: reason.toString(),
        readyState: socket.readyState,
        isAlive: socket.isAlive,
      });

      disconnect(socket)
    })


    socket.on("error", error => {
      console.error('WebSocket error:', error)
    })
  }


  // Heartbeats: ping all sockets on a regular basis //
  // Note: the built-in WebSocketServer.clients object is a Set.

  function heartbeat() {
    this.isAlive = true // this will be a specific socket object
  }

  const pingOne = (socket) => {
    const query = { socket }
    const userData = getUserData(query)
    const { socket_id, user_name, start } = userData

    // Debugging broken connections
    console.log("\nheartbeat", JSON.stringify({
      milliscnds: + new Date() - start,
      readyState: socket.readyState,
      isAlive: "  " + socket.isAlive,
      socket_id: socket_id.slice(0, 8),
      user_name
    }, null, '  '));

    if (!socket.isAlive) {
      console.warn("Terminating unresponsive socket");
      return socket.terminate()
    }

    socket.isAlive = false
    socket.ping()
  }

  const pingAll = () => {
    WebSocketServer.clients.forEach(pingOne)
  }

  const interval = setInterval(pingAll, PING_DELAY)

  // Stop pings when the WebSocketServer itself is closed
  WebSocketServer.on('close', function close() {
    clearInterval(interval)
  })
}


module.exports = websocket
