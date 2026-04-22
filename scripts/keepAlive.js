/*
 * Render cron keep-alive job.
 * Calls the deployed backend health endpoint on a schedule.
 */

const backendUrl = process.env.BACKEND_URL;

if (!backendUrl) {
  console.error('BACKEND_URL is required for keep-alive job');
  process.exit(1);
}

const normalizedBaseUrl = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;
const healthUrl = `${normalizedBaseUrl}/api/health`;

(async () => {
  try {
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: { 'User-Agent': 'GearGuard-Render-KeepAlive/1.0' }
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`Keep-alive failed: ${response.status} ${response.statusText} - ${body}`);
      process.exit(1);
    }

    console.log(`Keep-alive success: ${response.status} ${response.statusText} -> ${healthUrl}`);
    process.exit(0);
  } catch (error) {
    console.error(`Keep-alive error: ${error.message}`);
    process.exit(1);
  }
})();
