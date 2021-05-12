const logger = require('./logger');
const config = require('../config.json');

const buySignal = (priceData) => {
    let lastPrice = 0;
    let currentChangePercentage = 0;
    let currentState = 'steigend';
    let stateLowTriggered = false;
    let stateTicks = 0;

    priceData.forEach(price => {
        if (lastPrice !== 0) {
            const changePercentage = -((lastPrice - price) / lastPrice);

            if (changePercentage > 0 && currentState === 'steigend') {
                currentChangePercentage = parseFloat(currentChangePercentage) + parseFloat(changePercentage)
                stateTicks++;
            } else if (changePercentage > 0) {
                currentState = 'steigend'
                currentChangePercentage = changePercentage;
                stateTicks = 1;
            } else if (changePercentage < 0 && currentState === 'fallend') {
                currentChangePercentage = parseFloat(currentChangePercentage) + parseFloat(changePercentage)
                stateTicks++;
            } else if (changePercentage < 0) {
                currentState = 'fallend'
                currentChangePercentage = changePercentage;
                stateTicks = 1;
                stateLowTriggered = false;
            }

            if (currentState === 'fallend' && stateTicks === config.SIGNALIZER.BUY.NEEDS_TICKS_LOW) {
                stateLowTriggered = true;
            }
        }

        lastPrice = price;
    })

    return stateLowTriggered && (stateTicks >= config.SIGNALIZER.BUY.NEEDS_TICKS_HIGH) && (currentChangePercentage > config.SIGNALIZER.BUY.NEEDS_PERCENTAGE) && (currentChangePercentage < config.SIGNALIZER.BUY.NEEDS_MAX_PERCENTAGE);
}

const checkBuySignal = (priceData, lastBoughtTicks) => {
    if (priceData.length >= config.SIGNALIZER.MIN_PRICE_DATA) {
        logger.info(`signalizer: not enough data`)
        return false;
    }

    if (buySignal(priceData)) {
        if (lastBoughtTicks >= config.SIGNALIZER.BUY.NEEDS_MIN_TICKS_FOR_NEXT_BUY) {
            logger.info(`signalizer: BOOOOOOM! BUY SIGNAL!`)
            return true;
        }

        logger.info(`signalizer: buy signal, but last buy too recent`)
        return false;
    }

    return false;
};

module.exports = {
    checkBuySignal
}