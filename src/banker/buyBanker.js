const logger = require('../logger')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const { checkBuySignal } = require('../signalizer/buySignal')
const config = require('../../config.json')
const crypto = require("crypto")

const run = async (availableMoney, priceData, lastBoughtTicks, sockets, db, exchange) => {
    const profiler = logger.startTimer()
    logger.debug('running buy banker')

    if (!checkEnoughMoney(availableMoney)) {
        logger.debug(`buy-signal: not enough money`)
        lastBoughtTicks++
    } else {
        if (checkBuySignal(priceData, lastBoughtTicks, sockets)) {
            // const { buyTrade, buyOrderDataId } = await buyOrder(priceData, exchange)

            // if (buyOrderDataId !== undefined) {

            //     if (buyTrade === undefined) {
            //         logger.warn(`buy trade for buy order [${buyOrderDataId}] not ready`)
            //         db.get('orders')
            //             .push({
            //                 id: generateId(db),
            //                 status: 'buy-pending',
            //                 buyInfo: {
            //                     id: buyOrderDataId,
            //                     tradeId: null,
            //                 },
            //                 sellInfo: null,
            //                 lowLimit: config.SIGNALIZER.SELL.LOW_LIMIT,
            //                 lowLimitHit: false,
            //                 nextLimit: parseFloat(config.SIGNALIZER.SELL.LOW_LIMIT) + parseFloat(config.SIGNALIZER.SELL.NEXT_LIMIT)
            //             })
            //             .write()
            //     } else {
            //         logger.info('buyTrade')
            //         logger.info(JSON.stringify(buyTrade))
            //         db.get('orders')
            //             .push({
            //                 id: generateId(db),
            //                 status: 'buy',
            //                 buyInfo: {
            //                     id: buyOrderDataId,
            //                     tradeId: buyTrade.id,
            //                     timestamp: Date.now(),
            //                     exchangeTimestamp: buyTrade.timestamp,
            //                     amount: buyTrade.amount,
            //                     price: buyTrade.cost,
            //                     chartPrice: buyTrade.price,
            //                     fee: buyTrade.fee,
            //                 },
            //                 sellInfo: null,
            //                 lowLimit: config.SIGNALIZER.SELL.LOW_LIMIT,
            //                 lowLimitHit: false,
            //                 nextLimit: parseFloat(config.SIGNALIZER.SELL.LOW_LIMIT) + parseFloat(config.SIGNALIZER.SELL.NEXT_LIMIT)
            //             })
            //             .write()
            //     }

            // } else {
            //     logger.warn(`buyOrderDataId is undefined`)
            // }

            lastBoughtTicks = 0
        } else {
            lastBoughtTicks++
        }
    }

    profiler.done({ message: 'buy banker done' })

    return {
        lastBoughtTicks
    }
}

const buyOrder = async (priceData, exchange) => {
    try {
        const euroToUse = config.BANKER.BUY.BUY_MONEY_AMOUNT
        const exchangeRate = priceData[priceData.length - 1].bid

        const amountToBuy = (euroToUse / exchangeRate)
        logger.info('buy-signal: buying euro: ' + euroToUse + ` ${config.CURRENCY}`)
        logger.info('buy-signal: buying exchangeRate: ' + exchangeRate + ` ${config.CURRENCY}`)
        logger.info('buy-signal: buying amountToBuy: ' + amountToBuy + ` ${config.COIN}`)

        const buyOrderData = await exchange.createMarketBuyOrder(config.COIN_CURRENCY, amountToBuy)

        const trades = await exchange.fetchMyTrades(config.COIN_CURRENCY)
        const buyTrade = trades.find((trade) => trade.order === buyOrderData.id)

        return {
            buyTrade,
            buyOrderDataId: buyOrderData.id
        }
    } catch (err) {
        logger.error(err)
        console.error(err)
    }

    return {
        undefined,
        undefined
    }
}

const checkEnoughMoney = (moneyAvailable) => {
    return moneyAvailable >= config.BANKER.BUY.BUY_MONEY_AMOUNT
}

const generateId = (db) => {
    let id = crypto.randomBytes(5).toString('hex')
    while (db.get('orders').value().filter(order => order.id === id).length > 0) {
        id = crypto.randomBytes(5).toString('hex')
    }

    return id
}

module.exports = {
    run,
}
