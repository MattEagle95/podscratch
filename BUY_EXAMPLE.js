;(async function main() {
    const ccxt = require('ccxt')

    const exchange = new ccxt.coinbasepro({
        enableRateLimit: true,
        apiKey: '9c5a2c58ae3113c9c6753ea5b0d62ed3',
        secret: 'hANRIF1mv4Wm7ujYc/YIAcFVxacQ1iNTM7aXnnwOAVwJ80YK0EzWV7WOf7mPVm3+iH8vFSFnWmxf0xgVDX7Ywg==',
        password: 'qg37d3bm4vp',
    })

    await exchange.loadMarkets()

    const euroToUse = 5

    const tickerData = await exchange.fetchTicker('BTC/EUR')
    const exchangeRate = tickerData.bid

    const amountToBuy = (euroToUse / exchangeRate).toFixed(8)
    console.log('euro: ' + euroToUse + ' €')
    console.log('exchangeRate: ' + exchangeRate + ' €')
    console.log('amountToBuy: ' + amountToBuy + ' BTC')

    // try {
    //     console.log(await exchange.createMarketBuyOrder('BTC/EUR', amountToBuy))

    //     console.log(await exchange.fetchMyTrades('BTC/EUR'))
    // } catch (err) {
    //     console.error(err)
    // }
})()
