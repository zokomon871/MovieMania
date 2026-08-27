const cron = require('node-cron');
const { collectAndSyncData } = require('./services/dataCollector');

function startCronJobs() {
  console.log('[Cron] Initializing scheduled tasks...');
  
  // Run every 6 hours (0 */6 * * *)
  cron.schedule('0 */6 * * *', async () => {
    console.log('[Cron] Running scheduled data collection...');
    await collectAndSyncData();
  });

  console.log('[Cron] Scheduled tasks initialized (runs every 6 hours).');
}

module.exports = {
  startCronJobs
};
