const express = require('express')
const logger = require('./logger')
const app = express()
const httpServer = require('http').createServer(app)
const config = require('../config')
const buyBanker = require('./banker/buyBanker')
const sellBanker = require('./banker/sellBanker')
const ccxt = require('ccxt')
const table = require('text-table')
const packageJson = require('../package.json')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const figlet = require('figlet')

app.use(express.static('public'))
const io = require('socket.io')(httpServer)

const adapter = new FileSync('./storage/db/db.json')
const db = low(adapter)

let SOCKETS = []
let PRICE_DATA = []
let PRICE_DATA_HISTORY = []
let BALANCE_DATA = []
let LAST_BOUGHT_TICKS = config.SIGNALIZER.BUY.NEEDS_MIN_TICKS_FOR_NEXT_BUY

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
        priceData: PRICE_DATA_HISTORY,
        orders: db.get('orders')
    })
})

httpServer.listen(3000)

    ; (async function main() {
        logger.info(`\n${figlet.textSync('Money Printer')}`)
        logger.info(`version ${packageJson.version}`)

        const exchange = new ccxt.coinbasepro({
            enableRateLimit: true,
            apiKey: process.env.COINBASE_API_KEY,
            secret: process.env.COINBASE_API_SECRET,
            password: process.env.COINBASE_API_PASSPHRASE,
        })

        try {
            exchange.checkRequiredCredentials()
            const status = await exchange.fetchStatus((params = {}))
            if (status.status !== 'ok') {
                throw new Error('❌ api offline')
            }

            await exchange.loadMarkets()

            logger.info('✅ api online')

            const balance = await exchange.fetchBalance((params = {}))
            BALANCE_DATA = balance

            if (BALANCE_DATA.free[config.CURRENCY] > 0) {
                logger.info(`✅ money for trading available (${BALANCE_DATA.free[config.CURRENCY]} ${config.CURRENCY_SYMBOL})`)
            } else {
                logger.warn(`ℹ no money available for trading`)
            }

            const orders = await exchange.fetchMyTrades(config.COIN_CURRENCY)

            logger.info(`----- exchange data -----`)
            let t = table([
                ['> money total', `${BALANCE_DATA.total[config.CURRENCY].toFixed(2)} ${config.CURRENCY_SYMBOL}`],
                [
                    '> money available',
                    `${BALANCE_DATA.free[config.CURRENCY].toFixed(2)} ${config.CURRENCY_SYMBOL}`,
                ],
                ['> coins total', `${BALANCE_DATA.total[config.COIN]} ${config.COIN}`],
                ['> coins available', `${BALANCE_DATA.free[config.COIN]} ${config.COIN}`],
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

            logger.info(`update interval: ${config.UPDATE.INTERVAL_MS}ms`)
        } catch (error) {
            logger.error(error)
            process.exit(1)
        }

        setInterval(async () => {
            const updateProfiler = logger.startTimer()

            try {
                // UPDATE PREIS
                const tickerData = await exchange.fetchTicker(config.COIN_CURRENCY)
                PRICE_DATA.push({
                    bid: tickerData.bid,
                    ask: tickerData.ask
                })
                PRICE_DATA_HISTORY.push({
                    timestamp: tickerData.timestamp,
                    bid: tickerData.bid,
                    ask: tickerData.ask
                })

                if (PRICE_DATA.length > config.SIGNALIZER.MIN_PRICE_DATA) {
                    PRICE_DATA = PRICE_DATA.slice(1, PRICE_DATA.length)
                }

                // UPDATE BALANCE
                const balance = await exchange.fetchBalance((params = {}))
                BALANCE_DATA = balance

                // SELLING
                await sellBanker.run(PRICE_DATA[PRICE_DATA.length - 1].ask)

                // TODO: RELOAD VON BALANCE

                // BUYING
                const { lastBoughtTicks } = await buyBanker.run(BALANCE_DATA.free[config.CURRENCY].toFixed(2), PRICE_DATA, LAST_BOUGHT_TICKS, SOCKETS)
                LAST_BOUGHT_TICKS = lastBoughtTicks

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
                        priceData: {
                            timestamp: tickerData.timestamp,
                            bid: tickerData.bid,
                            ask: tickerData.ask
                        },
                        orders: db.get('orders')
                    })
                })
            } catch (error) {
                logger.error(error)
            }

            updateProfiler.done({
                message: `update - freeMoney: ${BALANCE_DATA.free[config.CURRENCY].toFixed(2)} ${config.CURRENCY_SYMBOL
                    } totalMoney: ${BALANCE_DATA.total[config.CURRENCY].toFixed(2)} ${config.CURRENCY_SYMBOL
                    } - freeCoin: ${BALANCE_DATA.free[config.COIN]} ${config.COIN} totalCoin: ${BALANCE_DATA.total[config.COIN]} ${config.COIN
                    } - ${config.COIN_CURRENCY} ${PRICE_DATA_HISTORY[PRICE_DATA_HISTORY.length - 1].bid} ${config.CURRENCY_SYMBOL}`
            })
        }, config.UPDATE.INTERVAL_MS)
    })()
