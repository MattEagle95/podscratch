const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('./storage/db/db.json')
const db = low(adapter)

console.log(db.get('orders').value())