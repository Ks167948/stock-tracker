const BASE_URL = 'http://localhost:3000';

async function runTests() {

  // Step 1 — Create user
  console.log('\n--- Step 1: Creating user ---');
  const userRes = await fetch(`${BASE_URL}/api/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Kishor', email: 'kishor2@test.com' }),
  });
  const user = await userRes.json();
  console.log('User created:', user.data._id);
  const userId = user.data._id;

  // Step 2 — Buy stock
  console.log('\n--- Step 2: Buying INFY ---');
  await fetch(`${BASE_URL}/api/portfolio/buy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, symbol: 'INFY', quantity: 10, price: 1500 }),
  });
  console.log('Bought 10 shares of INFY at ₹1500');

  // Step 3 — Create alert BELOW current price so it triggers immediately
  // INFY mock price is ~₹1423 so setting alert BELOW ₹1500 will trigger
  console.log('\n--- Step 3: Creating alert ---');
  const alertRes = await fetch(`${BASE_URL}/api/alerts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      symbol: 'INFY',
      targetPrice: 1500,
      condition: 'BELOW',
    }),
  });
  const alert = await alertRes.json();
  console.log(JSON.stringify(alert, null, 2));

  // Step 4 — Wait 3 seconds for worker to process
  console.log('\n--- Step 4: Waiting for worker to process alert... ---');
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Step 5 — Check alert history (triggered alerts)
  console.log('\n--- Step 5: Checking alert history ---');
  const historyRes = await fetch(`${BASE_URL}/api/alerts/${userId}/history`);
  const history = await historyRes.json();
  console.log(JSON.stringify(history, null, 2));

  // Step 6 — Check active alerts (should be empty now)
  console.log('\n--- Step 6: Checking active alerts (should be 0) ---');
  const activeRes = await fetch(`${BASE_URL}/api/alerts/${userId}`);
  const active = await activeRes.json();
  console.log('Active alerts remaining:', active.count);

  // Step 7 — Get portfolio
  console.log('\n--- Step 7: Get portfolio ---');
  const p1 = await fetch(`${BASE_URL}/api/portfolio/${userId}`);
  console.log(JSON.stringify(await p1.json(), null, 2));

  // Step 8 — Sell stock
  console.log('\n--- Step 8: Selling 5 shares ---');
  const sellRes = await fetch(`${BASE_URL}/api/portfolio/sell`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, symbol: 'INFY', quantity: 5, price: 1423 }),
  });
  console.log(JSON.stringify(await sellRes.json(), null, 2));

  // Step 9 — Get transactions
  console.log('\n--- Step 9: Transaction history ---');
  const txRes = await fetch(`${BASE_URL}/api/portfolio/${userId}/transactions`);
  console.log(JSON.stringify(await txRes.json(), null, 2));

}

runTests().catch(console.error);