const logger = require('../logger')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const { checkSellSignalMulti } = require('../signalizer/sellSignal_Multi')

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

const run = (currentPrice) => {
    const profiler = logger.startTimer()
    logger.debug('running sell banker')

    const orders = db.get('orders').value()
    logger.debug(`found ${orders.length} orders`)

    orders.forEach((order) => {
        const {
            status,
            lowLimit,
            lowLimitHit,
            nextLimit
        } = checkSellSignalMulti(order.amount, currentPrice, order.lowLimit, order.lowLimitHit, order.nextLimit)
        if (status === true) {
            logger.info(`${order.id} SELL-SIGNAL)`)
            // sellOrder(order)
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
}

const sellOrder = (order) => {
    try {
        const sellOrderData = await exchange.createMarketSellOrder(config.COIN_CURRENCY, order.amount)

        const trades = await exchange.fetchMyTrades(config.COIN_CURRENCY)
        const sellTrade = trades.find((trade) => trade.order === sellOrderData.id)

        logger.info(
            `${sellTrade.order} - ${sellTrade.cost} ${config.COIN} SOLD FOR ${sellTrade.amount} ${config.CURRENCY} AT PRICE ${sellTrade.price} ${config.CURRENCY}`
        )
    } catch (err) {
        console.error(err)
    }
}

module.exports = {
    run,
}
