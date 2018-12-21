const net = require('net')
const RSA = require('node-rsa')
const { EventEmitter } = require('events')

class RSAClient extends EventEmitter {
  /**
   * @param {string} host Host
   * @param {string} port Port
   * @param {number} [keySize] RSA Key Size
   */
  constructor (host, port, keySize = 512) {
    super()
    this._client = net.createConnection({ host, port })

    /**
     * @type {RSA}
     */
    this._clientKey = new RSA({ b: keySize })

    /**
     * @type {RSA}
     */
    this._serverKey = undefined

    this._client.once('connect', () => {
      this._client.write(`pub:${this._clientKey.exportKey('public')}`)
    })

    this._client.on('data', packet => {
      const [header, data] = packet.toString().split(':')
      if (header === 'pub') {
        this._serverKey = new RSA(data)
        return this.emit('ready')
      }

      if (header === 'data') {
        const decrypted = this._clientKey.decrypt(data)
        const plainText = decrypted.toString()

        this.emit('data', plainText)
        this.emit('raw', decrypted)
      }

      return undefined
    })
  }

  /**
   * @returns {Promise.<void>}
   */
  disconnect () {
    return new Promise(resolve => {
      this._client.end(() => resolve())
    })
  }

  /**
   * @param {string|Buffer} data Data
   * @returns {void}
   */
  send (data) {
    if (this._serverKey === undefined) return undefined

    const encrypted = this._serverKey.encrypt(data, 'base64')
    return this._client.write(`data:${encrypted}`)
  }
}

module.exports = RSAClient
