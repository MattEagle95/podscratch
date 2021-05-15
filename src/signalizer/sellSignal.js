const config = require('../../config.json')

// wenn UNTERSTES-LIMIT das erste mal überschritten wurde -> merke dir die daten
// ab jetzt werden alle weiteren preiseupdates folgend überprüft:
// -> wenn unterstes-limit unterschritten -> VERKAUFEN
// wenn NÄCHSTES-SAFE-LIMIT erreicht
// setze UNTERSTES-LIMIT auf NÄCHSTES-SAFE-LIMIT
// setze NÄCHSTES-SAFE-LIMIT auf NÄCHSTES-SAFE-LIMIT x 2

const checkSellSignal = (priceToBeat, currentPrice) => {
    const prozentUnterschied =
        parseFloat(currentPrice) / parseFloat(priceToBeat)
        console.log(`${prozentUnterschied - 1} % / ${config.SIGNALIZER.SELL.NEEDS_PERCENTAGE} %`)

    return prozentUnterschied > config.SIGNALIZER.SELL.NEEDS_PERCENTAGE
}

module.exports = {
    checkSellSignal,
}
