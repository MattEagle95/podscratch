(async function main() {
  const ccxt = require('ccxt')
  const logger = require('./logger');
  const { moneyPrinterBuySignal } = require('./moneyPrinterSignal');

  const UPDATE_INTERVAL_MS = 20000;
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

  const MIN_PRICE_DATA = NEEDS_TICKS_LOW + NEEDS_TICKS_HIGH;

  // money in the bank
  let BANK = 100;
  const NEEDS_MIN_TICKS_FOR_NEXT_BUY = 10;
  let LAST_BOUGHT_TICKS = NEEDS_MIN_TICKS_FOR_NEXT_BUY;

  const PRICE_DATA = [];

  const calculateMoneyToUse = () => {
    const moneyByPercentage = BANK * ORDER_MAX_MONEY_PERCENTAGE;

    if (moneyByPercentage < ORDER_MIN_MONEY_AMOUNT) {
      logger.info(`moneyByPercentage ${moneyByPercentage}${CURRENCY_SYMBOL} (${ORDER_MAX_MONEY_PERCENTAGE}%) is lower than minMoneyAmount, using minMoneyAmount: ${ORDER_MIN_MONEY_AMOUNT}${CURRENCY_SYMBOL}`)
      return ORDER_MIN_MONEY_AMOUNT;
    }

    return moneyByPercentage;
  }

  logger.info(`started (UPDATE: ${UPDATE_INTERVAL_MS}ms)`)

  const exchange = new ccxt.coinbasepro({
    'enableRateLimit': true,
  })

  try {
    const status = await exchange.fetchStatus(params = {})
    if (status.status !== 'ok') {
      throw new Error('api offline');
    }

    logger.info(`api online`)

    // if (exchange.has.fetchOHLCV) {
    //   let fetchedPriceData = await exchange.fetchOHLCV(COIN_CURRENCY, '1m');
    //   logger.info(`fetched price data (${fetchedPriceData.length} elements)`)
    //   fetchedPriceData = fetchedPriceData.slice(fetchedPriceData.length - MIN_PRICE_DATA, fetchedPriceData.length)
    //   logger.info(`last price data - ${COIN_CURRENCY} ${fetchedPriceData[fetchedPriceData.length - 1][4]}`)
    //   fetchedPriceData.forEach(priceData => {
    //     PRICE_DATA.push(priceData[4])
    //   });
    // }
  } catch (error) {
    logger.error(error);
  }

  setInterval(async () => {
    const updateProfiler = logger.startTimer();
    let tickerData = null;

    try {
      await exchange.loadMarkets()

      tickerData = await exchange.fetchTicker(COIN_CURRENCY)
      console.log(tickerData);
      PRICE_DATA.push(tickerData.bid);

      // MONEY-PRINTING-SIGNALIZER
      if (BANK < ORDER_MIN_MONEY_AMOUNT) {
        logger.info(`money-printing-signalizer: not enough money to buy`)
        LAST_BOUGHT_TICKS++;
      } else {
        if (PRICE_DATA.length >= MIN_PRICE_DATA) {
          if (LAST_BOUGHT_TICKS >= NEEDS_MIN_TICKS_FOR_NEXT_BUY) {
            if (moneyPrinterBuySignal(NEEDS_TICKS_LOW, NEEDS_TICKS_HIGH, NEEDS_PERCENTAGE, NEEDS_MAX_PERCENTAGE, PRICE_DATA)) {
              logger.info(`money-printing-signalizer: BOOOOOOM! BUY SIGNAL!`)
              buy();
              LAST_BOUGHT_TICKS = 0;
            }
          } else {
            logger.info(`money-printing-signalizer: last buy too recent`)
            LAST_BOUGHT_TICKS++;
          }
        } else {
          logger.info(`money-printing-signalizer: has not enough data. length: ${PRICE_DATA.length}, needed: ${MIN_PRICE_DATA}`)
          LAST_BOUGHT_TICKS++;

          if (PRICE_DATA.length === MIN_PRICE_DATA) {
            logger.info(`money-printing-signalizer: ready`)
          }
        }
      }
    } catch (error) {
      logger.error(error);
    }

    updateProfiler.done({ message: `update - ${COIN_CURRENCY} ${tickerData ? tickerData.bid : 'undefined'}` });
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