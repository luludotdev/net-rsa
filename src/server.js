const net = require('net')
const RSA = require('node-rsa')
const { EventEmitter } = require('events')

class RSAServer extends EventEmitter {
  /**
   * @param {number} [keySize] RSA Key Size
   */
  constructor (keySize = 512) {
    super()
    this._key = new RSA({ b: keySize })

    /**
     * @type {Map<net.Socket, RSA>}
     */
    this._clients = new Map()

    this._server = net.createServer(socket => {
      socket.name = `${socket.remoteAddress}:${socket.remotePort}`

      socket.on('data', packet => {
        const [header, data] = packet.toString().split(':')
        if (header === 'pub') {
          const pubKey = new RSA(data)
          this._clients.set(socket, pubKey)

          return socket.write(`pub:${this._key.exportKey('public')}`)
        }

        if (header === 'data') {
          const decrypted = this._key.decrypt(data)
          const plainText = decrypted.toString()

          this.emit('data', { socket, body: plainText })
          this.emit('raw', { socket, body: decrypted })
        }

        return undefined
      })

      socket.on('end', () => this._clients.delete(socket))
    })
  }

  /**
   * @param {number} port Port
   * @returns {Promise.<void>}
   */
  listen (port) {
    return new Promise((resolve, reject) => {
      this._server.listen(port, err => {
        if (err) return reject(err)

        this.emit('ready')
        return resolve()
      })
    })
  }

  close () {
    return new Promise(resolve => {
      for (const socket of this._clients.keys()) {
        socket.destroy()
        this._clients.delete(socket)
      }

      this._server.close(() => resolve())
    })
  }

  /**
   * @param {net.Socket} socket Socket
   * @param {string|Buffer} data Data
   * @returns {void}
   */
  send (socket, data) {
    const key = this._clients.get(socket)
    if (key === undefined) return undefined

    const encrypted = key.encrypt(data, 'base64')
    return socket.write(`data:${encrypted}`)
  }

  /**
   * @param {string|Buffer} data Data
   * @returns {void}
   */
  broadcast (data) {
    for (const socket of this._clients.keys()) {
      this.send(socket, data)
    }
  }
}

module.exports = RSAServer
