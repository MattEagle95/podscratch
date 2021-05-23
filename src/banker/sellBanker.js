const logger = require('../logger')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const { checkSellSignal } = require('../signalizer/sellSignal')
const config = require('../../config.json')

const run = async (currentPrice, db, exchange) => {
    const profiler = logger.startTimer()
    logger.debug('running sell banker')

    const orders = db.get('orders').value()
    logger.debug(`found ${orders.filter(order => order.status === 'buy').length} orders`)

    orders.filter(order => order.status === 'buy').forEach(async (order) => {
        const {
            status,
            lowLimit,
            lowLimitHit,
            nextLimit
        } = checkSellSignal(order.buyInfo.chartPrice, currentPrice, order.lowLimit, order.lowLimitHit, order.nextLimit)
        if (status === true) {
            logger.info(`${order.id} SELL-SIGNAL`)
            // const {
            //     sellTrade,
            //     sellOrderDataId
            // } = await sellOrder(order, exchange)

            // if (sellOrderDataId !== undefined) {

            //     if (sellTrade === undefined) {
            //         logger.warn(`sell trade for sell order [${sellOrderDataId}] not ready`)
            //         db.get('orders')
            //             .find({ id: order.id })
            //             .assign({
            //                 status: 'sell-pending',
            //                 sellInfo: {
            //                     id: sellOrderDataId,
            //                     tradeId: null,
            //                 },
            //             })
            //             .write()
            //     } else {
            //         logger.info('sellTrade')
            //         logger.info(JSON.stringify(sellTrade))
            //         db.get('orders')
            //             .find({ id: order.id })
            //             .assign({
            //                 status: 'sell',
            //                 sellInfo: {
            //                     id: sellOrderDataId,
            //                     tradeId: sellTrade.id,
            //                     timestamp: Date.now(),
            //                     exchangeTimestamp: sellTrade.timestamp,
            //                     amount: sellTrade.amount,
            //                     price: sellTrade.cost,
            //                     chartPrice: sellTrade.price,
            //                     fee: sellTrade.fee
            //                 },
            //             })
            //             .write()
            //     }

            // }
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

const sellOrder = async (order, exchange) => {
    try {
        const sellOrderData = await exchange.createMarketSellOrder(config.COIN_CURRENCY, order.buyInfo.amount)

        const trades = await exchange.fetchMyTrades(config.COIN_CURRENCY)
        const sellTrade = trades.find((trade) => trade.order === sellOrderData.id)

        return {
            sellTrade,
            sellOrderDataId: sellOrderData.id
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

module.exports = {
    run,
}
