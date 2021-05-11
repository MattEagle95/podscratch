(async function main() {
  const ccxt = require('ccxt')
  const logger = require('./logger');
  const moneyPrinterSignal = require('./moneyPrinterSignal');

  const UPDATE_INTERVAL_MS = 10000;
  const MIN_PRICE_DATA = 60;
  const COIN = 'BTC';
  const CURRENCY = 'USD';
  const COIN_CURRENCY = `${COIN}/${CURRENCY}`;
  const CURRENCY_SYMBOL = '€';
  const ORDER_MIN_MONEY_AMOUNT = 20;
  const ORDER_MAX_MONEY_PERCENTAGE = 0.20;

  // ALGO
  const NEEDS_TICKS_LOW = 5;
  const NEEDS_TICKS_HIGH = 2;
  const NEEDS_PERCENTAGE = 0.1;
  const NEEDS_MAX_PERCENTAGE = 0.2;

  // money in the bank
  let BANK = 100;
  let LAST_BOUGHT = 0;

  const PRICE_DATA = [];

  const calculateMoneyToUse = () => {
    const moneyByPercentage = BANK * ORDER_MAX_MONEY_PERCENTAGE;

    if (moneyByPercentage < ORDER_MIN_MONEY_AMOUNT) {
      logger.info(`moneyByPercentage ${moneyByPercentage}${CURRENCY_SYMBOL} (${ORDER_MAX_MONEY_PERCENTAGE}%) is lower than minMoneyAmount, using minMoneyAmount: ${ORDER_MIN_MONEY_AMOUNT}${CURRENCY_SYMBOL}`)
      return ORDER_MIN_MONEY_AMOUNT;
    }

    return moneyByPercentage;
  }

  logger.info(`started`)

  const exchange = new ccxt.coinbasepro()

  try {
    const status = await exchange.fetchStatus(params = {})
    if (status.status !== 'ok') {
      throw new Error('api offline');
    }

    logger.info(`api online`)
  } catch (error) {
    logger.error(error);
  }

  setInterval(async () => {
    const updateProfiler = logger.startTimer();
    logger.info(`update started`)

    try {
      const marketUpdateProfiler = logger.startTimer();
      await exchange.loadMarkets()
      marketUpdateProfiler.done({ message: 'markets loaded' })




      const signalProfiler = logger.startTimer();

      const tickerData = await exchange.fetchTicker(COIN_CURRENCY)
      logger.info(`fetched ticker ${COIN_CURRENCY}, bid: ${tickerData.bid}`)
      PRICE_DATA.push(tickerData.bid);

      // MONEY-PRINTING-SIGNALIZER
      logger.info(`starting money-printing-signalizer`)
      if (PRICE_DATA.length >= MIN_PRICE_DATA) {
        if (moneyPrinterSignal(NEEDS_TICKS_LOW, NEEDS_TICKS_HIGH, NEEDS_PERCENTAGE, NEEDS_MAX_PERCENTAGE, PRICE_DATA)) {
          logger.info(`BOOOOOOM! BUY SIGNAL!`)
          buy();
        }
      } else {
        logger.info(`money-printing-signalizer has not enough data. length: ${PRICE_DATA.length}, needed: ${MIN_PRICE_DATA}`)
      }








      signalProfiler.done({ message: 'fetch finished' })
    } catch (error) {
      logger.error(error);
    }

    updateProfiler.done({ message: 'update finished' });
  }, UPDATE_INTERVAL_MS);

  // exchange.apiKey = process.env.COINBASE_API_KEY
  // exchange.secret = process.env.COINBASE_API_SECRET
  // console.log (exchange.requiredCredentials)
  // exchange.checkRequiredCredentials()
  // console.log(exchange.fetchBalance (params = {}))

  // let orderbook = await exchange.fetchOrderBook(`${COIN}/${CURRENCY}`)
  // let bid = orderbook.bids.length ? orderbook.bids[0][0] : undefined
  // let ask = orderbook.asks.length ? orderbook.asks[0][0] : undefined
  // let spread = (bid && ask) ? ask - bid : undefined

  // WENN GENUG € DA IST
  // KAUF-SIGNAL
  // KAUF EINE BESTIMMTE ANZAHL (€)

  // WENN ASSET DA IST
  // SELL-SIGNAL
  // VERKAUF DAS ASSET

  // OH-SHIT-SIGNAL
  // VERKAUF DAS ASSET

  const buy = () => {
    const profiler = logger.startTimer();
    const moneyToUse = calculateMoneyToUse();
    const coinAmount = 0;

    logger.info(`creating limit buy order, buying ${coinAmount} coins for ${moneyToUse}${CURRENCY_SYMBOL}`);

    // await exchange.createLimitBuyOrder(`${COIN_CURRENCY}`, coinAmount, moneyToUse)

    profiler.done({ message: 'order created' })
  }
})()