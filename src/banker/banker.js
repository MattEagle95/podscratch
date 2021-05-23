const logger = require('../logger');
const config = require('../../config.json')

const refreshPendingOrders = async (exchange, db) => {
    const openBuyOrders = db.get('orders').value().filter(order => order.status === 'buy-pending')
    const openSellOrders = db.get('orders').value().filter(order => order.status === 'sell-pending')

    if (openBuyOrders.length > 0 || openSellOrders.length > 0) {
        const trades = await exchange.fetchMyTrades(config.COIN_CURRENCY)
        logger.info(`refreshing pending orders (buy: ${openBuyOrders.length}, sell: ${openSellOrders.length})`)

        openBuyOrders.forEach(order => {
            const orderTrade = trades.find(trade => trade.order === order.buyInfo.id)
            if (orderTrade !== undefined) {
                logger.info(`pending buy order [${orderTrade.id}] refreshed`)
                db.get('orders')
                    .find({ id: order.id })
                    .assign({
                        status: 'buy',
                        buyInfo: {
                            tradeId: orderTrade.id,
                            timestamp: Date.now(),
                            exchangeTimestamp: orderTrade.timestamp,
                            amount: orderTrade.amount,
                            price: orderTrade.cost,
                            chartPrice: orderTrade.price,
                            fee: orderTrade.fee,
                        },
                    })
                    .write()
            }
        });

        openSellOrders.forEach(order => {
            const orderTrade = trades.find(trade => trade.order === order.sellInfo.id)
            if (orderTrade !== undefined) {
                logger.info(`pending sell order [${orderTrade.id}] refreshed`)
                db.get('orders')
                    .find({ id: order.id })
                    .assign({
                        status: 'sell',
                        sellInfo: {
                            tradeId: orderTrade.id,
                            timestamp: Date.now(),
                            exchangeTimestamp: orderTrade.timestamp,
                            amount: orderTrade.amount,
                            price: orderTrade.cost,
                            chartPrice: orderTrade.price,
                            fee: orderTrade.fee
                        },
                    })
                    .write()
            }
        });
    }

    return;
}

module.exports = {
    refreshPendingOrders
}