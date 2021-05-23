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
const cors = require('cors')
const { refreshPendingOrders } = require('./banker/banker')
const { fetchTickerData } = require('./worker/tickerWorker')
const fs = require('fs');

app.use(express.static('public'))
app.use(cors())
const io = require('socket.io')(httpServer, {
    cors: {
        methods: ["GET", "POST"],
    }
})

const adapter = new FileSync('storage/db/db.json')
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
        priceData: PRICE_DATA_HISTORY.find(x => x.symbol === config.COIN_CURRENCY) ? PRICE_DATA_HISTORY.find(x => x.symbol === config.COIN_CURRENCY).data : [],
        orders: db.get('orders').value(),
        lastBoughtTicks: LAST_BOUGHT_TICKS,
        lastBoughtTicksNeeded: config.SIGNALIZER.BUY.NEEDS_MIN_TICKS_FOR_NEXT_BUY,
        coin: config.COIN,
        coinCurrency: config.COIN_CURRENCY,
        tickers: config.TICKER,
        newPriceData: PRICE_DATA_HISTORY
    })
})

httpServer.listen(3001)

    ; (async function main() {
        logger.info(`\n${figlet.textSync('Money Printer')}`)
        logger.info(`version ${packageJson.version}`)

        const EventEmitter = require('events')
        const eventEmitter = new EventEmitter()

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

            logger.info(`ticker update interval: ${config.TICKER_UPDATE_INTERVAL_MS}ms`)
        } catch (error) {
            logger.error(error)
            process.exit(1)
        }

        // FETCH TICKER
        try {
            fetchTickerData(eventEmitter)
            let lastSaveTimestamp = new Date()
            let tickerToSave = []

            config.TICKER.forEach(configTicker => {
                PRICE_DATA.push({
                    symbol: configTicker.symbol,
                    data: []
                })

                PRICE_DATA_HISTORY.push({
                    symbol: configTicker.symbol,
                    data: []
                })

                tickerToSave.push({
                    symbol: configTicker.symbol,
                    data: []
                })
            })

            eventEmitter.on('ticker', (ticker) => {
                config.TICKER.forEach(configTicker => {
                    let pd = PRICE_DATA.find(x => x.symbol === configTicker.symbol).data
                    pd.push(ticker.find(x => x.symbol === configTicker.symbol))
                    if (pd.length > config.SIGNALIZER.MAX_PRICE_DATA) {
                        pd = pd.slice(1, pd.length)
                    }

                    let pdh = PRICE_DATA_HISTORY.find(x => x.symbol === configTicker.symbol).data
                    pdh.push(ticker.find(x => x.symbol === configTicker.symbol))
                    if (pdh.length > config.SIGNALIZER.MAX_PRICE_DATA) {
                        pdh = pdh.slice(1, pdh.length)
                    }

                    tickerToSave.find(x => x.symbol === configTicker.symbol).data.push(ticker.find(x => x.symbol === configTicker.symbol))
                })

                let dateToCheck = new Date()
                dateToCheck.setMinutes(dateToCheck.getMinutes() - config.TICKER_SAVE_INTERRVAL_MINUTES)
                if (lastSaveTimestamp < dateToCheck) {

                    console.log('SAVE FILE')

                    let time = new Date()

                    const tts = [...tickerToSave]
                    tickerToSave = []
                    config.TICKER.forEach(configTicker => {
                        tickerToSave.push({
                            symbol: configTicker.symbol,
                            data: []
                        })
                    })
                    lastSaveTimestamp = new Date()

                    fs.writeFile(`storage/db/ticker/${time.getMonth() + 1}-${time.getDate()}-${time.getHours()}-${time.getMinutes()}-${time.getSeconds()}.json`, JSON.stringify(tts), function (err) {
                        if (err) {
                            return console.log(err);
                        }

                        console.log("The file was saved!");
                    });

                }
            })
        } catch (err) {
            logger.error(err);
        }

        setInterval(async () => {
            const updateProfiler = logger.startTimer()

            try {
                // UPDATE BALANCE
                const balance = await exchange.fetchBalance((params = {}))
                BALANCE_DATA = balance

                // REFRESH PENDING ORDERS
                await refreshPendingOrders(exchange, db)

                // SELLING
                await sellBanker.run(PRICE_DATA.find(x => x.symbol === config.COIN_CURRENCY).data[PRICE_DATA.find(x => x.symbol === config.COIN_CURRENCY).data.length - 1].ask, db, exchange)

                // TODO: RELOAD VON BALANCE

                // BUYING
                const { lastBoughtTicks } = await buyBanker.run(BALANCE_DATA.free[config.CURRENCY].toFixed(2), PRICE_DATA.find(x => x.symbol === config.COIN_CURRENCY).data, LAST_BOUGHT_TICKS, SOCKETS, db, exchange)
                LAST_BOUGHT_TICKS = lastBoughtTicks

                // SEND 
                SOCKETS.forEach((socket) => {
                    const orders = db.get('orders').value()
                    socket.emit('update', {
                        balance: {
                            totalMoney:
                                BALANCE_DATA.total[config.CURRENCY].toFixed(2),
                            freeMoney:
                                BALANCE_DATA.free[config.CURRENCY].toFixed(2),
                            totalCoins: BALANCE_DATA.total[config.COIN],
                            freeCoins: BALANCE_DATA.free[config.COIN],
                        },
                        priceData: PRICE_DATA_HISTORY.find(x => x.symbol === config.COIN_CURRENCY).data,
                        orders: orders,
                        lastBoughtTicks: LAST_BOUGHT_TICKS,
                        lastBoughtTicksNeeded: config.SIGNALIZER.BUY.NEEDS_MIN_TICKS_FOR_NEXT_BUY,
                        coin: config.COIN,
                        coinCurrency: config.COIN_CURRENCY,
                        tickers: config.TICKER,
                        newPriceData: PRICE_DATA_HISTORY
                    })
                })
            } catch (error) {
                logger.error(error)
            }

            updateProfiler.done({
                message: `update - freeMoney: ${BALANCE_DATA.free[config.CURRENCY].toFixed(2)} ${config.CURRENCY_SYMBOL
                    } totalMoney: ${BALANCE_DATA.total[config.CURRENCY].toFixed(2)} ${config.CURRENCY_SYMBOL
                    } - freeCoin: ${BALANCE_DATA.free[config.COIN]} ${config.COIN} totalCoin: ${BALANCE_DATA.total[config.COIN]} ${config.COIN
                    }`
            })
        }, config.UPDATE_INTERVAL_MS)
    })()
