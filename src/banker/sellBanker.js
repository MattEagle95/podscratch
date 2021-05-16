const logger = require('../logger')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const { checkSellSignal } = require('../signalizer/sellSignal')
const config = require('../../config.json')

const adapter = new FileSync('./storage/db/db.json')
const db = low(adapter)

db.defaults({ orders: [] }).write()

const run = async (currentPrice) => {
    const profiler = logger.startTimer()
    logger.debug('running sell banker')

    const orders = db.get('orders').value()
    logger.debug(`found ${orders.length} orders`)

    orders.forEach(async (order) => {
        const {
            status,
            lowLimit,
            lowLimitHit,
            nextLimit
        } = checkSellSignal(order.buyInfo.amount, currentPrice, order.lowLimit, order.lowLimitHit, order.nextLimit)
        if (status === true) {
            logger.info(`${order.id} SELL-SIGNAL)`)
            // const sellTrade = await sellOrder(order)
            // db.get('orders')
            //     .find({ id: order.id })
            //     .assign({
            //         status: 'sell',
            //         sellInfo: {
            //             id: sellTrade.id,
            //             timestamp: sellTrade.timestamp,
            //             amount: sellTrade.amount,
            //             price: sellTrade.cost,
            //             chartPrice: sellTrade.price,
            //         },
            //     })
            //     .write()
                db.get('orders')
                .find({ id: order.id })
                .assign({
                    status: 'sell',
                    sellInfo: {
                        id: Math.random(),
                        timestamp: Date.now(),
                        amount: 0.00125,
                        price: 5,
                        chartPrice: 12345,
                    },
                })
                .write()
        } else {
            db.get('orders')
                .find({ id: order.id })
                .assign({
                    lowLimit: lowLimit,
                    lowLimitHit: lowLimitHit,
                    nextLimit: nextLimit
                })
                .write()
        }
    })

    profiler.done({ message: 'sell banker done' })

    return
}

const sellOrder = async (order) => {
    try {
        const sellOrderData = await exchange.createMarketSellOrder(config.COIN_CURRENCY, order.amount)

        const trades = await exchange.fetchMyTrades(config.COIN_CURRENCY)
        const sellTrade = trades.find((trade) => trade.order === sellOrderData.id)

        logger.info(
            `${sellTrade.order} - ${sellTrade.cost} ${config.COIN} SOLD FOR ${sellTrade.amount} ${config.CURRENCY} AT PRICE ${sellTrade.price} ${config.CURRENCY}`
        )

        return sellTrade
    } catch (err) {
        console.error(err)
    }
}

module.exports = {
    run,
}
