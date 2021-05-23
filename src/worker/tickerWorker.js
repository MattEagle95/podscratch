const logger = require('../logger')
const config = require('../../config.json')
const CoinbasePro = require('coinbase-pro');

const fetchTickerData = (eventEmitter) => {
    const tickerData = [];
    const tickerArr = []
    config.TICKER.forEach(ticker => {
        tickerData.push({
            symbol: ticker.symbol,
            coin: ticker.coin,
            currency: ticker.currency,
            bid: 0,
            ask: 0,
            volume24h: 0
        })
        tickerArr.push(ticker.coin + '-' + ticker.currency)
    });

    const websocket = new CoinbasePro.WebsocketClient(
        tickerArr,
        'wss://ws-feed.pro.coinbase.com',
        {
            key: process.env.COINBASE_API_KEY,
            secret: process.env.COINBASE_API_SECRET,
            passphrase: process.env.COINBASE_API_PASSPHRASE,
        },
        { channels: ['ticker'] }
    );

    websocket.on('open', data => {
        logger.info('websocket connection opened')
    });

    websocket.on('message', data => {
        if (data.type !== 'ticker') {
            return;
        }

        const foundTicker = tickerData.find(ticker => (ticker.coin + '-' + ticker.currency) === data.product_id)
        if (foundTicker) {
            foundTicker.bid = data.best_bid;
            foundTicker.ask = data.best_ask;
            foundTicker.volume24h = data.volume_24h;
        }
    });

    websocket.on('error', err => {
        logger.error('websocket connection error')
        logger.error(err)
    });
    websocket.on('close', () => {
        logger.info('websocket connection closed')
    });

    setInterval(() => {
        eventEmitter.emit('ticker', tickerData.map(x => { return { ...x, timestamp: new Date() } }))
    }, config.TICKER_UPDATE_INTERVAL_MS);
}

module.exports = {
    fetchTickerData
}