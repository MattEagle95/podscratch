const logger = require('../logger')
const config = require('../../config.json')

const buySignal = (priceData, SOCKETS) => {
    let lastPrice = 0
    let lastHighestPrice = 0
    let lastLowestPrice = 0

    let needsLowPercentageTriggered = false;
    let needsHighPercentageMin = false;
    let needsHighPercentageMax = false;

    let stateTicks = 0
    let currentState = 'steigend'

    priceData.forEach((priceDataElement) => {
        let price = priceDataElement.bid

        if (price > lastHighestPrice) {
            lastHighestPrice = price
            needsLowPercentageTriggered = false;
            lastLowestPrice = price
        }

        if (price < lastLowestPrice) {
            lastLowestPrice = price
        }

        const changePercentageLastPrice = -parseFloat(
            (parseFloat(lastPrice) - parseFloat(price)) /
            parseFloat(lastPrice)
        )
        const changePercentageLastHighestPrice = -parseFloat(
            (parseFloat(lastHighestPrice) - parseFloat(price)) /
            parseFloat(lastHighestPrice)
        )
        const changePercentageLastLowestPrice = -parseFloat(
            (parseFloat(lastLowestPrice) - parseFloat(price)) /
            parseFloat(lastLowestPrice)
        )

        if (lastPrice !== 0) {
            // STEIGEND
            if (changePercentageLastPrice >= 0) {
                if (currentState === 'steigend') {
                    // WAR VORHER SCHON STEIGEND

                } else {
                    // WAR VORHER FALLEND, JETZT STEIGEND
                    stateTicks = 0
                }

                // BUY BEDINGUNG
                currentState = 'steigend'
            }

            // FALLEND
            if (changePercentageLastPrice < 0) {
                if (currentState === 'fallend') {
                    // WAR VORHER SCHON FALLEND

                } else {
                    // WAR VORHER STEIGEND, JETZT FALLEND
                    stateTicks = 0
                }

                needsLowPercentageTriggered = changePercentageLastHighestPrice < config.SIGNALIZER.BUY.NEEDS_PERCENTAGE_LOW
                currentState = 'fallend'
            }

            needsHighPercentageMin = changePercentageLastLowestPrice > config.SIGNALIZER.BUY.NEEDS_PERCENTAGE_HIGH_MIN
            needsHighPercentageMax = changePercentageLastLowestPrice > config.SIGNALIZER.BUY.NEEDS_PERCENTAGE_HIGH_MAX
            if (needsHighPercentageMax && (currentState === 'fallend' || stateTicks > 1) ) {
                lastHighestPrice = price
                lastLowestPrice = price
            }

            stateTicks++;
        } else {
            lastHighestPrice = price
            lastLowestPrice = price
        }

        lastPrice = price
    })

    SOCKETS.forEach((socket) => {
        socket.emit('bugSignalUpdate', {
            lastPrice,
            lastHighestPrice,
            lastLowestPrice,
            needsLowPercentageTriggered,
            needsHighPercentageMin,
            needsHighPercentageMax,
            stateTicks,
            currentState
        })
    })

    return (
        needsLowPercentageTriggered &&
        needsHighPercentageMin &&
        !needsHighPercentageMax
    )
}

const checkBuySignal = (priceData, lastBoughtTicks, SOCKETS) => {
    if (priceData.length < config.SIGNALIZER.MIN_PRICE_DATA) {
        logger.info(`buy signal: not enough data`)
        return false
    }

    if (buySignal(priceData, SOCKETS)) {
        if (
            lastBoughtTicks >=
            config.SIGNALIZER.BUY.NEEDS_MIN_TICKS_FOR_NEXT_BUY
        ) {
            logger.info(`buy signal: BOOOOOOM! BUY SIGNAL!`)
            return true
        }

        logger.info(`buy signal: signal, but last buy too recent`)
        return false
    }

    return false
}

module.exports = {
    checkBuySignal,
}
