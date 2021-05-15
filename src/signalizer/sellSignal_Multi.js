const config = require('../../config.json')
const logger = require('../logger')

// wenn UNTERSTES-LIMIT das erste mal überschritten wurde -> merke dir die daten
// ab jetzt werden alle weiteren preiseupdates folgend überprüft:
// -> wenn unterstes-limit unterschritten -> VERKAUFEN
// wenn NÄCHSTES-SAFE-LIMIT erreicht
// setze UNTERSTES-LIMIT auf NÄCHSTES-SAFE-LIMIT
// setze NÄCHSTES-SAFE-LIMIT auf NÄCHSTES-SAFE-LIMIT x 2

const checkSellSignalMulti = (priceToBeat, currentPrice, lowLimit, lowLimitHit, nextLimit) => {
    const prozentUnterschied =
        parseFloat(currentPrice) / parseFloat(priceToBeat)

    if (checkThrowItAwaySignal(prozentUnterschied)) {
        // SELL -> DONT LOSE MORE
        logger.info(`sell-signal: TROW AWAY! ${prozentUnterschied} %`)
        return {
            status: true,
            lowLimit: lowLimit,
            lowLimitHit: lowLimitHit,
            nextLimit: nextLimit
        }
    }

    if (prozentUnterschied < lowLimit) {
        if (lowLimitHit === false) {
            return {
                status: false,
                lowLimit: lowLimit,
                lowLimitHit: lowLimitHit,
                nextLimit: nextLimit
            }
        }

        if (lowLimitHit === true) {
            // SELL
            return {
                status: true,
                lowLimit: lowLimit,
                lowLimitHit: lowLimitHit,
                nextLimit: nextLimit
            }
        }
    }

    if (lowLimitHit) {
        if (prozentUnterschied > nextLimit) {
            lowLimitHit = nextLimit
            nexLimit = nextLimit + nextLimit
            return {
                status: false,
                lowLimit: lowLimit,
                lowLimitHit: lowLimitHit,
                nextLimit: nextLimit
            }
        }
    }

    return {
        status: false,
        lowLimit: lowLimit,
        lowLimitHit: lowLimitHit,
        nextLimit: nextLimit
    }
}



const checkThrowItAwaySignal = (prozentUnterschied) => {
    if (
        prozentUnterschied < config.SIGNALIZER.THROWITAWAY.MAX_LOSS_PERCENTAGE
    ) {
        return true
    }

    return false
}

module.exports = {
    checkSellSignalMulti,
}
