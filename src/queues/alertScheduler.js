const { alertQueue } = require('./alertQueue');

// Symbols to check — in production this would be
// all symbols that have at least one active alert
const WATCHED_SYMBOLS = ['INFY', 'TCS', 'RELIANCE', 'HDFC', 'WIPRO'];

const scheduleAlertChecks = async () => {
  console.log('⏰ Scheduling alert checks...');

  for (const symbol of WATCHED_SYMBOLS) {
    await alertQueue.add(
      `check-${symbol}`,        // job name
      { symbol },               // job data — passed to processor
      { jobId: `check-${symbol}-${Date.now()}` }
    );
  }

  console.log(`📬 Added ${WATCHED_SYMBOLS.length} jobs to queue`);
};

// Run immediately on startup
scheduleAlertChecks();

// Then run every 30 seconds
setInterval(scheduleAlertChecks, 30000);

console.log('🕐 Alert scheduler started — checking every 30 seconds');

module.exports = { scheduleAlertChecks };