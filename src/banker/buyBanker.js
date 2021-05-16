const logger = require('../logger')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const { checkBuySignal } = require('../signalizer/buySignal')
const config = require('../../config.json')

const adapter = new FileSync('./storage/db/db.json')
const db = low(adapter)

/*
{
    id,
    timestamp,
    amount,
    lowLimit,
    nextLimit
}
*/
db.defaults({ orders: [] }).write()

const run = async (availableMoney, priceData, lastBoughtTicks, sockets) => {
    const profiler = logger.startTimer()
    logger.debug('running buy banker')

    if (!checkEnoughMoney(availableMoney)) {
        logger.debug(`buy-signal: not enough money`)
        lastBoughtTicks++
    } else {
        if (checkBuySignal(priceData, lastBoughtTicks, sockets)) {
            // const buyTrade = await buyOrder(config.BANKER.BUY.BUY_MONEY_AMOUNT)
            // db.get('orders')
            //     .push({
            //         id: buyTrade.id,
            //         status: 'buy',
            //         buyInfo: {
            //             id: buyTrade.id,
            //             timestamp: buyTrade.timestamp,
            //             amount: buyTrade.amount,
            //             price: buyTrade.cost,
            //             chartPrice: buyTrade.price,
            //         },
            //         sellInfo: null,
            //         lowLimit: config.SIGNALIZER.SELL.LOW_LIMIT,
            //         lowLimitHit: false,
            //         nextLimit: parseFloat(config.SIGNALIZER.SELL.LOW_LIMIT) + parseFloat(config.SIGNALIZER.SELL.NEXT_LIMIT)
            //     })
            //     .write()
            db.get('orders')
                .push({
                    id: Math.random(),
                    status: 'buy',
                    buyInfo: {
                        id: Math.random(),
                        timestamp: Date.now(),
                        amount: 0.00125,
                        price: 5,
                        chartPrice: priceData[priceData.length - 1].bid,
                    },
                    sellInfo: null,
                    lowLimit: config.SIGNALIZER.SELL.LOW_LIMIT,
                    lowLimitHit: false,
                    nextLimit: parseFloat(config.SIGNALIZER.SELL.LOW_LIMIT) + parseFloat(config.SIGNALIZER.SELL.NEXT_LIMIT)
                })
                .write()
            lastBoughtTicks = 0
            logger.info('buy-signal: I WOULD HAVE BOUGHT THAT!')
        } else {
            lastBoughtTicks++
        }
    }

    profiler.done({ message: 'buy banker done' })

    return {
        lastBoughtTicks
    }
}

const buyOrder = async (amount) => {
    try {
        const buyOrderData = await exchange.createMarketBuyOrder(config.COIN_CURRENCY, amount)

        const trades = await exchange.fetchMyTrades(config.COIN_CURRENCY)
        const buyTrade = trades.find((trade) => trade.order === buyOrderData.id)

        logger.info(
            `${buyTrade.order} - ${buyTrade.amount} ${buyTrade.COIN} BOUGHT FOR ${buyTrade.cost} ${config.CURRENCY} AT PRICE ${buyTrade.price} ${config.CURRENCY}`
        )

        return buyTrade
    } catch (err) {
        console.error(err)
    }

    return null
}

const checkEnoughMoney = (moneyAvailable) => {
    return moneyAvailable >= config.BANKER.BUY.BUY_MONEY_AMOUNT
}

module.exports = {
    run,
}
