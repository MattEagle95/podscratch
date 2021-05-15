const logger = require('./logger');
const config = require('../config.json');

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

const buy = (moneyAvailable) => {
    const profiler = logger.startTimer();
    const moneyToUse = calculateMoneyToUse();
    const coinAmount = 0;

    logger.info(`creating limit buy order, buying ${coinAmount} coins for ${moneyToUse} ${CURRENCY_SYMBOL}`);

    // await exchange.createLimitBuyOrder(`${COIN_CURRENCY}`, coinAmount, moneyToUse)

    profiler.done({ message: 'order created' })
}

module.exports = {
    checkEnoughMoney,
    buy
}