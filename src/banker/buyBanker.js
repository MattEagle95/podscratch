const logger = require('../logger')
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const { checkSellSignalMulti } = require('../signalizer/sellSignal_Multi')
const { checkBuySignal } = require('../signalizer/buySignal')

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

const run = (availableMoney, priceData, lastBoughtTicks, sockets, buyEvents) => {
    const profiler = logger.startTimer()
    logger.debug('running buy banker')

    if (!checkEnoughMoney(availableMoney)) {
        logger.debug(`buy-signal: not enough money`)
        lastBoughtTicks++
    } else {
        if (checkBuySignal(priceData, lastBoughtTicks, sockets)) {
            // WIRKLICES BUY
            buyEvents.push({
                timestamp: Date.now(),
                coin_price: priceData[priceData.length - 1],
            })
            lastBoughtTicks = 0
            logger.info('buy-signal: I WOULD HAVE BOUGHT THAT!')
        } else {
            lastBoughtTicks++
        }
    }

    profiler.done({ message: 'buy banker done' })

    return {
        lastBoughtTicks,
        buyEvents
    }
}

const buyOrder = (amount) => {
    try {
        const buyOrderData = await exchange.createMarketBuyOrder(config.COIN_CURRENCY, amount)

        const trades = await exchange.fetchMyTrades(config.COIN_CURRENCY)
        const buyTrade = trades.find((trade) => trade.order === buyOrderData.id)

        logger.info(
            `${buyTrade.order} - ${buyTrade.cost} ${buyTrade.COIN} BOUGHT FOR ${buyTrade.amount} ${config.CURRENCY} AT PRICE ${buyTrade.price} ${config.CURRENCY}`
        )
    } catch (err) {
        console.error(err)
    }
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
