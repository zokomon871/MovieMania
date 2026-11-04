// Pre-warms all Next.js routes in dev mode so you don't wait for on-demand compilation
const ROUTES = ['/', '/movies', '/series', '/favorites', '/api/channels', '/api/categories', '/api/countries', '/api/series/search'];

async function waitForServer(url = 'http://localhost:3000', timeout = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 200 || res.status === 404) return true;
    } catch {
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  return false;
}

async function warm() {
  console.log('🔥 Waiting for Next.js server to start on port 3000...');
  const ready = await waitForServer();
  if (!ready) {
    console.log('⚠️ Could not connect to server.');
    return;
  }

  console.log('⚡ Pre-compiling all pages ahead of time...');
  await Promise.allSettled(
    ROUTES.map(async (route) => {
      try {
        await fetch(`http://localhost:3000${route}`);
        console.log(`  ✓ Pre-compiled ${route}`);
      } catch {}
    })
  );
  console.log('🚀 All pages pre-compiled! Navigating will now be instantaneous.');
}

warm();

