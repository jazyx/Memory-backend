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
const {
  newUser,
  disconnect,
  treatIncoming,
} = require('./messageHub')


const PING_DELAY = 30000



const websocket = (server) => {
  const WebSocketServer = new Server({ server })


  // Treat each client connection in its own scope
  WebSocketServer.on('connection', (socket) => {
    // socket.isAlive is not a built-in property
    socket.isAlive = true


    // Checking that the connection is still open.
    socket.on('pong', heartbeat)


    newUser(socket)


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
        treatIncoming(data)

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
      //   if (!socket.isAlive) {
      //     return socket.terminate()
      //   }

      //   socket.close()
      })
    })


  // Heartbeats: ping all sockets on a regular basis //
  // Note: the built-in WebSocketServer.clients object is a Set.

  function heartbeat() {
    this.isAlive = true // this will be a specific socket object
  }

  const pingOne = (socket) => {
    if (!socket.isAlive) {
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
