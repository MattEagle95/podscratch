// const { checkSellSignal } = require('./src/signalizer/sellSignal')

// const { coinbasepro } = require("ccxt");

// ;(async function main() {
// const ccxt = require('ccxt')

// const exchange = new ccxt.coinbasepro({
//     enableRateLimit: true,
// apiKey: '9c5a2c58ae3113c9c6753ea5b0d62ed3',
// secret: 'hANRIF1mv4Wm7ujYc/YIAcFVxacQ1iNTM7aXnnwOAVwJ80YK0EzWV7WOf7mPVm3+iH8vFSFnWmxf0xgVDX7Ywg==',
// password: 'qg37d3bm4vp',
// })

// await exchange.loadMarkets()

// const tickerData = await exchange.fetchTicker(['BTC/EUR', 'ETH/EUR', 'LTC/EUR'])
// const tickerData = await exchange.fetchOrderBook('BTC/EUR')
// console.log(tickerData)
// const exchangeRate = tickerData.ask

// console.log('exchangeRate: ' + exchangeRate + ' €')

// const orders = await exchange.fetchMyTrades('BTC/EUR')
// const coinsToSell = orders[0].amount
// console.log('coinsToSell: ' + coinsToSell)
// const orderPrice = orders[0].price
// console.log('orderPrice: ' + orderPrice)

// if (checkSellSignal(orderPrice, exchangeRate)) {
//     console.log('SELL SIGNAL')
// } else {
//     console.log('NO SELL SIGNAL')
// }

// try {
//     console.log(
//         await exchange.createMarketSellOrder('BTC/EUR', coinsToSell)
//     )

//     console.log(await exchange.fetchMyTrades('BTC/EUR'))
// } catch (err) {
//     console.error(err)
// }
// })()




// const CoinbasePro = require('coinbase-pro');

// const websocket = new CoinbasePro.WebsocketClient(
//     ['BTC-EUR', 'ETH-EUR'],
//     'wss://ws-feed.pro.coinbase.com',
//     {
//         key: '9c5a2c58ae3113c9c6753ea5b0d62ed3',
//         secret: 'hANRIF1mv4Wm7ujYc/YIAcFVxacQ1iNTM7aXnnwOAVwJ80YK0EzWV7WOf7mPVm3+iH8vFSFnWmxf0xgVDX7Ywg==',
//         passphrase: 'qg37d3bm4vp',
//     },
//     { channels: ['level2', 'level2'] }
// );

// let lastTimestamp = new Date();
// websocket.on('open', data => {
//     console.log('OPEN')
// });

// websocket.on('message', data => {
//     const d = new Date(data.time);
//     d.setSeconds(d.getSeconds() - 5)
//     if (d > lastTimestamp) {
//         console.log('JO')
//         lastTimestamp = new Date()
//     }
// });

// websocket.on('error', err => {
//     /* handle error */
// });
// websocket.on('close', () => {
//     /* ... */
// });


const EventEmitter = require('events')
const eventEmitter = new EventEmitter()
eventEmitter.on('start', () => {
    console.log('started')
})


const eventEmitter2 = new EventEmitter()
eventEmitter2.on('start', () => {
    console.log('started2')
})

eventEmitter.emit('start')