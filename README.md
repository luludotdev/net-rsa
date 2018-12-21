# Net-RSA
*Client / Server implementation using Node.js `net` and `node-rsa` for asymmetric encryption.*

## WARNING
This was made as a hobby project, it is not recommended for production use. No support will be provided, use at your own discretion.

## Usage
### Server
```js
// Init the server with a key size of 512
const server = new RSAServer(512)

// Start listening for connections
server.listen(3000)
```

#### Methods
##### `listen(port: number): Promise.<void>`
Start listening for connections on `port`

##### `close(): Promise.<void>`
Stop listening for connections and disconnect all clients

##### `send(socket: Socket, data: string|Buffer): void`
Send data to a specific client

##### `broadcast(socket: Socket, data: string|Buffer): void`
Send data to all clients

#### Events
| Name | Args | Description |
| - | - | - |
| `ready` | `void` | Called when the server is ready to handle connections |
| `data` | `{ socket: Socket, body: string }` | Emitted when data is recieved from a client |
| `raw` | `{ socket: Socket, body: Buffer }` | Same as `data` but with the raw Buffer object |

### Client
```js
// Init the client with a key size of 512
const client = new RSAClient('localhost', 3000, 512)

client.on('ready', () => {
  client.send('hello')
})
```

#### Methods
##### `disconnect(): Promise.<void>`
Disconnect from the server

##### `send(data: string|Buffer): void`
Send data to the server

#### Events
| Name | Args | Description |
| - | - | - |
| `ready` | `void` | Called when the client is connected to the server, after key exchanges |
| `data` | `{ socket: Socket, body: string }` | Emitted when data is recieved from the server |
| `raw` | `{ socket: Socket, body: Buffer }` | Same as `data` but with the raw Buffer object |
