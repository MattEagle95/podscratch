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


// {
//     id: '765c150e-b0f0-4cf2-9697-adfab01e03a9',  
//     clientOrderId: undefined,
//     info: {
//       id: '765c150e-b0f0-4cf2-9697-adfab01e03a9',
//       size: '0.00012533',
//       product_id: 'BTC-EUR',
//       side: 'buy',
//       stp: 'dc',
//       funds: '99.63024387',
//       type: 'market',
//       post_only: false,
//       created_at: '2021-05-16T14:54:17.337007Z',
//       fill_fees: '0',
//       filled_size: '0',
//       executed_value: '0',
//       status: 'pending',
//       settled: false
//     },
//     timestamp: 1621176857337,
//     datetime: '2021-05-16T14:54:17.337Z',
//     lastTradeTimestamp: undefined,
//     status: 'open',
//     symbol: 'BTC/EUR',
//     type: 'market',
//     timeInForce: undefined,
//     postOnly: false,
//     side: 'buy',
//     price: undefined,
//     stopPrice: undefined,
//     cost: 0,
//     amount: 0.00012533,
//     filled: 0,
//     remaining: 0.00012533,
//     fee: { cost: 0, currency: 'EUR', rate: undefined },
//     average: undefined,
//     trades: undefined,
//     fees: [ { cost: 0, currency: 'EUR', rate: undefined } ]
//   }
//   [
//     {
//       id: '42720830',
//       order: '1c1d1f35-1626-428b-9803-264e5e9b007f',
//       info: {
//         created_at: '2021-05-15T11:14:25.931Z',
//         trade_id: '42720830',
//         product_id: 'BTC-EUR',
//         order_id: '1c1d1f35-1626-428b-9803-264e5e9b007f',
//         user_id: '6012f7959c85980710b41e27',
//         profile_id: '194d0b6e-0a66-46f7-9f53-c5c94718cdc2',
//         liquidity: 'T',
//         price: '40013.22000000',
//         size: '0.00012497',
//         fee: '0.0250022605170000',
//         side: 'buy',
//         settled: true,
//         usd_volume: '6.0820911977000000'
//       },
//       timestamp: 1621077265931,
//       datetime: '2021-05-15T11:14:25.931Z',
//       symbol: 'BTC/EUR',
//       type: undefined,
//       takerOrMaker: 'taker',
//       side: 'buy',
//       price: 40013.22,
//       amount: 0.00012497,
//       fee: { cost: 0.025002260517, currency: 'EUR', rate: 0.005 },
//       cost: 5.0004521034
//     },
//     {
//       id: '42733747',
//       order: '9ae713ca-08f9-432e-bf16-cf4d2972dc9d',
//       info: {
//         created_at: '2021-05-15T14:56:25.074Z',
//         trade_id: '42733747',
//         product_id: 'BTC-EUR',
//         order_id: '9ae713ca-08f9-432e-bf16-cf4d2972dc9d',
//         user_id: '6012f7959c85980710b41e27',
//         profile_id: '194d0b6e-0a66-46f7-9f53-c5c94718cdc2',
//         liquidity: 'T',
//         price: '40643.72000000',
//         size: '0.00012497',
//         fee: '0.0253962284420000',
//         side: 'sell',
//         settled: true,
//         usd_volume: '6.1778257159000000'
//       },
//       timestamp: 1621090585074,
//       datetime: '2021-05-15T14:56:25.074Z',
//       symbol: 'BTC/EUR',
//       type: undefined,
//       takerOrMaker: 'taker',
//       side: 'sell',
//       price: 40643.72,
//       amount: 0.00012497,
//       fee: { cost: 0.025396228442, currency: 'EUR', rate: 0.005 },
//       cost: 5.0792456884
//     },
//     {
//       id: '42810766',
//       order: '765c150e-b0f0-4cf2-9697-adfab01e03a9',
//       info: {
//         created_at: '2021-05-16T14:54:17.346Z',
//         trade_id: '42810766',
//         product_id: 'BTC-EUR',
//         order_id: '765c150e-b0f0-4cf2-9697-adfab01e03a9',
//         user_id: '6012f7959c85980710b41e27',
//         profile_id: '194d0b6e-0a66-46f7-9f53-c5c94718cdc2',
//         liquidity: 'T',
//         price: '39899.41000000',
//         size: '0.00012533',
//         fee: '0.0250029652765000',
//         side: 'buy',
//         settled: true,
//         usd_volume: '6.0655421181000000'
//       },
//       timestamp: 1621176857346,
//       datetime: '2021-05-16T14:54:17.346Z',
//       symbol: 'BTC/EUR',
//       type: undefined,
//       takerOrMaker: 'taker',
//       side: 'buy',
//       price: 39899.41,
//       amount: 0.00012533,
//       fee: { cost: 0.0250029652765, currency: 'EUR', rate: 0.005 },
//       cost: 5.0005930553
//     }
//   ]