const logger = require('../logger')
const config = require('../../config.json')

// wenn es um "GEBÜHR" fällt => kauf aufjedenfall beim nächsten hoch

const buySignal = (priceData, SOCKETS) => {
    let lastPrice = 0
    let currentChangePercentage = 0
    let currentState = 'steigend'
    let stateLowTriggered = false
    let stateTicks = 0

    // um kleine schwankungen in einem anstieg zu kompensieren
    let ticksLowAfterStateLowTriggered = 0
    let startPriceOfRising = 0
    let lastTicksHigh = 0

    priceData.forEach((price) => {
        if (lastPrice !== 0) {
            const changePercentage = -parseFloat(
                (parseFloat(lastPrice) - parseFloat(price)) /
                    parseFloat(lastPrice)
            )

            if (changePercentage > 0 && currentState === 'steigend') {
                currentChangePercentage =
                    parseFloat(currentChangePercentage) +
                    parseFloat(changePercentage)
                stateTicks++
                lastTicksHigh = stateTicks
                ticksLowAfterStateLowTriggered = 0
            } else if (changePercentage > 0) {
                currentState = 'steigend'
                currentChangePercentage = changePercentage
                startPriceOfRising = lastPrice

                if (ticksLowAfterStateLowTriggered === 1) {
                    stateTicks = lastTicksHigh + 1
                    ticksLowAfterStateLowTriggered = 0
                } else {
                    stateTicks++
                }

                lastTicksHigh = stateTicks
            } else if (changePercentage < 0 && currentState === 'fallend') {
                currentChangePercentage =
                    parseFloat(currentChangePercentage) +
                    parseFloat(changePercentage)
                stateTicks++

                if (ticksLowAfterStateLowTriggered === 1) {
                    ticksLowAfterStateLowTriggered = 0
                    stateLowTriggered = false
                }
            } else if (changePercentage < 0) {
                currentState = 'fallend'
                currentChangePercentage = changePercentage
                stateTicks = 1

                if (
                    stateLowTriggered &&
                    ticksLowAfterStateLowTriggered === 0 &&
                    currentChangePercentage >
                        config.SIGNALIZER.BUY.CAN_HAVE_LOW_PERCENTAGE_BETWEEN
                ) {
                    ticksLowAfterStateLowTriggered++
                } else {
                    ticksLowAfterStateLowTriggered = 0
                    stateLowTriggered = false
                }
            }

            if (
                currentState === 'fallend' &&
                stateTicks === config.SIGNALIZER.BUY.NEEDS_TICKS_LOW
            ) {
                stateLowTriggered = true
                logger.info('buy signal: state low triggered')
            }
        }

        lastPrice = price
    })

    SOCKETS.forEach((socket) => {
        socket.emit('bugSignalUpdate', {
            stateLowTriggered: stateLowTriggered,
            needsTicksHighTriggered:
                stateLowTriggered &&
                currentState === 'steigend' &&
                stateTicks >= config.SIGNALIZER.BUY.NEEDS_TICKS_HIGH,
            needsPercentageTriggered:
                stateLowTriggered &&
                currentState === 'steigend' &&
                currentChangePercentage >
                    config.SIGNALIZER.BUY.NEEDS_PERCENTAGE,
            currentState: currentState,
            stateTicks: stateTicks,
            currentChangePercentage: currentChangePercentage.toFixed(4),
            startPriceOfRising: startPriceOfRising,
            ticksLowAfterStateLowTriggered: ticksLowAfterStateLowTriggered,
        })
    })

    logger.info(
        `${currentState} seit ${stateTicks} ticks, change: ${currentChangePercentage.toFixed(
            4
        )}%`
    )

    return (
        stateLowTriggered &&
        stateTicks >= config.SIGNALIZER.BUY.NEEDS_TICKS_HIGH &&
        currentChangePercentage > config.SIGNALIZER.BUY.NEEDS_PERCENTAGE &&
        currentChangePercentage < config.SIGNALIZER.BUY.NEEDS_MAX_PERCENTAGE
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
