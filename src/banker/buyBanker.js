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

const run = (availableMoney, priceData, lastBoughtTicks, sockets) => {
    const profiler = logger.startTimer()
    logger.debug('running buy banker')

    if (!checkEnoughMoney(availableMoney)) {
        logger.debug(`buy-signal: not enough money`)
        lastBoughtTicks++
    } else {
        if (checkBuySignal(priceData, lastBoughtTicks, sockets)) {
            const moneyToUse = calculateMoneyToUse(availableMoney)
            // const buyTrade = await buyOrder(moneyToUse)
            // db.get('orders')
            //     .push({
            //         id: buyTrade.order,
            //         timestamp: Date.now(),
            //         amount: buyTrade.amount,
            //         price: priceData[priceData.length - 1],
            //         lowLimit: config.SIGNALIZER.SELL.LOW_LIMIT,
            //         lowLimitHit: false,
            //         nextLimit: parseFloat(config.SIGNALIZER.SELL.LOW_LIMIT) + parseFloat(config.SIGNALIZER.SELL.NEXT_LIMIT)
            //     })
            //     .write()
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

const calculateMoneyToUse = (moneyAvailable) => {
    const moneyByPercentage = moneyAvailable * config.BANKER.BUY.BUY_MAX_MONEY_PERCENTAGE;

    if (moneyByPercentage < config.BANKER.BUY.BUY_MIN_MONEY_AMOUNT) {
        logger.info(`moneyByPercentage ${moneyByPercentage} ${config.CURRENCY_SYMBOL} (${config.BANKER.BUY.BUY_MAX_MONEY_PERCENTAGE}%) is lower than minMoneyAmount, using minMoneyAmount: ${config.BANKER.BUY.BUY_MIN_MONEY_AMOUNT}${config.CURRENCY_SYMBOL}`)
        return config.BANKER.BUY.BUY_MIN_MONEY_AMOUNT;
    }

    return moneyByPercentage;
}

const checkEnoughMoney = (moneyAvailable) => {
    return moneyAvailable >= config.BANKER.BUY.BUY_MIN_MONEY_AMOUNT
}

module.exports = {
    run,
}
