const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('./storage/db/db.json')
const db = low(adapter)

db.get('orders')
.push({
    id: Math.random(),
    status: 'buy',
    buyInfo: {
        id: Math.random(),
        timestamp: Date.now(),
        amount: 0.00125,
        price: 5,
        chartPrice: 12321312,
    },
    sellInfo: null,
    lowLimit: 123,
    lowLimitHit: false,
    nextLimit: 123
})
.write()