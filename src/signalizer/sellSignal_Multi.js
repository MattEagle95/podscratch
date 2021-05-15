const config = require('../../config.json')

// wenn UNTERSTES-LIMIT das erste mal überschritten wurde -> merke dir die daten
// ab jetzt werden alle weiteren preiseupdates folgend überprüft:
// -> wenn unterstes-limit unterschritten -> VERKAUFEN
// wenn NÄCHSTES-SAFE-LIMIT erreicht
// setze UNTERSTES-LIMIT auf NÄCHSTES-SAFE-LIMIT
// setze NÄCHSTES-SAFE-LIMIT auf NÄCHSTES-SAFE-LIMIT x 2

const checkSellSignalMulti = (priceToBeat, currentPrice) => {
    const prozentUnterschied =
        parseFloat(currentPrice) / parseFloat(priceToBeat)

    if (checkThrowItAwaySignal(prozentUnterschied)) {
        return true
    }

    return prozentUnterschied > config.SIGNALIZER.SELL.NEEDS_PERCENTAGE
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
