const express = require('express')
const logger = require('./logger')
const app = express()
const httpServer = require('http').createServer(app)
const config = require('../config')
const buyBanker = require('./banker/buyBanker')
const sellBanker = require('./banker/sellBanker')

const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('./storage/db/db.json')
const db = low(adapter)

app.use(express.static('public'))

const options = {
    /* ... */
}
const io = require('socket.io')(httpServer, options)

let SOCKETS = []
let PRICE_DATA = []
let PRICE_DATA_HISTORY = []
let KRAKEN_PRICE_DATA_WITH_TIMESTAMPS = []
let BUY_SIGNAL_DATA = []
let SELL_SIGNAL_DATA = []
let BUY_EVENTS = []
let BALANCE_DATA = []

io.on('connection', (socket) => {
    logger.info('socket for visualization connected')
    SOCKETS.push(socket)
    let balanceData = {}
    if (BALANCE_DATA.length > 0) {
        balanceData = {
            totalMoney: BALANCE_DATA.total[config.CURRENCY].toFixed(2),
            freeMoney: BALANCE_DATA.free[config.CURRENCY].toFixed(2),
            totalCoins: BALANCE_DATA.total[config.COIN],
            freeCoins: BALANCE_DATA.free[config.COIN],
        }
    }
    socket.emit('setup', {
        balance: balanceData,
        coinbase: PRICE_DATA_HISTORY,
        kraken: KRAKEN_PRICE_DATA_WITH_TIMESTAMPS,
        buySignal: BUY_SIGNAL_DATA,
        sellSignal: SELL_SIGNAL_DATA,
        buyEvents: BUY_EVENTS,
    })
})

httpServer.listen(3000)
    ; (async function main() {
        const ccxt = require('ccxt')
        const logger = require('./logger')
        const table = require('text-table')
        const { checkEnoughMoney } = require('./banker/banker')
        const { checkBuySignal } = require('./signalizer/buySignal')
        const packageJson = require('../package.json')

        let LAST_BOUGHT_TICKS = config.SIGNALIZER.BUY.NEEDS_MIN_TICKS_FOR_NEXT_BUY

        var figlet = require('figlet')

        logger.info(`\n${figlet.textSync('Money Printer')}`)
        logger.info(`version ${packageJson.version}`)

        const exchange = new ccxt.coinbasepro({
            enableRateLimit: true,
            apiKey: process.env.COINBASE_API_KEY,
            secret: process.env.COINBASE_API_SECRET,
            password: process.env.COINBASE_API_PASSPHRASE,
        })

        const krakenExchange = new ccxt.kraken({
            enableRateLimit: true,
        })

        try {
            exchange.checkRequiredCredentials()
            const status = await exchange.fetchStatus((params = {}))
            if (status.status !== 'ok') {
                throw new Error('api offline')
            }

            await exchange.loadMarkets()
            await krakenExchange.loadMarkets()

            logger.info('api online')

            const balance2 = await exchange.fetchBalance((params = {}))
            const availableMoney2 = balance2.free[config.CURRENCY]
            const totalMoney2 = balance2.total[config.CURRENCY]
            const availableCoin2 = balance2.free[config.COIN]
            const totalCoin2 = balance2.total[config.COIN]
            BALANCE_DATA = balance2

            const orders = await exchange.fetchMyTrades(config.COIN_CURRENCY)

            let t = table([
                ['> money in da bank', `${totalMoney2} ${config.CURRENCY_SYMBOL}`],
                [
                    '> money available',
                    `${availableMoney2} ${config.CURRENCY_SYMBOL}`,
                ],
                ['> coins in da bank', `${totalCoin2} ${config.COIN}`],
                ['> coins available', `${availableCoin2} ${config.COIN}`],
                ['----------', ``],
                ['> orders', `${orders.length}`],
                [
                    '> open orders',
                    `${orders.filter((x) => x.status === 'open').length}`,
                ],
                [
                    '> closed orders',
                    `${orders.filter((x) => x.status === 'closed').length}`,
                ],
                [
                    '> canceled orders',
                    `${orders.filter((x) => x.status === 'canceled').length}`,
                ],
            ])

            logger.info(`\n${t}`)
        } catch (error) {
            logger.error(error)
            process.exit(1)
        }

        logger.info(`update interval: ${config.UPDATE.INTERVAL_MS}ms`)

        setInterval(async () => {
            const updateProfiler = logger.startTimer()

            try {
                // UPDATE PREIS
                const tickerData = await exchange.fetchTicker(config.COIN_CURRENCY)
                PRICE_DATA.push(tickerData.bid)
                PRICE_DATA_HISTORY.push({
                    timestamp: tickerData.timestamp,
                    price: tickerData.bid,
                })

                if (PRICE_DATA.length > config.SIGNALIZER.MIN_PRICE_DATA) {
                    PRICE_DATA = PRICE_DATA.slice(1, PRICE_DATA.length)
                }

                // UPDATE BALANCE
                const balance = await exchange.fetchBalance((params = {}))
                BALANCE_DATA = balance

                // SELLING
                await sellBanker.run(PRICE_DATA[PRICE_DATA.length - 1])

                // TODO: RELOAD VON BALANCE

                // BUYING
                const { lastBoughtTicks } = await buyBanker.run(BALANCE_DATA.free[config.CURRENCY].toFixed(2), PRICE_DATA, LAST_BOUGHT_TICKS, SOCKETS)
                LAST_BOUGHT_TICKS = lastBoughtTicks

                // LADE ORDERS NEU
                BUY_SIGNAL_DATA.push(null)
                SELL_SIGNAL_DATA.push(null)

                // SEND UPDATE
                SOCKETS.forEach((socket) => {
                    socket.emit('update', {
                        balance: {
                            totalMoney:
                                BALANCE_DATA.total[config.CURRENCY].toFixed(2),
                            freeMoney:
                                BALANCE_DATA.free[config.CURRENCY].toFixed(2),
                            totalCoins: BALANCE_DATA.total[config.COIN],
                            freeCoins: BALANCE_DATA.free[config.COIN],
                        },
                        coinbase: {
                            timestamp: tickerData.timestamp,
                            price: tickerData.bid,
                        },
                        buySignal: null,
                        sellSignal: null,
                        buyEvents: BUY_EVENTS,
                    })
                })
            } catch (error) {
                logger.error(error)
            }

            updateProfiler.done({
                message: `update - freeMoney: ${availableMoney} ${config.CURRENCY_SYMBOL
                    } totalMoney: ${totalMoney} ${config.CURRENCY_SYMBOL
                    } - freeCoin: ${availableCoin} ${config.COIN} totalCoin: ${totalCoin} ${config.COIN
                    } - ${config.COIN_CURRENCY} ${tickerData
                        ? `${tickerData.bid} ${config.CURRENCY_SYMBOL}`
                        : 'undefined'
                    } - ${addToMsg}`,
            })
        }, config.UPDATE.INTERVAL_MS)
    })()
