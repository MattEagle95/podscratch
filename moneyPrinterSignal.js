const moneyPrinterBuySignal = (needsTicksLow, needsTicksHigh, needsPercentage, needsMaxPercentage, priceData) => {
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

            if (currentState === 'fallend' && stateTicks === needsTicksLow) {
                stateLowTriggered = true;
            }
        }

        lastPrice = price;
    })

    return stateLowTriggered && (stateTicks >= needsTicksHigh) && (currentChangePercentage > needsPercentage) && (currentChangePercentage < needsMaxPercentage);
};

const moneyPrinterSellSignal = (needsTicksLow, needsTicksHigh, needsPercentage, needsMaxPercentage, priceData) => {
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

            if (currentState === 'fallend' && stateTicks === needsTicksLow) {
                stateLowTriggered = true;
            }
        }

        lastPrice = price;
    })

    return stateLowTriggered && (stateTicks >= needsTicksHigh) && (currentChangePercentage > needsPercentage) && (currentChangePercentage < needsMaxPercentage);
};

const mockPriceData = [
    100,
    95,
    90,
    87,
    85,
    100,
    120,
    150
];

console.log(moneyPrinterBuySignal(5, 2, 0.1, 0.2, mockPriceData));

module.exports = {
    moneyPrinterBuySignal,
    moneyPrinterSellSignal
};