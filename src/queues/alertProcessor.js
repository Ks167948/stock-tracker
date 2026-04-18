const { Worker } = require('bullmq');
const Alert = require('../models/Alert');
const { connection } = require('./alertQueue');

// Simulated stock prices — in real Zerodha/Groww this would be
// a call to NSE API or a WebSocket feed
const getMockStockPrice = (symbol) => {
  const prices = {
    INFY:     1423.50,
    TCS:      3567.80,
    RELIANCE: 2891.20,
    HDFC:     1678.90,
    WIPRO:     456.30,
  };
  // Add small random movement to simulate live prices
  const base = prices[symbol] || 1000;
  const change = (Math.random() - 0.5) * 20;
  return parseFloat((base + change).toFixed(2));
};

const processAlertJob = async (job) => {
  const { symbol } = job.data;
  console.log(`⚙️  Processing job ${job.id} — checking alerts for ${symbol}`);

  // Get current price for this symbol
  const currentPrice = getMockStockPrice(symbol);
  console.log(`📈 ${symbol} current price: ₹${currentPrice}`);

  // Find all untriggered alerts for this symbol
  // Uses index: { symbol: 1, triggered: 1 } — fast lookup
  const alerts = await Alert.find({ symbol, triggered: false });

  if (alerts.length === 0) {
    console.log(`   No active alerts for ${symbol}`);
    return { symbol, checked: 0 };
  }

  let triggeredCount = 0;

  for (const alert of alerts) {
    const shouldTrigger =
      (alert.condition === 'ABOVE' && currentPrice >= alert.targetPrice) ||
      (alert.condition === 'BELOW' && currentPrice <= alert.targetPrice);

    if (shouldTrigger) {
      alert.triggered = true;
      alert.triggeredAt = new Date();
      await alert.save();

      triggeredCount++;

      // In production this would send email/SMS/push notification
      console.log(`🔔 ALERT TRIGGERED for user ${alert.userId}:`);
      console.log(`   ${symbol} is ₹${currentPrice}`);
      console.log(`   Condition: ${alert.condition} ₹${alert.targetPrice} ✅`);
    }
  }

  console.log(`   Checked ${alerts.length} alerts, triggered ${triggeredCount}`);
  return { symbol, checked: alerts.length, triggered: triggeredCount };
};

// Create the worker — this is what actually processes jobs
const alertWorker = new Worker('alert-checks', processAlertJob, {
  connection,
  concurrency: 5, // process 5 jobs simultaneously
});

// Worker event listeners
alertWorker.on('completed', (job, result) => {
  console.log(`✅ Job ${job.id} completed:`, result);
});

alertWorker.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err.message);
});

alertWorker.on('error', (err) => {
  console.error('Worker error:', err.message);
});

console.log('👷 Alert worker started');

module.exports = { alertWorker };