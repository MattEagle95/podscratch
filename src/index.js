(async function main() {
  const ccxt = require('ccxt')
  const logger = require('./logger');
  const config = require('../config');
  const { checkEnoughMoney } = require('./banker');
  const { checkBuySignal } = require('./signalizer');

  const PRICE_DATA = [];
  let MONEY_AVAILABLE = 100;
  let LAST_BOUGHT_TICKS = config.SIGNALIZER.BUY.NEEDS_MIN_TICKS_FOR_NEXT_BUY;

  logger.info(`moneyprinter started`)

  const exchange = new ccxt.coinbasepro({
    'enableRateLimit': true,
    'apiKey': process.env.COINBASE_API_KEY,
    'secret': process.env.COINBASE_API_SECRET,
    'password': process.env.COINBASE_API_PASSPHRASE
  })

  try {
    exchange.checkRequiredCredentials();
    const status = await exchange.fetchStatus(params = {})
    if (status.status !== 'ok') {
      throw new Error('api offline');
    }

    logger.info('api online')
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }

  logger.info(`update interval: ${config.UPDATE.INTERVAL_MS}ms`)

  setInterval(async () => {
    const updateProfiler = logger.startTimer();
    let tickerData = null;
    let addToMsg = '';

    try {
      await exchange.loadMarkets()

      tickerData = await exchange.fetchTicker(config.COIN_CURRENCY)
      PRICE_DATA.push(tickerData.bid);

      if (!checkEnoughMoney(MONEY_AVAILABLE)) {
        addToMsg += `skipping buy-signalizer (not enough money)`;
        LAST_BOUGHT_TICKS++;
      } else {
        if (checkBuySignal(PRICE_DATA, LAST_BOUGHT_TICKS)) {
          LAST_BOUGHT_TICKS = 0;
        } else {
          LAST_BOUGHT_TICKS++;
        }
      }
    } catch (error) {
      logger.error(error);
    }

    updateProfiler.done({ message: `update - ${config.COIN_CURRENCY} ${tickerData ? tickerData.bid : 'undefined'} - ${addToMsg}` });
  }, config.UPDATE.INTERVAL_MS);
})()